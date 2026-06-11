import { SignJWT, jwtVerify } from 'jose';

/**
 * Single-password admin auth.
 *
 * Flow:
 *   - User POSTs password to /api/admin/login.
 *   - We constant-time-compare to ADMIN_PASSWORD env var.
 *   - On match, sign a JWT with the role 'admin' and set an httpOnly
 *     cookie.
 *   - Middleware checks the cookie on every /admin/* request.
 *
 * Two env vars are required:
 *   ADMIN_PASSWORD          — the password to log in
 *   ADMIN_SESSION_SECRET    — 32+ random bytes for HMAC signing
 *
 * Generate the secret with: `openssl rand -hex 32`
 */
export const ADMIN_COOKIE = 'horse_admin_session';
const ALG = 'HS256';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET is not set or too short. Set a 32+ byte hex string.',
    );
  }
  return new TextEncoder().encode(secret);
}

export interface AdminSession {
  role: 'admin';
  /** Unix epoch seconds. */
  exp: number;
  /** Unix epoch seconds. */
  iat: number;
}

/** Verify the admin password by constant-time comparison. */
export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (input.length !== expected.length) return false;
  // Constant-time compare to avoid timing oracles.
  let diff = 0;
  for (let i = 0; i < input.length; i++) {
    diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function signSession(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify<AdminSession>(token, getSecretKey(), {
      algorithms: [ALG],
    });
    if (payload.role !== 'admin') return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_TTL = SESSION_TTL_SECONDS;
