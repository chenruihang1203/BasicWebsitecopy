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

type City = {
  id: string;
  name: string;
  x: number;
  y: number;
};

const CITIES: City[] = [
  { id: 'A', name: 'A', x: 250, y: 80 },
  { id: 'B', name: 'B', x: 450, y: 100 },
  { id: 'D', name: 'D', x: 400, y: 280 },
  { id: 'C', name: 'C', x: 150, y: 300 },
];

const DISTANCES: Record<string, Record<string, number>> = {
  A: { B: 8, C: 12, D: 10 },
  B: { A: 8, C: 6, D: 15 },
  C: { A: 12, B: 6, D: 9 },
  D: { A: 10, B: 15, C: 9 },
};

export default function TSPLevel() {
  const [path, setPath] = useState<string[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<{ path: string[]; distance: number }[]>([{ path: [], distance: 0 }]);

  useEffect(() => {
    if (completed) {
      try {
        const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
        const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
        if (!completedLevels.includes(5)) {
          completedLevels.push(5);
          localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
        }
      } catch (e) {}
    }
  }, [completed]);

  const handleCityClick = (cityId: string) => {
    if (completed) return;

    if (path.length === 0) {
      const newPath = [cityId];
      setPath(newPath);
      setTotalDistance(0);
      setHistory([...history, { path: newPath, distance: 0 }]);
    } else if (path.includes(cityId)) {
      return;
    } else {
      const lastCity = path[path.length - 1];
      const distance = DISTANCES[lastCity][cityId];
      const newPath = [...path, cityId];
      const newTotal = totalDistance + distance;
      setPath(newPath);
      setTotalDistance(newTotal);
      setHistory([...history, { path: newPath, distance: newTotal }]);

      if (newPath.length === CITIES.length) {
        const returnDistance = DISTANCES[cityId][newPath[0]];
        const finalDistance = newTotal + returnDistance;
        setTotalDistance(finalDistance);
        setCompleted(finalDistance === 33);
      }
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    const lastState = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setPath(lastState.path);
    setTotalDistance(lastState.distance);
    setCompleted(false);
  };

  const reset = () => {
    setPath([]);
    setTotalDistance(0);
    setCompleted(false);
    setHistory([{ path: [], distance: 0 }]);
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
            PROTOCOL v5 // TSP_INFILTRATE
          </div>
          <h1 className="text-3xl font-black text-white mb-2">OPTIMAL INFILTRATION ROUTE</h1>
          <p className="text-slate-400 text-sm">Visit all high-value targets with minimum resource expenditure. Return to origin.</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur border border-purple-900/50 p-6 mb-4 relative" style={{ height: '400px' }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {CITIES.map((city, i) =>
              CITIES.slice(i + 1).map((other, j) => (
                <GraphEdge key={`${i}-${j}`} x1={city.x} y1={city.y} x2={other.x} y2={other.y} weight={DISTANCES[city.id][other.id]} />
              ))
            )}
            {path.length > 1 &&
              path.map((cityId, i) => {
                if (i === 0) return null;
                const c1 = CITIES.find((c) => c.id === path[i - 1]);
                const c2 = CITIES.find((c) => c.id === cityId);
                if (!c1 || !c2) return null;
                return <GraphEdge key={i} x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} highlighted />;
              })}
            {completed && path.length > 0 && (
              <GraphEdge
                x1={CITIES.find((c) => c.id === path[path.length - 1])!.x}
                y1={CITIES.find((c) => c.id === path[path.length - 1])!.y}
                x2={CITIES.find((c) => c.id === path[0])!.x}
                y2={CITIES.find((c) => c.id === path[0])!.y}
                highlighted
              />
            )}
          </svg>
          {CITIES.map((city) => (
            <GraphNode key={city.id} id={city.id} label={city.name} x={city.x} y={city.y}
              selected={path.includes(city.id)} onClick={() => handleCityClick(city.id)} />
          ))}
        </div>

        <div className="mt-4 bg-slate-900/50 border border-purple-900/50 p-4">
          <div className="font-bold mb-2 text-sm">
            {completed 
              ? <span className="text-purple-400">✓ ALGORITHM OPTIMIZED. OPTIMAL ROUTE: COST {totalDistance}</span>
              : <span className="text-slate-400">ROUTE: {path.length > 0 ? path.join(' → ') : 'SELECT ORIGIN TARGET'}</span>}
          </div>
          {!completed && <div className="text-xs text-slate-500 mb-3">RESOURCE COST: {totalDistance}</div>}
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
          Calculate the most efficient route to hit all Guardian strongholds. Minimize total resource expenditure while covering every target.
        </p>
        <div className="bg-purple-900/20 border border-purple-800/50 p-3 text-xs text-purple-300">
          <strong>OBJECTIVE:</strong> Find the route with minimum total cost (optimal: 33).
        </div>
      </aside>
    </div>
  );
}
