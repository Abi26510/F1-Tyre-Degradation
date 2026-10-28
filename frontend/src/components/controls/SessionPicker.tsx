import React from 'react';
import { Calendar, MapPin, Flag } from 'lucide-react';
import { SessionItem } from '../../types/telemetry';

interface SessionPickerProps {
  year: number;
  onYearChange: (year: number) => void;
  sessions: SessionItem[];
  selectedSessionKey: number | null;
  onSessionChange: (sessionKey: number) => void;
  loading: boolean;
}

export const SessionPicker: React.FC<SessionPickerProps> = ({
  year,
  onYearChange,
  sessions,
  selectedSessionKey,
  onSessionChange,
  loading,
}) => {
  const currentSession = sessions.find((s) => s.session_key === selectedSessionKey);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-red-500" />
          Season & Grand Prix
        </span>
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="bg-slate-800 text-xs text-white border border-slate-700 rounded-md px-2.5 py-1 focus:outline-none focus:border-red-500 font-mono cursor-pointer hover:bg-slate-750 transition"
        >
          <option value={2024}>2024 Season</option>
          <option value={2023}>2023 Season</option>
          <option value={2022}>2022 Season</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-slate-300 font-medium block flex items-center justify-between">
          <span>Grand Prix Circuit</span>
          {loading && <span className="text-[10px] text-amber-400 animate-pulse">Loading races...</span>}
        </label>
        <select
          value={selectedSessionKey || ''}
          onChange={(e) => onSessionChange(Number(e.target.value))}
          disabled={loading || sessions.length === 0}
          className="w-full bg-slate-950 text-sm text-white border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-red-500 transition cursor-pointer hover:border-slate-600 disabled:opacity-50"
        >
          {sessions.map((s) => (
            <option key={s.session_key} value={s.session_key}>
              {s.country_name} — {s.circuit_short_name} ({s.location})
            </option>
          ))}
        </select>
      </div>

      {currentSession && (
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-300">
          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-white">{currentSession.circuit_short_name}</span>
            <span className="text-slate-400"> • {currentSession.country_name}</span>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {new Date(currentSession.date_start).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
