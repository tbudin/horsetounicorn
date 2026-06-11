import Image from 'next/image';
import Link from 'next/link';
import type { ArticleMetadata } from '@/lib/articles';

export interface NextReadingProps {
  /** The articles to recommend — pass at most 2. */
  articles: ArticleMetadata[];
}

/**
 * "Envelope" cards at the end of every article. Cofounder.co-inspired:
 * a thin lip at the top, a cover-image pocket peeking out from underneath
 * the lip, and the bottom card holding the text. On hover the pocket
 * slides up and reveals more of the cover, like pulling a postcard out
 * of an envelope.
 */
export function NextReading({ articles }: NextReadingProps) {
  const pool = articles.slice(0, 2);
  if (pool.length === 0) return null;

  return (
    <section className="mt-16 mb-24 flex flex-col items-center px-6">
      <p className="text-[11px] uppercase tracking-wider text-ink-subtle data-num mb-10 text-center">
        Up next
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-16 justify-items-center">
        {pool.map((a) => (
          <NextReadingCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}

const CARD_BG = '#FAFAF7';
const EMBOSSED_FULL =
  'inset 0 2px 1px 0 #fff, inset 0 0 0 0.93px #fff, 0 0 0 0.93px rgba(0,0,0,0.08), 0 4px 8px 0 rgba(0,0,0,0.03), 0 9px 8px 0 rgba(0,0,0,0.02)';
const EMBOSSED_TOP_ONLY =
  'inset 0 2px 1px 0 #fff, inset 0 0 0 0.93px #fff, 0 0 0 0.93px rgba(0,0,0,0.08)';
const EMBOSSED_NO_BOTTOM =
  'inset 0 2px 1px 0 #fff, inset 0 0 0 0.93px #fff, 0 0 0 0.93px rgba(0,0,0,0.08), 0 4px 8px 0 rgba(0,0,0,0.03)';

function NextReadingCard({ article }: { article: ArticleMetadata }) {
  const { slug, title, description, subtitle, cover, date } = article;
  const blurb = description ?? subtitle;
  const monthYear = new Date(date).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      href={`/articles/${slug}`}
      draggable={false}
      className="group block select-none w-[328px]"
    >
      <div className="relative pt-[3px]">
        {/* Envelope lip — page-coloured strip across the top with rounded
            top corners and the embossed hairline edge. */}
        <div
          aria-hidden
          className="relative z-[1] flex w-[328px] h-[64px] rounded-t-[12px] bg-background"
          style={{ boxShadow: EMBOSSED_TOP_ONLY }}
        />

        {/* Cover pocket — sits behind the content card. On hover translates
            up by 20% of its own height to expose more of the cover. */}
        <div
          aria-hidden
          className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[292px] h-[150px] z-[2] rounded-[12px] overflow-hidden transition-transform duration-500 ease-out group-hover:-translate-y-[20%]"
          style={{
            background: CARD_BG,
            boxShadow: EMBOSSED_FULL,
          }}
        >
          <div className="w-full h-full p-[10px] pb-0 box-border">
            <div className="relative w-full h-full rounded-t-[9px] overflow-hidden bg-burgundy-lighter/40">
              {cover ? (
                <Image
                  src={cover}
                  alt={title}
                  fill
                  sizes="292px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-serif text-burgundy text-base">
                  Horse to Unicorn
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content card — sits flush against the lip. Holds date, title,
            description and the "Read full story" CTA. */}
        <div className="relative z-[3]">
          <div
            className="flex flex-col w-[328px] h-[230px] px-7 py-5 rounded-b-[12px]"
            style={{ background: CARD_BG, boxShadow: EMBOSSED_NO_BOTTOM }}
          >
            <div className="font-mono text-[11px] uppercase tracking-wider text-[rgba(38,35,35,0.5)] mb-3">
              {monthYear}
            </div>
            <h3
              className="font-serif text-[19px] leading-[120%] tracking-[-0.3px] text-[rgba(38,35,35,0.85)] line-clamp-2 mb-2"
              style={{
                textShadow:
                  '0 0.5px 0.5px #FFF, 0 0.3px 0.3px rgba(0,0,0,0.12)',
              }}
            >
              {title}
            </h3>
            {blurb ? (
              <p className="font-serif text-[13px] leading-[140%] text-[rgba(38,35,35,0.7)] line-clamp-2">
                {blurb}
              </p>
            ) : null}

            <div className="mt-auto pt-4">
              <div className="relative inline-flex items-center">
                <span className="font-mono text-[12px] leading-[16px] text-[rgba(38,35,35,0.5)] group-hover:text-[rgba(38,35,35,0.85)] transition-colors">
                  Read full story
                </span>
                <span
                  className="absolute left-full top-0 bottom-0 ml-[6px] flex items-center opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9"
                      stroke="rgba(38,35,35,0.85)"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
