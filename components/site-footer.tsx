import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t mt-16">
      <div className="container py-8 text-sm text-ink-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p>
          © {new Date().getFullYear()} Horse to Unicorn. Written by Thomas Budin.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/rss.xml" className="hover:text-burgundy transition-colors">
            RSS
          </Link>
          <Link href="/about" className="hover:text-burgundy transition-colors">
            About
          </Link>
          <a
            href="https://twitter.com/thomasbudin"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-burgundy transition-colors"
          >
            X / Twitter
          </a>
        </nav>
      </div>
    </footer>
  );
}
