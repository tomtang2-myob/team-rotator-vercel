/**
 * @fileoverview Manual Rotation Update API Route
 * 
 * This endpoint allows manual triggering of task rotation via the UI.
 * It's called when the user clicks the "Update Rotation" button on the Dashboard.
 * 
 * Differences from cron job (/api/cron):
 * - This endpoint: Updates assignments only, no notifications
 * - Cron endpoint: Updates assignments + sends Slack notifications
 * 
 * Use cases:
 * - Manual rotation testing
 * - Force rotation outside of schedule
 * - Fixing incorrect assignments
 * - Development/debugging
 * 
 * @see src/services/assignments.ts updateAssignmentsOnly() for logic
 * @see src/app/page.tsx "Update Rotation" button implementation
 * 
 * @example
 * // Manual trigger from frontend
 * const response = await fetch('/api/assignments/update-rotation', {
 *   method: 'POST'
 * });
 * const data = await response.json();
 * // Returns: { message: "Task assignments updated successfully" }
 * 
 * @module api/assignments/update-rotation
 */

import { NextResponse } from 'next/server';
import { updateAssignmentsOnly } from '@/services/assignments';

/**
 * Handles manual rotation update requests.
 * 
 * Updates task assignments without sending Slack notifications.
 * The notification can be sent separately via /api/assignments/send-to-slack.
 * 
 * @returns JSON response with success message or error
 */
export async function POST() {
  try {
    const result = await updateAssignmentsOnly();
    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Error updating task assignments:', error);
    return NextResponse.json(
      { error: 'Failed to update task assignments' },
      { status: 500 }
    );
  }
} 