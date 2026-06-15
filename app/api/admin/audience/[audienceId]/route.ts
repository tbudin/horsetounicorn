import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-guard';
import { getResend } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function badId() {
  return NextResponse.json({ ok: false, error: 'Invalid audience id' }, { status: 400 });
}

// -- GET: contacts + counts --------------------------------------------
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ audienceId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { audienceId } = await params;
  if (!UUID.test(audienceId)) return badId();

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
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ audienceId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { audienceId } = await params;
  if (!UUID.test(audienceId)) return badId();

  let body: z.infer<typeof AddBody>;
  try {
    body = AddBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', detail: String(err) },
      { status: 400 },
    );
  }

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
const PatchBody = z.object({ id: z.string().min(1), unsubscribed: z.boolean() });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ audienceId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { audienceId } = await params;
  if (!UUID.test(audienceId)) return badId();

  let body: z.infer<typeof PatchBody>;
  try {
    body = PatchBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', detail: String(err) },
      { status: 400 },
    );
  }

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
const DeleteBody = z.object({ id: z.string().min(1) });

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ audienceId: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { audienceId } = await params;
  if (!UUID.test(audienceId)) return badId();

  let body: z.infer<typeof DeleteBody>;
  try {
    body = DeleteBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', detail: String(err) },
      { status: 400 },
    );
  }

  const { error } = await getResend().contacts.remove({ audienceId, id: body.id });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
