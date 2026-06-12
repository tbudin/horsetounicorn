import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySession, type AdminSession } from './admin-auth';

/**
 * Route-handler admin guard. The middleware only protects PAGE routes — it
 * deliberately excludes `/api/*` so token-gated endpoints can exist — so every
 * admin API route must verify the session itself.
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;     // 401 JSON
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? '';
  return token ? verifySession(token) : null;
}

/** Returns a 401 response when not authenticated, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getAdminSession();
  if (session) return null;
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}
