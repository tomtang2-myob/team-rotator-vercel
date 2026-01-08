/**
 * @fileoverview Sprint Kickoff API Route
 * 
 * This endpoint allows kicking off a new sprint from a specified date.
 * It's called when the user clicks the "Kick Off Sprint" button on the Dashboard.
 * 
 * Use cases:
 * - Sprint extended to 3 weeks due to public holidays
 * - Starting a new sprint from a specific date
 * - Manual reset of rotation schedule
 * 
 * Differences from update-rotation:
 * - update-rotation: Only rotates assignments that have ended
 * - restart-rotation: Resets ALL assignments to start from a specified date
 * 
 * @see src/services/assignments.ts kickoffSprint() for logic
 * @see src/app/page.tsx "Kick Off Sprint" button implementation
 * 
 * @example
 * // Manual trigger from frontend with a specific date
 * const response = await fetch('/api/assignments/restart-rotation', {
 *   method: 'POST',
 *   body: JSON.stringify({ startDate: '2026-01-13' })
 * });
 * const data = await response.json();
 * // Returns: { message: "Sprint kicked off successfully from 2026-01-13" }
 * 
 * @module api/assignments/restart-rotation
 */

import { NextResponse } from 'next/server';
import { kickoffSprint } from '@/services/assignments';

/**
 * Handles sprint kickoff requests.
 * 
 * Resets all task assignments to start from the specified date with fresh rotation periods.
 * Current members are preserved - only the dates are reset.
 * 
 * @param request - Request with optional startDate in body
 * @returns JSON response with success message or error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Fix timezone issue: Parse date string as local date, not UTC
    let startDate: Date;
    if (body.startDate) {
      // Parse YYYY-MM-DD as local date to avoid timezone shift
      const [year, month, day] = body.startDate.split('-').map(Number);
      startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      startDate = new Date();
    }
    
    const result = await kickoffSprint(startDate);
    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Error kicking off sprint:', error);
    return NextResponse.json(
      { error: 'Failed to kick off sprint' },
      { status: 500 }
    );
  }
}

