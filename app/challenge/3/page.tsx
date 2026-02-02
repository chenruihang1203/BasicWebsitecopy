'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GraphNode from '../components/GraphNode';
import GraphEdge from '../components/GraphEdge';

// Cult Terminal Styles
const styles = `
  @keyframes tunnel-dive { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0.5; } 100% { opacity: 0; transform: scale(2); } }
  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3));
    background-size: 100% 4px;
  }
`;

type BipartiteNode = {
  id: string;
  label: string;
  set: 'A' | 'B';
  x: number;
  y: number;
};

const NODES: BipartiteNode[] = [
  { id: 'A1', label: 'A1', set: 'A', x: 100, y: 100 },
  { id: 'A2', label: 'A2', set: 'A', x: 100, y: 200 },
  { id: 'A3', label: 'A3', set: 'A', x: 100, y: 300 },
  { id: 'B1', label: 'B1', set: 'B', x: 400, y: 100 },
  { id: 'B2', label: 'B2', set: 'B', x: 400, y: 200 },
  { id: 'B3', label: 'B3', set: 'B', x: 400, y: 300 },
];

const VALID_EDGES = [
  ['A1', 'B1'],
  ['A1', 'B2'],
  ['A2', 'B2'],
  ['A2', 'B3'],
  ['A3', 'B1'],
];

export default function BipartiteLevel() {
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[][]>([]);
  const [feedback, setFeedback] = useState('');
  const [history, setHistory] = useState<string[][][]>([[]]);

  useEffect(() => {
    if (matches.length === 3) {
      try {
        const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
        const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
        if (!completedLevels.includes(3)) {
          completedLevels.push(3);
          localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
        }
      } catch (e) {}
    }
  }, [matches]);

  const handleNodeClick = (nodeId: string) => {
    // Prevent clicking already matched nodes
    if (isMatched(nodeId) && !selectedNodes.includes(nodeId)) {
      setFeedback('⚠ NODE ALREADY CONSECRATED');
      setTimeout(() => setFeedback(''), 1000);
      return;
    }

    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
    } else {
      const newSelection = [...selectedNodes, nodeId];
      setSelectedNodes(newSelection);

      if (newSelection.length === 2) {
        const edge = [...newSelection].sort();
        
        // Check if both nodes belong to different sets
        const n1 = NODES.find(n => n.id === newSelection[0]);
        const n2 = NODES.find(n => n.id === newSelection[1]);
        
        if (n1 && n2 && n1.set === n2.set) {
          setFeedback('✗ CANNOT PAIR WITHIN SAME CLUSTER');
          setTimeout(() => {
            setSelectedNodes([]);
            setFeedback('');
          }, 1000);
          return;
        }

        if (VALID_EDGES.some((e) => JSON.stringify([...e].sort()) === JSON.stringify(edge))) {
          const newMatches = [...matches, edge];
          setMatches(newMatches);
          setHistory([...history, newMatches]);
          setFeedback('✓ NEURAL LINK ESTABLISHED');
        } else {
          setFeedback('✗ INVALID CONNECTION. RETRY.');
        }
        setTimeout(() => {
          setSelectedNodes([]);
          setFeedback('');
        }, 1000);
      }
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const lastMatches = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setMatches(lastMatches);
    setFeedback('');
  };

  const reset = () => {
    setMatches([]);
    setSelectedNodes([]);
    setFeedback('');
    setHistory([[]]);
  };

  const isMatched = (nodeId: string) => {
    return matches.some((m) => m.includes(nodeId));
  };

  return (
    <div className="flex h-screen bg-black text-purple-50 font-mono">
      <style>{styles}</style>
      
      {/* Background */}
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
            PROTOCOL v3 // BIPARTITE_MATCH
          </div>
          <h1 className="text-3xl font-black text-white mb-2">AGENT ASSIGNMENT OPTIMIZATION</h1>
          <p className="text-slate-400 text-sm">Match infiltration agents (A) to Guardian sectors (B). Maximize coverage.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-purple-900/50 p-6 mb-4 relative" style={{ height: '400px' }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {VALID_EDGES.map((edge, i) => {
              const n1 = NODES.find((n) => n.id === edge[0]);
              const n2 = NODES.find((n) => n.id === edge[1]);
              if (!n1 || !n2) return null;
              const highlighted = matches.some((m) => JSON.stringify(m.sort()) === JSON.stringify(edge.sort()));
              return <GraphEdge key={i} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} highlighted={highlighted} />;
            })}
          </svg>
          {NODES.map((node) => (
            <GraphNode
              key={node.id}
              id={node.id}
              label={node.label}
              x={node.x}
              y={node.y}
              selected={selectedNodes.includes(node.id) || isMatched(node.id)}
              onClick={() => handleNodeClick(node.id)}
            />
          ))}
        </div>

        {feedback && (
          <div className={`p-4 text-center font-bold uppercase tracking-wider border ${feedback.includes('✓') ? 'border-purple-500 text-purple-400 bg-purple-900/30' : 'border-red-500 text-red-400 bg-red-900/30'}`}>
            {feedback}
          </div>
        )}

        <div className="mt-4 bg-slate-900/50 border border-purple-900/50 p-4">
          <div className="font-bold mb-3 text-sm">
            {matches.length === 3 
              ? <span className="text-purple-400">✓ ALGORITHM OPTIMIZED. MAXIMUM MATCHING ACHIEVED.</span>
              : <span className="text-slate-400">LINKS ESTABLISHED: {matches.length} / 3</span>}
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
          Assign each infiltration agent to a compatible Guardian sector. Valid connections are displayed. Each agent can only be assigned once.
        </p>
        <div className="bg-purple-900/20 border border-purple-800/50 p-3 text-xs text-purple-300">
          <strong>OBJECTIVE:</strong> Establish all 3 agent-sector links to complete the assignment matrix.
        </div>
      </aside>
    </div>
  );
}
