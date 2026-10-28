import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query

from backend.app.core.config import CIRCUIT_FUEL_SENSITIVITY, COMPOUND_COLORS
from backend.app.services.cleaning import cleaner
from backend.app.services.degradation import degradation_engine
from backend.app.services.fastf1_client import f1_client
from backend.app.services.normalizer import normalizer

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/circuit-meta", summary="Get circuit metadata and fuel sensitivities")
def get_circuit_meta() -> Dict[str, Any]:
    """Return configured fuel sensitivities and default constants for Grand Prix circuits."""
    return {
        "fuel_sensitivities": CIRCUIT_FUEL_SENSITIVITY,
        "compound_colors": COMPOUND_COLORS,
        "default_fuel_penalty": 0.045,
        "dirty_air_threshold_seconds": 1.2,
    }

@router.get("/rankings", summary="Rank drivers/teams by degradation rate for a session")
def get_session_rankings(
    session_key: int = Query(...),
    compound: str = Query(default="HARD"),
    apply_fuel_correction: bool = Query(default=True),
) -> List[Dict[str, Any]]:
    """Rank all drivers in a session by compound degradation slope (s/lap)."""
    raw_laps = f1_client.get_laps(session_key)
    if raw_laps.empty:
        raise HTTPException(status_code=404, detail="No lap data found")

    stints = f1_client.get_stints(session_key)
    race_control = f1_client.get_race_control(session_key)
    intervals = f1_client.get_intervals(session_key)
    drivers = f1_client.get_drivers(session_key)
    driver_map = {d.get("driver_number"): d for d in drivers}

    session_info = f1_client.get_session_info(session_key) or {}
    circuit_name = session_info.get("circuit_short_name", "")

    cleaned = cleaner.clean_session_laps(raw_laps, stints, race_control, intervals)
    normalized = normalizer.normalize_lap_times(
        cleaned, circuit_name=circuit_name, apply_correction=apply_fuel_correction
    )

    rankings = []
    target_compound = compound.upper()
    comp_laps = normalized[(normalized["compound"] == target_compound) & (normalized["is_representative"])].copy()

    for dnum, group in comp_laps.groupby("driver_number"):
        if len(group) < 4:
            continue
        x = group["tyre_age"].dropna().values
        y = group["lap_duration_corrected"].dropna().values
        if len(x) < 4:
            continue

        fit = degradation_engine.fit_linear_regression(x, y)
        d_meta = driver_map.get(dnum, {})
        rankings.append({
            "driver_number": int(dnum),
            "driver_name": d_meta.get("broadcast_name", f"Driver #{dnum}"),
            "driver_code": d_meta.get("name_acronym", f"#{dnum}"),
            "team_name": d_meta.get("team_name", ""),
            "compound": target_compound,
            "laps_completed": len(group),
            "degradation_rate": fit["slope"],
            "base_pace": fit["intercept"],
            "r_squared": fit["r_squared"],
        })

    # Sort: lower degradation rate = better tyre preservation
    rankings = sorted(rankings, key=lambda r: r["degradation_rate"])
    return rankings
