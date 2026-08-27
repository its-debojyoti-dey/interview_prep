import React from 'react';
import { NavSection } from '../types/navigation';
import { 
  Code2, 
  Layers, 
  Cpu, 
  UserCheck, 
  Globe, 
  Terminal, 
  Bot, 
  FileText, 
  Building2, 
  Map, 
  PanelLeftClose
} from 'lucide-react';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse
}) => {
  const isSectionActive = (sec: NavSection) => activeSection === sec;

  const navItemClass = (sec: NavSection) => `
    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors
    ${isSectionActive(sec)
      ? 'bg-slate-800 text-white font-bold'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
    }
  `;

  return (
    <aside
      className={`bg-slate-950 border-r border-slate-800/80 flex flex-col transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      } flex-shrink-0 min-h-screen`}
    >
      {/* Top Header Logo */}
      <div className="h-16 border-b border-slate-900 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
              T
            </div>
            <span className="text-base font-bold text-white tracking-tight">TechPrep</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 mx-auto rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
            T
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-900 transition-colors"
          title="Toggle Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        
        {/* INTERVIEW SKILLS */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Interview Skills
            </p>
          )}
          <button onClick={() => onSelectSection('dsa')} className={navItemClass('dsa')}>
            <Code2 className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Data Structures & Algorithms</span>}
          </button>
          <button onClick={() => onSelectSection('system-design')} className={navItemClass('system-design')}>
            <Layers className="w-4 h-4 flex-shrink-0 text-indigo-400" />
            {!collapsed && <span>System Design</span>}
          </button>
          <button onClick={() => onSelectSection('lld')} className={navItemClass('lld')}>
            <Cpu className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Low Level Design</span>}
          </button>
          <button onClick={() => onSelectSection('behavioral')} className={navItemClass('behavioral')}>
            <UserCheck className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Behavioral</span>}
          </button>
        </div>

        {/* DOMAINS */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Domains
            </p>
          )}
          <button onClick={() => onSelectSection('fullstack')} className={navItemClass('fullstack')}>
            <Globe className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Full Stack</span>}
          </button>
          <button onClick={() => onSelectSection('devops')} className={navItemClass('devops')}>
            <Terminal className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>DevOps</span>}
          </button>
          <button onClick={() => onSelectSection('ai-engineer')} className={navItemClass('ai-engineer')}>
            <Bot className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>AI Engineer</span>}
          </button>
        </div>

        {/* CAREER */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Career
            </p>
          )}
          <button onClick={() => onSelectSection('resume')} className={navItemClass('resume')}>
            <FileText className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Resume Editor</span>}
          </button>
        </div>

        {/* TOOLS */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Tools
            </p>
          )}
          <button onClick={() => onSelectSection('companies')} className={navItemClass('companies')}>
            <Building2 className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Companies</span>}
          </button>
          <button onClick={() => onSelectSection('roadmaps')} className={navItemClass('roadmaps')}>
            <Map className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Roadmaps</span>}
          </button>
        </div>

      </div>

      {/* Footer Profile */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-900">
          <div className="flex items-center space-x-3 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              DD
            </div>
            <div className="text-xs truncate">
              <p className="font-semibold text-slate-200 truncate">Debojyoti Dey</p>
              <p className="text-[10px] text-slate-500 truncate">Personal Prep Hub</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
