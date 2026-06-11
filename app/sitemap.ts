import type { MetadataRoute } from 'next';
import { listArticlesForAdmin } from '@/lib/articles';

// Re-fetch from GitHub every 10 minutes so newly published articles show up
// in the sitemap without waiting for the next Vercel build. Crawlers hit
// this rarely enough that the GitHub API cost is negligible.
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
  const articles = (await listArticlesForAdmin()).filter(
    (a) => a.status === 'published',
  );

  return [
    { url: `${base}/`, lastModified: new Date(), priority: 1 },
    { url: `${base}/articles`, lastModified: new Date(), priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), priority: 0.5 },
    ...articles.map((a) => ({
      url: `${base}/articles/${a.slug}`,
      lastModified: new Date(a.publishedAt ?? a.date),
      priority: 0.8,
    })),
  ];
}
