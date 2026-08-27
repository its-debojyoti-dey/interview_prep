import { useState, useEffect } from 'react';
import { NavSection } from './types/navigation';
import { SystemDesignTopic } from './types/systemDesign';
import { LldTopic } from './types/lld';
import { allSystemDesignTopics } from './data/topics';
import { allLldTopics } from './data/lldTopics';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { TopicCard } from './components/TopicCard';
import { TopicDetailModal } from './components/TopicDetailModal';
import { LldCard } from './components/LldCard';
import { LldDetailModal } from './components/LldDetailModal';
import { CategoryView } from './components/CategoryView';
import { ResumeEditor } from './components/ResumeEditor';
import { AiEngineerMainView } from './components/AiEngineerMainView';
import { Bookmark, CheckCircle2, ChevronRight, Layers, SearchX, Cpu } from 'lucide-react';

export function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('system-design');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // System Design filters
  const [sdSearchQuery, setSdSearchQuery] = useState<string>('');
  const [sdSortBy, setSdSortBy] = useState<string>('frequency');
  const [sdFilterFlaggedOnly, setSdFilterFlaggedOnly] = useState<boolean>(false);
  const [sdFilterCompletedOnly, setSdFilterCompletedOnly] = useState<boolean>(false);

  // LLD filters
  const [lldSearchQuery, setLldSearchQuery] = useState<string>('');
  const [lldSortBy, setLldSortBy] = useState<string>('frequency');
  const [lldFilterFlaggedOnly, setLldFilterFlaggedOnly] = useState<boolean>(false);
  const [lldFilterCompletedOnly, setLldFilterCompletedOnly] = useState<boolean>(false);

  // System Design persistence
  const [sdCompletedIds, setSdCompletedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('interview_prep_completed');
    return saved ? JSON.parse(saved) : [];
  });

  const [sdFlaggedIds, setSdFlaggedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('interview_prep_flagged');
    return saved ? JSON.parse(saved) : [];
  });

  // LLD persistence
  const [lldCompletedIds, setLldCompletedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('interview_prep_lld_completed');
    return saved ? JSON.parse(saved) : [];
  });

  const [lldFlaggedIds, setLldFlaggedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('interview_prep_lld_flagged');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedSdTopic, setSelectedSdTopic] = useState<SystemDesignTopic | null>(null);
  const [selectedLldTopic, setSelectedLldTopic] = useState<LldTopic | null>(null);

  useEffect(() => {
    localStorage.setItem('interview_prep_completed', JSON.stringify(sdCompletedIds));
  }, [sdCompletedIds]);

  useEffect(() => {
    localStorage.setItem('interview_prep_flagged', JSON.stringify(sdFlaggedIds));
  }, [sdFlaggedIds]);

  useEffect(() => {
    localStorage.setItem('interview_prep_lld_completed', JSON.stringify(lldCompletedIds));
  }, [lldCompletedIds]);

  useEffect(() => {
    localStorage.setItem('interview_prep_lld_flagged', JSON.stringify(lldFlaggedIds));
  }, [lldFlaggedIds]);

  // System Design toggles
  const handleToggleSdCompleted = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSdCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSdFlagged = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSdFlaggedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // LLD toggles
  const handleToggleLldCompleted = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLldCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleLldFlagged = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLldFlaggedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter System Design topics
  const filteredSdTopics = allSystemDesignTopics.filter((topic) => {
    const query = (sdSearchQuery || globalSearch).trim().toLowerCase();
    if (query) {
      const titleMatch = topic.title.toLowerCase().includes(query);
      const subMatch = topic.subtitle?.toLowerCase().includes(query);
      const catMatch = topic.category.toLowerCase().includes(query);
      const compMatch = topic.editorial.companies.some((c) => c.toLowerCase().includes(query));
      if (!titleMatch && !subMatch && !catMatch && !compMatch) {
        return false;
      }
    }

    if (sdFilterFlaggedOnly && !sdFlaggedIds.includes(topic.id)) {
      return false;
    }

    if (sdFilterCompletedOnly && !sdCompletedIds.includes(topic.id)) {
      return false;
    }

    return true;
  });

  const sortedSdTopics = [...filteredSdTopics].sort((a, b) => {
    if (sdSortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sdSortBy === 'difficulty') {
      const diffOrder: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
      return (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2);
    }
    return a.frequencyRank - b.frequencyRank;
  });

  // Filter LLD topics
  const filteredLldTopics = allLldTopics.filter((topic) => {
    const query = (lldSearchQuery || globalSearch).trim().toLowerCase();
    if (query) {
      const titleMatch = topic.title.toLowerCase().includes(query);
      const catMatch = topic.category.toLowerCase().includes(query);
      const compMatch = topic.editorial.companies.some((c) => c.toLowerCase().includes(query));
      if (!titleMatch && !catMatch && !compMatch) {
        return false;
      }
    }

    if (lldFilterFlaggedOnly && !lldFlaggedIds.includes(topic.id)) {
      return false;
    }

    if (lldFilterCompletedOnly && !lldCompletedIds.includes(topic.id)) {
      return false;
    }

    return true;
  });

  const sortedLldTopics = [...filteredLldTopics].sort((a, b) => {
    if (lldSortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (lldSortBy === 'difficulty') {
      const diffOrder: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
      return (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2);
    }
    return a.frequencyRank - b.frequencyRank;
  });

  const sdPercent = Math.round((sdCompletedIds.length / allSystemDesignTopics.length) * 100);
  const lldPercent = Math.round((lldCompletedIds.length / allLldTopics.length) * 100);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <TopHeader
          globalSearch={globalSearch}
          setGlobalSearch={(val) => setGlobalSearch(val)}
        />

        {/* Views */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* SYSTEM DESIGN VIEW */}
          {activeSection === 'system-design' && (
            <div className="space-y-6">
              
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>System Design</span>
                </h1>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors cursor-pointer group">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                      T
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      How to Pass System Design Interviews in 2026
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSdFilterFlaggedOnly(!sdFilterFlaggedOnly)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      sdFilterFlaggedOnly
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${sdFlaggedIds.length > 0 ? 'text-amber-400 fill-amber-400' : ''}`} />
                    <span>Flagged ({sdFlaggedIds.length})</span>
                  </button>

                  <button
                    onClick={() => setSdFilterCompletedOnly(!sdFilterCompletedOnly)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      sdFilterCompletedOnly
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Completed ({sdCompletedIds.length}/{allSystemDesignTopics.length})</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      {sdPercent}%
                    </span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative flex-1 md:w-60">
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={sdSearchQuery}
                      onChange={(e) => setSdSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <select
                    value={sdSortBy}
                    onChange={(e) => setSdSortBy(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="frequency">Ordered by most frequently asked</option>
                    <option value="title">Alphabetical (A-Z)</option>
                    <option value="difficulty">Difficulty Level</option>
                  </select>
                </div>
              </div>

              {sortedSdTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedSdTopics.map((topic) => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      isCompleted={sdCompletedIds.includes(topic.id)}
                      isFlagged={sdFlaggedIds.includes(topic.id)}
                      onToggleCompleted={handleToggleSdCompleted}
                      onToggleFlagged={handleToggleSdFlagged}
                      onSelectTopic={(t) => setSelectedSdTopic(t)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
                  <SearchX className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-200">No matching system design topics found</h3>
                  <button
                    onClick={() => {
                      setSdSearchQuery('');
                      setGlobalSearch('');
                      setSdFilterFlaggedOnly(false);
                      setSdFilterCompletedOnly(false);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}

            </div>
          )}

          {/* LOW LEVEL DESIGN (LLD) VIEW */}
          {activeSection === 'lld' && (
            <div className="space-y-6">
              
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-teal-400" />
                  <span>Low Level Design</span>
                </h1>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/80 transition-colors cursor-pointer group">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-xs">
                      T
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      How to Pass Low Level Design Interviews in 2026
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 transition-colors" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setLldFilterFlaggedOnly(!lldFilterFlaggedOnly)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      lldFilterFlaggedOnly
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${lldFlaggedIds.length > 0 ? 'text-amber-400 fill-amber-400' : ''}`} />
                    <span>Flagged ({lldFlaggedIds.length})</span>
                  </button>

                  <button
                    onClick={() => setLldFilterCompletedOnly(!lldFilterCompletedOnly)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      lldFilterCompletedOnly
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Completed ({lldCompletedIds.length}/{allLldTopics.length})</span>
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      {lldPercent}%
                    </span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative flex-1 md:w-64">
                    <input
                      type="text"
                      placeholder={`Search ${allLldTopics.length} LLD topics...`}
                      value={lldSearchQuery}
                      onChange={(e) => setLldSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <select
                    value={lldSortBy}
                    onChange={(e) => setLldSortBy(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-600 cursor-pointer"
                  >
                    <option value="frequency">Ordered by most frequently asked</option>
                    <option value="title">Alphabetical (A-Z)</option>
                    <option value="difficulty">Difficulty Level</option>
                  </select>
                </div>
              </div>

              {sortedLldTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedLldTopics.map((topic) => (
                    <LldCard
                      key={topic.id}
                      topic={topic}
                      isCompleted={lldCompletedIds.includes(topic.id)}
                      isFlagged={lldFlaggedIds.includes(topic.id)}
                      onToggleCompleted={handleToggleLldCompleted}
                      onToggleFlagged={handleToggleLldFlagged}
                      onSelectTopic={(t) => setSelectedLldTopic(t)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-3">
                  <SearchX className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-200">No matching LLD topics found</h3>
                  <button
                    onClick={() => {
                      setLldSearchQuery('');
                      setGlobalSearch('');
                      setLldFilterFlaggedOnly(false);
                      setLldFilterCompletedOnly(false);
                    }}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}

            </div>
          )}

          {/* AI ENGINEER VIEW */}
          {activeSection === 'ai-engineer' && (
            <AiEngineerMainView globalSearch={globalSearch} />
          )}

          {/* RESUME EDITOR VIEW */}
          {activeSection === 'resume' && <ResumeEditor />}

          {/* OTHER CATEGORY VIEWS */}
          {activeSection !== 'system-design' && activeSection !== 'lld' && activeSection !== 'ai-engineer' && activeSection !== 'resume' && (
            <CategoryView section={activeSection} globalSearch={globalSearch} />
          )}

        </main>
      </div>

      {/* System Design Detail Modal */}
      {selectedSdTopic && (
        <TopicDetailModal
          topic={selectedSdTopic}
          isCompleted={sdCompletedIds.includes(selectedSdTopic.id)}
          isFlagged={sdFlaggedIds.includes(selectedSdTopic.id)}
          onToggleCompleted={handleToggleSdCompleted}
          onToggleFlagged={handleToggleSdFlagged}
          onClose={() => setSelectedSdTopic(null)}
        />
      )}

      {/* LLD Detail Modal */}
      {selectedLldTopic && (
        <LldDetailModal
          topic={selectedLldTopic}
          isCompleted={lldCompletedIds.includes(selectedLldTopic.id)}
          isFlagged={lldFlaggedIds.includes(selectedLldTopic.id)}
          onToggleCompleted={handleToggleLldCompleted}
          onToggleFlagged={handleToggleLldFlagged}
          onClose={() => setSelectedLldTopic(null)}
        />
      )}
    </div>
  );
}

export default App;
