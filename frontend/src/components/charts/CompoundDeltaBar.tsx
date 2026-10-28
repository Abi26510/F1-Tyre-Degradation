import React from 'react';
import { BarChart3, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { CompoundMetric } from '../../types/telemetry';

interface CompoundDeltaBarProps {
  primaryTitle: string;
  primaryCompounds: Record<string, CompoundMetric>;
  comparisons?: {
    name: string;
    code: string;
    color?: string;
    compounds: Record<string, CompoundMetric>;
  }[];
}

export const CompoundDeltaBar: React.FC<CompoundDeltaBarProps> = ({
  primaryTitle,
  primaryCompounds,
  comparisons = [],
}) => {
  const compoundsList = ['SOFT', 'MEDIUM', 'HARD'];

  // Check if any compound exists
  const hasData = Object.keys(primaryCompounds).length > 0;
  if (!hasData) return null;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Compound Degradation Rate Comparison
          </h3>
          <p className="text-xs text-slate-400">
            Pace loss per lap (<span className="text-amber-400 font-mono">s / lap</span>). Lower is better (flatter tyre life).
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {compoundsList.map((comp) => {
          const prim = primaryCompounds[comp];
          if (!prim && !comparisons.some((c) => c.compounds[comp])) return null;

          const primRate = prim ? prim.degradation_rate : null;

          return (
            <div key={comp} className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2 text-white">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: prim?.compound_color || '#94a3b8' }}
                  />
                  {comp} Compound
                </span>
                {primRate !== null && (
                  <span className="font-mono text-xs font-bold text-amber-400">
                    Baseline: +{primRate.toFixed(3)}s/lap
                  </span>
                )}
              </div>

              {/* Bars Comparison Grid */}
              <div className="space-y-2 pt-1">
                {/* Primary Entity Bar */}
                {prim && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-semibold text-white">{primaryTitle}</span>
                      <span className="font-mono font-bold text-amber-400">+{prim.degradation_rate.toFixed(3)}s/lap</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.max((prim.degradation_rate / 0.20) * 100, 5), 100)}%`,
                          backgroundColor: prim.compound_color,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Rival Entities Bars */}
                {comparisons.map((rival) => {
                  const rComp = rival.compounds[comp];
                  if (!rComp) return null;

                  const delta = primRate !== null ? rComp.degradation_rate - primRate : 0;
                  const isBetter = delta < 0;

                  return (
                    <div key={rival.name} className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="font-medium text-slate-400 flex items-center gap-1.5">
                          <span>{rival.name}</span>
                          <span
                            className={`text-[10px] font-mono px-1 rounded flex items-center ${
                              isBetter ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                            }`}
                          >
                            {isBetter ? (
                              <ArrowDownRight className="w-3 h-3 inline mr-0.5" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 inline mr-0.5" />
                            )}
                            {Math.abs(delta).toFixed(3)}s
                          </span>
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          +{rComp.degradation_rate.toFixed(3)}s/lap
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(Math.max((rComp.degradation_rate / 0.20) * 100, 5), 100)}%`,
                            backgroundColor: rival.color || '#94a3b8',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
