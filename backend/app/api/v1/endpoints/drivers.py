import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
import numpy as np
import pandas as pd

from backend.app.core.config import COMPOUND_COLORS
from backend.app.schemas.filter import DriverAnalysisRequest
from backend.app.schemas.analysis import (
    DriverAnalysisResponse,
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

@router.post("/driver", response_model=DriverAnalysisResponse, summary="Analyze driver tyre degradation")
def analyze_driver(req: DriverAnalysisRequest):
    """
    Detailed tyre degradation analysis for a specific driver:
    - Lap Time vs Tyre Age scatter points
    - OLS regression wear slopes (s/lap) per compound and stint
    - Race pace trajectory timeline
    - Stint summaries & compound crossover points
    - Comparisons against competitor drivers
    - Strategic Diagnostic ("What Makes Other Tyres Last Longer?")
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
    target_driver_meta = driver_map.get(req.driver_number, {"broadcast_name": f"Driver #{req.driver_number}"})

    # Clean laps
    cleaned_laps = cleaner.clean_session_laps(
        raw_laps, stints, race_control, intervals, exclude_traffic=req.filter_traffic
    )

    # Normalize fuel & track evolution
    normalized_laps = normalizer.normalize_lap_times(
        cleaned_laps,
        fuel_factor=req.fuel_factor,
        circuit_name=circuit_name,
        country_name=country_name,
        track_evolution_factor=req.track_evolution_factor,
        apply_correction=req.apply_fuel_correction,
    )

    # Target driver laps
    d_laps = normalized_laps[normalized_laps["driver_number"] == req.driver_number].copy()
    if d_laps.empty:
        raise HTTPException(status_code=404, detail=f"No laps found for driver #{req.driver_number}")

    # Optional compound filter
    if req.compounds and len(req.compounds) > 0:
        filter_compounds = [c.upper() for c in req.compounds]
        d_laps_filtered = d_laps[d_laps["compound"].isin(filter_compounds)].copy()
    else:
        d_laps_filtered = d_laps

    # Stint-level metrics
    stint_metrics = degradation_engine.analyze_driver_stints(d_laps_filtered)

    # Overall compound metrics
    compound_metrics_raw = degradation_engine.analyze_driver_compounds(d_laps_filtered)
    compound_metrics = {
        k: CompoundMetric(**v) for k, v in compound_metrics_raw.items()
    }

    # Crossover points
    crossover_points = degradation_engine.compute_crossover_points(compound_metrics_raw)

    # Build Scatter Points
    scatter_points: List[LapScatterPoint] = []
    for _, row in d_laps.iterrows():
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
            driver_number=int(req.driver_number),
            driver_code=target_driver_meta.get("name_acronym", f"#{req.driver_number}"),
            team_name=target_driver_meta.get("team_name", "Unknown"),
            is_representative=bool(row.get("is_representative", False)),
            is_dirty_air=bool(row.get("is_dirty_air", False)),
            interval=round(float(row["interval_to_car_ahead"]), 3) if pd.notna(row.get("interval_to_car_ahead")) else None,
        ))

    # Build Pace Timeline Points
    pace_timeline: List[PaceTimelinePoint] = []
    for _, row in d_laps.sort_values("lap_number").iterrows():
        raw_time = row.get("lap_duration")
        corr_time = row.get("lap_duration_corrected")
        tyre_age = row.get("tyre_age", 0)
        pace_timeline.append(PaceTimelinePoint(
            lap_number=int(row["lap_number"]),
            raw_lap_time=round(float(raw_time), 3) if pd.notna(raw_time) else None,
            corrected_lap_time=round(float(corr_time), 3) if pd.notna(corr_time) else None,
            driver_code=target_driver_meta.get("name_acronym", f"#{req.driver_number}"),
            team_name=target_driver_meta.get("team_name", "Unknown"),
            compound=str(row.get("compound", "UNKNOWN")),
            stint_number=int(row.get("stint_number", 1)) if pd.notna(row.get("stint_number")) else 1,
            tyre_age=float(tyre_age) if pd.notna(tyre_age) else 0.0,
            is_pit_stop=bool(row.get("is_pit_in_lap", False) or row.get("is_pit_out_lap", False)),
            is_sc_vsc=bool(row.get("is_sc_vsc", False)),
            is_dirty_air=bool(row.get("is_dirty_air", False)),
        ))

    # Process comparison drivers
    comparisons = []
    benchmark_compounds = None
    benchmark_name = None
    benchmark_traffic_pct = 0.0

    for comp_dnum in req.comparison_drivers:
        if comp_dnum == req.driver_number:
            continue
        c_meta = driver_map.get(comp_dnum, {"broadcast_name": f"Driver #{comp_dnum}"})
        c_laps = normalized_laps[normalized_laps["driver_number"] == comp_dnum].copy()
        if c_laps.empty:
            continue

        c_comp_metrics = degradation_engine.analyze_driver_compounds(c_laps)
        c_stints = degradation_engine.analyze_driver_stints(c_laps)
        c_traffic_pct = (c_laps.get("is_dirty_air", False).sum() / len(c_laps) * 100) if len(c_laps) > 0 else 0.0

        comparisons.append({
            "driver_number": comp_dnum,
            "driver_code": c_meta.get("name_acronym", f"#{comp_dnum}"),
            "broadcast_name": c_meta.get("broadcast_name", f"Driver #{comp_dnum}"),
            "team_name": c_meta.get("team_name", ""),
            "team_colour": c_meta.get("team_colour", "FFFFFF"),
            "compounds": c_comp_metrics,
            "stints": c_stints,
            "traffic_percentage": round(c_traffic_pct, 1),
        })

        if benchmark_compounds is None and len(c_comp_metrics) > 0:
            benchmark_compounds = c_comp_metrics
            benchmark_name = c_meta.get("broadcast_name", f"Driver #{comp_dnum}")
            benchmark_traffic_pct = c_traffic_pct

    # "What makes other tyres last longer?" strategic diagnostic
    primary_traffic_pct = (d_laps.get("is_dirty_air", False).sum() / len(d_laps) * 100) if len(d_laps) > 0 else 0.0
    why_others = None
    if benchmark_compounds and benchmark_name:
        why_diag = degradation_engine.generate_why_other_tyres_last_longer(
            primary_entity_name=target_driver_meta.get("broadcast_name", f"Driver #{req.driver_number}"),
            benchmark_name=benchmark_name,
            primary_compounds=compound_metrics_raw,
            benchmark_compounds=benchmark_compounds,
            primary_traffic_pct=primary_traffic_pct,
            benchmark_traffic_pct=benchmark_traffic_pct,
            is_constructor_mode=False,
        )
        why_others = StrategicDiagnostic(**why_diag)

    return DriverAnalysisResponse(
        driver_info=target_driver_meta,
        compounds=compound_metrics,
        stints=[StintSummary(**s) for s in stint_metrics],
        scatter_laps=scatter_points,
        pace_timeline=pace_timeline,
        crossover_points=crossover_points,
        comparisons=comparisons,
        why_others_last_longer=why_others,
    )
