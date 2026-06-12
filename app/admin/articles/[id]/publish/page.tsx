import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadArticleByIdForAdmin } from '@/lib/articles';
import type { BlockNode } from '@/lib/article-doc';
import { getAuthor } from '@/lib/authors';
import { chartImagePublicUrl } from '@/lib/storage';
import { PublishComposer } from '@/components/admin/publish-composer';

export interface ImageOption {
  src: string;
  label: string;
  kind: 'cover' | 'inline';
}

/** Walk the document tree collecting inline image srcs (incl. nested). */
function collectImageSrcs(nodes: BlockNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    if (n.type === 'image' && n.attrs?.src) out.push(n.attrs.src);
    if ('content' in n && Array.isArray(n.content)) {
      collectImageSrcs(n.content as BlockNode[], out);
    }
  }
  return out;
}

function collectChartNames(nodes: BlockNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    if (n.type === 'chart' && n.attrs?.chartName) out.push(n.attrs.chartName);
    if ('content' in n && Array.isArray(n.content)) {
      collectChartNames(n.content as BlockNode[], out);
    }
  }
  return out;
}

export default async function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let article;
  try {
    article = await loadArticleByIdForAdmin(id);
  } catch {
    notFound();
  }
  const { metadata, document } = article;
  const author = getAuthor(metadata.author);

  const images: ImageOption[] = [];
  if (metadata.cover) {
    images.push({ src: metadata.cover, label: 'Cover', kind: 'cover' });
  }
  const seen = new Set(images.map((i) => i.src));
  for (const src of collectImageSrcs(document.content)) {
    if (seen.has(src)) continue;
    seen.add(src);
    images.push({ src, label: src.split('/').pop() ?? src, kind: 'inline' });
  }

  const chartNames = Array.from(new Set(collectChartNames(document.content)));
  // Deterministic URLs where each chart's PNG would live; the composer probes
  // these so an already-generated chart shows up without re-rendering.
  const chartCandidates: Record<string, string> = Object.fromEntries(
    chartNames.map((name) => [name, chartImagePublicUrl(id, name)]),
  );

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/admin/articles/${id}`}
            className="text-xs text-ink-subtle hover:text-ink-heading mb-2 inline-block"
          >
            ← Preview
          </Link>
          <h1 className="font-serif text-3xl font-medium text-ink-heading truncate">
            Publish — {metadata.title}
          </h1>
        </div>
        <Link
          href={`/admin/articles/${id}/edit`}
          className="shrink-0 border border-[#EEE6EC] bg-white text-ink-heading px-3 py-1.5 text-xs font-medium hover:border-burgundy hover:text-burgundy transition-colors"
        >
          Edit
        </Link>
      </header>

      <PublishComposer
        articleId={id}
        title={metadata.title}
        status={metadata.status}
        broadcasts={metadata.broadcasts ?? {}}
        hasInnerCircleAudience={Boolean(process.env.RESEND_INNER_CIRCLE_AUDIENCE_ID)}
        hasMainAudience={Boolean(process.env.RESEND_AUDIENCE_ID)}
        images={images}
        chartNames={chartNames}
        chartCandidates={chartCandidates}
        authorName={author.name}
        defaultTestEmail={
          process.env.BROADCAST_TEST_EMAIL ?? process.env.EMAIL_REPLY_TO ?? ''
        }
      />
    </div>
  );
}
