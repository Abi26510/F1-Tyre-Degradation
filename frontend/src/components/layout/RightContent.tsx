import React, { useState } from 'react';
import {
  ConstructorAnalysisResponse,
  DriverAnalysisResponse,
} from '../../types/telemetry';
import { ScatterDegradation } from '../charts/ScatterDegradation';
import { PaceTimeline } from '../charts/PaceTimeline';
import { CompoundDeltaBar } from '../charts/CompoundDeltaBar';
import { StrategySummary } from '../insights/StrategySummary';
import { WearFactorCard } from '../insights/WearFactorCard';
import {
  Clock,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  Sliders,
} from 'lucide-react';

interface RightContentProps {
  mode: 'driver' | 'constructor';
  driverData: DriverAnalysisResponse | null;
  constructorData: ConstructorAnalysisResponse | null;
  loading: boolean;
  error: string | null;
  circuitName?: string;
}

export const RightContent: React.FC<RightContentProps> = ({
  mode,
  driverData,
  constructorData,
  loading,
  error,
  circuitName,
}) => {
  const [showCorrected, setShowCorrected] = useState<boolean>(true);
  const [selectedTyreAge, setSelectedTyreAge] = useState<number | null>(14);

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800 rounded-2xl min-h-[500px] text-center space-y-4">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        <div>
          <h3 className="text-base font-bold text-white">Analyzing Tyre Telemetry</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Fetching laps, calculating fuel-corrected wear slopes, and isolating traffic dirty air...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-red-900/40 rounded-2xl min-h-[500px] text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h3 className="text-base font-bold text-white">Analysis Data Unavailable</h3>
        <p className="text-xs text-red-300 max-w-md font-mono">{error}</p>
      </main>
    );
  }

  // Driver Mode Content
  if (mode === 'driver' && driverData) {
    const dInfo = driverData.driver_info;
    const stints = driverData.stints;
    const compounds = driverData.compounds;
    const avgDeg =
      Object.values(compounds).length > 0
        ? Object.values(compounds).reduce((acc, c) => acc + c.degradation_rate, 0) /
          Object.values(compounds).length
        : 0;

    return (
      <main className="flex-1 space-y-6">
        {/* KPI Output Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl">
          {/* Driver Identifier */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Driver Focus
            </span>
            <div className="text-sm font-black text-white truncate">
              {dInfo.broadcast_name || `Driver #${dInfo.driver_number}`}
            </div>
            <div className="text-xs text-slate-400 truncate font-semibold">
              {dInfo.team_name}
            </div>
          </div>

          {/* Tyre Age Highlight */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                Tyre Age Selected
              </span>
              <Sliders className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-sm font-black text-cyan-400 font-mono">
              {selectedTyreAge !== null ? `${selectedTyreAge} laps` : 'All Laps'}
            </div>
            <input
              type="range"
              min="1"
              max="35"
              value={selectedTyreAge || 14}
              onChange={(e) => setSelectedTyreAge(Number(e.target.value))}
              className="w-full h-1 accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Average Degradation Rate */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Avg Wear Rate
            </span>
            <div className="text-sm font-black text-amber-400 font-mono">
              +{avgDeg.toFixed(3)}s / lap
            </div>
            <div className="text-[11px] text-slate-400">
              {showCorrected ? 'Fuel-Corrected' : 'Raw Lap Pace'}
            </div>
          </div>

          {/* Stints & Clean Laps */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Stints Run
            </span>
            <div className="text-sm font-black text-white font-mono">
              {stints.length} Stints
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {driverData.scatter_laps.filter((l) => l.is_representative).length} clean laps
            </div>
          </div>
        </div>

        {/* 1. Scatter Degradation Plot */}
        <ScatterDegradation
          scatterLaps={driverData.scatter_laps}
          stints={stints}
          compounds={compounds}
          title={`Tyre Degradation Slope — ${dInfo.broadcast_name} (${circuitName || 'Grand Prix'})`}
          showCorrected={showCorrected}
          onToggleCorrected={setShowCorrected}
          selectedTyreAge={selectedTyreAge}
          onSelectTyreAge={setSelectedTyreAge}
        />

        {/* 2. Visualisations of Pace Throughout Race */}
        <PaceTimeline
          timeline={driverData.pace_timeline}
          title={`Race Pace Trajectory Timeline — ${dInfo.broadcast_name}`}
        />

        {/* 3. Compound Delta Bar Comparison */}
        <CompoundDeltaBar
          primaryTitle={dInfo.broadcast_name}
          primaryCompounds={compounds}
          comparisons={driverData.comparisons.map((c) => ({
            name: `${c.broadcast_name} (${c.team_name})`,
            code: c.driver_code,
            color: c.team_colour ? `#${c.team_colour}` : undefined,
            compounds: c.compounds,
          }))}
        />

        {/* 4. Strategy Stint Summary Table */}
        <StrategySummary stints={stints} crossovers={driverData.crossover_points} />

        {/* 5. Strategic Diagnostic: What Makes Other Teams' Tyres Last Longer? */}
        <WearFactorCard
          diagnostic={driverData.why_others_last_longer}
          primaryName={dInfo.broadcast_name}
        />
      </main>
    );
  }

  // Constructor Mode Content
  if (mode === 'constructor' && constructorData) {
    const stints = constructorData.stints;
    const compounds = constructorData.compounds;
    const avgDeg =
      Object.values(compounds).length > 0
        ? Object.values(compounds).reduce((acc, c) => acc + c.degradation_rate, 0) /
          Object.values(compounds).length
        : 0;

    return (
      <main className="flex-1 space-y-6">
        {/* KPI Output Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Constructor Focus
            </span>
            <div className="text-sm font-black text-white truncate flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: constructorData.team_color }}
              />
              {constructorData.team_name}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {constructorData.drivers.map((d) => d.code).join(' & ')}
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Compound Slopes
            </span>
            <div className="text-sm font-black text-cyan-400 font-mono">
              {Object.keys(compounds).join(' • ') || 'N/A'}
            </div>
            <div className="text-[11px] text-slate-400">Team Fleet Average</div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Team Avg Wear Rate
            </span>
            <div className="text-sm font-black text-amber-400 font-mono">
              +{avgDeg.toFixed(3)}s / lap
            </div>
            <div className="text-[11px] text-slate-400">
              {showCorrected ? 'Fuel-Corrected' : 'Raw Lap Pace'}
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
              Rival Constructors
            </span>
            <div className="text-sm font-black text-white font-mono">
              {constructorData.competitor_comparisons.length} Rivals
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Cross-Team Deltas</div>
          </div>
        </div>

        {/* 1. Scatter Plot */}
        <ScatterDegradation
          scatterLaps={constructorData.scatter_laps}
          stints={stints}
          compounds={compounds}
          title={`Constructor Tyre Degradation — ${constructorData.team_name} (${circuitName || 'Grand Prix'})`}
          showCorrected={showCorrected}
          onToggleCorrected={setShowCorrected}
          selectedTyreAge={selectedTyreAge}
          onSelectTyreAge={setSelectedTyreAge}
        />

        {/* 2. Pace Timeline */}
        <PaceTimeline
          timeline={constructorData.pace_timeline}
          title={`Constructor Pace Trajectory — ${constructorData.team_name}`}
        />

        {/* 3. Compound Delta Bar Comparison */}
        <CompoundDeltaBar
          primaryTitle={constructorData.team_name}
          primaryCompounds={compounds}
          comparisons={constructorData.competitor_comparisons.map((c) => ({
            name: c.team_name,
            code: c.team_name.slice(0, 3).toUpperCase(),
            color: c.team_colour,
            compounds: c.compounds,
          }))}
        />

        {/* 4. Strategy Stint Summary Table */}
        <StrategySummary stints={stints} />

        {/* 5. Strategic Diagnostic: What Makes Other Teams' Tyres Last Longer? */}
        <WearFactorCard
          diagnostic={constructorData.why_others_last_longer}
          primaryName={constructorData.team_name}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800 rounded-2xl min-h-[500px] text-center text-slate-400">
      Please select a valid Grand Prix session and driver/constructor from the sidebar to begin analysis.
    </main>
  );
};
