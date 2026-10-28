import React from 'react';
import { User, Users } from 'lucide-react';

interface ModeToggleProps {
  mode: 'driver' | 'constructor';
  onModeChange: (mode: 'driver' | 'constructor') => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-lg flex gap-1 backdrop-blur-sm">
      <button
        onClick={() => onModeChange('driver')}
        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
          mode === 'driver'
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-bold'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        Individual Driver
      </button>

      <button
        onClick={() => onModeChange('constructor')}
        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
          mode === 'constructor'
            ? 'bg-red-600 text-white shadow-md shadow-red-600/30 font-bold'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        Constructor Team
      </button>
    </div>
  );
};
