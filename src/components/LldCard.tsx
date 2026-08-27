import React from 'react';
import { LldTopic } from '../types/lld';
import { BookOpen, FileText, Bookmark, CheckCircle2, Building2 } from 'lucide-react';

interface LldCardProps {
  topic: LldTopic;
  isCompleted: boolean;
  isFlagged: boolean;
  onToggleCompleted: (id: string, e: React.MouseEvent) => void;
  onToggleFlagged: (id: string, e: React.MouseEvent) => void;
  onSelectTopic: (topic: LldTopic) => void;
}

export const LldCard: React.FC<LldCardProps> = ({
  topic,
  isCompleted,
  isFlagged,
  onToggleCompleted,
  onToggleFlagged,
  onSelectTopic
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div
      onClick={() => onSelectTopic(topic)}
      className={`group relative bg-slate-900 border rounded-xl p-4 transition-all duration-150 cursor-pointer ${
        isCompleted
          ? 'border-emerald-500/40 bg-slate-900/60'
          : isFlagged
          ? 'border-amber-500/40'
          : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Checkbox & Title */}
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <button
            onClick={(e) => onToggleCompleted(topic.id, e)}
            className="mt-0.5 transition-transform active:scale-95 text-slate-500 hover:text-emerald-400 focus:outline-none"
            title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            ) : (
              <div className="w-4 h-4 rounded border border-slate-700 hover:border-emerald-500 transition-colors" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className={`text-sm font-bold tracking-tight transition-colors ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-100 group-hover:text-teal-300'
              }`}>
                {topic.title}
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getDifficultyBadge(topic.difficulty)}`}>
                {topic.difficulty}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                #{topic.frequencyRank}
              </span>
            </div>

            {/* Feature Sub-Badges matching requested format: Problem Statement · Editorial Solution */}
            <div className="flex items-center space-x-2.5 mt-2 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-teal-400">
                <FileText className="w-3 h-3" />
                Problem Statement
              </span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1 text-indigo-400">
                <BookOpen className="w-3 h-3" />
                Editorial Solution
              </span>
            </div>
          </div>
        </div>

        {/* Right Bookmark Toggle */}
        <button
          onClick={(e) => onToggleFlagged(topic.id, e)}
          className={`p-1.5 rounded-md border transition-colors ${
            isFlagged
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
              : 'text-slate-600 hover:text-slate-300 border-transparent hover:border-slate-800'
          }`}
          title={isFlagged ? 'Unflag' : 'Flag'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Companies Pills */}
      {topic.editorial.companies && topic.editorial.companies.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
          <Building2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <div className="flex items-center gap-1">
            {topic.editorial.companies.map((company, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
