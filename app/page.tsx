'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

// ==========================================
// 1. VISUAL ASSETS (从之前的代码移植)
// ==========================================
const styles = `
  @keyframes blink-cyan { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; box-shadow: 0 0 30px cyan; } }
  @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
  @keyframes glitch { 
    0% { transform: translate(0); } 
    20% { transform: translate(-2px, 2px); } 
    40% { transform: translate(-2px, -2px); } 
    60% { transform: translate(2px, 2px); } 
    80% { transform: translate(2px, -2px); } 
    100% { transform: translate(0); }
  }

  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
    background-size: 100% 4px;
    pointer-events: none;
  }
  
  .terminal-input {
    background: transparent;
    border: none;
    border-bottom: 2px solid #334155;
    color: #22d3ee;
    font-family: monospace;
    outline: none;
    transition: all 0.3s;
  }
  .terminal-input:focus {
    border-bottom-color: #22d3ee;
    box-shadow: 0 4px 20px -5px rgba(34, 211, 238, 0.3);
  }

  .tech-border {
    position: relative;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #1e293b;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }
  .tech-border::before {
    content: ''; position: absolute; top: -1px; left: -1px; width: 10px; height: 10px;
    border-top: 2px solid #22d3ee; border-left: 2px solid #22d3ee;
  }
  .tech-border::after {
    content: ''; position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px;
    border-bottom: 2px solid #22d3ee; border-right: 2px solid #22d3ee;
  }
`;

// 🌧️ Matrix Rain Background (视觉核心)
const MatrixRainCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
    const fontSize = 14;
    const columns = width / fontSize;
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) drops[i] = Math.random() * -100;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#0f0'; 
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        // 随机让一些字符变白，模拟高亮
        ctx.fillStyle = Math.random() > 0.95 ? '#fff' : '#0ea5e9'; // Cyan/Green mix
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(draw);
    };
    
    const animId = requestAnimationFrame(draw);
    const handleResize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 z-0 bg-black opacity-40" />;
};

// ==========================================
// 2. LOGIC & COMPONENT (完全保留原有业务逻辑)
// ==========================================

type User = {
  name?: string;
  avatar?: string;
  bio?: string;
};

