/**
 * @fileoverview Cron Job API Route
 * 
 * This endpoint is automatically called by Vercel's cron scheduler daily at midnight UTC.
 * It triggers the complete rotation workflow (update assignments + send notifications).
 * 
 * Schedule: Configured in vercel.json as "0 0 * * *" (midnight UTC)
 * 
 * What it does:
 * 1. Checks if today is a working day
 * 2. Updates task assignments (rotates members)
 * 3. Sends Slack notifications
 * 4. Logs all operations with unique request ID
 * 
 * Can also be triggered manually:
 * - GET /api/cron (via browser or curl)
 * - Vercel Dashboard → Functions → Run
 * 
 * Configuration:
 * - dynamic = 'force-dynamic': Prevents caching, ensures fresh execution
 * - maxDuration = 60: Allows up to 60 seconds for completion
 * 
 * @see vercel.json for cron configuration
 * @see src/services/assignments.ts updateRotation() for core logic
 * 
 * @example
 * // Automatic trigger (by Vercel cron)
 * // No action needed - runs daily at midnight UTC
 * 
 * @example
 * // Manual trigger
 * curl https://your-app.vercel.app/api/cron
 * // Returns:
 * // {
 * //   "message": "Cron job executed successfully",
 * //   "requestId": "abc123",
 * //   "executionTime": "2025-12-30T00:00:00.000Z",
 * //   "result": { ... }
 * // }
 * 
 * @module api/cron
 */

import { NextResponse } from 'next/server';
import { updateRotation } from '@/services/assignments';
import { logger } from '@/lib/logger';

/**
 * Prevent caching and ensure the function runs on every request
 * This is critical for cron jobs to work correctly
 */
export const dynamic = 'force-dynamic';

/**
 * Maximum execution time in seconds
 * Allows time for: API calls, database operations, and Slack notification
 */
export const maxDuration = 60;

/**
 * Cron job handler - Executes daily rotation workflow.
 * 
 * This is the entry point for automated task rotation.
 * Vercel calls this endpoint daily based on the schedule in vercel.json.
 * 
 * Process:
 * 1. Generate unique request ID for tracking
 * 2. Log execution context (time, environment)
 * 3. Call updateRotation() service
 * 4. Log results (success or failure)
 * 5. Return JSON response
 * 
 * @returns JSON response with execution status and result
 */
export async function GET() {
  try {
    // Add request ID for tracking
    const requestId = Math.random().toString(36).substring(7);
    logger.info(`[${requestId}] Starting cron job for rotation update...`);
    
    // Log the current time and environment
    logger.info(`[${requestId}] Execution time: ${new Date().toISOString()}`);
    logger.info(`[${requestId}] Environment: ${process.env.VERCEL_ENV || 'local'}`);
    
    // Execute rotation
    const result = await updateRotation();
    
    // Log detailed results
    logger.info(`[${requestId}] Rotation update completed with result: ${JSON.stringify(result)}`);
    
    return NextResponse.json({ 
      message: 'Cron job executed successfully', 
      requestId,
      executionTime: new Date().toISOString(),
      result 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Cron job failed: ${errorMessage}`);
    if (error instanceof Error && error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 