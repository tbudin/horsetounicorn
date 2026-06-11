import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadArticleById, listChartsForId } from '@/lib/articles';
import { RichArticleEditor } from '@/components/admin/rich-article-editor';

export default async function AdminArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let article;
  try {
    article = loadArticleById(id);
  } catch {
    notFound();
  }
  const availableCharts = listChartsForId(id);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <Link
          href={`/admin/articles/${id}`}
          className="text-xs text-ink-subtle hover:text-ink-heading"
        >
          ← Preview
        </Link>
        <p className="text-xs text-ink-subtle">
          Editing <code className="font-mono">{article.metadata.slug}</code>
        </p>
      </div>

      <RichArticleEditor
        articleId={id}
        initialMetadata={article.metadata}
        initialDocument={article.document}
        availableCharts={availableCharts}
      />
    </div>
  );
}
