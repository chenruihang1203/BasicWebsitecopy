'use client';

import { useState, useRef, useEffect } from 'react';
import Pusher from 'pusher-js';

// ========== TypeScript Interfaces ==========
interface User {
  id: string | number;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  isReal?: boolean; // New: true for real presence users, false/undefined for mock AI
  profile?: any; // optional profile object for AI-generated opponents
  systemPrompt?: string; // optional system prompt for AI personas
}

interface Message {
  id: number;
  sender: string;
  text: string;
  isUserMessage: boolean;
  timestamp: Date;
}

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  joinDate: string;
  avatar: string;
}

interface PresenceMember {
  id: string;
  info: {
    name: string;
  };
}

// Invite object used for pending invitations
interface Invite {
  fromUser: string;
  targetUser: string;
  sessionId: string;
  timestamp?: number;
} 

// ========== Mock Data ==========
// Start with no fixed AI mock; we'll auto-create an AI opponent after login
const mockUsers: User[] = [
  // Note: Real human users will be added dynamically via Presence
];

const getAvatarForUser = (name: string) => {
  const avatars = ['👤', '🧑', '👨', '👩', '🧔', '👱', '🧑‍💼', '👨‍💻', '👩‍🔬'];
  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatars[Math.abs(hash) % avatars.length];
};

const getRandomAvatar = () => {
  const avatars = ['👤', '🧑', '👨', '👩', '🧔', '👱', '🧑‍💼', '👨‍💻', '👩‍🔬'];
  return avatars[Math.floor(Math.random() * avatars.length)];
};

const initialMockUserProfile: UserProfile = {
  name: 'Guest',
  email: '',
  bio: 'Turing Test Participant',
  joinDate: 'January 2024',
  avatar: '👤',
};

// Initial mock conversations for each user
const initialMockMessages: Record<string | number, Message[]> = {
  '6': [
    { id: 1, sender: 'Cute', text: 'Hi! I\'m Cute! ✨ I\'m so happy to meet you! (｡♥‿♥｡)', isUserMessage: false, timestamp: new Date() },
  ],
};

