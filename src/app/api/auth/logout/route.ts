/**
 * @fileoverview Logout API Route
 * 
 * Handles user logout by clearing the authentication cookie.
 * 
 * Endpoint: POST /api/auth/logout
 * 
 * @module api/auth/logout
 */

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Handles logout requests.
 * 
 * Process:
 * 1. Clear the authentication cookie
 * 2. Return success message
 * 
 * @returns JSON response confirming logout
 * 
 * @example
 * POST /api/auth/logout
 * Response: { "success": true, "message": "Logout successful" }
 */
export async function POST() {
  try {
    clearAuthCookie();
    logger.info('User logged out successfully');

    // Create response with cleared cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    // Explicitly clear the auth cookie in the response
    response.cookies.set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('Error in logout route', { error: String(error) });
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}

