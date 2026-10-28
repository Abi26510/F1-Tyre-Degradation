import logging
from typing import Any, Dict, List, Optional, Set
import numpy as np
import pandas as pd

from backend.app.core.config import DIRTY_AIR_THRESHOLD_SECONDS

logger = logging.getLogger(__name__)

class LapDataCleaner:
    """
    Cleans raw lap records by:
    - Associating laps with tyre stints and calculating Tyre Age
    - Removing pit out-laps and in-laps
    - Identifying SC/VSC/Yellow flag periods from race control
    - Isolating dirty air (<1.2s gap to preceding car)
    - Detecting lap time outliers and non-representative laps
    """

    @staticmethod
    def identify_sc_vsc_laps(race_control: List[Dict[str, Any]]) -> Set[int]:
        """Extract lap numbers affected by Safety Car, VSC, or Red Flags."""
        sc_laps = set()
        active_sc = False
        last_sc_lap = None

        for msg in race_control:
            category = str(msg.get("category", "")).upper()
            message = str(msg.get("message", "")).upper()
            lap_num = msg.get("lap_number")

            is_sc_start = ("SAFETY CAR DEPLOYED" in message or "VIRTUAL SAFETY CAR DEPLOYED" in message or 
                           "RED FLAG" in message or category == "SAFETYCAR" and "DEPLOYED" in message)
            is_sc_end = ("SAFETY CAR ENDING" in message or "SAFETY CAR IN THIS LAP" in message or 
                         "VIRTUAL SAFETY CAR ENDING" in message or "TRACK CLEAR" in message or 
                         category == "SAFETYCAR" and "ENDING" in message)

            if is_sc_start:
                active_sc = True
                if lap_num is not None:
                    sc_laps.add(int(lap_num))
                    last_sc_lap = int(lap_num)

            elif is_sc_end:
                if lap_num is not None:
                    sc_laps.add(int(lap_num))
                    if last_sc_lap and int(lap_num) > last_sc_lap:
                        for l in range(last_sc_lap, int(lap_num) + 1):
                            sc_laps.add(l)
                active_sc = False
                last_sc_lap = None

            elif active_sc and lap_num is not None:
                sc_laps.add(int(lap_num))
                # Fill between last_sc_lap and current lap_num if skipped
                if last_sc_lap and int(lap_num) > last_sc_lap:
                    for l in range(last_sc_lap, int(lap_num) + 1):
                        sc_laps.add(l)
                last_sc_lap = int(lap_num)

        return sc_laps

    @staticmethod
    def attach_stints_and_tyre_age(laps_df: pd.DataFrame, stints: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Merge stint data into lap records and compute exact tyre age per lap.
        TyreAge = tyre_age_at_start + (lap_number - stint_lap_start)
        """
        if laps_df.empty or not stints:
            return laps_df

        df = laps_df.copy()
        df["stint_number"] = np.nan
        df["compound"] = "UNKNOWN"
        df["tyre_age"] = np.nan
        df["is_pit_in_lap"] = False
        df["max_stint_for_driver"] = 1

        stints_df = pd.DataFrame(stints)
        if stints_df.empty:
            return df

        # Group stints by driver_number
        max_stints = stints_df.groupby("driver_number")["stint_number"].max().to_dict()

        for _, stint in stints_df.iterrows():
            dnum = stint.get("driver_number")
            snum = stint.get("stint_number")
            lap_s = stint.get("lap_start")
            lap_e = stint.get("lap_end")
            compound = str(stint.get("compound", "UNKNOWN")).upper()
            age_start = stint.get("tyre_age_at_start", 0) or 0

            if pd.isna(dnum) or pd.isna(lap_s) or pd.isna(lap_e):
                continue

            mask = (df["driver_number"] == dnum) & (df["lap_number"] >= lap_s) & (df["lap_number"] <= lap_e)
            df.loc[mask, "stint_number"] = snum
            df.loc[mask, "compound"] = compound
            # Tyre age formula: start_age + (lap - lap_start)
            df.loc[mask, "tyre_age"] = age_start + (df.loc[mask, "lap_number"] - lap_s)

            # In-lap detection: last lap of stint if not final stint
            max_s = max_stints.get(dnum, 1)
            if snum < max_s:
                in_mask = (df["driver_number"] == dnum) & (df["lap_number"] == lap_e)
                df.loc[in_mask, "is_pit_in_lap"] = True

        return df

    @staticmethod
    def attach_traffic_flags(laps_df: pd.DataFrame, intervals_df: pd.DataFrame) -> pd.DataFrame:
        """
        Tag laps where gap to preceding car is < 1.2s (dirty air inducing extra tyre slip).
        """
        df = laps_df.copy()
        df["is_dirty_air"] = False
        df["interval_to_car_ahead"] = np.nan

        if intervals_df.empty or "interval" not in intervals_df.columns:
            return df

        # Process per driver
        cleaned_intervals = intervals_df.dropna(subset=["interval"]).copy()
        if "date" in cleaned_intervals.columns and "date_start" in df.columns:
            try:
                cleaned_intervals["date"] = pd.to_datetime(cleaned_intervals["date"], format="ISO8601")
                df["date_start_dt"] = pd.to_datetime(df["date_start"], format="ISO8601")

                driver_dfs = []
                for dnum, group in df.groupby("driver_number"):
                    d_intervals = cleaned_intervals[cleaned_intervals["driver_number"] == dnum].sort_values("date")
                    if d_intervals.empty:
                        driver_dfs.append(group)
                        continue

                    d_group = group.sort_values("date_start_dt")
                    merged = pd.merge_asof(
                        d_group,
                        d_intervals[["date", "interval"]],
                        left_on="date_start_dt",
                        right_on="date",
                        direction="nearest",
                        tolerance=pd.Timedelta(seconds=120)
                    )
                    merged["interval_to_car_ahead"] = merged["interval"]
                    # If gap < threshold and not leader (interval > 0)
                    merged["is_dirty_air"] = (merged["interval"] > 0) & (merged["interval"] < DIRTY_AIR_THRESHOLD_SECONDS)
                    driver_dfs.append(merged)

                result_df = pd.concat(driver_dfs, ignore_index=True)
                if "date_start_dt" in result_df.columns:
                    result_df = result_df.drop(columns=["date_start_dt"])
                if "date" in result_df.columns:
                    result_df = result_df.drop(columns=["date"])
                return result_df
            except Exception as e:
                logger.warning(f"Interval merge failed, defaulting traffic: {e}")
                return df

        return df

    def clean_session_laps(
        self,
        laps_df: pd.DataFrame,
        stints: List[Dict[str, Any]],
        race_control: List[Dict[str, Any]],
        intervals_df: pd.DataFrame,
        exclude_traffic: bool = False,
    ) -> pd.DataFrame:
        """
        Execute full cleaning pipeline:
        1. Merge stints & tyre age
        2. Identify SC/VSC laps
        3. Merge traffic interval data
        4. Detect pit laps & pace outliers
        5. Mark is_representative flag
        """
        if laps_df.empty:
            return laps_df

        # 1. Stints & Tyre Age
        df = self.attach_stints_and_tyre_age(laps_df, stints)

        # 2. SC/VSC Laps
        sc_laps = self.identify_sc_vsc_laps(race_control)
        df["is_sc_vsc"] = df["lap_number"].isin(sc_laps)

        # 3. Traffic flags
        df = self.attach_traffic_flags(df, intervals_df)

        # 4. Out-lap & In-lap flags
        if "is_pit_out_lap" not in df.columns:
            df["is_pit_out_lap"] = False
        df["is_pit_out_lap"] = df["is_pit_out_lap"].fillna(False).astype(bool)

        # Also flag lap 1 as out-lap/standing start
        df["is_standing_start"] = df["lap_number"] == 1

        # 5. Outlier Pace Detection (laps that are >1.08x median or <10s)
        df["is_pace_outlier"] = False
        for (dnum, stint_num), group in df.groupby(["driver_number", "stint_number"]):
            valid_times = group.loc[
                (~group["is_pit_out_lap"]) & 
                (~group["is_pit_in_lap"]) & 
                (~group["is_sc_vsc"]) & 
                (group["lap_number"] > 1) &
                (group["lap_duration"].notna()),
                "lap_duration"
            ]
            if len(valid_times) >= 3:
                median_pace = valid_times.median()
                outlier_mask = group["lap_duration"] > (median_pace * 1.08)
                df.loc[group.index[outlier_mask], "is_pace_outlier"] = True
            elif len(valid_times) > 0:
                median_pace = valid_times.median()
                outlier_mask = group["lap_duration"] > (median_pace * 1.15)
                df.loc[group.index[outlier_mask], "is_pace_outlier"] = True

        # Invalidate missing or unphysical times (<45s or >200s for a standard GP lap)
        invalid_time = df["lap_duration"].isna() | (df["lap_duration"] < 45.0) | (df["lap_duration"] > 220.0)
        df.loc[invalid_time, "is_pace_outlier"] = True

        # Representative flag: representative for clean baseline tyre degradation calculation
        rep_cond = (
            (~df["is_pit_out_lap"]) &
            (~df["is_pit_in_lap"]) &
            (~df["is_sc_vsc"]) &
            (~df["is_standing_start"]) &
            (~df["is_pace_outlier"]) &
            (df["compound"].isin(["SOFT", "MEDIUM", "HARD"]))
        )
        if exclude_traffic:
            rep_cond = rep_cond & (~df["is_dirty_air"])

        df["is_representative"] = rep_cond
        return df

cleaner = LapDataCleaner()
