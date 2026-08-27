import React, { useState } from 'react';
import { allAiEngineerQuestions, allAiEngineerGroups } from '../data/aiEngineerTopics';
import { AiEngineerQuestion } from '../types/aiEngineer';
import { AiEngineerCard } from './AiEngineerCard';
import { AiEngineerDetailModal } from './AiEngineerDetailModal';
import { Bot, Search, Bookmark, CheckCircle2, ChevronRight, SearchX, Filter } from 'lucide-react';

interface AiEngineerMainViewProps {
  globalSearch: string;
}

export const AiEngineerMainView: React.FC<AiEngineerMainViewProps> = ({ globalSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);
  const [filterCompletedOnly, setFilterCompletedOnly] = useState(false);

  // Persistence in LocalStorage
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('interview_prep_ai_completed');
    return saved ? JSON.parse(saved) : [];
  });

  const [flaggedIds, setFlaggedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('interview_prep_ai_flagged');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedQuestion, setSelectedQuestion] = useState<AiEngineerQuestion | null>(null);

  const handleToggleCompleted = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('interview_prep_ai_completed', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleFlagged = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFlaggedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('interview_prep_ai_flagged', JSON.stringify(updated));
      return updated;
    });
  };

  // Filter questions by Category, Difficulty, Search Query, and Toggles
  const filteredQuestions = allAiEngineerQuestions.filter((q) => {
    const query = (searchQuery || globalSearch).toLowerCase().trim();
    if (query) {
      const titleMatch = q.title.toLowerCase().includes(query);
      const summaryMatch = q.summary.toLowerCase().includes(query);
      const catMatch = q.category.toLowerCase().includes(query);
      if (!titleMatch && !summaryMatch && !catMatch) return false;
    }

    if (selectedCategory !== 'All' && q.category !== selectedCategory) {
      return false;
    }

    if (selectedDifficulty !== 'All' && q.difficulty !== selectedDifficulty) {
      return false;
    }

    if (filterFlaggedOnly && !flaggedIds.includes(q.id)) {
      return false;
    }

    if (filterCompletedOnly && !completedIds.includes(q.id)) {
      return false;
    }

    return true;
  });

  const percentCompleted = Math.round((completedIds.length / (allAiEngineerQuestions.length || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-purple-400" />
          <span>AI Engineer Curriculum & Interview Questions</span>
        </h1>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <p className="text-xs font-semibold text-slate-200">
              How to Pass AI Engineering Interviews in 2026 (LLMs, RAG, Agents, Fine-Tuning, MCP & Vector DBs)
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
        </div>
      </div>

      {/* 4 Core Category Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allAiEngineerGroups.map((group) => {
          const isSelected = selectedCategory === group.questions[0]?.category;
          return (
            <div
              key={group.id}
              onClick={() => setSelectedCategory(isSelected ? 'All' : group.questions[0]?.category || 'All')}
              className={`bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-purple-500 bg-purple-950/20'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{group.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {group.questionCount} Qs
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {group.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3 md:space-y-0">
        
        {/* Left Side: Status & Difficulty Filters */}
        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          
          {/* Difficulty Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
            {['All', 'Basic', 'Intermediate', 'Advanced'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff === 'All' ? 'All Difficulties' : diff}
              </button>
            ))}
          </div>

          <button
            onClick={() => setFilterFlaggedOnly(!filterFlaggedOnly)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              filterFlaggedOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${flaggedIds.length > 0 ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>Flagged ({flaggedIds.length})</span>
          </button>

          <button
            onClick={() => setFilterCompletedOnly(!filterCompletedOnly)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              filterCompletedOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed ({completedIds.length}/{allAiEngineerQuestions.length})</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
              {percentCompleted}%
            </span>
          </button>
        </div>

        {/* Right Side: Search and Category Dropdown */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-600"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Autonomous AI Agents & Tool Calling">AI Agents & Tool Calling</option>
            <option value="LLM Evaluation & Guardrails">Evaluation & Guardrails</option>
            <option value="LLM Fine-Tuning & RAG Architecture">RAG & Fine-Tuning</option>
            <option value="Vector Databases & Embeddings">Vector Databases</option>
          </select>
        </div>
      </div>

      {/* Questions Grid */}
      {filteredQuestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuestions.map((q) => (
            <AiEngineerCard
              key={q.id}
              question={q}
              isCompleted={completedIds.includes(q.id)}
              isFlagged={flaggedIds.includes(q.id)}
              onToggleCompleted={handleToggleCompleted}
              onToggleFlagged={handleToggleFlagged}
              onSelectQuestion={(item) => setSelectedQuestion(item)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
          <SearchX className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-200">No matching AI Engineer questions found</h3>
          <p className="text-xs text-slate-400">
            Try clearing filters or adjusting your difficulty/category selection.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedDifficulty('All');
              setFilterFlaggedOnly(false);
              setFilterCompletedOnly(false);
            }}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedQuestion && (
        <AiEngineerDetailModal
          question={selectedQuestion}
          isCompleted={completedIds.includes(selectedQuestion.id)}
          isFlagged={flaggedIds.includes(selectedQuestion.id)}
          onToggleCompleted={handleToggleCompleted}
          onToggleFlagged={handleToggleFlagged}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  );
};
