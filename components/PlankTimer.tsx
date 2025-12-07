'use client';

import { useState, useMemo, useCallback } from 'react';
import { calculateTargetDuration, getDayNumber, formatDuration } from '@/utils/timerLogic';
import { preloadPoseLandmarker } from '@/lib/mediapipeLoader';
import VideoRecorder from './VideoRecorder';
import RestDay from './RestDay';
import ShareToDiscord from './ShareToDiscord';
import UsernamePrompt from './UsernamePrompt';
import Link from 'next/link';

type AppState = 'idle' | 'recording' | 'completed';

// Motivational phrases that rotate
const MOTIVATION_PHRASES = [
  "CRUSH IT TODAY",
  "NO EXCUSES",
  "STRONGER EVERY DAY",
  "PUSH YOUR LIMITS",
  "YOU GOT THIS",
  "BEAST MODE ON",
];

export default function PlankTimer() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectionMode, setDetectionMode] = useState(false);
  const [cameraMode, setCameraMode] = useState<'user' | 'environment'>('environment');
  const [completionData, setCompletionData] = useState<{
    day: number;
    duration: number;
    targetDuration: number;
  } | null>(null);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);

  // Memoize calculations
  const targetDuration = useMemo(() => calculateTargetDuration(), []);
  const dayNumber = useMemo(() => getDayNumber(), []);
  const motivationPhrase = useMemo(
    () => MOTIVATION_PHRASES[Math.floor(Math.random() * MOTIVATION_PHRASES.length)],
    []
  );

  // If it's a rest day (Sunday), show rest day component
  if (targetDuration === null) {
    return <RestDay />;
  }

  const handleStart = useCallback(() => {
    setAppState('recording');
    setErrorMessage(null);
  }, []);

  const handleComplete = useCallback((elapsedTime: number) => {
    setCompletionData({
      day: dayNumber,
      duration: elapsedTime,
      targetDuration: targetDuration,
    });
    setAppState('completed');
    setShowUsernamePrompt(true);
  }, [dayNumber, targetDuration]);

  const handleError = useCallback((error: string) => {
    setErrorMessage(error);
    setAppState('idle');
  }, []);

  const handleReset = useCallback(() => {
    setAppState('idle');
    setErrorMessage(null);
    setCompletionData(null);
  }, []);

  return (
    <div className="min-h-screen-safe bg-[var(--bg-primary)] bg-grid-pattern relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 safe-area-padding">
        {/* ============================================
            IDLE STATE - Start Screen
            ============================================ */}
        {appState === 'idle' && (
          <div className="flex flex-col items-center">
            {/* Header */}
            <div className="text-center mb-8 animate-fade-in-up stagger-1">
              <p className="text-[var(--text-muted)] text-sm tracking-[0.3em] uppercase mb-2">
                {motivationPhrase}
              </p>
              <h1 className="font-display text-6xl md:text-8xl tracking-wider text-gradient-neon">
                PLANK
              </h1>
              <p className="font-display text-2xl md:text-3xl tracking-widest text-[var(--text-secondary)] mt-1">
                CHALLENGE
              </p>
            </div>

            {/* Day Badge */}
            <div className="animate-fade-in-up stagger-2 mb-8">
              <div className="inline-flex items-center gap-3 px-6 py-3 glass-card neon-border">
                <span className="font-display text-xl tracking-wider text-[var(--text-secondary)]">DAY</span>
                <span className="font-display text-4xl neon-text-cyan">{dayNumber}</span>
                <span className="font-display text-xl tracking-wider text-[var(--text-secondary)]">OF 30</span>
              </div>
            </div>

            {/* Main Challenge Card */}
            <div className="w-full max-w-md animate-fade-in-up stagger-3">
              <div className="glass-card p-8 mb-6">
                {/* Timer Display */}
                <div className="text-center mb-8">
                  <p className="text-[var(--text-muted)] text-sm tracking-widest uppercase mb-4">
                    TODAY'S TARGET
                  </p>
                  <div className="timer-display timer-glow neon-text-cyan">
                    {formatDuration(targetDuration)}
                  </div>
                  <p className="text-[var(--text-secondary)] mt-2 font-mono">
                    {targetDuration} seconds
                  </p>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 text-sm font-medium">{errorMessage}</p>
                  </div>
                )}

                {/* Camera Toggle */}
                <div className="mb-4 p-4 rounded-xl bg-[var(--bg-card)] border border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--neon-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Camera
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        {cameraMode === 'environment' ? 'Back Camera' : 'Front Camera'}
                      </div>
                    </div>
                    <button
                      onClick={() => setCameraMode(cameraMode === 'environment' ? 'user' : 'environment')}
                      className={`toggle-track ${cameraMode === 'user' ? 'active' : ''}`}
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* Detection Mode Toggle */}
                <div
                  className="mb-6 p-4 rounded-xl bg-[var(--bg-card)] border border-white/5"
                  onMouseEnter={preloadPoseLandmarker}
                  onTouchStart={preloadPoseLandmarker}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--neon-pink)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        AI Detection
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">
                        Auto-start when you're in plank position
                      </div>
                    </div>
                    <button
                      onClick={() => setDetectionMode(!detectionMode)}
                      className={`toggle-track ${detectionMode ? 'active' : ''}`}
                    >
                      <div className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStart}
                  className="btn-neon w-full py-5 text-2xl"
                >
                  {detectionMode ? 'START DETECTION' : 'START RECORDING'}
                </button>
              </div>
            </div>

            {/* Action Links */}
            <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up stagger-4">
              <Link
                href="/progress"
                className="btn-ghost flex items-center gap-2"
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
                className="btn-ghost flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                DISCORD
              </a>
            </div>

            {/* Pro Tip */}
            <div className="mt-8 max-w-md w-full animate-fade-in-up stagger-5">
              <div className="p-4 rounded-xl bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20">
                <p className="text-[var(--neon-cyan)] text-sm text-center">
                  <span className="font-bold">PRO TIP:</span> Position yourself sideways to the camera for best AI detection results!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            RECORDING STATE
            ============================================ */}
        {appState === 'recording' && (
          <VideoRecorder
            targetDuration={targetDuration}
            onComplete={handleComplete}
            onError={handleError}
            detectionMode={detectionMode}
            cameraMode={cameraMode}
          />
        )}

        {/* ============================================
            COMPLETED STATE
            ============================================ */}
        {appState === 'completed' && (
          <div className="flex flex-col items-center">
            {/* Success Card */}
            <div className="w-full max-w-md animate-scale-in">
              <div className="glass-card p-8 text-center relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--neon-lime)]/10 to-transparent pointer-events-none" />

                {/* Success Icon */}
                <div className="relative mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--neon-lime)]/20 neon-border-lime">
                    <svg className="w-12 h-12 text-[var(--neon-lime)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h2 className="font-display text-5xl tracking-wider neon-text-lime mb-2">
                  CRUSHED IT!
                </h2>
                <p className="text-[var(--text-secondary)] font-display text-xl tracking-wider mb-6">
                  DAY {dayNumber} COMPLETE
                </p>

                {/* Stats */}
                <div className="p-4 rounded-xl bg-[var(--bg-card)] mb-6">
                  <p className="text-[var(--text-muted)] text-sm mb-1">TIME HELD</p>
                  <p className="font-display text-4xl neon-text-cyan">
                    {completionData ? formatDuration(completionData.duration) : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleReset}
                    className="btn-neon w-full"
                  >
                    RECORD ANOTHER
                  </button>

                  <Link
                    href="/progress"
                    className="btn-ghost w-full flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    VIEW PROGRESS
                  </Link>
                </div>
              </div>
            </div>

            {/* Share to Discord */}
            {completionData && (
              <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <ShareToDiscord
                  day={completionData.day}
                  duration={completionData.duration}
                  targetDuration={completionData.targetDuration}
                />
              </div>
            )}
          </div>
        )}

        {/* Username Prompt Modal */}
        {showUsernamePrompt && (
          <UsernamePrompt onComplete={() => setShowUsernamePrompt(false)} />
        )}
      </div>
    </div>
  );
}
