import React from 'react';
import { SessionPicker } from '../controls/SessionPicker';
import { ModeToggle } from '../controls/ModeToggle';
import { EntitySelect } from '../controls/EntitySelect';
import { CompoundFilter } from '../controls/CompoundFilter';
import { ConstructorItem, DriverItem, SessionItem } from '../../types/telemetry';
import { Disc, Zap } from 'lucide-react';

interface LeftSidebarProps {
  year: number;
  onYearChange: (year: number) => void;
  sessions: SessionItem[];
  selectedSessionKey: number | null;
  onSessionChange: (sessionKey: number) => void;
  sessionsLoading: boolean;

  mode: 'driver' | 'constructor';
  onModeChange: (mode: 'driver' | 'constructor') => void;

  drivers: DriverItem[];
  constructors: ConstructorItem[];
  selectedDriverNumber: number | null;
  onDriverChange: (driverNumber: number) => void;
  comparisonDrivers: number[];
  onToggleComparisonDriver: (driverNumber: number) => void;

  selectedTeamName: string | null;
  onTeamChange: (teamName: string) => void;
  benchmarkTeams: string[];
  onToggleBenchmarkTeam: (teamName: string) => void;

  selectedCompounds: string[];
  onToggleCompound: (compound: string) => void;

  applyFuelCorrection: boolean;
  onToggleFuelCorrection: (apply: boolean) => void;
  fuelFactor: number;
  onFuelFactorChange: (factor: number) => void;

  filterTraffic: boolean;
  onToggleFilterTraffic: (filter: boolean) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  year,
  onYearChange,
  sessions,
  selectedSessionKey,
  onSessionChange,
  sessionsLoading,
  mode,
  onModeChange,
  drivers,
  constructors,
  selectedDriverNumber,
  onDriverChange,
  comparisonDrivers,
  onToggleComparisonDriver,
  selectedTeamName,
  onTeamChange,
  benchmarkTeams,
  onToggleBenchmarkTeam,
  selectedCompounds,
  onToggleCompound,
  applyFuelCorrection,
  onToggleFuelCorrection,
  fuelFactor,
  onFuelFactorChange,
  filterTraffic,
  onToggleFilterTraffic,
}) => {
  return (
    <aside className="w-full lg:w-96 shrink-0 space-y-4">
      {/* Branding Header */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-800 rounded-xl p-4 shadow-xl text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center border border-white/20">
            <Disc className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider uppercase leading-none">
              F1 Tyre Degradation
            </h1>
            <span className="text-[11px] text-red-100/80 font-mono tracking-tight">
              Strategy & Telemetry Analyzer
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-mono font-bold border border-white/10">
          <Zap className="w-3 h-3 text-amber-400" />
          v1.0
        </div>
      </div>

      {/* Mode Switcher */}
      <ModeToggle mode={mode} onModeChange={onModeChange} />

      {/* Session & GP Circuit Picker */}
      <SessionPicker
        year={year}
        onYearChange={onYearChange}
        sessions={sessions}
        selectedSessionKey={selectedSessionKey}
        onSessionChange={onSessionChange}
        loading={sessionsLoading}
      />

      {/* Driver or Constructor Picker */}
      <EntitySelect
        mode={mode}
        drivers={drivers}
        constructors={constructors}
        selectedDriverNumber={selectedDriverNumber}
        onDriverChange={onDriverChange}
        comparisonDrivers={comparisonDrivers}
        onToggleComparisonDriver={onToggleComparisonDriver}
        selectedTeamName={selectedTeamName}
        onTeamChange={onTeamChange}
        benchmarkTeams={benchmarkTeams}
        onToggleBenchmarkTeam={onToggleBenchmarkTeam}
      />

      {/* Compounds and Feature Correction Toggles */}
      <CompoundFilter
        selectedCompounds={selectedCompounds}
        onToggleCompound={onToggleCompound}
        applyFuelCorrection={applyFuelCorrection}
        onToggleFuelCorrection={onToggleFuelCorrection}
        fuelFactor={fuelFactor}
        onFuelFactorChange={onFuelFactorChange}
        filterTraffic={filterTraffic}
        onToggleFilterTraffic={onToggleFilterTraffic}
      />
    </aside>
  );
};
