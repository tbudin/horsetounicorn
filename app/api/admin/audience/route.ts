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
  const audiences = raw.map((a) => ({ id: a.id, name: a.name }));

  return NextResponse.json({
    ok: true,
    audiences,
    mainId: process.env.RESEND_AUDIENCE_ID ?? null,
    innerId: process.env.RESEND_INNER_CIRCLE_AUDIENCE_ID ?? null,
  });
}
