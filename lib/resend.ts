import { Resend } from 'resend';

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not set');
  }
  _resend = new Resend(key);
  return _resend;
}

export function getAudienceId(): string {
  const id = process.env.RESEND_AUDIENCE_ID;
  if (!id) throw new Error('RESEND_AUDIENCE_ID is not set');
  return id;
}

/** Optional inner-circle audience used for two-stage publishing. */
export function getInnerCircleAudienceId(): string | null {
  return process.env.RESEND_INNER_CIRCLE_AUDIENCE_ID || null;
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? 'Horse to Unicorn <hello@horsetounicorn.com>';
}

export function getEmailReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO;
}
