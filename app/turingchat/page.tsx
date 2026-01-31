'use client';

import { useState, useRef, useEffect } from 'react';
import Pusher from 'pusher-js';

// ========== CSS & Animations (The Engine) ==========
const styles = `
  @keyframes star-fly {
    from { transform: translateY(0); }
    to { transform: translateY(100vh); }
  }
  @keyframes planet-rise {
    from { transform: translateY(100%) scale(0.8); }
    to { transform: translateY(20%) scale(1.5); }
  }
  @keyframes shake-hard {
    0% { transform: translate(0, 0) rotate(0deg); }
    20% { transform: translate(-3px, 3px) rotate(-1deg); }
    40% { transform: translate(3px, -3px) rotate(1deg); }
    60% { transform: translate(-3px, -3px) rotate(0deg); }
    80% { transform: translate(3px, 3px) rotate(-1deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
  @keyframes smoke-rise {
    0% { transform: translateY(0) scale(1); opacity: 0.8; }
    100% { transform: translateY(-150px) scale(2); opacity: 0; }
  }
  @keyframes ember-fly {
    0% { transform: translateY(0) translateX(0); opacity: 1; }
    100% { transform: translateY(-200px) translateX(50px); opacity: 0; }
  }
  @keyframes blink-red {
    0%, 100% { background-color: rgba(239, 68, 68, 0.1); }
    50% { background-color: rgba(239, 68, 68, 0.5); }
  }
  .pixel-art { image-rendering: pixelated; }
  .scanlines {
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
    background-size: 100% 4px;
  }
  /* Custom Scrollbar for Punk Look */
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #0f172a; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #475569; }
`;

// ========== CUSTOM AVATAR COMPONENTS ==========
const PixelAvatarAri = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-full h-full"} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" fill="#1e293b"/>
    <rect x="7" y="8" width="10" height="12" fill="#d4a373"/>
    <rect x="6" y="10" width="1" height="4" fill="#d4a373"/>
    <rect x="17" y="10" width="1" height="4" fill="#d4a373"/>
    <path d="M6 5h12v3h1v2h-1v-1h-1v-1h-2v1h-2v-1h-2v1h-2v-1h-1v1h-1v1h-1v-2h1v-3z" fill="#8d5524"/>
    <rect x="5" y="6" width="1" height="4" fill="#8d5524"/>
    <rect x="7" y="11" width="4" height="3" fill="#334155"/>
    <rect x="8" y="12" width="2" height="1" fill="#0ea5e9"/>
    <rect x="13" y="11" width="4" height="3" fill="#334155"/>
    <rect x="14" y="12" width="2" height="1" fill="#0ea5e9"/>
    <rect x="11" y="12" width="2" height="1" fill="#1e293b"/>
    <rect x="15" y="16" width="4" height="1" fill="#10b981"/>
    <rect x="5" y="20" width="14" height="4" fill="#ea580c"/>
  </svg>
);

const PixelAvatarMika = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "w-full h-full"} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" fill="#1e293b"/>
    <rect x="8" y="9" width="8" height="10" fill="#fec5bb"/>
    <path d="M7 4h10v5h1v4h-1v2h-1v3h-1v-3h-1v-2h-4v2h-1v3h-1v-3h-1v-2h-1v-4h1v-5z" fill="#2e1065"/>
    <rect x="9" y="12" width="2" height="2" fill="#1e293b"/>
    <rect x="13" y="12" width="2" height="2" fill="#1e293b"/>
    <rect x="9" y="3" width="6" height="3" fill="#f8fafc"/>
    <rect x="11" y="4" width="2" height="1" fill="#ef4444"/>
    <rect x="11.5" y="3.5" width="1" height="2" fill="#ef4444"/>
    <rect x="13" y="11" width="3" height="3" fill="rgba(45, 212, 191, 0.4)"/>
    <rect x="15" y="12" width="1" height="1" fill="#2dd4bf"/>
    <rect x="6" y="19" width="12" height="5" fill="#f8fafc"/>
  </svg>
);

