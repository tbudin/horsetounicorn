import type { Metadata } from 'next';
import { SubscribeSection } from '@/components/subscribe-section';

export const metadata: Metadata = {
  title: 'About',
  description:
    'About Horse to Unicorn — weekly marketing and systems thinking for technical founders and operators.',
};

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <h1 className="font-serif text-5xl tracking-heading leading-tight mb-6">About</h1>

      <div className="prose prose-lg max-w-none">
        <p>
          <strong>Horse to Unicorn</strong> is a weekly publication on marketing and systems
          thinking for technical founders and operators.
        </p>
        <p>
          The thesis: most great companies don't ship a 10x product — they ship a 1.5x product
          with a 10x story. The hard part is the story, the positioning, and the system that
          puts them in front of the right people. That's what we dig into here.
        </p>
        <p>
          Written by <strong>Thomas Budin</strong>. Previously on Substack — moved here to be
          able to ship things like real interactive charts and proper tooling.
        </p>
        <p>
          The site is open source and built with Next.js, MDX, and Recharts.
        </p>
      </div>

      <SubscribeSection />
    </div>
  );
}
