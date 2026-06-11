import { NextResponse } from 'next/server';
import { z } from 'zod';
import { render } from '@react-email/components';
import { PostBroadcastEmail } from '@/emails/post-broadcast';
import { loadArticle } from '@/lib/articles';
import { getAudienceId, getEmailFrom, getEmailReplyTo, getResend } from '@/lib/resend';

const Body = z.object({
  slug: z.string().min(1),
  /** Set true to immediately send. Otherwise the broadcast is created in draft. */
  send: z.boolean().optional().default(false),
});

/**
 * Creates a Resend broadcast for a given article slug. Pass `send: true` to
 * dispatch immediately. Protected by `PUBLISH_SECRET`.
 *
 *   curl -X POST https://your-site/api/publish \
 *     -H 'Authorization: Bearer YOUR_PUBLISH_SECRET' \
 *     -H 'Content-Type: application/json' \
 *     -d '{ "slug": "my-article", "send": true }'
 */
export async function POST(req: Request) {
  const secret = process.env.PUBLISH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'PUBLISH_SECRET not configured.' },
      { status: 500 },
    );
  }
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  let article;
  try {
    article = loadArticle(parsed.slug);
  } catch {
    return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
  }

  const { metadata } = article;

  const resend = getResend();
  const audienceId = getAudienceId();
  const from = getEmailFrom();
  const replyTo = getEmailReplyTo();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
  const articleUrl = `${siteUrl}/articles/${metadata.slug}`;

  const html = await render(
    PostBroadcastEmail({
      title: metadata.title,
      description: metadata.description ?? metadata.subtitle ?? '',
      postUrl: articleUrl,
      siteUrl,
    }),
  );

  const { data, error } = await resend.broadcasts.create({
    audienceId,
    from,
    replyTo,
    subject: metadata.title,
    html,
    name: `${metadata.slug} — ${metadata.publishedAt ?? metadata.date}`,
  });

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'Could not create broadcast' },
      { status: 500 },
    );
  }

  if (parsed.send) {
    const sendResult = await resend.broadcasts.send(data.id);
    if (sendResult.error) {
      return NextResponse.json(
        { ok: false, broadcastId: data.id, error: sendResult.error.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, broadcastId: data.id, sent: parsed.send });
}
