import { z } from 'zod';
import { render } from '@react-email/components';
import {
  BroadcastEmail,
  type BroadcastEmailProps,
} from '@/emails/broadcast/broadcast-email';
import { getAuthor } from '@/lib/authors';
import type { ArticleMetadata } from '@/lib/articles';

/** Shared compose payload sent by the publish composer to the preview + send
 *  routes. The server fills in author / articleUrl / tipUrl / siteUrl. */
export const BroadcastComposeSchema = z.object({
  variant: z.enum(['standard', 'minimal']).default('standard'),
  audience: z.enum(['inner_circle', 'main']),
  subject: z.string().min(1),
  intro: z.string().optional().default(''),
  highlights: z.array(z.string().min(1)).default([]),
  blocks: z
    .array(
      z.object({
        src: z.string().min(1),
        alt: z.string().optional(),
        caption: z.string().nullish(),
      }),
    )
    .default([]),
  /** ISO timestamp for a scheduled send; null/omitted = send now. */
  scheduledAt: z.string().datetime().nullish(),
});

export type BroadcastCompose = z.infer<typeof BroadcastComposeSchema>;

const absolutize = (src: string, siteUrl: string) =>
  /^https?:\/\//.test(src) ? src : `${siteUrl}${src.startsWith('/') ? '' : '/'}${src}`;

/**
 * Turn a compose payload + article into the props the BroadcastEmail React
 * component expects: image srcs absolutized, author resolved, tip + site URLs
 * injected.
 */
export function buildBroadcastProps({
  payload,
  metadata,
  siteUrl,
}: {
  payload: BroadcastCompose;
  metadata: ArticleMetadata;
  siteUrl: string;
}): BroadcastEmailProps {
  const author = getAuthor(metadata.author);
  return {
    variant: payload.variant,
    subject: payload.subject,
    intro: payload.intro,
    highlights: payload.highlights,
    blocks: payload.blocks.map((b) => ({
      type: 'image' as const,
      src: absolutize(b.src, siteUrl),
      alt: b.alt,
      caption: b.caption ?? null,
    })),
    articleUrl: `${siteUrl}/articles/${metadata.slug}`,
    author: {
      name: author.name,
      avatarUrl: author.avatar ? absolutize(author.avatar, siteUrl) : undefined,
    },
    tipUrl: process.env.NEXT_PUBLIC_STRIPE_TIP_URL,
    siteUrl,
  };
}

/** Render the broadcast email to an HTML string. */
export function renderBroadcastHtml(args: {
  payload: BroadcastCompose;
  metadata: ArticleMetadata;
  siteUrl: string;
}): Promise<string> {
  return render(BroadcastEmail(buildBroadcastProps(args)));
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
}
