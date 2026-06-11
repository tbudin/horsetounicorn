import Image from 'next/image';
import Link from 'next/link';

const LOGO_URL =
  'https://substackcdn.com/image/fetch/$s_!LIK7!,e_trim:10:white/e_trim:10:transparent/h_72,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F6318765c-3106-48ab-b994-193cf2ef4cb2_1344x256.png';

export function SiteHeader() {
  return (
    <header>
      <div className="container max-w-3xl pt-6 md:pt-8">
        {/* Brand row */}
        <div className="flex items-center justify-between">
          <Link href="/" className="block" aria-label="Horse to Unicorn — home">
            <Image
              src={LOGO_URL}
              alt="Horse to Unicorn"
              width={336}
              height={64}
              priority
              className="h-5 md:h-6 w-auto"
            />
          </Link>

          <Link href="/articles#subscribe" className="btn-puffy h-9 px-4 text-xs">
            Subscribe
          </Link>
        </div>

        {/* Divider — full width of the container only */}
        <hr className="separator mt-4" />

        {/* Nav row */}
        <nav className="flex items-center gap-6 pt-3 pb-4 text-sm">
          <Link
            href="/articles"
            className="text-ink hover:text-burgundy transition-colors"
          >
            Articles
          </Link>
          <Link
            href="/about"
            className="text-ink hover:text-burgundy transition-colors"
          >
            About
          </Link>
          <Link
            href="/rss.xml"
            className="text-ink hover:text-burgundy transition-colors"
          >
            RSS
          </Link>
        </nav>
      </div>
    </header>
  );
}
