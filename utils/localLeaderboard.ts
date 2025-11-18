/**
 * Local leaderboard utilities using localStorage
 * Tracks user completions and calculates "still in running" status
 */

import { START_DATE, calculateTargetDuration } from './timerLogic';
import { differenceInDays, startOfDay, isSunday, addDays, format } from 'date-fns';

export interface Completion {
  day: number;
  date: string; // YYYY-MM-DD
  duration: number; // seconds held
  targetDuration: number; // required duration
  success: boolean; // met or exceeded target
  timestamp: number; // Date.now()
}

export interface UserStats {
  username: string;
  completions: Completion[];
  daysCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalSeconds: number;
  stillInRunning: boolean;
  missedDays: number[];
}

const STORAGE_KEY = 'plank_completions';
const USERNAME_KEY = 'plank_username';

/**
 * Get username from localStorage
 */
export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USERNAME_KEY);
}

/**
 * Save username to localStorage
 */
export function saveUsername(username: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERNAME_KEY, username);
}

/**
 * Get all completions from localStorage
 */
export function getCompletions(): Completion[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to parse completions:', error);
    return [];
  }
}

/**
 * Save completion to localStorage
 */
export function saveCompletion(
  day: number,
  duration: number,
  targetDuration: number
): boolean {
  if (typeof window === 'undefined') return false;

  const completions = getCompletions();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Check if already submitted for this day
  const existingIndex = completions.findIndex(
    c => c.day === day && c.date === today
  );

  if (existingIndex !== -1) {
    // Already submitted for this day
    return false;
  }

  const newCompletion: Completion = {
    day,
    date: today,
    duration,
    targetDuration,
    success: duration >= targetDuration,
    timestamp: Date.now(),
  };

  completions.push(newCompletion);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completions));
    return true;
  } catch (error) {
    console.error('Failed to save completion:', error);
    return false;
  }
}

/**
 * Check if already submitted for today
 */
export function hasSubmittedToday(day: number): boolean {
  const completions = getCompletions();
  const today = format(new Date(), 'yyyy-MM-dd');

  return completions.some(c => c.day === day && c.date === today);
}

/**
 * Calculate user statistics
 */
export function calculateStats(): UserStats {
  const username = getUsername() || 'Anonymous';
  const completions = getCompletions();

  // Sort by day
  completions.sort((a, b) => a.day - b.day);

  // Days completed successfully
  const successfulCompletions = completions.filter(c => c.success);
  const daysCompleted = successfulCompletions.length;

  // Total seconds held
  const totalSeconds = completions.reduce((sum, c) => sum + c.duration, 0);

  // Calculate current streak
  const currentStreak = calculateCurrentStreak(completions);

  // Calculate longest streak
  const longestStreak = calculateLongestStreak(completions);

  // Check if still in running
  const { stillInRunning, missedDays } = checkStillInRunning(completions);

  return {
    username,
    completions,
    daysCompleted,
    currentStreak,
    longestStreak,
    totalSeconds,
    stillInRunning,
    missedDays,
  };
}

/**
 * Calculate current consecutive streak
 */
function calculateCurrentStreak(completions: Completion[]): number {
  if (completions.length === 0) return 0;

  const successfulDays = completions
    .filter(c => c.success)
    .map(c => c.day)
    .sort((a, b) => b - a); // Sort descending

  let streak = 0;
  let expectedDay = successfulDays[0];

  for (const day of successfulDays) {
    if (day === expectedDay) {
      streak++;
      expectedDay--;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak ever
 */
function calculateLongestStreak(completions: Completion[]): number {
  if (completions.length === 0) return 0;

  const successfulDays = completions
    .filter(c => c.success)
    .map(c => c.day)
    .sort((a, b) => a - b);

  let maxStreak = 0;
  let currentStreak = 0;
  let lastDay = -1;

  for (const day of successfulDays) {
    if (lastDay === -1 || day === lastDay + 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
    lastDay = day;
  }

  return maxStreak;
}

/**
 * Check if user is still in the running (strict mode: no missed days)
 * Returns which days are expected and which are missing
 */
function checkStillInRunning(completions: Completion[]): {
  stillInRunning: boolean;
  missedDays: number[];
} {
  const today = startOfDay(new Date());
  const startDate = startOfDay(START_DATE);

  // Check if challenge has started
  if (today < startDate) {
    return { stillInRunning: false, missedDays: [] };
  }

  // Get all expected days (excluding Sundays)
  const expectedDays: number[] = [];
  let currentDate = startDate;
  let dayNumber = 1;

  while (currentDate <= today) {
    if (!isSunday(currentDate)) {
      expectedDays.push(dayNumber);
      dayNumber++;
    }
    currentDate = addDays(currentDate, 1);
  }

  // Get completed days
  const completedDays = new Set(
    completions.filter(c => c.success).map(c => c.day)
  );

  // Find missed days
  const missedDays = expectedDays.filter(day => !completedDays.has(day));

  // Still in running if no missed days
  const stillInRunning = missedDays.length === 0;

  return { stillInRunning, missedDays };
}

/**
 * Generate Discord share text
 */
export function generateShareText(
  day: number,
  duration: number,
  targetDuration: number
): string {
  const stats = calculateStats();
  const username = stats.username;
  const success = duration >= targetDuration;
  const statusEmoji = success ? '✅' : '❌';
  const streakEmoji = stats.currentStreak >= 7 ? '🔥' : '📊';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const lines = [
    `🏋️ Day ${day} Complete! ${statusEmoji}`,
    `⏱️ Time: ${formatTime(duration)}`,
    `🎯 Target: ${formatTime(targetDuration)}`,
    `👤 ${username}`,
    `${streakEmoji} Streak: ${stats.currentStreak} days`,
  ];

  if (stats.stillInRunning) {
    lines.push(`✨ Still in the running!`);
  } else if (stats.missedDays.length > 0) {
    lines.push(`⚠️ Missed day ${stats.missedDays[0]} - eliminated from challenge`);
  }

  return lines.join('\n');
}

/**
 * Clear all data (for testing or reset)
 */
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USERNAME_KEY);
}
