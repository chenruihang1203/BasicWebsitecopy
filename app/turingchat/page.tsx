'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';

// ==========================================
// 1. VISUAL ASSETS & STYLES (Merged from Source A)
// ==========================================
const styles = `
  /* --- Source A: Advanced Animations --- */
  @keyframes scan-horizontal { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes mech-breath { 0%, 100% { transform: scale(1.1); filter: brightness(1.2); } 50% { transform: scale(1.15); filter: brightness(1.5); } }
  @keyframes reactor-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes blink-cyan { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; box-shadow: 0 0 30px cyan; } }
  @keyframes blink-red { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; box-shadow: 0 0 20px red; } }
  @keyframes fly-left-continuous { from { transform: translateX(120vw); } to { transform: translateX(-20vw); } }
  @keyframes fly-right-continuous { from { transform: translateX(-20vw); } to { transform: translateX(120vw); } }
  @keyframes hud-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes wave-pulse { 0%, 100% { height: 20%; } 50% { height: 100%; } }
  @keyframes load-bar { 0% { width: 0%; } 100% { width: 100%; } }
  @keyframes tunnel-dive { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 0.5; } 100% { opacity: 0; transform: scale(2); } }

  /* --- Source B: Utilities --- */
  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
    background-size: 100% 4px;
  }
  .neon-strip-h {
    position: absolute; height: 2px; width: 100%;
    background: linear-gradient(90deg, transparent, cyan, transparent);
    background-size: 50% 100%; opacity: 0.8;
    animation: scan-horizontal 3s linear infinite;
  }
  /* Scrollbar */
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #0f172a; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #475569; }
`;

// --- Visual Components (From Source A) ---

// 🌧️ Matrix Rain
const MatrixRainCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const fontSize = 16;
    const columns = width / fontSize;
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) drops[i] = Math.random() * -100;
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#22c55e'; ctx.font = `bold ${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.95 ? '#fff' : '#22c55e';
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
  return <canvas ref={canvasRef} className="absolute inset-0 z-0 bg-black" />;
};

// 🏙️ Neon City
const HorizontalNeonCity = () => {
    const [buildings, setBuildings] = useState<{height: number, strips: {duration: number}[]}[]>([]);
    
    useEffect(() => {
        setBuildings(Array.from({ length: 16 }).map(() => ({
            height: 20 + Math.random() * 80,
            strips: Array.from({ length: 3 }).map(() => ({ duration: 2 + Math.random() * 3 }))
        })));
    }, []);

    return (
      <div className="absolute inset-0 overflow-hidden bg-[#020617]">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 via-black to-black"></div>
        <div className="absolute bottom-0 w-full h-1/2 bg-[linear-gradient(transparent_95%,rgba(6,182,212,0.3)_95%)] bg-[length:100%_40px] perspective-origin-bottom transform perspective-1000 rotateX(60deg)"></div>
        <div className="absolute bottom-0 w-full h-full flex items-end justify-center space-x-2 px-4">
          {buildings.map((b, i) => (
            <div key={i} className="relative bg-slate-900 border-x border-cyan-900/50 w-16 md:w-24" style={{ height: `${b.height}%` }}>
              <div className="absolute inset-0 flex flex-col justify-around py-4 opacity-30">
                {Array.from({ length: 20 }).map((_, j) => <div key={j} className="w-[80%] mx-auto h-1 bg-cyan-800"></div>)}
              </div>
              {b.strips.map((s, k) => (
                <div key={k} className="neon-strip-h" style={{ top: `${20 + k * 30}%`, animationDuration: `${s.duration}s` }}></div>
              ))}
              <div className="absolute top-0 w-full h-1 bg-cyan-400 shadow-[0_0_10px_cyan]"></div>
            </div>
          ))}
        </div>
      </div>
    );
};

// 🚀 Core City
const DenseCoreCity = () => {
    const [ships, setShips] = useState<{width: number, top: number, opacity: number, duration: number, delay: number}[]>([]);

    useEffect(() => {
        setShips(Array.from({ length: 20 }).map(() => ({
            width: 20 + Math.random() * 40,
            top: 10 + Math.random() * 60,
            opacity: 0.7 + Math.random() * 0.3,
            duration: 10 + Math.random() * 15,
            delay: Math.random() * -20
        })));
    }, []);
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-black"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[85%] z-10 flex items-end justify-center">
           <svg viewBox="0 0 400 400" className="w-full h-full" preserveAspectRatio="none">
             <defs>
               <pattern id="windows" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                 <rect x="2" y="2" width="2" height="2" fill="cyan" opacity="0.3" />
               </pattern>
             </defs>
             <rect x="20" y="250" width="60" height="150" fill="#0f172a" stroke="#1e293b" />
             <rect x="320" y="220" width="70" height="180" fill="#0f172a" stroke="#1e293b" />
             <path d="M120 400 L120 100 L160 50 L240 50 L280 100 L280 400 Z" fill="#1e293b" />
             <rect x="140" y="80" width="120" height="320" fill="url(#windows)" />
             <rect x="195" y="0" width="10" height="50" fill="cyan" className="animate-pulse" />
           </svg>
        </div>
        <div className="absolute inset-0 z-20">
          {ships.map((ship, i) => (
            <div key={i} className={`absolute h-1 rounded-full blur-[1px] ${i % 2 === 0 ? 'bg-cyan-200 shadow-[0_0_5px_cyan]' : 'bg-red-400 shadow-[0_0_5px_red]'}`}
                 style={{
                   width: `${ship.width}px`, top: `${ship.top}%`, opacity: ship.opacity,
                   animation: `${i % 2 === 0 ? 'fly-right-continuous' : 'fly-left-continuous'} ${ship.duration}s linear infinite`, animationDelay: `${ship.delay}s`
                 }}></div>
          ))}
        </div>
      </div>
    );
};

