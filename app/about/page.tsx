import type { Metadata } from 'next';
import { SubscribeSection } from '@/components/subscribe-section';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Horse to Unicorn, essays on marketing, positioning and systems by Thomas Budin, founder of Noodle in Singapore.',
};

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <h1 className="font-serif text-5xl tracking-heading leading-tight mb-6">About</h1>

      <div className="prose prose-lg max-w-none">
        <p>Hi, I&apos;m Thomas, a French founder living in Singapore.</p>
        <p>
          By day I run Noodle, a growth-marketing studio that helps entrepreneurs turn a good
          idea into a story the market actually hears. The bet behind everything I do: most
          companies that win don&apos;t have a 10× product. They have a 1.5× product and a 10×
          story. The product is rarely the hard part. The story is.
        </p>
        <p>
          <strong>Horse to Unicorn</strong> is where I write that thinking down: marketing,
          positioning, and the systems that put good work in front of the right people. I
          publish when a question grabs me, not on a schedule.
        </p>
        <p>
          The other half of me just likes data. I came to code late, after an engineering
          degree, and never stopped poking at numbers (that habit lives over at datairl.com).
          So the essays here tend to start from data, not opinion: I pull the numbers, build
          the charts, check them against primary sources, and follow where they lead, even when
          the answer surprises me.
        </p>
      </div>

      <SubscribeSection />
    </div>
  );
}
