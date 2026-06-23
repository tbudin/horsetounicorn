import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadArticleByIdForAdmin, type ArticleStatus } from '@/lib/articles';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ArticleLayout } from '@/components/article/article-layout';
import { RenderDocument } from '@/components/article/render-document';
import { getChartsFor } from '@/app/articles/_charts';

const STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: 'Draft',
  inner_circle_sent: 'Sent to inner circle',
  published: 'Published',
  archived: 'Archived',
};

const STATUS_CLASS: Record<ArticleStatus, string> = {
  draft: 'bg-[#EEE6EC] text-ink-muted',
  inner_circle_sent: 'bg-orange-lighter text-orange',
  published: 'bg-green-lighter text-green',
  archived: 'bg-ink-subtle/20 text-ink-subtle',
};

export default async function AdminArticlePreview({
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
  const charts = await getChartsFor(id);
  const slug = metadata.slug;

  const registered = Object.keys(charts);
  const referenced = Array.from(new Set(collectChartNames(document.content)));
  const missing = referenced.filter((name) => !registered.includes(name));
  const stats = countDocumentNodes(document.content);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <Link
            href="/admin"
            className="text-xs text-ink-subtle hover:text-ink-heading mb-2 inline-block"
          >
            ← Articles
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="font-serif text-3xl font-medium text-ink-heading truncate">
              {metadata.title}
            </h1>
            <span
              className={cn(
                'shrink-0 px-2 py-1 text-[10px] uppercase tracking-wider data-num',
                STATUS_CLASS[metadata.status],
              )}
            >
              {STATUS_LABEL[metadata.status]}
            </span>
          </div>
          {metadata.subtitle ? (
            <p className="text-sm text-ink-muted mt-1">{metadata.subtitle}</p>
          ) : null}
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <Link
            href={`/admin/articles/${id}/edit`}
            className="btn-admin-secondary px-3 py-1.5 text-xs"
          >
            Edit
          </Link>
          <Link
            href={`/admin/articles/${id}/publish`}
            className="btn-admin-primary px-3 py-1.5 text-xs"
          >
            Publish
          </Link>
          <Link
            href={`/articles/${slug}`}
            target="_blank"
            className="text-xs text-ink-subtle hover:text-ink-heading transition-colors"
          >
            Public ↗
          </Link>
        </div>
      </header>

      {/* Metadata strip — compact, editable later */}
      <section className="bg-white border border-[#EEE6EC]">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#EEE6EC]">
          <Field label="Slug" value={metadata.slug} mono />
          <Field label="Date" value={formatDate(metadata.date)} />
          <Field label="Reading" value={metadata.readingTime ?? '—'} />
          <Field
            label="Tags"
            value={
              metadata.tags && metadata.tags.length
                ? metadata.tags.join(', ')
                : '—'
            }
          />
        </div>
        {metadata.description ? (
          <div className="border-t border-[#EEE6EC] px-4 py-3 text-xs">
            <span className="uppercase tracking-wider text-ink-subtle data-num mr-2">
              Description
            </span>
            <span className="text-ink-muted">{metadata.description}</span>
          </div>
        ) : null}
        {missing.length > 0 ? (
          <div className="border-t border-[#EEE6EC] bg-burgundy-lighter/30 px-4 py-3 text-xs text-burgundy">
            <span className="uppercase tracking-wider mr-2 data-num">Missing charts</span>
            {missing.map((name) => (
              <code key={name} className="mr-2 font-mono">
                {name}
              </code>
            ))}
          </div>
        ) : null}
      </section>

      {/* Stats strip */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-ink-subtle data-num">
        <span>{stats.paragraph} paragraphs</span>
        <span>·</span>
        <span>{stats.heading} headings</span>
        <span>·</span>
        <span>{stats.chart} charts</span>
        <span>·</span>
        <span>{stats.callout} callouts</span>
        <span>·</span>
        <span>{stats.image} images</span>
      </div>

      {/* Live preview — same chrome as the public route */}
      <section className="border border-[#EEE6EC] bg-white overflow-hidden">
        <div className="bg-[#FAF7F9] border-b border-[#EEE6EC] px-4 py-2 text-[10px] uppercase tracking-wider text-ink-subtle data-num">
          Preview — rendered as it will publish
        </div>
        <ArticleLayout
          title={metadata.title}
          subtitle={metadata.subtitle}
          date={metadata.date}
          readingTime={metadata.readingTime}
          embedded
        >
          <RenderDocument document={document} charts={charts} />
        </ArticleLayout>
      </section>
    </div>
  );
}

// -- Helpers ------------------------------------------------------------

import type { BlockNode } from '@/lib/article-doc';

function collectChartNames(nodes: BlockNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.type === 'chart') out.push(n.attrs.chartName);
    if ('content' in n && Array.isArray(n.content)) {
      out.push(...collectChartNames(n.content as BlockNode[]));
    }
  }
  return out;
}

function countDocumentNodes(nodes: BlockNode[]) {
  const acc = { paragraph: 0, heading: 0, chart: 0, callout: 0, image: 0 };
  const walk = (ns: BlockNode[]) => {
    for (const n of ns) {
      if (n.type in acc) acc[n.type as keyof typeof acc]++;
      if ('content' in n && Array.isArray(n.content)) {
        walk(n.content as BlockNode[]);
      }
    }
  };
  walk(nodes);
  return acc;
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle data-num mb-1">
        {label}
      </div>
      <div className={cn('text-sm text-ink', mono && 'font-mono')}>{value}</div>
    </div>
  );
}
