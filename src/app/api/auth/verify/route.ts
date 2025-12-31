/**
 * @fileoverview Token Verification API Route
 * 
 * Verifies if the current auth token is valid.
 * Used by the client-side auth hook.
 * 
 * Endpoint: GET /api/auth/verify
 * 
 * @module api/auth/verify
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

/**
 * JWT Secret for token verification
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
  return new TextEncoder().encode(secret);
}

/**
 * Verifies the current auth token.
 * 
 * @returns 200 if valid, 401 if invalid or missing
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      console.log('[Auth Verify] No token found');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    if (payload.username) {
      console.log(`[Auth Verify] Valid token for: ${payload.username}`);
      return NextResponse.json({
        authenticated: true,
        username: payload.username,
      });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (error) {
    console.log('[Auth Verify] Token verification failed:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

