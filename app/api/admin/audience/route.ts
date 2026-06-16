import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { getResend } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResendAudience {
  id: string;
  name: string;
}

// -- GET: list every audience in the Resend account --------------------
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await getResend().audiences.list();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const raw = (data as unknown as { data?: ResendAudience[] })?.data ?? [];
  const mainId = process.env.RESEND_AUDIENCE_ID ?? null;
  const innerId = process.env.RESEND_INNER_CIRCLE_AUDIENCE_ID ?? null;

  // Subscribers (main) first, then inner-circle, then the rest.
  const rank = (id: string) => (id === mainId ? 0 : id === innerId ? 1 : 2);
  const audiences = raw
    .map((a) => ({ id: a.id, name: a.name }))
    .sort((a, b) => rank(a.id) - rank(b.id));

  return NextResponse.json({ ok: true, audiences, mainId, innerId });
}
