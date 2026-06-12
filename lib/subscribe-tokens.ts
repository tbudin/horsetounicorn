/**
 * Signed tokens for the subscription confirm / unsubscribe links. Use the
 * existing admin session secret as the HMAC key with a dedicated audience
 * claim per token type — this keeps the operational surface small (no new
 * env var) while guaranteeing a confirm token can never be replayed as an
 * admin session or vice versa.
 */
import { SignJWT, jwtVerify } from 'jose';

type TokenPurpose = 'subscribe-confirm' | 'subscribe-unsubscribe';

const CONFIRM_TTL = '14d'; // generous; people don't always check inbox right away
const UNSUB_TTL = '180d';  // months in case someone clicks an old broadcast

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  return new TextEncoder().encode(secret);
}

async function sign(email: string, purpose: TokenPurpose, ttl: string): Promise<string> {
  return new SignJWT({ email: email.toLowerCase().trim() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(purpose)
    .setExpirationTime(ttl)
    .sign(getSecret());
}

async function verify(
  token: string,
  purpose: TokenPurpose,
): Promise<{ ok: true; email: string } | { ok: false; reason: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { audience: purpose });
    if (typeof payload.email !== 'string') {
      return { ok: false, reason: 'Missing email in token' };
    }
    return { ok: true, email: payload.email };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ERR_JWT_EXPIRED') {
      return { ok: false, reason: 'This link has expired. Please subscribe again.' };
    }
    return { ok: false, reason: 'This link is invalid.' };
  }
}

export function signConfirmToken(email: string): Promise<string> {
  return sign(email, 'subscribe-confirm', CONFIRM_TTL);
}

export function verifyConfirmToken(token: string) {
  return verify(token, 'subscribe-confirm');
}

export function signUnsubscribeToken(email: string): Promise<string> {
  return sign(email, 'subscribe-unsubscribe', UNSUB_TTL);
}

export function verifyUnsubscribeToken(token: string) {
  return verify(token, 'subscribe-unsubscribe');
}

// -- Chart-shot tokens ---------------------------------------------------
// Short-lived tokens that let the screenshot pipeline reach the (otherwise
// public) /chart-shot render route for exactly one article+chart. Same secret,
// dedicated 'chart-shot' audience so they can't be replayed elsewhere.

const CHART_SHOT_TTL = '5m';

/** `key` is `${articleId}:${chartName}`. */
export function signChartShotToken(key: string): Promise<string> {
  return new SignJWT({ sub: key })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience('chart-shot')
    .setExpirationTime(CHART_SHOT_TTL)
    .sign(getSecret());
}

export async function verifyChartShotToken(token: string, key: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { audience: 'chart-shot' });
    return payload.sub === key;
  } catch {
    return false;
  }
}
