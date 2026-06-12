import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  invalidateSlugIndex,
  loadArticleByIdForAdmin,
  type ArticleMetadata,
  type ArticleStatus,
} from '@/lib/articles';
import { saveArticleFiles } from '@/lib/storage';
import {
  getAudienceId,
  getEmailFrom,
  getEmailReplyTo,
  getInnerCircleAudienceId,
  getResend,
} from '@/lib/resend';
import {
  BroadcastComposeSchema,
  renderBroadcastHtml,
  getSiteUrl,
} from '@/lib/broadcast';

export const runtime = 'nodejs';

/**
 * Compose-and-send a broadcast. Builds the email HTML from the chosen template
 * + structured fields, creates the Resend broadcast (scheduled or immediate),
 * and records the send against the target audience so the publish page can show
 * the sent/scheduled status.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let payload;
  try {
    payload = BroadcastComposeSchema.parse(await req.json());
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
  const siteUrl = getSiteUrl();

  // Resolve the target audience.
  const audienceId =
    payload.audience === 'inner_circle' ? getInnerCircleAudienceId() : getAudienceId();
  if (payload.audience === 'inner_circle' && !audienceId) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'RESEND_INNER_CIRCLE_AUDIENCE_ID is not set. Add a second audience in Resend and put its ID in .env.',
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

  const html = await renderBroadcastHtml({ payload, metadata, siteUrl });

  const scheduledAt =
    payload.scheduledAt && new Date(payload.scheduledAt).getTime() > Date.now()
      ? new Date(payload.scheduledAt).toISOString()
      : undefined;

  const resend = getResend();
  const { data: broadcast, error: createErr } = await resend.broadcasts.create({
    audienceId,
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    subject: payload.subject,
    html,
    name: `${metadata.slug} — ${payload.audience} — ${new Date().toISOString()}`,
    ...(scheduledAt ? { scheduledAt } : {}),
  });
  if (createErr || !broadcast) {
    return NextResponse.json(
      { ok: false, error: createErr?.message ?? 'Could not create broadcast' },
      { status: 500 },
    );
  }

  if (!scheduledAt) {
    const { error: sendErr } = await resend.broadcasts.send(broadcast.id);
    if (sendErr) {
      return NextResponse.json(
        { ok: false, broadcastId: broadcast.id, error: sendErr.message },
        { status: 500 },
      );
    }
  }

  // Record the send + advance status.
  const nowIso = new Date().toISOString();
  const nextMeta: ArticleMetadata = { ...metadata };
  nextMeta.broadcasts = { ...(nextMeta.broadcasts ?? {}) };
  let nextStatus: ArticleStatus = metadata.status;

  const record = {
    id: broadcast.id,
    sentAt: scheduledAt ? undefined : nowIso,
    scheduledFor: scheduledAt,
  };
  if (payload.audience === 'inner_circle') {
    nextMeta.broadcasts.innerCircle = record;
    nextMeta.innerCircleSentAt = nowIso;
    nextStatus = 'inner_circle_sent';
  } else {
    nextMeta.broadcasts.main = record;
    nextMeta.publishedAt = nowIso;
    nextStatus = 'published';
  }
  nextMeta.status = nextStatus;

  try {
    await saveArticleFiles({
      articleId: id,
      metadata: JSON.stringify(nextMeta, null, 2),
      message:
        payload.audience === 'inner_circle'
          ? `Send inner-circle broadcast ${metadata.slug}`
          : `Publish + send broadcast ${metadata.slug}`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, broadcastId: broadcast.id, error: (err as Error).message },
      { status: 500 },
    );
  }
  invalidateSlugIndex();
  revalidatePath(`/articles/${metadata.slug}`);
  revalidatePath('/articles');

  return NextResponse.json({
    ok: true,
    status: nextStatus,
    broadcastId: broadcast.id,
    scheduledAt: scheduledAt ?? null,
  });
}
