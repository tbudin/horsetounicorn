import type { Metadata } from 'next';
import { listPublishedArticles } from '@/lib/articles';
import { SubscribeSection } from '@/components/subscribe-section';
import { ArticlesSearch } from '@/components/articles/articles-search';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Long-form essays on marketing and systems thinking.',
};

export default function ArticlesIndex() {
  const articles = listPublishedArticles();

  return (
    <div className="container max-w-3xl pt-6 md:pt-10">
      <header className="mb-10">
        <h1 className="font-serif text-4xl md:text-5xl tracking-heading leading-tight mb-3">
          Articles
        </h1>
        <p className="text-ink-muted">
          Search and filter every published essay.
        </p>
      </header>

      <ArticlesSearch articles={articles} />

      <SubscribeSection />
    </div>
  );
}
