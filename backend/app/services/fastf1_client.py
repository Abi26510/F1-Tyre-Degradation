import json
import logging
import urllib.request
from typing import Any, Dict, List, Optional
import pandas as pd
import requests

from backend.app.core.cache import cache_manager
from backend.app.core.config import DATA_CACHE_DIR

logger = logging.getLogger(__name__)

OPENF1_BASE = "https://api.openf1.org/v1"
HEADERS = {"User-Agent": "F1-Tyre-Degradation-Analyzer/1.0"}

class F1DataClient:
    """
    Ingestion client integrating OpenF1 and FastF1 cached telemetry.
    Stores raw responses locally in Apache Parquet and JSON.
    """

    def __init__(self, timeout: int = 15):
        self.timeout = timeout

    def _fetch_json(self, url: str) -> Optional[List[Dict[str, Any]]]:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=self.timeout)
            if resp.status_code == 200:
                return resp.json()
            logger.warning(f"Failed to fetch {url}: HTTP {resp.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    def get_sessions(self, year: int = 2024) -> List[Dict[str, Any]]:
        """Retrieve all Grand Prix race sessions for a given year."""
        cache_key = f"sessions_{year}"
        cached = cache_manager.get_json(cache_key)
        if cached is not None:
            return cached

        url = f"{OPENF1_BASE}/sessions?year={year}&session_name=Race"
        data = self._fetch_json(url)
        if not data:
            # Fallback to previous year if year has no races yet
            url_fallback = f"{OPENF1_BASE}/sessions?year={year-1}&session_name=Race"
            data = self._fetch_json(url_fallback)

        if data:
            # Sort chronologically
            data = sorted(data, key=lambda s: s.get("date_start", ""))
            cache_manager.set_json(cache_key, data)
            return data
        return []

    def get_session_info(self, session_key: int) -> Optional[Dict[str, Any]]:
        """Retrieve details for a specific session."""
        cache_key = f"session_info_{session_key}"
        cached = cache_manager.get_json(cache_key)
        if cached is not None:
            return cached

        url = f"{OPENF1_BASE}/sessions?session_key={session_key}"
        data = self._fetch_json(url)
        if data and len(data) > 0:
            info = data[0]
            cache_manager.set_json(cache_key, info)
            return info
        return None

    def get_drivers(self, session_key: int) -> List[Dict[str, Any]]:
        """Retrieve drivers participating in a session."""
        cache_key = f"drivers_{session_key}"
        cached = cache_manager.get_json(cache_key)
        if cached is not None:
            return cached

        url = f"{OPENF1_BASE}/drivers?session_key={session_key}"
        data = self._fetch_json(url)
        if data:
            # Deduplicate by driver_number
            seen = set()
            drivers = []
            for d in data:
                dnum = d.get("driver_number")
                if dnum and dnum not in seen:
                    seen.add(dnum)
                    drivers.append(d)
            # Sort by team_name then broadcast_name
            drivers = sorted(drivers, key=lambda x: (x.get("team_name") or "", x.get("broadcast_name") or ""))
            cache_manager.set_json(cache_key, drivers)
            return drivers
        return []

    def get_stints(self, session_key: int) -> List[Dict[str, Any]]:
        """Retrieve tyre stint allocations and lap ranges for all drivers in a session."""
        cache_key = f"stints_{session_key}"
        cached = cache_manager.get_json(cache_key)
        if cached is not None:
            return cached

        url = f"{OPENF1_BASE}/stints?session_key={session_key}"
        data = self._fetch_json(url)
        if data:
            cache_manager.set_json(cache_key, data)
            return data
        return []

    def get_laps(self, session_key: int) -> pd.DataFrame:
        """
        Retrieve all raw lap times and sector timing data for a session as DataFrame.
        Cached in Apache Parquet for instant retrieval.
        """
        cache_key = f"laps_{session_key}"
        cached_df = cache_manager.get_df(cache_key)
        if cached_df is not None:
            return cached_df

        url = f"{OPENF1_BASE}/laps?session_key={session_key}"
        data = self._fetch_json(url)
        if not data:
            return pd.DataFrame()

        df = pd.DataFrame(data)
        # Ensure correct column types
        if "lap_duration" in df.columns:
            df["lap_duration"] = pd.to_numeric(df["lap_duration"], errors="coerce")
        if "lap_number" in df.columns:
            df["lap_number"] = pd.to_numeric(df["lap_number"], errors="coerce").astype("Int64")
        if "driver_number" in df.columns:
            df["driver_number"] = pd.to_numeric(df["driver_number"], errors="coerce").astype("Int64")

        cache_manager.set_df(cache_key, df)
        return df

    def get_race_control(self, session_key: int) -> List[Dict[str, Any]]:
        """Retrieve race control messages (Yellow flags, Safety Car, VSC, Red flag)."""
        cache_key = f"race_control_{session_key}"
        cached = cache_manager.get_json(cache_key)
        if cached is not None:
            return cached

        url = f"{OPENF1_BASE}/race_control?session_key={session_key}"
        data = self._fetch_json(url)
        if data:
            cache_manager.set_json(cache_key, data)
            return data
        return []

    def get_intervals(self, session_key: int) -> pd.DataFrame:
        """
        Retrieve gap-to-car-ahead intervals for dirty air (<1.2s) filtering.
        """
        cache_key = f"intervals_{session_key}"
        cached_df = cache_manager.get_df(cache_key)
        if cached_df is not None:
            return cached_df

        url = f"{OPENF1_BASE}/intervals?session_key={session_key}"
        data = self._fetch_json(url)
        if not data:
            return pd.DataFrame()

        df = pd.DataFrame(data)
        if "interval" in df.columns:
            df["interval"] = pd.to_numeric(df["interval"], errors="coerce")
        if "gap_to_leader" in df.columns:
            df["gap_to_leader"] = pd.to_numeric(df["gap_to_leader"], errors="coerce")

        cache_manager.set_df(cache_key, df)
        return df

f1_client = F1DataClient()
