import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-guard';
import { getResend, getAudienceId, getInnerCircleAudienceId } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AudienceKey = z.enum(['main', 'inner']);

function resolveAudienceId(which: 'main' | 'inner'): string | null {
  if (which === 'inner') return getInnerCircleAudienceId();
  try {
    return getAudienceId();
  } catch {
    return null;
  }
}

const noAudience = () =>
  NextResponse.json({ ok: false, error: 'Audience is not configured' }, { status: 400 });

// -- GET: list contacts + counts ---------------------------------------
export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const which = AudienceKey.catch('main').parse(
    new URL(req.url).searchParams.get('audience'),
  );
  const audienceId = resolveAudienceId(which);
  if (!audienceId) return noAudience();

  const { data, error } = await getResend().contacts.list({ audienceId });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const contacts = (data?.data ?? []).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );
  const subscribed = contacts.filter((c) => !c.unsubscribed).length;

  return NextResponse.json({
    ok: true,
    contacts,
    counts: {
      total: contacts.length,
      subscribed,
      unsubscribed: contacts.length - subscribed,
    },
  });
}

// -- POST: add a contact -----------------------------------------------
const AddBody = z.object({
  audience: AudienceKey,
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: z.infer<typeof AddBody>;
  try {
    body = AddBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', detail: String(err) },
      { status: 400 },
    );
  }
  const audienceId = resolveAudienceId(body.audience);
  if (!audienceId) return noAudience();

  const { data, error } = await getResend().contacts.create({
    audienceId,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    unsubscribed: false,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data?.id });
}

// -- PATCH: toggle subscribed / unsubscribed ---------------------------
const PatchBody = z.object({
  audience: AudienceKey,
  id: z.string().min(1),
  unsubscribed: z.boolean(),
});

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', detail: String(err) },
      { status: 400 },
    );
  }
  const audienceId = resolveAudienceId(body.audience);
  if (!audienceId) return noAudience();

  const { error } = await getResend().contacts.update({
    audienceId,
    id: body.id,
    unsubscribed: body.unsubscribed,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// -- DELETE: remove a contact ------------------------------------------
const DeleteBody = z.object({ audience: AudienceKey, id: z.string().min(1) });

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: z.infer<typeof DeleteBody>;
  try {
    body = DeleteBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', detail: String(err) },
      { status: 400 },
    );
  }
  const audienceId = resolveAudienceId(body.audience);
  if (!audienceId) return noAudience();

  const { error } = await getResend().contacts.remove({ audienceId, id: body.id });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
