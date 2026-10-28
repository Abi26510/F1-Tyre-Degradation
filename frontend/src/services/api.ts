import {
  ConstructorAnalysisResponse,
  ConstructorItem,
  DriverAnalysisResponse,
  DriverItem,
  SessionItem,
} from '../types/telemetry';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export async function fetchSessions(year: number = 2024): Promise<SessionItem[]> {
  try {
    const res = await fetch(`${API_BASE}/sessions?year=${year}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch sessions, trying fallback 2023:', err);
    const fallback = await fetch(`${API_BASE}/sessions?year=2023`);
    return await fallback.json();
  }
}

export async function fetchDrivers(sessionKey: number): Promise<DriverItem[]> {
  const res = await fetch(`${API_BASE}/sessions/${sessionKey}/drivers`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchConstructors(sessionKey: number): Promise<ConstructorItem[]> {
  const res = await fetch(`${API_BASE}/sessions/${sessionKey}/constructors`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function analyzeDriver(payload: {
  session_key: number;
  driver_number: number;
  comparison_drivers: number[];
  compounds?: string[];
  apply_fuel_correction: boolean;
  fuel_factor?: number;
  filter_traffic: boolean;
}): Promise<DriverAnalysisResponse> {
  const res = await fetch(`${API_BASE}/analysis/driver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Driver analysis failed: ${err}`);
  }
  return await res.json();
}

export async function analyzeConstructor(payload: {
  session_key: number;
  team_name: string;
  benchmark_team_names: string[];
  compounds?: string[];
  apply_fuel_correction: boolean;
  fuel_factor?: number;
  filter_traffic: boolean;
}): Promise<ConstructorAnalysisResponse> {
  const res = await fetch(`${API_BASE}/analysis/constructor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Constructor analysis failed: ${err}`);
  }
  return await res.json();
}
