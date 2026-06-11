import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Horse to Unicorn — weekly marketing and systems thinking for technical founders';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: '#9E0A71',
          color: '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          Horse to Unicorn
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: '0.005em',
              maxWidth: 960,
              fontFamily: 'Georgia, serif',
            }}
          >
            Weekly lessons in marketing and systems thinking for technical founders.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              opacity: 0.85,
            }}
          >
            horsetounicorn.com · by Thomas Budin
          </div>
        </div>
      </div>
    ),
    size,
  );
}
