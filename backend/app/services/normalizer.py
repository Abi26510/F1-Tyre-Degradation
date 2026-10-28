import logging
from typing import Optional
import numpy as np
import pandas as pd

from backend.app.core.config import CIRCUIT_FUEL_SENSITIVITY

logger = logging.getLogger(__name__)

class FeatureNormalizer:
    """
    Normalizes lap times to expose true mechanical tyre degradation.
    Removes the masking effect of fuel burn-off (~1.5-2.0kg/lap, ~0.035-0.060s/lap)
    and optional track rubbering-in (track evolution).
    """

    @staticmethod
    def get_circuit_fuel_sensitivity(circuit_name: Optional[str] = None, country_name: Optional[str] = None) -> float:
        """Lookup circuit-specific fuel penalty in seconds per lap."""
        if circuit_name:
            for key, val in CIRCUIT_FUEL_SENSITIVITY.items():
                if key.lower() in circuit_name.lower():
                    return val

        if country_name:
            for key, val in CIRCUIT_FUEL_SENSITIVITY.items():
                if key.lower() in country_name.lower():
                    return val

        return CIRCUIT_FUEL_SENSITIVITY.get("DEFAULT", 0.045)

    def normalize_lap_times(
        self,
        df: pd.DataFrame,
        fuel_factor: Optional[float] = None,
        circuit_name: Optional[str] = None,
        country_name: Optional[str] = None,
        track_evolution_factor: float = 0.008,
        apply_correction: bool = True,
    ) -> pd.DataFrame:
        """
        Calculate corrected lap time:
        CorrectedLapTime = RawLapTime + (LapNumber * FuelFactor) - (LapNumber * TrackEvolutionDelta)
        """
        if df.empty or "lap_duration" not in df.columns:
            return df

        result = df.copy()

        if fuel_factor is None or fuel_factor <= 0:
            fuel_factor = self.get_circuit_fuel_sensitivity(circuit_name, country_name)

        result["fuel_factor_applied"] = fuel_factor if apply_correction else 0.0
        result["track_evolution_applied"] = track_evolution_factor if apply_correction else 0.0

        if apply_correction:
            # As lap number increases, car burns fuel and becomes lighter (lap times get naturally faster).
            # To correct for this and isolate pure tyre degradation, we add back the time gained from fuel burn:
            fuel_delta = result["lap_number"] * fuel_factor
            track_delta = result["lap_number"] * track_evolution_factor
            result["lap_duration_corrected"] = np.round(
                result["lap_duration"] + fuel_delta - track_delta, 3
            )
        else:
            result["lap_duration_corrected"] = result["lap_duration"]

        return result

normalizer = FeatureNormalizer()
