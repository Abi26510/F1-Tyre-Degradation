import React from 'react';
import { Disc, Fuel, Wind, Info } from 'lucide-react';

interface CompoundFilterProps {
  selectedCompounds: string[];
  onToggleCompound: (compound: string) => void;
  applyFuelCorrection: boolean;
  onToggleFuelCorrection: (apply: boolean) => void;
  fuelFactor: number;
  onFuelFactorChange: (factor: number) => void;
  filterTraffic: boolean;
  onToggleFilterTraffic: (filter: boolean) => void;
}

const COMPOUNDS = [
  { id: 'SOFT', label: 'Soft', colorClass: 'border-red-500 text-red-400 bg-red-950/30' },
  { id: 'MEDIUM', label: 'Medium', colorClass: 'border-amber-400 text-amber-300 bg-amber-950/30' },
  { id: 'HARD', label: 'Hard', colorClass: 'border-slate-300 text-slate-200 bg-slate-800/40' },
];

export const CompoundFilter: React.FC<CompoundFilterProps> = ({
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
      {/* Compound Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Disc className="w-3.5 h-3.5 text-red-500" />
            Pirelli Compounds
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {selectedCompounds.length === 0 ? 'All' : `${selectedCompounds.length} active`}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {COMPOUNDS.map((c) => {
            const isSelected = selectedCompounds.length === 0 || selectedCompounds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => onToggleCompound(c.id)}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer text-center flex flex-col items-center gap-1 ${
                  isSelected
                    ? `${c.colorClass} shadow-sm font-black ring-1 ring-white/20`
                    : 'border-slate-800 bg-slate-950/50 text-slate-500 opacity-60 hover:opacity-90'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{
                  backgroundColor: c.id === 'SOFT' ? '#ef4444' : c.id === 'MEDIUM' ? '#f59e0b' : '#e5e7eb'
                }} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Correction Toggles */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <Fuel className="w-3.5 h-3.5 text-amber-500" />
          Feature Correction Engine
        </span>

        {/* Fuel Correction Toggle */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-200">Fuel Effect Correction</span>
              <div className="group relative cursor-help">
                <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-slate-800 text-[11px] text-slate-200 rounded shadow-lg border border-slate-700 z-50">
                  Adds back time gained as ~1.7kg of fuel burns per lap, exposing true tyre wear.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={applyFuelCorrection}
                onChange={(e) => onToggleFuelCorrection(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {applyFuelCorrection && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                <span>Fuel Sensitivity:</span>
                <span className="text-amber-400 font-bold">+{fuelFactor.toFixed(3)}s / lap</span>
              </div>
              <input
                type="range"
                min="0.025"
                max="0.070"
                step="0.005"
                value={fuelFactor}
                onChange={(e) => onFuelFactorChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Dirty Air Filter Toggle */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            <div>
              <span className="text-xs font-medium text-slate-200 block">Traffic Isolation</span>
              <span className="text-[10px] text-slate-500 block">Drop dirty air laps (&lt;1.2s gap)</span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filterTraffic}
              onChange={(e) => onToggleFilterTraffic(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
