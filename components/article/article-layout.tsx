import type { ReactNode } from 'react';
import { formatDate } from '@/lib/format';

export interface ArticleLayoutProps {
  /** Article title, rendered in display serif. */
  title: string;
  /** Optional subtitle / dek line. */
  subtitle?: string;
  /** Publication date — ISO string ('2026-05-29') or pre-formatted text. */
  date?: string;
  /** Estimated reading time, e.g. "12 min read". */
  readingTime?: string;
  /** Article body — prose paragraphs, charts, callouts. */
  children: ReactNode;
  /**
   * Slot rendered AFTER the prose container, still inside the article
   * column. Used for share buttons, author footer, and the subscribe CTA so
   * those siblings don't inherit prose typography margins.
   */
  footer?: ReactNode;
  /**
   * Slot rendered AFTER the article column closes, inside the outer padded
   * div. Use for sections that should sit wider than the 720px reading
   * column (e.g. the "Up next" envelope cards).
   */
  wideFooter?: ReactNode;
  /**
   * When true, drops the min-h-screen + outer padding so the layout sizes to
   * its content. Use inside admin previews where the layout is embedded
   * inside a frame.
   */
  embedded?: boolean;
}

/**
 * Page shell for any data-essay article in /app/articles/[slug].
 *
 *   <ArticleLayout
 *     title="Future money"
 *     subtitle="What 26-year-old me should have known about investing"
 *     date="2026-05-29"
 *     readingTime="12 min read"
 *   >
 *     <p>When I was 26...</p>
 *     <ChartCard ...>...</ChartCard>
 *   </ArticleLayout>
 *
 * Fonts and metadata are handled by the root layout — this component only
 * provides the in-article structure (header, body column, off-white surface).
 */
export function ArticleLayout({
  title,
  subtitle,
  date,
  readingTime,
  children,
  footer,
  wideFooter,
  embedded = false,
}: ArticleLayoutProps) {
  const dateText = date && /^\d{4}-\d{2}-\d{2}/.test(date) ? formatDate(date) : date;

  return (
    <div
      className={
        embedded
          ? 'py-8 px-6 text-ink'
          : 'py-14 md:py-20 px-6 text-ink min-h-screen'
      }
    >
      <article className="mx-auto max-w-[720px]">
        <header className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-medium leading-tight tracking-heading text-ink-heading mb-3">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-lg text-ink-muted leading-snug mb-4">{subtitle}</p>
          ) : null}
          {(dateText || readingTime) ? (
            <div className="mt-4 flex gap-4 text-xs text-ink-subtle data-num">
              {dateText ? <span>{dateText}</span> : null}
              {readingTime ? <span>{readingTime}</span> : null}
            </div>
          ) : null}
        </header>

        <div className="prose prose-lg max-w-none text-[17px] leading-[1.65] text-ink">
          {children}
        </div>
        {footer}
      </article>
      {wideFooter}
    </div>
  );
}
