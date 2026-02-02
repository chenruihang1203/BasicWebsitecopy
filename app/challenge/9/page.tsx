'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GraphNode from '../components/GraphNode'; // 假设你已有这些组件
import GraphEdge from '../components/GraphEdge';

const styles = `
  @keyframes tunnel-dive { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0.5; } 100% { opacity: 0; transform: scale(2); } }
  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3));
    background-size: 100% 4px;
  }
  .glow-text { text-shadow: 0 0 10px rgba(168, 85, 247, 0.5); }
`;

type Node = { id: string; x: number; y: number; label: string };
type EdgeDef = { u: string; v: string; weight: number; id: string };

// 6 Nodes Layout
const NODES: Node[] = [
  { id: 'A', x: 300, y: 50, label: 'A' },
  { id: 'B', x: 500, y: 120, label: 'B' },
  { id: 'C', x: 500, y: 280, label: 'C' },
  { id: 'D', x: 300, y: 350, label: 'D' },
  { id: 'E', x: 100, y: 280, label: 'E' },
  { id: 'F', x: 100, y: 120, label: 'F' },
];

// Graph Structure: 4 Odd Degree Nodes (B, C, E, F)
const EDGES: EdgeDef[] = [
  { u: 'A', v: 'B', weight: 4, id: 'e1' },
  { u: 'B', v: 'C', weight: 3, id: 'e2' }, // Cheap edge, strategic for repeating
  { u: 'C', v: 'D', weight: 4, id: 'e3' },
  { u: 'D', v: 'E', weight: 2, id: 'e4' },
  { u: 'E', v: 'F', weight: 3, id: 'e5' }, // Cheap edge, strategic for repeating
  { u: 'F', v: 'A', weight: 5, id: 'e6' },
  { u: 'B', v: 'E', weight: 6, id: 'e7' }, // Cross connection
  { u: 'C', v: 'F', weight: 5, id: 'e8' }, // Cross connection
];

// Optimal Cost: Base(32) + Repeat(B-C:3) + Repeat(E-F:3) = 38
const OPTIMAL_COST = 38;
const TOTAL_EDGE_COUNT = EDGES.length;

