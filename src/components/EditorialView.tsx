import React from 'react';
import { EditorialSolution } from '../types/systemDesign';
import { Building2, CheckCircle2, ShieldAlert, Database, Server, Calculator, Workflow, Lightbulb, AlertTriangle, Layers } from 'lucide-react';

interface EditorialViewProps {
  editorial: EditorialSolution;
}

export const EditorialView: React.FC<EditorialViewProps> = ({ editorial }) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar TOC Table of Contents */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="sticky top-24 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2 backdrop-blur-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Table of Contents</p>
          <nav className="space-y-1 text-xs">
            {[
              { id: 'companies', label: 'Companies' },
              { id: 'overview', label: 'Overview' },
              { id: 'requirements', label: 'Requirements' },
              { id: 'key-questions', label: 'Key Questions & Capacity' },
              { id: 'data-model', label: 'Data Model & Schema' },
              { id: 'api-design', label: 'API Design' },
              { id: 'basic-implementation', label: 'Basic Implementation' },
              { id: 'advanced-implementation', label: 'Advanced Implementation' },
              { id: 'system-flows', label: 'System Flows' },
              { id: 'additional-points', label: 'Additional Discussion Points' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-slate-300 hover:text-indigo-400 hover:bg-slate-800/60 font-medium transition-colors truncate block"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-10 min-w-0 text-slate-200">
        
        {/* Companies Section */}
        <section id="companies" className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3 text-indigo-400 font-bold text-sm">
            <Building2 className="w-4 h-4" />
            <span>Target Companies</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {editorial.companies.map((c, i) => (
              <span key={i} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-semibold">
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* Overview & Introduction */}
        <section id="overview" className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            Overview & Introduction
          </h2>
          <p className="text-base text-slate-300 leading-relaxed bg-slate-900/40 p-5 rounded-xl border border-slate-800/60">
            {editorial.overview}
          </p>
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl text-sm leading-relaxed text-slate-300 whitespace-pre-line">
            {editorial.introduction}
          </div>
        </section>

        {/* Requirements Section */}
        <section id="requirements" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Requirements
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Functional Requirements */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Functional Requirements
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {editorial.requirements.functional.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Non-Functional Requirements */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Non-Functional Requirements
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {editorial.requirements.nonFunctional.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Out of scope */}
          {editorial.requirements.outOfScope && editorial.requirements.outOfScope.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Not Covered / Out of Scope</h4>
              <div className="flex flex-wrap gap-2">
                {editorial.requirements.outOfScope.map((item, i) => (
                  <span key={i} className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md border border-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Key Questions & Capacity Estimation */}
        <section id="key-questions" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            Key Questions & Capacity Estimation
          </h2>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Core Assumptions</h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {editorial.keyQuestions.assumptions.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
              {editorial.keyQuestions.calculations.map((calc, idx) => (
                <div key={idx} className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
                  <p className="text-[11px] text-slate-400 font-medium">{calc.label}</p>
                  <p className="text-base font-extrabold text-amber-300 mt-0.5">{calc.value}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{calc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Model Section */}
        <section id="data-model" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" />
            Data Model & Database Schema
          </h2>

          <p className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            {editorial.dataModel.overview}
          </p>

          <div className="space-y-4">
            {editorial.dataModel.entities.map((entity, idx) => (
              <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800/60 px-4 py-2.5 border-b border-slate-700/80 flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-teal-300">{entity.name}</span>
                  <span className="text-xs text-slate-400">{entity.description}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                      <tr>
                        <th className="px-4 py-2">Field Name</th>
                        <th className="px-4 py-2">Data Type</th>
                        <th className="px-4 py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {entity.fields.map((field, fIdx) => (
                        <tr key={fIdx} className="hover:bg-slate-800/30">
                          <td className="px-4 py-2 text-indigo-300 font-bold">{field.name}</td>
                          <td className="px-4 py-2 text-amber-300">{field.type}</td>
                          <td className="px-4 py-2 text-slate-300 font-sans">{field.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* API Design Section */}
        <section id="api-design" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            API Design
          </h2>

          <p className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            {editorial.apiDesign.overview}
          </p>

          <div className="space-y-3">
            {editorial.apiDesign.endpoints.map((ep, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
                  <span className={`px-2.5 py-1 rounded font-bold ${
                    ep.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    ep.method === 'POST' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-bold text-white text-sm">{ep.path}</span>
                  <span className="text-slate-400 ml-auto font-sans text-xs bg-slate-800 px-2 py-0.5 rounded">
                    Status: {ep.statusCode}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{ep.description}</p>
                {ep.params && (
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto">
                    {ep.params}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Basic Implementation */}
        <section id="basic-implementation" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Basic Implementation (Tradeoffs & Flaws)
          </h2>

          <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-amber-300">{editorial.basicImplementation.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{editorial.basicImplementation.description}</p>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Scalability Bottlenecks & Flaws:</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {editorial.basicImplementation.drawbacks.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Advanced Implementation */}
        <section id="advanced-implementation" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-400" />
            Advanced Implementation Architecture
          </h2>

          <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-indigo-300">{editorial.advancedImplementation.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {editorial.advancedImplementation.description}
            </p>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Key Architectural Components</h4>
              <div className="grid gap-3">
                {editorial.advancedImplementation.components.map((comp, i) => (
                  <div key={i} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-indigo-300">{comp.name}</span>
                      <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                        {comp.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{comp.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* System Flows */}
        <section id="system-flows" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Workflow className="w-5 h-5 text-emerald-400" />
            System Request Flows
          </h2>

          <div className="space-y-4">
            {editorial.flows.map((flow, idx) => (
              <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-emerald-300">{flow.title}</h3>
                <p className="text-xs text-slate-400">{flow.description}</p>
                
                <ol className="space-y-2 text-xs text-slate-300 pt-2">
                  {flow.steps.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-3 bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                        {sIdx + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* Additional Discussion Points */}
        <section id="additional-points" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Additional Discussion Points
          </h2>

          <div className="grid gap-3">
            {editorial.additionalPoints.map((point, idx) => (
              <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-1">
                <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  {point.topic}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{point.details}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
