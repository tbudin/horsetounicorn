import { NextResponse } from 'next/server';
import { z } from 'zod';
import { render } from '@react-email/components';
import { WelcomeEmail } from '@/emails/welcome';
import { getAudienceId, getEmailFrom, getEmailReplyTo, getResend } from '@/lib/resend';

const Body = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }

  const resend = getResend();
  const audienceId = getAudienceId();
  const from = getEmailFrom();
  const replyTo = getEmailReplyTo();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';

  // Idempotent: Resend's contacts.create returns the existing contact if the
  // email already exists in the audience. We treat success and "already a
  // contact" identically — both are good outcomes for the user.
  const { error } = await resend.contacts.create({
    audienceId,
    email: parsed.email,
    unsubscribed: false,
  });

  // If they're new, send the welcome email. If they were already subscribed,
  // don't spam them — but still return ok.
  if (!error) {
    const html = await render(WelcomeEmail({ siteUrl }));
    await resend.emails.send({
      from,
      to: parsed.email,
      subject: 'Welcome to Horse to Unicorn',
      html,
      replyTo,
    });
  } else if (!isAlreadyExists(error)) {
    return NextResponse.json(
      { ok: false, error: 'Could not subscribe right now. Try again in a minute?' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

function isAlreadyExists(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const message = String((err as { message?: unknown }).message ?? '').toLowerCase();
  return message.includes('already') || message.includes('exists');
}
