import React, { useState, useEffect } from 'react';
import { useSessionData } from './hooks/useSessionData';
import { useDegradationAnalysis } from './hooks/useDegradationAnalysis';
import { SplitView } from './components/layout/SplitView';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightContent } from './components/layout/RightContent';

export const App: React.FC = () => {
  const {
    year,
    setYear,
    sessions,
    selectedSessionKey,
    setSelectedSessionKey,
    selectedSession,
    drivers,
    constructors,
    loading: sessionsLoading,
  } = useSessionData();

  const [mode, setMode] = useState<'driver' | 'constructor'>('driver');
  const [selectedDriverNumber, setSelectedDriverNumber] = useState<number | null>(null);
  const [comparisonDrivers, setComparisonDrivers] = useState<number[]>([]);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [benchmarkTeams, setBenchmarkTeams] = useState<string[]>([]);
  const [selectedCompounds, setSelectedCompounds] = useState<string[]>([]);
  const [applyFuelCorrection, setApplyFuelCorrection] = useState<boolean>(true);
  const [fuelFactor, setFuelFactor] = useState<number>(0.045);
  const [filterTraffic, setFilterTraffic] = useState<boolean>(false);

  // Set default driver and comparisons when drivers load
  useEffect(() => {
    if (drivers.length > 0) {
      // Find Verstappen or driver #1 or first driver
      const defaultDriver = drivers.find((d) => d.driver_number === 1) || drivers[0];
      setSelectedDriverNumber(defaultDriver.driver_number);

      // Default comparison drivers: Alonso (14), Leclerc (16), Hamilton (44)
      const rivals = drivers
        .filter((d) => d.driver_number !== defaultDriver.driver_number)
        .slice(0, 2)
        .map((d) => d.driver_number);
      setComparisonDrivers(rivals);
    }
  }, [drivers]);

  // Set default constructor and competitors when constructors load
  useEffect(() => {
    if (constructors.length > 0) {
      const defaultTeam = constructors.find((c) => c.team_name === 'Red Bull Racing') || constructors[0];
      setSelectedTeamName(defaultTeam.team_name);

      const rivalTeams = constructors
        .filter((c) => c.team_name !== defaultTeam.team_name)
        .slice(0, 2)
        .map((c) => c.team_name);
      setBenchmarkTeams(rivalTeams);
    }
  }, [constructors]);

  // Toggle comparison driver
  const handleToggleComparisonDriver = (drvNum: number) => {
    setComparisonDrivers((prev) =>
      prev.includes(drvNum) ? prev.filter((d) => d !== drvNum) : [...prev, drvNum]
    );
  };

  // Toggle benchmark constructor
  const handleToggleBenchmarkTeam = (tName: string) => {
    setBenchmarkTeams((prev) =>
      prev.includes(tName) ? prev.filter((t) => t !== tName) : [...prev, tName]
    );
  };

  // Toggle tyre compound filter
  const handleToggleCompound = (comp: string) => {
    setSelectedCompounds((prev) =>
      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp]
    );
  };

  // Run tyre degradation analysis
  const { driverData, constructorData, loading: analysisLoading, error: analysisError } =
    useDegradationAnalysis({
      mode,
      sessionKey: selectedSessionKey,
      driverNumber: selectedDriverNumber,
      comparisonDrivers,
      teamName: selectedTeamName,
      benchmarkTeams,
      compounds: selectedCompounds,
      applyFuelCorrection,
      fuelFactor,
      filterTraffic,
    });

  return (
    <SplitView
      leftContent={
        <LeftSidebar
          year={year}
          onYearChange={setYear}
          sessions={sessions}
          selectedSessionKey={selectedSessionKey}
          onSessionChange={setSelectedSessionKey}
          sessionsLoading={sessionsLoading}
          mode={mode}
          onModeChange={setMode}
          drivers={drivers}
          constructors={constructors}
          selectedDriverNumber={selectedDriverNumber}
          onDriverChange={setSelectedDriverNumber}
          comparisonDrivers={comparisonDrivers}
          onToggleComparisonDriver={handleToggleComparisonDriver}
          selectedTeamName={selectedTeamName}
          onTeamChange={setSelectedTeamName}
          benchmarkTeams={benchmarkTeams}
          onToggleBenchmarkTeam={handleToggleBenchmarkTeam}
          selectedCompounds={selectedCompounds}
          onToggleCompound={handleToggleCompound}
          applyFuelCorrection={applyFuelCorrection}
          onToggleFuelCorrection={setApplyFuelCorrection}
          fuelFactor={fuelFactor}
          onFuelFactorChange={setFuelFactor}
          filterTraffic={filterTraffic}
          onToggleFilterTraffic={setFilterTraffic}
        />
      }
      rightContent={
        <RightContent
          mode={mode}
          driverData={driverData}
          constructorData={constructorData}
          loading={analysisLoading}
          error={analysisError}
          circuitName={selectedSession?.circuit_short_name}
        />
      }
    />
  );
};

export default App;
