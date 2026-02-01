'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  isSource?: boolean;
  isSink?: boolean;
};

type Edge = {
  from: string;
  to: string;
  capacity: number;
  cost: number; // cost per unit of flow
  id: number;
};

// MinCostFlow network: need to send exactly REQUIRED_FLOW units at minimum cost
const NODES: GraphNode2[] = [
  { id: 'S', label: 'S', x: 60, y: 180, isSource: true },
  { id: 'A', label: 'A', x: 200, y: 80 },
  { id: 'B', label: 'B', x: 200, y: 280 },
  { id: 'C', label: 'C', x: 340, y: 80 },
  { id: 'D', label: 'D', x: 340, y: 280 },
  { id: 'T', label: 'T', x: 460, y: 180, isSink: true },
];

// Edges with capacity AND cost per unit
// Optimal: Send 10 through S→A→C→T (cost 1+2+1=4 per unit = 40 total)
//          Send 5 through S→B→D→T (cost 3+1+2=6 per unit = 30 total)
// Total: 15 flow at cost 70
const EDGES: Edge[] = [
  { from: 'S', to: 'A', capacity: 10, cost: 1, id: 0 },
  { from: 'S', to: 'B', capacity: 10, cost: 3, id: 1 },
  { from: 'A', to: 'C', capacity: 8, cost: 2, id: 2 },
  { from: 'A', to: 'D', capacity: 5, cost: 5, id: 3 },
  { from: 'B', to: 'A', capacity: 3, cost: 1, id: 4 },
  { from: 'B', to: 'D', capacity: 8, cost: 1, id: 5 },
  { from: 'C', to: 'T', capacity: 12, cost: 1, id: 6 },
  { from: 'D', to: 'C', capacity: 4, cost: 2, id: 7 },
  { from: 'D', to: 'T', capacity: 10, cost: 2, id: 8 },
];

const REQUIRED_FLOW = 15;
const MIN_COST = 70;

