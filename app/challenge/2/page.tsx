'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GraphNode from '../components/GraphNode';
import GraphEdge from '../components/GraphEdge';

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
      } catch (e) {
        // ignore
      }
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
        // Mark completed only when the path cost matches the optimal criteria
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
    <div className="flex h-screen bg-gradient-to-br from-red-400 to-purple-500">
      <div className="flex-1 p-8">
        <Link href="/challenge" className="text-white/80 hover:text-white underline mb-4 inline-block">
          ← Back to Challenges
        </Link>
        <Link href="/" className="text-white/80 hover:text-white underline mb-4 inline-block turingchat-back-to-homepage">
          ← Back to Homepage
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Level 2: Dijkstra's Algorithm</h1>
        <p className="text-white/90 mb-6">Find the shortest path from START (S) to TARGET (T) by selecting adjacent nodes.</p>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-4 relative" style={{ height: '400px' }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {EDGES.map((edge, i) => {
              const n1 = NODES.find((n) => n.id === edge.from);
              const n2 = NODES.find((n) => n.id === edge.to);
              if (!n1 || !n2) return null;
              return (
                <GraphEdge
                  key={i}
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  weight={edge.weight}
                  highlighted={getEdgeHighlighted(edge.from, edge.to)}
                />
              );
            })}
          </svg>
          {NODES.map((node) => (
            <GraphNode
              key={node.id}
              id={node.id}
              label={node.label}
              x={node.x}
              y={node.y}
              selected={selectedPath.includes(node.id)}
              onClick={() => handleNodeClick(node.id)}
            />
          ))}
        </div>

        <div className="mt-4 bg-white/20 backdrop-blur rounded-lg p-4 text-white">
          <div className="font-semibold mb-2">
            {completed
              ? totalCost === OPTIMAL_COST
                ? `✅ Perfect! Optimal path found with cost ${totalCost}`
                : `Path Complete! Cost: ${totalCost} (Optimal: ${OPTIMAL_COST})`
              : `Current Path: ${selectedPath.join(' → ')} | Cost: ${totalCost}`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↶ Undo
            </button>
            <button onClick={reset} className="px-4 py-2 bg-white text-black rounded-lg font-semibold">
              Reset
            </button>
          </div>
        </div>
      </div>

      <aside className="w-72 bg-white/10 p-6 backdrop-blur rounded-l-2xl">
        <h3 className="text-white font-bold mb-2">Instructions</h3>
        <p className="text-white/80 text-sm mb-4">
          Click nodes adjacent to your current path. Choose the path with the smallest total weight to reach the target.
        </p>
        <div className="bg-white/20 rounded p-3 text-white text-xs">
          <strong>Hint:</strong> The optimal path costs {OPTIMAL_COST}. Can you find it?
        </div>
      </aside>
    </div>
  );
}
