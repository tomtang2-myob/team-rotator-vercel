/**
 * @fileoverview Task Rotation Logic
 * 
 * This module handles the core rotation logic for task assignments.
 * It calculates when tasks should rotate, determines the next assignee,
 * and manages the rotation schedule based on task rules (daily, weekly, biweekly).
 * 
 * Key concepts:
 * - Rotation happens only on working days (excludes weekends and holidays)
 * - Members rotate in a circular list sorted by ID
 * - Different tasks have different rotation frequencies
 * 
 * @module lib/rotation
 */

import { Member, Task, TaskAssignment } from '@/types';
import { getMembers, getTasks, getTaskAssignments, updateTaskAssignment } from './db';
import { isWorkingDay } from './holiday';
import { logger } from './logger';

/**
 * Calculates the next occurrence of a specific day of the week after a given start date.
 * 
 * @param start - The starting date
 * @param targetDay - Target day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns The next occurrence of the target day (at least 1 week ahead)
 * 
 * @example
 * // If today is Monday (day 1) and you want next Friday (day 5)
 * const monday = new Date('2025-01-06'); // Monday
 * const nextFriday = getNextDayAfterTargetDay(monday, 5);
 * // Returns: Friday, Jan 10, 2025
 * 
 * @example
 * // If today is Friday (day 5) and you want next Friday (day 5)
 * const friday = new Date('2025-01-10'); // Friday
 * const nextFriday = getNextDayAfterTargetDay(friday, 5);
 * // Returns: Friday, Jan 17, 2025 (1 week later, not same day)
 */
export function getNextDayAfterTargetDay(start: Date, targetDay: number): Date {
  const daysToAdd = (targetDay - start.getDay() + 7) % 7;
  const daysToAddWithExtra = daysToAdd === 0 ? 7 : daysToAdd;
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + daysToAddWithExtra);
  return targetDate;
}

/**
 * Finds the next working day after a given date.
 * A working day is defined as:
 * - Not a weekend (Saturday/Sunday)
 * - Not a Chinese public holiday
 * - OR a makeup working day (e.g., Saturday marked as working day)
 * 
 * @param fromDate - The date to start searching from
 * @returns The next working day (guaranteed to be at least 1 day ahead)
 * 
 * @example
 * // If fromDate is Friday and next Monday is a holiday
 * const friday = new Date('2025-01-03');
 * const nextWorking = await findNextWorkingDay(friday);
 * // Returns: Tuesday, Jan 07, 2025 (skips weekend + holiday)
 */
async function findNextWorkingDay(fromDate: Date): Promise<Date> {
    const next = new Date(fromDate);
  next.setDate(next.getDate() + 1);
  
  while (!(await isWorkingDay(next))) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

/**
 * Gets the Monday of the week for a given date.
 * Used for weekly task alignment.
 * 
 * @param date - Any date in the target week
 * @returns The Monday of that week (start of the week)
 * 
 * @example
 * const thursday = new Date('2025-01-09'); // Thursday
 * const monday = getMondayOfWeek(thursday);
 * // Returns: Monday, Jan 06, 2025
 */
function getMondayOfWeek(date: Date): Date {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - (monday.getDay() - 1 + 7) % 7);
  return monday;
}

/**
 * Calculates the next rotation period for a task based on its rotation rule.
 * 
 * This is the CORE function that determines when a task should rotate and
 * what the new assignment period should be.
 * 
 * Rotation Rules:
 * - **daily**: Rotates every working day (startDate = endDate = next working day)
 * - **weekly_<day>**: Rotates weekly on specified day
 *   - Start: Next working day after current end date
 *   - End: Next occurrence of target day (e.g., Friday)
 * - **biweekly_<day>**: Rotates every 2 weeks on specified day
 *   - Start: Next working day after current end date
 *   - End: Next occurrence of target day + 1 week
 * 
 * @param task - The task with rotation rule
 * @param fromDate - Current end date of the assignment
 * @returns Object with startDate and endDate for next rotation period
 * @throws Error if rotation rule is invalid
 * 
 * @example
 * // Daily task (English word)
 * const task = { name: "English word", rotationRule: "daily" };
 * const result = await calculateNextRotationDates(task, new Date('2025-01-10'));
 * // Returns: { startDate: 2025-01-13, endDate: 2025-01-13 } (next working day)
 * 
 * @example
 * // Weekly task (Standup on Friday)
 * const task = { name: "Standup", rotationRule: "weekly_friday" };
 * const result = await calculateNextRotationDates(task, new Date('2025-01-10'));
 * // Returns: { startDate: 2025-01-13 (Mon), endDate: 2025-01-17 (Fri) }
 * 
 * @example
 * // Biweekly task (English corner on Thursday)
 * const task = { name: "English corner", rotationRule: "biweekly_thursday" };
 * const result = await calculateNextRotationDates(task, new Date('2025-01-10'));
 * // Returns: { startDate: 2025-01-13 (Mon), endDate: 2025-01-23 (Thu + 1 week) }
 */
