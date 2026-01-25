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
    // Check if Hamiltonian cycle is complete
    if (path.length === NODES.length + 1 && path[0] === path[path.length - 1]) {
      setCompleted(true);
      try {
        const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
        const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
        if (!completedLevels.includes(3)) {
          completedLevels.push(3);
          localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
        }
      } catch (e) {
        // ignore
      }
    }
  }, [path]);

  const handleNodeClick = (nodeId: string) => {
    if (completed) return;

    const currentNode = path[path.length - 1];

    // If clicking starting node and all nodes visited, complete the cycle
    if (nodeId === 'A' && path.length === NODES.length && !path.slice(1).includes('A')) {
      const newPath = [...path, 'A'];
      setPath(newPath);
      setHistory([...history, newPath]);
      return;
    }

    // Don't allow revisiting nodes (except for final return to start)
    if (path.includes(nodeId)) return;

    // Check if edge exists
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
    <div className="flex h-screen bg-gradient-to-br from-orange-400 to-red-500">
      <div className="flex-1 p-8">
        <Link href="/challenge" className="text-white/80 hover:text-white underline mb-4 inline-block">
          ← Back to Challenges
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Level 3: Hamiltonian Cycle</h1>
        <p className="text-white/90 mb-6">Visit every vertex exactly once and return to the starting vertex.</p>

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
                  highlighted={isEdgeInPath(edge.from, edge.to)}
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
              selected={path.includes(node.id)}
              onClick={() => handleNodeClick(node.id)}
            />
          ))}
        </div>

        <div className="mt-4 bg-white/20 backdrop-blur rounded-lg p-4 text-white">
          <div className="font-semibold mb-2">
            {completed
              ? '✅ Perfect! Hamiltonian cycle complete!'
              : `Vertices Visited: ${new Set(path).size} / ${NODES.length}`}
          </div>
          <div className="text-sm mb-2">Path: {path.join(' → ')}</div>
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
          Click adjacent nodes to build a path. Visit all vertices exactly once, then return to A to complete the
          cycle.
        </p>
        <div className="bg-white/20 rounded p-3 text-white text-xs">
          <strong>Hint:</strong> Start from A and explore different paths to find a complete cycle!
        </div>
      </aside>
    </div>
  );
}
