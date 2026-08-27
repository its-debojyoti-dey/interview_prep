import React from 'react';
import { Search, Bookmark, CheckCircle2, Layers } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  filterFlaggedOnly: boolean;
  setFilterFlaggedOnly: (val: boolean) => void;
  filterCompletedOnly: boolean;
  setFilterCompletedOnly: (val: boolean) => void;
  flaggedCount: number;
  completedCount: number;
  totalTopics: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  filterFlaggedOnly,
  setFilterFlaggedOnly,
  filterCompletedOnly,
  setFilterCompletedOnly,
  flaggedCount,
  completedCount,
  totalTopics
}) => {
  const percentCompleted = Math.round((completedCount / (totalTopics || 1)) * 100);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-900">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-white tracking-tight">InterviewPrep</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                System Design
              </span>
            </div>
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                DD
              </div>
              <div className="text-xs">
                <span className="font-semibold text-slate-200 block">Debojyoti Dey</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Controls Row */}
        <div className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setFilterFlaggedOnly(!filterFlaggedOnly)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                filterFlaggedOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${flaggedCount > 0 ? 'text-amber-400 fill-amber-400' : ''}`} />
              <span>Flagged ({flaggedCount})</span>
            </button>

            <button
              onClick={() => setFilterCompletedOnly(!filterCompletedOnly)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                filterCompletedOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Completed ({completedCount}/{totalTopics})</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                {percentCompleted}%
              </span>
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search topics or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
            >
              <option value="frequency">Most Frequently Asked</option>
              <option value="title">Alphabetical (A-Z)</option>
              <option value="difficulty">Difficulty Level</option>
            </select>
          </div>

        </div>
      </div>
    </header>
  );
};