export default function CPPLevel() {
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [visitedEdgeIds, setVisitedEdgeIds] = useState<string[]>([]); // Allow duplicates
  const [totalCost, setTotalCost] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState('Select a START NODE to begin the Pilgrimage.');

  // Check win condition
  useEffect(() => {
    if (currentNode === null) return;

    // Condition 1: Must be back at start
    const isBackAtStart = path.length > 1 && currentNode === path[0];
    
    // Condition 2: Must visit ALL unique edges at least once
    const uniqueVisited = new Set(visitedEdgeIds).size;
    const allEdgesCovered = uniqueVisited === TOTAL_EDGE_COUNT;

    if (allEdgesCovered && isBackAtStart) {
      if (totalCost === OPTIMAL_COST) {
        setCompleted(true);
        setMessage('✓ PILGRIMAGE PERFECTED. ENTROPY MINIMIZED.');
        saveProgress();
      } else {
        setMessage(`⚠ COMPLETE BUT INEFFICIENT. COST: ${totalCost} (TARGET: ${OPTIMAL_COST}). REDUCE REDUNDANCY.`);
      }
    } else if (allEdgesCovered && !isBackAtStart) {
      setMessage('⚠ ALL PATHS COVERED. RETURN TO ORIGIN TO COMPLETE LOOP.');
    }
  }, [currentNode, visitedEdgeIds, totalCost, path]);

  const saveProgress = () => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
      const levels: number[] = raw ? JSON.parse(raw) : [];
      if (!levels.includes(9)) {
        levels.push(9);
        localStorage.setItem('completed_levels', JSON.stringify(levels));
      }
    } catch (e) {}
  };

  const handleNodeClick = (nodeId: string) => {
    if (completed) return;

    // 1. Start Game
    if (currentNode === null) {
      setCurrentNode(nodeId);
      setPath([nodeId]);
      setMessage('TRAVERSAL INITIATED. COVER ALL PATHS.');
      return;
    }

    // 2. Move to neighbor
    const edge = EDGES.find(e => 
      (e.u === currentNode && e.v === nodeId) || 
      (e.v === currentNode && e.u === nodeId)
    );

    if (edge) {
      setPath(prev => [...prev, nodeId]);
      setCurrentNode(nodeId);
      setTotalCost(prev => prev + edge.weight);
      setVisitedEdgeIds(prev => [...prev, edge.id]);
      setMessage('TRAVERSING...');
    } else {
      // Invalid move (not a neighbor)
      setMessage('⚠ NO DIRECT LINK. CANNOT JUMP.');
    }
  };

  const reset = () => {
    setCurrentNode(null);
    setPath([]);
    setVisitedEdgeIds([]);
    setTotalCost(0);
    setCompleted(false);
    setMessage('Select a START NODE to begin the Pilgrimage.');
  };

  const undo = () => {
    if (path.length <= 1) {
      reset();
      return;
    }
    const prevNode = path[path.length - 2];
    const removedNode = path[path.length - 1];
    
    // Find edge to remove cost/visit
    // Note: This simple undo removes the last instance of the edge traversed
    const edge = EDGES.find(e => 
      (e.u === prevNode && e.v === removedNode) || 
      (e.v === prevNode && e.u === removedNode)
    );

    if (edge) {
      const newVisited = [...visitedEdgeIds];
      const index = newVisited.lastIndexOf(edge.id);
      if (index > -1) newVisited.splice(index, 1);
      
      setVisitedEdgeIds(newVisited);
      setTotalCost(prev => prev - edge.weight);
      setPath(prev => prev.slice(0, -1));
      setCurrentNode(prevNode);
      setCompleted(false);
      setMessage('STEP REVERTED.');
    }
  };

  // Helper to count how many times an edge is visited
  const getEdgeVisitCount = (edgeId: string) => {
    return visitedEdgeIds.filter(id => id === edgeId).length;
  };

  return (
    <div className="flex h-screen bg-black text-purple-50 font-mono select-none">
      <style>{styles}</style>
      
      {/* Visual Effects */}
      <div className="absolute inset-0 overflow-hidden bg-black">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="absolute inset-0 border-[50px] border-purple-900/20 opacity-0"
               style={{ animation: `tunnel-dive 4s linear infinite`, animationDelay: `${i * 0.8}s` }} />
        ))}
      </div>
      <div className="scanlines absolute inset-0 z-10 pointer-events-none opacity-20"></div>

      {/* Main Interface */}
      <div className="relative z-20 flex-1 p-8 flex flex-col">
        <Link href="/challenge" className="text-purple-400 hover:text-purple-300 text-sm uppercase tracking-widest mb-4 inline-flex items-center gap-2 w-fit">
          <span>←</span> ABORT PILGRIMAGE
        </Link>
        
        <div className="mb-2">
          <div className="inline-block border border-purple-500/30 bg-purple-950/20 px-3 py-1 text-xs tracking-[0.2em] text-purple-400 mb-2 glow-text">
            PROTOCOL v9 // THE_PILGRIMAGE
          </div>
          <h1 className="text-3xl font-black text-white mb-1">ROUTE OPTIMIZATION</h1>
          <p className="text-slate-400 text-sm">Traverse every connection (edge) at least once. Return to origin. Minimize repetition.</p>
        </div>

        {/* Graph Area */}
        <div className="flex-1 bg-slate-900/80 backdrop-blur border border-purple-900/50 p-6 relative rounded-lg shadow-2xl">
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {EDGES.map((edge) => {
              const u = NODES.find(n => n.id === edge.u)!;
              const v = NODES.find(n => n.id === edge.v)!;
              const visits = getEdgeVisitCount(edge.id);
              const isTraversed = visits > 0;
              
              // Visual calculation for text label
              const midX = (u.x + v.x) / 2;
              const midY = (u.y + v.y) / 2;

              return (
                <g key={edge.id}>
                  {/* Base Line */}
                  <line 
                    x1={u.x} y1={u.y} x2={v.x} y2={v.y} 
                    stroke={isTraversed ? '#a855f7' : '#334155'} 
                    strokeWidth={isTraversed ? 2 + visits : 2}
                    opacity={isTraversed ? 1 : 0.4}
                  />
                  {/* Weight Label */}
                  <rect x={midX - 10} y={midY - 10} width="20" height="20" fill="#0f172a" rx="4" />
                  <text 
                    x={midX} y={midY} 
                    dy="5" textAnchor="middle" 
                    fill={isTraversed ? '#d8b4fe' : '#64748b'} 
                    fontSize="12" fontWeight="bold"
                  >
                    {edge.weight}
                  </text>
                  {/* Visit Counter Badge (if repeated) */}
                  {visits > 1 && (
                    <circle cx={midX + 15} cy={midY - 10} r="8" fill="#ef4444">
                      <title>Redundancy Detected</title>
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {NODES.map((node) => {
            const isCurrent = currentNode === node.id;
            const isStart = path.length > 0 && path[0] === node.id;
            
            return (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center border-2 font-bold cursor-pointer transition-all z-10
                  ${isCurrent 
                    ? 'bg-purple-600 border-white text-white shadow-[0_0_20px_rgba(168,85,247,0.8)] scale-110' 
                    : isStart
                      ? 'bg-purple-900/50 border-purple-400 text-purple-300'
                      : 'bg-slate-900 border-slate-600 text-slate-500 hover:border-purple-500 hover:text-purple-300'
                  }`}
                style={{ left: node.x, top: node.y }}
              >
                {node.label}
              </div>
            );
          })}
        </div>

        {/* Status Bar */}
        <div className="mt-4 bg-slate-900/50 border border-purple-900/50 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <div className={`font-bold text-sm mb-1 ${completed ? 'text-green-400' : 'text-purple-300'}`}>
              {message}
            </div>
            <div className="flex gap-4 text-xs text-slate-400 font-mono">
              <span>CURRENT COST: <span className="text-white">{totalCost}</span></span>
              <span>UNIQUE PATHS: <span className={new Set(visitedEdgeIds).size === TOTAL_EDGE_COUNT ? 'text-green-400' : 'text-white'}>
                {new Set(visitedEdgeIds).size} / {TOTAL_EDGE_COUNT}
              </span></span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={undo} disabled={path.length <= 1 || completed}
              className="px-6 py-3 bg-slate-800 border border-slate-600 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
              Undo
            </button>
            <button onClick={reset}
              className="px-6 py-3 bg-purple-900/20 border border-purple-600 text-purple-400 text-xs font-bold uppercase tracking-wider hover:bg-purple-900/40">
              Reset Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Lore */}
      <aside className="relative z-20 w-80 bg-black/80 border-l border-purple-900/50 p-6 backdrop-blur-md flex flex-col justify-center">
        <div className="mb-8">
          <h3 className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-3 border-b border-purple-900/50 pb-2">
            CULTIST DOCTRINE
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed italic">
            "The Guardians wander in aimless circles, lost in their own inefficiency. We must walk every road in their domain with mathematical perfection to sanctify the earth beneath their feet."
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-700 p-3">
            <h4 className="text-white text-xs font-bold mb-1">OBJECTIVE</h4>
            <p className="text-slate-400 text-[10px]">
              1. Start at any node.<br/>
              2. Traverse <strong>EVERY</strong> edge at least once.<br/>
              3. Return to the start node.<br/>
              4. Minimize total energy cost.
            </p>
          </div>
          
          <div className="bg-purple-900/20 border border-purple-500/30 p-3">
            <h4 className="text-purple-300 text-xs font-bold mb-1">HINT: PARITY</h4>
            <p className="text-purple-400/70 text-[10px]">
              Odd-degree nodes are sources of chaos. You must traverse the paths between them an even number of times to balance the equation. Find the shortest connection between the odd nodes.
            </p>
          </div>

          <div className="bg-green-900/10 border border-green-500/30 p-3">
             <h4 className="text-green-400 text-xs font-bold mb-1">TARGET METRICS</h4>
             <p className="text-green-300/70 text-[10px]">
               Optimal Cost: <strong>{OPTIMAL_COST}</strong>
             </p>
          </div>
        </div>
      </aside>
    </div>
  );
}