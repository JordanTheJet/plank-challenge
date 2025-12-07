'use client';

import { useEffect, useState } from 'react';
import { calculateStats, type UserStats } from '@/utils/localLeaderboard';
import { formatDuration, getDayNumber } from '@/utils/timerLogic';
import Link from 'next/link';

export default function LocalLeaderboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const currentDay = getDayNumber();

  useEffect(() => {
    const userStats = calculateStats();
    setStats(userStats);
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen-safe bg-[var(--bg-primary)] bg-grid-pattern flex items-center justify-center">
        <div className="spinner-neon" />
      </div>
    );
  }

  // Generate 30-day grid
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const completedDaySet = new Set(
    stats.completions.filter(c => c.success).map(c => c.day)
  );

  return (
    <div className="min-h-screen-safe bg-[var(--bg-primary)] bg-grid-pattern relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 safe-area-padding">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up stagger-1">
          <h1 className="font-display text-5xl md:text-7xl tracking-wider text-gradient-neon mb-2">
            MY PROGRESS
          </h1>
          <p className="font-display text-xl tracking-widest text-[var(--text-secondary)]">
            30-DAY PLANK CHALLENGE
          </p>
        </div>

        {/* Back button */}
        <div className="mb-8 animate-fade-in-up stagger-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--neon-cyan)] hover:text-white transition-colors font-semibold"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            BACK TO TIMER
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up stagger-2">
          {/* Days Completed */}
          <div className="stat-card">
            <div className="text-[var(--text-muted)] text-xs tracking-widest uppercase mb-2">
              DAYS DONE
            </div>
            <div className="stat-value neon-text-cyan">{stats.daysCompleted}</div>
            <div className="text-[var(--text-muted)] text-xs mt-1">of 30</div>
          </div>

          {/* Current Streak */}
          <div className="stat-card">
            <div className="text-[var(--text-muted)] text-xs tracking-widest uppercase mb-2">
              STREAK
            </div>
            <div className="stat-value neon-text-orange flex items-center gap-2">
              {stats.currentStreak}
              {stats.currentStreak >= 7 && (
                <span className="text-2xl flame-icon">🔥</span>
              )}
            </div>
            <div className="text-[var(--text-muted)] text-xs mt-1">days</div>
          </div>

          {/* Longest Streak */}
          <div className="stat-card">
            <div className="text-[var(--text-muted)] text-xs tracking-widest uppercase mb-2">
              BEST STREAK
            </div>
            <div className="stat-value neon-text-pink">{stats.longestStreak}</div>
            <div className="text-[var(--text-muted)] text-xs mt-1">days</div>
          </div>

          {/* Total Time */}
          <div className="stat-card">
            <div className="text-[var(--text-muted)] text-xs tracking-widest uppercase mb-2">
              TOTAL TIME
            </div>
            <div className="stat-value neon-text-lime font-mono text-2xl">
              {formatDuration(stats.totalSeconds)}
            </div>
            <div className="text-[var(--text-muted)] text-xs mt-1">held</div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`
          glass-card p-6 mb-8 animate-fade-in-up stagger-3
          ${stats.stillInRunning ? 'neon-border-lime' : 'neon-border-pink'}
        `}>
          <div className="flex items-center justify-center gap-4">
            {stats.stillInRunning ? (
              <>
                <div className="text-4xl animate-pulse">⚡</div>
                <div className="text-center">
                  <div className="font-display text-2xl md:text-3xl tracking-wider neon-text-lime">
                    STILL IN THE RUNNING!
                  </div>
                  <div className="text-[var(--text-secondary)] mt-1">
                    You haven't missed a single day. Keep crushing it!
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl">💪</div>
                <div className="text-center">
                  <div className="font-display text-2xl md:text-3xl tracking-wider neon-text-pink">
                    KEEP PUSHING!
                  </div>
                  <div className="text-[var(--text-secondary)] mt-1">
                    {stats.missedDays.length > 0 && (
                      <>Missed day(s): {stats.missedDays.slice(0, 3).join(', ')}
                      {stats.missedDays.length > 3 && ` +${stats.missedDays.length - 3} more`}</>
                    )}
                  </div>
                  <div className="text-[var(--text-muted)] text-sm mt-2">
                    Your progress is still being tracked. Don't give up!
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 30-Day Grid */}
        <div className="glass-card p-6 mb-8 animate-fade-in-up stagger-4">
          <h2 className="font-display text-2xl tracking-wider text-white mb-6">
            30-DAY GRID
          </h2>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {days.map(day => {
              const isCompleted = completedDaySet.has(day);
              const isMissed = stats.missedDays.includes(day);
              const isCurrent = day === currentDay;

              let cellClass = 'day-cell ';
              if (isCompleted) {
                cellClass += 'day-cell-completed';
              } else if (isMissed) {
                cellClass += 'day-cell-missed';
              } else if (isCurrent) {
                cellClass += 'day-cell-current';
              } else {
                cellClass += 'day-cell-upcoming';
              }

              return (
                <div
                  key={day}
                  className={cellClass}
                  title={
                    isCompleted
                      ? `Day ${day}: Completed ✓`
                      : isMissed
                      ? `Day ${day}: Missed ✗`
                      : isCurrent
                      ? `Day ${day}: Today`
                      : `Day ${day}: Upcoming`
                  }
                >
                  {isCompleted ? '✓' : isMissed ? '✗' : day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded day-cell-completed" />
              <span className="text-[var(--text-secondary)]">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded day-cell-missed" />
              <span className="text-[var(--text-secondary)]">Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded day-cell-current" />
              <span className="text-[var(--text-secondary)]">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded day-cell-upcoming" />
              <span className="text-[var(--text-secondary)]">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Recent Completions */}
        {stats.completions.length > 0 && (
          <div className="glass-card p-6 animate-fade-in-up stagger-5">
            <h2 className="font-display text-2xl tracking-wider text-white mb-6">
              RECENT SESSIONS
            </h2>

            <div className="space-y-3">
              {stats.completions
                .slice()
                .reverse()
                .slice(0, 10)
                .map((completion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-white/5 hover:border-[var(--neon-cyan)]/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-display text-lg
                        ${completion.success
                          ? 'bg-[var(--neon-lime)]/20 text-[var(--neon-lime)]'
                          : 'bg-red-500/20 text-red-400'
                        }
                      `}>
                        {completion.success ? '✓' : '✗'}
                      </div>
                      <div>
                        <div className="font-display text-lg tracking-wider text-white">
                          DAY {completion.day}
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">
                          {completion.date}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-lg text-white">
                        {formatDuration(completion.duration)}
                      </div>
                      <div className="text-sm text-[var(--text-muted)]">
                        Target: {formatDuration(completion.targetDuration)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {stats.completions.length > 10 && (
              <div className="mt-4 text-center text-sm text-[var(--text-muted)]">
                Showing 10 most recent sessions
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {stats.completions.length === 0 && (
          <div className="glass-card p-12 text-center animate-fade-in-up stagger-4">
            <div className="text-6xl mb-4">💪</div>
            <h3 className="font-display text-3xl tracking-wider text-white mb-2">
              NO SESSIONS YET
            </h3>
            <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto">
              Complete your first plank session and share it to start tracking your progress!
            </p>
            <Link href="/" className="btn-neon">
              START TRAINING
            </Link>
          </div>
        )}

        {/* Back to Timer CTA */}
        <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <Link href="/" className="btn-neon inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            GO TRAIN
          </Link>
        </div>
      </div>
    </div>
  );
}
