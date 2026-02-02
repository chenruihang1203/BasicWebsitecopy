'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GraphNode from '../components/GraphNode';
import GraphEdge from '../components/GraphEdge';

const styles = `
  @keyframes tunnel-dive { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0.5; } 100% { opacity: 0; transform: scale(2); } }
  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3));
    background-size: 100% 4px;
  }
`;

type GraphNode2 = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type Edge = {
  from: string;
  to: string;
  id: number;
};

const NODES: GraphNode2[] = [
  { id: 'A', label: 'A', x: 250, y: 100 },
  { id: 'B', label: 'B', x: 400, y: 150 },
  { id: 'C', label: 'C', x: 350, y: 300 },
  { id: 'D', label: 'D', x: 150, y: 300 },
  { id: 'E', label: 'E', x: 100, y: 150 },
];

const EDGES: Edge[] = [
  { from: 'A', to: 'B', id: 0 },
  { from: 'A', to: 'D', id: 1 },
  { from: 'C', to: 'D', id: 2 },
  { from: 'D', to: 'E', id: 3 },
  { from: 'E', to: 'A', id: 4 },
  { from: 'A', to: 'C', id: 5 },
  { from: 'B', to: 'D', id: 6 },
];

export default function EulerianLevel() {
  const [currentNode, setCurrentNode] = useState<string>('A');
  const [path, setPath] = useState<string[]>(['A']);
  const [usedEdges, setUsedEdges] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<{ path: string[]; usedEdges: number[] }[]>([
    { path: ['A'], usedEdges: [] },
  ]);

  useEffect(() => {
    if (usedEdges.length === EDGES.length && currentNode === 'A' && path.length > 1) {
      setCompleted(true);
      try {
        const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
        const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
        if (!completedLevels.includes(7)) {
          completedLevels.push(7);
          localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
        }
      } catch (e) {}
    }
  }, [usedEdges, currentNode, path]);

  const handleNodeClick = (nodeId: string) => {
    if (completed) return;
    if (nodeId === currentNode) return;

    const availableEdge = EDGES.find(
      (e) =>
        !usedEdges.includes(e.id) &&
        ((e.from === currentNode && e.to === nodeId) || (e.to === currentNode && e.from === nodeId))
    );

    if (availableEdge) {
      const newPath = [...path, nodeId];
      const newUsedEdges = [...usedEdges, availableEdge.id];
      setPath(newPath);
      setUsedEdges(newUsedEdges);
      setCurrentNode(nodeId);
      setHistory([...history, { path: newPath, usedEdges: newUsedEdges }]);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const lastState = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setPath(lastState.path);
    setUsedEdges(lastState.usedEdges);
    setCurrentNode(lastState.path[lastState.path.length - 1]);
    setCompleted(false);
  };

  const reset = () => {
    setCurrentNode('A');
    setPath(['A']);
    setUsedEdges([]);
    setCompleted(false);
    setHistory([{ path: ['A'], usedEdges: [] }]);
  };

  const isEdgeUsed = (edgeId: number) => usedEdges.includes(edgeId);

  return (
    <div className="flex h-screen bg-black text-purple-50 font-mono">
      <style>{styles}</style>
      
      <div className="absolute inset-0 overflow-hidden bg-black">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="absolute inset-0 border-[50px] border-purple-900/20 opacity-0"
               style={{ animation: `tunnel-dive 4s linear infinite`, animationDelay: `${i * 0.8}s` }} />
        ))}
      </div>
      <div className="scanlines absolute inset-0 z-10 pointer-events-none opacity-20"></div>

      <div className="relative z-20 flex-1 p-8">
        <Link href="/challenge" className="text-purple-400 hover:text-purple-300 text-sm uppercase tracking-widest mb-4 inline-flex items-center gap-2">
          <span>←</span> ABORT PROTOCOL
        </Link>
        
        <div className="mb-6">
          <div className="inline-block border border-purple-500/30 bg-purple-950/20 px-3 py-1 text-xs tracking-[0.2em] text-purple-400 mb-2">
            PROTOCOL v7 // EULERIAN_TRACE
          </div>
          <h1 className="text-3xl font-black text-white mb-2">NETWORK TOPOLOGY TRACE</h1>
          <p className="text-slate-400 text-sm">Trace every communication channel exactly once. Map the complete Guardian network.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-purple-900/50 p-6 mb-4 relative" style={{ height: '400px' }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {EDGES.map((edge) => {
              const n1 = NODES.find((n) => n.id === edge.from);
              const n2 = NODES.find((n) => n.id === edge.to);
              if (!n1 || !n2) return null;
              return <GraphEdge key={edge.id} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} highlighted={isEdgeUsed(edge.id)} />;
            })}
          </svg>
          {NODES.map((node) => (
            <GraphNode key={node.id} id={node.id} label={node.label} x={node.x} y={node.y}
              selected={node.id === currentNode} onClick={() => handleNodeClick(node.id)} />
          ))}
        </div>

        <div className="mt-4 bg-slate-900/50 border border-purple-900/50 p-4">
          <div className="font-bold mb-2 text-sm">
            {completed
              ? <span className="text-purple-400">✓ ALGORITHM OPTIMIZED. EULERIAN CIRCUIT COMPLETE.</span>
              : <span className="text-slate-400">CURRENT NODE: {currentNode} | CHANNELS TRACED: {usedEdges.length} / {EDGES.length}</span>}
          </div>
          <div className="text-xs text-slate-500 mb-3">TRACE: {path.join(' → ')}</div>
          <div className="flex gap-3">
            <button onClick={handleUndo} disabled={history.length <= 1}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-400 text-xs uppercase tracking-wider hover:border-purple-500 hover:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              ↶ UNDO
            </button>
            <button onClick={reset}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-400 text-xs uppercase tracking-wider hover:border-red-500 hover:text-red-400 transition-all">
              RESET PROTOCOL
            </button>
          </div>
        </div>
      </div>

      <aside className="relative z-20 w-72 bg-black/80 border-l border-purple-900/50 p-6 backdrop-blur-md">
        <h3 className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-3 border-b border-purple-900/50 pb-2">MISSION PARAMETERS</h3>
        <p className="text-slate-400 text-xs mb-4 leading-relaxed">
          Traverse every communication link in the Guardian network. Each channel must be traced exactly once before returning to origin.
        </p>
        <div className="bg-purple-900/20 border border-purple-800/50 p-3 text-xs text-purple-300">
          <strong>INTEL:</strong> All nodes have even degree. Eulerian circuit exists.
        </div>
      </aside>
    </div>
  );
}
