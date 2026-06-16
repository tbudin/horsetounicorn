import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';
import { listArticles, loadArticleById, resolveSlug } from '@/lib/articles';

// Match the article route — every slug (current + previous) renders an OG.
export const dynamicParams = false;
export const alt = 'Horse to Unicorn';
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

const PINK_BG = '#FFCEF4'; // brand pink (burgundy.lighter) — title bg
const BURGUNDY = '#9E0A71';
const INK = '#2B0A1F';

function readLocalAsDataUri(filePath: string): string | null {
  try {
    return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`;
  } catch {
    return null;
  }
}

/** Load a cover (R2 absolute URL → fetch; site-relative → read from public/). */
async function loadCover(cover: string): Promise<string | null> {
  const clean = cover.split('?')[0];
  if (/^https?:\/\//.test(clean)) {
    try {
      const res = await fetch(clean);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type') ?? 'image/png';
      return `data:${ct};base64,${buf.toString('base64')}`;
    } catch {
      return null;
    }
  }
  return readLocalAsDataUri(path.join(process.cwd(), 'public', clean));
}

/**
 * Per-article Open Graph / Twitter card (1200×630). The cover fills the whole
 * frame (no border/shadow); the glossy square logo + horsetounicorn.com sits
 * above it, centered along the bottom. When there's no cover, the title shows
 * on the brand-pink background.
 */
export default async function Image({ params }: { params: { slug: string } }) {
  const resolved = resolveSlug(params.slug);
  const metadata = resolved ? loadArticleById(resolved.id).metadata : null;
  const title = metadata?.title ?? 'Horse to Unicorn';
  const cover = metadata?.cover ? await loadCover(metadata.cover) : null;
  const logo = readLocalAsDataUri(
    path.join(process.cwd(), 'public', 'brand', 'htu-logo.png'),
  );

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: PINK_BG,
          fontFamily: 'serif',
        }}
      >
        {/* Cover fills the frame; title fallback when there's none */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              textAlign: 'center',
              fontSize: title.length > 55 ? 60 : 80,
              fontWeight: 600,
              color: INK,
              lineHeight: 1.07,
              letterSpacing: -1,
              maxWidth: 980,
              padding: 64,
            }}
          >
            {title}
          </div>
        )}

        {/* Glossy logo + domain, above the cover */}
        <div
          style={{
            position: 'absolute',
            bottom: 34,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
          }}
        >
          <div style={{ position: 'relative', display: 'flex', width: 78, height: 78 }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={78}
                height={78}
                style={{
                  borderRadius: 18,
                  border: '3px solid #ffffff',
                  boxShadow: '0 9px 20px rgba(91,5,64,0.42)',
                }}
              />
            ) : null}
            {/* glossy top highlight */}
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 70,
                height: 34,
                borderRadius: 15,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0))',
              }}
            />
          </div>
          <span
            style={{
              fontFamily: 'sans-serif',
              fontSize: 33,
              fontWeight: 700,
              color: BURGUNDY,
              letterSpacing: 0.3,
            }}
          >
            horsetounicorn.com
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
