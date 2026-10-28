import React from 'react';
import { StintSummary } from '../../types/telemetry';
import { Layers, GitCommit, ArrowRight } from 'lucide-react';

interface StrategySummaryProps {
  stints: StintSummary[];
  crossovers?: {
    compound_pair: string;
    crossover_tyre_age: number;
    description: string;
  }[];
}

export const StrategySummary: React.FC<StrategySummaryProps> = ({ stints, crossovers = [] }) => {
  if (stints.length === 0) return null;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Tyre Stint Strategy & Longevity Summary
          </h3>
          <p className="text-xs text-slate-400">
            Stint-by-stint degradation slopes, tyre age progression, and representative laps
          </p>
        </div>
      </div>

      {/* Stints Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
              <th className="py-2.5 px-3">Stint</th>
              <th className="py-2.5 px-3">Compound</th>
              <th className="py-2.5 px-3">Laps</th>
              <th className="py-2.5 px-3">Tyre Age</th>
              <th className="py-2.5 px-3">Mean Pace</th>
              <th className="py-2.5 px-3">Wear Slope (s/lap)</th>
              <th className="py-2.5 px-3">Confidence (R²)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {stints.map((s) => (
              <tr key={s.stint_number} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-3 font-bold text-white">Stint #{s.stint_number}</td>
                <td className="py-3 px-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold"
                    style={{
                      backgroundColor: `${s.compound_color}22`,
                      color: s.compound_color,
                      border: `1px solid ${s.compound_color}44`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: s.compound_color }}
                    />
                    {s.compound}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-300">
                  {s.total_laps} laps <span className="text-slate-500 text-[10px]">({s.representative_laps} rep)</span>
                </td>
                <td className="py-3 px-3 text-slate-300">
                  {s.start_tyre_age} <ArrowRight className="w-3 h-3 inline text-slate-500 mx-0.5" /> {s.end_tyre_age}
                </td>
                <td className="py-3 px-3 text-slate-200 font-semibold">
                  {s.mean_corrected_pace ? `${s.mean_corrected_pace.toFixed(2)}s` : '—'}
                </td>
                <td className="py-3 px-3 font-bold text-amber-400">
                  +{s.degradation_rate.toFixed(3)}s / lap
                </td>
                <td className="py-3 px-3 text-slate-400">
                  {s.r_squared.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Crossover points if available */}
      {crossovers.length > 0 && (
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wide">
            <GitCommit className="w-3.5 h-3.5" />
            Compound Crossover Pit Windows
          </div>
          <div className="space-y-1.5">
            {crossovers.map((c, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-xs text-slate-300 space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-cyan-300">
                  <span>{c.compound_pair}</span>
                  <span className="font-mono bg-cyan-900/60 px-2 py-0.5 rounded text-[11px]">
                    Crossover at Tyre Age: {c.crossover_tyre_age} laps
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
