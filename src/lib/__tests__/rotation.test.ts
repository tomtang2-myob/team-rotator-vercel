import { getNextDayAfterTargetDay, calculateNextRotationDates, calculateEndDateFromStart } from '../rotation';
import { Task, Member } from '@/types';

// Mock the dependencies
jest.mock('../holiday', () => ({
  isWorkingDay: jest.fn((date: Date) => {
    const day = date.getDay();
    // Assume weekends are non-working days, all weekdays are working
    return day !== 0 && day !== 6;
  }),
}));

jest.mock('../db', () => ({
  getMembers: jest.fn(),
  getTasks: jest.fn(),
  getTaskAssignments: jest.fn(),
  updateTaskAssignment: jest.fn(),
}));

jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Rotation Logic', () => {
  describe('getNextDayAfterTargetDay', () => {
    it('should return next Friday when starting from Monday', () => {
      const monday = new Date('2026-01-05'); // Monday
      const nextFriday = getNextDayAfterTargetDay(monday, 5); // 5 = Friday
      
      expect(nextFriday.getDay()).toBe(5); // Friday
      expect(nextFriday.toISOString().split('T')[0]).toBe('2026-01-09');
    });

    it('should return Friday next week when starting from Friday', () => {
      const friday = new Date('2026-01-09'); // Friday
      const nextFriday = getNextDayAfterTargetDay(friday, 5); // 5 = Friday
      
      expect(nextFriday.getDay()).toBe(5); // Friday
      expect(nextFriday.toISOString().split('T')[0]).toBe('2026-01-16');
    });

    it('should return next Friday when starting from Thursday', () => {
      const thursday = new Date('2026-01-08'); // Thursday
      const nextFriday = getNextDayAfterTargetDay(thursday, 5); // 5 = Friday
      
      expect(nextFriday.getDay()).toBe(5); // Friday
      // This currently returns Jan 9 (next day) which leads to the bug
      const result = nextFriday.toISOString().split('T')[0];
      expect(result).toBe('2026-01-09');
    });

    it('should return next Wednesday when starting from Monday', () => {
      const monday = new Date('2026-01-05'); // Monday
      const nextWednesday = getNextDayAfterTargetDay(monday, 3); // 3 = Wednesday
      
      expect(nextWednesday.getDay()).toBe(3); // Wednesday
      expect(nextWednesday.toISOString().split('T')[0]).toBe('2026-01-07');
    });
  });

  describe('calculateNextRotationDates - Weekly Tasks', () => {
    const standupTask: Task = {
      id: 3,
      name: 'Standup',
      rotationRule: 'weekly_friday',
    };

    it('should calculate full week when starting from Monday after Friday', async () => {
      // Previous assignment ended Friday Jan 3
      const fromDate = new Date('2026-01-03'); // Friday
      const result = await calculateNextRotationDates(standupTask, fromDate);
      
      // Should start Monday Jan 5, end Friday Jan 9
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-05'); // Monday
      expect(result.endDate.toISOString().split('T')[0]).toBe('2026-01-09'); // Friday
      
      // Calculate duration in days
      const duration = Math.floor(
        (result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(duration).toBe(4); // Mon-Fri = 4 days difference (5 working days)
    });

    it('BUG FIX: should ensure full week duration even when starting mid-week (Thursday)', async () => {
      // Previous assignment ended Wednesday Jan 7
      const fromDate = new Date('2026-01-07'); // Wednesday
      const result = await calculateNextRotationDates(standupTask, fromDate);
      
      console.log('\n=== BUG TEST: Mid-week start ===');
      console.log('From date (previous end):', fromDate.toISOString().split('T')[0]);
      console.log('Start:', result.startDate.toISOString().split('T')[0]);
      console.log('End:', result.endDate.toISOString().split('T')[0]);
      
      const duration = Math.floor(
        (result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log('Duration:', duration, 'days\n');
      
      // Should start Thursday Jan 8
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-08'); // Thursday
      
      // Should end Friday Jan 16 (full week+), NOT Jan 9 (2 days)
      // After fix: Thu-Fri is 1 day, which is < 3, so it extends to next week (8 days)
      expect(duration).toBeGreaterThanOrEqual(3);
    });

    it('should handle starting on Monday correctly', async () => {
      const fromDate = new Date('2026-01-05'); // Monday
      const result = await calculateNextRotationDates(standupTask, fromDate);
      
      // Should start Tuesday, end next Friday
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-06'); // Tuesday
      expect(result.endDate.toISOString().split('T')[0]).toBe('2026-01-09'); // Friday
      
      const duration = Math.floor(
        (result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(duration).toBe(3); // Tue-Fri
    });
  });

  describe('calculateNextRotationDates - Daily Tasks', () => {
    const englishWordTask: Task = {
      id: 2,
      name: 'English word',
      rotationRule: 'daily',
    };

    it('should rotate to next working day from Thursday', async () => {
      const fromDate = new Date('2026-01-08'); // Thursday
      const result = await calculateNextRotationDates(englishWordTask, fromDate);
      
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-09'); // Friday
      expect(result.endDate.toISOString().split('T')[0]).toBe('2026-01-09'); // Same day
    });

    it('should skip weekend when rotating from Friday', async () => {
      const fromDate = new Date('2026-01-09'); // Friday
      const result = await calculateNextRotationDates(englishWordTask, fromDate);
      
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-12'); // Monday
      expect(result.endDate.toISOString().split('T')[0]).toBe('2026-01-12'); // Same day
    });

    it('should rotate daily during the week', async () => {
      const monday = new Date('2026-01-05');
      const result = await calculateNextRotationDates(englishWordTask, monday);
      
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-06'); // Tuesday
      expect(result.endDate.toISOString().split('T')[0]).toBe('2026-01-06'); // Same day
    });
  });

  describe('calculateNextRotationDates - Biweekly Tasks', () => {
    const retroTask: Task = {
      id: 1,
      name: 'Retro',
      rotationRule: 'biweekly_wednesday',
    };

    const englishCornerTask: Task = {
      id: 5,
      name: 'English corner',
      rotationRule: 'biweekly_thursday',
    };

    it('should calculate 2-week period ending on Wednesday', async () => {
      const fromDate = new Date('2026-01-03'); // Saturday
      const result = await calculateNextRotationDates(retroTask, fromDate);
      
      console.log('\n=== Biweekly Wednesday test ===');
      console.log('From date:', fromDate.toISOString().split('T')[0]);
      console.log('Start:', result.startDate.toISOString().split('T')[0]);
      console.log('End:', result.endDate.toISOString().split('T')[0]);
      
      // Should start Monday Jan 5 (next working day)
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-05');
      
      // Should end Wednesday (target day) 2 weeks later
      expect(result.endDate.getDay()).toBe(3); // Wednesday
      
      const duration = Math.floor(
        (result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log('Duration:', duration, 'days\n');
      expect(duration).toBeGreaterThanOrEqual(12); // At least ~2 weeks (accounting for weekends)
    });

    it('should calculate 2-week period ending on Thursday', async () => {
      const fromDate = new Date('2026-01-08'); // Thursday
      const result = await calculateNextRotationDates(englishCornerTask, fromDate);
      
      // Should start Friday Jan 9 (next working day)
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-09');
      
      // Should end Thursday 2 weeks later
      expect(result.endDate.getDay()).toBe(4); // Thursday
      
      const duration = Math.floor(
        (result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(duration).toBeGreaterThanOrEqual(12); // At least ~2 weeks
    });

    it('should handle biweekly rotation from Wednesday to Wednesday', async () => {
      const fromDate = new Date('2026-01-14'); // Wednesday
      const result = await calculateNextRotationDates(retroTask, fromDate);
      
      // Should start Thursday Jan 15
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-15');
      
      // Should end Wednesday ~2 weeks later
      expect(result.endDate.getDay()).toBe(3); // Wednesday
      
      const duration = Math.floor(
        (result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(duration).toBeGreaterThanOrEqual(12);
    });

    it('should handle rotation when previous period ended on target day', async () => {
      // Previous period ended on Wednesday (Retro's target day)
      const fromDate = new Date('2026-01-07'); // Wednesday
      const result = await calculateNextRotationDates(retroTask, fromDate);
      
      console.log('\n=== Biweekly after ending on target day ===');
      console.log('From date (previous end):', fromDate.toISOString().split('T')[0]);
      console.log('Start:', result.startDate.toISOString().split('T')[0]);
      console.log('End:', result.endDate.toISOString().split('T')[0]);
      
      const duration = Math.floor(
        (result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log('Duration:', duration, 'days\n');
      
      // Start should be next working day (Thursday)
      expect(result.startDate.toISOString().split('T')[0]).toBe('2026-01-08'); // Thursday
      
      // Should be ~2-3 weeks (14-20 days) depending on when next Wednesday falls
      expect(duration).toBeGreaterThanOrEqual(12); // At least ~2 weeks
      expect(duration).toBeLessThan(22); // Not more than 3 weeks
    });
  });

  describe('calculateEndDateFromStart - Sprint Kickoff', () => {
    it('should calculate end date for daily task from specific start date', async () => {
      const englishWordTask: Task = {
        id: 2,
        name: 'English word',
        rotationRule: 'daily',
      };
      
      const startDate = new Date('2026-01-13'); // Tuesday
      const endDate = await calculateEndDateFromStart(englishWordTask, startDate);
      
      // Daily task should end same day
      expect(endDate.toISOString().split('T')[0]).toBe('2026-01-13');
    });

    it('should calculate end date for weekly task from Monday start', async () => {
      const standupTask: Task = {
        id: 3,
        name: 'Standup',
        rotationRule: 'weekly_friday',
      };
      
      const startDate = new Date('2026-01-12'); // Monday
      const endDate = await calculateEndDateFromStart(standupTask, startDate);
      
      // Should end on Friday of same week
      expect(endDate.getDay()).toBe(5); // Friday
      expect(endDate.toISOString().split('T')[0]).toBe('2026-01-16'); // Friday
    });

    it('should calculate end date for weekly task from Thursday start', async () => {
      const standupTask: Task = {
        id: 3,
        name: 'Standup',
        rotationRule: 'weekly_friday',
      };
      
      const startDate = new Date('2026-01-15'); // Thursday
      const endDate = await calculateEndDateFromStart(standupTask, startDate);
      
      // Should end on Friday
      expect(endDate.getDay()).toBe(5); // Friday
      // Could be same week Friday (Jan 16) or next week depending on implementation
      const daysDiff = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(1); // At least next day
    });

    it('should calculate end date for biweekly task from Monday start', async () => {
      const retroTask: Task = {
        id: 1,
        name: 'Retro',
        rotationRule: 'biweekly_wednesday',
      };
      
      const startDate = new Date('2026-01-12'); // Monday
      const endDate = await calculateEndDateFromStart(retroTask, startDate);
      
      // Should end on Wednesday ~2 weeks later
      expect(endDate.getDay()).toBe(3); // Wednesday
      
      const daysDiff = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(12); // At least 2 weeks
    });

    it('BUG FIX: should not add extra week when kickoff on Wednesday (target day)', async () => {
      const retroTask: Task = {
        id: 1,
        name: 'Retro',
        rotationRule: 'biweekly_wednesday',
      };
      
      const startDate = new Date('2026-01-07'); // Wednesday (target day)
      const endDate = await calculateEndDateFromStart(retroTask, startDate);
      
      console.log('\n=== Sprint kickoff on target day (Wednesday) ===');
      console.log('Start:', startDate.toISOString().split('T')[0]);
      console.log('End:', endDate.toISOString().split('T')[0]);
      
      const daysDiff = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log('Duration:', daysDiff, 'days\n');
      
      // Should be ~14 days (2 weeks), NOT 21 days (3 weeks)
      expect(daysDiff).toBeLessThan(18); // Should not be 3 weeks
      expect(daysDiff).toBeGreaterThanOrEqual(12); // Should be at least ~2 weeks
      expect(endDate.getDay()).toBe(3); // Should still end on Wednesday
    });

    it('USER BUG: kickoff on Tuesday Jan 6 should end on Wednesday Jan 21 (not Jan 27)', async () => {
      const retroTask: Task = {
        id: 1,
        name: 'Retro',
        rotationRule: 'biweekly_wednesday',
      };
      
      const startDate = new Date('2026-01-06'); // Tuesday
      const endDate = await calculateEndDateFromStart(retroTask, startDate);
      
      console.log('\n=== Sprint kickoff on Tuesday Jan 6 ===');
      console.log('Start:', startDate.toISOString().split('T')[0], '(Tuesday)');
      console.log('End:', endDate.toISOString().split('T')[0], '(should be Wednesday)');
      
      const daysDiff = Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log('Duration:', daysDiff, 'days');
      console.log('Expected: ~15 days (Tue to Wed 2 weeks later)\n');
      
      // Should end on Wednesday Jan 21 (15 days), NOT Jan 27 (21 days)
      expect(endDate.toISOString().split('T')[0]).toBe('2026-01-21');
      expect(endDate.getDay()).toBe(3); // Wednesday
      expect(daysDiff).toBe(15); // Exactly 15 days
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid rotation rule', async () => {
      const invalidTask: Task = {
        id: 99,
        name: 'Invalid',
        rotationRule: 'invalid_rule',
      };
      
      const fromDate = new Date('2026-01-08');
      await expect(calculateNextRotationDates(invalidTask, fromDate)).rejects.toThrow();
    });

    it('should handle invalid day in rotation rule', async () => {
      const invalidTask: Task = {
        id: 99,
        name: 'Invalid',
        rotationRule: 'weekly_funday',
      };
      
      const fromDate = new Date('2026-01-08');
      await expect(calculateNextRotationDates(invalidTask, fromDate)).rejects.toThrow();
    });
  });
});

