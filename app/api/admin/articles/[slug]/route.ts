import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { loadArticle, type ArticleMetadata } from '@/lib/articles';
import type { ArticleDocument } from '@/lib/article-doc';
import { renameArticleFolder, saveArticleFiles } from '@/lib/storage';

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
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

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
    current = loadArticle(slug);
  } catch {
    return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
  }

  // Detect a slug rename. Do this BEFORE writing blocks/metadata so we
  // write to the new directory.
  let effectiveSlug = slug;
  let renamed = false;
  if (parsed.metadata?.slug && parsed.metadata.slug !== slug) {
    try {
      await renameArticleFolder(
        slug,
        parsed.metadata.slug,
        `Rename article ${slug} → ${parsed.metadata.slug}`,
      );
      effectiveSlug = parsed.metadata.slug;
      renamed = true;
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: (err as Error).message },
        { status: 400 },
      );
    }
  }

  const writes: { metadata?: string; document?: string } = {};
  if (parsed.document) {
    writes.document = JSON.stringify(parsed.document as ArticleDocument, null, 2);
  }
  if (parsed.metadata) {
    const merged: ArticleMetadata = {
      ...current.metadata,
      ...parsed.metadata,
      slug: effectiveSlug,
    };
    writes.metadata = JSON.stringify(merged, null, 2);
  }

  if (writes.metadata != null || writes.document != null) {
    try {
      await saveArticleFiles({
        slug: effectiveSlug,
        metadata: writes.metadata,
        document: writes.document,
        message: renamed
          ? `Update article ${effectiveSlug} (renamed from ${slug})`
          : `Update article ${effectiveSlug}`,
      });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: (err as Error).message },
        { status: 500 },
      );
    }
  }

  // Revalidate
  revalidatePath(`/articles/${effectiveSlug}`);
  if (renamed) revalidatePath(`/articles/${slug}`);
  revalidatePath('/articles');

  return NextResponse.json({ ok: true, slug: effectiveSlug, renamed });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const article = loadArticle(slug);
    return NextResponse.json({ ok: true, article });
  } catch {
    return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
  }
}
