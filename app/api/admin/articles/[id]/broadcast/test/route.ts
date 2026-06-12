import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadArticleByIdForAdmin } from '@/lib/articles';
import { getResend, getEmailFrom, getEmailReplyTo } from '@/lib/resend';
import {
  BroadcastComposeSchema,
  renderBroadcastHtml,
  getSiteUrl,
} from '@/lib/broadcast';
import { requireAdmin } from '@/lib/admin-guard';

export const runtime = 'nodejs';

const Body = BroadcastComposeSchema.extend({
  to: z.string().email(),
});

/**
 * Send the composed email to a single address as a one-off transactional
 * email (resend.emails.send) — a real-inbox preview before broadcasting to an
 * audience. No status changes, no broadcast record.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', detail: String(err) },
      { status: 400 },
    );
  }

  let article;
  try {
    article = await loadArticleByIdForAdmin(id);
  } catch {
    return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
  }

  const siteUrl = getSiteUrl();
  let html = await renderBroadcastHtml({ payload, metadata: article.metadata, siteUrl });
  // The {{{RESEND_UNSUBSCRIBE_URL}}} placeholder is only substituted for
  // broadcasts; on a transactional send it would render literally, so point it
  // somewhere harmless for the test.
  html = html.replaceAll('{{{RESEND_UNSUBSCRIBE_URL}}}', siteUrl);

  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: payload.to,
    replyTo: getEmailReplyTo(),
    subject: `[TEST] ${payload.subject}`,
    html,
  });
  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Could not send test email' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: data.id, to: payload.to });
}
