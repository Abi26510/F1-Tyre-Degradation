import React from 'react';
import { User, Users, Check, Plus, X } from 'lucide-react';
import { ConstructorItem, DriverItem } from '../../types/telemetry';

interface EntitySelectProps {
  mode: 'driver' | 'constructor';
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
}

export const EntitySelect: React.FC<EntitySelectProps> = ({
  mode,
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
}) => {
  if (mode === 'driver') {
    const currentDriver = drivers.find((d) => d.driver_number === selectedDriverNumber);

    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-red-500" />
            Target Driver Selection
          </span>
        </div>

        {/* Primary Driver Picker */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-300 font-medium block">
            Focus Driver (Baseline)
          </label>
          <select
            value={selectedDriverNumber || ''}
            onChange={(e) => onDriverChange(Number(e.target.value))}
            className="w-full bg-slate-950 text-sm text-white border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-red-500 transition cursor-pointer hover:border-slate-600"
          >
            {drivers.map((d) => (
              <option key={d.driver_number} value={d.driver_number}>
                #{d.driver_number} {d.broadcast_name} ({d.team_name})
              </option>
            ))}
          </select>
        </div>

        {/* Driver Badge Preview */}
        {currentDriver && (
          <div className="flex items-center gap-3 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
            <div
              className="w-2.5 h-10 rounded-full"
              style={{ backgroundColor: currentDriver.team_colour ? `#${currentDriver.team_colour}` : '#ef4444' }}
            />
            <div className="flex-1 truncate">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{currentDriver.broadcast_name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  #{currentDriver.driver_number}
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate">{currentDriver.team_name}</div>
            </div>
            {currentDriver.headshot_url && (
              <img
                src={currentDriver.headshot_url}
                alt={currentDriver.broadcast_name}
                className="w-10 h-10 object-cover rounded-full bg-slate-800 border border-slate-700"
              />
            )}
          </div>
        )}

        {/* Comparison Drivers Multi-select */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-300 font-medium block">
              Compare Against Racers
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              {comparisonDrivers.length} selected
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {drivers
              .filter((d) => d.driver_number !== selectedDriverNumber)
              .map((d) => {
                const isSelected = comparisonDrivers.includes(d.driver_number);
                return (
                  <button
                    key={d.driver_number}
                    onClick={() => onToggleComparisonDriver(d.driver_number)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition cursor-pointer text-left truncate ${
                      isSelected
                        ? 'bg-red-950/40 border-red-500/80 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate">
                      <span className="font-mono text-[10px] text-slate-500 mr-1">#{d.driver_number}</span>
                      {d.name_acronym}
                    </span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    ) : (
                      <Plus className="w-3 h-3 text-slate-600 shrink-0" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  // Constructor Mode
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
      <div className="border-b border-slate-800 pb-2">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-red-500" />
          Constructor Team Selection
        </span>
      </div>

      {/* Target Constructor Picker */}
      <div className="space-y-1.5">
        <label className="text-xs text-slate-300 font-medium block">
          Primary Constructor (Baseline)
        </label>
        <select
          value={selectedTeamName || ''}
          onChange={(e) => onTeamChange(e.target.value)}
          className="w-full bg-slate-950 text-sm text-white border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-red-500 transition cursor-pointer hover:border-slate-600"
        >
          {constructors.map((c) => (
            <option key={c.team_name} value={c.team_name}>
              {c.team_name}
            </option>
          ))}
        </select>
      </div>

      {/* Benchmark Rival Teams */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-300 font-medium block">
            Compare Rival Constructors
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {benchmarkTeams.length} selected
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {constructors
            .filter((c) => c.team_name !== selectedTeamName)
            .map((c) => {
              const isSelected = benchmarkTeams.includes(c.team_name);
              return (
                <button
                  key={c.team_name}
                  onClick={() => onToggleBenchmarkTeam(c.team_name)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500/80 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.team_colour ? `#${c.team_colour}` : '#94a3b8' }}
                    />
                    <span className="truncate font-semibold">{c.team_name}</span>
                  </div>
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-600 shrink-0" />
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
