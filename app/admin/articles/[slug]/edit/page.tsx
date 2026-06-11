import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadArticle, listChartsForSlug } from '@/lib/articles';
import { RichArticleEditor } from '@/components/admin/rich-article-editor';

export default async function AdminArticleEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let article;
  try {
    article = loadArticle(slug);
  } catch {
    notFound();
  }
  const availableCharts = listChartsForSlug(slug);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <Link
          href={`/admin/articles/${slug}`}
          className="text-xs text-ink-subtle hover:text-ink-heading"
        >
          ← Preview
        </Link>
        <p className="text-xs text-ink-subtle">
          Editing <code className="font-mono">{slug}</code>
        </p>
      </div>

      <RichArticleEditor
        slug={slug}
        initialMetadata={article.metadata}
        initialDocument={article.document}
        availableCharts={availableCharts}
      />
    </div>
  );
}
