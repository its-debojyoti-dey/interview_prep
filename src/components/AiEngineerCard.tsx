import React from 'react';
import { AiEngineerQuestion } from '../types/aiEngineer';
import { Bot, Code2, Bookmark, CheckCircle2, Building2 } from 'lucide-react';

interface AiEngineerCardProps {
  question: AiEngineerQuestion;
  isCompleted: boolean;
  isFlagged: boolean;
  onToggleCompleted: (id: string, e: React.MouseEvent) => void;
  onToggleFlagged: (id: string, e: React.MouseEvent) => void;
  onSelectQuestion: (question: AiEngineerQuestion) => void;
}

export const AiEngineerCard: React.FC<AiEngineerCardProps> = ({
  question,
  isCompleted,
  isFlagged,
  onToggleCompleted,
  onToggleFlagged,
  onSelectQuestion
}) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Basic':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Advanced':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div
      onClick={() => onSelectQuestion(question)}
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
            onClick={(e) => onToggleCompleted(question.id, e)}
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
                isCompleted ? 'line-through text-slate-400' : 'text-slate-100 group-hover:text-purple-300'
              }`}>
                {question.title}
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getDifficultyBadge(question.difficulty)}`}>
                {question.difficulty}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {question.summary}
            </p>

            {/* Feature Sub-Badges */}
            <div className="flex items-center space-x-2.5 mt-2.5 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1 text-purple-400">
                <Bot className="w-3 h-3" />
                AI Architecture
              </span>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1 text-teal-400">
                <Code2 className="w-3 h-3" />
                JS/TS Example Code
              </span>
            </div>
          </div>
        </div>

        {/* Right Bookmark Toggle */}
        <button
          onClick={(e) => onToggleFlagged(question.id, e)}
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

      {/* Source Tag */}
      {question.source && (
        <div className="mt-3 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-400">
          <Building2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span>Source: <strong className="text-slate-300">{question.source}</strong></span>
        </div>
      )}
    </div>
  );
};
