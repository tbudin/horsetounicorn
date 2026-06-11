import Image from 'next/image';
import Link from 'next/link';
import type { ArticleMetadata } from '@/lib/articles';
import { getAuthor } from '@/lib/authors';

export interface BookCardProps {
  article: ArticleMetadata;
  /** 1-indexed position used as a stable key for the read-link numeral. */
  index: number;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/**
 * Cofounder.co-inspired book card. Paper-textured surface with a 16px
 * gradient spine on the left, a multi-layer embossed shadow, and a soft
 * page shadow underneath. On hover the cover rotates open from the spine
 * — pivot at left-center with a slight rotateY — like a book being
 * cracked open. Every card is the same height: title is clamped to 2
 * lines, cover is locked to a 3:2 aspect, footer is mt-auto.
 */
export function BookCard({ article, index }: BookCardProps) {
  const { slug, title, cover, date } = article;
  const author = getAuthor(article.author);
  const monthYear = new Date(date).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const numeral = ROMAN[index] ?? String(index);

  return (
    <Link
      href={`/articles/${slug}`}
      draggable={false}
      className="group block select-none"
      style={{ perspective: '1400px' }}
    >
      <div className="book-stack w-full max-w-[290px] mx-auto">
        <div className="book-pages" aria-hidden />
        <div className="book-card book-card-3d overflow-hidden flex items-stretch w-full h-[400px]">
          <div className="book-spine" aria-hidden />
          <div className="flex-1 flex flex-col">
            <div className="px-5 pt-6 pb-5">
              <h3
                className="font-serif text-[18px] leading-[1.2] tracking-[-0.3px] text-[rgba(38,35,35,0.85)] line-clamp-3 min-h-[66px]"
                style={{
                  textShadow:
                    '0 0.5px 0.5px #FFF, 0 0.3px 0.3px rgba(0,0,0,0.12)',
                }}
              >
                {title}
              </h3>
            </div>
            <div className="px-5">
              <div
                className="h-px"
                style={{
                  background: 'rgba(38,35,35,0.10)',
                  boxShadow: '0 0.5px 0 0 rgba(255,255,255,0.8)',
                }}
              />
            </div>
            <div className="mt-auto px-5 pt-4">
              <div className="relative aspect-[3/2] overflow-hidden rounded-[6px] bg-burgundy-lighter/40">
                {cover ? (
                  <Image
                    src={cover}
                    alt={title}
                    fill
                    sizes="290px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center font-serif text-burgundy text-base">
                    Horse to Unicorn
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between px-5 pt-4 pb-5">
              <span className="font-mono text-[9px] font-medium text-[rgba(38,35,35,0.5)]">
                by {author.name}
              </span>
              <span className="font-mono text-[9px] font-medium text-[rgba(38,35,35,0.5)]">
                {monthYear}
              </span>
            </div>
          </div>
        </div>
        <div className="book-card-shadow" aria-hidden />
      </div>

      <div className="mt-[40px] flex justify-center">
        <div className="relative inline-flex items-center">
          <span className="font-mono text-[12px] leading-[16px] text-[rgba(38,35,35,0.5)] group-hover:text-[rgba(38,35,35,0.85)] transition-colors">
            Read this article
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
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.39648 2.27145C6.59175 2.07618 6.90825 2.07618 7.10352 2.27145L10.4785 5.64645C10.5102 5.67815 10.5352 5.71388 10.5566 5.75094C10.5834 5.79721 10.6044 5.84723 10.6152 5.90133C10.6282 5.96607 10.6281 6.03287 10.6152 6.09762C10.5956 6.19648 10.5471 6.28494 10.4785 6.35348L7.10352 9.72848C6.90829 9.92362 6.59173 9.92359 6.39648 9.72848C6.20125 9.53324 6.2013 9.21671 6.39648 9.02145L8.91797 6.49996H1.875C1.59896 6.49992 1.37512 6.27598 1.375 5.99996C1.375 5.72384 1.59889 5.5 1.875 5.49996H8.91797L6.39648 2.97848C6.20125 2.78324 6.2013 2.46671 6.39648 2.27145Z"
                fill="currentColor"
                fillOpacity="0.5"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
