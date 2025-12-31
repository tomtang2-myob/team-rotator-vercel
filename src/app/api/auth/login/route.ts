/**
 * @fileoverview Login API Route
 *
 * Handles user authentication by validating credentials and creating sessions.
 *
 * Endpoint: POST /api/auth/login
 * Body: { username: string, password: string }
 *
 * On success:
 * - Creates JWT token
 * - Sets HTTP-only cookie
 * - Returns success message
 *
 * On failure:
 * - Returns 401 with error message
 *
 * @module api/auth/login
 */

import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, createToken, setAuthCookie } from "@/lib/auth";
import { logger } from "@/lib/logger";

/**
 * Handles login requests.
 *
 * Process:
 * 1. Parse username and password from request body
 * 2. Validate credentials against environment variables
 * 3. If valid: Create JWT token and set cookie
 * 4. If invalid: Return 401 error
 *
 * @param request - Next.js request object
 * @returns JSON response with success/error message
 *
 * @example
 * // Successful login
 * POST /api/auth/login
 * Response: { "success": true, "message": "Login successful" }
 *
 * @example
 * // Failed login
 * POST /api/auth/login
 * Body: { "username": "wrong", "password": "wrong" }
 * Response: { "error": "Invalid username or password" } (401 status)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      logger.warn("Login attempt with missing credentials");
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Validate credentials
    const isValid = validateCredentials(username, password);

    if (!isValid) {
      logger.warn(`Failed login attempt for username: ${username}`);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create token and set cookie
    const token = await createToken(username);
    setAuthCookie(token);

    logger.info(`Successful login for user: ${username}`);

    return NextResponse.json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    logger.error("Error in login route", { error: String(error) });
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
