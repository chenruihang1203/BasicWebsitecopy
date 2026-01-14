'use client';

import { useState, useRef, useEffect } from 'react';

// ========== TypeScript Interfaces ==========
interface User {
  id: number;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
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

// ========== Mock Data ==========
const mockUsers: User[] = [
  { id: 1, name: 'Alice Chen', avatar: '👩‍💻', status: 'online' },
  { id: 2, name: 'Bob Smith', avatar: '👨‍🎨', status: 'online' },
  { id: 3, name: 'Charlie Lee', avatar: '🧑‍🔬', status: 'offline' },
  { id: 4, name: 'Diana Park', avatar: '👩‍🏫', status: 'online' },
  { id: 5, name: 'Ethan Wang', avatar: '👨‍💼', status: 'offline' },
];

const mockUserProfile: UserProfile = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  bio: 'Full-stack developer passionate about building great user experiences.',
  joinDate: 'January 2024',
  avatar: '👤',
};

// Initial mock conversations for each user
const initialMockMessages: Record<number, Message[]> = {
  1: [
    { id: 1, sender: 'Alice Chen', text: 'Hey! How are you?', isUserMessage: false, timestamp: new Date(Date.now() - 3600000) },
    { id: 2, sender: 'You', text: 'Hi Alice! I\'m doing great!', isUserMessage: true, timestamp: new Date(Date.now() - 3500000) },
  ],
  2: [
    { id: 1, sender: 'Bob Smith', text: 'Have you seen the new design?', isUserMessage: false, timestamp: new Date(Date.now() - 7200000) },
  ],
  3: [],
  4: [
    { id: 1, sender: 'Diana Park', text: 'Can we schedule a meeting tomorrow?', isUserMessage: false, timestamp: new Date(Date.now() - 86400000) },
  ],
  5: [],
};

export default function Home() {
  // State management
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Record<number, Message[]>>(initialMockMessages);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedUser]);

  // Handle user selection
  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  // Handle sending message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim() || !selectedUser) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: 'You',
      text: inputText,
      isUserMessage: true,
      timestamp: new Date(),
    };

    setConversations(prev => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), newMessage],
    }));

    setInputText('');

    // Simulate a response after 1 second
    setTimeout(() => {
      const responseMessage: Message = {
        id: Date.now() + 1,
        sender: selectedUser.name,
        text: `Thanks for your message! (This is a simulated response from ${selectedUser.name})`,
        isUserMessage: false,
        timestamp: new Date(),
      };

      setConversations(prev => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), responseMessage],
      }));
    }, 1000);
  };

  // Get current conversation
  const currentMessages = selectedUser ? conversations[selectedUser.id] || [] : [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ========== Left Side: Chat Container (60-70%) ========== */}
      <div className="chat-container flex-[2] bg-gray-100 border-r border-gray-300 flex flex-col">
        {/* User List Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-md">
          <h2 className="text-xl font-bold">💬 Chat Matching</h2>
          <p className="text-sm text-blue-100">Select a user to start chatting</p>
        </div>

        {/* User List */}
        <div className="flex-none overflow-y-auto border-b border-gray-300 bg-white">
          {mockUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-200 ${
                selectedUser?.id === user.id ? 'bg-blue-100' : ''
              }`}
            >
              <div className="text-3xl">{user.avatar}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800">{user.name}</div>
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
                    <div className="text-xs text-gray-500 flex items-center gap-1">
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
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-md">
          <h2 className="text-xl font-bold">👤 My Profile</h2>
        </div>

        {/* Profile Card */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-5xl shadow-lg">
                {mockUserProfile?.avatar || '👤'}
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  {mockUserProfile?.name || 'N/A'}
                </h3>
                <p className="text-sm text-gray-500">{mockUserProfile?.email || 'N/A'}</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Bio</label>
                  <p className="text-gray-700 mt-1">
                    {mockUserProfile?.bio || 'No bio available'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Member Since</label>
                  <p className="text-gray-700 mt-1">
                    {mockUserProfile?.joinDate || 'N/A'}
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
                    <div className="text-2xl font-bold text-purple-600">{mockUsers.length}</div>
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
            <h4 className="font-semibold text-blue-900 mb-2">📌 Note</h4>
            <p className="text-sm text-blue-800">
              This is a prototype interface using mock data. No backend APIs are connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
