import { ImageResponse } from 'next/og';
import {
  listArticles,
  loadArticleById,
  resolveSlug,
} from '@/lib/articles';

// Match the article route — every slug (current + previous) renders an OG.
export const dynamicParams = false;
export const alt = 'Horse to Unicorn — article cover';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  const params: { slug: string }[] = [];
  for (const a of listArticles()) {
    params.push({ slug: a.slug });
    for (const old of a.previousSlugs ?? []) {
      params.push({ slug: old });
    }
  }
  return params;
}

const BURGUNDY = '#9E0A71';
const INK_HEADING = '#000000';
const INK_MUTED = '#5C5C5C';
const CREAM = '#FAF7F9';
const HAIRLINE = '#EEE6EC';

/**
 * Per-article Open Graph image (1200x630, cream + burgundy palette).
 * Next.js auto-discovers this file colocated with the article route and
 * serves it from `/articles/<slug>/opengraph-image`, overriding the global
 * /opengraph-image.png for individual articles. Same image is used for
 * Twitter via the `summary_large_image` card.
 */
export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const resolved = resolveSlug(params.slug);
  // generateStaticParams guarantees a match, but stay defensive.
  if (!resolved) {
    return new ImageResponse(<FallbackCard />, { ...size });
  }
  const { metadata } = loadArticleById(resolved.id);
  const subtitle = metadata.description ?? metadata.subtitle ?? '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: CREAM,
          padding: '64px 80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'serif',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: BURGUNDY,
            fontFamily: 'sans-serif',
            fontWeight: 600,
          }}
        >
          Horse to Unicorn
        </div>

        {/* Title block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              fontSize: metadata.title.length > 60 ? 64 : 80,
              fontWeight: 600,
              color: INK_HEADING,
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            {metadata.title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 30,
                color: INK_MUTED,
                lineHeight: 1.3,
                fontFamily: 'sans-serif',
                fontWeight: 400,
              }}
            >
              {subtitle.length > 180 ? `${subtitle.slice(0, 177)}…` : subtitle}
            </div>
          ) : null}
        </div>

        {/* Footer hairline + meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: `2px solid ${BURGUNDY}`,
            paddingTop: 22,
            fontSize: 20,
            color: INK_MUTED,
            fontFamily: 'sans-serif',
            letterSpacing: 0.5,
          }}
        >
          <span>{metadata.author ?? 'Thomas Budin'}</span>
          <span style={{ color: HAIRLINE === HAIRLINE ? INK_MUTED : INK_MUTED }}>
            {metadata.readingTime ?? ''}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}

function FallbackCard() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: CREAM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'serif',
        color: BURGUNDY,
        fontSize: 72,
        fontWeight: 600,
      }}
    >
      Horse to Unicorn
    </div>
  );
}
