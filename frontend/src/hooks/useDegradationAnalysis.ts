import { useEffect, useState } from 'react';
import {
  ConstructorAnalysisResponse,
  DriverAnalysisResponse,
} from '../types/telemetry';
import { analyzeConstructor, analyzeDriver } from '../services/api';

export function useDegradationAnalysis({
  mode,
  sessionKey,
  driverNumber,
  comparisonDrivers,
  teamName,
  benchmarkTeams,
  compounds,
  applyFuelCorrection,
  fuelFactor,
  filterTraffic,
}: {
  mode: 'driver' | 'constructor';
  sessionKey: number | null;
  driverNumber: number | null;
  comparisonDrivers: number[];
  teamName: string | null;
  benchmarkTeams: string[];
  compounds: string[];
  applyFuelCorrection: boolean;
  fuelFactor: number;
  filterTraffic: boolean;
}) {
  const [driverData, setDriverData] = useState<DriverAnalysisResponse | null>(null);
  const [constructorData, setConstructorData] = useState<ConstructorAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionKey) return;
    let mounted = true;

    async function runAnalysis() {
      try {
        setLoading(true);
        setError(null);

        if (mode === 'driver') {
          if (!driverNumber) return;
          const data = await analyzeDriver({
            session_key: sessionKey!,
            driver_number: driverNumber,
            comparison_drivers: comparisonDrivers,
            compounds: compounds.length > 0 ? compounds : undefined,
            apply_fuel_correction: applyFuelCorrection,
            fuel_factor: fuelFactor,
            filter_traffic: filterTraffic,
          });
          if (mounted) {
            setDriverData(data);
            setConstructorData(null);
          }
        } else {
          if (!teamName) return;
          const data = await analyzeConstructor({
            session_key: sessionKey!,
            team_name: teamName,
            benchmark_team_names: benchmarkTeams,
            compounds: compounds.length > 0 ? compounds : undefined,
            apply_fuel_correction: applyFuelCorrection,
            fuel_factor: fuelFactor,
            filter_traffic: filterTraffic,
          });
          if (mounted) {
            setConstructorData(data);
            setDriverData(null);
          }
        }
      } catch (err: any) {
        if (mounted) {
          console.error('Analysis error:', err);
          setError(err.message || 'Failed to compute tyre degradation analysis');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    runAnalysis();
    return () => {
      mounted = false;
    };
  }, [
    mode,
    sessionKey,
    driverNumber,
    JSON.stringify(comparisonDrivers),
    teamName,
    JSON.stringify(benchmarkTeams),
    JSON.stringify(compounds),
    applyFuelCorrection,
    fuelFactor,
    filterTraffic,
  ]);

  return {
    driverData,
    constructorData,
    loading,
    error,
  };
}
