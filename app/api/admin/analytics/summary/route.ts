import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { hogql, posthogQueryConfigured } from '@/lib/posthog-query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SummaryRow {
  total_opens: number;
  total_reads: number;
  readers: number;
  identified: number;
}

/** Totals across the last 90 days. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!posthogQueryConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }

  let rows: SummaryRow[] | null;
  try {
    rows = await hogql<SummaryRow>(`
      SELECT
        countIf(event = 'email_opened') AS total_opens,
        countIf(event = '$pageview' AND properties.$pathname LIKE '/articles/%') AS total_reads,
        uniqIf(person_id, event = '$pageview' AND properties.$pathname LIKE '/articles/%') AS readers,
        uniqIf(person_id, person.properties.email IS NOT NULL) AS identified
      FROM events
      WHERE timestamp > now() - INTERVAL 90 DAY
    `);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 502 },
    );
  }

  const r = rows?.[0];
  return NextResponse.json({
    ok: true,
    configured: true,
    summary: {
      opens: Number(r?.total_opens) || 0,
      reads: Number(r?.total_reads) || 0,
      readers: Number(r?.readers) || 0,
      identified: Number(r?.identified) || 0,
    },
  });
}
