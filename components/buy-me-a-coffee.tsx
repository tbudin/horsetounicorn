import { Coffee } from 'lucide-react';

/**
 * Tip-jar CTA. Renders an outbound link to a Stripe Payment Link (or any
 * other tip URL) set via `NEXT_PUBLIC_STRIPE_TIP_URL`. Returns null when
 * the env var is unset so the section gracefully disappears.
 *
 *   ☕ If you liked this article, buy me a coffee →
 */
export function BuyMeACoffee({
  variant = 'inline',
  className,
}: {
  /** 'inline' — small one-line CTA used at the end of an article. */
  variant?: 'inline';
  className?: string;
}) {
  const url = process.env.NEXT_PUBLIC_STRIPE_TIP_URL;
  if (!url) return null;
  // Avoid unused var warning if we add other variants later.
  void variant;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        'group inline-flex items-center gap-2 rounded-md border border-[#E8DCE4] bg-background px-4 py-2.5 text-sm text-ink-heading shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_1px_rgba(20,8,16,0.03)] transition-all hover:-translate-y-0.5 hover:border-burgundy hover:text-burgundy hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_4px_rgba(158,10,113,0.12)]'
      }
    >
      <Coffee className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      <span>If you liked this, buy me a coffee</span>
      <span
        aria-hidden
        className="-translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
      >
        →
      </span>
    </a>
  );
}
