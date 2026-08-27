import React, { useState } from 'react';
import { SystemDesignTopic } from '../types/systemDesign';
import { EditorialView } from './EditorialView';
import { QuizView } from './QuizView';
import { WhiteboardView } from './WhiteboardView';
import { X, BookOpen, HelpCircle, MonitorPlay, CheckCircle2, Bookmark, ArrowLeft } from 'lucide-react';

interface TopicDetailModalProps {
  topic: SystemDesignTopic;
  isCompleted: boolean;
  isFlagged: boolean;
  onToggleCompleted: (id: string) => void;
  onToggleFlagged: (id: string) => void;
  onClose: () => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  isCompleted,
  isFlagged,
  onToggleCompleted,
  onToggleFlagged,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'editorial' | 'quiz' | 'whiteboard'>('editorial');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 flex flex-col">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-tight">{topic.title}</h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {topic.category}
                </span>
              </div>
              {topic.subtitle && (
                <p className="text-xs text-slate-400">{topic.subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Completed Toggle */}
            <button
              onClick={() => onToggleCompleted(topic.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-400 fill-emerald-400/20' : ''}`} />
              {isCompleted ? 'Completed' : 'Mark Completed'}
            </button>

            {/* Bookmark Toggle */}
            <button
              onClick={() => onToggleFlagged(topic.id)}
              className={`p-1.5 rounded-lg border transition-all ${
                isFlagged
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title={isFlagged ? 'Unflag' : 'Flag'}
            >
              <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="max-w-7xl mx-auto flex items-center space-x-3 mt-3 pt-2 border-t border-slate-900">
          <button
            onClick={() => setActiveTab('editorial')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
              activeTab === 'editorial'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Editorial Solution
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
              activeTab === 'quiz'
                ? 'bg-teal-600 text-white border-teal-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Quiz ({topic.quiz.length})
          </button>

          <button
            onClick={() => setActiveTab('whiteboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
              activeTab === 'whiteboard'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            AI Whiteboard
          </button>
        </div>
      </div>

      {/* Main Tab View Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'editorial' && <EditorialView editorial={topic.editorial} />}
        {activeTab === 'quiz' && <QuizView questions={topic.quiz} />}
        {activeTab === 'whiteboard' && (
          <WhiteboardView nodes={topic.whiteboard.nodes} connections={topic.whiteboard.connections} />
        )}
      </div>
    </div>
  );
};
