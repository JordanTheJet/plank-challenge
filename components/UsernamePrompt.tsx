'use client';

import { useState, useEffect } from 'react';
import { getUsername, saveUsername } from '@/utils/localLeaderboard';

interface UsernamePromptProps {
  onComplete: () => void;
}

export default function UsernamePrompt({ onComplete }: UsernamePromptProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if username already exists
    const existing = getUsername();
    if (!existing) {
      setShow(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate username
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, dashes, and underscores');
      return;
    }

    // Save username
    saveUsername(username);
    setShow(false);
    onComplete();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card max-w-md w-full p-8 animate-scale-in">
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--neon-cyan)]/20 neon-border mb-4">
            <svg
              className="w-10 h-10 text-[var(--neon-cyan)]"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="font-display text-3xl tracking-wider text-white mb-2">
            CREATE USERNAME
          </h2>
          <p className="text-[var(--text-secondary)]">
            This will be displayed when you share your progress
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Enter username"
              className="w-full px-4 py-4 bg-[var(--bg-card)] border-2 border-white/10 rounded-xl focus:outline-none focus:border-[var(--neon-cyan)] text-lg text-white placeholder-[var(--text-muted)] transition-colors"
              autoFocus
              maxLength={20}
            />
            {error && (
              <div className="mt-2 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="mt-2 text-sm text-[var(--text-muted)]">
              3-20 characters, letters, numbers, dashes, and underscores only
            </div>
          </div>

          <button
            type="submit"
            disabled={username.length < 3}
            className="btn-neon w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
          >
            CONTINUE
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[var(--text-muted)]">
          You can change this later in settings
        </div>
      </div>
    </div>
  );
}
