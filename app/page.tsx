import Image from 'next/image';
import Link from 'next/link';
import { listPublishedArticles } from '@/lib/articles';
import { formatDate } from '@/lib/format';
import { BookCard } from '@/components/article/book-card';
import { SubscribeSection } from '@/components/subscribe-section';

export default function HomePage() {
  const published = listPublishedArticles();
  const [featured, ...rest] = published;
  const bookGrid = rest.slice(0, 6);
  const hasMore = rest.length > bookGrid.length;

  return (
    <>
      {/* Hero — newest article */}
      <div className="container max-w-5xl pt-6 md:pt-10">
        {featured ? (
          <article className="mb-16 not-prose">
            <Link href={`/articles/${featured.slug}`} className="group block">
              <div className="grid md:grid-cols-5 gap-6 md:gap-10 items-center">
                {featured.cover ? (
                  <div className="md:col-span-3 relative aspect-[3/2] overflow-hidden rounded-2xl bg-burgundy-lighter/40">
                    <Image
                      src={featured.cover}
                      alt={featured.title}
                      fill
                      sizes="(min-width: 768px) 60vw, 100vw"
                      priority
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  </div>
                ) : (
                  <div className="md:col-span-3 aspect-[3/2] rounded-2xl bg-burgundy-lighter flex items-center justify-center">
                    <span className="font-serif text-3xl text-burgundy">
                      Horse to Unicorn
                    </span>
                  </div>
                )}

                <div className="md:col-span-2">
                  <p className="text-xs font-medium tracking-wider uppercase text-burgundy mb-3 data-num">
                    Latest
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl tracking-heading leading-tight mb-3 group-hover:text-burgundy transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-ink-muted leading-relaxed mb-4">
                    {featured.description ?? featured.subtitle}
                  </p>
                  <div className="flex items-baseline gap-3 text-xs text-ink-subtle">
                    <time dateTime={featured.date} className="data-num">
                      {formatDate(featured.date)}
                    </time>
                    {featured.readingTime ? (
                      <>
                        <span>·</span>
                        <span className="data-num">{featured.readingTime}</span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm font-medium text-burgundy">
                    Read article →
                  </p>
                </div>
              </div>
            </Link>
          </article>
        ) : null}
      </div>

      {/* Book-style cards — 1 col mobile, 2 tablet, 3 desktop */}
      {bookGrid.length > 0 ? (
        <div className="container max-w-5xl">
          <hr className="separator mb-12" />
          <div className="mb-16">
            <p className="text-[11px] uppercase tracking-wider text-ink-subtle data-num mb-10 text-center">
              Recent reading
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-10 gap-y-12 justify-items-center max-w-[1100px] mx-auto px-2">
              {bookGrid.map((a, i) => (
                <BookCard key={a.slug} article={a} index={i + 1} />
              ))}
            </div>
          </div>

          {hasMore ? (
            <>
              <div className="flex justify-center mb-16">
                <Link href="/articles" className="btn-puffy">
                  All articles →
                </Link>
              </div>
              <hr className="separator mb-16" />
            </>
          ) : null}
        </div>
      ) : null}

      <div className="container max-w-3xl">
        {published.length === 0 ? (
          <p className="text-ink-muted py-12">
            No published articles yet. Drafts live in{' '}
            <code className="font-mono">content/articles/[slug]/</code>.
          </p>
        ) : null}

        <SubscribeSection />
      </div>
    </>
  );
}
