from typing import List, Optional
from pydantic import BaseModel, Field

class DriverAnalysisRequest(BaseModel):
    session_key: int = Field(..., description="OpenF1 session key")
    driver_number: int = Field(..., description="Target driver number, e.g. 1 for Verstappen")
    comparison_drivers: List[int] = Field(default=[], description="List of driver numbers to compare against")
    compounds: Optional[List[str]] = Field(default=None, description="Tyre compounds to filter by (SOFT, MEDIUM, HARD)")
    apply_fuel_correction: bool = Field(default=True, description="Enable fuel weight correction")
    fuel_factor: Optional[float] = Field(default=None, description="Custom fuel factor in s/lap (None uses circuit default)")
    filter_traffic: bool = Field(default=False, description="Exclude dirty air laps (<1.2s gap) from regression")
    track_evolution_factor: float = Field(default=0.008, description="Track evolution rubber-in factor in s/lap")

class ConstructorAnalysisRequest(BaseModel):
    session_key: int = Field(..., description="OpenF1 session key")
    team_name: str = Field(..., description="Target constructor name, e.g. 'Red Bull Racing'")
    benchmark_team_names: List[str] = Field(default=[], description="List of competitor constructor names")
    compounds: Optional[List[str]] = Field(default=None, description="Tyre compounds to filter by")
    apply_fuel_correction: bool = Field(default=True, description="Enable fuel weight correction")
    fuel_factor: Optional[float] = Field(default=None, description="Custom fuel factor in s/lap")
    filter_traffic: bool = Field(default=False, description="Exclude dirty air laps (<1.2s gap)")
    track_evolution_factor: float = Field(default=0.008, description="Track evolution rubber-in factor")
