import { differenceInDays, startOfDay, isSunday, addDays, format } from 'date-fns';

// Starting date: November 17, 2025
export const START_DATE = new Date(2025, 10, 17); // Month is 0-indexed (10 = November)

// Base duration: 30 seconds on Day 1
export const BASE_DURATION = 30;

// Daily increment: 6 seconds per day
export const DAILY_INCREMENT = 6;

/**
 * Calculate the number of Sundays between two dates (exclusive of start, inclusive of end)
 */
function countSundaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  let currentDate = addDays(startOfDay(startDate), 1); // Start from next day
  const end = startOfDay(endDate);

  while (currentDate <= end) {
    if (isSunday(currentDate)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return count;
}

/**
 * Calculate the target plank duration for a given date
 * Returns null if it's a rest day (Sunday)
 */
export function calculateTargetDuration(date: Date = new Date()): number | null {
  const today = startOfDay(date);

  // Check if it's a rest day (Sunday)
  if (isSunday(today)) {
    return null;
  }

  // Calculate days since start
  const daysSinceStart = differenceInDays(today, startOfDay(START_DATE));

  // Can't be before start date
  if (daysSinceStart < 0) {
    return BASE_DURATION;
  }

  // Count Sundays between start date and today
  const sundaysCount = countSundaysBetween(START_DATE, today);

  // Calculate effective training days (excluding Sundays)
  const trainingDays = daysSinceStart - sundaysCount;

  // Calculate target duration: base + (training days × increment)
  const targetDuration = BASE_DURATION + (trainingDays * DAILY_INCREMENT);

  return targetDuration;
}

/**
 * Get the day number (Day 1, Day 2, etc.) accounting for rest days
 */
export function getDayNumber(date: Date = new Date()): number {
  const today = startOfDay(date);
  const daysSinceStart = differenceInDays(today, startOfDay(START_DATE));

  if (daysSinceStart < 0) {
    return 1;
  }

  const sundaysCount = countSundaysBetween(START_DATE, today);
  return daysSinceStart - sundaysCount + 1;
}

/**
 * Find the next training day (skip Sundays)
 */
export function getNextTrainingDay(date: Date = new Date()): Date {
  let nextDay = addDays(startOfDay(date), 1);

  while (isSunday(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }

  return nextDay;
}

/**
 * Get information about the next challenge
 */
export function getNextChallenge(date: Date = new Date()): {
  date: Date;
  dayNumber: number;
  duration: number;
} {
  const nextDay = getNextTrainingDay(date);
  const duration = calculateTargetDuration(nextDay);
  const dayNumber = getDayNumber(nextDay);

  return {
    date: nextDay,
    dayNumber,
    duration: duration || BASE_DURATION,
  };
}

/**
 * Format duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate filename for the plank video
 */
export function generateFilename(date: Date = new Date()): string {
  const dayNumber = getDayNumber(date);
  const dateStr = format(date, 'yyyy-MM-dd');
  return `plank-day${dayNumber}-${dateStr}.webm`;
}