export default function Home() {
  // Login & Profile State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile>(initialMockUserProfile);
  
  // Chat State
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Record<string | number, Message[]>>(initialMockMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  // Incoming invite handling
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [activeInvite, setActiveInvite] = useState<Invite | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const presenceChannelRef = useRef<any>(null);
  const allUsersRef = useRef<User[]>(allUsers);

  // Keep ref in sync
  useEffect(() => {
    allUsersRef.current = allUsers;
  }, [allUsers]);

  // Handle Login
  const handleLogin = (name: string) => {
    if (!name.trim()) return;
    setUserName(name.trim());
    setUserProfile({
      ...initialMockUserProfile,
      name: name.trim(),
      avatar: getRandomAvatar(),
    });
    setIsLoggedIn(true);
  };

  // Pusher Presence Channel for real-time user discovery
  useEffect(() => {
    if (!isLoggedIn || !userName) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher keys missing. Real-time chat will not work.');
      return;
    }

    console.log('Initializing Pusher for user:', userName);

    if (!pusherRef.current) {
      pusherRef.current = new Pusher(pusherKey, {
        cluster: pusherCluster,
        authEndpoint: '/api/pusher/auth',
        auth: {
          params: {
            user_name: userName,
            user_id: `user_${userName}_${Date.now()}`,
          },
        },
      });
      console.log('Pusher instance created');
    }

    const pusher = pusherRef.current;
    const presenceChannel = pusher.subscribe('presence-lobby');
    presenceChannelRef.current = presenceChannel;
    
    console.log('Subscribing to presence-lobby...');

    // Log all Pusher connection state changes
    pusher.connection.bind('state_change', (states: any) => {
      console.log('🔌 Pusher state changed:', states.previous, '→', states.current);
    });

    pusher.connection.bind('error', (err: any) => {
      console.error('❌ Pusher connection error:', err);
    });

    // Handle subscription success
    presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
      console.log('Subscription succeeded! Current members:', members.count);
      updateUserListFromPresence(members);
    });

    // Handle new member
    presenceChannel.bind('pusher:member_added', (member: PresenceMember) => {
      console.log('New member added:', member.info.name);
      if (member.info.name !== userName) {
        addPresenceUser(member);
      }
    });

    // Handle member removal
    presenceChannel.bind('pusher:member_removed', (member: PresenceMember) => {
      console.log('Member removed:', member.info.name);
      removePresenceUser(member);
    });

    // Handle chat requests (queue + modal + notification)
    presenceChannel.bind('client-chat-request', (data: any) => {
      console.log('📨 [EVENT RECEIVED] client-chat-request from:', data.fromUser, 'to:', data.targetUser, 'sessionId:', data.sessionId);
      if (data.targetUser === userName) {
        const invite: Invite = { fromUser: data.fromUser, targetUser: data.targetUser, sessionId: data.sessionId, timestamp: Date.now() };
        if (document.visibilityState === 'visible') {
          console.log('Page visible — showing in-page modal for invite from', data.fromUser);
          setActiveInvite(invite);
        } else {
          console.log('Page hidden — queueing invite and sending notification');
          setPendingInvites(prev => [invite, ...prev]);
          showDesktopNotification(invite);
        }
      }
    });

    presenceChannel.bind('client-chat-accepted', (data: any) => {
      console.log('✅ [ACCEPTED] Received client-chat-accepted from:', data.fromUser, 'sessionId:', data.sessionId);
      if (data.targetUser === userName) {
        console.log('✅ [ACCEPTED] Setting activeSessionId for receiver to:', data.sessionId);
        setActiveSessionId(data.sessionId);
        console.log('✅ Session established:', data.sessionId);
        // Switch to that user's conversation
        const targetUser = allUsersRef.current.find(u => u.name === data.fromUser);
        if (targetUser) {
          setSelectedUser(targetUser);
          console.log('Switched to chat with:', data.fromUser);
        }
      }
    });

    return () => {
      console.log('Cleaning up Pusher subscription...');
      presenceChannel.unbind_all();
      pusher.unsubscribe('presence-lobby');
    };
  }, [isLoggedIn, userName]); // Removed allUsers from dependencies

  // Private session channel for direct messaging
  useEffect(() => {
    if (!activeSessionId || !pusherRef.current) {
      console.log('❌ Private channel effect skipped: activeSessionId=', activeSessionId, 'pusherRef.current=', !!pusherRef.current);
      return;
    }

    console.log('🔗 Subscribing to private channel:', `private-session-${activeSessionId}`);

    const pusher = pusherRef.current;
    const sessionChannel = pusher.subscribe(`private-session-${activeSessionId}`);

    sessionChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Private channel subscription succeeded:', `private-session-${activeSessionId}`);
    });

    sessionChannel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ Private channel subscription error:', error);
    });

    sessionChannel.bind('new-message', (data: any) => {
      console.log('📨 [PRIVATE CHANNEL] Received new-message:', data);
      if (data.sender !== userName) {
        const incomingMsg: Message = {
          id: Date.now(),
          sender: data.sender,
          text: data.content,
          isUserMessage: false,
          timestamp: new Date(data.timestamp),
        };

        const senderUser = allUsersRef.current.find(u => u.name === data.sender);
        const userId = senderUser ? senderUser.id : Date.now();

        console.log('📝 Adding message to conversation for userId:', userId);
        setConversations(prev => ({
          ...prev,
          [userId]: [...(prev[userId] || []), incomingMsg],
        }));
      } else {
        console.log('📨 Ignoring own message from:', data.sender);
      }
    });

    return () => {
      console.log('🔌 Unsubscribing from private channel:', `private-session-${activeSessionId}`);
      sessionChannel.unbind_all();
      pusher.unsubscribe(`private-session-${activeSessionId}`);
    };
  }, [activeSessionId, userName]); // Removed allUsers from dependencies

  // Helper: Update user list from presence members
  const updateUserListFromPresence = (members: any) => {
    console.log('Updating user list from presence. Total members:', members.count);
    const realUsers: User[] = [];
    members.each((member: PresenceMember) => {
      console.log('Processing member:', member.id, member.info.name);
      if (member.info.name !== userName) {
        realUsers.push({
          id: member.id,
          name: member.info.name,
          avatar: getAvatarForUser(member.info.name),
          status: 'online',
          isReal: true,
        });
      }
    });
    console.log('Real users found:', realUsers.length);
    setAllUsers([...mockUsers, ...realUsers]);
  };

  const addPresenceUser = (member: PresenceMember) => {
    console.log('Adding presence user:', member.info.name);
    setAllUsers(prev => {
      const exists = prev.some(u => u.name === member.info.name);
      if (exists) {
        console.log('User already exists, skipping');
        return prev;
      }
      const newUser: User = {
        id: member.id,
        name: member.info.name,
        avatar: getAvatarForUser(member.info.name),
        status: 'online' as const,
        isReal: true,
      };
      console.log('Added new user to list');
      return [...prev, newUser];
    });
  };

  const removePresenceUser = (member: PresenceMember) => {
    console.log('Removing presence user:', member.info.name);
    setAllUsers(prev => prev.filter(u => u.name !== member.info.name));
  };

  // Desktop notification helper
  const showDesktopNotification = (invite: Invite) => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        const n = new Notification(`${invite.fromUser} 邀请你开始对话`, {
          body: '点击以切回页面并处理邀请',
          requireInteraction: true,
        } as any);
        n.onclick = () => {
          try { window.focus(); } catch (e) {}
          setActiveInvite(invite);
          setPendingInvites(prev => prev.filter(i => i.sessionId !== invite.sessionId));
        };
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') showDesktopNotification(invite);
        });
      }
    } catch (err) {
      console.warn('Notification failed', err);
    }
  };

  // Accept an invite (called from modal UI)
  const acceptInvite = (invite: Invite | null) => {
    if (!invite) return;
    const sharedSession = invite.sessionId;
    console.log('✅ [ACCEPT] Setting activeSessionId to:', sharedSession);
    setActiveSessionId(sharedSession);
    console.log('✅ Chat accepted (via modal), sessionId:', sharedSession);
    try {
      presenceChannelRef.current?.trigger('client-chat-accepted', {
        fromUser: userName,
        targetUser: invite.fromUser,
        sessionId: sharedSession,
      });
      console.log('✅ Acceptance notification sent');
    } catch (error) {
      console.error('❌ Failed to send acceptance:', error);
    }
    const targetUser = allUsersRef.current.find(u => u.name === invite.fromUser);
    if (targetUser) setSelectedUser(targetUser);
    setActiveInvite(null);
    setPendingInvites(prev => prev.filter(i => i.sessionId !== invite.sessionId));
  };

  // Reject an invite
  const rejectInvite = (invite: Invite | null) => {
    if (!invite) return;
    console.log('❌ Invite rejected from:', invite.fromUser);
    // Optionally notify sender about rejection with a client event
    try {
      presenceChannelRef.current?.trigger('client-chat-rejected', {
        fromUser: userName,
        targetUser: invite.fromUser,
        sessionId: invite.sessionId,
      });
    } catch (err) {
      console.warn('Failed to send rejection', err);
    }
    setActiveInvite(null);
    setPendingInvites(prev => prev.filter(i => i.sessionId !== invite.sessionId));
  };

  // When the page becomes visible, process pending invites (open the most recent)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && pendingInvites.length > 0 && !activeInvite) {
        const next = pendingInvites[0];
        setActiveInvite(next);
        setPendingInvites(prev => prev.slice(1));
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pendingInvites, activeInvite]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedUser]);

  // Auto-create AI opponents once after login - display BOTH characters (Qwen and DeepSeek)
  const createAIOpponent = async () => {
    if (selectedUser) return;
    try {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: newSessionId }),
      });

      if (!res.ok) throw new Error('Failed to fetch match');

      const data = await res.json();
      const { matchedOpponent, allCharacters } = data;
      if (!matchedOpponent) throw new Error('No matchedOpponent');

      console.log('[Frontend] Raw response:', { 
        hasMatchedOpponent: !!matchedOpponent,
        hasAllCharacters: !!allCharacters,
        allCharactersIsArray: Array.isArray(allCharacters),
        allCharactersLength: allCharacters?.length,
      });

      console.log('[Frontend] Received characters:', { 
        matched: matchedOpponent.name,
        total: allCharacters?.length || 0,
        names: allCharacters?.map((c: any) => c.name) || []
      });

      console.log('[Frontend] Model IDs:', {
        matched: matchedOpponent.modelId,
        all: allCharacters?.map((c: any) => c.modelId) || []
      });

      // Create User objects for ALL characters (one per model in DEFAULT_MODELS)
      const aiUsers: User[] = [];
      console.log('[Lobby] Before creating AI users, allCharacters length:', allCharacters?.length);

      if (allCharacters && Array.isArray(allCharacters)) {
        console.log('[Lobby] Processing', allCharacters.length, 'characters');
        
        allCharacters.forEach((character: any, index: number) => {
          console.log(`[Lobby] Processing character ${index + 1}:`, {
            name: character.name,
            modelId: character.modelId,
          });

          const aiUser: User = {
            id: character.id,
            name: character.name,
            avatar: character.avatar || getAvatarForUser(character.name || 'AI'),
            status: 'online',
            isReal: false,
            profile: character.profile,
            systemPrompt: character.systemPrompt,
          };
          aiUsers.push(aiUser);

          // Initialize conversation with starter message
          const assistantMsg: Message = {
            id: Date.now() + aiUsers.length,
            sender: aiUser.name,
            text: character.starterMessage || 'Hi there!',
            isUserMessage: false,
            timestamp: new Date(),
          };

          setConversations(prev => ({
            ...prev,
            [aiUser.id]: [assistantMsg],
          }));
        });
      }

      // Add all AI users to the lobby
      console.log('[Lobby] Before adding users, current allUsers:', allUsers.length);
      setAllUsers(prev => {
        const updated = [...prev, ...aiUsers];
        console.log('[Lobby] After adding users, new allUsers:', updated.length, updated.map(u => u.name));
        return updated;
      });

      // Select the matchedOpponent (already chosen by server)
      const selectedUser = aiUsers.find(u => u.id === matchedOpponent.id) || aiUsers[0];
      setSelectedUser(selectedUser);
      setActiveSessionId(newSessionId);

      console.log(`[Lobby] Added ${aiUsers.length} AI characters to lobby:`, aiUsers.map(u => `${u.name} (${u.profile?.modelId || 'unknown'})`));
    } catch (err) {
      console.error('createAIOpponent failed:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !selectedUser) {
      createAIOpponent();
    }
    // only run when login status changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Handle user selection
  const handleUserClick = (user: User) => {
    console.log('User clicked:', user.name, 'isReal:', user.isReal);
    // Prevent opening a new chat while another chat is active
    if (selectedUser && selectedUser.id !== user.id) {
      alert('Please close the current chat before opening another.');
      return;
    }

    if (user.isReal) {
      // Real human user - send chat request
      const sharedSessionId = `match_${userName}_${user.name}_${Date.now()}`;
      console.log('Sending chat request to:', user.name, 'with sessionId:', sharedSessionId);
      
      if (presenceChannelRef.current) {
        try {
          presenceChannelRef.current.trigger('client-chat-request', {
            fromUser: userName,
            targetUser: user.name,
            sessionId: sharedSessionId,
          });
          console.log('✅ Chat request sent successfully');
          alert(`Chat request sent to ${user.name}. Waiting for response...`);
        } catch (error) {
          console.error('❌ Failed to send chat request:', error);
          alert(`Failed to send chat request: ${error}\n\nMake sure "Enable client events" is checked in your Pusher Dashboard > App Settings.`);
        }
      } else {
        console.error('❌ Presence channel not available');
        alert('Presence channel not ready. Please refresh the page.');
      }
    } else {
      // AI user - request a generated opponent from the server and replace the fixed mock
      (async () => {
        try {
          const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
          const res = await fetch('/api/match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: newSessionId }),
          });

          if (!res.ok) throw new Error('Failed to fetch match');

          const data = await res.json();
          const { matchedOpponent, starterMessage } = data;

          if (!matchedOpponent) throw new Error('No matchedOpponent returned');

          const aiUser: User = {
            id: matchedOpponent.id,
            name: matchedOpponent.name,
            avatar: matchedOpponent.avatar || getAvatarForUser(matchedOpponent.name || 'AI'),
            status: 'online',
            isReal: false,
            profile: matchedOpponent.profile,
            systemPrompt: matchedOpponent.systemPrompt,
          };

          // Replace existing mock Cute entry if present, otherwise append
          setAllUsers(prev => {
            const found = prev.findIndex(u => u.id === '6' || u.name === 'Cute');
            if (found !== -1) {
              const copy = [...prev];
              copy[found] = aiUser;
              return copy;
            }
            // Append if not found
            return [...prev, aiUser];
          });

          // Seed conversation with starter message
          const assistantMsg: Message = {
            id: Date.now(),
            sender: aiUser.name,
            text: starterMessage || '',
            isUserMessage: false,
            timestamp: new Date(),
          };

          setConversations(prev => ({
            ...prev,
            [aiUser.id]: [...(prev[aiUser.id] || []), assistantMsg],
          }));

          setSelectedUser(aiUser);
          setActiveSessionId(newSessionId);
        } catch (err) {
          console.error('Failed to get AI match:', err);
          // fallback: select the static user
          setSelectedUser(user);
        }
      })();
    }
  };

  // Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || !selectedUser || isTyping) return;

    const userText = inputText;
    const currentUserId = selectedUser.id;
    const personaId = selectedUser.name.toLowerCase() === 'cute' ? 'cute' : 'default';
    const clientSystemPrompt = (selectedUser as any)?.systemPrompt;
    const isAIChat = !!clientSystemPrompt || selectedUser.isReal === false;

    const newMessage: Message = {
      id: Date.now(),
      sender: userName,
      text: userText,
      isUserMessage: true,
      timestamp: new Date(),
    };

    setConversations(prev => ({
      ...prev,
      [currentUserId]: [...(prev[currentUserId] || []), newMessage],
    }));

    setInputText('');
    setIsTyping(true);

    // Case 1: AI Chat (generated persona or legacy Cute)
    if (isAIChat) {
      try {
        // Extract modelId from character profile (full model ID string)
        const modelId = (selectedUser as any)?.profile?.modelId || 'Qwen/Qwen2.5-7B-Instruct';
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: (conversations[currentUserId] || []).concat(newMessage).map(m => ({
              role: m.isUserMessage ? 'user' : 'assistant',
              content: m.text,
            })),
            sessionId: activeSessionId || `ai_${userName}_${Date.now()}`,
            personaId,
            systemPrompt: clientSystemPrompt,
            opponentInfo: (selectedUser as any)?.profile || null,
            modelId: modelId, // Pass full model ID for routing
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const aiMessageId = Date.now() + 1;
        const aiMessage: Message = {
          id: aiMessageId,
          sender: selectedUser.name,
          text: '',
          isUserMessage: false,
          timestamp: new Date(),
        };

        setConversations(prev => ({
          ...prev,
          [currentUserId]: [...(prev[currentUserId] || []), aiMessage],
        }));

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            setConversations(prev => {
              const userMsgs = [...(prev[currentUserId] || [])];
              const msgIndex = userMsgs.findIndex(m => m.id === aiMessageId);
              if (msgIndex !== -1) {
                userMsgs[msgIndex] = { ...userMsgs[msgIndex], text: fullText };
              }
              return { ...prev, [currentUserId]: userMsgs };
            });
          }
        }
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage: Message = {
          id: Date.now() + 2,
          sender: 'System',
          text: 'Sorry, I encountered an error. Please try again.',
          isUserMessage: false,
          timestamp: new Date(),
        };
        setConversations(prev => ({
          ...prev,
          [currentUserId]: [...(prev[currentUserId] || []), errorMessage],
        }));
      } finally {
        setIsTyping(false);
      }
    } 
    // Case 2: Human-Human Chat (Real users)
    else {
      console.log('💬 Sending human message to session:', activeSessionId, 'content:', userText);
      try {
        const response = await fetch('/api/talk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSessionId || `temp_${Date.now()}`,
            sender: userName,
            content: userText,
            role: 'user',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ /api/talk failed:', response.status, errorText);
          throw new Error(`Failed to send human message: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ /api/talk success:', result);
      } catch (error) {
        console.error('❌ Human talk error:', error);
      } finally {
        setIsTyping(false);
      }
    }
  };

  // Get current conversation
  const currentMessages = selectedUser ? conversations[selectedUser.id] || [] : [];

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎭</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Turing Test Game</h1>
            <p className="text-gray-600">Enter your name to join the lobby</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).elements.namedItem('username') as HTMLInputElement;
            handleLogin(input.value);
          }}>
            <input
              type="text"
              name="username"
              placeholder="Your Name"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              autoFocus
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Join Lobby
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-4 text-center">
            No authentication required • Symbolic login for testing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ========== Invite Modal (replaces confirm) ========= */}
      {activeInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">{getAvatarForUser(activeInvite.fromUser)}</div>
              <div>
                <div className="text-lg font-semibold">{activeInvite.fromUser}</div>
                <div className="text-sm text-gray-500">wants to start a Turing Test with you</div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { rejectInvite(activeInvite); }} className="px-4 py-2 rounded-xl bg-gray-100">Decline</button>
              <button onClick={() => { acceptInvite(activeInvite); }} className="px-4 py-2 rounded-xl bg-blue-600 text-white">Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Left Side: Chat Container (60-70%) ========== */}
      <div className="chat-container flex-[2] bg-gray-100 border-r border-gray-300 flex flex-col">
        {/* User List Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-md">
          <h2 className="text-xl font-bold">💬 Chat Lobby</h2>
          <p className="text-sm text-blue-100">Select a user to start chatting</p>
        </div>

        {/* User List */}
        <div className="flex-none overflow-y-auto border-b border-gray-300 bg-white">
          {allUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-200 ${
                selectedUser?.id === user.id ? 'bg-blue-100' : ''
              }`}
            >
              <div className="text-3xl">{user.avatar}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">
                  {user.name}
                  {user.isReal && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Human</span>}
                  {!user.isReal && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI</span>}
                </div>
                {/* Display model vendor: displayName + modelId (if available) */}
                <div className="mt-1">
                  {(() => {
                    const modelId = (user as any)?.profile?.modelId;
                    const display = (user as any)?.profile?.modelDisplayName || modelId;
                    if (!modelId) {
                      return ((user as any)?.profile?.shortTags || []).slice(0,4).map((t: string, i: number) => (
                        <span key={i} className="mr-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{t}</span>
                      ));
                    }
                    return (
                      <>
                        <span className="mr-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{display}</span>
                        <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">{modelId}</span>
                      </>
                    );
                  })()}

                  {((user as any)?.profile?.shortTags || []).slice(0,4).map((t: string, i: number) => (
                    <span key={i} className="mr-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {user.status}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedUser ? (
            // Placeholder when no user selected
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg font-medium">Select a user to start chatting</p>
                <p className="text-sm mt-2">Choose someone from the list above</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{selectedUser.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-800">{selectedUser.name}</div>
                    {/* Selected user shortTags */}
                    <div className="mt-1">
                      {/* Vendor tag for AI personas (display name + model id) */}
                      {(() => {
                        const modelId = (selectedUser as any)?.profile?.modelId;
                        const display = (selectedUser as any)?.profile?.modelDisplayName || modelId;
                        if (!modelId) return null;
                        return (
                          <>
                            <span className="mr-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{display}</span>
                            <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">{modelId}</span>
                          </>
                        );
                      })()}

                      {((selectedUser as any)?.profile?.shortTags || []).slice(0,4).map((t: string, i: number) => (
                        <span key={i} className="mr-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <span className={`w-2 h-2 rounded-full ${selectedUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {selectedUser.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {currentMessages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUserMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                          message.isUserMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1">{message.sender}</div>
                        <div className="whitespace-pre-wrap break-words">{message.text}</div>
                        <div className="text-xs opacity-60 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-500 border border-gray-200 rounded-2xl px-4 py-2 shadow-sm italic text-sm">
                      {selectedUser.name} is typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========== Right Side: Profile Container (30-40%) ========== */}
      <div className="profile-container flex-1 bg-white flex flex-col">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-md flex items-center justify-between">
          <h2 className="text-xl font-bold">👤 My Profile</h2>
          <div className="flex items-center gap-3">
            {pendingInvites.length > 0 && (
              <button onClick={() => { const next = pendingInvites[0]; setActiveInvite(next); setPendingInvites(prev => prev.slice(1)); }} className="bg-white text-pink-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                {pendingInvites.length} Pending
              </button>
            )}
            <button className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">Settings</button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-5xl shadow-lg">
                {userProfile?.avatar || '👤'}
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  {userProfile?.name || 'N/A'}
                </h3>
                <p className="text-sm text-gray-500">{userProfile?.email || 'Logged in as ' + userName}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Bio</label>
                  <p className="text-gray-700 mt-1">
                    {userProfile?.bio || 'No bio available'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Member Since</label>
                  <p className="text-gray-700 mt-1">
                    {userProfile?.joinDate || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">127</div>
                    <div className="text-xs text-gray-500">Messages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{allUsers.length}</div>
                    <div className="text-xs text-gray-500">Contacts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">42</div>
                    <div className="text-xs text-gray-500">Chats</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all">
                  Edit Profile
                </button>
                <button className="w-full bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                  Settings
                </button>
              </div>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📌 How It Works</h4>
            <p className="text-sm text-blue-800">
              • Chat with <strong>Cute</strong> (AI) to test the AI persona.<br/>
              • Real users appear with a <span className="text-green-700 font-semibold">Human</span> badge.<br/>
              • Click a human user to send a chat request.
            </p>
          </div>

          {/* Debug Info */}
          <div className="mt-4 bg-gray-50 border border-gray-300 rounded-xl p-3">
            <h4 className="font-semibold text-gray-700 text-xs mb-1">🔍 Debug Info</h4>
            <p className="text-xs text-gray-600">
              Logged in as: <strong>{userName}</strong><br/>
              Total users: {allUsers.length}<br/>
              Session: {activeSessionId || 'None'}<br/>
              Open browser console (F12) for detailed logs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
