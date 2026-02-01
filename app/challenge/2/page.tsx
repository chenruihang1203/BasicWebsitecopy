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

type HistoryState = {
  path: string[];
  cost: number;
};

const OPTIMAL_COST = 11;

const NODES: GraphNode2[] = [
  { id: 'START', label: 'S', x: 100, y: 200 },
  { id: 'A', label: 'A', x: 250, y: 100 },
  { id: 'B', label: 'B', x: 250, y: 300 },
  { id: 'C', label: 'C', x: 400, y: 150 },
  { id: 'TARGET', label: 'T', x: 500, y: 250 },
];

const EDGES = [
  { from: 'START', to: 'A', weight: 4 },
  { from: 'START', to: 'B', weight: 2 },
  { from: 'A', to: 'C', weight: 5 },
  { from: 'B', to: 'A', weight: 1 },
  { from: 'B', to: 'C', weight: 8 },
  { from: 'C', to: 'TARGET', weight: 3 },
  { from: 'B', to: 'TARGET', weight: 10 },
];

export default function DijkstraLevel() {
  const [selectedPath, setSelectedPath] = useState<string[]>(['START']);
  const [totalCost, setTotalCost] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([{ path: ['START'], cost: 0 }]);

  useEffect(() => {
    if (completed && totalCost === OPTIMAL_COST) {
      try {
        const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
        const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
        if (!completedLevels.includes(2)) {
          completedLevels.push(2);
          localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
        }
      } catch (e) {}
    }
  }, [completed, totalCost]);

  const handleNodeClick = (nodeId: string) => {
    if (completed) return;
    if (selectedPath.includes(nodeId)) return;

    const lastNode = selectedPath[selectedPath.length - 1];
    const edge = EDGES.find((e) => e.from === lastNode && e.to === nodeId);

    if (edge) {
      const newPath = [...selectedPath, nodeId];
      const newCost = totalCost + edge.weight;
      setSelectedPath(newPath);
      setTotalCost(newCost);
      setHistory([...history, { path: newPath, cost: newCost }]);

      if (nodeId === 'TARGET') {
        setCompleted(newCost === OPTIMAL_COST);
      }
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const lastState = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setSelectedPath(lastState.path);
    setTotalCost(lastState.cost);
    setCompleted(false);
  };

  const reset = () => {
    setSelectedPath(['START']);
    setTotalCost(0);
    setCompleted(false);
    setHistory([{ path: ['START'], cost: 0 }]);
  };

  const getEdgeHighlighted = (from: string, to: string) => {
    for (let i = 0; i < selectedPath.length - 1; i++) {
      if (selectedPath[i] === from && selectedPath[i + 1] === to) return true;
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
            PROTOCOL v2 // DIJKSTRA_ROUTE
          </div>
          <h1 className="text-3xl font-black text-white mb-2">PATHFINDING OPTIMIZATION</h1>
          <p className="text-slate-400 text-sm">Calculate optimal infiltration route from START (S) to TARGET (T). Minimize detection cost.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-purple-900/50 p-6 mb-4 relative" style={{ height: '400px' }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {EDGES.map((edge, i) => {
              const n1 = NODES.find((n) => n.id === edge.from);
              const n2 = NODES.find((n) => n.id === edge.to);
              if (!n1 || !n2) return null;
              return <GraphEdge key={i} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} weight={edge.weight} highlighted={getEdgeHighlighted(edge.from, edge.to)} />;
            })}
          </svg>
          {NODES.map((node) => (
            <GraphNode key={node.id} id={node.id} label={node.label} x={node.x} y={node.y}
              selected={selectedPath.includes(node.id)} onClick={() => handleNodeClick(node.id)} />
          ))}
        </div>

        <div className="mt-4 bg-slate-900/50 border border-purple-900/50 p-4">
          <div className="font-bold mb-3 text-sm">
            {completed
              ? <span className="text-purple-400">✓ ALGORITHM OPTIMIZED. OPTIMAL PATH: COST {totalCost}</span>
              : <span className="text-slate-400">ROUTE: {selectedPath.join(' → ')} | COST: {totalCost}</span>}
          </div>
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
          Navigate through the Guardian defense network. Edge weights represent detection probability. Find the path with minimum total cost.
        </p>
        <div className="bg-purple-900/20 border border-purple-800/50 p-3 text-xs text-purple-300">
          <strong>TARGET:</strong> Optimal route costs {OPTIMAL_COST}. Can you find it?
        </div>
      </aside>
    </div>
  );
}
