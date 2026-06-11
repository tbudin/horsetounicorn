import type { MetadataRoute } from 'next';
import { listPublishedArticles } from '@/lib/articles';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
  const articles = listPublishedArticles();

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
