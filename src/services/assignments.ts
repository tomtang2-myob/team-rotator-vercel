/**
 * @fileoverview Assignment Business Logic and Slack Integration
 * 
 * This module orchestrates the rotation workflow and Slack notifications.
 * It's the high-level business logic layer that coordinates between:
 * - Database operations (src/lib/db.ts)
 * - Rotation calculations (src/lib/rotation.ts)
 * - Holiday checking (src/lib/holiday.ts)
 * - Slack API
 * 
 * Key Functions:
 * - updateRotation(): Complete rotation workflow (update + notify)
 * - updateAssignmentsOnly(): Update assignments without notification
 * - sendNotificationOnly(): Send Slack notification without updating
 * - getSlackMessage(): Format assignment data for Slack
 * 
 * Called by:
 * - Cron job (/api/cron/route.ts)
 * - Manual trigger (/api/assignments/update-rotation/route.ts)
 * - Slack send button (/api/assignments/send-to-slack/route.ts)
 * 
 * @module services/assignments
 */

import { getTaskAssignmentsWithDetails, getSystemConfigs, getMembers } from '@/lib/db';
import { updateTaskAssignments } from '@/lib/rotation';
import { isWorkingDay } from '@/lib/holiday';
import { Member } from '@/types';
import { logger } from '@/lib/logger';

/**
 * Slack message structure
 * Supports both simple text and rich formatting (blocks)
 */
export interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text: {
      type: string;
      text: string;
    };
  }>;
}

/**
 * Formats task assignments into a Slack message with @mentions.
 * 
 * Special handling:
 * - "English word" task shows 3 lines: Day, Day+1, Day+2
 * - All other tasks show 1 line each
 * - Uses Slack mention format: <@SLACK_USER_ID>
 * - Sorted by assignment ID for consistency
 * 
 * @param assignments - Task assignments with member and task details
 * @returns Formatted Slack message string, or null if no assignments
 * 
 * @example
 * const assignments = await getTaskAssignmentsWithDetails();
 * const message = await getSlackMessage(assignments);
 * // Returns:
 * // "Retro: <@U07F4TG8U8H>
 * // English word: <@U02JX33H8SY>
 * // English word(Day + 1): <@U07RYCVJWQ2>
 * // English word(Day + 2): <@U0866J4E4RF>
 * // Standup: <@U07F4TGYYYY>
 * // Tech huddle: <@U02DXJXJXJX>
 * // English corner: <@U07KXEKEKEK>"
 * 
 * @example
 * // Empty assignments
 * const message = await getSlackMessage([]);
 * // Returns: null
 */
export async function getSlackMessage(assignments: any[]) {
  if (!assignments || assignments.length === 0) {
    return null;
  }

  // Get all members and sort by ID
  const allMembers = await getMembers();
  const sortedMembers = allMembers.sort((a, b) => a.id - b.id);

  // Sort by ID
  const sortedAssignments = assignments.sort((a, b) => a.id - b.id);
  const messageBuilder = [];

  for (const assignment of sortedAssignments) {
    messageBuilder.push(`${assignment.taskName}: <@${assignment.slackMemberId}>\n`);

    // Special handling for English word task
    if (assignment.taskName === "English word") {
      const currentMemberIndex = sortedMembers.findIndex(m => m.id === assignment.memberId);
      if (currentMemberIndex !== -1) {
        const nextOneMember = sortedMembers[(currentMemberIndex + 1) % sortedMembers.length];
        const nextTwoMember = sortedMembers[(currentMemberIndex + 2) % sortedMembers.length];

        messageBuilder.push(`English word(Day + 1): <@${nextOneMember.slackMemberId}>\n`);
        messageBuilder.push(`English word(Day + 2): <@${nextTwoMember.slackMemberId}>\n`);
      }
    }
  }

  return messageBuilder.join('');
}

