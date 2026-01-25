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
    // Check if Eulerian circuit is complete
    if (usedEdges.length === EDGES.length && currentNode === 'A' && path.length > 1) {
      setCompleted(true);
      try {
        const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
        const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
        if (!completedLevels.includes(4)) {
          completedLevels.push(4);
          localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
        }
      } catch (e) {
        // ignore
      }
    }
  }, [usedEdges, currentNode, path]);

  const handleNodeClick = (nodeId: string) => {
    if (completed) return;
    if (nodeId === currentNode) return;

    // Find an unused edge connecting current node to clicked node
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
    <div className="flex h-screen bg-gradient-to-br from-purple-400 to-pink-500">
      <div className="flex-1 p-8">
        <Link href="/challenge" className="text-white/80 hover:text-white underline mb-4 inline-block">
          ← Back to Challenges
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Level 4: Eulerian Circuit</h1>
        <p className="text-white/90 mb-6">
          Find a path that visits every edge exactly once and returns to the starting node.
        </p>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-4 relative" style={{ height: '400px' }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {EDGES.map((edge) => {
              const n1 = NODES.find((n) => n.id === edge.from);
              const n2 = NODES.find((n) => n.id === edge.to);
              if (!n1 || !n2) return null;
              return (
                <GraphEdge
                  key={edge.id}
                  x1={n1.x}
                  y1={n1.y}
                  x2={n2.x}
                  y2={n2.y}
                  highlighted={isEdgeUsed(edge.id)}
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
              selected={node.id === currentNode}
              onClick={() => handleNodeClick(node.id)}
            />
          ))}
        </div>

        <div className="mt-4 bg-white/20 backdrop-blur rounded-lg p-4 text-white">
          <div className="font-semibold mb-2">
            {completed
              ? '✅ Perfect! Eulerian circuit complete!'
              : `Current Node: ${currentNode} | Edges Used: ${usedEdges.length} / ${EDGES.length}`}
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
          Click adjacent nodes to traverse edges. Use each edge exactly once and return to node A to complete the
          circuit.
        </p>
        <div className="bg-white/20 rounded p-3 text-white text-xs">
          <strong>Hint:</strong> All vertices have even degree, so an Eulerian circuit exists!
        </div>
      </aside>
    </div>
  );
}
