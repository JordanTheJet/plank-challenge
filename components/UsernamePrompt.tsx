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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-purple-100 rounded-full mb-3">
            <svg
              className="w-10 h-10 text-purple-600"
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Choose Your Username
          </h2>
          <p className="text-gray-600">
            This will be displayed when you share your progress
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Enter username"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-lg"
              autoFocus
              maxLength={20}
            />
            {error && (
              <div className="mt-2 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="mt-2 text-sm text-gray-500">
              3-20 characters, letters, numbers, dashes, and underscores only
            </div>
          </div>

          <button
            type="submit"
            disabled={username.length < 3}
            className="w-full py-3 bg-purple-600 text-white text-lg font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
          >
            Continue
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          You can change this later in settings
        </div>
      </div>
    </div>
  );
}