export default function Homepage() {
  // --- 原有状态逻辑 ---
  const [user, setUser] = useState<User>({ name: 'Guest', avatar: '👤', bio: 'Turing Test Participant' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('turing_user') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser({
          name: parsed.name || 'Guest',
          avatar: parsed.avatar || '👤',
          bio: parsed.bio || 'Turing Test Participant',
        });
        setIsLoggedIn(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Small helper to pick a random emoji avatar for new logins
  function getRandomAvatar() {
    const avatars = ['👤', '🧑', '👨', '👩', '🧔', '👱', '🧑‍💼', '👨‍💻', '👩‍🔬'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  function handleJoin(name: string) {
    if (!name || !name.trim()) return;
    const profile = { name: name.trim(), avatar: getRandomAvatar(), bio: 'Turing Test Participant' };
    try {
      localStorage.setItem('turing_user', JSON.stringify(profile));
    } catch (e) {}
    setUser(profile);
    setIsLoggedIn(true);
  }

  function handleContinueAsGuest() {
    // Guest mode: no persistence needed
    setUser({ name: 'Guest', avatar: '👤', bio: 'Turing Test Participant' });
    setIsLoggedIn(false);
  }

  function handleLogout() {
    try { localStorage.removeItem('turing_user'); } catch (e) {}
    setUser({ name: 'Guest', avatar: '👤', bio: 'Turing Test Participant' });
    setIsLoggedIn(false);
  }

  // ==========================================
  // 3. RENDER (全新的 Cyberpunk 风格)
  // ==========================================
  return (
    <div className="relative h-screen w-full bg-black text-cyan-50 font-mono overflow-hidden flex flex-col items-center justify-center selection:bg-cyan-500 selection:text-black">
      <style>{styles}</style>
      
      {/* 背景层 */}
      <MatrixRainCanvas />
      <div className="scanlines absolute inset-0 z-10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black z-0 pointer-events-none"></div>

      {/* 主内容容器 */}
      <main className="relative z-20 w-full max-w-4xl p-6 flex flex-col md:flex-row gap-12 items-center">
        
        {/* 左侧：标题与介绍 */}
        <div className="flex-1 text-center md:text-left space-y-6">
          <div className="inline-block border border-cyan-500/30 bg-cyan-950/20 px-3 py-1 text-xs tracking-[0.2em] text-cyan-400 mb-2">
            SYSTEM VERSION 2.0.26
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mix-blend-screen drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            HACKAWAYI<br/>
            <span className="text-cyan-500">PROTOCOL</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-xl leading-relaxed border-l-2 border-cyan-800 pl-6">
            Welcome to the simulation. Establish neural uplink to verify humanity. 
            <span className="block mt-2 text-cyan-700 text-sm">// TuringChat Module: READY</span>
          </p>

          {/* 登录后显示的控制按钮 */}
          {isLoggedIn && (
             <div className="flex flex-col md:flex-row gap-4 mt-8">
               <Link href="/turingchat" className="group relative px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase tracking-widest transition-all clip-path-polygon">
                 <span className="relative z-10 flex items-center gap-2">
                    <span>Initiate Uplink</span>
                    <span className="animate-pulse">_</span>
                 </span>
                 <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
               </Link>
             </div>
          )}
        </div>

        {/* 右侧：登录/用户信息面板 (Tech Border Style) */}
        <div className="w-full md:w-96 tech-border p-8 bg-black/80 backdrop-blur-md">
          
          {!isLoggedIn ? (
            /* 登录表单 */
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-[glitch_2s_infinite]">🔒</div>
                <h2 className="text-xl font-bold text-white tracking-widest uppercase">Identity Required</h2>
                <p className="text-xs text-slate-500 mt-2 font-mono">PLEASE AUTHENTICATE TO PROCEED</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as HTMLFormElement).elements.namedItem('homepage_username') as HTMLInputElement;
                  handleJoin(input.value);
                }}
                className="space-y-6"
              >
                <div className="relative group">
                  <span className="absolute left-0 top-2 text-cyan-500">{'>'}</span>
                  <input
                    name="homepage_username"
                    placeholder="ENTER_CODENAME..."
                    autoComplete="off"
                    className="terminal-input w-full pl-6 py-2 text-lg uppercase placeholder:text-slate-700"
                  />
                </div>
                
                <div className="space-y-3 pt-4">
                  <button type="submit" className="w-full py-3 bg-cyan-900/50 border border-cyan-700 hover:bg-cyan-500 hover:text-black text-cyan-400 transition-all font-bold uppercase tracking-wider text-sm">
                    Authenticate
                  </button>
                  <button type="button" onClick={() => handleContinueAsGuest()} className="w-full py-2 text-xs text-slate-500 hover:text-white uppercase tracking-widest border-b border-transparent hover:border-slate-500 transition-colors">
                    Continue as Ghost
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* 用户信息卡片 */
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="w-24 h-24 mx-auto flex items-center justify-center text-6xl bg-slate-800 border-2 border-green-500 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                  {user.avatar}
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black px-2 text-xs text-green-500 font-bold border border-green-800">
                  ONLINE
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{user.name}</h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-[0.2em]">{user.bio}</p>
              </div>

              <div className="pt-6 border-t border-slate-800">
                 <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 mb-6">
                    <div className="text-right border-r border-slate-700 pr-4">
                      <div className="text-cyan-500 font-bold text-lg">SECURE</div>
                      <div>Connection</div>
                    </div>
                    <div className="text-left pl-2">
                      <div className="text-cyan-500 font-bold text-lg">12ms</div>
                      <div>Latency</div>
                    </div>
                 </div>

                 <button onClick={() => handleLogout()} className="text-red-500 text-xs uppercase tracking-widest hover:text-red-400 border border-transparent hover:border-red-900 px-4 py-2 transition-all">
                   Terminate Session
                 </button>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* 底部装饰 */}
      <div className="absolute bottom-4 text-[10px] text-slate-600 uppercase tracking-[0.5em] animate-pulse">
        Secure Connection // Protocol 2026
      </div>
    </div>
  );
}