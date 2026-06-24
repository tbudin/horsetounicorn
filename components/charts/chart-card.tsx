import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChartDownloadButton } from './chart-download';

export interface ChartCardProps {
  /** Chart title, rendered in display serif at the top. */
  title: string;
  /** Short description below the title, rendered in muted body text. */
  subtitle?: string;
  /** Alias for subtitle, backward-compat for existing MDX usages. */
  description?: string;
  /** Optional pull-quote callout above the chart (e.g. headline statistic). */
  headline?: ReactNode;
  /** The chart itself, or any composed JSX (controls, legend, table). */
  children: ReactNode;
  /** Optional explanatory note in a tinted box below the chart. */
  footnote?: ReactNode;
  /** Optional methodology line at the very bottom in small grey text. */
  source?: string;
  /**
   * Wrap children in a fixed-aspect div. Use for simple MDX charts where the
   * child is a single Recharts ResponsiveContainer. Omit for composed cards
   * that already contain a ChartContainer + other children.
   */
  aspect?: 'square' | 'wide';
  /** Override max width; pass null to fill parent. Default 880px. */
  maxWidth?: number | null;
  /** Extra classes on the outer card. */
  className?: string;
}

const aspectClass: Record<NonNullable<ChartCardProps['aspect']>, string> = {
  square: 'aspect-square',
  wide: 'aspect-[16/10]',
};

/**
 * Standard wrapper for any chart on the site.
 *
 * Layout: white inner panel sitting inside the article column. Title in
 * Roboto Serif, optional subtitle below, optional headline callout above
 * the chart, optional footnote and source line below.
 *
 *   <ChartCard
 *     title="..."
 *     subtitle="..."
 *     source="..."
 *   >
 *     <ChartContainer>
 *       <ResponsiveContainer>...</ResponsiveContainer>
 *     </ChartContainer>
 *   </ChartCard>
 */
export function ChartCard({
  title,
  subtitle,
  description,
  headline,
  children,
  footnote,
  source,
  aspect,
  maxWidth = 880,
  className,
}: ChartCardProps) {
  const subText = subtitle ?? description;

  return (
    <div
      data-chart-card
      className={cn(
        'not-prose mx-auto my-8 bg-white border border-[#F0E8EE] p-5 md:p-6 text-ink',
        className,
      )}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h2 className="font-serif text-base md:text-lg font-medium tracking-heading text-ink-heading leading-tight">
          {title}
        </h2>
        <ChartDownloadButton title={title} />
      </div>
      {subText ? (
        <p className="text-sm text-ink-muted leading-relaxed mb-6">{subText}</p>
      ) : null}

      {headline ? (
        <div className="mb-6 border-l-4 border-burgundy bg-burgundy-lighter/30 px-5 py-4">
          {headline}
        </div>
      ) : null}

      {aspect ? (
        <div className={cn('w-full', aspectClass[aspect])}>{children}</div>
      ) : (
        children
      )}

      {footnote ? (
        <div className="mt-4 border border-[#F0E8EE] bg-[#FAF7F9] px-4 py-3 text-xs leading-relaxed text-ink">
          {footnote}
        </div>
      ) : null}

      {source ? (
        <p className="mt-3 text-[11px] leading-relaxed text-ink-subtle">{source}</p>
      ) : null}
    </div>
  );
}