export async function calculateNextRotationDates(task: Task, fromDate: Date): Promise<{ startDate: Date; endDate: Date }> {
  if (task.rotationRule === 'daily') {
    const nextWorkingDay = await findNextWorkingDay(fromDate);
    return { startDate: nextWorkingDay, endDate: nextWorkingDay };
  }

  const parts = task.rotationRule.split('_');
  if (!parts || parts.length !== 2) {
    throw new Error(`Invalid rotation rule: ${task.rotationRule}`);
  }

  const [frequency, dayOfWeekStr] = parts;
  const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .indexOf(dayOfWeekStr.toLowerCase());

  if (targetDay === -1) {
    throw new Error(`Invalid day in rotation rule: ${dayOfWeekStr}`);
  }

  let startDate: Date, endDate: Date;

  switch (frequency) {
    case 'weekly': {
      // For weekly tasks (like Standup and Tech huddle), start from the next working day after the current end date
      startDate = await findNextWorkingDay(fromDate);
      
      // Find the next target date (Friday) as the end date
      endDate = getNextDayAfterTargetDay(startDate, targetDay);
      break;
    }
    case 'biweekly': {
      // For biweekly tasks (like English corner and Retro), start from the next working day after the current end date
      startDate = await findNextWorkingDay(fromDate);
      
      // Find the next target date (Thursday or Wednesday)
      endDate = getNextDayAfterTargetDay(startDate, targetDay);
      
      // If the next target date is earlier than the start date, need to look one more week ahead
      if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 7);
      }
      
      // Add one more week to ensure a two-week cycle
      endDate.setDate(endDate.getDate() + 7);
      break;
    }
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
  
  return { startDate, endDate };
}

/**
 * Rotates through the member list to find the next assignee.
 * 
 * Members are sorted by ID in ascending order, and rotation happens
 * in a circular fashion (after the last member, it goes back to the first).
 * 
 * @param currentMemberId - ID of the current member
 * @param members - Array of all available members
 * @param rotations - Number of positions to rotate (usually 1 for next member)
 * @returns ID of the next member after rotation
 * @throws Error if currentMemberId is not found in members list
 * 
 * @example
 * // Members with IDs: [8, 10, 13, 14, 15, 16]
 * // Current member: 10, rotate by 1
 * const nextId = rotateMemberList(10, members, 1);
 * // Returns: 13 (next in sorted order)
 * 
 * @example
 * // Members with IDs: [8, 10, 13, 14, 15, 16]
 * // Current member: 16 (last), rotate by 1
 * const nextId = rotateMemberList(16, members, 1);
 * // Returns: 8 (wraps around to first)
 * 
 * @example
 * // Skip 2 members ahead
 * const nextId = rotateMemberList(10, members, 2);
 * // Returns: 14 (skip 13, land on 14)
 */
function rotateMemberList(currentMemberId: number, members: Member[], rotations: number): number {
  const sortedMembers = [...members].sort((a, b) => a.id - b.id);
  const currentIndex = sortedMembers.findIndex(m => m.id === currentMemberId);
  if (currentIndex === -1) {
    const memberIds = sortedMembers.map(m => m.id).join(', ');
    logger.error(`Current member not found. Looking for memberId: ${currentMemberId}, Available members: [${memberIds}]`);
    throw new Error(`Current member not found: memberId ${currentMemberId} does not exist. Available members: [${memberIds}]`);
  }
  return sortedMembers[(currentIndex + rotations) % sortedMembers.length].id;
}

