import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { hogql, posthogQueryConfigured } from '@/lib/posthog-query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MemberRow {
  email: string;
  opens: number;
  reads: number;
  last_seen: string | null;
}

/**
 * Per-subscriber engagement, keyed by email (the distinct id we identify with).
 * Grouped by the person's email property so anonymous-then-identified sessions
 * merge correctly.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!posthogQueryConfigured()) {
    return NextResponse.json({ ok: true, configured: false, members: {} });
  }

  let rows: MemberRow[] | null;
  try {
    rows = await hogql<MemberRow>(`
      SELECT
        person.properties.email AS email,
        countIf(event = 'email_opened') AS opens,
        countIf(event = '$pageview' AND properties.$pathname LIKE '/articles/%') AS reads,
        max(timestamp) AS last_seen
      FROM events
      WHERE person.properties.email IS NOT NULL AND timestamp > now() - INTERVAL 365 DAY
      GROUP BY email
      LIMIT 5000
    `);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 502 },
    );
  }

  const members: Record<string, { opens: number; reads: number; lastSeen: string | null }> = {};
  for (const r of rows ?? []) {
    if (!r.email) continue;
    members[String(r.email).toLowerCase()] = {
      opens: Number(r.opens) || 0,
      reads: Number(r.reads) || 0,
      lastSeen: r.last_seen ?? null,
    };
  }
  return NextResponse.json({ ok: true, configured: true, members });
}
