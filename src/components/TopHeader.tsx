import React from 'react';
import { Search, Bell } from 'lucide-react';

interface TopHeaderProps {
  globalSearch: string;
  setGlobalSearch: (val: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  globalSearch,
  setGlobalSearch
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search everything /"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
            /
          </kbd>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1 right-1" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            DD
          </div>
          <span className="text-xs font-semibold text-slate-200 hidden sm:inline-block">Debojyoti Dey</span>
        </div>
      </div>
    </header>
  );
};