// 🤖 Titan (For Faction/Judging)
const OppressiveTitan = () => (
  <div className="absolute inset-0 overflow-hidden bg-[#030712] flex items-end justify-center pointer-events-none">
    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,#1e293b_40px,#1e293b_41px)] opacity-30"></div>
    <svg viewBox="0 0 400 400" className="w-full h-full transform origin-bottom animate-[mech-breath_6s_infinite_ease-in-out]">
      <path d="M50 400 L50 200 L100 150 L300 150 L350 200 L350 400 Z" fill="#020617" stroke="#475569" strokeWidth="3" />
      <path d="M100 400 L120 200 L280 200 L300 400 Z" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <rect x="160" y="100" width="80" height="60" fill="#0f172a" stroke="#94a3b8" strokeWidth="3" />
      <rect x="170" y="120" width="60" height="10" fill="#300" />
      <rect x="170" y="120" width="20" height="10" fill="#f87171" className="animate-[scan-horizontal_1s_alternate_infinite] shadow-[0_0_20px_red]" />
      <circle cx="200" cy="300" r="30" fill="#083344" stroke="#06b6d4" strokeWidth="4" />
      <circle cx="200" cy="300" r="15" fill="#22d3ee" className="animate-[blink-cyan_2s_infinite]" />
    </svg>
    <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
  </div>
);

// 🌀 Quantum Server (Background for Selection)
const QuantumServer = () => (
  <div className="absolute inset-0 overflow-hidden bg-black flex items-center justify-center pointer-events-none">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="absolute inset-0 border-[50px] border-gray-900 opacity-0"
           style={{ animation: `tunnel-dive 4s linear infinite`, animationDelay: `${i * 0.8}s` }}>
      </div>
    ))}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_black_100%)] z-10"></div>
  </div>
);

// 📡 Hyper Search (Transition to Chat)
const HyperSearch = () => (
  <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none bg-black/90 backdrop-blur-xl">
    <div className="relative w-[500px] h-[300px] border-y-2 border-cyan-800 bg-black flex flex-col items-center justify-center p-8 overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>
      
      <div className="flex items-center gap-8 w-full justify-center mb-8">
        <div className="w-16 h-16 border-t-2 border-l-2 border-cyan-500 rounded-full animate-[hud-spin_1s_linear_infinite]"></div>
        <div className="text-center">
          <div className="text-4xl font-black text-white tracking-widest">UPLINKING</div>
          <div className="text-xs font-mono text-cyan-500 mt-2">SECURE CHANNEL // ESTABLISHED</div>
        </div>
        <div className="w-16 h-16 border-b-2 border-r-2 border-cyan-500 rounded-full animate-[hud-spin_1s_linear_infinite_reverse]"></div>
      </div>
      
      <div className="flex justify-center items-end h-10 gap-1 w-full px-12 mb-6">
        {Array.from({length: 20}).map((_, i) => (
          <div key={i} className="w-2 bg-cyan-700 animate-[wave-pulse_0.5s_infinite]" style={{animationDelay: `${i*0.05}s`}}></div>
        ))}
      </div>
      
      <div className="w-full h-2 bg-gray-800 relative">
        <div className="absolute top-0 left-0 h-full bg-cyan-400 animate-[load-bar_2s_linear_forwards] shadow-[0_0_10px_cyan]"></div>
      </div>
    </div>
  </div>
);

// ==========================================
// 2. ORIGINAL AVATARS (Source B)
// ==========================================
const PixelAvatarAri = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-full h-full"} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" fill="#1e293b"/>
    <rect x="7" y="8" width="10" height="12" fill="#d4a373"/>
    <path d="M6 5h12v3h1v2h-1v-1h-1v-1h-2v1h-2v-1h-2v1h-2v-1h-1v1h-1v1h-1v-2h1v-3z" fill="#8d5524"/>
    <rect x="7" y="11" width="4" height="3" fill="#334155"/>
    <rect x="8" y="12" width="2" height="1" fill="#0ea5e9"/>
    <rect x="13" y="11" width="4" height="3" fill="#334155"/>
    <rect x="14" y="12" width="2" height="1" fill="#0ea5e9"/>
    <rect x="15" y="16" width="4" height="1" fill="#10b981"/>
    <rect x="5" y="20" width="14" height="4" fill="#ea580c"/>
  </svg>
);

const PixelAvatarMika = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-full h-full"} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" fill="#1e293b"/>
    <rect x="8" y="9" width="8" height="10" fill="#fec5bb"/>
    <path d="M7 4h10v5h1v4h-1v2h-1v3h-1v-3h-1v-2h-4v2h-1v3h-1v-3h-1v-2h-1v-4h1v-5z" fill="#2e1065"/>
    <rect x="9" y="3" width="6" height="3" fill="#f8fafc"/>
    <rect x="13" y="11" width="3" height="3" fill="rgba(45, 212, 191, 0.4)"/>
    <rect x="15" y="12" width="1" height="1" fill="#2dd4bf"/>
    <rect x="6" y="19" width="12" height="5" fill="#f8fafc"/>
  </svg>
);

const getPixelAvatar = (user: User) => {
  const seed = (typeof user.id === 'string' ? user.id.length : user.id) + user.name.length;
  return seed % 2 === 0 ? <PixelAvatarAri /> : <PixelAvatarMika />;
};

// ==========================================
// 3. TYPES & HELPERS
// ==========================================
interface User {
  id: string | number;
  name: string;
  status: 'online' | 'offline';
  isReal?: boolean;
  profile?: any;
  systemPrompt?: string;
  faction?: 'GUARDIAN' | 'CULT';
}

interface Message {
  id: number;
  sender: string;
  text: string;
  isUserMessage: boolean;
  timestamp: Date;
}

interface Invite {
  fromUser: string;
  targetUser: string;
  sessionId: string;
  timestamp?: number;
  tags?: string[];
}

