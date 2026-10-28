import os
from pathlib import Path
from typing import Dict

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_CACHE_DIR = BASE_DIR / "data" / "cache"
DATA_CACHE_DIR.mkdir(parents=True, exist_ok=True)

API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "F1 Tyre Degradation Analyzer"

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

# Circuit-specific fuel penalty adjustments (seconds gained per lap as fuel burns)
# Rule of thumb: ~1.5kg-2.0kg burnt/lap (~0.035s-0.060s/lap speedup)
CIRCUIT_FUEL_SENSITIVITY: Dict[str, float] = {
    "Bahrain": 0.048,
    "Sakhir": 0.048,
    "Saudi Arabia": 0.042,
    "Jeddah": 0.042,
    "Australia": 0.045,
    "Albert Park": 0.045,
    "Japan": 0.044,
    "Suzuka": 0.044,
    "China": 0.046,
    "Shanghai": 0.046,
    "Miami": 0.043,
    "Emilia Romagna": 0.041,
    "Imola": 0.041,
    "Monaco": 0.032,
    "Monte Carlo": 0.032,
    "Canada": 0.038,
    "Montreal": 0.038,
    "Spain": 0.047,
    "Barcelona": 0.047,
    "Austria": 0.036,
    "Spielberg": 0.036,
    "Great Britain": 0.052,
    "Silverstone": 0.052,
    "Hungary": 0.037,
    "Hungaroring": 0.037,
    "Belgium": 0.055,
    "Spa-Francorchamps": 0.055,
    "Netherlands": 0.042,
    "Zandvoort": 0.042,
    "Italy": 0.038,
    "Monza": 0.038,
    "Azerbaijan": 0.044,
    "Baku": 0.044,
    "Singapore": 0.045,
    "Marina Bay": 0.045,
    "United States": 0.048,
    "Austin": 0.048,
    "Mexico": 0.040,
    "Mexico City": 0.040,
    "Brazil": 0.043,
    "Interlagos": 0.043,
    "Las Vegas": 0.041,
    "Qatar": 0.050,
    "Lusail": 0.050,
    "Abu Dhabi": 0.046,
    "Yas Marina": 0.046,
    "DEFAULT": 0.045,
}

# Compound color definitions (Pirelli branding)
COMPOUND_COLORS: Dict[str, str] = {
    "SOFT": "#EF4444",      # Red
    "MEDIUM": "#F59E0B",    # Yellow
    "HARD": "#E5E7EB",      # White/Light Silver
    "INTERMEDIATE": "#10B981", # Green
    "WET": "#3B82F6",       # Blue
    "UNKNOWN": "#9CA3AF",
}

# Team primary colors for visualization
TEAM_COLORS: Dict[str, str] = {
    "Red Bull Racing": "#3671C6",
    "Ferrari": "#E80020",
    "Mercedes": "#27F4D2",
    "McLaren": "#FF8000",
    "Aston Martin": "#229971",
    "Alpine": "#0093CC",
    "Williams": "#64C4FF",
    "RB": "#6692FF",
    "AlphaTauri": "#5E8FAA",
    "Sauber": "#52E252",
    "Alfa Romeo": "#C92D4B",
    "Haas F1 Team": "#B6BABD",
    "Kick Sauber": "#52E252",
}

# Dirty air time delta threshold in seconds (<1.2s to car ahead induces dirty air tyre slip)
DIRTY_AIR_THRESHOLD_SECONDS = 1.2
