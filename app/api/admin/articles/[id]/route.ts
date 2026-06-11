import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  invalidateSlugIndex,
  loadArticleByIdForAdmin,
  type ArticleMetadata,
} from '@/lib/articles';
import type { ArticleDocument } from '@/lib/article-doc';
import { saveArticleFiles } from '@/lib/storage';

// -- Document schema -----------------------------------------------------
// We accept the full TipTap-style document. Validation here is light: a
// strict structural check would require enumerating every node type. Storing
// the exact JSON the editor produced is the path of least surprise.
const DocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.any()),
});

// -- Metadata schema -----------------------------------------------------

const ArticleStatusSchema = z.enum([
  'draft',
  'inner_circle_sent',
  'published',
  'archived',
]);

const MetadataPatchSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  readingTime: z.string().optional(),
  cover: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  // status transitions go through the /publish endpoint instead, but allow
  // editing the field here for cases like re-marking as draft.
  status: ArticleStatusSchema.optional(),
});

const PutBody = z.object({
  document: DocumentSchema.optional(),
  metadata: MetadataPatchSchema.optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let parsed: z.infer<typeof PutBody>;
  try {
    parsed = PutBody.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', detail: String(err) },
      { status: 400 },
    );
  }

  let current;
  try {
    current = await loadArticleByIdForAdmin(id);
  } catch {
    return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
  }
  const oldSlug = current.metadata.slug;

  // Slug rename = pure metadata update. We append the old slug to
  // previousSlugs[] so /articles/<old-slug> keeps 308-ing to the new one.
  let renamed = false;
  let nextSlug = oldSlug;
  let nextPreviousSlugs = current.metadata.previousSlugs ?? [];
  if (parsed.metadata?.slug && parsed.metadata.slug !== oldSlug) {
    nextSlug = parsed.metadata.slug;
    renamed = true;
    // Newest-first; de-dup so a slug never appears twice.
    nextPreviousSlugs = [
      oldSlug,
      ...nextPreviousSlugs.filter((s) => s !== oldSlug && s !== nextSlug),
    ];
  }

  const writes: { metadata?: string; document?: string } = {};
  if (parsed.document) {
    writes.document = JSON.stringify(parsed.document as ArticleDocument, null, 2);
  }
  if (parsed.metadata || renamed) {
    const merged: ArticleMetadata = {
      ...current.metadata,
      ...parsed.metadata,
      id, // id is immutable — guard against accidental override
      slug: nextSlug,
      previousSlugs: nextPreviousSlugs,
    };
    writes.metadata = JSON.stringify(merged, null, 2);
  }

  if (writes.metadata != null || writes.document != null) {
    try {
      await saveArticleFiles({
        articleId: id,
        metadata: writes.metadata,
        document: writes.document,
        message: renamed
          ? `Rename slug ${oldSlug} → ${nextSlug}`
          : `Update article ${nextSlug}`,
      });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: (err as Error).message },
        { status: 500 },
      );
    }
  }

  invalidateSlugIndex();
  revalidatePath(`/articles/${nextSlug}`);
  if (renamed) revalidatePath(`/articles/${oldSlug}`);
  revalidatePath('/articles');

  return NextResponse.json({
    ok: true,
    id,
    slug: nextSlug,
    renamed,
    previousSlugs: nextPreviousSlugs,
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const article = await loadArticleByIdForAdmin(id);
    return NextResponse.json({ ok: true, article });
  } catch {
    return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
  }
}
