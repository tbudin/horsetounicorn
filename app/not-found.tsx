import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 text-ink">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-wider text-burgundy data-num mb-3">
          404
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-heading text-ink-heading leading-tight mb-3">
          Page not found
        </h1>
        <p className="text-ink-muted mb-8 leading-relaxed">
          The article or page you were looking for isn&rsquo;t here. It may have
          moved when the blog migrated off Substack.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/articles"
            className="bg-burgundy text-white px-4 py-2 text-sm font-medium hover:bg-burgundy/90 transition-colors"
          >
            Browse articles
          </Link>
          <Link
            href="/"
            className="text-sm text-ink-muted hover:text-ink-heading transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
