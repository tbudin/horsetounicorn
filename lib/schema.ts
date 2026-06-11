import type { ArticleMetadata } from './articles';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
const SITE_NAME = 'Horse to Unicorn';
const SITE_DESCRIPTION =
  'Long-form essays on marketing and systems thinking for technical founders and operators.';
const AUTHOR_NAME = 'Thomas Budin';
const AUTHOR_TWITTER = 'thomasbudin';

export function siteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@id': `${SITE_URL}#person` },
  };
}

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}#person`,
    name: AUTHOR_NAME,
    url: SITE_URL,
    sameAs: [`https://twitter.com/${AUTHOR_TWITTER}`],
  };
}

export function blogSchema(articles: ArticleMetadata[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}#blog`,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    author: { '@id': `${SITE_URL}#person` },
    publisher: { '@id': `${SITE_URL}#person` },
    blogPost: articles.map((a) => ({
      '@type': 'BlogPosting',
      headline: a.title,
      url: `${SITE_URL}/articles/${a.slug}`,
      datePublished: a.publishedAt ?? a.date,
      image: a.cover,
      description: a.description ?? a.subtitle,
    })),
  };
}

export function articleSchema(article: ArticleMetadata) {
  const url = `${SITE_URL}/articles/${article.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description ?? article.subtitle,
    image: article.cover ? [article.cover] : undefined,
    datePublished: article.publishedAt ?? article.date,
    author: {
      '@type': 'Person',
      name: article.author ?? AUTHOR_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    inLanguage: 'en',
    keywords: article.tags && article.tags.length ? article.tags.join(', ') : undefined,
  };
}

export function breadcrumbSchema(article: ArticleMetadata) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.title,
        item: `${SITE_URL}/articles/${article.slug}`,
      },
    ],
  };
}
