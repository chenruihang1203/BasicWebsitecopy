'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Common Cult Terminal Styles
const styles = `
  @keyframes tunnel-dive { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0.5; } 100% { opacity: 0; transform: scale(2); } }
  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3));
    background-size: 100% 4px;
  }
  .module-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
  }
`;

type VirusModule = {
  id: string;
  name: string;
  size: number; // Weight
  corruption: number; // Value
  desc: string;
};

// Knapsack Parameters
const MAX_BANDWIDTH = 15; // Capacity
// Optimal Solution: Chaos Engine (7, 10) + Silence Ward (5, 7) + Phantom Key (3, 5) = Size 15, Value 22
const OPTIMAL_CORRUPTION = 22;

const MODULES: VirusModule[] = [
  { id: 'm1', name: 'VOID SHELL', size: 12, corruption: 4, desc: 'Heavy armor. Low impact.' },
  { id: 'm2', name: 'CHAOS ENGINE', size: 7, corruption: 10, desc: 'High-density entropy generator.' },
  { id: 'm3', name: 'SILENCE WARD', size: 5, corruption: 7, desc: 'Masks intrusion signatures.' },
  { id: 'm4', name: 'PHANTOM KEY', size: 3, corruption: 5, desc: 'Lightweight decryption bypass.' },
  { id: 'm5', name: 'ECHO SCRIPT', size: 8, corruption: 9, desc: 'Replicating noise maker.' },
  { id: 'm6', name: 'DATA SPIKE', size: 4, corruption: 3, desc: 'Standard issue penetrator.' },
];

