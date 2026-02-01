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
};

const NODES: GraphNode2[] = [
  { id: 'A', label: 'A', x: 250, y: 80 },
  { id: 'B', label: 'B', x: 400, y: 150 },
  { id: 'C', label: 'C', x: 350, y: 300 },
  { id: 'D', label: 'D', x: 150, y: 300 },
  { id: 'E', label: 'E', x: 100, y: 150 },
];

const EDGES: Edge[] = [
  { from: 'A', to: 'B' },
  { from: 'A', to: 'E' },
  { from: 'B', to: 'C' },
  { from: 'B', to: 'E' },
  { from: 'C', to: 'D' },
  { from: 'C', to: 'E' },
  { from: 'D', to: 'E' },
  { from: 'A', to: 'C' },
];

export default function HamiltonianLevel() {
  const [path, setPath] = useState<string[]>(['A']);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<string[][]>([['A']]);

  useEffect(() => {
    if (path.length === NODES.length + 1 && path[0] === path[path.length - 1]) {
      setCompleted(true);
      try {
        const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
        const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
        if (!completedLevels.includes(3)) {
          completedLevels.push(3);
          localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
        }
      } catch (e) {}
    }
  }, [path]);

  const handleNodeClick = (nodeId: string) => {
    if (completed) return;
    const currentNode = path[path.length - 1];

    if (nodeId === 'A' && path.length === NODES.length && !path.slice(1).includes('A')) {
      const newPath = [...path, 'A'];
      setPath(newPath);
      setHistory([...history, newPath]);
      return;
    }

    if (path.includes(nodeId)) return;

    const edgeExists = EDGES.some(
      (e) => (e.from === currentNode && e.to === nodeId) || (e.to === currentNode && e.from === nodeId)
    );

    if (edgeExists) {
      const newPath = [...path, nodeId];
      setPath(newPath);
      setHistory([...history, newPath]);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const lastPath = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setPath(lastPath);
    setCompleted(false);
  };

  const reset = () => {
    setPath(['A']);
    setCompleted(false);
    setHistory([['A']]);
  };

  const isEdgeInPath = (from: string, to: string) => {
    for (let i = 0; i < path.length - 1; i++) {
      if ((path[i] === from && path[i + 1] === to) || (path[i] === to && path[i + 1] === from)) {
        return true;
      }
    }
    return false;
  };

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
            PROTOCOL v3 // HAMILTONIAN_SCAN
          </div>
          <h1 className="text-3xl font-black text-white mb-2">FULL SWEEP RECONNAISSANCE</h1>
          <p className="text-slate-400 text-sm">Visit every Guardian outpost exactly once and return to extraction point A.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-purple-900/50 p-6 mb-4 relative" style={{ height: '400px' }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {EDGES.map((edge, i) => {
              const n1 = NODES.find((n) => n.id === edge.from);
              const n2 = NODES.find((n) => n.id === edge.to);
              if (!n1 || !n2) return null;
              return <GraphEdge key={i} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} highlighted={isEdgeInPath(edge.from, edge.to)} />;
            })}
          </svg>
          {NODES.map((node) => (
            <GraphNode key={node.id} id={node.id} label={node.label} x={node.x} y={node.y}
              selected={path.includes(node.id)} onClick={() => handleNodeClick(node.id)} />
          ))}
        </div>

        <div className="mt-4 bg-slate-900/50 border border-purple-900/50 p-4">
          <div className="font-bold mb-2 text-sm">
            {completed
              ? <span className="text-purple-400">✓ ALGORITHM OPTIMIZED. HAMILTONIAN CYCLE COMPLETE.</span>
              : <span className="text-slate-400">OUTPOSTS SCANNED: {new Set(path).size} / {NODES.length}</span>}
          </div>
          <div className="text-xs text-slate-500 mb-3">ROUTE: {path.join(' → ')}</div>
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
          Plan a reconnaissance route that covers all Guardian outposts. Each location must be visited exactly once before returning to extraction.
        </p>
        <div className="bg-purple-900/20 border border-purple-800/50 p-3 text-xs text-purple-300">
          <strong>OBJECTIVE:</strong> Complete full sweep from A → all nodes → back to A.
        </div>
      </aside>
    </div>
  );
}
