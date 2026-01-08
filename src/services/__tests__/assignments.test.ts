/**
 * Tests for assignment services (business logic layer)
 * Tests Slack integration, rotation orchestration, and notification logic
 */

import {
  getSlackMessage,
  kickoffSprint,
  updateAssignmentsOnly,
  sendNotificationOnly,
  updateRotation,
} from '../assignments';
import { getTaskAssignmentsWithDetails, getSystemConfigs, getMembers } from '@/lib/db';
import { updateTaskAssignments, restartTaskAssignments } from '@/lib/rotation';
import { isWorkingDay } from '@/lib/holiday';
import { Member } from '@/types';

// Mock dependencies
jest.mock('@/lib/db');
jest.mock('@/lib/rotation');
jest.mock('@/lib/holiday');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch for Slack API calls
global.fetch = jest.fn();

describe('Assignment Services', () => {
  const mockMembers: Member[] = [
    { id: 8, host: 'Alice', slackMemberId: 'U001' },
    { id: 10, host: 'Bob', slackMemberId: 'U002' },
    { id: 13, host: 'Charlie', slackMemberId: 'U003' },
  ];

  const mockAssignments = [
    {
      id: 1,
      taskId: 1,
      memberId: 8,
      startDate: '2026-01-05',
      endDate: '2026-01-09',
      taskName: 'Standup',
      host: 'Alice',
      slackMemberId: 'U001',
    },
    {
      id: 2,
      taskId: 2,
      memberId: 10,
      startDate: '2026-01-08',
      endDate: '2026-01-08',
      taskName: 'English word',
      host: 'Bob',
      slackMemberId: 'U002',
    },
    {
      id: 3,
      taskId: 3,
      memberId: 13,
      startDate: '2026-01-05',
      endDate: '2026-01-09',
      taskName: 'Retro',
      host: 'Charlie',
      slackMemberId: 'U003',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getMembers as jest.Mock).mockResolvedValue(mockMembers);
    (getTaskAssignmentsWithDetails as jest.Mock).mockResolvedValue(mockAssignments);
    (isWorkingDay as jest.Mock).mockResolvedValue(true);
    (updateTaskAssignments as jest.Mock).mockResolvedValue(undefined);
    (restartTaskAssignments as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getSlackMessage', () => {
    it('should format assignments into Slack message with mentions', async () => {
      const message = await getSlackMessage(mockAssignments);

      expect(message).toContain('Standup: <@U001>');
      expect(message).toContain('Retro: <@U003>');
      expect(message).toBeTruthy();
    });

    it('should handle English word task with 3 lines (Day, Day+1, Day+2)', async () => {
      const message = await getSlackMessage(mockAssignments);

      // Should show current day + next 2 days
      expect(message).toContain('English word: <@U002>'); // Bob
      expect(message).toContain('English word(Day + 1): <@U003>'); // Charlie (next)
      expect(message).toContain('English word(Day + 2): <@U001>'); // Alice (next+1)
    });

    it('should return null for empty assignments', async () => {
      const message = await getSlackMessage([]);

      expect(message).toBeNull();
    });

    it('should sort assignments by ID', async () => {
      const unsortedAssignments = [mockAssignments[2], mockAssignments[0], mockAssignments[1]];
      const message = await getSlackMessage(unsortedAssignments);

      // Should be sorted: ID 1 (Standup), 2 (English word), 3 (Retro)
      const lines = message?.split('\n').filter(l => l.trim());
      expect(lines![0]).toContain('Standup');
      expect(lines![1]).toContain('English word:');
      expect(lines![4]).toContain('Retro');
    });

    it('should handle wrap-around for English word next days', async () => {
      const lastMemberAssignment = [
        {
          id: 2,
          taskId: 2,
          memberId: 13, // Charlie (last member)
          startDate: '2026-01-08',
          endDate: '2026-01-08',
          taskName: 'English word',
          host: 'Charlie',
          slackMemberId: 'U003',
        },
      ];

      const message = await getSlackMessage(lastMemberAssignment);

      expect(message).toContain('English word: <@U003>'); // Charlie
      expect(message).toContain('English word(Day + 1): <@U001>'); // Wraps to Alice
      expect(message).toContain('English word(Day + 2): <@U002>'); // Bob
    });
  });

  describe('updateAssignmentsOnly', () => {
    it('should update assignments without checking working day when checkWorkingDay is false', async () => {
      const result = await updateAssignmentsOnly({ checkWorkingDay: false });

      expect(updateTaskAssignments).toHaveBeenCalled();
      expect(isWorkingDay).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Task assignments updated successfully');
    });

    it('should skip update on non-working day when checkWorkingDay is true', async () => {
      (isWorkingDay as jest.Mock).mockResolvedValue(false);

      const result = await updateAssignmentsOnly({ checkWorkingDay: true });

      expect(updateTaskAssignments).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Not a working day, skipping update');
    });

    it('should update on working day when checkWorkingDay is true', async () => {
      (isWorkingDay as jest.Mock).mockResolvedValue(true);

      const result = await updateAssignmentsOnly({ checkWorkingDay: true });

      expect(isWorkingDay).toHaveBeenCalled();
      expect(updateTaskAssignments).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should use custom date if provided', async () => {
      const customDate = new Date('2026-01-15');

      await updateAssignmentsOnly({ checkWorkingDay: true, date: customDate });

      expect(isWorkingDay).toHaveBeenCalledWith(customDate);
    });

    it('should throw error if update fails', async () => {
      (updateTaskAssignments as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(updateAssignmentsOnly()).rejects.toThrow('DB error');
    });
  });

  describe('kickoffSprint', () => {
    it('should restart assignments from specified date', async () => {
      const sprintDate = new Date('2026-01-13');

      const result = await kickoffSprint(sprintDate);

      expect(restartTaskAssignments).toHaveBeenCalledWith(sprintDate);
      expect(result.success).toBe(true);
      expect(result.message).toContain('2026-01-13');
    });

    it('should handle errors gracefully', async () => {
      (restartTaskAssignments as jest.Mock).mockRejectedValue(new Error('Rotation failed'));

      await expect(kickoffSprint(new Date())).rejects.toThrow('Rotation failed');
    });
  });

  describe('sendNotificationOnly', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
      });

      (getSystemConfigs as jest.Mock).mockResolvedValue([
        {
          key: 'Slack:WebhookUrl',
          value: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL',
          lastModified: '2026-01-01',
          modifiedBy: null,
        },
      ]);
    });

    it('should send Slack notification with current assignments', async () => {
      const result = await sendNotificationOnly();

      expect(getTaskAssignmentsWithDetails).toHaveBeenCalled();
      expect(getSystemConfigs).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/TEST/WEBHOOK/URL',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result.success).toBe(true);
    });

    it('should throw error if webhook URL not configured', async () => {
      (getSystemConfigs as jest.Mock).mockResolvedValue([]);

      await expect(sendNotificationOnly()).rejects.toThrow(
        'Slack webhook URL not configured'
      );
    });

    it('should not throw if Slack API fails (resilient)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // Should not throw, just log error
      const result = await sendNotificationOnly();
      expect(result.success).toBe(true);
    });

    it('should not throw if fetch throws error (resilient)', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Should not throw, just log error
      const result = await sendNotificationOnly();
      expect(result.success).toBe(true);
    });
  });

  describe('updateRotation - Complete Workflow', () => {
    beforeEach(() => {
      (getSystemConfigs as jest.Mock).mockResolvedValue([
        {
          key: 'Slack:WebhookUrl',
          value: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL',
          lastModified: '2026-01-01',
          modifiedBy: null,
        },
      ]);
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    });

    it('should update assignments and send notification on working day', async () => {
      (isWorkingDay as jest.Mock).mockResolvedValue(true);

      const result = await updateRotation();

      expect(isWorkingDay).toHaveBeenCalled();
      expect(updateTaskAssignments).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled(); // Slack notification
      expect(result.message).toBe('Rotation updated and notification sent');
    });

    it('should skip everything on non-working day', async () => {
      (isWorkingDay as jest.Mock).mockResolvedValue(false);

      const result = await updateRotation();

      expect(isWorkingDay).toHaveBeenCalled();
      expect(updateTaskAssignments).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.skipped).toBe(true);
    });

    it('should throw error if update fails', async () => {
      (isWorkingDay as jest.Mock).mockResolvedValue(true);
      (updateTaskAssignments as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(updateRotation()).rejects.toThrow('Update failed');
    });

    it('should throw error if notification fails with missing webhook', async () => {
      (isWorkingDay as jest.Mock).mockResolvedValue(true);
      (getSystemConfigs as jest.Mock).mockResolvedValue([]);

      await expect(updateRotation()).rejects.toThrow(
        'Slack webhook URL not configured'
      );
    });
  });
});

