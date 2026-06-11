import type { ReactNode } from 'react';
import { BURGUNDY } from '@/lib/chart-colors';

export interface CalloutProps {
  /** Optional headline rendered in display serif at the top. */
  headline?: ReactNode;
  /** Body content. */
  children: ReactNode;
  /** Override the left border colour. Defaults to brand burgundy. */
  accent?: string;
}

/**
 * Pull-quote style callout for emphasis within an article. Pink wash
 * background with a coloured left border.
 *
 *   <Callout headline="The first decade matters more than the rest">
 *     <p>Waiting just one year to start...</p>
 *   </Callout>
 *
 * (For inline asides inside MDX posts — info / tip / warning variants —
 * use @/components/mdx/callout instead.)
 */
export function Callout({ headline, children, accent = BURGUNDY }: CalloutProps) {
  return (
    <div
      className="not-prose my-6 bg-burgundy-lighter/30 px-5 py-5"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {headline ? (
        <div className="font-serif text-xl md:text-[22px] font-normal leading-snug tracking-heading text-ink-heading mb-2">
          {headline}
        </div>
      ) : null}
      <div className="text-sm leading-relaxed text-ink">{children}</div>
    </div>
  );
}
