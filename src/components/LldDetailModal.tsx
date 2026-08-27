import React, { useState } from 'react';
import { LldTopic } from '../types/lld';
import { X, BookOpen, HelpCircle, CheckCircle2, Bookmark, ArrowLeft, Code2, Layers, Cpu } from 'lucide-react';

interface LldDetailModalProps {
  topic: LldTopic;
  isCompleted: boolean;
  isFlagged: boolean;
  onToggleCompleted: (id: string) => void;
  onToggleFlagged: (id: string) => void;
  onClose: () => void;
}

export const LldDetailModal: React.FC<LldDetailModalProps> = ({
  topic,
  isCompleted,
  isFlagged,
  onToggleCompleted,
  onToggleFlagged,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'solution' | 'quiz'>('solution');
  const [selectedLangIdx, setSelectedLangIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submitted[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuestion = (questionId: string) => {
    if (selectedAnswers[questionId] !== undefined) {
      setSubmitted((prev) => ({ ...prev, [questionId]: true }));
    }
  };

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
                <h1 className="text-base font-bold text-white tracking-tight">{topic.title}</h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  {topic.category}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  #{topic.frequencyRank}
                </span>
              </div>
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
            onClick={() => setActiveTab('solution')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
              activeTab === 'solution'
                ? 'bg-teal-600 text-white border-teal-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Problem Statement & Solution
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Quiz ({topic.quiz.length})
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'solution' ? (
          <div className="space-y-8 max-w-4xl mx-auto text-slate-200">
            
            {/* Overview & Problem Statement */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-400" />
                Problem Statement & Overview
              </h2>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {topic.editorial.problemStatement}
              </div>
            </section>

            {/* Design Patterns Applied */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Object-Oriented Design Patterns Applied
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {topic.editorial.designPatterns.map((pat, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
                    <h4 className="text-xs font-bold text-indigo-300">{pat.name}</h4>
                    <p className="text-xs text-slate-400">{pat.rationale}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* OOD Class Diagram ASCII */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Class Diagram (UML Structure)
              </h3>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto">
                <pre>{topic.editorial.classDiagram}</pre>
              </div>
            </section>

            {/* Object Oriented Code Implementation */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Code Implementation
                </h3>
                {/* Language Switcher Tabs */}
                <div className="flex items-center space-x-1.5">
                  {topic.editorial.codeImplementation.map((codeObj, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedLangIdx(i)}
                      className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition-colors ${
                        selectedLangIdx === i
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {codeObj.language}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs text-slate-200 p-4 overflow-x-auto">
                <pre>{topic.editorial.codeImplementation[selectedLangIdx]?.code || ''}</pre>
              </div>
            </section>

            {/* Tradeoffs & Edge Cases */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                Tradeoffs & Multi-Threading Considerations
              </h3>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                {topic.editorial.tradeoffs.map((t, idx) => (
                  <p key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{t}</span>
                  </p>
                ))}
              </div>
            </section>

          </div>
        ) : (
          /* Quiz View */
          <div className="max-w-3xl mx-auto space-y-6 text-slate-200">
            {topic.quiz.map((q, qIndex) => {
              const isSelected = selectedAnswers[q.id] !== undefined;
              const isSub = submitted[q.id];
              const isCorrect = isSub && selectedAnswers[q.id] === q.correctAnswerIndex;

              return (
                <div
                  key={q.id}
                  className={`bg-slate-900 border rounded-xl p-5 space-y-3 transition-all ${
                    isSub
                      ? isCorrect
                        ? 'border-emerald-500/40'
                        : 'border-rose-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded bg-slate-950 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-800">
                      {qIndex + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100">{q.question}</h3>
                  </div>

                  <div className="space-y-2 pl-7">
                    {q.options.map((opt, optIdx) => {
                      const chosen = selectedAnswers[q.id] === optIdx;
                      let optStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/80';

                      if (isSub) {
                        if (optIdx === q.correctAnswerIndex) {
                          optStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold';
                        } else if (chosen && !isCorrect) {
                          optStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold';
                        } else {
                          optStyle = 'bg-slate-950 border-slate-900 text-slate-500 opacity-60';
                        }
                      } else if (chosen) {
                        optStyle = 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={isSub}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${optStyle}`}
                        >
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pl-7 pt-1">
                    {!isSub ? (
                      <button
                        disabled={!isSelected}
                        onClick={() => handleSubmitQuestion(q.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-teal-600 hover:bg-teal-500 text-white'
                            : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        Check Answer
                      </button>
                    ) : (
                      <div
                        className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                            : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                        }`}
                      >
                        <p className="font-bold mb-1">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                        <p className="text-slate-300">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
