import pytest
import numpy as np
import pandas as pd

from backend.app.services.degradation import DegradationEngine
from backend.app.services.normalizer import FeatureNormalizer

def test_linear_regression_slope():
    engine = DegradationEngine()
    # 10 laps with a clean degradation slope of 0.08 s/lap starting at 90.0s
    x = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
    y = np.array([90.0 + 0.08 * age for age in x], dtype=float)

    fit = engine.fit_linear_regression(x, y)
    assert abs(fit["slope"] - 0.08) < 0.001
    assert abs(fit["intercept"] - 90.0) < 0.001
    assert fit["r_squared"] > 0.99
    assert len(fit["trendline"]) == 2

def test_fuel_correction_unmasks_degradation():
    normalizer = FeatureNormalizer()
    engine = DegradationEngine()

    # Suppose raw lap times appear almost flat due to fuel burn off:
    # True degradation = +0.07 s/lap, but car gains 0.05 s/lap from fuel burn.
    # Raw pace = 90.0 + (0.07 * age) - (0.05 * age) = 90.0 + 0.02 * age
    laps = []
    for lap in range(1, 15):
        raw_time = 90.0 + 0.02 * lap
        laps.append({
            "lap_number": lap,
            "lap_duration": raw_time,
            "tyre_age": lap,
            "compound": "MEDIUM",
            "is_representative": True,
        })
    df = pd.DataFrame(laps)

    # Without fuel correction
    raw_fit = engine.fit_linear_regression(df["tyre_age"].values, df["lap_duration"].values)
    assert abs(raw_fit["slope"] - 0.02) < 0.005

    # With fuel correction (0.05s / lap fuel factor, 0 track evolution)
    corrected_df = normalizer.normalize_lap_times(
        df, fuel_factor=0.05, track_evolution_factor=0.0, apply_correction=True
    )
    corr_fit = engine.fit_linear_regression(
        corrected_df["tyre_age"].values, corrected_df["lap_duration_corrected"].values
    )

    # Corrected slope should reveal the true ~0.07 s/lap degradation!
    assert abs(corr_fit["slope"] - 0.07) < 0.005
    assert corr_fit["slope"] > raw_fit["slope"]

def test_crossover_calculation():
    engine = DegradationEngine()
    # Compound 1 (Soft): Fast base pace 90.0s, high deg 0.12 s/lap
    # Compound 2 (Hard): Slower base pace 91.0s, low deg 0.04 s/lap
    # Crossover: 90.0 + 0.12 * age = 91.0 + 0.04 * age => 0.08 * age = 1.0 => age = 12.5 laps
    compounds = {
        "SOFT": {"compound": "SOFT", "degradation_rate": 0.12, "base_pace": 90.0},
        "HARD": {"compound": "HARD", "degradation_rate": 0.04, "base_pace": 91.0},
    }
    crossovers = engine.compute_crossover_points(compounds)
    assert len(crossovers) == 1
    assert abs(crossovers[0]["crossover_tyre_age"] - 12.5) < 0.2
