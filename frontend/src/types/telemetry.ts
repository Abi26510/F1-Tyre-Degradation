export interface SessionItem {
  session_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  circuit_key?: number;
  circuit_short_name: string;
  country_name: string;
  location: string;
  year: number;
}

export interface DriverItem {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour?: string;
  headshot_url?: string;
}

export interface ConstructorItem {
  team_name: string;
  team_colour: string;
  drivers: {
    driver_number: number;
    broadcast_name: string;
    name_acronym: string;
    headshot_url?: string;
  }[];
}

export interface LapScatterPoint {
  lap_number: number;
  tyre_age: number;
  raw_lap_time: number;
  corrected_lap_time: number;
  stint_number: number;
  compound: string;
  compound_color: string;
  driver_number: number;
  driver_code: string;
  team_name: string;
  is_representative: boolean;
  is_dirty_air: boolean;
  interval?: number;
}

export interface TrendlinePoint {
  tyre_age: number;
  fitted_lap_time: number;
}

export interface StintSummary {
  stint_number: number;
  compound: string;
  compound_color: string;
  total_laps: number;
  representative_laps: number;
  traffic_laps: number;
  start_tyre_age: number;
  end_tyre_age: number;
  mean_raw_pace?: number;
  mean_corrected_pace?: number;
  degradation_rate: number;
  raw_degradation_rate: number;
  base_pace_intercept: number;
  r_squared: number;
  trendline: TrendlinePoint[];
}

export interface CompoundMetric {
  compound: string;
  compound_color: string;
  total_laps: number;
  degradation_rate: number;
  raw_degradation_rate: number;
  base_pace: number;
  r_squared: number;
  mean_pace?: number;
  trendline: TrendlinePoint[];
}

export interface PaceTimelinePoint {
  lap_number: number;
  raw_lap_time?: number;
  corrected_lap_time?: number;
  driver_code: string;
  team_name: string;
  compound: string;
  stint_number: number;
  tyre_age: number;
  is_pit_stop: boolean;
  is_sc_vsc: boolean;
  is_dirty_air: boolean;
}

export interface StrategicDiagnostic {
  compound_analyzed: string;
  primary_degradation: number;
  benchmark_degradation: number;
  degradation_delta: number;
  better_preserver: string;
  stint_loss_seconds: number;
  verdict: string;
  factors: {
    title: string;
    impact: string;
    explanation: string;
  }[];
}

export interface DriverAnalysisResponse {
  driver_info: DriverItem;
  compounds: Record<string, CompoundMetric>;
  stints: StintSummary[];
  scatter_laps: LapScatterPoint[];
  pace_timeline: PaceTimelinePoint[];
  crossover_points: {
    compound_pair: string;
    crossover_tyre_age: number;
    description: string;
  }[];
  comparisons: {
    driver_number: number;
    driver_code: string;
    broadcast_name: string;
    team_name: string;
    team_colour: string;
    compounds: Record<string, CompoundMetric>;
    stints: StintSummary[];
    traffic_percentage: number;
  }[];
  why_others_last_longer?: StrategicDiagnostic;
}

export interface ConstructorAnalysisResponse {
  team_name: string;
  team_color: string;
  drivers: {
    number: number;
    name: string;
    code: string;
    headshot?: string;
  }[];
  compounds: Record<string, CompoundMetric>;
  stints: StintSummary[];
  scatter_laps: LapScatterPoint[];
  pace_timeline: PaceTimelinePoint[];
  competitor_comparisons: {
    team_name: string;
    team_colour: string;
    compounds: Record<string, CompoundMetric>;
    traffic_percentage: number;
    drivers: { name: string; code: string }[];
  }[];
  why_others_last_longer?: StrategicDiagnostic;
}
