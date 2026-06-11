import { NextResponse } from 'next/server';
import { render } from '@react-email/components';
import { WelcomeEmail } from '@/emails/welcome';
import { getAudienceId, getEmailFrom, getEmailReplyTo, getResend } from '@/lib/resend';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { signUnsubscribeToken, verifyConfirmToken } from '@/lib/subscribe-tokens';

/**
 * Final confirmation step of double opt-in. The page at /subscribe/confirm
 * POSTs the token to this endpoint after the user clicks the link in the
 * confirmation email. Idempotent — repeated confirmations are no-ops.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`confirm:${ip}`, { max: 20, windowMs: 15 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Please try again in a few minutes.' },
      { status: 429 },
    );
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 });
  }
  const token = body.token;
  if (typeof token !== 'string' || token.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Missing confirmation token.' },
      { status: 400 },
    );
  }

  const result = await verifyConfirmToken(token);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  }
  const email = result.email;

  // Add the user to the Resend audience. `contacts.create` is idempotent on
  // the (audience, email) pair — second call returns the existing contact.
  const resend = getResend();
  const audienceId = getAudienceId();
  const created = await resend.contacts.create({
    audienceId,
    email,
    unsubscribed: false,
  });

  if (created.error && !isAlreadyExists(created.error)) {
    return NextResponse.json(
      { ok: false, error: 'Could not finish subscribing. Try again in a minute?' },
      { status: 500 },
    );
  }

  type Outcome = 'new' | 'resubscribed' | 'already-confirmed';
  let outcome: Outcome = 'new';

  // If the contact already exists, fetch them so we can tell whether they
  // were unsubscribed and we just re-subscribed them.
  if (isAlreadyExists(created.error)) {
    let wasUnsubscribed = false;
    try {
      const got = await resend.contacts.get({ audienceId, email });
      wasUnsubscribed = !!got.data?.unsubscribed;
    } catch {
      // Best-effort — fall back to 'already-confirmed' if we can't read.
    }
    try {
      await resend.contacts.update({ audienceId, email, unsubscribed: false });
    } catch {
      // Non-fatal — they're either still subscribed or will be next attempt.
    }
    outcome = wasUnsubscribed ? 'resubscribed' : 'already-confirmed';
  }

  // Send the welcome email only the first time. Returning subscribers and
  // already-confirmed ones don't get spammed.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.horsetounicorn.com';
  const unsubToken = await signUnsubscribeToken(email);
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${encodeURIComponent(unsubToken)}`;

  if (outcome === 'new') {
    const html = await render(WelcomeEmail({ siteUrl, unsubscribeUrl }));
    await resend.emails.send({
      from: getEmailFrom(),
      to: email,
      subject: 'Welcome to Horse to Unicorn',
      html,
      replyTo: getEmailReplyTo(),
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
  }

  return NextResponse.json({ ok: true, email, outcome });
}

function isAlreadyExists(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const message = String((err as { message?: unknown }).message ?? '').toLowerCase();
  return message.includes('already') || message.includes('exists');
}
