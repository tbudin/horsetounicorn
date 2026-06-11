#!/usr/bin/env tsx
/**
 * Local CLI helper to broadcast an article.
 *
 *   pnpm broadcast my-article-slug         # creates a draft broadcast
 *   pnpm broadcast my-article-slug --send  # creates AND sends immediately
 *
 * Reads RESEND_API_KEY, RESEND_AUDIENCE_ID, EMAIL_FROM, NEXT_PUBLIC_SITE_URL
 * from .env (loaded via Node's native --env-file flag in the package.json
 * script).
 */
import { render } from '@react-email/components';
import { PostBroadcastEmail } from '@/emails/post-broadcast';
import { loadArticle } from '@/lib/articles';
import {
  getAudienceId,
  getEmailFrom,
  getEmailReplyTo,
  getResend,
} from '@/lib/resend';

async function main() {
  const [slug, ...flags] = process.argv.slice(2);
  if (!slug) {
    console.error('Usage: pnpm broadcast <slug> [--send]');
    process.exit(1);
  }
  const send = flags.includes('--send');

  let article;
  try {
    article = loadArticle(slug);
  } catch {
    console.error(`Article not found: ${slug}`);
    process.exit(1);
  }
  const { metadata } = article;

  const resend = getResend();
  const audienceId = getAudienceId();
  const from = getEmailFrom();
  const replyTo = getEmailReplyTo();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://horsetounicorn.com';
  const articleUrl = `${siteUrl}/articles/${metadata.slug}`;

  const html = await render(
    PostBroadcastEmail({
      title: metadata.title,
      description: metadata.description ?? metadata.subtitle ?? '',
      postUrl: articleUrl,
      siteUrl,
      tipUrl: process.env.NEXT_PUBLIC_STRIPE_TIP_URL,
    }),
  );

  const { data, error } = await resend.broadcasts.create({
    audienceId,
    from,
    replyTo,
    subject: metadata.title,
    html,
    name: `${metadata.slug} — ${metadata.publishedAt ?? metadata.date}`,
  });

  if (error || !data) {
    console.error('Failed to create broadcast:', error);
    process.exit(1);
  }

  console.log(`✓ Broadcast created: ${data.id}`);
  console.log(`  Preview: https://resend.com/broadcasts/${data.id}`);

  if (send) {
    const r = await resend.broadcasts.send(data.id);
    if (r.error) {
      console.error('Failed to send:', r.error);
      process.exit(1);
    }
    console.log(`✓ Sent to audience ${audienceId}`);
  } else {
    console.log(
      '(Draft only. Re-run with --send to dispatch, or send from the Resend dashboard.)',
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
