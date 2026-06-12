import type { MetadataRoute } from 'next';
import { listPublishedArticlesForAdmin } from '@/lib/articles';

// GitHub-fresh + ISR. Also revalidated on publish, so newly published articles
// appear immediately rather than waiting on this 10-minute fallback timer.
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
  const articles = await listPublishedArticlesForAdmin();

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
