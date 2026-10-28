import React, { useState } from 'react';
import { PaceTimelinePoint } from '../../types/telemetry';
import { Activity, Clock } from 'lucide-react';
import { COMPOUND_COLORS } from '../../constants';

interface PaceTimelineProps {
  timeline: PaceTimelinePoint[];
  title: string;
}

export const PaceTimeline: React.FC<PaceTimelineProps> = ({ timeline, title }) => {
  const [hoveredLap, setHoveredLap] = useState<PaceTimelinePoint | null>(null);

  if (timeline.length === 0) {
    return null;
  }

  // Filter valid times
  const validPoints = timeline.filter((p) => p.corrected_lap_time && p.corrected_lap_time > 40 && p.corrected_lap_time < 180);
  if (validPoints.length === 0) return null;

  const maxLap = Math.max(...timeline.map((p) => p.lap_number));
  const times = validPoints.map((p) => p.corrected_lap_time!);
  const minTime = Math.floor(Math.min(...times) - 0.5);
  const maxTime = Math.ceil(Math.max(...times) + 1.0);

  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 40, left: 60 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const scaleX = (lap: number) => padding.left + (lap / (maxLap || 1)) * innerWidth;
  const scaleY = (time: number) =>
    padding.top + innerHeight - ((time - minTime) / (maxTime - minTime || 1)) * innerHeight;

  // Stint intervals
  const stints: { stint_number: number; compound: string; start: number; end: number }[] = [];
  let currentStint: any = null;

  for (const pt of timeline) {
    if (!currentStint || currentStint.stint_number !== pt.stint_number) {
      if (currentStint) stints.push(currentStint);
      currentStint = {
        stint_number: pt.stint_number,
        compound: pt.compound,
        start: pt.lap_number,
        end: pt.lap_number,
      };
    } else {
      currentStint.end = pt.lap_number;
    }
  }
  if (currentStint) stints.push(currentStint);

  // Build path segments grouped by stint
  const stintPaths = stints.map((stint) => {
    const stintPoints = validPoints.filter((p) => p.stint_number === stint.stint_number);
    if (stintPoints.length < 2) return null;

    const pathD = stintPoints.reduce((acc, pt, idx) => {
      const x = scaleX(pt.lap_number);
      const y = scaleY(pt.corrected_lap_time!);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    return {
      ...stint,
      pathD,
      color: COMPOUND_COLORS[stint.compound] || '#94a3b8',
    };
  });

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            {title}
          </h3>
          <p className="text-xs text-slate-400">
            Lap-by-lap pace trajectory highlighting pit stops, tyre compound degradation, and SC phases
          </p>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none font-sans"
          style={{ minWidth: '600px' }}
        >
          {/* Stint background bands */}
          {stints.map((stint, i) => {
            const x1 = scaleX(stint.start);
            const x2 = scaleX(stint.end);
            const w = Math.max(x2 - x1, 4);
            const isOdd = i % 2 === 1;

            return (
              <g key={`stint-band-${i}`}>
                <rect
                  x={x1}
                  y={padding.top}
                  width={w}
                  height={innerHeight}
                  fill={isOdd ? '#0f172a' : '#0b1329'}
                  fillOpacity="0.7"
                />
                <text
                  x={x1 + w / 2}
                  y={padding.top + 15}
                  fill="#64748b"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  STINT {stint.stint_number} ({stint.compound})
                </text>
              </g>
            );
          })}

          {/* Grid lines */}
          {[minTime, (minTime + maxTime) / 2, maxTime].map((tick, i) => {
            const y = scaleY(tick);
            return (
              <g key={`y-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="2 2"
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

          {/* Stint pace lines */}
          {stintPaths.map((sp, idx) => {
            if (!sp) return null;
            return (
              <path
                key={`line-${idx}`}
                d={sp.pathD}
                fill="none"
                stroke={sp.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Data Points / Pit Stops */}
          {validPoints.map((pt, i) => {
            const cx = scaleX(pt.lap_number);
            const cy = scaleY(pt.corrected_lap_time!);
            const isHovered = hoveredLap?.lap_number === pt.lap_number;

            return (
              <g key={`pt-${i}`}>
                {pt.is_pit_stop && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="7"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5.5 : pt.is_pit_stop ? 4 : 2.5}
                  fill={COMPOUND_COLORS[pt.compound] || '#ffffff'}
                  stroke={isHovered ? '#ffffff' : '#0f172a'}
                  strokeWidth="1"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredLap(pt)}
                  onMouseLeave={() => setHoveredLap(null)}
                />
              </g>
            );
          })}

          {/* X Axis Label */}
          <text
            x={width / 2}
            y={height - 8}
            fill="#94a3b8"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
          >
            Race Lap Progression (Lap 1 – {maxLap})
          </text>
        </svg>

        {/* Hover Tooltip */}
        {hoveredLap && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950/95 border border-slate-700 rounded-lg p-2.5 shadow-2xl text-xs space-y-1 font-mono backdrop-blur-md"
            style={{
              left: `${Math.min(scaleX(hoveredLap.lap_number) + 15, width - 180)}px`,
              top: `${scaleY(hoveredLap.corrected_lap_time!) - 60}px`,
            }}
          >
            <div className="font-bold text-white flex items-center justify-between border-b border-slate-800 pb-1">
              <span>Lap #{hoveredLap.lap_number}</span>
              <span className="text-amber-400 font-bold">{hoveredLap.compound}</span>
            </div>
            <div className="text-[11px] space-y-0.5">
              <div>Pace: {hoveredLap.corrected_lap_time?.toFixed(3)}s</div>
              <div>Tyre Age: {hoveredLap.tyre_age} laps</div>
              {hoveredLap.is_pit_stop && <div className="text-amber-400 font-bold">🏁 Pit Stop Lap</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
