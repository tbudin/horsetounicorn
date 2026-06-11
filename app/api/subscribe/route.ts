import { NextResponse } from 'next/server';
import { z } from 'zod';
import { render } from '@react-email/components';
import { ConfirmSubscribeEmail } from '@/emails/confirm-subscribe';
import { getEmailFrom, getEmailReplyTo, getResend } from '@/lib/resend';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { signConfirmToken } from '@/lib/subscribe-tokens';

const Body = z.object({
  email: z.string().email(),
  /**
   * Honeypot field — hidden in the form. Bots fill it; humans don't. When
   * filled we silently return success without doing anything.
   */
  company: z.string().optional(),
});

export async function POST(req: Request) {
  // ---- Rate limit ------------------------------------------------------
  const ip = getClientIp(req);
  const rl = rateLimit(`subscribe:${ip}`, { max: 5, windowMs: 15 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Please try again in a few minutes.' },
      { status: 429 },
    );
  }

  // ---- Validation ------------------------------------------------------
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }

  // ---- Honeypot --------------------------------------------------------
  // Silently succeed. Returning ok keeps the bot in the dark and avoids
  // exposing the honeypot's existence.
  if (parsed.company && parsed.company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  // ---- Send the confirmation email -------------------------------------
  // We do NOT add the user to the Resend audience yet — that happens on
  // /api/subscribe/confirm after they prove ownership of the inbox.
  const email = parsed.email.toLowerCase().trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.horsetounicorn.com';
  const token = await signConfirmToken(email);
  const confirmUrl = `${siteUrl}/subscribe/confirm?token=${encodeURIComponent(token)}`;

  const resend = getResend();
  const html = await render(ConfirmSubscribeEmail({ confirmUrl, siteUrl }));

  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to: email,
    subject: 'Confirm your subscription to Horse to Unicorn',
    html,
    replyTo: getEmailReplyTo(),
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: 'Could not send the confirmation email. Try again in a minute?' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, email });
}