export default function MinCostFlowLevel() {
  const [flows, setFlows] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    EDGES.forEach(e => { initial[e.id] = 0; });
    return initial;
  });
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate flow into/out of each node
  const getNodeFlows = (): Record<string, { in: number; out: number }> => {
    const nodeFlows: Record<string, { in: number; out: number }> = {};
    NODES.forEach(n => { nodeFlows[n.id] = { in: 0, out: 0 }; });
    
    EDGES.forEach(edge => {
      const flow = flows[edge.id];
      nodeFlows[edge.from].out += flow;
      nodeFlows[edge.to].in += flow;
    });
    
    return nodeFlows;
  };

  // Check flow conservation
  const checkFlowConservation = (): boolean => {
    const nodeFlows = getNodeFlows();
    
    for (const node of NODES) {
      if (node.isSource || node.isSink) continue;
      if (nodeFlows[node.id].in !== nodeFlows[node.id].out) {
        return false;
      }
    }
    return true;
  };

  // Get total flow reaching sink
  const getTotalFlow = (): number => {
    const nodeFlows = getNodeFlows();
    return nodeFlows['T'].in;
  };

  // Get total cost
  const getTotalCost = (): number => {
    return EDGES.reduce((sum, edge) => {
      return sum + flows[edge.id] * edge.cost;
    }, 0);
  };

  useEffect(() => {
    const totalFlow = getTotalFlow();
    const totalCost = getTotalCost();
    const conserved = checkFlowConservation();
    
    if (totalFlow === REQUIRED_FLOW && totalCost <= MIN_COST && conserved) {
      setCompleted(true);
      try {
        const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
        const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
        if (!completedLevels.includes(8)) {
          completedLevels.push(8);
          localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
        }
      } catch (e) {}
    }
  }, [flows]);

  const handleEdgeClick = (edgeId: number) => {
    if (completed) return;
    setSelectedEdge(edgeId);
    setErrorMessage(null);
  };

  const adjustFlow = (delta: number) => {
    if (selectedEdge === null || completed) return;
    const edge = EDGES.find(e => e.id === selectedEdge);
    if (!edge) return;
    
    const currentFlow = flows[selectedEdge];
    const newFlow = Math.max(0, Math.min(edge.capacity, currentFlow + delta));
    
    setFlows({ ...flows, [selectedEdge]: newFlow });
  };

  const verify = () => {
    if (!checkFlowConservation()) {
      const nodeFlows = getNodeFlows();
      for (const node of NODES) {
        if (node.isSource || node.isSink) continue;
        if (nodeFlows[node.id].in !== nodeFlows[node.id].out) {
          setErrorMessage(`Node ${node.id} violates flow conservation (in: ${nodeFlows[node.id].in}, out: ${nodeFlows[node.id].out})`);
          return;
        }
      }
    }
    
    const totalFlow = getTotalFlow();
    if (totalFlow !== REQUIRED_FLOW) {
      setErrorMessage(`Flow must be exactly ${REQUIRED_FLOW}. Current: ${totalFlow}.`);
      return;
    }
    
    const totalCost = getTotalCost();
    if (totalCost > MIN_COST) {
      setErrorMessage(`Cost ${totalCost} exceeds minimum. Find a cheaper route! (Target: ≤${MIN_COST})`);
      return;
    }
  };

  const reset = () => {
    const initial: Record<number, number> = {};
    EDGES.forEach(e => { initial[e.id] = 0; });
    setFlows(initial);
    setSelectedEdge(null);
    setCompleted(false);
    setErrorMessage(null);
  };

  const nodeFlows = getNodeFlows();

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
          <div className="inline-block border border-red-500/30 bg-red-950/20 px-3 py-1 text-xs tracking-[0.2em] text-red-400 mb-2">
            PROTOCOL v8 // MIN_COST_FLOW
          </div>
          <h1 className="text-3xl font-black text-white mb-2">ECONOMIC INFILTRATION</h1>
          <p className="text-slate-400 text-sm">Transmit exactly {REQUIRED_FLOW} units of data at minimum cost. Each channel has bandwidth AND pricing.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-purple-900/50 p-6 mb-4 relative" style={{ height: '400px' }}>
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {EDGES.map((edge) => {
              const n1 = NODES.find((n) => n.id === edge.from);
              const n2 = NODES.find((n) => n.id === edge.to);
              if (!n1 || !n2) return null;
              
              const flow = flows[edge.id];
              const isSelected = selectedEdge === edge.id;
              const isSaturated = flow === edge.capacity;
              const hasFlow = flow > 0;
              
              const midX = (n1.x + n2.x) / 2;
              const midY = (n1.y + n2.y) / 2;
              
              const dx = n2.x - n1.x;
              const dy = n2.y - n1.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const ux = dx / len;
              const uy = dy / len;
              
              const arrowX = n2.x - ux * 25;
              const arrowY = n2.y - uy * 25;
              const arrowSize = 8;
              
              return (
                <g key={edge.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => handleEdgeClick(edge.id)}>
                  <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="transparent" strokeWidth="20" />
                  
                  <line 
                    x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                    stroke={isSelected ? '#a855f7' : isSaturated ? '#22c55e' : hasFlow ? '#3b82f6' : '#475569'}
                    strokeWidth={isSelected ? 4 : hasFlow ? 3 : 2}
                    opacity={0.8}
                  />
                  
                  <polygon
                    points={`${arrowX},${arrowY} ${arrowX - ux * arrowSize + uy * arrowSize / 2},${arrowY - uy * arrowSize - ux * arrowSize / 2} ${arrowX - ux * arrowSize - uy * arrowSize / 2},${arrowY - uy * arrowSize + ux * arrowSize / 2}`}
                    fill={isSelected ? '#a855f7' : isSaturated ? '#22c55e' : hasFlow ? '#3b82f6' : '#475569'}
                  />
                  
                  {/* Flow/Capacity and Cost labels */}
                  <rect x={midX - 28} y={midY - 18} width="56" height="36" rx="3" 
                    fill={isSelected ? '#7c3aed' : '#1e293b'} 
                    stroke={isSelected ? '#a855f7' : '#475569'} strokeWidth="1" />
                  <text x={midX} y={midY - 5} textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    {flow}/{edge.capacity}
                  </text>
                  <text x={midX} y={midY + 10} textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace">
                    ${edge.cost}/unit
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Nodes */}
          {NODES.map((node) => {
            const nf = nodeFlows[node.id];
            return (
              <div key={node.id} className="absolute" style={{ left: node.x - 20, top: node.y - 20 }}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2
                  ${node.isSource ? 'bg-green-900 border-green-500 text-green-300' : 
                    node.isSink ? 'bg-red-900 border-red-500 text-red-300' : 
                    'bg-slate-800 border-slate-600 text-white'}`}>
                  {node.label}
                </div>
                {!node.isSource && !node.isSink && (
                  <div className={`text-[9px] text-center mt-1 ${nf.in === nf.out ? 'text-green-400' : 'text-red-400'}`}>
                    {nf.in}→{nf.out}
                  </div>
                )}
                {node.isSource && <div className="text-[9px] text-center mt-1 text-green-400">OUT: {nf.out}</div>}
                {node.isSink && <div className="text-[9px] text-center mt-1 text-red-400">IN: {nf.in}</div>}
              </div>
            );
          })}
        </div>

        <div className="mt-4 bg-slate-900/50 border border-purple-900/50 p-4">
          <div className="font-bold mb-2 text-sm">
            {completed
              ? <span className="text-purple-400">✓ ALGORITHM OPTIMIZED. MINIMUM COST FLOW ACHIEVED.</span>
              : errorMessage 
                ? <span className="text-red-400">⚠ {errorMessage}</span>
                : <span className="text-slate-400">FLOW: {getTotalFlow()}/{REQUIRED_FLOW} | COST: ${getTotalCost()} (Target: ≤${MIN_COST})</span>}
          </div>
          
          {selectedEdge !== null && !completed && (
            <div className="flex items-center gap-4 mb-3 p-2 bg-purple-900/30 border border-purple-700">
              <span className="text-purple-300 text-sm">
                Edge {EDGES.find(e => e.id === selectedEdge)?.from} → {EDGES.find(e => e.id === selectedEdge)?.to} 
                (${EDGES.find(e => e.id === selectedEdge)?.cost}/unit):
              </span>
              <button onClick={() => adjustFlow(-5)} className="px-2 py-1 bg-slate-700 text-white text-xs">-5</button>
              <button onClick={() => adjustFlow(-1)} className="px-2 py-1 bg-slate-700 text-white text-xs">-1</button>
              <span className="text-white font-bold">{flows[selectedEdge]}</span>
              <button onClick={() => adjustFlow(1)} className="px-2 py-1 bg-slate-700 text-white text-xs">+1</button>
              <button onClick={() => adjustFlow(5)} className="px-2 py-1 bg-slate-700 text-white text-xs">+5</button>
            </div>
          )}
          
          <div className="flex gap-3">
            <button onClick={verify} disabled={completed}
              className="px-4 py-2 bg-purple-900/50 border border-purple-700 text-purple-300 text-xs uppercase tracking-wider hover:bg-purple-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              VERIFY SOLUTION
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
          Route exactly {REQUIRED_FLOW} units of data from S to T at minimum total cost. Budget is critical.
        </p>
        <div className="bg-purple-900/20 border border-purple-800/50 p-3 text-xs text-purple-300 mb-4">
          <strong>RULES:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Total flow must equal {REQUIRED_FLOW}</li>
            <li>Cost = Σ(flow × cost per unit)</li>
            <li>Minimize total cost</li>
            <li>Flow conservation applies</li>
          </ul>
        </div>
        <div className="bg-red-900/20 border border-red-800/50 p-3 text-xs text-red-300">
          <strong>CHALLENGE:</strong> Cheap routes may have low capacity. Balance cost and throughput!
        </div>
      </aside>
    </div>
  );
}