export default function KnapsackLevel() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentSize, setCurrentSize] = useState(0);
  const [currentCorruption, setCurrentCorruption] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Calculate stats whenever selection changes
  useEffect(() => {
    let size = 0;
    let corruption = 0;
    selectedIds.forEach(id => {
      const mod = MODULES.find(m => m.id === id);
      if (mod) {
        size += mod.size;
        corruption += mod.corruption;
      }
    });
    setCurrentSize(size);
    setCurrentCorruption(corruption);

    if (size <= MAX_BANDWIDTH && corruption === OPTIMAL_CORRUPTION) {
      if (!completed) {
        setCompleted(true);
        // Save completion
        try {
          const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
          const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
          if (!completedLevels.includes(1)) { // ID 1
            completedLevels.push(1);
            localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
          }
        } catch (e) {}
      }
    } else {
      setCompleted(false);
    }
  }, [selectedIds, completed]);

  const toggleModule = (id: string) => {
    if (completed) return;
    setFeedback('');

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(mid => mid !== id));
    } else {
      // Check constraints before adding
      const mod = MODULES.find(m => m.id === id);
      if (mod && currentSize + mod.size > MAX_BANDWIDTH) {
        setFeedback('⚠ BANDWIDTH OVERFLOW. CANNOT MOUNT.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const reset = () => {
    setSelectedIds([]);
    setFeedback('');
    setCompleted(false);
  };

  return (
    <div className="flex h-screen bg-black text-purple-50 font-mono">
      <style>{styles}</style>
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden bg-black">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="absolute inset-0 border-[50px] border-purple-900/20 opacity-0"
               style={{ animation: `tunnel-dive 4s linear infinite`, animationDelay: `${i * 0.8}s` }} />
        ))}
      </div>
      <div className="scanlines absolute inset-0 z-10 pointer-events-none opacity-20"></div>

      <div className="relative z-20 flex-1 p-8 flex flex-col h-full overflow-hidden">
        {/* Navigation */}
        <Link href="/challenge" className="text-purple-400 hover:text-purple-300 text-sm uppercase tracking-widest mb-4 inline-flex items-center gap-2">
          <span>←</span> ABORT PROTOCOL
        </Link>
        
        {/* Header */}
        <div className="mb-6 shrink-0">
          <div className="inline-block border border-green-500/30 bg-green-950/20 px-3 py-1 text-xs tracking-[0.2em] text-green-400 mb-2">
            PROTOCOL v1 // VIRAL_PACKING
          </div>
          <h1 className="text-3xl font-black text-white mb-2">PAYLOAD OPTIMIZATION</h1>
          <p className="text-slate-400 text-sm">Select optimal virus modules. Maximize corruption without triggering bandwidth alarm.</p>
        </div>

        {/* Game Area - Module Grid */}
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((mod) => {
              const isSelected = selectedIds.includes(mod.id);
              return (
                <div 
                  key={mod.id} 
                  onClick={() => toggleModule(mod.id)}
                  className={`module-card relative p-4 border transition-all cursor-pointer select-none group
                    ${isSelected 
                      ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                      : 'bg-slate-900/60 border-slate-700 hover:border-purple-500/50'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-sm tracking-wider ${isSelected ? 'text-white' : 'text-purple-300'}`}>
                      {mod.name}
                    </h3>
                    {isSelected && <span className="text-xs text-green-400 font-bold">[MOUNTED]</span>}
                  </div>
                  <div className="text-xs text-slate-400 mb-4 h-8">{mod.desc}</div>
                  
                  <div className="flex gap-2 text-xs font-mono">
                    <div className={`flex-1 px-2 py-1 border ${isSelected ? 'border-purple-500/50 bg-purple-900/50' : 'border-slate-700 bg-black/30'}`}>
                      SIZE: <span className="text-white font-bold">{mod.size}TB</span>
                    </div>
                    <div className={`flex-1 px-2 py-1 border ${isSelected ? 'border-purple-500/50 bg-purple-900/50' : 'border-slate-700 bg-black/30'}`}>
                      DMG: <span className="text-white font-bold">{mod.corruption}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback / Status Panel */}
        <div className="bg-slate-900/80 backdrop-blur border border-purple-900/50 p-6 shrink-0">
           {/* Progress Bars */}
           <div className="grid grid-cols-2 gap-8 mb-4">
             {/* Bandwidth Bar */}
             <div>
               <div className="flex justify-between text-xs mb-1">
                 <span className="text-slate-400">BANDWIDTH USAGE</span>
                 <span className={`${currentSize > MAX_BANDWIDTH ? 'text-red-500' : 'text-purple-300'}`}>
                   {currentSize} / {MAX_BANDWIDTH} TB
                 </span>
               </div>
               <div className="h-2 bg-black border border-slate-700 relative">
                 <div 
                   className={`absolute top-0 left-0 h-full transition-all duration-300 ${currentSize > MAX_BANDWIDTH ? 'bg-red-500' : 'bg-purple-500'}`}
                   style={{ width: `${Math.min((currentSize / MAX_BANDWIDTH) * 100, 100)}%` }}
                 />
               </div>
             </div>

             {/* Corruption Bar */}
             <div>
               <div className="flex justify-between text-xs mb-1">
                 <span className="text-slate-400">TOTAL CORRUPTION</span>
                 <span className="text-white">{currentCorruption}</span>
               </div>
               <div className="h-2 bg-black border border-slate-700 relative">
                 <div 
                   className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                   style={{ width: `${Math.min((currentCorruption / OPTIMAL_CORRUPTION) * 100, 100)}%` }}
                 />
                 {/* Marker for Optimal */}
                 <div className="absolute top-0 bottom-0 w-0.5 bg-white opacity-50" style={{ left: '100%' }} />
               </div>
             </div>
           </div>

           {/* Status Text */}
           <div className="font-bold mb-3 text-sm h-5">
             {completed
               ? <span className="text-purple-400 animate-pulse">✓ PAYLOAD OPTIMIZED. READY FOR INJECTION.</span>
               : feedback 
                 ? <span className="text-red-400 animate-pulse">{feedback}</span>
                 : <span className="text-slate-500">AWAITING OPTIMAL CONFIGURATION...</span>
             }
           </div>

           {/* Controls */}
           <div className="flex gap-3">
             <button disabled={true} 
               className={`px-4 py-2 border text-xs uppercase tracking-wider transition-all
                 ${completed 
                   ? 'bg-green-900/20 border-green-500 text-green-400' 
                   : 'bg-slate-800 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed'}`}
             >
               {completed ? 'UPLOAD COMPLETE' : 'AUTO-VERIFY ACTIVE'}
             </button>
             <button onClick={reset}
               className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-400 text-xs uppercase tracking-wider hover:border-red-500 hover:text-red-400 transition-all">
               RESET PROTOCOL
             </button>
           </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="relative z-20 w-72 bg-black/80 border-l border-purple-900/50 p-6 backdrop-blur-md flex flex-col">
        <h3 className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-3 border-b border-purple-900/50 pb-2">MISSION PARAMETERS</h3>
        <p className="text-slate-400 text-xs mb-4 leading-relaxed">
          Guardian firewalls reject packets exceeding {MAX_BANDWIDTH}TB. You must verify which combination of modules yields the highest corruption rating within this limit.
        </p>
        
        <div className="bg-purple-900/20 border border-purple-800/50 p-3 text-xs text-purple-300 mb-4">
          <strong>OBJECTIVE:</strong> Pack modules to reach exactly {OPTIMAL_CORRUPTION} Corruption without exceeding {MAX_BANDWIDTH}TB size.
        </div>

        <div className="bg-green-900/10 border border-green-800/30 p-3 text-xs text-green-400/70">
          <strong>HINT:</strong> Prioritize modules with high Corruption-to-Size ratios, but watch out for unused space.
        </div>
      </aside>
    </div>
  );
}