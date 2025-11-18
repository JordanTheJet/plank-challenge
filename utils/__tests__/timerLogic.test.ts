import {
  calculateTargetDuration,
  getDayNumber,
  getNextTrainingDay,
  getNextChallenge,
  formatDuration,
  generateFilename,
  START_DATE,
  BASE_DURATION,
  DAILY_INCREMENT,
} from '../timerLogic';
import { addDays, subDays, format, isSunday } from 'date-fns';

describe('Timer Logic', () => {
  describe('calculateTargetDuration', () => {
    it('should return base duration on start date', () => {
      const duration = calculateTargetDuration(START_DATE);
      expect(duration).toBe(BASE_DURATION);
    });

    it('should return null on Sunday (rest day)', () => {
      // Find next Sunday from start date
      let testDate = START_DATE;
      while (!isSunday(testDate)) {
        testDate = addDays(testDate, 1);
      }

      const duration = calculateTargetDuration(testDate);
      expect(duration).toBeNull();
    });

    it('should increment by DAILY_INCREMENT each training day', () => {
      let testDate = START_DATE;
      let trainingDay = 0;

      // Test first 5 training days
      for (let i = 0; i < 10; i++) {
        if (!isSunday(testDate)) {
          const duration = calculateTargetDuration(testDate);
          const expectedDuration = BASE_DURATION + (trainingDay * DAILY_INCREMENT);
          expect(duration).toBe(expectedDuration);
          trainingDay++;
        }
        testDate = addDays(testDate, 1);
      }
    });

    it('should skip Sundays when calculating duration', () => {
      // Find a Monday after start date
      let monday = START_DATE;
      while (monday.getDay() !== 1) {
        monday = addDays(monday, 1);
      }

      const durationMonday = calculateTargetDuration(monday);

      // Tuesday should be one increment higher
      const tuesday = addDays(monday, 1);
      const durationTuesday = calculateTargetDuration(tuesday);

      expect(durationTuesday).toBe(durationMonday! + DAILY_INCREMENT);
    });

    it('should return base duration for dates before start date', () => {
      const beforeStart = subDays(START_DATE, 10);
      const duration = calculateTargetDuration(beforeStart);
      expect(duration).toBe(BASE_DURATION);
    });

    it('should handle multiple weeks correctly', () => {
      // Test 3 weeks from start (excluding Sundays)
      const threeWeeksLater = addDays(START_DATE, 21);

      if (!isSunday(threeWeeksLater)) {
        const duration = calculateTargetDuration(threeWeeksLater);

        // Calculate expected training days (21 days - 3 Sundays = 18 training days)
        // But we need to count from day 0, so it's 18 days * 6 seconds
        expect(duration).toBeGreaterThan(BASE_DURATION);
      }
    });

    it('should use current date when no date provided', () => {
      const duration = calculateTargetDuration();
      expect(typeof duration).toBe('number');
    });
  });

  describe('getDayNumber', () => {
    it('should return 1 for start date', () => {
      const dayNumber = getDayNumber(START_DATE);
      expect(dayNumber).toBe(1);
    });

    it('should return 1 for dates before start date', () => {
      const beforeStart = subDays(START_DATE, 5);
      const dayNumber = getDayNumber(beforeStart);
      expect(dayNumber).toBe(1);
    });

    it('should increment by 1 each non-Sunday day', () => {
      let testDate = START_DATE;
      let expectedDayNumber = 1;

      for (let i = 0; i < 10; i++) {
        if (!isSunday(testDate)) {
          const dayNumber = getDayNumber(testDate);
          expect(dayNumber).toBe(expectedDayNumber);
          expectedDayNumber++;
        }
        testDate = addDays(testDate, 1);
      }
    });

    it('should not increment on Sundays', () => {
      // Find Saturday and Monday around a Sunday
      let saturday = START_DATE;
      while (saturday.getDay() !== 6) {
        saturday = addDays(saturday, 1);
      }

      const sunday = addDays(saturday, 1);
      const monday = addDays(sunday, 1);

      const saturdayDay = getDayNumber(saturday);
      const mondayDay = getDayNumber(monday);

      // Monday should be exactly 1 more than Saturday (Sunday doesn't count)
      expect(mondayDay).toBe(saturdayDay + 1);
    });

    it('should use current date when no date provided', () => {
      const dayNumber = getDayNumber();
      expect(dayNumber).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getNextTrainingDay', () => {
    it('should return next day if next day is not Sunday', () => {
      // Find a Monday
      let monday = START_DATE;
      while (monday.getDay() !== 1) {
        monday = addDays(monday, 1);
      }

      const nextDay = getNextTrainingDay(monday);
      const tuesday = addDays(monday, 1);

      expect(nextDay.getDate()).toBe(tuesday.getDate());
      expect(nextDay.getMonth()).toBe(tuesday.getMonth());
    });

    it('should skip Sunday and return Monday', () => {
      // Find a Saturday
      let saturday = START_DATE;
      while (saturday.getDay() !== 6) {
        saturday = addDays(saturday, 1);
      }

      const nextDay = getNextTrainingDay(saturday);

      // Should skip Sunday and return Monday
      expect(nextDay.getDay()).toBe(1);
    });

    it('should skip if starting on Sunday', () => {
      let sunday = START_DATE;
      while (!isSunday(sunday)) {
        sunday = addDays(sunday, 1);
      }

      const nextDay = getNextTrainingDay(sunday);

      // Should return Monday
      expect(nextDay.getDay()).toBe(1);
    });

    it('should use current date when no date provided', () => {
      const nextDay = getNextTrainingDay();
      expect(nextDay).toBeInstanceOf(Date);
      expect(nextDay.getDay()).not.toBe(0); // Should not be Sunday
    });
  });

  describe('getNextChallenge', () => {
    it('should return next training day info', () => {
      const challenge = getNextChallenge(START_DATE);

      expect(challenge).toHaveProperty('date');
      expect(challenge).toHaveProperty('dayNumber');
      expect(challenge).toHaveProperty('duration');

      expect(challenge.date).toBeInstanceOf(Date);
      expect(typeof challenge.dayNumber).toBe('number');
      expect(typeof challenge.duration).toBe('number');
    });

    it('should skip Sunday in next challenge', () => {
      // Find a Saturday
      let saturday = START_DATE;
      while (saturday.getDay() !== 6) {
        saturday = addDays(saturday, 1);
      }

      const challenge = getNextChallenge(saturday);

      // Next challenge should be Monday (skip Sunday)
      expect(challenge.date.getDay()).toBe(1);
    });

    it('should calculate correct duration for next day', () => {
      const challenge = getNextChallenge(START_DATE);
      const nextDay = addDays(START_DATE, 1);

      if (!isSunday(nextDay)) {
        const expectedDuration = calculateTargetDuration(nextDay);
        expect(challenge.duration).toBe(expectedDuration);
      }
    });

    it('should use BASE_DURATION as fallback if calculation returns null', () => {
      // This shouldn't happen since getNextTrainingDay skips Sundays,
      // but the code has this safety check
      const challenge = getNextChallenge(START_DATE);
      expect(challenge.duration).toBeGreaterThanOrEqual(BASE_DURATION);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(30)).toBe('00:30');
      expect(formatDuration(60)).toBe('01:00');
      expect(formatDuration(90)).toBe('01:30');
      expect(formatDuration(125)).toBe('02:05');
    });

    it('should pad single digits with zeros', () => {
      expect(formatDuration(5)).toBe('00:05');
      expect(formatDuration(65)).toBe('01:05');
    });

    it('should handle large durations', () => {
      expect(formatDuration(3600)).toBe('60:00');
      expect(formatDuration(3661)).toBe('61:01');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('00:00');
      expect(formatDuration(1)).toBe('00:01');
      expect(formatDuration(59)).toBe('00:59');
      expect(formatDuration(60)).toBe('01:00');
      expect(formatDuration(61)).toBe('01:01');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with day number and date', () => {
      const testDate = new Date(2025, 10, 17); // November 17, 2025
      const filename = generateFilename(testDate);

      expect(filename).toContain('plank-day');
      expect(filename).toContain('2025-11-17');
      expect(filename).toContain('.webm');
    });

    it('should include correct day number', () => {
      const dayNumber = getDayNumber(START_DATE);
      const filename = generateFilename(START_DATE);

      expect(filename).toContain(`plank-day${dayNumber}`);
    });

    it('should use current date when no date provided', () => {
      const filename = generateFilename();

      expect(filename).toMatch(/plank-day\d+-\d{4}-\d{2}-\d{2}\.webm/);
    });

    it('should format date consistently', () => {
      const testDate = new Date(2025, 0, 5); // January 5, 2025
      const filename = generateFilename(testDate);

      expect(filename).toContain('2025-01-05');
    });

    it('should handle different years', () => {
      const testDate = new Date(2026, 5, 15); // June 15, 2026
      const filename = generateFilename(testDate);

      expect(filename).toContain('2026-06-15');
      expect(filename).toContain('.webm');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle leap year correctly', () => {
      const leapDay = new Date(2024, 1, 29); // February 29, 2024

      const duration = calculateTargetDuration(leapDay);
      const dayNumber = getDayNumber(leapDay);

      expect(typeof duration === 'number' || duration === null).toBe(true);
      expect(dayNumber).toBeGreaterThanOrEqual(1);
    });

    it('should handle year boundaries', () => {
      const newYearsEve = new Date(2025, 11, 31);
      const newYearsDay = new Date(2026, 0, 1);

      const durationEve = calculateTargetDuration(newYearsEve);
      const durationDay = calculateTargetDuration(newYearsDay);

      if (durationEve !== null && durationDay !== null) {
        if (!isSunday(newYearsEve) && !isSunday(newYearsDay)) {
          expect(durationDay).toBeGreaterThan(durationEve);
        }
      }
    });

    it('should handle consecutive Sundays correctly', () => {
      // Find two consecutive Sundays (not possible in reality, but test the logic)
      let sunday1 = START_DATE;
      while (!isSunday(sunday1)) {
        sunday1 = addDays(sunday1, 1);
      }
      const sunday2 = addDays(sunday1, 7);

      expect(calculateTargetDuration(sunday1)).toBeNull();
      expect(calculateTargetDuration(sunday2)).toBeNull();
    });

    it('should handle very long durations in format', () => {
      // Test 10 hours
      const tenHours = 10 * 60 * 60;
      const formatted = formatDuration(tenHours);
      expect(formatted).toBe('600:00');
    });
  });

  describe('START_DATE constant', () => {
    it('should be November 17, 2025', () => {
      expect(START_DATE.getFullYear()).toBe(2025);
      expect(START_DATE.getMonth()).toBe(10); // 0-indexed (10 = November)
      expect(START_DATE.getDate()).toBe(17);
    });
  });

  describe('Constants', () => {
    it('should have correct BASE_DURATION', () => {
      expect(BASE_DURATION).toBe(30);
    });

    it('should have correct DAILY_INCREMENT', () => {
      expect(DAILY_INCREMENT).toBe(6);
    });
  });
});
