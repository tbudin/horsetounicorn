import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArticleLayout } from '@/components/article/article-layout';
import { ArticleAuthor } from '@/components/article/article-footer';
import { ArticleShare } from '@/components/article/article-share';
import { BuyMeACoffee } from '@/components/buy-me-a-coffee';
import { NextReading } from '@/components/article/next-reading';
import { RenderDocument } from '@/components/article/render-document';
import { SubscribeSection } from '@/components/subscribe-section';
import {
  listArticles,
  listPublishedArticles,
  loadArticleById,
  resolveSlug,
} from '@/lib/articles';
import { getAuthor } from '@/lib/authors';
import { getChartsFor } from '../_charts';

export const dynamicParams = false;

export function generateStaticParams() {
  // Pre-render the current slug AND every previous slug. The previous-slug
  // pages render a permanent redirect (308) to the canonical URL — so old
  // bookmarks, backlinks, and Google's cache all stay valid forever.
  const params: { slug: string }[] = [];
  for (const a of listArticles()) {
    params.push({ slug: a.slug });
    for (const old of a.previousSlugs ?? []) {
      params.push({ slug: old });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveSlug(slug);
  if (!resolved) return { title: 'Article not found' };
  try {
    const { metadata } = loadArticleById(resolved.id);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
    const url = `${siteUrl}/articles/${resolved.currentSlug}`;
    // OG + Twitter images come from app/articles/[slug]/opengraph-image.tsx —
    // Next.js auto-discovers the colocated file. We deliberately leave the
    // openGraph.images / twitter.images fields off so the dynamic generator
    // is the single source of truth.
    return {
      title: metadata.title,
      description: metadata.description ?? metadata.subtitle,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        title: metadata.title,
        description: metadata.description ?? metadata.subtitle,
        url,
        siteName: 'Horse to Unicorn',
        publishedTime: metadata.publishedAt ?? metadata.date,
        authors: [metadata.author ?? 'Thomas Budin'],
        tags: metadata.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: metadata.title,
        description: metadata.description ?? metadata.subtitle,
      },
    };
  } catch {
    return { title: 'Article not found' };
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = resolveSlug(slug);
  if (!resolved) notFound();

  // Old slug → 308 to canonical. Lives indefinitely so search engines and
  // backlinks pointing at the previous URL keep working.
  if (!resolved.isCurrent) {
    permanentRedirect(`/articles/${resolved.currentSlug}`);
  }

  let article;
  try {
    article = loadArticleById(resolved.id);
  } catch {
    notFound();
  }

  const { metadata, document } = article;
  const charts = await getChartsFor(resolved.id);
  const author = getAuthor(metadata.author);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
  const articleUrl = `${siteUrl}/articles/${resolved.currentSlug}`;

  const upNext = listPublishedArticles()
    .filter((a) => a.id !== resolved.id)
    .slice(0, 2);

  return (
    <ArticleLayout
      title={metadata.title}
      subtitle={metadata.subtitle}
      date={metadata.date}
      readingTime={metadata.readingTime}
      footer={
        <ArticleShare
          url={articleUrl}
          title={metadata.title}
          description={metadata.description ?? metadata.subtitle}
        >
          <BuyMeACoffee />
        </ArticleShare>
      }
      wideFooter={
        <>
          <div className="mx-auto max-w-[720px]">
            <ArticleAuthor author={author} />
            <hr className="separator mt-16" />
          </div>
          <NextReading articles={upNext} />
          <div className="mx-auto max-w-[720px]">
            <SubscribeSection />
          </div>
        </>
      }
    >
      <RenderDocument document={document} charts={charts} />
    </ArticleLayout>
  );
}
