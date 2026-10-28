import logging
from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Query

from backend.app.core.config import TEAM_COLORS
from backend.app.services.fastf1_client import f1_client

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", summary="Get race sessions for a given year")
def get_sessions(year: int = Query(default=2024, ge=2018, le=2026)) -> List[Dict[str, Any]]:
    """Retrieve all Grand Prix race sessions for the given year."""
    sessions = f1_client.get_sessions(year)
    if not sessions:
        # Fallback to 2023 if selected year has no data
        sessions = f1_client.get_sessions(2023)
    return sessions

@router.get("/{session_key}", summary="Get session details")
def get_session_info(session_key: int) -> Dict[str, Any]:
    """Retrieve details for a specific race session."""
    info = f1_client.get_session_info(session_key)
    if not info:
        raise HTTPException(status_code=404, detail=f"Session {session_key} not found")
    return info

@router.get("/{session_key}/drivers", summary="Get drivers in a session")
def get_drivers(session_key: int) -> List[Dict[str, Any]]:
    """Retrieve all drivers participating in a session with team and livery details."""
    drivers = f1_client.get_drivers(session_key)
    # Augment team colors if missing
    for d in drivers:
        team = d.get("team_name")
        if not d.get("team_colour") and team in TEAM_COLORS:
            d["team_colour"] = TEAM_COLORS[team].replace("#", "")
    return drivers

@router.get("/{session_key}/constructors", summary="Get constructors in a session")
def get_constructors(session_key: int) -> List[Dict[str, Any]]:
    """Retrieve unique constructors and their drivers for a session."""
    drivers = f1_client.get_drivers(session_key)
    teams: Dict[str, Dict[str, Any]] = {}

    for d in drivers:
        tname = d.get("team_name")
        if not tname:
            continue
        if tname not in teams:
            color = d.get("team_colour")
            if not color and tname in TEAM_COLORS:
                color = TEAM_COLORS[tname].replace("#", "")
            teams[tname] = {
                "team_name": tname,
                "team_colour": color or "FFFFFF",
                "drivers": [],
            }
        teams[tname]["drivers"].append({
            "driver_number": d.get("driver_number"),
            "broadcast_name": d.get("broadcast_name"),
            "name_acronym": d.get("name_acronym"),
            "headshot_url": d.get("headshot_url"),
        })

    return sorted(list(teams.values()), key=lambda x: x["team_name"])
