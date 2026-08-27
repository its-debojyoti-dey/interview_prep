import React, { useState } from 'react';
import { NavSection, CategoryCardItem, GenericQuestion } from '../types/navigation';
import { 
  ChevronRight, 
  Search, 
  Plus, 
  X, 
  CheckCircle2, 
  Building2, 
  Map, 
  Code2, 
  Cpu, 
  UserCheck, 
  Globe, 
  Terminal, 
  Bot 
} from 'lucide-react';

interface CategoryViewProps {
  section: NavSection;
  globalSearch: string;
}

export const CategoryView: React.FC<CategoryViewProps> = ({ section, globalSearch }) => {
  const [searchTopic, setSearchTopic] = useState('');
  const [sortBy, setSortBy] = useState('a-z');
  const [selectedCategory, setSelectedCategory] = useState<CategoryCardItem | null>(null);

  // Persistence in LocalStorage for custom questions added by user
  const [customQuestions, setCustomQuestions] = useState<Record<string, GenericQuestion[]>>(() => {
    const saved = localStorage.getItem('interview_prep_custom_questions');
    return saved ? JSON.parse(saved) : {};
  });

  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [newQuestionCompany, setNewQuestionCompany] = useState('');
  const [newQuestionNotes, setNewQuestionNotes] = useState('');

  const getSectionTitle = () => {
    switch (section) {
      case 'dsa':
        return 'Data Structures & Algorithms';
      case 'lld':
        return 'Low Level Design';
      case 'behavioral':
        return 'Behavioral';
      case 'fullstack':
        return 'Full Stack Engineering';
      case 'devops':
        return 'DevOps & Infrastructure';
      case 'ai-engineer':
        return 'AI & Machine Learning Engineer';
      case 'companies':
        return 'Company-Specific Questions';
      case 'roadmaps':
        return 'Role-Specific Roadmaps';
      default:
        return 'Interview Prep';
    }
  };

  const getSectionIcon = () => {
    switch (section) {
      case 'dsa':
        return <Code2 className="w-5 h-5 text-indigo-400" />;
      case 'lld':
        return <Cpu className="w-5 h-5 text-teal-400" />;
      case 'behavioral':
        return <UserCheck className="w-5 h-5 text-amber-400" />;
      case 'fullstack':
        return <Globe className="w-5 h-5 text-blue-400" />;
      case 'devops':
        return <Terminal className="w-5 h-5 text-emerald-400" />;
      case 'ai-engineer':
        return <Bot className="w-5 h-5 text-purple-400" />;
      case 'companies':
        return <Building2 className="w-5 h-5 text-rose-400" />;
      case 'roadmaps':
        return <Map className="w-5 h-5 text-amber-400" />;
      default:
        return null;
    }
  };

  // Seed default category cards per section
  const getCategoryCards = (): CategoryCardItem[] => {
    switch (section) {
      case 'dsa':
        return [
          { id: 'dsa-top100', title: 'TechPrep 100', questionCount: 100, tags: ['Essential'] },
          { id: 'dsa-blind75', title: 'Blind 75', questionCount: 75, tags: ['Popular'] },
          { id: 'dsa-arrays', title: 'Arrays & Hashing', questionCount: 355 },
          { id: 'dsa-twopointers', title: 'Two Pointers', questionCount: 38 },
          { id: 'dsa-slidingwindow', title: 'Sliding Window', questionCount: 58 },
          { id: 'dsa-binarysearch', title: 'Binary Search', questionCount: 40 },
          { id: 'dsa-linkedlists', title: 'Linked Lists', questionCount: 46 },
          { id: 'dsa-trees', title: 'Trees & BST', questionCount: 120 },
          { id: 'dsa-stacks', title: 'Stacks', questionCount: 82 },
          { id: 'dsa-queues', title: 'Queues', questionCount: 27 },
          { id: 'dsa-graphs', title: 'Graphs & BFS/DFS', questionCount: 178 },
          { id: 'dsa-dp', title: 'Dynamic Programming', questionCount: 137 },
          { id: 'dsa-greedy', title: 'Greedy Algorithms', questionCount: 69 },
          { id: 'dsa-heaps', title: 'Heaps & Priority Queue', questionCount: 68 },
          { id: 'dsa-intervals', title: 'Intervals', questionCount: 16 },
          { id: 'dsa-matrix', title: 'Matrix 2D', questionCount: 73 },
          { id: 'dsa-math', title: 'Math & Geometry', questionCount: 105 },
          { id: 'dsa-bit', title: 'Bit Manipulation', questionCount: 50 },
          { id: 'dsa-tries', title: 'Tries', questionCount: 34 },
          { id: 'dsa-recursion', title: 'Recursion & Backtracking', questionCount: 39 },
          { id: 'dsa-sorting', title: 'Sorting Algorithms', questionCount: 71 },
          { id: 'dsa-searching', title: 'Search Algorithms', questionCount: 25 }
        ];
      case 'lld':
        return [
          { id: 'lld-parking', title: 'Parking Lot System', questionCount: 12 },
          { id: 'lld-elevator', title: 'Elevator Control System', questionCount: 10 },
          { id: 'lld-vending', title: 'Vending Machine', questionCount: 8 },
          { id: 'lld-movie', title: 'Movie Ticket Booking System', questionCount: 15 },
          { id: 'lld-snake', title: 'Snake & Ladder Game', questionCount: 6 },
          { id: 'lld-chess', title: 'Chess Game Engine', questionCount: 14 },
          { id: 'lld-lru', title: 'LRU Cache Design', questionCount: 9 },
          { id: 'lld-pubsub', title: 'Pub-Sub Messaging System', questionCount: 11 },
          { id: 'lld-rate', title: 'Rate Limiter (LLD)', questionCount: 7 },
          { id: 'lld-logging', title: 'Logging Framework', questionCount: 5 },
          { id: 'lld-splitwise', title: 'Expense Sharing (Splitwise)', questionCount: 16 }
        ];
      case 'behavioral':
        return [
          { id: 'beh-star', title: 'STAR Method Mastery', questionCount: 10 },
          { id: 'beh-leadership', title: 'Leadership & Initiative', questionCount: 15 },
          { id: 'beh-conflict', title: 'Conflict Resolution', questionCount: 12 },
          { id: 'beh-failure', title: 'Failure & Lessons Learned', questionCount: 9 },
          { id: 'beh-technical', title: 'Technical Decision Tradeoffs', questionCount: 18 },
          { id: 'beh-ownership', title: 'Ownership & Ambiguity', questionCount: 14 }
        ];
      case 'fullstack':
        return [
          { id: 'fs-react', title: 'React & Frontend Architecture', questionCount: 45 },
          { id: 'fs-node', title: 'Node.js & Backend APIs', questionCount: 38 },
          { id: 'fs-db', title: 'Database Indexing & SQL vs NoSQL', questionCount: 30 },
          { id: 'fs-security', title: 'Web Security (OAuth2, CORS, XSS, CSRF)', questionCount: 22 },
          { id: 'fs-perf', title: 'Web Performance Optimization (LCP, Bundle)', questionCount: 19 }
        ];
      case 'devops':
        return [
          { id: 'dev-docker', title: 'Docker Containers & Networking', questionCount: 25 },
          { id: 'dev-k8s', title: 'Kubernetes Architecture & Helm', questionCount: 35 },
          { id: 'dev-cicd', title: 'CI/CD Pipelines & GitHub Actions', questionCount: 20 },
          { id: 'dev-terraform', title: 'Terraform & Infrastructure as Code', questionCount: 28 },
          { id: 'dev-monitoring', title: 'Observability (Prometheus, Grafana)', questionCount: 18 }
        ];
      case 'ai-engineer':
        return [
          { id: 'ai-llm', title: 'LLM Fine-Tuning & RAG Architecture', questionCount: 30 },
          { id: 'ai-vector', title: 'Vector Databases & Embeddings', questionCount: 22 },
          { id: 'ai-agents', title: 'Autonomous AI Agents & Tool Calling', questionCount: 25 },
          { id: 'ai-eval', title: 'LLM Evaluation & Guardrails', questionCount: 16 }
        ];
      case 'companies':
        return [
          { id: 'comp-meta', title: 'Meta (Facebook)', questionCount: 120 },
          { id: 'comp-google', title: 'Google', questionCount: 150 },
          { id: 'comp-amazon', title: 'Amazon', questionCount: 180 },
          { id: 'comp-apple', title: 'Apple', questionCount: 95 },
          { id: 'comp-netflix', title: 'Netflix', questionCount: 60 },
          { id: 'comp-microsoft', title: 'Microsoft', questionCount: 110 }
        ];
      case 'roadmaps':
        return [
          { id: 'rm-backend', title: 'Senior Backend Engineer Roadmap', questionCount: 12 },
          { id: 'rm-system', title: 'System Design Master Roadmap', questionCount: 15 },
          { id: 'rm-frontend', title: 'Frontend Specialist Roadmap', questionCount: 10 },
          { id: 'rm-devops', title: 'DevOps & Cloud Architect Roadmap', questionCount: 14 }
        ];
      default:
        return [];
    }
  };

  const cards = getCategoryCards();

  // Filter cards by search inputs
  const filteredCards = cards.filter((card) => {
    const q = (searchTopic || globalSearch).toLowerCase().trim();
    if (!q) return true;
    return card.title.toLowerCase().includes(q);
  });

  // Sort cards
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === 'a-z') return a.title.localeCompare(b.title);
    return b.questionCount - a.questionCount;
  });

  const handleAddQuestion = (categoryId: string) => {
    if (!newQuestionTitle.trim()) return;

    const newQ: GenericQuestion = {
      id: `q_${Date.now()}`,
      title: newQuestionTitle.trim(),
      difficulty: newQuestionDifficulty,
      company: newQuestionCompany.trim() || undefined,
      notes: newQuestionNotes.trim() || undefined,
      completed: false
    };

    const updated = {
      ...customQuestions,
      [categoryId]: [...(customQuestions[categoryId] || []), newQ]
    };

    setCustomQuestions(updated);
    localStorage.setItem('interview_prep_custom_questions', JSON.stringify(updated));

    setNewQuestionTitle('');
    setNewQuestionCompany('');
    setNewQuestionNotes('');
  };

  const handleToggleQuestionComplete = (categoryId: string, questionId: string) => {
    const categoryQs = customQuestions[categoryId] || [];
    const updatedQs = categoryQs.map((q) =>
      q.id === questionId ? { ...q, completed: !q.completed } : q
    );
    const updated = { ...customQuestions, [categoryId]: updatedQs };
    setCustomQuestions(updated);
    localStorage.setItem('interview_prep_custom_questions', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Category Heading & Guide Banner matching Raycast design */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          {getSectionIcon()}
          <span>{getSectionTitle()}</span>
        </h1>

        {/* Guide banner card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors cursor-pointer group">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
              T
            </div>
            <p className="text-xs font-semibold text-slate-200">
              How to Pass {getSectionTitle()} Interviews in 2026
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search topics"
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-colors"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
        >
          <option value="a-z">A - Z</option>
          <option value="count">Most Questions</option>
        </select>
      </div>

      {/* Cards Grid matching Raycast layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sortedCards.map((card) => {
          const userAddedCount = (customQuestions[card.id] || []).length;
          const totalCount = card.questionCount + userAddedCount;

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCategory(card)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/80 transition-all cursor-pointer group"
            >
              <div className="space-y-1 min-w-0 pr-2">
                <h3 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {totalCount} Questions
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors flex-shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Category Questions Modal for adding/viewing questions */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-6 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedCategory.title}</h2>
                <p className="text-xs text-slate-400">
                  Manage & study questions for {selectedCategory.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Custom Question Form */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <p className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Add New Question for Future Prep
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Question Title (e.g. Reverse a Linked List)"
                  value={newQuestionTitle}
                  onChange={(e) => setNewQuestionTitle(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                />
                <div className="flex gap-2">
                  <select
                    value={newQuestionDifficulty}
                    onChange={(e) => setNewQuestionDifficulty(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Company (e.g. Meta)"
                    value={newQuestionCompany}
                    onChange={(e) => setNewQuestionCompany(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <textarea
                placeholder="Key concepts / notes / code solution snippet..."
                value={newQuestionNotes}
                onChange={(e) => setNewQuestionNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />

              <button
                onClick={() => handleAddQuestion(selectedCategory.id)}
                disabled={!newQuestionTitle.trim()}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  newQuestionTitle.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Save Question
              </button>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Questions List ({(customQuestions[selectedCategory.id] || []).length} Custom)
              </p>

              {(customQuestions[selectedCategory.id] || []).length > 0 ? (
                (customQuestions[selectedCategory.id] || []).map((q) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 transition-colors ${
                      q.completed ? 'bg-slate-950 border-emerald-500/30' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleQuestionComplete(selectedCategory.id, q.id)}
                          className="text-slate-500 hover:text-emerald-400"
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${q.completed ? 'text-emerald-400 fill-emerald-400/20' : ''}`}
                          />
                        </button>
                        <span className={`font-semibold ${q.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {q.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 font-mono text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded border ${
                          q.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-500/30' :
                          q.difficulty === 'Medium' ? 'text-amber-400 border-amber-500/30' :
                          'text-rose-400 border-rose-500/30'
                        }`}>
                          {q.difficulty}
                        </span>
                        {q.company && (
                          <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            {q.company}
                          </span>
                        )}
                      </div>
                    </div>
                    {q.notes && (
                      <p className="text-[11px] text-slate-400 pl-6 leading-relaxed bg-slate-900 p-2 rounded mt-1">
                        {q.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">
                  No custom questions added yet for {selectedCategory.title}. Use the form above to add questions as you prepare!
                </p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
