'use client';

import { useEffect, useState } from 'react';
import { Link2, Mail, Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ArticleShareProps {
  url: string;
  title: string;
  /** Optional summary used by some share intents. */
  description?: string;
  /**
   * Optional row rendered ABOVE the share row, inside the same section so
   * a single separator is shared between the two rows instead of stacked.
   * Used for the "Buy me a coffee" tip jar.
   */
  children?: React.ReactNode;
}

/**
 * Substack-style share row, anchored at the bottom of an article. Renders X,
 * LinkedIn, Bluesky, Facebook, Email, Copy-link, and (on mobile) the native
 * share sheet. Each platform button opens its standard share URL in a new
 * tab; copy and native share happen in-page.
 */
export function ArticleShare({ url, title, description, children }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(description ?? title);

  const shareLinks = [
    {
      label: 'Share on X',
      icon: <XIcon />,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      label: 'Share on LinkedIn',
      icon: <LinkedInIcon />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: 'Share on Bluesky',
      icon: <BlueskyIcon />,
      href: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: 'Share on Facebook',
      icon: <FacebookIcon />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'Share via email',
      icon: <Mail className="h-4 w-4" strokeWidth={1.75} />,
      href: `mailto:?subject=${encodedTitle}&body=${encodedSummary}%20%0A%0A${encodedUrl}`,
    },
  ] as const;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: description ?? title, url });
    } catch {
      // User dismissed — no-op.
    }
  }

  return (
    <section aria-labelledby="article-share-heading" className="my-12">
      <hr className="separator" />
      {children ? (
        <>
          {children}
          <hr className="separator" />
        </>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 py-5">
        <h2
          id="article-share-heading"
          className="text-[11px] uppercase tracking-wider text-ink-subtle data-num"
        >
          Share this article
        </h2>
        <ul className="flex flex-wrap items-center gap-2">
          {shareLinks.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className={shareButtonCn}
              >
                {s.icon}
              </a>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={copyLink}
              aria-label="Copy link"
              className={shareButtonCn}
            >
              {copied ? (
                <Check className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Link2 className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </li>
          {hasNativeShare ? (
            <li>
              <button
                type="button"
                onClick={nativeShare}
                aria-label="Share via system sheet"
                className={shareButtonCn}
              >
                <Share2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </li>
          ) : null}
        </ul>
      </div>
      <hr className="separator" />
    </section>
  );
}

const shareButtonCn = cn(
  'inline-flex h-10 w-10 items-center justify-center rounded-md bg-background text-ink-heading',
  'border border-[#E8DCE4]',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_1px_1px_rgba(20,8,16,0.03)]',
  'transition-all duration-200',
  'hover:-translate-y-0.5 hover:border-burgundy hover:text-burgundy',
  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(158,10,113,0.08),0_3px_6px_-2px_rgba(158,10,113,0.08)]',
  'active:translate-y-0 active:shadow-[inset_0_1px_2px_rgba(20,8,16,0.08)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burgundy focus-visible:ring-offset-2',
);

// ----- Brand icons (kept inline so we don't add an icon dependency) -----

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.665l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25h6.832l4.713 6.231 5.445-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <path d="M20.452 20.452h-3.555v-5.568c0-1.328-.027-3.037-1.853-3.037-1.853 0-2.137 1.447-2.137 2.94v5.665H9.351V9h3.414v1.561h.049c.477-.9 1.637-1.852 3.37-1.852 3.602 0 4.268 2.37 4.268 5.455v6.288ZM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126ZM7.119 20.452H3.554V9h3.565v11.452ZM22.225 0H1.771C.792 0 0 .771 0 1.723v20.554C0 23.229.792 24 1.771 24h20.451c.979 0 1.778-.771 1.778-1.723V1.723C24.003.771 23.204 0 22.225 0Z" />
    </svg>
  );
}

function BlueskyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.911.58-7.386 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078-.139-.017-.277-.036-.415-.056.14.017.279.036.415.056 2.67.296 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.298-1.664-.62-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <path d="M22 12.061C22 6.504 17.523 2 12 2S2 6.504 2 12.061c0 5.022 3.657 9.184 8.438 9.939v-7.03H7.898v-2.909h2.54V9.845c0-2.522 1.492-3.915 3.777-3.915 1.094 0 2.238.197 2.238.197v2.476h-1.26c-1.243 0-1.63.775-1.63 1.57v1.888h2.773l-.443 2.909h-2.33V22c4.78-.755 8.437-4.917 8.437-9.939Z" />
    </svg>
  );
}
