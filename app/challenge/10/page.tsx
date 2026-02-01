'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const styles = `
  @keyframes tunnel-dive { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0.5; } 100% { opacity: 0; transform: scale(2); } }
  @keyframes glitch { 
    0% { transform: translate(0); } 
    20% { transform: translate(-3px, 3px); } 
    40% { transform: translate(-3px, -3px); } 
    60% { transform: translate(3px, 3px); } 
    80% { transform: translate(3px, -3px); } 
    100% { transform: translate(0); }
  }
  @keyframes pulse-warning { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; box-shadow: 0 0 50px rgba(168, 85, 247, 0.8); } }
  @keyframes stone-vanish { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0); } }
  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.3));
    background-size: 100% 4px;
  }
  .fatal-glow {
    animation: pulse-warning 2s infinite;
  }
`;

type GameState = 'player_turn' | 'ai_turn' | 'player_won' | 'ai_won';

// Initial piles - XOR ≠ 0 so player CAN win with optimal play
// 3 ^ 5 ^ 7 = 1 (not zero, so first player can win)
const INITIAL_PILES = [3, 5, 7];

export default function NimLevel() {
  const [piles, setPiles] = useState<number[]>([...INITIAL_PILES]);
  const [gameState, setGameState] = useState<GameState>('player_turn');
  const [selectedPile, setSelectedPile] = useState<number | null>(null);
  const [takeAmount, setTakeAmount] = useState<number>(1);
  const [message, setMessage] = useState<string>('Your move, human. Take stones from a pile.');
  const [history, setHistory] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  // Calculate XOR of all piles (Nim-sum)
  const getNimSum = (p: number[]): number => {
    return p.reduce((xor, pile) => xor ^ pile, 0);
  };

  // AI's optimal move using Nim strategy
  const getBestMove = (currentPiles: number[]): { pileIndex: number; take: number } | null => {
    const nimSum = getNimSum(currentPiles);
    
    if (nimSum === 0) {
      // Losing position for AI - take 1 from largest pile
      let maxPile = 0;
      let maxIndex = 0;
      currentPiles.forEach((p, i) => {
        if (p > maxPile) {
          maxPile = p;
          maxIndex = i;
        }
      });
      if (maxPile > 0) {
        return { pileIndex: maxIndex, take: 1 };
      }
      return null;
    }
    
    // Winning position - find optimal move
    for (let i = 0; i < currentPiles.length; i++) {
      const targetPile = currentPiles[i] ^ nimSum;
      if (targetPile < currentPiles[i]) {
        return { pileIndex: i, take: currentPiles[i] - targetPile };
      }
    }
    
    return null;
  };

  // Check for game over
  useEffect(() => {
    const totalStones = piles.reduce((sum, p) => sum + p, 0);
    
    if (totalStones === 0) {
      if (gameState === 'player_turn') {
        // Player has no moves - AI took the last stone, player loses
        setGameState('ai_won');
        setMessage('SYSTEM OVERRIDE. AI TAKES FINAL STONE. YOU ARE TERMINATED.');
      } else if (gameState === 'ai_turn') {
        // AI has no moves - Player took the last stone, player wins
        setGameState('player_won');
        setCompleted(true);
        setMessage('IMPOSSIBLE. YOU HAVE BESTED THE MACHINE. PROTOCOL COMPROMISED.');
        try {
          const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
          const completedLevels: number[] = completedRaw ? JSON.parse(completedRaw) : [];
          if (!completedLevels.includes(10)) {
            completedLevels.push(10);
            localStorage.setItem('completed_levels', JSON.stringify(completedLevels));
          }
        } catch (e) {}
      }
    }
  }, [piles, gameState]);

  // AI turn
  useEffect(() => {
    if (gameState !== 'ai_turn') return;
    
    const timeout = setTimeout(() => {
      const move = getBestMove(piles);
      
      if (move) {
        const newPiles = [...piles];
        newPiles[move.pileIndex] -= move.take;
        setPiles(newPiles);
        
        const moveLog = `AI: Pile ${move.pileIndex + 1}, took ${move.take}`;
        setHistory([...history, moveLog]);
        setMessage(`AI removed ${move.take} stone${move.take > 1 ? 's' : ''} from Pile ${move.pileIndex + 1}.`);
        
        setGameState('player_turn');
      }
    }, 1500); // Dramatic pause
    
    return () => clearTimeout(timeout);
  }, [gameState, piles, history]);

  const handlePileClick = (pileIndex: number) => {
    if (gameState !== 'player_turn') return;
    if (piles[pileIndex] === 0) return;
    
    setSelectedPile(pileIndex);
    setTakeAmount(1);
  };

  const handleTake = () => {
    if (selectedPile === null || gameState !== 'player_turn') return;
    if (takeAmount < 1 || takeAmount > piles[selectedPile]) return;
    
    const newPiles = [...piles];
    newPiles[selectedPile] -= takeAmount;
    setPiles(newPiles);
    
    const moveLog = `You: Pile ${selectedPile + 1}, took ${takeAmount}`;
    setHistory([...history, moveLog]);
    
    setSelectedPile(null);
    setTakeAmount(1);
    setGameState('ai_turn');
    setMessage('AI is calculating...');
  };

  const reset = () => {
    setPiles([...INITIAL_PILES]);
    setGameState('player_turn');
    setSelectedPile(null);
    setTakeAmount(1);
    setMessage('Your move, human. Take stones from a pile.');
    setHistory([]);
    setCompleted(false);
  };

  const nimSum = getNimSum(piles);
  const totalStones = piles.reduce((sum, p) => sum + p, 0);

  return (
    <div className="flex h-screen bg-black text-purple-50 font-mono">
      <style>{styles}</style>
      
      <div className="absolute inset-0 overflow-hidden bg-black">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="absolute inset-0 border-[50px] border-purple-500/30 opacity-0"
               style={{ animation: `tunnel-dive 4s linear infinite`, animationDelay: `${i * 0.8}s` }} />
        ))}
      </div>
      <div className="scanlines absolute inset-0 z-10 pointer-events-none opacity-20"></div>

      <div className="relative z-20 flex-1 p-8">
        <Link href="/challenge" className="text-purple-400 hover:text-purple-300 text-sm uppercase tracking-widest mb-4 inline-flex items-center gap-2">
          <span>←</span> ABORT PROTOCOL
        </Link>
        
        <div className="mb-6">
          <div className="inline-block border border-purple-400/80 bg-purple-900/50 px-3 py-1 text-xs tracking-[0.2em] text-purple-300 mb-2 fatal-glow">
            ☠ PROTOCOL v10 // FINAL_CONFRONTATION
          </div>
          <h1 className="text-4xl font-black text-white mb-2" style={{ animation: 'glitch 0.3s infinite' }}>
            N<span className="text-purple-400">I</span>M GA<span className="text-purple-400">M</span>E
          </h1>
          <p className="text-slate-400 text-sm">Face the AI directly. Take the last stone to win. The machine plays optimally.</p>
        </div>

        {/* Game Board */}
        <div className="bg-black/90 backdrop-blur border-2 border-purple-500/50 p-8 mb-6 relative fatal-glow" style={{ minHeight: '280px' }}>
          <div className="absolute top-2 right-2 text-xs text-purple-400/50">
            Nim-Sum: {nimSum} | Total: {totalStones}
          </div>
          
          <div className="flex justify-center gap-16">
            {piles.map((pile, pileIndex) => (
              <div 
                key={pileIndex}
                onClick={() => handlePileClick(pileIndex)}
                className={`flex flex-col items-center cursor-pointer transition-all
                  ${selectedPile === pileIndex ? 'scale-110' : 'hover:scale-105'}
                  ${pile === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <div className="text-purple-400 text-xs mb-3 uppercase tracking-wider">
                  Pile {pileIndex + 1}
                </div>
                <div className="flex flex-col-reverse items-center gap-1" style={{ minHeight: '150px' }}>
                  {Array.from({ length: pile }).map((_, stoneIndex) => (
                    <div 
                      key={stoneIndex}
                      className={`w-8 h-8 rounded-full border-2 transition-all
                        ${selectedPile === pileIndex 
                          ? 'bg-purple-600 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.8)]' 
                          : 'bg-slate-700 border-slate-500'}`}
                    />
                  ))}
                </div>
                <div className="mt-2 text-white font-bold text-xl">
                  {pile}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900/80 border border-purple-900/50 p-4">
          <div className="font-bold mb-3 text-sm">
            {gameState === 'player_won' 
              ? <span className="text-green-400">✓ {message}</span>
              : gameState === 'ai_won'
                ? <span className="text-red-400">✗ {message}</span>
                : <span className="text-purple-300">{message}</span>}
          </div>
          
          {gameState === 'player_turn' && selectedPile !== null && piles[selectedPile] > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-purple-900/40 border border-purple-600">
              <span className="text-purple-300 text-sm">Taking from Pile {selectedPile + 1}:</span>
              <button 
                onClick={() => setTakeAmount(Math.max(1, takeAmount - 1))}
                disabled={takeAmount <= 1}
                className="px-3 py-1 bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed">-</button>
              <span className="text-white font-bold text-xl w-8 text-center">{takeAmount}</span>
              <button 
                onClick={() => setTakeAmount(Math.min(piles[selectedPile], takeAmount + 1))}
                disabled={takeAmount >= piles[selectedPile]}
                className="px-3 py-1 bg-slate-700 text-white disabled:opacity-30 disabled:cursor-not-allowed">+</button>
              <button 
                onClick={handleTake}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs uppercase tracking-wider font-bold transition-all ml-4">
                CONFIRM
              </button>
              <button 
                onClick={() => setSelectedPile(null)}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs uppercase">
                CANCEL
              </button>
            </div>
          )}
          
          <div className="flex gap-3">
            <button onClick={reset}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-400 text-xs uppercase tracking-wider hover:border-red-500 hover:text-red-400 transition-all">
              RESTART GAME
            </button>
          </div>
        </div>

        {/* Move History */}
        {history.length > 0 && (
          <div className="mt-4 bg-black/50 border border-slate-800 p-3 max-h-32 overflow-y-auto">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Move Log</div>
            {history.map((move, i) => (
              <div key={i} className={`text-xs ${move.startsWith('AI') ? 'text-red-400' : 'text-green-400'}`}>
                {move}
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="relative z-20 w-72 bg-black/80 border-l border-purple-900/50 p-6 backdrop-blur-md">
        <h3 className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-3 border-b border-purple-900/50 pb-2">
          ☠ FINAL PROTOCOL
        </h3>
        <p className="text-slate-400 text-xs mb-4 leading-relaxed">
          You face the AI in Nim - an ancient game of perfect information. Two players alternate taking stones. Whoever takes the LAST stone wins.
        </p>
        <div className="bg-red-900/30 border border-red-700/50 p-3 text-xs text-red-300 mb-4">
          <strong>WARNING:</strong> The AI plays optimally. If you make a single mistake, it will exploit it mercilessly.
        </div>
        <div className="bg-purple-900/20 border border-purple-800/50 p-3 text-xs text-purple-300 mb-4">
          <strong>RULES:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Take ≥1 stones from ONE pile</li>
            <li>Whoever takes the last stone wins</li>
            <li>You move first</li>
          </ul>
        </div>
        <div className="bg-slate-900/50 border border-slate-700/50 p-3 text-xs text-slate-400">
          <strong>HINT:</strong> The Nim-sum (XOR of all piles) is key. After your move, if Nim-sum = 0, you're in a winning position.
        </div>
      </aside>
    </div>
  );
}
