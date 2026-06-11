import Image from 'next/image';
import { SubscribeSection } from '@/components/subscribe-section';
import type { AuthorProfile } from '@/lib/authors';

/**
 * Author block — signature + profile card. Used at the end of an article,
 * above the "Up next" recommendations. The subscribe CTA is intentionally
 * NOT included here; it lives at the very end of the page via
 * `<SubscribeSection />` directly.
 */
export function ArticleAuthor({ author }: { author: AuthorProfile }) {
  return (
    <footer className="mt-16">
      <Signature author={author} />
      <AuthorCard author={author} />
    </footer>
  );
}

/**
 * Legacy combined footer (author + subscribe). Kept for backwards
 * compatibility; new pages should compose `ArticleAuthor` and
 * `SubscribeSection` directly.
 */
export function ArticleFooter({ author }: { author: AuthorProfile }) {
  return (
    <>
      <ArticleAuthor author={author} />
      <SubscribeSection />
    </>
  );
}

function Signature({ author }: { author: AuthorProfile }) {
  if (!author.signature) return null;
  return (
    <div className="mb-8">
      <Image
        src={author.signature}
        alt={`${author.name} signature`}
        width={220}
        height={80}
        className="h-14 w-auto"
      />
    </div>
  );
}

function AuthorCard({ author }: { author: AuthorProfile }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar author={author} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="font-serif text-lg text-ink-heading">{author.name}</p>
          {author.role ? (
            <p className="text-xs text-ink-subtle data-num uppercase tracking-wider">
              {author.role}
            </p>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-ink-muted leading-relaxed">{author.bio}</p>
        {author.links && author.links.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {author.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-burgundy hover:underline"
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function Avatar({ author }: { author: AuthorProfile }) {
  if (author.avatar) {
    return (
      <Image
        src={author.avatar}
        alt={author.name}
        width={64}
        height={64}
        className="h-16 w-16 rounded-full object-cover border border-[#EEE6EC] shrink-0"
      />
    );
  }
  const initials = author.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="h-16 w-16 rounded-full bg-burgundy text-white flex items-center justify-center font-serif text-xl shrink-0">
      {initials}
    </div>
  );
}
