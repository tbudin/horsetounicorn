import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { render } from '@react-email/components';
import { PostBroadcastEmail } from '@/emails/post-broadcast';
import {
  invalidateSlugIndex,
  loadArticleByIdForAdmin,
  type ArticleStatus,
  type ArticleMetadata,
} from '@/lib/articles';
import { saveArticleFiles } from '@/lib/storage';
import {
  getAudienceId,
  getEmailFrom,
  getEmailReplyTo,
  getInnerCircleAudienceId,
  getResend,
} from '@/lib/resend';

const Body = z.object({
  /**
   * Action to take:
   *   inner_circle   — broadcast to the inner-circle audience for review
   *   main           — broadcast to the main audience (final publish)
   *   publish_only   — flip status to "published" without sending email
   *   revert_draft   — move a published / archived article back to draft
   *   archive        — move article to archived (keeps URL but hides it)
   */
  action: z.enum([
    'inner_circle',
    'main',
    'publish_only',
    'revert_draft',
    'archive',
  ]),
  /** Delay in minutes before the broadcast is sent. 0 = now. Max 14 days. */
  delayMinutes: z.number().int().min(0).max(60 * 24 * 14).optional().default(0),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
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
  const { metadata } = article;
  const slug = metadata.slug;

  // Status guards
  if (body.action === 'main' && metadata.status === 'draft') {
    // allowed — going draft → main without inner circle
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
  const articleUrl = `${siteUrl}/articles/${slug}`;

  let nextStatus: ArticleStatus = metadata.status;
  const nextMeta = { ...metadata };

  async function persist(meta: ArticleMetadata, action: string) {
    await saveArticleFiles({
      articleId: id,
      metadata: JSON.stringify(meta, null, 2),
      message: `${action} ${slug}`,
    });
    invalidateSlugIndex();
  }

  // -- Pure status transitions (no email) --------------------------------
  if (body.action === 'publish_only') {
    nextStatus = 'published';
    nextMeta.status = nextStatus;
    if (!nextMeta.publishedAt) nextMeta.publishedAt = new Date().toISOString();
    await persist(nextMeta, 'Mark as published');
    revalidatePath(`/articles/${slug}`);
    revalidatePath('/articles');
    return NextResponse.json({ ok: true, status: nextStatus });
  }
  if (body.action === 'revert_draft') {
    nextStatus = 'draft';
    nextMeta.status = nextStatus;
    await persist(nextMeta, 'Revert to draft');
    revalidatePath(`/articles/${slug}`);
    revalidatePath('/articles');
    return NextResponse.json({ ok: true, status: nextStatus });
  }
  if (body.action === 'archive') {
    nextStatus = 'archived';
    nextMeta.status = nextStatus;
    await persist(nextMeta, 'Archive');
    revalidatePath(`/articles/${slug}`);
    revalidatePath('/articles');
    return NextResponse.json({ ok: true, status: nextStatus });
  }

  // -- broadcast actions --------------------------------------------------

  const audienceId =
    body.action === 'inner_circle' ? getInnerCircleAudienceId() : getAudienceId();
  if (body.action === 'inner_circle' && !audienceId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'RESEND_INNER_CIRCLE_AUDIENCE_ID is not set. Create a second audience in Resend and add its ID to .env.',
      },
      { status: 400 },
    );
  }
  if (!audienceId) {
    return NextResponse.json(
      { ok: false, error: 'No Resend audience configured' },
      { status: 400 },
    );
  }

  const resend = getResend();
  const html = await render(
    PostBroadcastEmail({
      title: metadata.title,
      description: metadata.description ?? metadata.subtitle ?? '',
      postUrl: articleUrl,
      siteUrl,
      tipUrl: process.env.NEXT_PUBLIC_STRIPE_TIP_URL,
    }),
  );

  // Compute optional scheduled time
  const scheduledAt =
    body.delayMinutes > 0
      ? new Date(Date.now() + body.delayMinutes * 60_000).toISOString()
      : undefined;

  // 1. Create the broadcast (with scheduledAt baked in if scheduling).
  const { data: broadcast, error: createErr } = await resend.broadcasts.create({
    audienceId,
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    subject: metadata.title,
    html,
    name: `${slug} — ${body.action} — ${new Date().toISOString()}`,
    ...(scheduledAt ? { scheduledAt } : {}),
  });
  if (createErr || !broadcast) {
    return NextResponse.json(
      { ok: false, error: createErr?.message ?? 'Could not create broadcast' },
      { status: 500 },
    );
  }

  // 2. If no delay, dispatch immediately. Otherwise Resend will send at
  //    scheduledAt automatically.
  if (!scheduledAt) {
    const { error: sendErr } = await resend.broadcasts.send(broadcast.id);
    if (sendErr) {
      return NextResponse.json(
        {
          ok: false,
          broadcastId: broadcast.id,
          error: sendErr.message,
        },
        { status: 500 },
      );
    }
  }

  // 3. Update metadata.
  const nowIso = new Date().toISOString();
  nextMeta.broadcasts = nextMeta.broadcasts ?? {};
  if (body.action === 'inner_circle') {
    nextMeta.broadcasts.innerCircle = {
      id: broadcast.id,
      sentAt: scheduledAt ? undefined : nowIso,
      scheduledFor: scheduledAt,
    };
    nextMeta.innerCircleSentAt = nowIso;
    nextStatus = 'inner_circle_sent';
  } else {
    nextMeta.broadcasts.main = {
      id: broadcast.id,
      sentAt: scheduledAt ? undefined : nowIso,
      scheduledFor: scheduledAt,
    };
    nextMeta.publishedAt = nowIso;
    nextStatus = 'published';
  }
  nextMeta.status = nextStatus;
  await persist(
    nextMeta,
    body.action === 'inner_circle' ? 'Send inner-circle broadcast' : 'Publish + send broadcast',
  );

  revalidatePath(`/articles/${slug}`);
  revalidatePath('/articles');

  return NextResponse.json({
    ok: true,
    status: nextStatus,
    broadcastId: broadcast.id,
    scheduledAt: scheduledAt ?? null,
  });
}
