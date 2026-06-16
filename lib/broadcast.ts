import { z } from 'zod';
import { render } from '@react-email/components';
import {
  BroadcastEmail,
  type BroadcastEmailProps,
  type EmailBlock,
} from '@/emails/broadcast/broadcast-email';
import type { ArticleMetadata } from '@/lib/articles';

/**
 * One body block. The email body is an ordered list of these, so the writer
 * can interleave prose, images/charts, and highlight lists freely.
 */
export const BodyBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('image'),
    src: z.string().min(1),
    alt: z.string().optional(),
    caption: z.string().nullish(),
  }),
  z.object({ type: z.literal('highlights'), items: z.array(z.string().min(1)) }),
]);

/** Compose payload shared by the preview / send / test routes. */
export const BroadcastComposeSchema = z.object({
  variant: z.enum(['standard', 'minimal']).default('standard'),
  audience: z.enum(['inner_circle', 'main']),
  subject: z.string().min(1),
  blocks: z.array(BodyBlockSchema).default([]),
  /** First-name sign-off rendered as "— {signoff}" at the end of the body. */
  signoff: z.string().optional().default('Tom'),
  /** ISO timestamp for a scheduled send; null/omitted = send now. */
  scheduledAt: z.string().datetime().nullish(),
});

export type BroadcastCompose = z.infer<typeof BroadcastComposeSchema>;

const absolutize = (src: string, siteUrl: string) =>
  /^https?:\/\//.test(src) ? src : `${siteUrl}${src.startsWith('/') ? '' : '/'}${src}`;

/** Turn a compose payload + article into the props the email component needs. */
export function buildBroadcastProps({
  payload,
  metadata,
  siteUrl,
}: {
  payload: BroadcastCompose;
  metadata: ArticleMetadata;
  siteUrl: string;
}): BroadcastEmailProps {
  const blocks: EmailBlock[] = payload.blocks.map((b) => {
    if (b.type === 'image') {
      return {
        type: 'image' as const,
        src: absolutize(b.src, siteUrl),
        alt: b.alt,
        caption: b.caption ?? null,
      };
    }
    return b;
  });

  // Tag the article link with the recipient's email (Resend substitutes the
  // {{{EMAIL}}} merge tag per contact) so a click identifies the subscriber in
  // analytics. The site reads ?s=, identifies, then strips it from the URL.
  // Harmless when unsubstituted (test sends): the value isn't an email, so the
  // identify is skipped.
  const articleUrl = `${siteUrl}/articles/${metadata.slug}?s={{{EMAIL}}}`;

  return {
    variant: payload.variant,
    subject: payload.subject,
    blocks,
    coverUrl: metadata.cover ? absolutize(metadata.cover, siteUrl) : undefined,
    articleTitle: metadata.title,
    articleUrl,
    signoff: payload.signoff,
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
