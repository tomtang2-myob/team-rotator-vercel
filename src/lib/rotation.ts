import { Member, Task, TaskAssignment } from '@/types';
import { getMembers, getTasks, getTaskAssignments, updateTaskAssignment } from './db';
import { isWorkingDay } from './holiday';
import { logger } from './logger';

export function getNextDayAfterTargetDay(start: Date, targetDay: number): Date {
  const daysToAdd = (targetDay - start.getDay() + 7) % 7;
  const daysToAddWithExtra = daysToAdd === 0 ? 7 : daysToAdd;
  const targetDate = new Date(start);
  targetDate.setDate(start.getDate() + daysToAddWithExtra);
  return targetDate;
}

async function findNextWorkingDay(fromDate: Date): Promise<Date> {
    const next = new Date(fromDate);
  next.setDate(next.getDate() + 1);
  
  while (!(await isWorkingDay(next))) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}

// Get Monday of the week for a given date
function getMondayOfWeek(date: Date): Date {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - (monday.getDay() - 1 + 7) % 7);
  return monday;
}

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

async function shouldRotateToday(task: Task, today: Date): Promise<boolean> {
  // First check if it's a working day
  if (!(await isWorkingDay(today))) {
    logger.info(`${today.toISOString().split('T')[0]} is not a working day, skipping rotation check`);
    return false;
  }

  // Can proceed with rotation check as long as it's a working day
  return true;
}

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