/**
 * Sends a message to Slack via webhook.
 * 
 * This function is resilient - it logs errors but doesn't throw them,
 * so a Slack failure won't break the rotation process.
 * 
 * The webhook URL is configured in the Settings page and stored in Edge Config.
 * 
 * @param webhookUrl - Slack incoming webhook URL
 * @param message - Message text (plain string or JSON string)
 * @returns Promise that resolves when send completes (success or failure)
 * 
 * @example
 * // Send simple text message
 * await sendToSlack(
 *   'https://hooks.slack.com/services/...',
 *   'Rotation updated!'
 * );
 * 
 * @example
 * // Send formatted message (will be wrapped in JSON)
 * const message = await getSlackMessage(assignments);
 * await sendToSlack(webhookUrl, message);
 * 
 * @see {@link https://api.slack.com/messaging/webhooks|Slack Webhook Docs}
 */
export async function sendToSlack(webhookUrl: string, message: string) {
  try {
    logger.info('Sending notification to Slack...');
    const messageBody = typeof message === 'string' && !message.startsWith('{') 
      ? JSON.stringify({ text: message })
      : message;
    
    logger.info(`Sending Slack message with message body: ${messageBody}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: messageBody,
    });

    if (!response.ok) {
      const error = `Failed to send Slack message. Status: ${response.status}`;
      logger.error(error);
      // Don't throw error, just log it
      return;
    }

    logger.info('Successfully sent message to Slack');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error sending to Slack';
    logger.error(`Error in sendToSlack: ${errorMessage}`);
    // Don't throw error, just log it
    return;
  }
}

/**
 * Updates task assignments without sending Slack notifications.
 * 
 * This is useful for:
 * - Testing rotation logic without spamming Slack
 * - Manual assignment updates via API
 * - Batch operations where notification comes later
 * 
 * Options:
 * - checkWorkingDay: If true, skips update on weekends/holidays
 * - date: Custom date for rotation (defaults to today)
 * 
 * @param options - Configuration options
 * @returns Result object with success flag and message
 * 
 * @example
 * // Update only if it's a working day
 * const result = await updateAssignmentsOnly({ 
 *   checkWorkingDay: true 
 * });
 * // Returns: { success: true, message: 'Task assignments updated successfully' }
 * // OR: { success: true, message: 'Not a working day, skipping update' }
 * 
 * @example
 * // Force update regardless of working day
 * const result = await updateAssignmentsOnly({ 
 *   checkWorkingDay: false 
 * });
 * 
 * @example
 * // Update for a specific date
 * const result = await updateAssignmentsOnly({ 
 *   checkWorkingDay: true,
 *   date: new Date('2025-12-31')
 * });
 * 
 * @see {@link updateTaskAssignments} Core rotation logic
 */
export async function updateAssignmentsOnly(options: { 
  checkWorkingDay?: boolean,
  date?: Date
} = {}) {
  const { checkWorkingDay = false, date = new Date() } = options;

  try {
    // Check if it's a working day (if needed)
    if (checkWorkingDay && !await isWorkingDay(date)) {
      logger.info(`${date.toISOString().split('T')[0]} is not a working day. Skipping member rotation.`);
      return { success: true, message: 'Not a working day, skipping update' };
    }

    // Update task assignments
    await updateTaskAssignments();
    return { success: true, message: 'Task assignments updated successfully' };
  } catch (error) {
    console.error('Error in updateAssignmentsOnly:', error);
    throw error;
  }
}

/**
 * Sends Slack notification for current assignments without updating them.
 * 
 * This is useful for:
 * - Manual notification sending via "Send to Slack" button
 * - Re-sending notifications after Slack failure
 * - Sending notifications without triggering rotation
 * 
 * The function:
 * 1. Fetches current assignments with details
 * 2. Formats them into a Slack message
 * 3. Gets webhook URL from system config
 * 4. Sends to Slack
 * 
 * @returns Result object with success flag and message
 * @throws Error if webhook URL is not configured
 * 
 * @example
 * // Send notification for current assignments
 * const result = await sendNotificationOnly();
 * // Returns: { success: true, message: 'Notifications sent successfully' }
 * 
 * @example
 * // Handle missing webhook URL
 * try {
 *   await sendNotificationOnly();
 * } catch (error) {
 *   console.error('Webhook not configured!');
 * }
 * 
 * @see {@link getSlackMessage} Message formatting
 * @see {@link sendToSlack} Slack API integration
 */
export async function sendNotificationOnly() {
  try {
    logger.info('Getting task assignments...');
    const assignments = await getTaskAssignmentsWithDetails();
    logger.info(`Found ${assignments.length} assignments`);

    const messageText = await getSlackMessage(assignments);
    logger.info(`Generated Slack message: ${!!messageText}`);
    
    if (messageText) {
      logger.info('Sending notification to Slack...');
      const configs = await getSystemConfigs();
      const webhookConfig = configs.find(c => c.key === 'Slack:WebhookUrl');
      const webhookUrl = webhookConfig?.value;
      
      if (!webhookUrl) {
        throw new Error('Slack webhook URL not configured');
      }
      
      await sendToSlack(webhookUrl, messageText);
      logger.info('Notification sent successfully');
    }

    return { success: true, message: 'Notifications sent successfully' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error in sendNotificationOnly: ${errorMessage}`);
    throw error;
  }
}

