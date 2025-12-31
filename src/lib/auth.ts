/**
 * @fileoverview Authentication Utilities
 * 
 * Simple authentication system using JWT tokens stored in HTTP-only cookies.
 * Credentials are validated against environment variables.
 * 
 * Features:
 * - Password verification
 * - JWT token generation and verification
 * - Session management via cookies
 * 
 * @module lib/auth
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/**
 * Secret key for JWT signing (from environment variable)
 */
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

/**
 * Session token name in cookies
 */
const TOKEN_NAME = 'auth-token';

/**
 * Session duration (30 days)
 */
const TOKEN_EXPIRATION = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Validates user credentials against environment variables.
 * 
 * For security, credentials must be stored in environment variables:
 * - AUTH_USERNAME: The valid username
 * - AUTH_PASSWORD: The valid password
 * 
 * @param username - Username to validate
 * @param password - Password to validate
 * @returns true if credentials are valid, false otherwise
 * 
 * @example
 * const isValid = validateCredentials('your-username', 'your-password');
 * if (isValid) {
 *   // Grant access
 * }
 */
export function validateCredentials(username: string, password: string): boolean {
  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (!validUsername || !validPassword) {
    return false;
  }

  return username === validUsername && password === validPassword;
}

/**
 * Creates a JWT token for an authenticated user.
 * 
 * The token contains:
 * - username: The authenticated username
 * - iat: Issued at timestamp
 * - exp: Expiration timestamp (30 days from now)
 * 
 * @param username - Username to encode in the token
 * @returns JWT token string
 * 
 * @example
 * const token = await createToken('admin');
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export async function createToken(username: string): Promise<string> {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRATION}s`)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verifies a JWT token and returns the payload if valid.
 * 
 * @param token - JWT token to verify
 * @returns Decoded token payload if valid, null if invalid/expired
 * 
 * @example
 * const payload = await verifyToken(token);
 * if (payload) {
 *   console.log(`Authenticated user: ${payload.username}`);
 * } else {
 *   console.log('Invalid or expired token');
 * }
 */
export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as { username: string };
  } catch (error) {
    return null;
  }
}

/**
 * Sets the authentication token in an HTTP-only cookie.
 * 
 * Cookie settings:
 * - httpOnly: true (prevents JavaScript access)
 * - secure: true in production (HTTPS only)
 * - sameSite: 'lax' (CSRF protection)
 * - maxAge: 30 days
 * - path: '/' (available on all routes)
 * 
 * @param token - JWT token to store
 * 
 * @example
 * const token = await createToken('admin');
 * setAuthCookie(token);
 * // User is now authenticated for 30 days
 */
export function setAuthCookie(token: string) {
  cookies().set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_EXPIRATION,
    path: '/',
  });
}

/**
 * Retrieves the authentication token from cookies.
 * 
 * @returns JWT token string if present, undefined otherwise
 * 
 * @example
 * const token = getAuthCookie();
 * if (token) {
 *   const payload = await verifyToken(token);
 *   // Check if user is authenticated
 * }
 */
export function getAuthCookie(): string | undefined {
  return cookies().get(TOKEN_NAME)?.value;
}

/**
 * Clears the authentication cookie (logs out the user).
 * 
 * @example
 * clearAuthCookie();
 * // User is now logged out
 */
export function clearAuthCookie() {
  cookies().delete(TOKEN_NAME);
}

/**
 * Checks if the current request is authenticated.
 * 
 * This function:
 * 1. Gets the token from cookies
 * 2. Verifies the token
 * 3. Returns true if valid, false otherwise
 * 
 * @returns Promise<boolean> indicating authentication status
 * 
 * @example
 * // In middleware or API route
 * const isAuth = await isAuthenticated();
 * if (!isAuth) {
 *   return NextResponse.redirect('/login');
 * }
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = getAuthCookie();
  if (!token) return false;

  const payload = await verifyToken(token);
  return payload !== null;
}

