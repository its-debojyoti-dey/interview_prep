import React from 'react';
import { AiEngineerQuestion } from '../types/aiEngineer';
import { X, CheckCircle2, Bookmark, ArrowLeft, Code2, Bot, Sparkles, Lightbulb } from 'lucide-react';

interface AiEngineerDetailModalProps {
  question: AiEngineerQuestion;
  isCompleted: boolean;
  isFlagged: boolean;
  onToggleCompleted: (id: string) => void;
  onToggleFlagged: (id: string) => void;
  onClose: () => void;
}

export const AiEngineerDetailModal: React.FC<AiEngineerDetailModalProps> = ({
  question,
  isCompleted,
  isFlagged,
  onToggleCompleted,
  onToggleFlagged,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 flex flex-col font-sans">
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
                <h1 className="text-base font-bold text-white tracking-tight">{question.title}</h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {question.category}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Completed Toggle */}
            <button
              onClick={() => onToggleCompleted(question.id)}
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
              onClick={() => onToggleFlagged(question.id)}
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
      </div>

      {/* Main Content Body */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-slate-200">
        
        {/* Simple Explanation */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Simple Concept Explanation (Basic to Advanced)
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {question.answer.simpleExplanation}
          </div>
        </section>

        {/* Key Takeaway Concepts */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Key Engineering Takeaways
          </h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
            {question.answer.keyConcepts.map((concept, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-purple-400 font-bold">•</span>
                <span>{concept}</span>
              </div>
            ))}
          </div>
        </section>

        {/* JavaScript / Node.js Framework Code Example */}
        {question.answer.jsExampleCode && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                JavaScript & Framework Implementation (LangChain.js / Node.js SDK)
              </h3>
              <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-teal-300 border border-slate-800">
                TypeScript / Node.js
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto">
              <pre>{question.answer.jsExampleCode}</pre>
            </div>
          </section>
        )}

        {/* Real-World Scenario */}
        {question.answer.realWorldScenario && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Real-World Production Scenario
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
              {question.answer.realWorldScenario}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
