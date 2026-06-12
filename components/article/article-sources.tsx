import type { SourceGroup } from '@/lib/article-doc';

export interface ArticleSourcesProps {
  /** Section label; defaults to "Sources". */
  title?: string | null;
  groups: SourceGroup[];
}

/**
 * End-of-article sources / references. Deliberately quiet: small type, muted
 * colour, tight leading, so it reads as a footnote apparatus rather than body
 * copy. Grouped into newspaper-style columns on wider screens for density.
 *
 * Reusable across articles — drop a `sources` block at the end of an article
 * document and the renderer mounts this.
 */
export function ArticleSources({ title = 'Sources', groups }: ArticleSourcesProps) {
  const visible = (groups ?? []).filter((g) => g.items && g.items.length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="not-prose mt-16 border-t border-[#EEE6EC] pt-5">
      <h2 className="mb-4 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-subtle data-num">
        {title ?? 'Sources'}
      </h2>

      <div className="gap-x-10 sm:columns-2">
        {visible.map((group, gi) => (
          <div key={gi} className="mb-4 break-inside-avoid">
            {group.heading ? (
              <div className="mb-1.5 text-[10px] uppercase tracking-[0.12em] text-ink-subtle/70">
                {group.heading}
              </div>
            ) : null}
            <ul className="space-y-1">
              {group.items.map((item, ii) => (
                <li
                  key={ii}
                  className="text-[11px] leading-relaxed text-ink-subtle"
                >
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-muted underline decoration-ink-subtle/25 underline-offset-2 transition-colors hover:text-burgundy hover:decoration-burgundy/40"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
