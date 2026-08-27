import React, { useState } from 'react';
import { WhiteboardNode, WhiteboardConnection } from '../types/systemDesign';
import { MonitorPlay, Play, Pause, Info, Layers, Server, Database, Cpu, HardDrive, Network } from 'lucide-react';

interface WhiteboardViewProps {
  nodes: WhiteboardNode[];
  connections: WhiteboardConnection[];
}

export const WhiteboardView: React.FC<WhiteboardViewProps> = ({ nodes, connections }) => {
  const [selectedNode, setSelectedNode] = useState<WhiteboardNode | null>(nodes[0] || null);
  const [isSimulating, setIsSimulating] = useState(false);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'lb':
        return <Network className="w-4 h-4 text-indigo-400" />;
      case 'service':
        return <Server className="w-4 h-4 text-emerald-400" />;
      case 'cache':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'db':
        return <Database className="w-4 h-4 text-teal-400" />;
      case 'storage':
        return <HardDrive className="w-4 h-4 text-purple-400" />;
      case 'zookeeper':
        return <Cpu className="w-4 h-4 text-rose-400" />;
      default:
        return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  const getNodeColor = (type: string, isSelected: boolean) => {
    if (isSelected) {
      return 'border-indigo-500 bg-indigo-950/80 text-white';
    }
    switch (type) {
      case 'client':
        return 'border-blue-500/40 bg-slate-900 text-blue-300 hover:border-blue-400';
      case 'lb':
        return 'border-indigo-500/40 bg-slate-900 text-indigo-300 hover:border-indigo-400';
      case 'service':
        return 'border-emerald-500/40 bg-slate-900 text-emerald-300 hover:border-emerald-400';
      case 'cache':
        return 'border-amber-500/40 bg-slate-900 text-amber-300 hover:border-amber-400';
      case 'db':
        return 'border-teal-500/40 bg-slate-900 text-teal-300 hover:border-teal-400';
      case 'queue':
        return 'border-purple-500/40 bg-slate-900 text-purple-300 hover:border-purple-400';
      case 'zookeeper':
        return 'border-rose-500/40 bg-slate-900 text-rose-300 hover:border-rose-400';
      default:
        return 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MonitorPlay className="w-4 h-4 text-amber-400" />
            AI Architecture Whiteboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click on any component to inspect system details or simulate traffic flow.
          </p>
        </div>

        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
            isSimulating
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
          }`}
        >
          {isSimulating ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-rose-300" />
              Stop Traffic Simulation
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              Simulate Live Traffic
            </>
          )}
        </button>
      </div>

      {/* Main Canvas & Inspector Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Visual Node Diagram Canvas */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-5 relative min-h-[400px] overflow-hidden">
          {/* Data Flow Connections List */}
          <div className="space-y-2 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Inter-Component Data Flow Pipelines</p>
            <div className="grid gap-1.5 text-xs font-mono">
              {connections.map((conn, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded border transition-all flex items-center justify-between ${
                    isSimulating
                      ? 'bg-indigo-950 border-indigo-500/50 text-indigo-300 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300">{conn.from}</span>
                    <span className="text-indigo-400">→</span>
                    <span className="font-bold text-slate-300">{conn.to}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-sans">{conn.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Component Nodes Grid */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${getNodeColor(
                    node.type,
                    isSelected
                  )}`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    {getNodeIcon(node.type)}
                    <span className="font-bold text-xs tracking-tight text-white">{node.label}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    {node.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Inspector Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Info className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Component Inspector</h3>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Component Name</span>
                <p className="text-sm font-extrabold text-indigo-300 mt-0.5">{selectedNode.label}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</span>
                <div className="mt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[10px] uppercase border border-slate-800 font-bold">
                    {selectedNode.type}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operational Role</span>
                <p className="text-slate-300 mt-1 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                  {selectedNode.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Connections</span>
                <div className="mt-2 space-y-1.5">
                  {connections
                    .filter((c) => c.from === selectedNode.id || c.to === selectedNode.id)
                    .map((c, i) => (
                      <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300">{c.from}</span> →{' '}
                        <span className="font-bold text-slate-300">{c.to}</span>: {c.label}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">Select any node on the whiteboard canvas to inspect specifications.</p>
          )}
        </div>

      </div>
    </div>
  );
};
