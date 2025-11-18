'use client';

import { useEffect, useState } from 'react';
import { calculateStats, type UserStats } from '@/utils/localLeaderboard';
import { formatDuration } from '@/utils/timerLogic';
import Link from 'next/link';

export default function LocalLeaderboard() {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const userStats = calculateStats();
    setStats(userStats);
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Generate 30-day grid
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const completedDaySet = new Set(
    stats.completions.filter(c => c.success).map(c => c.day)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            My Progress
          </h1>
          <p className="text-xl text-gray-600">
            30-Day Plank Challenge
          </p>
        </div>

        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold"
          >
            <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Back to Timer
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Days Completed */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">Days Completed</div>
            <div className="text-4xl font-bold text-purple-600">{stats.daysCompleted}</div>
            <div className="text-gray-500 text-xs mt-1">out of 30</div>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">Current Streak</div>
            <div className="text-4xl font-bold text-orange-600 flex items-center">
              {stats.currentStreak}
              {stats.currentStreak >= 7 && (
                <span className="ml-2 text-2xl">🔥</span>
              )}
            </div>
            <div className="text-gray-500 text-xs mt-1">days in a row</div>
          </div>

          {/* Longest Streak */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">Longest Streak</div>
            <div className="text-4xl font-bold text-blue-600">{stats.longestStreak}</div>
            <div className="text-gray-500 text-xs mt-1">days</div>
          </div>

          {/* Total Time */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-gray-600 text-sm mb-1">Total Time</div>
            <div className="text-3xl font-bold text-green-600 font-mono">
              {formatDuration(stats.totalSeconds)}
            </div>
            <div className="text-gray-500 text-xs mt-1">held</div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-xl shadow-lg p-6 mb-8 ${
          stats.stillInRunning
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300'
            : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300'
        }`}>
          <div className="flex items-center justify-center">
            {stats.stillInRunning ? (
              <>
                <div className="text-4xl mr-4">✨</div>
                <div>
                  <div className="text-2xl font-bold text-green-800">Still In The Running!</div>
                  <div className="text-green-700 mt-1">You haven't missed a single day. Keep it up!</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mr-4">⚠️</div>
                <div>
                  <div className="text-2xl font-bold text-orange-800">Missed Days Detected</div>
                  <div className="text-orange-700 mt-1">
                    {stats.missedDays.length > 0 && (
                      <>Missed day(s): {stats.missedDays.slice(0, 3).join(', ')}
                      {stats.missedDays.length > 3 && ` and ${stats.missedDays.length - 3} more`}</>
                    )}
                  </div>
                  <div className="text-orange-600 text-sm mt-2">
                    Keep training! Your progress is still being tracked.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 30-Day Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">30-Day Progress Grid</h2>

          <div className="grid grid-cols-10 gap-2">
            {days.map(day => {
              const isCompleted = completedDaySet.has(day);
              const isMissed = stats.missedDays.includes(day);

              return (
                <div
                  key={day}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm font-semibold
                    transition-all hover:scale-110
                    ${isCompleted
                      ? 'bg-green-500 text-white shadow-md'
                      : isMissed
                      ? 'bg-red-200 text-red-700 border-2 border-red-400'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    }
                  `}
                  title={
                    isCompleted
                      ? `Day ${day}: Completed ✓`
                      : isMissed
                      ? `Day ${day}: Missed ✗`
                      : `Day ${day}: Not yet`
                  }
                >
                  {isCompleted ? '✓' : isMissed ? '✗' : day}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-500 mr-2"></div>
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-red-200 border-2 border-red-400 mr-2"></div>
              <span className="text-gray-600">Missed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-200 mr-2"></div>
              <span className="text-gray-600">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Recent Completions */}
        {stats.completions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Completions</h2>

            <div className="space-y-2">
              {stats.completions
                .slice()
                .reverse()
                .slice(0, 10)
                .map((completion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        completion.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {completion.success ? '✓' : '✗'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Day {completion.day}</div>
                        <div className="text-sm text-gray-500">{completion.date}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-semibold text-gray-800">
                        {formatDuration(completion.duration)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Target: {formatDuration(completion.targetDuration)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {stats.completions.length > 10 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing 10 most recent completions
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {stats.completions.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏋️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Completions Yet</h3>
            <p className="text-gray-600 mb-6">
              Complete your first plank session and share it to start tracking your progress!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Training
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
