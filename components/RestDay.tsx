'use client';

import { format } from 'date-fns';
import { getNextChallenge } from '@/utils/timerLogic';
import Link from 'next/link';

const RECOVERY_TIPS = [
  "Stretch your hip flexors and shoulders",
  "Stay hydrated throughout the day",
  "Get quality sleep for muscle recovery",
  "Light walking can help reduce soreness",
  "Foam rolling helps release tension",
];

export default function RestDay() {
  const nextChallenge = getNextChallenge();
  const randomTip = RECOVERY_TIPS[Math.floor(Math.random() * RECOVERY_TIPS.length)];

  return (
    <div className="min-h-screen-safe bg-[var(--bg-primary)] bg-grid-pattern relative overflow-hidden flex items-center justify-center">
      {/* Animated gradient mesh background - calmer version */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-gradient-mesh" />
      </div>

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="glass-card p-8 text-center animate-scale-in">
          {/* Moon/Rest Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--neon-purple)]/20 neon-border" style={{ borderColor: 'var(--neon-purple)', boxShadow: '0 0 10px var(--neon-purple), inset 0 0 10px rgba(180, 0, 255, 0.1)' }}>
              <span className="text-5xl">🌙</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl tracking-wider mb-2" style={{ color: 'var(--neon-purple)', textShadow: '0 0 10px var(--neon-purple), 0 0 20px var(--neon-purple)' }}>
            REST DAY
          </h1>
          <p className="text-[var(--text-secondary)] font-display text-xl tracking-wider mb-6">
            EVERY SUNDAY
          </p>

          {/* Recovery Message */}
          <div className="p-4 rounded-xl bg-[var(--neon-purple)]/10 border border-[var(--neon-purple)]/30 mb-8">
            <p className="text-[var(--text-primary)] font-medium mb-2">
              Recovery is part of the process
            </p>
            <p className="text-[var(--text-muted)] text-sm">
              💡 {randomTip}
            </p>
          </div>

          {/* Next Challenge Preview */}
          <div className="glass-card p-6 mb-8" style={{ background: 'var(--bg-card)' }}>
            <h2 className="font-display text-lg tracking-wider text-[var(--text-muted)] mb-4">
              NEXT CHALLENGE
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Date</span>
                <span className="font-semibold text-white">
                  {format(nextChallenge.date, 'EEEE, MMM d')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Day</span>
                <span className="font-display text-xl neon-text-cyan">
                  DAY {nextChallenge.dayNumber}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Duration</span>
                <span className="font-display text-2xl neon-text-pink">
                  {nextChallenge.duration}s
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/progress"
              className="btn-ghost w-full flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              VIEW PROGRESS
            </Link>

            <a
              href={process.env.NEXT_PUBLIC_DISCORD_URL || 'https://discord.com/channels/1210290974601773056/1438326766279196782'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost w-full flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              DISCORD COMMUNITY
            </a>
          </div>

          {/* Motivational Quote */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-[var(--text-muted)] italic text-sm">
              "The body achieves what the mind believes."
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-2">
              — See you tomorrow! 💪
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
