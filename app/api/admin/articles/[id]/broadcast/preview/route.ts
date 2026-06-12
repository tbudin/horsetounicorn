import { NextResponse } from 'next/server';
import { loadArticleByIdForAdmin } from '@/lib/articles';
import {
  BroadcastComposeSchema,
  renderBroadcastHtml,
  getSiteUrl,
} from '@/lib/broadcast';

export const runtime = 'nodejs';

/**
 * Render the composed broadcast email to HTML for the live preview iframe.
 * No send, no side effects.
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

  const html = await renderBroadcastHtml({
    payload,
    metadata: article.metadata,
    siteUrl: getSiteUrl(),
  });

  return NextResponse.json({ ok: true, html });
}
