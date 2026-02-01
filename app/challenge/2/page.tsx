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
  weight: number;
  id: number;
};

// Graph with 6 nodes - designed so MST has unique optimal solution
const NODES: GraphNode2[] = [
  { id: 'A', label: 'A', x: 100, y: 150 },
  { id: 'B', label: 'B', x: 250, y: 80 },
  { id: 'C', label: 'C', x: 400, y: 100 },
  { id: 'D', label: 'D', x: 150, y: 300 },
  { id: 'E', label: 'E', x: 300, y: 280 },
  { id: 'F', label: 'F', x: 430, y: 250 },
];

// Edges with weights - MST should use edges with total weight = 13 (edges: AB=1, BD=2, BE=3, CF=4, EF=3)
const EDGES: Edge[] = [
  { from: 'A', to: 'B', weight: 1, id: 0 },
  { from: 'A', to: 'D', weight: 5, id: 1 },
  { from: 'B', to: 'C', weight: 6, id: 2 },
  { from: 'B', to: 'D', weight: 2, id: 3 },
  { from: 'B', to: 'E', weight: 3, id: 4 },
  { from: 'C', to: 'E', weight: 7, id: 5 },
  { from: 'C', to: 'F', weight: 4, id: 6 },
  { from: 'D', to: 'E', weight: 4, id: 7 },
  { from: 'E', to: 'F', weight: 3, id: 8 },
];

const OPTIMAL_WEIGHT = 13; // AB(1) + BD(2) + BE(3) + EF(3) + CF(4) = 13

