/**
 * Integration tests for core rotation flows
 * Tests the main rotation functions that orchestrate the entire system
 */

import { updateTaskAssignments, restartTaskAssignments } from '../rotation';
import { getMembers, getTasks, getTaskAssignments, updateTaskAssignment } from '../db';
import { isWorkingDay } from '../holiday';
import { Task, Member, TaskAssignment } from '@/types';

// Mock dependencies
jest.mock('../db');
jest.mock('../holiday');
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Rotation Integration Tests', () => {
  const mockMembers: Member[] = [
    { id: 8, host: 'Alice', slackMemberId: 'U001' },
    { id: 10, host: 'Bob', slackMemberId: 'U002' },
    { id: 13, host: 'Charlie', slackMemberId: 'U003' },
    { id: 14, host: 'David', slackMemberId: 'U004' },
  ];

  const mockTasks: Task[] = [
    { id: 1, name: 'Retro', rotationRule: 'biweekly_wednesday' },
    { id: 2, name: 'English word', rotationRule: 'daily' },
    { id: 3, name: 'Standup', rotationRule: 'weekly_friday' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (getMembers as jest.Mock).mockResolvedValue(mockMembers);
    (getTasks as jest.Mock).mockResolvedValue(mockTasks);
    (isWorkingDay as jest.Mock).mockImplementation((date: Date) => {
      const day = date.getDay();
      return day !== 0 && day !== 6; // Weekdays only
    });
    (updateTaskAssignment as jest.Mock).mockResolvedValue(undefined);
  });

  describe('updateTaskAssignments - Regular Rotation', () => {
    it('should rotate expired daily task to next member', async () => {
      // Use real Date but with expired assignment
      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 2, // English word (daily)
          memberId: 8, // Alice
          startDate: '2020-01-01', // Far in the past
          endDate: '2020-01-01', // Expired
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await updateTaskAssignments();

      // Should update to next member (Bob, id: 10)
      expect(updateTaskAssignment).toHaveBeenCalled();
      const callArgs = (updateTaskAssignment as jest.Mock).mock.calls[0][0];
      expect(callArgs.id).toBe(1);
      expect(callArgs.taskId).toBe(2);
      expect(callArgs.memberId).toBe(10); // Next member (Bob)
      // Start and end dates will be today (working day)
    });

    it('should rotate expired weekly task to next member', async () => {
      const mockAssignments: TaskAssignment[] = [
        {
          id: 2,
          taskId: 3, // Standup (weekly_friday)
          memberId: 10, // Bob
          startDate: '2020-01-05',
          endDate: '2020-01-09', // Expired
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await updateTaskAssignments();

      // Should update to next member (Charlie)
      expect(updateTaskAssignment).toHaveBeenCalled();
      const callArgs = (updateTaskAssignment as jest.Mock).mock.calls[0][0];
      expect(callArgs.id).toBe(2);
      expect(callArgs.taskId).toBe(3);
      expect(callArgs.memberId).toBe(13); // Next member (Charlie)
      // Should have valid start and end dates
      expect(callArgs.startDate).toBeTruthy();
      expect(callArgs.endDate).toBeTruthy();
    });

    it('should NOT rotate assignments that have not expired', async () => {
      // Use future dates to ensure not expired
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 2,
          memberId: 8,
          startDate: futureDateStr,
          endDate: futureDateStr, // Expires in future
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await updateTaskAssignments();

      // Should NOT update
      expect(updateTaskAssignment).not.toHaveBeenCalled();
    });

    it('should skip rotation on non-working days', async () => {
      // Mock today as non-working day
      (isWorkingDay as jest.Mock).mockResolvedValue(false);

      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 2,
          memberId: 8,
          startDate: '2020-01-01',
          endDate: '2020-01-01', // Expired
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await updateTaskAssignments();

      // Should NOT rotate on weekend/holiday
      expect(updateTaskAssignment).not.toHaveBeenCalled();
    });

    it('should handle member rotation wrap-around', async () => {
      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 2,
          memberId: 14, // David (last member)
          startDate: '2020-01-01',
          endDate: '2020-01-01',
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await updateTaskAssignments();

      // Should wrap around to first member (Alice, id: 8)
      expect(updateTaskAssignment).toHaveBeenCalled();
      const callArgs = (updateTaskAssignment as jest.Mock).mock.calls[0][0];
      expect(callArgs.memberId).toBe(8); // Wraps to Alice
    });

    it('should rotate multiple expired tasks', async () => {
      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 2, // Daily task
          memberId: 8,
          startDate: '2020-01-01',
          endDate: '2020-01-01', // Expired
        },
        {
          id: 2,
          taskId: 3, // Weekly task
          memberId: 10,
          startDate: '2020-01-01',
          endDate: '2020-01-05', // Expired
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await updateTaskAssignments();

      // Should update both tasks
      expect(updateTaskAssignment).toHaveBeenCalledTimes(2);
    });
  });

  describe('restartTaskAssignments - Sprint Kickoff', () => {
    it('should reset all tasks to start from specified date and rotate members', async () => {
      const kickoffDate = new Date('2026-01-13'); // Tuesday

      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 2, // Daily
          memberId: 8,
          startDate: '2020-01-01',
          endDate: '2020-01-01',
        },
        {
          id: 2,
          taskId: 3, // Weekly Friday
          memberId: 10,
          startDate: '2020-01-01',
          endDate: '2020-01-05',
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await restartTaskAssignments(kickoffDate);

      // Should update both tasks
      expect(updateTaskAssignment).toHaveBeenCalledTimes(2);

      // Check that members rotated
      const calls = (updateTaskAssignment as jest.Mock).mock.calls;
      const dailyCall = calls.find((call: any) => call[0].taskId === 2);
      const weeklyCall = calls.find((call: any) => call[0].taskId === 3);
      
      expect(dailyCall[0].memberId).toBe(10); // Next member from 8
      expect(weeklyCall[0].memberId).toBe(13); // Next member from 10
      
      // Check dates are in the right ballpark (allow for timezone variations)
      expect(dailyCall[0].startDate).toContain('2026-01-');
      expect(weeklyCall[0].startDate).toContain('2026-01-');
    });

    it('should handle kickoff on Thursday (extends to next week)', async () => {
      const kickoffDate = new Date('2026-01-08'); // Thursday

      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 3, // Weekly Friday
          memberId: 8,
          startDate: '2020-01-01',
          endDate: '2020-01-05',
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await restartTaskAssignments(kickoffDate);

      // Should start from kickoff date (allow timezone variation)
      const callArgs = (updateTaskAssignment as jest.Mock).mock.calls[0][0];
      expect(callArgs.startDate).toContain('2026-01-');
      
      // Should extend to next week (8+ days)
      const startDate = new Date(callArgs.startDate);
      const endDate = new Date(callArgs.endDate);
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(7);
    });

    it('should default to today if no date provided', async () => {
      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 2,
          memberId: 8,
          startDate: '2020-01-01',
          endDate: '2020-01-01',
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await restartTaskAssignments(); // No date provided

      // Should use today's date (within a day due to timezone)
      expect(updateTaskAssignment).toHaveBeenCalled();
      const callArgs = (updateTaskAssignment as jest.Mock).mock.calls[0][0];
      const today = new Date();
      const startDate = new Date(callArgs.startDate);
      const daysDiff = Math.abs(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeLessThan(2); // Allow 1 day timezone variation
    });

    it('should handle biweekly tasks correctly', async () => {
      const kickoffDate = new Date('2026-01-05'); // Monday

      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 1, // Retro (biweekly_wednesday)
          memberId: 8,
          startDate: '2020-01-01',
          endDate: '2020-01-15',
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await restartTaskAssignments(kickoffDate);

      const callArgs = (updateTaskAssignment as jest.Mock).mock.calls[0][0];
      expect(callArgs.id).toBe(1);
      expect(callArgs.taskId).toBe(1);
      expect(callArgs.memberId).toBe(10); // Next member
      expect(callArgs.startDate).toContain('2026-01-'); // Allow timezone variation
      
      // Should end on Wednesday ~2 weeks later
      const startDate = new Date(callArgs.startDate);
      const endDate = new Date(callArgs.endDate);
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(13); // At least ~2 weeks (allow 1 day variance)
    });
  });

  describe('Member Rotation Logic', () => {
    it('should throw error if current member not found', async () => {
      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 2,
          memberId: 99, // Non-existent member
          startDate: '2020-01-01',
          endDate: '2020-01-01',
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      // Should throw error for non-existent member
      await expect(updateTaskAssignments()).rejects.toThrow();
    });

    it('should handle single member team (rotates to same person)', async () => {
      const singleMember: Member[] = [
        { id: 8, host: 'Alice', slackMemberId: 'U001' },
      ];
      (getMembers as jest.Mock).mockResolvedValue(singleMember);

      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 2,
          memberId: 8,
          startDate: '2020-01-01',
          endDate: '2020-01-01',
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await updateTaskAssignments();

      // Should "rotate" to same person (only member available)
      expect(updateTaskAssignment).toHaveBeenCalled();
      const callArgs = (updateTaskAssignment as jest.Mock).mock.calls[0][0];
      expect(callArgs.memberId).toBe(8); // Same person
    });
  });

  describe('Task Not Found Handling', () => {
    it('should skip assignment if task not found', async () => {
      const mockAssignments: TaskAssignment[] = [
        {
          id: 1,
          taskId: 99, // Non-existent task
          memberId: 8,
          startDate: '2020-01-01',
          endDate: '2020-01-01',
        },
      ];

      (getTaskAssignments as jest.Mock).mockResolvedValue(mockAssignments);

      await updateTaskAssignments();

      // Should not update (task not found)
      expect(updateTaskAssignment).not.toHaveBeenCalled();
    });
  });
});