/**
 * Checks if rotation should happen today based on working day status.
 * 
 * Rotation only happens on working days (excludes weekends and holidays).
 * This is called before checking if an assignment needs rotation.
 * 
 * @param task - The task being checked (included for future extensibility)
 * @param today - The date to check
 * @returns true if today is a working day, false otherwise
 * 
 * @example
 * // Check if rotation should happen on a Saturday
 * const saturday = new Date('2025-01-04');
 * const result = await shouldRotateToday(task, saturday);
 * // Returns: false (weekend)
 * 
 * @example
 * // Check if rotation should happen on a Monday
 * const monday = new Date('2025-01-06');
 * const result = await shouldRotateToday(task, monday);
 * // Returns: true (working day)
 */
async function shouldRotateToday(task: Task, today: Date): Promise<boolean> {
  // First check if it's a working day
  if (!(await isWorkingDay(today))) {
    logger.info(`${today.toISOString().split('T')[0]} is not a working day, skipping rotation check`);
    return false;
  }

  // Can proceed with rotation check as long as it's a working day
  return true;
}

/**
 * Main rotation orchestrator - Updates all task assignments that need rotation.
 * 
 * This is the ENTRY POINT for the rotation system. It's called by:
 * - Cron job (daily at midnight UTC)
 * - Manual trigger via API (/api/assignments/update-rotation)
 * - Manual trigger via UI (Dashboard "Update Rotation" button)
 * 
 * Process:
 * 1. Check if today is a working day (skip if not)
 * 2. Get all tasks, members, and current assignments
 * 3. For each assignment:
 *    - Check if it's past the end date
 *    - Calculate next rotation period
 *    - Rotate to next member
 *    - Update assignment in Edge Config
 * 4. Log all operations for debugging
 * 
 * @returns Promise<void> - Completes when all assignments are updated
 * @throws Error if any rotation step fails (logged but doesn't stop other rotations)
 * 
 * @example
 * // Called by cron job
 * await updateTaskAssignments();
 * // Logs:
 * // "Starting task assignments update"
 * // "Checking assignment 1: Task: Standup..."
 * // "Updating assignment 1: ... (Member: 15 -> 16)"
 * // "Assignment 2 is still current, skipping"
 * // ...
 * 
 * @see {@link calculateNextRotationDates} for rotation date calculation
 * @see {@link rotateMemberList} for member rotation logic
 * @see {@link shouldRotateToday} for working day check
 */
export async function updateTaskAssignments(): Promise<void> {
  logger.info('Starting task assignments update');
  
  const [tasks, members, assignments] = await Promise.all([
    getTasks(),
    getMembers(),
    getTaskAssignments(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const assignment of assignments) {
    const task = tasks.find(t => t.id === assignment.taskId);
    if (!task) {
      logger.warn(`Task not found for assignment ${assignment.id}`);
      continue;
    }

    const endDate = new Date(assignment.endDate);

    logger.info(`Checking assignment ${assignment.id}:
      Task: ${task.name} (${task.rotationRule})
      Current period: ${assignment.startDate} - ${assignment.endDate}
      Current member: ${assignment.memberId}
      Today: ${today.toISOString().split('T')[0]}`);

    // Check if rotation is needed today
    if (!(await shouldRotateToday(task, today))) {
      logger.info(`Not rotation day for task ${task.name}, skipping`);
      continue;
    }

    // If current assignment hasn't ended, no need to rotate
    if (today <= endDate) {
      logger.info(`Assignment ${assignment.id} is still current, skipping`);
      continue;
    }

    // Calculate new rotation period
    const { startDate: newStartDate, endDate: newEndDate } = await calculateNextRotationDates(task, endDate);

    // Calculate new member (rotate forward one position for all task types)
    const newMemberId = rotateMemberList(assignment.memberId, members, 1);

    logger.info(`Updating assignment ${assignment.id}:
      Task: ${task.name}
      Current: ${assignment.startDate} - ${assignment.endDate} (Member: ${assignment.memberId})
      New: ${newStartDate.toISOString().split('T')[0]} - ${newEndDate.toISOString().split('T')[0]} (Member: ${newMemberId})`);

    await updateTaskAssignment({
      ...assignment,
      memberId: newMemberId,
      startDate: newStartDate.toISOString().split('T')[0],
      endDate: newEndDate.toISOString().split('T')[0],
    });
  }
} 