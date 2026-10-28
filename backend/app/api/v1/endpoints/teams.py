import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
import numpy as np
import pandas as pd

from backend.app.core.config import COMPOUND_COLORS, TEAM_COLORS
from backend.app.schemas.filter import ConstructorAnalysisRequest
from backend.app.schemas.analysis import (
    ConstructorAnalysisResponse,
    LapScatterPoint,
    PaceTimelinePoint,
    StintSummary,
    CompoundMetric,
    StrategicDiagnostic,
)
from backend.app.services.cleaning import cleaner
from backend.app.services.degradation import degradation_engine
from backend.app.services.fastf1_client import f1_client
from backend.app.services.normalizer import normalizer

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/constructor", response_model=ConstructorAnalysisResponse, summary="Analyze constructor tyre degradation")
def analyze_constructor(req: ConstructorAnalysisRequest):
    """
    Detailed constructor-level tyre degradation analysis:
    - Team-level wear slopes (averaging both drivers)
    - Compound-by-compound degradation comparisons
    - Head-to-head comparison against rival constructor teams
    - Strategic Diagnostic ("What Makes Other Teams' Tyres Last Longer?")
    """
    session_info = f1_client.get_session_info(req.session_key) or {}
    circuit_name = session_info.get("circuit_short_name", "")
    country_name = session_info.get("country_name", "")

    raw_laps = f1_client.get_laps(req.session_key)
    if raw_laps.empty:
        raise HTTPException(status_code=404, detail="No lap data available for this session")

    stints = f1_client.get_stints(req.session_key)
    race_control = f1_client.get_race_control(req.session_key)
    intervals = f1_client.get_intervals(req.session_key)
    drivers = f1_client.get_drivers(req.session_key)

    driver_map = {d.get("driver_number"): d for d in drivers}

    # Clean & normalize
    cleaned_laps = cleaner.clean_session_laps(
        raw_laps, stints, race_control, intervals, exclude_traffic=req.filter_traffic
    )
    normalized_laps = normalizer.normalize_lap_times(
        cleaned_laps,
        fuel_factor=req.fuel_factor,
        circuit_name=circuit_name,
        country_name=country_name,
        track_evolution_factor=req.track_evolution_factor,
        apply_correction=req.apply_fuel_correction,
    )

    # Attach team name to normalized laps
    team_by_num = {d.get("driver_number"): d.get("team_name", "Unknown") for d in drivers}
    code_by_num = {d.get("driver_number"): d.get("name_acronym", f"#{d.get('driver_number')}") for d in drivers}
    normalized_laps["team_name"] = normalized_laps["driver_number"].map(team_by_num)
    normalized_laps["driver_code"] = normalized_laps["driver_number"].map(code_by_num)

    # Filter target team
    team_drivers = [d for d in drivers if d.get("team_name") == req.team_name]
    team_dnums = [d.get("driver_number") for d in team_drivers]

    t_laps = normalized_laps[normalized_laps["team_name"] == req.team_name].copy()
    if t_laps.empty:
        raise HTTPException(status_code=404, detail=f"No laps found for team '{req.team_name}'")

    if req.compounds and len(req.compounds) > 0:
        filter_compounds = [c.upper() for c in req.compounds]
        t_laps_filtered = t_laps[t_laps["compound"].isin(filter_compounds)].copy()
    else:
        t_laps_filtered = t_laps

    # Team compound metrics (aggregating both drivers)
    compound_metrics_raw = degradation_engine.analyze_driver_compounds(t_laps_filtered)
    compound_metrics = {k: CompoundMetric(**v) for k, v in compound_metrics_raw.items()}

    # Team stints
    stint_metrics = degradation_engine.analyze_driver_stints(t_laps_filtered)

    # Team color
    team_color = TEAM_COLORS.get(req.team_name, "#3B82F6")
    if team_drivers and team_drivers[0].get("team_colour"):
        team_color = f"#{team_drivers[0]['team_colour']}"

    # Scatter points for team
    scatter_points: List[LapScatterPoint] = []
    for _, row in t_laps.iterrows():
        raw_time = row.get("lap_duration")
        corr_time = row.get("lap_duration_corrected")
        tyre_age = row.get("tyre_age")
        if pd.isna(raw_time) or pd.isna(tyre_age):
            continue

        scatter_points.append(LapScatterPoint(
            lap_number=int(row["lap_number"]),
            tyre_age=float(tyre_age),
            raw_lap_time=round(float(raw_time), 3),
            corrected_lap_time=round(float(corr_time), 3) if pd.notna(corr_time) else round(float(raw_time), 3),
            stint_number=int(row.get("stint_number", 1)),
            compound=str(row.get("compound", "UNKNOWN")),
            compound_color=COMPOUND_COLORS.get(str(row.get("compound", "UNKNOWN")), "#9CA3AF"),
            driver_number=int(row["driver_number"]),
            driver_code=str(row.get("driver_code", "")),
            team_name=req.team_name,
            is_representative=bool(row.get("is_representative", False)),
            is_dirty_air=bool(row.get("is_dirty_air", False)),
            interval=round(float(row["interval_to_car_ahead"]), 3) if pd.notna(row.get("interval_to_car_ahead")) else None,
        ))

    # Pace timeline
    pace_timeline: List[PaceTimelinePoint] = []
    for _, row in t_laps.sort_values("lap_number").iterrows():
        raw_time = row.get("lap_duration")
        corr_time = row.get("lap_duration_corrected")
        tyre_age = row.get("tyre_age", 0)
        pace_timeline.append(PaceTimelinePoint(
            lap_number=int(row["lap_number"]),
            raw_lap_time=round(float(raw_time), 3) if pd.notna(raw_time) else None,
            corrected_lap_time=round(float(corr_time), 3) if pd.notna(corr_time) else None,
            driver_code=str(row.get("driver_code", "")),
            team_name=req.team_name,
            compound=str(row.get("compound", "UNKNOWN")),
            stint_number=int(row.get("stint_number", 1)) if pd.notna(row.get("stint_number")) else 1,
            tyre_age=float(tyre_age) if pd.notna(tyre_age) else 0.0,
            is_pit_stop=bool(row.get("is_pit_in_lap", False) or row.get("is_pit_out_lap", False)),
            is_sc_vsc=bool(row.get("is_sc_vsc", False)),
            is_dirty_air=bool(row.get("is_dirty_air", False)),
        ))

    # Competitor teams comparison
    competitor_comparisons = []
    primary_traffic_pct = (t_laps.get("is_dirty_air", False).sum() / len(t_laps) * 100) if len(t_laps) > 0 else 0.0
    bench_compounds = None
    bench_name = None
    bench_traffic_pct = 0.0

    for rival_team in req.benchmark_team_names:
        if rival_team == req.team_name:
            continue
        r_laps = normalized_laps[normalized_laps["team_name"] == rival_team].copy()
        if r_laps.empty:
            continue

        r_compounds = degradation_engine.analyze_driver_compounds(r_laps)
        r_traffic_pct = (r_laps.get("is_dirty_air", False).sum() / len(r_laps) * 100) if len(r_laps) > 0 else 0.0

        r_color = TEAM_COLORS.get(rival_team, "#9CA3AF")
        r_drivers = [d for d in drivers if d.get("team_name") == rival_team]
        if r_drivers and r_drivers[0].get("team_colour"):
            r_color = f"#{r_drivers[0]['team_colour']}"

        competitor_comparisons.append({
            "team_name": rival_team,
            "team_colour": r_color,
            "compounds": r_compounds,
            "traffic_percentage": round(r_traffic_pct, 1),
            "drivers": [{"name": d.get("broadcast_name"), "code": d.get("name_acronym")} for d in r_drivers],
        })

        if bench_compounds is None and len(r_compounds) > 0:
            bench_compounds = r_compounds
            bench_name = rival_team
            bench_traffic_pct = r_traffic_pct

    # "What Makes Other Teams' Tyres Last Longer?" diagnostic
    why_others = None
    if bench_compounds and bench_name:
        why_diag = degradation_engine.generate_why_other_tyres_last_longer(
            primary_entity_name=req.team_name,
            benchmark_name=bench_name,
            primary_compounds=compound_metrics_raw,
            benchmark_compounds=bench_compounds,
            primary_traffic_pct=primary_traffic_pct,
            benchmark_traffic_pct=bench_traffic_pct,
            is_constructor_mode=True,
        )
        why_others = StrategicDiagnostic(**why_diag)

    return ConstructorAnalysisResponse(
        team_name=req.team_name,
        team_color=team_color,
        drivers=[{"number": d.get("driver_number"), "name": d.get("broadcast_name"), "code": d.get("name_acronym"), "headshot": d.get("headshot_url")} for d in team_drivers],
        compounds=compound_metrics,
        stints=[StintSummary(**s) for s in stint_metrics],
        scatter_laps=scatter_points,
        pace_timeline=pace_timeline,
        competitor_comparisons=competitor_comparisons,
        why_others_last_longer=why_others,
    )