export default function MSTLevel() {
  const [selectedEdges, setSelectedEdges] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if all nodes are connected via selected edges
  const isConnected = (edges: number[]): boolean => {
    if (edges.length !== NODES.length - 1) return false; // MST needs n-1 edges
    
    const adj: Record<string, string[]> = {};
    NODES.forEach(n => { adj[n.id] = []; });
    
    edges.forEach(edgeId => {
      const edge = EDGES.find(e => e.id === edgeId);
      if (edge) {
        adj[edge.from].push(edge.to);
        adj[edge.to].push(edge.from);
      }
    });
    
    const visited = new Set<string>();
    const queue = [NODES[0].id];
    visited.add(NODES[0].id);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of adj[current]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    return visited.size === NODES.length;
  };

  // Calculate total weight of selected edges
  const getTotalWeight = (): number => {
    return selectedEdges.reduce((sum, edgeId) => {
      const edge = EDGES.find(e => e.id === edgeId);
      return sum + (edge ? edge.weight : 0);
    }, 0);
  };

  // Check for cycles
  const hasCycle = (edges: number[]): boolean => {
    const adj: Record<string, string[]> = {};
    NODES.forEach(n => { adj[n.id] = []; });
    
    edges.forEach(edgeId => {
      const edge = EDGES.find(e => e.id === edgeId);
      if (edge) {
        adj[edge.from].push(edge.to);
        adj[edge.to].push(edge.from);
      }
    });
    
    const visited = new Set<string>();
    
    const dfs = (node: string, parent: string | null): boolean => {
      visited.add(node);
      for (const neighbor of adj[node]) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, node)) return true;
        } else if (neighbor !== parent) {
          return true; // Found a cycle
        }
      }
      return false;
    };
    
    for (const node of NODES) {
      if (!visited.has(node.id)) {
        if (dfs(node.id, null)) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (isConnected(selectedEdges) && getTotalWeight() === OPTIMAL_WEIGHT) {
      setCompleted(true);
      try {
        const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
        const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
        if (!completedLevels.includes(2)) {
          completedLevels.push(2);
          localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
        }
      } catch (e) {}
    }
  }, [selectedEdges]);

  const handleEdgeClick = (edgeId: number) => {
    if (completed) return;
    setErrorMessage(null);
    
    if (selectedEdges.includes(edgeId)) {
      setSelectedEdges(selectedEdges.filter(id => id !== edgeId));
    } else {
      const newEdges = [...selectedEdges, edgeId];
      
      // Check if adding this edge creates a cycle
      if (hasCycle(newEdges)) {
        setErrorMessage('CYCLE DETECTED. Edge rejected.');
        return;
      }
      
      // Check if we're trying to add more than n-1 edges
      if (newEdges.length > NODES.length - 1) {
        setErrorMessage('MST requires exactly N-1 edges.');
        return;
      }
      
      setSelectedEdges(newEdges);
    }
  };

  const verify = () => {
    if (selectedEdges.length !== NODES.length - 1) {
      setErrorMessage(`MST needs exactly ${NODES.length - 1} edges. You have ${selectedEdges.length}.`);
      return;
    }
    
    if (!isConnected(selectedEdges)) {
      setErrorMessage('Graph is not fully connected.');
      return;
    }
    
    if (getTotalWeight() !== OPTIMAL_WEIGHT) {
      setErrorMessage(`Total weight ${getTotalWeight()} is not optimal. Find the minimum!`);
      return;
    }
  };

  const reset = () => {
    setSelectedEdges([]);
    setCompleted(false);
    setErrorMessage(null);
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
          <div className="inline-block border border-green-500/30 bg-green-950/20 px-3 py-1 text-xs tracking-[0.2em] text-green-400 mb-2">
            PROTOCOL v2 // MINIMUM_SPANNING_TREE
          </div>
          <h1 className="text-3xl font-black text-white mb-2">INFRASTRUCTURE BACKBONE</h1>
          <p className="text-slate-400 text-sm">Connect all nodes with minimum total cable length. No redundant connections.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-purple-900/50 p-6 mb-4 relative" style={{ height: '400px' }}>
          {/* Render edges as clickable */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {EDGES.map((edge) => {
              const n1 = NODES.find((n) => n.id === edge.from);
              const n2 = NODES.find((n) => n.id === edge.to);
              if (!n1 || !n2) return null;
              
              const isSelected = selectedEdges.includes(edge.id);
              const midX = (n1.x + n2.x) / 2;
              const midY = (n1.y + n2.y) / 2;
              
              return (
                <g key={edge.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => handleEdgeClick(edge.id)}>
                  {/* Invisible wider line for easier clicking */}
                  <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="transparent" strokeWidth="20" />
                  {/* Visible line */}
                  <line 
                    x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                    stroke={isSelected ? '#a855f7' : '#475569'}
                    strokeWidth={isSelected ? 3 : 2}
                    opacity={isSelected ? 1 : 0.6}
                  />
                  {/* Weight label */}
                  <circle cx={midX} cy={midY} r="14" fill={isSelected ? '#7c3aed' : '#1e293b'} stroke={isSelected ? '#a855f7' : '#475569'} strokeWidth="1" />
                  <text x={midX} y={midY} textAnchor="middle" dy="4" fill={isSelected ? 'white' : '#94a3b8'} fontSize="11" fontFamily="monospace" fontWeight="bold">
                    {edge.weight}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Nodes */}
          {NODES.map((node) => (
            <GraphNode key={node.id} id={node.id} label={node.label} x={node.x} y={node.y} selected={false} onClick={() => {}} />
          ))}
        </div>

        <div className="mt-4 bg-slate-900/50 border border-purple-900/50 p-4">
          <div className="font-bold mb-2 text-sm">
            {completed
              ? <span className="text-purple-400">✓ ALGORITHM OPTIMIZED. MINIMUM SPANNING TREE FOUND.</span>
              : errorMessage 
                ? <span className="text-red-400">⚠ {errorMessage}</span>
                : <span className="text-slate-400">EDGES SELECTED: {selectedEdges.length} / {NODES.length - 1} | TOTAL WEIGHT: {getTotalWeight()}</span>}
          </div>
          <div className="text-xs text-slate-500 mb-3">
            Click edges to select/deselect. Build a tree connecting all nodes with minimum weight.
          </div>
          <div className="flex gap-3">
            <button onClick={verify} disabled={completed}
              className="px-4 py-2 bg-purple-900/50 border border-purple-700 text-purple-300 text-xs uppercase tracking-wider hover:bg-purple-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              VERIFY MST
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
          Establish the minimum-cost communication backbone. Connect all Guardian outposts using the least cable.
        </p>
        <div className="bg-purple-900/20 border border-purple-800/50 p-3 text-xs text-purple-300 mb-4">
          <strong>OBJECTIVE:</strong> Select exactly {NODES.length - 1} edges that connect all nodes with minimum total weight. No cycles allowed.
        </div>
        <div className="bg-green-900/20 border border-green-800/50 p-3 text-xs text-green-300">
          <strong>HINT:</strong> Kruskal's algorithm - always pick the smallest edge that doesn't create a cycle.
        </div>
      </aside>
    </div>
  );
}
