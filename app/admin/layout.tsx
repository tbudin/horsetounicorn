import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { LogoutButton } from '@/components/admin/logout-button';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[#F0E8EE]">
        <div className="container max-w-5xl flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/admin" aria-label="Admin home" className="shrink-0">
              <Image
                src="/brand/htu-logo.png"
                alt="Horse to Unicorn"
                width={32}
                height={32}
                className="rounded-md border border-[#EEE6EC]"
              />
            </Link>
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:gap-4">
              <Link
                href="/admin"
                className="text-ink-muted hover:text-ink-heading transition-colors"
              >
                Articles
              </Link>
              <Link
                href="/admin/audience"
                className="text-ink-muted hover:text-ink-heading transition-colors"
              >
                Audience
              </Link>
              <Link
                href="/articles"
                target="_blank"
                className="text-ink-muted hover:text-ink-heading transition-colors"
              >
                View public site ↗
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="container max-w-5xl py-8">{children}</main>
    </div>
  );
}
