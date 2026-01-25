'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LEVELS, type LevelData } from './data/levels';

type User = {
  name?: string;
  avatar?: string;
  bio?: string;
};

export default function ChallengePage() {
  const [user, setUser] = useState<User>({ name: 'Guest', avatar: '👤', bio: 'Challenge Solver' });
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('turing_user') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser({
          name: parsed.name || 'Guest',
          avatar: parsed.avatar || '👤',
          bio: parsed.bio || 'Challenge Solver',
        });
      }
      
      // Load completed levels from localStorage
      const completedRaw = typeof window !== 'undefined' ? localStorage.getItem('completed_levels') : null;
      if (completedRaw) {
        setCompletedLevels(JSON.parse(completedRaw));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-400 to-blue-500">
      {/* Left Section: Levels */}
      <div className="flex-[2] p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-white mb-2">🧩 Algorithm Challenges</h1>
          <p className="text-white/90 text-lg">
            Test your skills with classic graph algorithms. Select a level to begin.
          </p>
        </div>

        <div className="space-y-4">
          {LEVELS.map((level) => {
            const isCompleted = completedLevels.includes(level.id);
            return (
              <Link
                key={level.id}
                href={`/challenge/${level.id}`}
                className={`block rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all hover:scale-105 ${
                  isCompleted ? 'bg-green-50 border-2 border-green-500' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">{level.title}</h3>
                    {isCompleted && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                        ✓ COMPLETED
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(level.difficulty)}`}>
                    {level.difficulty.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{level.description}</p>
                <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm">
                  {isCompleted ? 'Play Again →' : 'Start Challenge →'}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <Link href="/" className="inline-block text-white/80 hover:text-white underline turingchat-back-to-homepage">
          Back to Homepage
          </Link>
        </div>
      </div>

      {/* Right Section: User Info */}
      <aside className="w-80 bg-white/10 p-6 backdrop-blur rounded-l-2xl flex flex-col items-center justify-center">
        <div className="text-7xl mb-4">{user.avatar}</div>
        <div className="text-white font-semibold text-lg mb-1">{user.name}</div>
        <div className="text-white/80 text-sm text-center max-w-[12rem] mb-6">{user.bio}</div>

        <div className="bg-white/20 rounded-lg p-4 w-full">
          <h4 className="text-white font-semibold mb-2 text-sm">Progress</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-white/90 text-xs">
              <span>Completed</span>
              <span className="font-bold">{completedLevels.length} / {LEVELS.length}</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(completedLevels.length / LEVELS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
