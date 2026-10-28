from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class LapScatterPoint(BaseModel):
    lap_number: int
    tyre_age: float
    raw_lap_time: float
    corrected_lap_time: float
    stint_number: int
    compound: str
    compound_color: str
    driver_number: int
    driver_code: str
    team_name: str
    is_representative: bool
    is_dirty_air: bool
    interval: Optional[float] = None

class TrendlinePoint(BaseModel):
    tyre_age: float
    fitted_lap_time: float

class StintSummary(BaseModel):
    stint_number: int
    compound: str
    compound_color: str
    total_laps: int
    representative_laps: int
    traffic_laps: int
    start_tyre_age: int
    end_tyre_age: int
    mean_raw_pace: Optional[float] = None
    mean_corrected_pace: Optional[float] = None
    degradation_rate: float
    raw_degradation_rate: float
    base_pace_intercept: float
    r_squared: float
    trendline: List[TrendlinePoint] = []

class CompoundMetric(BaseModel):
    compound: str
    compound_color: str
    total_laps: int
    degradation_rate: float
    raw_degradation_rate: float
    base_pace: float
    r_squared: float
    mean_pace: Optional[float] = None
    trendline: List[TrendlinePoint] = []

class PaceTimelinePoint(BaseModel):
    lap_number: int
    raw_lap_time: Optional[float] = None
    corrected_lap_time: Optional[float] = None
    driver_code: str
    team_name: str
    compound: str
    stint_number: int
    tyre_age: float
    is_pit_stop: bool = False
    is_sc_vsc: bool = False
    is_dirty_air: bool = False

class StrategicDiagnostic(BaseModel):
    compound_analyzed: str
    primary_degradation: float
    benchmark_degradation: float
    degradation_delta: float
    better_preserver: str
    stint_loss_seconds: float
    verdict: str
    factors: List[Dict[str, str]]

class DriverAnalysisResponse(BaseModel):
    driver_info: Dict[str, Any]
    compounds: Dict[str, CompoundMetric]
    stints: List[StintSummary]
    scatter_laps: List[LapScatterPoint]
    pace_timeline: List[PaceTimelinePoint]
    crossover_points: List[Dict[str, Any]]
    comparisons: List[Dict[str, Any]] = []
    why_others_last_longer: Optional[StrategicDiagnostic] = None

class ConstructorAnalysisResponse(BaseModel):
    team_name: str
    team_color: str
    drivers: List[Dict[str, Any]]
    compounds: Dict[str, CompoundMetric]
    stints: List[StintSummary]
    scatter_laps: List[LapScatterPoint]
    pace_timeline: List[PaceTimelinePoint]
    competitor_comparisons: List[Dict[str, Any]] = []
    why_others_last_longer: Optional[StrategicDiagnostic] = None