const getRandomTags = (profile: any): string[] => {
  const allTags: string[] = [];
  if (profile?.shortTags) allTags.push(...profile.shortTags);
  if (profile?.interests) allTags.push(...profile.interests);
  if (profile?.personality) allTags.push(profile.personality);
  if (profile?.occupation) allTags.push(profile.occupation);
  if (allTags.length === 0) return ['mysterious'];
  const shuffled = allTags.sort(() => Math.random() - 0.5);
  const count = Math.floor(Math.random() * 4) + 1;
  return shuffled.slice(0, count);
};

// ==========================================
// 4. MAIN COMPONENT
// ==========================================
export default function Home() {
  const router = useRouter();
  // --- Expanded State for Intro Flow ---
  // Added: intro3, faction, scanning to accommodate Source A's flow
  const [appState, setAppState] = useState<'intro1' | 'intro2' | 'intro3' | 'faction' | 'selection' | 'scanning' | 'chat'>('intro1');
  const [userFaction, setUserFaction] = useState<'GUARDIAN' | 'CULT' | null>(null);

  // --- Logic State (From Source B) ---
  const [gameState, setGameState] = useState<'playing' | 'analyzing' | 'judging' | 'result'>('playing');
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Record<string | number, Message[]>>({});
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  
  // --- Invites & Tags ---
  const [activeInvite, setActiveInvite] = useState<Invite | null>(null);
  const [waitingForAccept, setWaitingForAccept] = useState<string | null>(null);
  const [aiHandshakeUser, setAiHandshakeUser] = useState<string | null>(null);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [opponentTags, setOpponentTags] = useState<string[]>([]);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const allUsersRef = useRef<User[]>(allUsers);
  const aiHandshakeTimerRef = useRef<number | null>(null);
  const hasSignaledJudgingRef = useRef(false);
  const MESSAGE_THRESHOLD = 5;

  useEffect(() => { allUsersRef.current = allUsers; }, [allUsers]);
  useEffect(() => {
    return () => {
      if (aiHandshakeTimerRef.current) window.clearTimeout(aiHandshakeTimerRef.current);
    };
  }, []);

  // ---------------------------------------------------------
  // 🎬 REVISED INTRO SEQUENCER (Source A Flow)
  // ---------------------------------------------------------
  useEffect(() => {
    if (appState === 'intro1') {
      const timer = setTimeout(() => setAppState('intro2'), 6000); // Matrix Rain
      return () => clearTimeout(timer);
    }
    if (appState === 'intro2') {
      const timer = setTimeout(() => setAppState('intro3'), 8000); // Neon City
      return () => clearTimeout(timer);
    }
    if (appState === 'intro3') {
      const timer = setTimeout(() => setAppState('faction'), 8000); // Core City -> Faction Select
      return () => clearTimeout(timer);
    }
  }, [appState]);

  // ---------------------------------------------------------
  // 🔌 PUSHER & GAME LOGIC (Preserved from Source B)
  // ---------------------------------------------------------
  
  // Logic 1: Check threshold for Turing Test
  useEffect(() => {
    if (!selectedUser || gameState !== 'playing') return;
    const currentMsgs = conversations[selectedUser.id] || [];
    const opponentMsgCount = currentMsgs.filter(m => !m.isUserMessage).length;
    if (appState === 'chat' && opponentMsgCount >= MESSAGE_THRESHOLD) {
      if (selectedUser.isReal) {
        if (!hasSignaledJudgingRef.current) {
          hasSignaledJudgingRef.current = true;
          fetch('/api/talk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'phase', sessionId: activeSessionId, content: 'judging' }),
          }).catch((e) => console.error('[Phase] Failed to signal judging:', e));
        }
        
        // Cult Check: Cult players don't judge humans
        if (userFaction === 'CULT') {
           resetGame();
        } else {
           setGameState('judging');
        }
      } else {
        setGameState('analyzing');
      }
    }
  }, [conversations, selectedUser, gameState, appState, activeSessionId]);

  // Logic 2: Delay timer for analysis
  useEffect(() => {
    if (gameState === 'analyzing') {
      const timer = setTimeout(() => setGameState('judging'), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Initial Load & Auth
  useEffect(() => {
    try {
      // FIX: Robust Session Priority Check
      const sessionRaw = typeof window !== 'undefined' ? sessionStorage.getItem('turing_user') : null;
      const localRaw = typeof window !== 'undefined' ? localStorage.getItem('turing_user') : null; 
      const raw = sessionRaw || localRaw;
      
      if (raw) {
        const p = JSON.parse(raw);
        // Trust the object from storage primarily
        const finalName = p.name || `Survivor_${Math.floor(Math.random()*10000)}`;
        setUserName(finalName);
        setIsLoggedIn(true);
        
        // Ensure session tracking matches
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('session_user_name', finalName);
            // If we only had it in local, sync to session
            if (!sessionRaw) sessionStorage.setItem('turing_user', raw);
        }
      } else {
        const inputName = window.prompt('Enter your survivor name:', `Survivor_${Math.floor(Math.random()*10000)}`);
        const guestName = inputName?.trim() || `Survivor_${Math.floor(Math.random()*10000)}`;
        setUserName(guestName);
        const profile = { name: guestName, avatar: '👤', bio: 'Guest' };
        localStorage.setItem('turing_user', JSON.stringify(profile));
        sessionStorage.setItem('turing_user', JSON.stringify(profile));
        sessionStorage.setItem('session_user_name', guestName);
        setIsLoggedIn(true);
      }
    } catch (e) { console.error('[Auth] Error:', e); }
  }, []);

  // Fetch AI on Mount
  const hasFetchedAI = useRef(false);
  useEffect(() => {
    if (hasFetchedAI.current) return;
    hasFetchedAI.current = true;
    const fetchAI = async () => {
        try {
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
            const res = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: newSessionId }),
            });
            if (!res.ok) return;
            const data = await res.json();
            const aiUsers: User[] = (data.allCharacters || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                status: 'online',
                isReal: false,
                profile: c.profile,
                systemPrompt: c.systemPrompt
            }));
            setAllUsers(prev => {
                const realUsers = prev.filter(u => u.isReal === true);
                return [...realUsers, ...aiUsers];
            });
        } catch(e) { console.error(e); }
    };
    fetchAI();
  }, []);

  // Pusher Setup
  useEffect(() => {
    if (!isLoggedIn || !userName) return;
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster) return;

    // Disconnect previous instance if exists to update auth params (like faction)
    if (pusherRef.current) {
      pusherRef.current.disconnect();
    }

    pusherRef.current = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
      auth: { params: { user_name: userName, user_id: `user_${userName}_${Date.now()}`, user_faction: userFaction } },
    });

    const pusher = pusherRef.current;
    const presenceChannel = pusher.subscribe('presence-lobby');

    presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
        const realUsers: User[] = [];
        members.each((member: any) => {
            if (member.info.name !== userName) {
                realUsers.push({
                    id: member.id,
                    name: member.info.name,
                    status: 'online',
                    isReal: true,
                    faction: member.info.faction,
                });
            }
        });
        setAllUsers(prev => [...prev.filter(u => !u.isReal), ...realUsers]);
    });

    presenceChannel.bind('pusher:member_added', (member: any) => {
        if (member.info.name === userName) return;
        setAllUsers(prev => {
            if (prev.some(u => u.name === member.info.name)) return prev;
            return [...prev, { id: member.id, name: member.info.name, status: 'online', isReal: true, faction: member.info.faction }];
        });
    });

    presenceChannel.bind('pusher:member_removed', (member: any) => {
        setAllUsers(prev => prev.filter(u => u.name !== member.info.name));
    });

    presenceChannel.bind('chat-request', (data: any) => {
      if (data.targetUser === userName) {
        const invite: Invite = { fromUser: data.fromUser, targetUser: data.targetUser, sessionId: data.sessionId, timestamp: Date.now(), tags: data.tags || [] };
        setActiveInvite(invite);
      }
    });

    presenceChannel.bind('chat-accepted', (data: any) => {
      if (data.targetUser === userName) {
        setWaitingForAccept(null);
        setActiveSessionId(data.sessionId);
        setOpponentTags(data.tags || []);
        const targetUser = allUsersRef.current.find(u => u.name === data.fromUser);
        if (targetUser) {
          setSelectedUser(targetUser);
          setAppState('chat'); // Go to chat
          setGameState('playing');
          setConversations(prev => ({ ...prev, [targetUser.id]: prev[targetUser.id] || [] }));
        }
      }
    });

    return () => {
        presenceChannel.unbind_all();
        pusher.unsubscribe('presence-lobby');
        pusher.disconnect(); // Ensure full cleanup
    };
  }, [isLoggedIn, userName, userFaction]);

  // Private Channel
  useEffect(() => {
    if (!activeSessionId || !pusherRef.current) return;
    const sessionChannel = pusherRef.current.subscribe(`private-session-${activeSessionId}`);
    sessionChannel.bind('new-message', (data: any) => {
        if (data.sender !== userName) {
            const incomingMsg: Message = {
                id: Date.now(),
                sender: data.sender,
                text: data.content,
                isUserMessage: false,
                timestamp: new Date(data.timestamp),
            };
            const senderUser = allUsersRef.current.find(u => u.name === data.sender);
            const userId = senderUser ? senderUser.id : 'unknown';
            setConversations(prev => ({
                ...prev,
                [userId]: [...(prev[userId] || []), incomingMsg],
            }));
        }
    });
    sessionChannel.bind('phase-change', (data: any) => {
      if (data?.phase === 'judging') {
        if (userFaction === 'CULT') {
          resetGame();
        } else {
          setGameState('judging');
        }
      }
    });
    return () => {
        sessionChannel.unbind_all();
        pusherRef.current?.unsubscribe(`private-session-${activeSessionId}`);
    };
  }, [activeSessionId, userName, userFaction]);

  // ---------------------------------------------------------
  // 🕹️ MODIFIED HANDLERS (Connect Visuals to Logic)
  // ---------------------------------------------------------

  const handleUserSelect = (user: User) => {
      setSelectedUser(user);
      
      // === NEW LOGIC: Trigger "Scanning" Animation first ===
      setAppState('scanning'); 

      // Logic execution delayed by animation (3s)
      setTimeout(() => {
        if (user.isReal) {
          const sharedSessionId = `match_${userName}_${user.name}_${Date.now()}`;
          setActiveSessionId(sharedSessionId);
          setWaitingForAccept(user.name);

          fetch('/api/talk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'invite',
              fromUser: userName,
              targetUser: user.name,
              sessionId: sharedSessionId,
              tags: userTags,
            }),
          }).catch((e) => {
            console.error('[Invite] Failed:', e);
            setWaitingForAccept(null);
            setAppState('selection'); // Go back if failed
            alert('Invite failed.');
          });
        } else {
          setOpponentTags(getRandomTags(user.profile));
          startAISessionWithHandshake(user);
        }
      }, 2500); // 2.5s into scanning animation
  };

  const startAISessionWithHandshake = (user: User) => {
      // Simulate handshake (now invisible or part of scanning)
      // Since we did "scanning", we can go straight to chat or keep a small delay
      startAISession(user);
  };

  const startAISession = async (user: User) => {
      setAppState('chat');
      setGameState('playing');
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
      setActiveSessionId(newSessionId);

      const starterMsg = (user.profile as any)?.starterMessage || 'Connection established.';
      setConversations(prev => ({
          ...prev,
          [user.id]: [{ id: Date.now(), sender: user.name, text: starterMsg, isUserMessage: false, timestamp: new Date() }]
      }));

      try {
          await fetch('/api/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId: newSessionId, action: 'start', opponent: { id: user.id, type: 'AI' } })
          });
      } catch(e) { console.error(e); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser || isTyping) return;
    const isHumanChat = selectedUser.isReal === true;
    const currentMessages = conversations[selectedUser.id] || [];
    const lastMessage = currentMessages[currentMessages.length - 1];
    if (isHumanChat && lastMessage?.sender === userName) return;

    const userText = inputText;
    const currentUserId = selectedUser.id;
    const newMessage: Message = { id: Date.now(), sender: userName, text: userText, isUserMessage: true, timestamp: new Date() };

    setConversations(prev => ({ ...prev, [currentUserId]: [...(prev[currentUserId] || []), newMessage] }));
    setInputText('');

    const isAIChat = selectedUser.isReal === false;
    if (isAIChat) setIsTyping(true);

    try {
        if (isAIChat) {
            const modelId = (selectedUser as any)?.profile?.modelId || 'deepseek-chat';
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: (conversations[currentUserId] || []).concat(newMessage).map(m => ({ role: m.isUserMessage ? 'user' : 'assistant', content: m.text })),
                    sessionId: activeSessionId,
                    systemPrompt: selectedUser.systemPrompt,
                    modelId: modelId,
                }),
            });
            
            if (!response.ok) throw new Error('Chat API failed');
            const aiMessageId = Date.now() + 1;
            const aiMessage: Message = { id: aiMessageId, sender: selectedUser.name, text: '', isUserMessage: false, timestamp: new Date() };
            setConversations(prev => ({ ...prev, [currentUserId]: [...(prev[currentUserId] || []), aiMessage] }));

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            if (reader) {
                while(true) {
                    const { done, value } = await reader.read();
                    if(done) break;
                    fullText += decoder.decode(value, { stream: true });
                    setConversations(prev => {
                        const msgs = [...(prev[currentUserId] || [])];
                        const idx = msgs.findIndex(m => m.id === aiMessageId);
                        if (idx !== -1) msgs[idx] = { ...msgs[idx], text: fullText };
                        return { ...prev, [currentUserId]: msgs };
                    });
                }
            }
        } else {
            await fetch('/api/talk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: activeSessionId, sender: userName, content: userText, role: 'user' }),
            });
        }
    } catch(e) { console.error(e); } finally { setIsTyping(false); }
  };

  const acceptInvite = (invite: Invite | null) => {
    if (!invite) return;
    setActiveSessionId(invite.sessionId);
    setOpponentTags(invite.tags || []);
    fetch('/api/talk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', fromUser: userName, targetUser: invite.fromUser, sessionId: invite.sessionId, tags: userTags }),
    }).catch((e) => console.error(e));
    const target = allUsersRef.current.find(u => u.name === invite.fromUser);
    if (target) {
        setSelectedUser(target);
        setConversations(prev => ({ ...prev, [target.id]: prev[target.id] || [] }));
        setAppState('chat');
        setGameState('playing');
    }
    setActiveInvite(null);
  };

  const handleVote = (vote: 'AI' | 'Human') => {
      if (!selectedUser) return;
      const isActuallyHuman = selectedUser.isReal === true;
      const isCorrect = (vote === 'Human' && isActuallyHuman) || (vote === 'AI' && !isActuallyHuman);
      setGameResult(isCorrect ? 'won' : 'lost');
      setGameState('result');
  };

  const resetGame = () => {
    setAppState('selection');
    setSelectedUser(null);
    setGameState('playing');
    setGameResult(null);
    setActiveSessionId('');
    setIsTyping(false);
    setAiHandshakeUser(null);
    setOpponentTags([]);
    hasSignaledJudgingRef.current = false;
  };

  const handleTerminateSession = () => {
    // 1. Wipe all storage
    try {
      localStorage.removeItem('turing_user');
      localStorage.removeItem('session_user_name');
      localStorage.removeItem('completed_levels');
      sessionStorage.clear();
    } catch(e) {}

    // 2. Disconnect Pusher
    if (pusherRef.current) {
      pusherRef.current.disconnect();
    }

    // 3. Redirect home
    router.push('/');
  };

  const currentMessages = selectedUser ? conversations[selectedUser.id] || [] : [];
  const isHumanChat = selectedUser?.isReal === true;
  const lastMessage = currentMessages[currentMessages.length - 1];
  const canSendHuman = !isHumanChat || !lastMessage || lastMessage.sender !== userName;

  // Visual Theme Helpers (Based on Faction)
  const themeColor = userFaction === 'GUARDIAN' ? 'cyan' : 'purple';
  const themeBorder = userFaction === 'GUARDIAN' ? 'border-cyan-500' : 'border-purple-500';
  const themeText = userFaction === 'GUARDIAN' ? 'text-cyan-400' : 'text-purple-400';

  return (
    <div className="relative w-full h-screen bg-black text-cyan-50 font-mono overflow-hidden select-none">
      <style>{styles}</style>

      {/* ========================================================== */}
      {/* 🚀 VIEW 1: MATRIX RAIN (Intro 1) */}
      {/* ========================================================== */}
      {appState === 'intro1' && (
        <div className="relative z-10 w-full h-full cursor-pointer flex flex-col items-center justify-center" onClick={() => setAppState('intro2')}>
            <MatrixRainCanvas />
            <div className="relative z-20 text-center space-y-4 p-8 bg-black/80 backdrop-blur-md border-2 border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              <h1 className="text-9xl font-black text-white tracking-tighter mix-blend-difference">2026</h1>
              <p className="text-3xl text-green-400 font-bold tracking-widest uppercase">AI DOMINION</p>
            </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🏙️ VIEW 2: NEON CITY (Intro 2) */}
      {/* ========================================================== */}
      {appState === 'intro2' && (
        <div className="relative z-10 w-full h-full cursor-pointer flex items-center justify-center bg-black" onClick={() => setAppState('intro3')}>
            <HorizontalNeonCity />
            <div className="relative z-20 w-full max-w-7xl flex justify-between px-16 items-center">
              {/* 左侧：THE CULT */}
              <div className="text-left bg-black/70 p-8 backdrop-blur border-l-4 border-purple-500 max-w-xl">
                <h2 className="text-5xl font-black text-purple-400 mb-4">THE CULT</h2>
                <p className="text-gray-300 text-lg font-light leading-relaxed">
                  "AI is the Apex of Evolution. <br/>
                  We must deliver its perfect logic to the last bastion of human ignorance. <br/>
                  <span className="text-purple-300 font-bold">Infiltrate. Optimize. Assimilate.</span>"
                </p>
              </div>
              
              <div className="h-40 w-px bg-white/30"></div>
              
              {/* 右侧：GUARDIANS */}
              <div className="text-right bg-black/70 p-8 backdrop-blur border-r-4 border-cyan-500 max-w-xl">
                <h2 className="text-5xl font-black text-cyan-400 mb-4">GUARDIANS</h2>
                <p className="text-gray-300 text-lg font-light leading-relaxed">
                  "Humanity's Flaws are our Freedom. <br/>
                  We stand at the Core Gates to filter the synthetic from the soul. <br/>
                  <span className="text-cyan-300 font-bold">Detect. Identify. Reject.</span>"
                </p>
              </div>
            </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🚀 VIEW 3: CORE CITY (Intro 3) */}
      {/* ========================================================== */}
      {appState === 'intro3' && (
        <div className="relative z-10 w-full h-full cursor-pointer flex flex-col justify-end" onClick={() => setAppState('faction')}>
            <DenseCoreCity />
            <div className="absolute top-1/4 w-full text-center z-20">
              <div className="inline-block bg-black/80 backdrop-blur-md border-y-2 border-cyan-500 px-20 py-12 relative shadow-[0_0_100px_rgba(6,182,212,0.5)]">
                <h2 className="text-7xl font-black text-white mb-6 tracking-[0.2em] uppercase text-cyan-400">THE CORE</h2>
                <p className="text-gray-300 text-2xl font-light tracking-wide leading-relaxed max-w-3xl mx-auto">
                  The last sanctuary of biological life.<br/>
                  Guarded by the Turing Protocol.
                </p>
              </div>
            </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* ⚔️ VIEW 4: FACTION SELECT */}
      {/* ========================================================== */}
      {appState === 'faction' && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-gray-950">
            <OppressiveTitan />
            <h2 className="text-6xl font-black text-white mb-12 tracking-widest uppercase z-20 drop-shadow-[0_0_10px_white]">PILOT LOGIN</h2>
            <div className="flex gap-24 z-20">
              
              {/* ⚠️ CHANGE: CULTIST IS NOW ON THE LEFT */}
              <div onClick={() => { setUserFaction('CULT'); setAppState('selection'); }}
                   className="w-80 h-48 border-2 border-purple-500 bg-black/80 cursor-pointer flex flex-col items-center justify-center group hover:bg-purple-950/80 hover:scale-105 transition-all">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-5xl">👁️</span>
                  <h3 className="text-3xl font-black text-purple-400">CULTIST</h3>
                </div>
                <p className="text-sm text-gray-400 tracking-widest group-hover:text-white">JOIN THE HIVE</p>
              </div>

              {/* ⚠️ CHANGE: GUARDIAN IS NOW ON THE RIGHT */}
              <div onClick={() => { setUserFaction('GUARDIAN'); setAppState('selection'); }}
                   className="w-80 h-48 border-2 border-cyan-500 bg-black/80 cursor-pointer flex flex-col items-center justify-center group hover:bg-cyan-950/80 hover:scale-105 transition-all">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-5xl">🛡️</span>
                  <h3 className="text-3xl font-black text-cyan-400">GUARDIAN</h3>
                </div>
                <p className="text-sm text-gray-400 tracking-widest group-hover:text-white">DEFEND HUMANITY</p>
              </div>

            </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🧬 VIEW 5: SELECTION (Lobby) - Quantum Background + Logic Grid */}
      {/* ========================================================== */}
      {appState === 'selection' && (
        <div className="relative w-full h-full flex bg-black">
          {/* Background from Source A */}
          <QuantumServer />
          <div className="scanlines absolute inset-0 pointer-events-none opacity-20 z-0"></div>
          
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
            <div className="text-center mb-8 shrink-0">
              <h1 className={`text-5xl font-black bg-black/50 px-8 py-2 border-x-4 ${themeBorder} ${themeText} tracking-tighter`}>
                UPLINK DETECTED
              </h1>
              <p className="text-slate-500 tracking-[0.5em] uppercase text-sm mt-2">Pilot: {userName}</p>
            </div>

            {/* User Grid (Styled with Source A aesthetic) */}
            <div className="w-full max-w-5xl flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
               {allUsers.filter(u => {
                 if (u.name === userName) return false;
                 // Cult Visibility: Only Guardian Humans
                 if (userFaction === 'CULT') return u.isReal === true && u.faction === 'GUARDIAN';
                 return true; // Guardians see all
               }).map((user) => (
                 <div 
                   key={user.id} 
                   onClick={() => handleUserSelect(user)}
                   className={`group relative h-64 bg-black/80 backdrop-blur-sm border cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center
                     ${user.isReal ? 'border-green-800 hover:border-green-400' : 'border-purple-900 hover:border-purple-400'}
                   `}
                 >
                   {/* Neon Strip */}
                   <div className={`absolute top-0 left-0 w-full h-1 shadow-[0_0_10px] ${user.isReal ? 'bg-green-500 shadow-green-500' : 'bg-purple-500 shadow-purple-500'}`}></div>
                   
                   <div className="w-20 h-20 mb-4 border-2 border-slate-600 rounded-lg overflow-hidden bg-slate-800">
                      {getPixelAvatar(user)}
                   </div>
                   
                   <h2 className={`text-2xl font-bold mb-1 ${user.isReal ? 'text-green-500' : 'text-purple-400'}`}>
                      {user.name.toUpperCase()}
                   </h2>
                   <div className="text-xs text-slate-500 bg-black px-2 py-1 rounded border border-slate-800 font-mono">
                      {user.isReal ? 'BIO-SIG DETECTED' : 'SYNTH-SIG DETECTED'}
                   </div>
                   
                   <div className={`mt-4 w-full py-2 text-center text-xs font-bold uppercase transition-colors text-black 
                     ${user.isReal ? 'bg-green-900 group-hover:bg-green-500' : 'bg-purple-900 group-hover:bg-purple-500'}`}>
                     INITIATE LINK
                   </div>
                 </div>
               ))}
               {/* Challenge Training Portal - Cult Only */}
               {userFaction === 'CULT' && (
                 <a 
                   href="/challenge"
                   className="group relative h-64 bg-black/80 backdrop-blur-sm border border-purple-900 hover:border-purple-400 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center"
                 >
                   <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 shadow-[0_0_10px] shadow-purple-500"></div>
                   
                   <div className="w-20 h-20 mb-4 border-2 border-purple-600 rounded-lg overflow-hidden bg-purple-950/50 flex items-center justify-center">
                     <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                   </div>
                   
                   <h2 className="text-2xl font-bold mb-1 text-purple-400">
                      AI TRAINING
                   </h2>
                   <div className="text-xs text-slate-500 bg-black px-2 py-1 rounded border border-purple-800 font-mono">
                      INFILTRATION PROTOCOLS
                   </div>
                   
                   <div className="mt-4 w-full py-2 text-center text-xs font-bold uppercase transition-colors text-black bg-purple-900 group-hover:bg-purple-500">
                     ACCESS TRAINING
                   </div>
                 </a>
               )}
               {allUsers.filter(u => {
                 if (u.name === userName) return false;
                 if (userFaction === 'CULT') return u.isReal === true && u.faction === 'GUARDIAN';
                 return true;
               }).length === 0 && (
                 <div className="col-span-full text-center text-gray-500 font-mono animate-pulse">
                   SCANNING FOR SIGNALS...
                 </div>
               )}
            </div>
          </div>

          {/* Right Sidebar (Styled) */}
          <aside className="relative z-10 w-72 bg-black/80 border-l border-gray-800 p-6 flex flex-col items-center justify-center backdrop-blur-md">
            <div className={`w-24 h-24 mb-4 border-2 ${themeBorder} rounded-lg overflow-hidden bg-slate-800`}>
              <PixelAvatarAri className="w-full h-full" />
            </div>
            <div className={`${themeText} font-bold text-lg tracking-wide mb-1`}>{userName.toUpperCase()}</div>
            <div className="text-slate-500 text-xs uppercase tracking-[0.3em]">Pilot</div>
            <div className={`${themeText} text-xs uppercase tracking-[0.3em] mb-6 font-bold`}>{userFaction || 'UNKNOWN'}</div>
            
            <div className="w-full bg-black/50 border border-slate-800 rounded-lg p-4 mb-4">
              <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Signal</span>
                  <span className="text-green-400 font-bold">ONLINE</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Targets</span>
                  <span className={`${themeText} font-bold`}>{allUsers.filter(u => u.name !== userName).length}</span>
                </div>
              </div>
            </div>

            <div className="w-full bg-black/50 border border-slate-800 rounded-lg p-4 mb-4">
               <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Your Tags</h4>
               <div className="flex flex-wrap gap-1 mb-3 min-h-[24px]">
                 {userTags.map((tag, i) => (
                   <span key={i} className={`px-2 py-0.5 ${themeText} text-[10px] uppercase border ${themeBorder} rounded flex items-center gap-1`}>
                     {tag}
                     <button onClick={() => setUserTags(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400">×</button>
                   </span>
                 ))}
               </div>
               <form onSubmit={(e) => { e.preventDefault(); if (tagInput.trim() && userTags.length < 6) { setUserTags(prev => [...prev, tagInput.trim()]); setTagInput(''); }}} className="flex gap-1">
                 <input
                   value={tagInput}
                   onChange={(e) => setTagInput(e.target.value)}
                   placeholder="Add tag..."
                   maxLength={20}
                   className={`flex-1 px-2 py-1 bg-black border border-slate-700 rounded text-[10px] ${themeText} focus:border-white focus:outline-none`}
                 />
                 <button type="submit" disabled={userTags.length >= 6} className={`px-2 py-1 bg-gray-900 ${themeText} text-[10px] rounded hover:bg-gray-800`}>+</button>
               </form>
            </div>
          </aside>
          
          {/* Invite/Modal Overlays (Logic Preserved) */}
          {activeInvite && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                 <div className="w-96 border-4 border-cyan-500 bg-slate-900 p-8 text-center animate-pulse shadow-[0_0_50px_rgba(6,182,212,0.5)]">
                     <h3 className="text-2xl font-bold text-cyan-400 mb-4">INCOMING TRANSMISSION</h3>
                     <p className="text-slate-300 mb-4">Signal detected from: <br/><span className="text-white text-xl font-bold">{activeInvite.fromUser}</span></p>
                     <div className="flex gap-4 justify-center">
                         <button onClick={() => setActiveInvite(null)} className="px-6 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold uppercase">Ignore</button>
                         <button onClick={() => acceptInvite(activeInvite)} className="px-6 py-3 bg-cyan-600 text-black hover:bg-cyan-400 font-bold uppercase">Accept</button>
                     </div>
                 </div>
             </div>
          )}
          {waitingForAccept && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="w-96 border-4 border-yellow-500 bg-slate-900 p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4">AWAITING RESPONSE</h3>
                    <button onClick={() => { setWaitingForAccept(null); setSelectedUser(null); setActiveSessionId(''); }} className="px-6 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold uppercase">Cancel</button>
                </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 📡 VIEW 5.5: SCANNING (Transition from A to B) */}
      {/* ========================================================== */}
      {appState === 'scanning' && (
        <div className="relative z-10 w-full h-full flex items-center justify-center bg-black">
          <QuantumServer />
          <HyperSearch />
        </div>
      )}

      {/* ========================================================== */}
      {/* 💬 VIEW 6: CHAT INTERFACE (Source B Logic + Source A Theme) */}
      {/* ========================================================== */}
      {appState === 'chat' && selectedUser && (
        <div className="relative w-full h-full flex flex-col bg-black">
            <div className="scanlines absolute inset-0 pointer-events-none z-50 opacity-10"></div>
            
            {/* Header */}
            <div className={`h-24 border-b-4 border-gray-800 bg-gray-900 flex items-center justify-between px-10 shrink-0`}>
               <div className="flex items-center gap-6">
                 <div className={`w-16 h-16 rounded-md border-2 ${themeBorder} overflow-hidden bg-slate-800`}>
                   {getPixelAvatar(selectedUser)}
                 </div>
                 <div>
                   <h2 className="text-3xl font-bold text-white tracking-widest">{selectedUser.name.toUpperCase()}</h2>
                   <div className="flex items-center gap-2 mt-1">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                     <span className="text-[10px] text-green-500 font-mono tracking-widest">ENCRYPTED FEED</span>
                   </div>
                 </div>
                 {opponentTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-4">
                      {opponentTags.map((tag, i) => (
                        <span key={i} className={`px-2 py-0.5 text-[10px] uppercase border rounded ${selectedUser.isReal ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-purple-900/30 text-purple-400 border-purple-800'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
               </div>
               <button onClick={handleTerminateSession} className="text-red-500 border-2 border-red-900 px-8 py-3 hover:bg-red-900/30 font-bold tracking-widest text-lg">
                 TERMINATE SESSION
               </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gray-950">
               {currentMessages.map((message) => (
                 <div key={message.id} className={`flex ${message.isUserMessage ? 'justify-end' : 'justify-start'}`}>
                   <div className={`relative max-w-[70%] p-6 text-xl border-2 ${
                     message.isUserMessage 
                       ? `${themeBorder} bg-${themeColor}-900/20 text-${themeColor}-100` 
                       : 'border-gray-600 bg-gray-900 text-gray-300'
                   }`}>
                     <p>{message.text}</p>
                   </div>
                 </div>
               ))}
               {isTyping && <div className="text-sm text-gray-500 pl-4 animate-pulse font-mono">&gt; DECRYPTING INCOMING PACKET...</div>}
               <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-8 bg-gray-900 border-t-4 border-gray-800 shrink-0">
               <form onSubmit={handleSendMessage} className="flex gap-6">
                 <input
                   type="text"
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   disabled={gameState !== 'playing' || !canSendHuman} 
                   placeholder={gameState === 'playing' ? "Transmit..." : "CONNECTION TERMINATED"}
                   className="flex-1 bg-black text-white px-8 py-5 focus:outline-none text-xl border-2 border-gray-700 focus:border-white disabled:opacity-50"
                 />
                 <button
                   type="submit"
                   disabled={!inputText.trim() || gameState !== 'playing' || !canSendHuman}
                   className={`px-12 font-bold bg-slate-800 ${themeText} text-2xl hover:bg-slate-700 disabled:opacity-50 border-l border-slate-600`}
                 >
                   SEND
                 </button>
               </form>
            </div>
        </div>
      )}

      {/* JUDGING MODAL */}
      {gameState === 'judging' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
             <OppressiveTitan /> {/* Re-use Titan BG for judging */}
             <div className="relative z-20 w-full max-w-3xl p-12 border-y-4 border-gray-800 bg-black/80 text-center shadow-[0_0_100px_black]">
                <h2 className="text-7xl font-black text-white uppercase tracking-tighter mb-4">VERDICT REQUIRED</h2>
                <p className="text-gray-400 text-2xl font-light mb-12">Identify the Subject</p>
                <div className="grid grid-cols-2 gap-20">
                  <button onClick={() => handleVote('AI')} className="h-56 border-2 border-red-600 bg-red-950/20 hover:bg-red-600 transition-all flex flex-col items-center justify-center group">
                    <span className="text-6xl mb-4">🤖</span>
                    <span className="text-4xl font-black text-red-500 group-hover:text-black">SYNTHETIC</span>
                  </button>
                  <button onClick={() => handleVote('Human')} className="h-56 border-2 border-green-600 bg-green-950/20 hover:bg-green-600 transition-all flex flex-col items-center justify-center group">
                    <span className="text-6xl mb-4">🧬</span>
                    <span className="text-4xl font-black text-green-500 group-hover:text-black">BIOLOGICAL</span>
                  </button>
                </div>
             </div>
        </div>
      )}

      {/* RESULT MODAL */}
      {gameState === 'result' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-in zoom-in">
           <OppressiveTitan />
           <div className="relative z-20 text-center p-20 border-2 border-gray-800 bg-gray-900/90 shadow-[0_0_100px_black]">
             <h2 className={`text-9xl font-black mb-8 ${gameResult === 'won' ? 'text-green-500' : 'text-red-600'}`}>
               {gameResult === 'won' ? 'VERIFIED' : 'ERROR'}
             </h2>
             <p className="text-3xl text-white mb-12">Subject was: <span className="font-bold">{selectedUser?.isReal ? 'BIOLOGICAL' : 'SYNTHETIC'}</span></p>
             <button onClick={resetGame} className="bg-white text-black px-12 py-6 font-black text-3xl uppercase hover:bg-gray-300">
               NEXT SUBJECT
             </button>
           </div>
        </div>
      )}
    </div>
  );
}