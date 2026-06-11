import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleLayout } from '@/components/article/article-layout';
import { ArticleAuthor } from '@/components/article/article-footer';
import { ArticleShare } from '@/components/article/article-share';
import { BuyMeACoffee } from '@/components/buy-me-a-coffee';
import { NextReading } from '@/components/article/next-reading';
import { RenderDocument } from '@/components/article/render-document';
import { SubscribeSection } from '@/components/subscribe-section';
import { loadArticle, listArticles, listPublishedArticles } from '@/lib/articles';
import { getAuthor } from '@/lib/authors';
import { getChartsFor } from '../_charts';

export const dynamicParams = false;

export function generateStaticParams() {
  return listArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { metadata } = loadArticle(slug);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
    const url = `${siteUrl}/articles/${slug}`;
    // Fall back to the auto-generated site OG image when the article has no cover.
    const defaultOg = `${siteUrl}/opengraph-image`;
    const ogImage = metadata.cover ?? defaultOg;
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
        images: [{ url: ogImage, alt: metadata.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: metadata.title,
        description: metadata.description ?? metadata.subtitle,
        images: [ogImage],
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
  let article;
  try {
    article = loadArticle(slug);
  } catch {
    notFound();
  }

  const { metadata, document } = article;
  const charts = await getChartsFor(slug);
  const author = getAuthor(metadata.author);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
  const articleUrl = `${siteUrl}/articles/${slug}`;

  const upNext = listPublishedArticles()
    .filter((a) => a.slug !== slug)
    .slice(0, 2);

  return (
    <ArticleLayout
      title={metadata.title}
      subtitle={metadata.subtitle}
      date={metadata.date}
      readingTime={metadata.readingTime}
      footer={
        <>
          <BuyMeACoffee />
          <ArticleShare
            url={articleUrl}
            title={metadata.title}
            description={metadata.description ?? metadata.subtitle}
          />
        </>
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
