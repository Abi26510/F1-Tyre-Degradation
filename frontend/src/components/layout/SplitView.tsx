import React from 'react';

interface SplitViewProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}

export const SplitView: React.FC<SplitViewProps> = ({ leftContent, rightContent }) => {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
            F1 Telemetry Analytics Platform
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="hidden sm:inline">Methodology: OLS Regression &amp; Fuel Invariance</span>
          <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-400 font-bold">
            Live Feed
          </span>
        </div>
      </header>

      {/* Split-Pane 2-Column Body */}
      <div className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        {/* Left Column: Fixed / Sticky Controls */}
        <div className="w-full lg:w-96 shrink-0 lg:sticky lg:top-20 lg:self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
          {leftContent}
        </div>

        {/* Right Column: Scrollable Visualizations & Strategy Outputs */}
        <div className="flex-1 min-w-0">
          {rightContent}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        F1 Tyre Degradation Analysis Platform • Fuel Normalization: Δt = RawLapTime + (Lap# × FuelFactor) − TrackDelta
      </footer>
    </div>
  );
};
