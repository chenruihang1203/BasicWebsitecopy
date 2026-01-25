'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GraphNode from '../components/GraphNode';
import GraphEdge from '../components/GraphEdge';

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
      } catch (e) {
        // ignore
      }
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
        // Completion only when the tour distance equals the required minimum (33)
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
    <div className="flex h-screen bg-gradient-to-br from-orange-400 to-pink-500">
      <div className="flex-1 p-8">
        <Link href="/challenge" className="text-white/80 hover:text-white underline mb-4 inline-block">
          ← Back to Challenges
        </Link>
        <Link href="/" className="text-white/80 hover:text-white underline mb-4 inline-block algorithmchallenges-back-to-homepage">
          ← Back to Homepage
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Level 5: Traveling Salesman Problem</h1>
        <p className="text-white/90 mb-6">Visit all cities exactly once and return to start. Find the shortest route!</p>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-4 relative" style={{ height: '400px' }}>
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {CITIES.map((city, i) =>
              CITIES.slice(i + 1).map((other, j) => (
                <GraphEdge
                  key={`${i}-${j}`}
                  x1={city.x}
                  y1={city.y}
                  x2={other.x}
                  y2={other.y}
                  weight={DISTANCES[city.id][other.id]}
                />
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
            <GraphNode
              key={city.id}
              id={city.id}
              label={city.name}
              x={city.x}
              y={city.y}
              selected={path.includes(city.id)}
              onClick={() => handleCityClick(city.id)}
            />
          ))}
        </div>

        <div className="mt-4 bg-white/20 backdrop-blur rounded-lg p-4 text-white">
          <div className="font-semibold mb-2">
            {completed ? `✅ Tour Complete! Total Distance: ${totalDistance}` : `Path: ${path.join(' → ') || 'Start by selecting a city'}`}
          </div>
          {!completed && <div className="text-sm mb-2">Distance so far: {totalDistance}</div>}
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
          Click cities in order to create a tour. Once you visit all cities, the path will automatically return to the start.
        </p>
        <div className="bg-white/20 rounded p-3 text-white text-xs">
          <strong>Goal:</strong> Minimize the total distance!
        </div>
      </aside>
    </div>
  );
}
