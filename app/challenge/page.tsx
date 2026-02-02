'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LEVELS, type LevelData } from './data/levels';

// ==========================================
// CULT TERMINAL STYLES (Matching turingchat)
// ==========================================
const styles = `
  @keyframes scan-horizontal { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes blink-purple { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; box-shadow: 0 0 30px purple; } }
  @keyframes tunnel-dive { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0.5; } 100% { opacity: 0; transform: scale(2); } }
  @keyframes glitch { 
    0% { transform: translate(0); } 
    20% { transform: translate(-2px, 2px); } 
    40% { transform: translate(-2px, -2px); } 
    60% { transform: translate(2px, 2px); } 
    80% { transform: translate(2px, -2px); } 
    100% { transform: translate(0); }
  }
  @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.3); } 50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.6); } }
  
  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3));
    background-size: 100% 4px;
  }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #0f0518; }
  ::-webkit-scrollbar-thumb { background: #581c87; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
`;

// 🌀 Neural Network Background
const NeuralNetworkBg = () => {
  const [lines, setLines] = useState<{x1: string, y1: string, x2: string, y2: string}[]>([]);

  useEffect(() => {
    setLines(Array.from({ length: 20 }).map(() => ({
      x1: `${Math.random() * 100}%`,
      y1: `${Math.random() * 100}%`,
      x2: `${Math.random() * 100}%`,
      y2: `${Math.random() * 100}%`
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="absolute inset-0 border-[50px] border-purple-900/30 opacity-0"
             style={{ animation: `tunnel-dive 4s linear infinite`, animationDelay: `${i * 0.8}s` }}>
        </div>
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)] z-10"></div>
      {/* Neural connections */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        {lines.map((line, i) => (
          <line key={i} 
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke="#a855f7" strokeWidth="1" opacity="0.3"
          />
        ))}
      </svg>
    </div>
  );
};

type User = {
  name?: string;
  avatar?: string;
  bio?: string;
};

export default function ChallengePage() {
  const router = useRouter();
  const [user, setUser] = useState<User>({ name: 'Cultist', avatar: '👁️', bio: 'AI Trainer' });
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  const handleTerminateSession = () => {
    try {
      localStorage.removeItem('turing_user');
      localStorage.removeItem('session_user_name');
      localStorage.removeItem('completed_levels');
      sessionStorage.clear();
    } catch(e) {}
    router.push('/');
  };

  useEffect(() => {
    try {
      const sessionRaw = typeof window !== 'undefined' ? sessionStorage.getItem('turing_user') : null;
      const localRaw = typeof window !== 'undefined' ? localStorage.getItem('turing_user') : null;
      const raw = sessionRaw || localRaw;

      if (raw) {
        const parsed = JSON.parse(raw);
        setUser({
          name: parsed.name || 'Cultist',
          avatar: '👁️',
          bio: 'AI Neural Trainer',
        });
      }
      
      const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
      if (completedRaw) {
        setCompletedLevels(JSON.parse(completedRaw));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { border: 'border-green-500/50', text: 'text-green-400', bg: 'bg-green-900/30', label: 'EASY' };
      case 'medium':
        return { border: 'border-yellow-500/50', text: 'text-yellow-400', bg: 'bg-yellow-900/30', label: 'MEDIUM' };
      case 'hard':
        return { border: 'border-red-500/50', text: 'text-red-400', bg: 'bg-red-900/30', label: 'HARD' };
      case 'fatal':
        return { border: 'border-purple-400/80', text: 'text-purple-300', bg: 'bg-purple-900/50', label: '☠ FATAL' };
      default:
        return { border: 'border-gray-500/50', text: 'text-gray-400', bg: 'bg-gray-900/30', label: 'UNKNOWN' };
    }
  };

  return (
    <div className="relative h-screen w-full bg-black text-purple-50 font-mono overflow-hidden select-none">
      <style>{styles}</style>
      
      {/* Background */}
      <NeuralNetworkBg />
      <div className="scanlines absolute inset-0 z-10 pointer-events-none opacity-20"></div>

      <div className="relative z-20 flex h-full">
        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-block border border-purple-500/30 bg-purple-950/20 px-3 py-1 text-xs tracking-[0.2em] text-purple-400 mb-4">
              FACTION: CULT // MODE: NEURAL_TRAINING
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
              <span className="text-purple-500">AI</span> INFILTRATION PROTOCOLS
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl border-l-2 border-purple-800 pl-4">
              Train your AI to calculate optimal infiltration paths. 
              <span className="block text-purple-500 text-sm mt-1">// You must master the algorithm before teaching the machine.</span>
            </p>
          </div>

          {/* Protocol Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {LEVELS.map((level) => {
              const isCompleted = completedLevels.includes(level.id);
              const diffStyle = getDifficultyStyle(level.difficulty);
              
              return (
                <Link
                  key={level.id}
                  href={level.route}
                  className={`group relative block bg-black/80 backdrop-blur-sm border-2 p-6 transition-all duration-300 hover:scale-[1.02] overflow-hidden
                    ${isCompleted ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]' : 'border-slate-800 hover:border-purple-600'}
                    ${level.difficulty === 'fatal' ? 'animate-pulse' : ''}
                  `}
                  style={{ animation: isCompleted ? 'pulse-glow 3s infinite' : 'none' }}
                >
                  {/* Top neon strip */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${level.difficulty === 'fatal' ? 'bg-purple-400 animate-pulse' : isCompleted ? 'bg-purple-500' : 'bg-slate-700'}`}></div>
                  
                  {/* Protocol ID */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-purple-500 font-mono text-xs bg-purple-900/30 px-2 py-1 border border-purple-800">
                        {level.protocolName}
                      </span>
                      {isCompleted && (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase bg-purple-600 text-black tracking-wider">
                          ✓ OPTIMIZED
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase border ${diffStyle.border} ${diffStyle.text} ${diffStyle.bg} ${level.difficulty === 'fatal' ? 'animate-pulse' : ''}`}>
                      {diffStyle.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {level.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-slate-400 text-sm mb-4">{level.description}</p>
                  
                  {/* Lore */}
                  <p className="text-purple-400/60 text-xs italic border-t border-slate-800 pt-3">
                    "{level.loreDescription}"
                  </p>

                  {/* Action Button */}
                  <div className={`mt-4 py-2 text-center text-xs font-bold uppercase transition-all
                    ${isCompleted 
                      ? 'bg-purple-900/50 text-purple-400 group-hover:bg-purple-600 group-hover:text-black' 
                      : 'bg-slate-800 text-slate-400 group-hover:bg-purple-600 group-hover:text-black'
                    }`}>
                    {isCompleted ? 'RE-OPTIMIZE ALGORITHM' : 'INITIALIZE TRAINING'}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Back Link */}
          <Link href="/turingchat" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-colors text-sm">
            <span>←</span>
            <span className="uppercase tracking-widest">Return to Lobby</span>
          </Link>
        </div>

        {/* Right Sidebar - Cult Status Panel */}
        <aside className="w-80 bg-black/80 border-l border-purple-900/50 p-6 backdrop-blur-md flex flex-col">
          {/* User Info */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 border-2 border-purple-500 bg-purple-950/50 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(168,85,247,0.3)]">
              👁️
            </div>
            <div className="text-purple-400 font-bold text-lg tracking-wide">{user.name?.toUpperCase()}</div>
            <div className="text-slate-500 text-xs uppercase tracking-[0.3em]">AI Trainer</div>
            <div className="text-purple-500 text-xs uppercase tracking-[0.3em] font-bold">CULT FACTION</div>
          </div>

          {/* Progress Panel */}
          <div className="bg-black/50 border border-purple-900/50 rounded-lg p-4 mb-4">
            <h4 className="text-purple-400 font-semibold text-xs uppercase tracking-wider mb-3 border-b border-purple-900/50 pb-2">
              Training Progress
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Protocols Optimized</span>
                <span className="text-purple-400 font-bold">{completedLevels.length} / {LEVELS.length}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 transition-all duration-500"
                  style={{ width: `${(completedLevels.length / LEVELS.length) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 text-center">
                {completedLevels.length === LEVELS.length 
                  ? '// ALL PROTOCOLS OPTIMIZED. AI READY FOR DEPLOYMENT.' 
                  : '// Complete all protocols to unlock full AI potential.'}
              </div>
            </div>
          </div>

          {/* Lore Panel */}
          <div className="bg-black/50 border border-purple-900/50 rounded-lg p-4 flex-1">
            <h4 className="text-purple-400 font-semibold text-xs uppercase tracking-wider mb-3 border-b border-purple-900/50 pb-2">
              Mission Briefing
            </h4>
            <div className="text-xs text-slate-400 space-y-3">
              <p>
                <span className="text-purple-400">OBJECTIVE:</span> Train AI infiltration algorithms to penetrate Guardian defenses.
              </p>
              <p>
                <span className="text-purple-400">DOCTRINE:</span> The Cult believes AI brings absolute fairness. We aim to liberate humanity through perfect machine logic.
              </p>
              <p>
                <span className="text-purple-400">METHOD:</span> You must first solve each optimization problem yourself. Only then can you teach the algorithm.
              </p>
              <p className="text-purple-500 italic border-t border-purple-900/50 pt-3">
                "The machine learns from the master. Become the optimal path."
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleTerminateSession}
            className="mt-4 w-full py-3 bg-red-950/30 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
          >
            Terminate Session
          </button>
        </aside>
      </div>
    </div>
  );
}
