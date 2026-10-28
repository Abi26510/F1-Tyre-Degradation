import React from 'react';
import { StrategicDiagnostic } from '../../types/telemetry';
import { ShieldCheck, Flame, Wind, Gauge, AlertTriangle, Sparkles } from 'lucide-react';

interface WearFactorCardProps {
  diagnostic?: StrategicDiagnostic;
  primaryName: string;
}

export const WearFactorCard: React.FC<WearFactorCardProps> = ({ diagnostic, primaryName }) => {
  if (!diagnostic) return null;

  const isPrimaryBetter = diagnostic.better_preserver === primaryName;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Engineering Strategic Diagnostic
          </span>
          <h3 className="text-lg font-black text-white mt-0.5">
            What Makes the Other Team's Tyres Last Longer?
          </h3>
          <p className="text-xs text-slate-400">
            Why tyre strategy cost time: Aerodynamic, thermal, and traffic mechanics behind compound longevity
          </p>
        </div>

        {/* Longevity Badge */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Superior Preserver:</span>
          <span className="font-bold text-emerald-400">{diagnostic.better_preserver}</span>
        </div>
      </div>

      {/* Primary Verdict Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Strategic Verdict & Stint Deficit
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {diagnostic.verdict}
            </p>
          </div>
        </div>

        {/* Degradation Delta Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 font-mono text-center">
          <div className="p-2 bg-slate-900 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase">Compound</span>
            <span className="text-xs font-bold text-white">{diagnostic.compound_analyzed}</span>
          </div>
          <div className="p-2 bg-slate-900 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase">Wear Delta</span>
            <span className="text-xs font-bold text-amber-400">
              +{Math.abs(diagnostic.degradation_delta).toFixed(3)}s / lap
            </span>
          </div>
          <div className="p-2 bg-slate-900 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase">Stint Deficit (20 Laps)</span>
            <span className="text-xs font-bold text-red-400">
              -{diagnostic.stint_loss_seconds.toFixed(2)}s
            </span>
          </div>
          <div className="p-2 bg-slate-900 rounded-lg">
            <span className="text-[10px] text-slate-500 block uppercase">Longevity Advantage</span>
            <span className="text-xs font-bold text-emerald-400">
              ~{Math.round(diagnostic.stint_loss_seconds / 0.15)} Laps Longer
            </span>
          </div>
        </div>
      </div>

      {/* The 4 Underlying Mechanical Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {diagnostic.factors.map((factor, idx) => {
          const icons = [
            <Gauge className="w-4 h-4 text-cyan-400" />,
            <Flame className="w-4 h-4 text-orange-400" />,
            <Wind className="w-4 h-4 text-blue-400" />,
            <ShieldCheck className="w-4 h-4 text-emerald-400" />,
          ];

          return (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {icons[idx % icons.length]}
                  {factor.title}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                  {factor.impact}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {factor.explanation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
