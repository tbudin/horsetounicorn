import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { capturePostHog } from '@/lib/posthog-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Resend webhook → PostHog. Records email opens/clicks/bounces and
 * subscribe/unsubscribe events as PostHog events keyed by the recipient's
 * email — the same distinct id the site uses when it identifies a subscriber
 * from an email link, so opens line up with on-site behaviour per member.
 *
 * Setup: Resend → Webhooks → add endpoint
 *   URL:    https://www.horsetounicorn.com/api/webhooks/resend
 *   Events: email.opened, email.clicked, email.bounced, email.complained,
 *           contact.created, contact.updated
 * Paste the signing secret into RESEND_WEBHOOK_SECRET. Enable open tracking in
 * Resend so email.opened fires.
 */
const EMAIL_EVENTS: Record<string, string> = {
  'email.opened': 'email_opened',
  'email.clicked': 'email_clicked',
  'email.delivered': 'email_delivered',
  'email.bounced': 'email_bounced',
  'email.complained': 'email_complained',
};

interface ResendEvent {
  type: string;
  created_at?: string;
  data?: {
    to?: string | string[];
    subject?: string;
    email_id?: string;
    email?: string;
    audience_id?: string;
    unsubscribed?: boolean;
    created_at?: string;
    click?: { link?: string };
  };
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'RESEND_WEBHOOK_SECRET is not set' },
      { status: 500 },
    );
  }

  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  let evt: ResendEvent;
  try {
    evt = new Webhook(secret).verify(payload, headers) as ResendEvent;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
  }

  const { type, data = {}, created_at } = evt;
  const when = created_at ?? data.created_at;
  const lower = (s?: string) => (s ?? '').trim().toLowerCase();

  try {
    if (type in EMAIL_EVENTS) {
      const recipient = lower(Array.isArray(data.to) ? data.to[0] : data.to);
      if (recipient) {
        await capturePostHog({
          event: EMAIL_EVENTS[type],
          distinctId: recipient,
          timestamp: when,
          properties: {
            subject: data.subject,
            email_id: data.email_id,
            ...(data.click?.link ? { link: data.click.link } : {}),
            $set: { email: recipient },
          },
        });
      }
    } else if (type === 'contact.created' && data.email) {
      await capturePostHog({
        event: 'subscribed',
        distinctId: lower(data.email),
        timestamp: when,
        properties: { audience_id: data.audience_id, $set: { email: lower(data.email) } },
      });
    } else if (type === 'contact.updated' && data.unsubscribed === true && data.email) {
      await capturePostHog({
        event: 'unsubscribed',
        distinctId: lower(data.email),
        timestamp: when,
        properties: { audience_id: data.audience_id, $set: { email: lower(data.email) } },
      });
    }
  } catch {
    // Never fail the webhook on a capture hiccup — Resend would retry.
  }

  return NextResponse.json({ ok: true });
}