// Helper to assign a pixel avatar based on user name/ID
const getPixelAvatar = (user: User) => {
  const seed = (typeof user.id === 'string' ? user.id.length : user.id) + user.name.length;
  return seed % 2 === 0 ? <PixelAvatarAri /> : <PixelAvatarMika />;
};

// ========== TypeScript Interfaces ==========
interface User {
  id: string | number;
  name: string;
  status: 'online' | 'offline';
  isReal?: boolean;
  profile?: any;
  systemPrompt?: string;
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
} 

// ========== Main Component ==========
export default function Home() {
  // --- Visual State ---
  const [appState, setAppState] = useState<'intro1' | 'intro2' | 'selection' | 'chat'>('intro1');
  const [gameState, setGameState] = useState<'playing' | 'analyzing' | 'judging' | 'result'>('playing');
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  
  // --- Logic State (Existing) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Record<string | number, Message[]>>({});
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  
  // --- Invites ---
  const [activeInvite, setActiveInvite] = useState<Invite | null>(null);
  const [waitingForAccept, setWaitingForAccept] = useState<string | null>(null); // Show "waiting" UI
  const [aiHandshakeUser, setAiHandshakeUser] = useState<string | null>(null);
  
  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const allUsersRef = useRef<User[]>(allUsers);
  const aiHandshakeTimerRef = useRef<number | null>(null);
  const hasSignaledJudgingRef = useRef(false);
  const MESSAGE_THRESHOLD = 5; // Trigger judgment after 5 messages from opponent

  // Keep ref in sync
  useEffect(() => { allUsersRef.current = allUsers; }, [allUsers]);
  useEffect(() => {
    return () => {
      if (aiHandshakeTimerRef.current) {
        window.clearTimeout(aiHandshakeTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------
  // 🎬 INTRO SEQUENCER
  // ---------------------------------------------------------
  useEffect(() => {
    if (appState === 'intro1') {
      const timer = setTimeout(() => setAppState('intro2'), 6000); 
      return () => clearTimeout(timer);
    }
    if (appState === 'intro2') {
      const timer = setTimeout(() => setAppState('selection'), 7000);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  // ---------------------------------------------------------
  // 🎮 GAME LOGIC (Added to existing Chat)
  // ---------------------------------------------------------
  // Logic 1: Check threshold for Turing Test
  useEffect(() => {
    if (!selectedUser || gameState !== 'playing') return;
    const currentMsgs = conversations[selectedUser.id] || [];
    const opponentMsgCount = currentMsgs.filter(m => !m.isUserMessage).length;
    
    // Only trigger if we are in chat state and active
    if (appState === 'chat' && opponentMsgCount >= MESSAGE_THRESHOLD) {
      if (selectedUser.isReal) {
        if (!hasSignaledJudgingRef.current) {
          hasSignaledJudgingRef.current = true;
          fetch('/api/talk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'phase',
              sessionId: activeSessionId,
              content: 'judging',
            }),
          }).catch((e) => console.error('[Phase] Failed to signal judging:', e));
        }
        setGameState('judging');
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

  // ---------------------------------------------------------
  // 🔌 PUSHER & AUTH LOGIC (Preserved)
  // ---------------------------------------------------------
  
  // Initial Load & Auth
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('turing_user') : null;
      if (raw) {
        const p = JSON.parse(raw);
        // Add a short unique suffix to ensure different tabs have different names
        const storedName = p.name || '';
        // Check if this tab already has a session name
        const sessionName = typeof window !== 'undefined' ? sessionStorage.getItem('session_user_name') : null;
        if (sessionName) {
          setUserName(sessionName);
        } else {
          // First time in this tab - use stored name or create new
          const finalName = storedName || `Survivor_${Math.floor(Math.random()*10000)}`;
          setUserName(finalName);
          sessionStorage.setItem('session_user_name', finalName);
          if (!storedName) {
            localStorage.setItem('turing_user', JSON.stringify({ name: finalName }));
          }
        }
        setIsLoggedIn(true);
      } else {
        // If no user, prompt for name via window prompt for simplicity in this demo context
        const inputName = window.prompt('Enter your survivor name:', `Survivor_${Math.floor(Math.random()*10000)}`);
        const guestName = inputName?.trim() || `Survivor_${Math.floor(Math.random()*10000)}`;
        setUserName(guestName);
        localStorage.setItem('turing_user', JSON.stringify({ name: guestName }));
        sessionStorage.setItem('session_user_name', guestName);
        setIsLoggedIn(true);
      }
    } catch (e) { console.error('[Auth] Error:', e); }
  }, []);

  // Fetch AI on Mount (with guard to prevent duplicate calls in Strict Mode)
  const hasFetchedAI = useRef(false);
  useEffect(() => {
    if (hasFetchedAI.current) return;
    hasFetchedAI.current = true;
    
    const fetchAI = async () => {
        try {
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
            console.log('[Match] Fetching AI characters...');
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
            
            console.log(`[Match] Received ${aiUsers.length} AI characters`);
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

    if (!pusherRef.current) {
      pusherRef.current = new Pusher(pusherKey, {
        cluster: pusherCluster,
        authEndpoint: '/api/pusher/auth',
        auth: { params: { user_name: userName, user_id: `user_${userName}_${Date.now()}` } },
      });
    }

    const pusher = pusherRef.current;
    const presenceChannel = pusher.subscribe('presence-lobby');

    presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
        console.log('[Pusher] Subscription succeeded! Members count:', members.count);
        const realUsers: User[] = [];
        members.each((member: any) => {
            console.log('[Pusher] Member in lobby:', member.info.name, 'id:', member.id);
            if (member.info.name !== userName) {
                realUsers.push({
                    id: member.id,
                    name: member.info.name,
                    status: 'online',
                    isReal: true,
                });
            }
        });
        console.log('[Pusher] Real users found:', realUsers.length);
        setAllUsers(prev => [...prev.filter(u => !u.isReal), ...realUsers]);
    });

    presenceChannel.bind('pusher:member_added', (member: any) => {
        if (member.info.name === userName) return;
        setAllUsers(prev => {
            if (prev.some(u => u.name === member.info.name)) return prev;
            return [...prev, {
                id: member.id,
                name: member.info.name,
                status: 'online',
                isReal: true,
            }];
        });
    });

    presenceChannel.bind('pusher:member_removed', (member: any) => {
        setAllUsers(prev => prev.filter(u => u.name !== member.info.name));
    });

    presenceChannel.bind('chat-request', (data: any) => {
      console.log('[Invite] Received chat-request:', data);
      if (data.targetUser === userName) {
        const invite: Invite = { fromUser: data.fromUser, targetUser: data.targetUser, sessionId: data.sessionId, timestamp: Date.now() };
        setActiveInvite(invite);
      }
    });

    presenceChannel.bind('chat-accepted', (data: any) => {
      console.log('[Invite] Received chat-accepted:', data);
      if (data.targetUser === userName) {
        setWaitingForAccept(null);
        setActiveSessionId(data.sessionId);
        const targetUser = allUsersRef.current.find(u => u.name === data.fromUser);
        if (targetUser) {
          setSelectedUser(targetUser);
          setAppState('chat');
          setGameState('playing');
          setConversations(prev => ({
            ...prev,
            [targetUser.id]: prev[targetUser.id] || []
          }));
        }
      }
    });

    return () => {
        presenceChannel.unbind_all();
        pusher.unsubscribe('presence-lobby');
    };
  }, [isLoggedIn, userName]);

  // Private Channel for Messages
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
            // Find user to map message correctly
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
            setGameState('judging');
          }
        });

    return () => {
        sessionChannel.unbind_all();
        pusherRef.current?.unsubscribe(`private-session-${activeSessionId}`);
    };
  }, [activeSessionId, userName]);

  // ---------------------------------------------------------
  // 🕹️ ACTIONS & HANDLERS
  // ---------------------------------------------------------

  const handleUserSelect = (user: User) => {
      setSelectedUser(user);
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
          }),
        }).catch((e) => {
          console.error('[Invite] Failed to send invite:', e);
          setWaitingForAccept(null);
          alert('Invite failed. Please try again.');
        });
      } else {
        startAISessionWithHandshake(user);
      }
  };

  const startAISessionWithHandshake = (user: User) => {
      const delay = 3000 + Math.floor(Math.random() * 4000); // 3–7s
      setAiHandshakeUser(user.name);
      if (aiHandshakeTimerRef.current) {
        window.clearTimeout(aiHandshakeTimerRef.current);
      }
      aiHandshakeTimerRef.current = window.setTimeout(() => {
        setAiHandshakeUser(null);
        startAISession(user);
      }, delay);
  };

  const startAISession = async (user: User) => {
      setAppState('chat');
      setGameState('playing');
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
      setActiveSessionId(newSessionId);

      // Starter Message
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
                    messages: (conversations[currentUserId] || []).concat(newMessage).map(m => ({
                        role: m.isUserMessage ? 'user' : 'assistant',
                        content: m.text,
                    })),
                    sessionId: activeSessionId,
                    systemPrompt: selectedUser.systemPrompt,
                    modelId: modelId,
                }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Chat] API Error:', response.status, errorText);
                throw new Error(`Chat API failed (${response.status}): ${errorText.substring(0, 100)}`);
            }
            
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
            // Human Chat
            await fetch('/api/talk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: activeSessionId,
                    sender: userName,
                    content: userText,
                    role: 'user',
                }),
            });
        }
    } catch(e) { console.error(e); } finally { setIsTyping(false); }
  };

  const acceptInvite = (invite: Invite | null) => {
    if (!invite) return;
    console.log('[Invite] Accepting invite:', invite);
    setActiveSessionId(invite.sessionId);

    fetch('/api/talk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        fromUser: userName,
        targetUser: invite.fromUser,
        sessionId: invite.sessionId,
      }),
    }).catch((e) => console.error('[Invite] Failed to accept invite:', e));

    const target = allUsersRef.current.find(u => u.name === invite.fromUser);
    if (target) {
        setSelectedUser(target);
        setConversations(prev => ({
            ...prev,
            [target.id]: prev[target.id] || []
        }));
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
    hasSignaledJudgingRef.current = false;
    // End session logic here if needed
  };

  const currentMessages = selectedUser ? conversations[selectedUser.id] || [] : [];
  const isHumanChat = selectedUser?.isReal === true;
  const lastMessage = currentMessages[currentMessages.length - 1];
  const canSendHuman = !isHumanChat || !lastMessage || lastMessage.sender !== userName;

  return (
    <div className="relative w-full h-screen bg-black text-cyan-50 font-mono overflow-hidden">
      <style>{styles}</style>

      {/* ========================================================== */}
      {/* 🚀 VIEW 1: INTRO (Descent) */}
      {/* ========================================================== */}
      {appState === 'intro1' && (
        <div className="relative w-full h-full overflow-hidden cursor-pointer" onClick={() => setAppState('intro2')}>
          <div className="absolute inset-0 bg-[#020205]"></div>
          <div className="absolute inset-0 opacity-60" style={{ 
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px)',
            backgroundSize: '2px 100px',
            animation: 'star-fly 0.2s linear infinite'
          }}></div>
          <div className="absolute left-0 right-0 bottom-0 h-[80vh] w-full flex justify-center items-end animate-[planet-rise_6s_ease-in-out_forwards]">
            <div className="w-[150vw] h-[150vw] rounded-full bg-gradient-to-t from-[#3f0d0d] via-[#7f1d1d] to-[#000000] shadow-[0_-50px_100px_rgba(220,38,38,0.3)]"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent animate-[blink-red_0.1s_infinite]"></div>
          <div className="absolute inset-0 border-[40px] border-black/80 rounded-[50px] pointer-events-none animate-[shake-hard_0.5s_infinite]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
               <h1 className="text-6xl md:text-9xl font-black text-red-500 tracking-tighter mix-blend-screen animate-pulse">WARNING</h1>
               <p className="text-2xl md:text-4xl text-red-500 bg-black/50 px-4 font-bold border-y-2 border-red-500">HULL INTEGRITY 0%</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🔥 VIEW 2: WRECKAGE */}
      {/* ========================================================== */}
      {appState === 'intro2' && (
        <div className="relative w-full h-full overflow-hidden cursor-pointer bg-[#0f0505]" onClick={() => setAppState('selection')}>
          <div className="absolute bottom-0 w-full h-1/2 bg-[#1a0505] opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black to-transparent z-10"></div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 z-20">
             <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,100,0,0.5)]">
               <path d="M20 80 L50 40 L80 80 L70 90 L30 90 Z" fill="#2d2d2d" stroke="#000" strokeWidth="2"/>
               <path d="M35 80 L50 50 L65 80" fill="#4a4a4a"/>
             </svg>
          </div>
          <div className="absolute top-1/4 w-full text-center z-40">
            <h2 className="text-3xl md:text-5xl font-bold text-orange-500 mb-4 animate-pulse uppercase tracking-widest drop-shadow-md">System Rebooting...</h2>
            <div className="max-w-2xl mx-auto bg-black/60 backdrop-blur-md p-6 border-l-4 border-orange-500 text-left">
              <p className="text-lg text-gray-300 font-mono leading-relaxed">
                {'>'} DETECTED SURVIVORS: {allUsers.length}<br/>
                {'>'} ESTABLISHING NEURAL LINK...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🧬 VIEW 3: SELECTION (Lobby) - REFACTORED FOR DYNAMIC USERS */}
      {/* ========================================================== */}
      {appState === 'selection' && (
        <div className="relative w-full h-full flex bg-slate-950">
          <div className="scanlines absolute inset-0 pointer-events-none opacity-20"></div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
            <div className="z-10 text-center mb-8 shrink-0">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                SURVIVOR UPLINK
              </h1>
              <p className="text-slate-500 tracking-[0.5em] uppercase text-sm mt-2">Logged in as: {userName}</p>
            </div>

            {/* Grid Container for Users */}
            <div className="w-full max-w-5xl flex-1 overflow-y-auto z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
               {allUsers.filter(u => u.name !== userName).map((user) => (
                 <div 
                   key={user.id} 
                   onClick={() => handleUserSelect(user)}
                   className={`group relative h-64 bg-slate-900 border cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center
                     ${user.isReal ? 'border-green-800 hover:border-green-400' : 'border-purple-900 hover:border-purple-400'}
                   `}
                 >
                   <div className={`absolute top-0 left-0 w-full h-1 shadow-[0_0_10px] ${user.isReal ? 'bg-green-500 shadow-green-500' : 'bg-purple-500 shadow-purple-500'}`}></div>
                   
                   <div className="w-20 h-20 mb-4 border-2 border-slate-600 rounded-lg overflow-hidden bg-slate-800">
                      {getPixelAvatar(user)}
                   </div>
                   
                   <h2 className={`text-2xl font-bold mb-1 ${user.isReal ? 'text-green-500' : 'text-purple-400'}`}>
                      {user.name.toUpperCase()}
                   </h2>
                   <div className="text-xs text-slate-500 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                      {user.isReal ? 'BIOLOGICAL SIGNAL' : 'SYNTHETIC SIGNAL'}
                   </div>
                   
                   <div className={`mt-4 w-full py-2 text-center text-xs font-bold uppercase transition-colors text-black 
                     ${user.isReal ? 'bg-green-900 group-hover:bg-green-500' : 'bg-purple-900 group-hover:bg-purple-500'}`}>
                     INITIATE LINK
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Right Sidebar: User Info Panel */}
          <aside className="w-72 bg-slate-900/80 border-l border-slate-800 p-6 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <div className="w-24 h-24 mb-4 border-2 border-cyan-500 rounded-lg overflow-hidden bg-slate-800 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <PixelAvatarAri className="w-full h-full" />
            </div>
            <div className="text-cyan-400 font-bold text-lg tracking-wide mb-1">{userName.toUpperCase()}</div>
            <div className="text-slate-500 text-xs uppercase tracking-[0.3em] mb-6">Survivor</div>
            
            <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-4 mb-4">
              <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Signal</span>
                  <span className="text-green-400 font-bold">ONLINE</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Uplinks</span>
                  <span className="text-cyan-400 font-bold">{allUsers.filter(u => u.name !== userName).length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Humans</span>
                  <span className="text-green-400 font-bold">{allUsers.filter(u => u.isReal && u.name !== userName).length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Synthetic</span>
                  <span className="text-purple-400 font-bold">{allUsers.filter(u => !u.isReal).length}</span>
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-4">
              <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-2">Mission</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Identify synthetic entities. Trust no one. Survive.
              </p>
            </div>
          </aside>

          {/* Invite Modal (Inline) */}
          {activeInvite && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="w-96 border-4 border-cyan-500 bg-slate-900 p-8 text-center animate-pulse shadow-[0_0_50px_rgba(6,182,212,0.5)]">
                    <h3 className="text-2xl font-bold text-cyan-400 mb-4">INCOMING TRANSMISSION</h3>
                    <p className="text-slate-300 mb-8">Signal detected from: <br/><span className="text-white text-xl font-bold">{activeInvite.fromUser}</span></p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => setActiveInvite(null)} className="px-6 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold uppercase">Ignore</button>
                        <button onClick={() => acceptInvite(activeInvite)} className="px-6 py-3 bg-cyan-600 text-black hover:bg-cyan-400 font-bold uppercase">Accept</button>
                    </div>
                </div>
            </div>
          )}

          {/* Waiting for Accept Modal */}
          {waitingForAccept && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="w-96 border-4 border-yellow-500 bg-slate-900 p-8 text-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h3 className="text-2xl font-bold text-yellow-400 mb-4">AWAITING RESPONSE</h3>
                    <p className="text-slate-300 mb-8">Uplink request sent to: <br/><span className="text-white text-xl font-bold">{waitingForAccept}</span></p>
                    <button onClick={() => { setWaitingForAccept(null); setSelectedUser(null); setActiveSessionId(''); }} className="px-6 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold uppercase">
                        Cancel
                    </button>
                </div>
            </div>
          )}

          {/* AI Handshake Modal */}
          {aiHandshakeUser && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                <div className="w-96 border-4 border-purple-500 bg-slate-900 p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.3)]">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <h3 className="text-2xl font-bold text-purple-400 mb-4">HANDSHAKE IN PROGRESS</h3>
                    <p className="text-slate-300 mb-8">Uplink request sent to: <br/><span className="text-white text-xl font-bold">{aiHandshakeUser}</span></p>
                    <button
                      onClick={() => {
                        if (aiHandshakeTimerRef.current) window.clearTimeout(aiHandshakeTimerRef.current);
                        setAiHandshakeUser(null);
                        setSelectedUser(null);
                        setActiveSessionId('');
                      }}
                      className="px-6 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold uppercase"
                    >
                        Cancel
                    </button>
                </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 💬 VIEW 4: CHAT INTERFACE */}
      {/* ========================================================== */}
      {appState === 'chat' && selectedUser && (
        <div className="relative w-full h-full flex flex-col bg-slate-950">
            <div className="scanlines absolute inset-0 pointer-events-none z-50 opacity-10"></div>
            
            {/* Header */}
            <div className="h-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-8 shrink-0">
               <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-md border-2 border-slate-600 overflow-hidden bg-slate-800">
                   {getPixelAvatar(selectedUser)}
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-white tracking-widest leading-none">{selectedUser.name.toUpperCase()}</h2>
                   <div className="flex items-center gap-2 mt-1">
                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                     <span className="text-[10px] text-green-500 font-mono tracking-widest">LIVE FEED</span>
                   </div>
                 </div>
               </div>
               <button onClick={resetGame} className="text-xs text-red-500 border border-red-900 px-4 py-2 hover:bg-red-950 uppercase tracking-widest transition-colors">
                 Term. Link
               </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {currentMessages.map((message) => (
                <div key={message.id} className={`flex ${message.isUserMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative max-w-2xl p-6 ${
                    message.isUserMessage 
                      ? 'bg-cyan-950/30 border-r-4 border-cyan-500' 
                      : 'bg-slate-800/50 border-l-4 border-purple-500'
                  }`}>
                    <p className="text-lg leading-relaxed font-light text-slate-200">{message.text}</p>
                    <span className="text-[10px] text-slate-500 uppercase mt-2 block font-bold tracking-widest">
                      {message.timestamp.toLocaleTimeString([], {hour12: false})} // {message.sender}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="text-xs text-slate-500 animate-pulse pl-4 font-mono">&gt; INCOMING DATA STREAM...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-8 bg-slate-900 border-t border-slate-800 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-0 border border-slate-600 focus-within:border-cyan-500 transition-colors">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={gameState !== 'playing' || !canSendHuman} 
                  placeholder={gameState === 'playing' ? "Type to transmit..." : "CONNECTION TERMINATED"}
                  className="flex-1 bg-black text-white px-6 py-4 focus:outline-none font-mono text-lg disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || gameState !== 'playing' || !canSendHuman}
                  className="bg-slate-800 text-cyan-400 px-8 font-bold hover:bg-cyan-900 disabled:opacity-50 uppercase tracking-widest border-l border-slate-600"
                >
                  Send
                </button>
              </form>
            </div>
        </div>
      )}

      {/* JUDGING MODAL */}
      {gameState === 'judging' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
          <div className="w-full max-w-3xl p-12 border-4 border-red-600 bg-slate-950 text-center relative shadow-[0_0_100px_rgba(220,38,38,0.5)]">
            <h2 className="text-5xl font-black text-red-600 mb-6 tracking-widest uppercase animate-pulse">System Critical</h2>
            <div className="w-full h-px bg-red-900 mb-8"></div>
            <p className="text-2xl text-slate-300 mb-12 font-light">
              Oxygen reserves depleted. Airlock controls active.<br/>
              Identify the Subject.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <button onClick={() => handleVote('AI')} className="h-40 border-2 border-purple-600 hover:bg-purple-900/30 text-purple-500 hover:text-purple-300 font-bold text-3xl uppercase tracking-widest transition-all">
                SYNTHETIC<br/><span className="text-sm font-normal opacity-70 block mt-2">(Purge)</span>
              </button>
              <button onClick={() => handleVote('Human')} className="h-40 border-2 border-green-600 hover:bg-green-900/30 text-green-500 hover:text-green-300 font-bold text-3xl uppercase tracking-widest transition-all">
                HUMAN<br/><span className="text-sm font-normal opacity-70 block mt-2">(Rescue)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL */}
      {gameState === 'result' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black animate-in zoom-in duration-500">
          <div className="text-center p-10 border border-slate-800 bg-slate-900/50 backdrop-blur max-w-2xl">
            <h2 className={`text-8xl font-black mb-8 uppercase tracking-tighter drop-shadow-lg ${gameResult === 'won' ? 'text-green-500' : 'text-red-600'}`}>
              {gameResult === 'won' ? 'SURVIVED' : 'KILLED'}
            </h2>
            <div className="text-2xl text-slate-400 font-mono mb-12">
              SUBJECT IDENTITY: <span className={`font-bold ${selectedUser?.isReal ? 'text-green-400' : 'text-purple-400'}`}>{selectedUser?.isReal ? 'BIOLOGICAL' : 'SYNTHETIC'}</span>
            </div>
            <button onClick={resetGame} className="px-10 py-4 bg-white text-black font-black text-xl hover:bg-cyan-400 hover:scale-105 transition-all uppercase tracking-widest">
              RESTART SIMULATION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}