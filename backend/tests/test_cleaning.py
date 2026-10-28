import pytest
import pandas as pd
import numpy as np

from backend.app.services.cleaning import LapDataCleaner

def test_stint_attachment_and_tyre_age():
    cleaner = LapDataCleaner()
    laps_data = [
        {"driver_number": 1, "lap_number": 1, "lap_duration": 95.0, "is_pit_out_lap": False},
        {"driver_number": 1, "lap_number": 2, "lap_duration": 92.0, "is_pit_out_lap": False},
        {"driver_number": 1, "lap_number": 3, "lap_duration": 92.3, "is_pit_out_lap": False},
        {"driver_number": 1, "lap_number": 4, "lap_duration": 92.7, "is_pit_out_lap": False},
        {"driver_number": 1, "lap_number": 5, "lap_duration": 93.1, "is_pit_out_lap": False},
        {"driver_number": 1, "lap_number": 6, "lap_duration": 115.0, "is_pit_out_lap": True}, # Stint 2 out-lap
        {"driver_number": 1, "lap_number": 7, "lap_duration": 91.5, "is_pit_out_lap": False},
    ]
    stints_data = [
        {"driver_number": 1, "stint_number": 1, "lap_start": 1, "lap_end": 5, "compound": "SOFT", "tyre_age_at_start": 3},
        {"driver_number": 1, "stint_number": 2, "lap_start": 6, "lap_end": 10, "compound": "HARD", "tyre_age_at_start": 0},
    ]
    df = pd.DataFrame(laps_data)
    result = cleaner.attach_stints_and_tyre_age(df, stints_data)

    # Lap 1: tyre_age = 3 + (1 - 1) = 3
    assert result.loc[result["lap_number"] == 1, "tyre_age"].values[0] == 3
    # Lap 5: tyre_age = 3 + (5 - 1) = 7
    assert result.loc[result["lap_number"] == 5, "tyre_age"].values[0] == 7
    # Lap 5 is pit in lap
    assert result.loc[result["lap_number"] == 5, "is_pit_in_lap"].values[0] == True
    # Lap 7: tyre_age = 0 + (7 - 6) = 1
    assert result.loc[result["lap_number"] == 7, "tyre_age"].values[0] == 1
    assert result.loc[result["lap_number"] == 7, "compound"].values[0] == "HARD"

def test_identify_sc_vsc_laps():
    cleaner = LapDataCleaner()
    rc_messages = [
        {"category": "SafetyCar", "lap_number": 12, "message": "SAFETY CAR DEPLOYED"},
        {"category": "Other", "lap_number": 13, "message": "LAPPED CARS MAY OVERTAKE"},
        {"category": "SafetyCar", "lap_number": 15, "message": "SAFETY CAR ENDING"},
    ]
    sc_laps = cleaner.identify_sc_vsc_laps(rc_messages)
    assert 12 in sc_laps
    assert 13 in sc_laps
    assert 14 in sc_laps
    assert 15 in sc_laps
    assert 11 not in sc_laps
    assert 16 not in sc_laps

def test_representative_lap_filtering():
    cleaner = LapDataCleaner()
    laps_data = [
        {"driver_number": 1, "lap_number": 1, "lap_duration": 98.0, "is_pit_out_lap": False}, # Lap 1 standing start
        {"driver_number": 1, "lap_number": 2, "lap_duration": 92.0, "is_pit_out_lap": False},
        {"driver_number": 1, "lap_number": 3, "lap_duration": 92.2, "is_pit_out_lap": False},
        {"driver_number": 1, "lap_number": 4, "lap_duration": 92.5, "is_pit_out_lap": False},
        {"driver_number": 1, "lap_number": 5, "lap_duration": 120.0, "is_pit_out_lap": False}, # Stint 1 in-lap
    ]
    stints_data = [
        {"driver_number": 1, "stint_number": 1, "lap_start": 1, "lap_end": 5, "compound": "MEDIUM", "tyre_age_at_start": 0},
        {"driver_number": 1, "stint_number": 2, "lap_start": 6, "lap_end": 10, "compound": "HARD", "tyre_age_at_start": 0},
    ]
    df = pd.DataFrame(laps_data)
    cleaned = cleaner.clean_session_laps(df, stints_data, [], pd.DataFrame())

    # Laps 2, 3, 4 should be representative
    rep_laps = cleaned[cleaned["is_representative"]]["lap_number"].tolist()
    assert 2 in rep_laps
    assert 3 in rep_laps
    assert 4 in rep_laps
    # Lap 1 (start) and Lap 5 (pit in) should NOT be representative
    assert 1 not in rep_laps
    assert 5 not in rep_laps
