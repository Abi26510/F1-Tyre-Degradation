import React, { useState } from 'react';
import { LapScatterPoint, StintSummary, CompoundMetric } from '../../types/telemetry';
import { TrendingUp, Layers, HelpCircle } from 'lucide-react';

interface ScatterDegradationProps {
  scatterLaps: LapScatterPoint[];
  stints: StintSummary[];
  compounds: Record<string, CompoundMetric>;
  title: string;
  showCorrected: boolean;
  onToggleCorrected: (val: boolean) => void;
  selectedTyreAge?: number | null;
  onSelectTyreAge?: (age: number | null) => void;
}

export const ScatterDegradation: React.FC<ScatterDegradationProps> = ({
  scatterLaps,
  stints,
  compounds,
  title,
  showCorrected,
  onToggleCorrected,
  selectedTyreAge,
  onSelectTyreAge,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<LapScatterPoint | null>(null);

  // Filter representative laps for cleaner scatter
  const validLaps = scatterLaps.filter(
    (l) => l.tyre_age !== undefined && !isNaN(l.tyre_age) && (showCorrected ? l.corrected_lap_time : l.raw_lap_time) > 40
  );

  if (validLaps.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        No representative laps recorded for the current filter criteria.
      </div>
    );
  }

  // Chart coordinate ranges
  const minAge = 0;
  const maxAge = Math.max(30, Math.ceil(Math.max(...validLaps.map((l) => l.tyre_age)) / 5) * 5);

  const times = validLaps.map((l) => (showCorrected ? l.corrected_lap_time : l.raw_lap_time));
  const minTime = Math.floor(Math.min(...times) - 0.5);
  const maxTime = Math.ceil(Math.max(...times) + 0.8);

  const width = 800;
  const height = 360;
  const padding = { top: 30, right: 30, bottom: 45, left: 60 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const scaleX = (age: number) => padding.left + (age / maxAge) * innerWidth;
  const scaleY = (time: number) =>
    padding.top + innerHeight - ((time - minTime) / (maxTime - minTime || 1)) * innerHeight;

  // Grid ticks
  const xTicks = Array.from({ length: Math.floor(maxAge / 5) + 1 }, (_, i) => i * 5);
  const yTicksCount = 5;
  const yTicks = Array.from({ length: yTicksCount + 1 }, (_, i) => {
    return minTime + ((maxTime - minTime) / yTicksCount) * i;
  });

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-xl relative space-y-4">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            {title}
          </h3>
          <p className="text-xs text-slate-400">
            Lap Time vs. Tyre Age with OLS wear slopes (<span className="text-amber-400 font-mono font-semibold">s / lap</span>)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onToggleCorrected(true)}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              showCorrected
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fuel-Corrected Pace
          </button>
          <button
            onClick={() => onToggleCorrected(false)}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              !showCorrected
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Raw Lap Time
          </button>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none font-sans"
          style={{ minWidth: '600px' }}
        >
          {/* Horizontal Grid lines */}
          {yTicks.map((tick, i) => {
            const y = scaleY(tick);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {tick.toFixed(1)}s
                </text>
              </g>
            );
          })}

          {/* Vertical Grid lines */}
          {xTicks.map((tick, i) => {
            const x = scaleX(tick);
            return (
              <g key={`x-${i}`}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 8}
            fill="#94a3b8"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
          >
            Tyre Age (Laps on current tyre compound)
          </text>

          <text
            x={-(height / 2)}
            y={18}
            transform="rotate(-90)"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
          >
            {showCorrected ? 'Fuel-Corrected Lap Time (s)' : 'Raw Lap Time (s)'}
          </text>

          {/* OLS Fitted Regression Trendlines */}
          {Object.entries(compounds).map(([compName, metric]) => {
            if (!metric.trendline || metric.trendline.length < 2) return null;
            const p1 = metric.trendline[0];
            const p2 = metric.trendline[1];
            const x1 = scaleX(p1.tyre_age);
            const y1 = scaleY(p1.fitted_lap_time);
            const x2 = scaleX(p2.tyre_age);
            const y2 = scaleY(p2.fitted_lap_time);

            return (
              <g key={`trend-${compName}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={metric.compound_color}
                  strokeWidth="2.5"
                  strokeOpacity="0.85"
                />
              </g>
            );
          })}

          {/* Highlight Selected Tyre Age Vertical Bar */}
          {selectedTyreAge && (
            <line
              x1={scaleX(selectedTyreAge)}
              y1={padding.top}
              x2={scaleX(selectedTyreAge)}
              y2={height - padding.bottom}
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Scatter Data Points */}
          {validLaps.map((lap, idx) => {
            const time = showCorrected ? lap.corrected_lap_time : lap.raw_lap_time;
            const cx = scaleX(lap.tyre_age);
            const cy = scaleY(time);
            const isHovered = hoveredPoint?.lap_number === lap.lap_number;

            return (
              <circle
                key={`lap-${idx}-${lap.lap_number}`}
                cx={cx}
                cy={cy}
                r={isHovered ? 6.5 : lap.is_representative ? 4 : 2.5}
                fill={lap.compound_color}
                fillOpacity={lap.is_dirty_air ? 0.35 : lap.is_representative ? 0.9 : 0.3}
                stroke={isHovered ? '#ffffff' : lap.is_dirty_air ? '#38bdf8' : '#0f172a'}
                strokeWidth={isHovered ? 2 : lap.is_dirty_air ? 1.5 : 0.8}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => {
                  setHoveredPoint(lap);
                  if (onSelectTyreAge) onSelectTyreAge(lap.tyre_age);
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950/95 border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs space-y-1 backdrop-blur-md"
            style={{
              left: `${Math.min(scaleX(hoveredPoint.tyre_age) + 15, width - 200)}px`,
              top: `${Math.max(scaleY(showCorrected ? hoveredPoint.corrected_lap_time : hoveredPoint.raw_lap_time) - 80, 10)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: hoveredPoint.compound_color }}
                />
                Lap #{hoveredPoint.lap_number}
              </span>
              <span className="font-mono text-slate-400">Stint {hoveredPoint.stint_number}</span>
            </div>
            <div className="font-mono space-y-0.5 text-[11px]">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Tyre Age:</span>
                <span className="text-white font-bold">{hoveredPoint.tyre_age} laps</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Corrected Pace:</span>
                <span className="text-amber-400 font-bold">{hoveredPoint.corrected_lap_time.toFixed(3)}s</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Raw Lap Time:</span>
                <span className="text-slate-300">{hoveredPoint.raw_lap_time.toFixed(3)}s</span>
              </div>
              {hoveredPoint.is_dirty_air && (
                <div className="text-blue-400 text-[10px] pt-1">
                  ⚠ Traffic Affected (Gap: {hoveredPoint.interval?.toFixed(2)}s)
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend and Degradation Slope Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
        {Object.entries(compounds).map(([compName, metric]) => (
          <div
            key={compName}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/80"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: metric.compound_color }}
              />
              <span className="text-xs font-bold text-white">{compName}</span>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-amber-400">
                +{metric.degradation_rate.toFixed(3)}s/lap
              </span>
              <span className="block text-[10px] text-slate-500">R² = {metric.r_squared.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
