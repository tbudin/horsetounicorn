/**
 * Stripe webhook. Stripe fires `checkout.session.completed` events on every
 * successful Payment Link checkout (the "buy me a coffee" flow). We verify
 * the signature, pull the donor's email + amount, and send a thank-you
 * email via Resend.
 *
 * Required env:
 *   STRIPE_SECRET_KEY        — Stripe restricted key. Only needs the
 *                              `Checkout Sessions: Read` and `Customers: Read`
 *                              permissions for this endpoint to work.
 *   STRIPE_WEBHOOK_SECRET    — Signing secret shown when you create the
 *                              webhook endpoint on the Stripe dashboard.
 *                              Starts with `whsec_…`.
 *
 * Setup:
 *   1. Stripe Dashboard → Developers → Webhooks → Add endpoint
 *      URL:    https://www.horsetounicorn.com/api/webhooks/stripe
 *      Events: checkout.session.completed
 *   2. Stripe shows the signing secret once — paste into STRIPE_WEBHOOK_SECRET.
 *   3. Add STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET to Vercel env (Production
 *      + Preview) and to your local .env if you want to test with the Stripe
 *      CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`).
 */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { render } from '@react-email/components';
import { DonationThanksEmail } from '@/emails/donation-thanks';
import {
  getAudienceId,
  getEmailFrom,
  getEmailReplyTo,
  getResend,
} from '@/lib/resend';
import { signConfirmToken } from '@/lib/subscribe-tokens';

// We need the raw body to verify the Stripe signature.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _stripe = new Stripe(key);
  return _stripe;
}

function formatAmount(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Don't surface details — webhook endpoints should respond predictably
    // even when misconfigured.
    return NextResponse.json(
      { ok: false, error: 'Webhook not configured' },
      { status: 500 },
    );
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json(
      { ok: false, error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    // Signature mismatch — return 400 so Stripe retries. Don't leak details.
    console.error(
      '[stripe webhook] signature verification failed:',
      (err as Error).message,
    );
    return NextResponse.json(
      { ok: false, error: 'Invalid signature' },
      { status: 400 },
    );
  }

  // We only care about completed checkout sessions today.
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Only handle paid sessions. Stripe also fires for `unpaid` async flows
  // (e.g. bank debits) that resolve later — we'd need to listen to
  // `checkout.session.async_payment_succeeded` separately if we ever
  // accept those.
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ ok: true, ignored: 'not paid' });
  }

  // Resolve the donor's email. Payment Links capture it during checkout
  // and put it on `customer_details.email`. Fall back to `customer_email`
  // for older sessions if needed.
  const donorEmail =
    session.customer_details?.email ?? session.customer_email ?? null;
  if (!donorEmail) {
    // Nothing to send to — ack the webhook so Stripe doesn't retry.
    return NextResponse.json({ ok: true, ignored: 'no email' });
  }

  const firstName = session.customer_details?.name?.split(/\s+/)[0];
  const amountCents = session.amount_total ?? 0;
  const currency = session.currency ?? 'usd';
  const amount = formatAmount(amountCents, currency);

  // Look up the donor in Resend. If they're not already in the audience —
  // OR they're there but unsubscribed — the thank-you email includes a
  // one-click subscribe CTA. The donation already proved they own the
  // email, so the link drops them straight into /subscribe/confirm.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.horsetounicorn.com';
  const resend = getResend();
  let alreadySubscribed = false;
  try {
    const got = await resend.contacts.get({
      audienceId: getAudienceId(),
      email: donorEmail,
    });
    alreadySubscribed = !!got.data?.email && !got.data.unsubscribed;
  } catch {
    // Contact missing → keep alreadySubscribed false, surface the CTA.
  }

  let subscribeUrl: string | undefined;
  if (!alreadySubscribed) {
    const token = await signConfirmToken(donorEmail);
    subscribeUrl = `${siteUrl}/subscribe/confirm?token=${encodeURIComponent(token)}`;
  }

  const html = await render(
    DonationThanksEmail({ firstName, amount, siteUrl, subscribeUrl }),
  );

  try {
    await resend.emails.send({
      from: getEmailFrom(),
      to: donorEmail,
      subject: 'Thanks for the coffee ☕',
      html,
      replyTo: getEmailReplyTo(),
      // Help Gmail/Outlook bucket us as transactional, not promotional.
      headers: {
        'X-Entity-Ref-ID': session.id,
      },
    });
  } catch (err) {
    // We log + still 200 the webhook. A failed send shouldn't make Stripe
    // retry the donation; Tom can re-send manually if needed.
    console.error('[stripe webhook] resend send failed:', err);
  }

  return NextResponse.json({ ok: true, sent: true });
}
