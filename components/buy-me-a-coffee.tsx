import { Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tip-jar row. Rendered as the top row inside the <ArticleShare> section
 * — both rows share the section's separators, so visually there's exactly
 * one dividing line between "If you liked this" and "Share this article".
 *
 * Hidden when NEXT_PUBLIC_STRIPE_TIP_URL is unset.
 */
export function BuyMeACoffee() {
  const url = process.env.NEXT_PUBLIC_STRIPE_TIP_URL;
  if (!url) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-5">
      <h2 className="text-[11px] uppercase tracking-wider text-ink-subtle data-num">
        If you liked this
      </h2>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={tipButtonCn}
      >
        <Coffee className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        <span>Buy me a coffee</span>
      </a>
    </div>
  );
}

const tipButtonCn = cn(
  'inline-flex h-10 items-center gap-2 rounded-md bg-background px-4 text-sm font-medium text-ink-heading',
  'border border-[#E8DCE4]',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_1px_rgba(20,8,16,0.03)]',
  'transition-all duration-200',
  'hover:-translate-y-0.5 hover:border-burgundy hover:text-burgundy',
  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(158,10,113,0.08),0_3px_6px_-2px_rgba(158,10,113,0.08)]',
  'active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(20,8,16,0.08)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2',
);
