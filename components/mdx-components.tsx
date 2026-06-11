import Image, { type ImageProps } from 'next/image';
import Link from 'next/link';
import { ChartCard } from '@/components/charts/chart-card';
import { ExampleBarChart } from '@/components/charts/example-bar-chart';
import { ExampleLineChart } from '@/components/charts/example-line-chart';
import { Callout } from '@/components/mdx/callout';
import { cn } from '@/lib/utils';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;
type ImgProps = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * Registry of components usable inside any .mdx post.
 *
 * To add a new interactive chart to a post:
 *   1. Create the component in components/charts/your-chart.tsx
 *      (it must start with "use client" — Recharts needs the browser)
 *   2. Register it below
 *   3. Use it in MDX as <YourChart data={...} />
 */
export const mdxComponents = {
  // Default element overrides
  a: ({ href = '', children, ...props }: AnchorProps) => {
    const isExternal = /^https?:\/\//.test(href);
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-burgundy underline underline-offset-4 hover:text-burgundy/80"
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className="text-burgundy underline underline-offset-4 hover:text-burgundy/80"
      >
        {children}
      </Link>
    );
  },
  img: (props: ImgProps) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} className="rounded-md" />
  ),
  // Helpers
  Image: (props: ImageProps) => (
    <Image {...props} className={cn('rounded-md', props.className)} />
  ),
  // Custom blocks
  Callout,
  // Charts — add new ones here
  ChartCard,
  ExampleBarChart,
  ExampleLineChart,
};
