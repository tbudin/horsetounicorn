import { listArticlesForAdmin } from '@/lib/articles';

// Re-fetch from GitHub every 10 minutes so newly published articles flow
// to feed readers without waiting for the next Vercel build.
export const revalidate = 600;

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!,
  );
}

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
  const articles = (await listArticlesForAdmin()).filter(
    (a) => a.status === 'published',
  );

  const items = articles
    .map(
      (a) => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${base}/articles/${a.slug}</link>
      <guid>${base}/articles/${a.slug}</guid>
      <pubDate>${new Date(a.publishedAt ?? a.date).toUTCString()}</pubDate>
      <description>${escapeXml(a.description ?? a.subtitle ?? '')}</description>
    </item>`,
    )
    .join('');

  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Horse to Unicorn</title>
    <link>${base}</link>
    <description>Long-form essays on marketing and systems thinking for technical founders and operators.</description>
    <language>en</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
