import Link from 'next/link';
import { listArticles, type ArticleStatus } from '@/lib/articles';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: 'Draft',
  inner_circle_sent: 'Inner circle',
  published: 'Published',
  archived: 'Archived',
};

const STATUS_CLASS: Record<ArticleStatus, string> = {
  draft: 'bg-[#EEE6EC] text-ink-muted',
  inner_circle_sent: 'bg-orange-lighter text-orange',
  published: 'bg-green-lighter text-green',
  archived: 'bg-ink-subtle/20 text-ink-subtle',
};

export default function AdminHome() {
  const articles = listArticles();
  const drafts = articles.filter((a) => a.status === 'draft');
  const inFlight = articles.filter((a) => a.status === 'inner_circle_sent');
  const published = articles.filter((a) => a.status === 'published');
  const archived = articles.filter((a) => a.status === 'archived');

  return (
    <div className="space-y-10">
      <div className="flex items-baseline justify-between">
        <h1 className="font-serif text-3xl font-medium text-ink-heading">
          Articles
        </h1>
        <p className="text-xs text-ink-subtle data-num">
          {drafts.length} draft{drafts.length === 1 ? '' : 's'} ·{' '}
          {inFlight.length} in review · {published.length} published ·{' '}
          {archived.length} archived
        </p>
      </div>

      <ArticleList title="Drafts" articles={drafts} emptyHint="No drafts." />
      <ArticleList
        title="Sent to inner circle"
        articles={inFlight}
        emptyHint="None awaiting review."
      />
      <ArticleList
        title="Published"
        articles={published}
        emptyHint="No published articles yet."
      />
      {archived.length > 0 ? (
        <ArticleList title="Archived" articles={archived} emptyHint="" />
      ) : null}
    </div>
  );
}

function ArticleList({
  title,
  articles,
  emptyHint,
}: {
  title: string;
  articles: ReturnType<typeof listArticles>;
  emptyHint: string;
}) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider text-ink-subtle mb-3 data-num">
        {title}
      </h2>
      {articles.length === 0 ? (
        <p className="text-sm text-ink-muted">{emptyHint}</p>
      ) : (
        <ul className="divide-y divide-[#EEE6EC] border border-[#EEE6EC] bg-white">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/articles/${a.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[#FAF7F9] transition-colors"
              >
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] uppercase tracking-wider data-num',
                    STATUS_CLASS[a.status],
                  )}
                >
                  {STATUS_LABEL[a.status]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink-heading truncate">
                    {a.title}
                  </div>
                  {a.subtitle ? (
                    <div className="text-xs text-ink-muted truncate">{a.subtitle}</div>
                  ) : null}
                </div>
                <div className="text-xs text-ink-subtle data-num shrink-0">
                  {formatDate(a.date)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
