import { NextResponse } from 'next/server';
import { getAudienceId, getResend } from '@/lib/resend';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { verifyUnsubscribeToken } from '@/lib/subscribe-tokens';

/**
 * Mark the holder of a valid unsubscribe token as unsubscribed in Resend.
 * Hit by /unsubscribe page (POST) and supports POST from email clients
 * that honour the `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
 * header (Gmail's one-click unsubscribe button).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`unsubscribe:${ip}`, { max: 20, windowMs: 15 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Please try again in a few minutes.' },
      { status: 429 },
    );
  }

  // Token can come as JSON body (from our page) or as a query param when an
  // email client one-click POSTs the URL directly.
  let token: string | undefined;
  const url = new URL(req.url);
  const queryToken = url.searchParams.get('token');
  if (queryToken) {
    token = queryToken;
  } else {
    try {
      const body = (await req.json()) as { token?: string };
      token = body.token;
    } catch {
      /* ignore — handled below */
    }
  }
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'Missing unsubscribe token.' },
      { status: 400 },
    );
  }

  const result = await verifyUnsubscribeToken(token);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  }

  try {
    await getResend().contacts.update({
      audienceId: getAudienceId(),
      email: result.email,
      unsubscribed: true,
    });
  } catch {
    // Don't surface a 500 — from the user's perspective they unsubscribed,
    // and if the Resend call failed we'll retry on a future broadcast send
    // anyway. Returning ok prevents confusing them with a "try again" loop.
  }

  return NextResponse.json({ ok: true, email: result.email });
}