/**
 * Complete rotation workflow: Update assignments + Send notifications.
 * 
 * This is the MAIN ENTRY POINT for the rotation system. It combines:
 * 1. Working day check
 * 2. Assignment update (via updateAssignmentsOnly)
 * 3. Slack notification (via sendNotificationOnly)
 * 
 * Called by:
 * - Cron job: Daily at midnight UTC (/api/cron/route.ts)
 * - Manual trigger: "Update Rotation" button (/api/assignments/update-rotation/route.ts)
 * 
 * Process Flow:
 * ```
 * Check working day
 *   ├─ Not working day → Skip (return early)
 *   └─ Working day → Continue
 *       ├─ Update assignments
 *       └─ Send Slack notification
 * ```
 * 
 * @returns Result object with status, message, and details
 * @throws Error if update or notification fails
 * 
 * @example
 * // Normal rotation (called by cron)
 * const result = await updateRotation();
 * // Returns:
 * // {
 * //   message: 'Rotation updated and notification sent',
 * //   updateResult: { success: true, message: '...' },
 * //   notificationResult: { success: true, message: '...' }
 * // }
 * 
 * @example
 * // Skipped on weekend
 * const result = await updateRotation(); // Called on Saturday
 * // Returns:
 * // {
 * //   message: 'Not a working day, skipping update',
 * //   skipped: true
 * // }
 * 
 * @example
 * // Manual trigger from API
 * POST /api/assignments/update-rotation
 * → calls updateRotation()
 * → returns JSON response
 * 
 * @see {@link updateAssignmentsOnly} Assignment update logic
 * @see {@link sendNotificationOnly} Notification sending
 */
export async function updateRotation() {
  logger.info('Starting rotation update process...');
  try {
    const today = new Date();
    logger.info(`Checking rotation for date: ${today.toISOString().split('T')[0]}`);
    
    // First update task assignments
    const updateResult = await updateAssignmentsOnly({ 
      checkWorkingDay: true,
      date: today
    });

    // If not a working day, return directly
    if (updateResult.message === 'Not a working day, skipping update') {
      logger.info('Not a working day, skipping update');
      return { message: updateResult.message, skipped: true };
    }

    logger.info('Assignments updated successfully, sending notification...');
    // Then send notifications
    const notificationResult = await sendNotificationOnly();
    
    logger.info('Rotation update completed successfully');
    return { 
      message: 'Rotation updated and notification sent',
      updateResult,
      notificationResult
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in updateRotation: ${errorMessage}`);
    throw error;
  }
} 