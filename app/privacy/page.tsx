import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description:
    'How Horse to Unicorn handles your email address and personal data.',
};

export default function PrivacyPage() {
  const updated = 'June 2026';

  return (
    <div className="container max-w-3xl py-12 md:py-20">
      <h1 className="font-serif text-3xl md:text-4xl tracking-heading leading-tight mb-3">
        Privacy policy
      </h1>
      <p className="text-xs text-ink-subtle data-num mb-10">
        Last updated: {updated}
      </p>

      <div className="prose prose-lg max-w-none">
        <p>
          Horse to Unicorn (“we”, “the site”) is a personal newsletter written by
          Thomas Budin. This page describes what data we collect, how we use it,
          and the rights you have. We aim to collect as little as possible.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Your email address</strong>, when you subscribe to the
            newsletter. This is the only personal data we actively collect.
          </li>
          <li>
            <strong>Basic server logs</strong> (IP address, user agent, request
            path), kept transiently by our hosting provider (Vercel) for
            operational and abuse-prevention purposes.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>
            Your email is used to send the newsletter (one email per article),
            the confirmation email when you subscribe, and a welcome email when
            you confirm. We do not share it.
          </li>
          <li>
            We use double opt-in: when you subscribe we send a confirmation
            link and only add you to the list once you click it. This is your
            evidence — and ours — that you consented.
          </li>
        </ul>

        <h2>Where it lives</h2>
        <ul>
          <li>
            Our email service provider is{' '}
            <a
              href="https://resend.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Resend
            </a>
            . Your email address is stored in our Resend audience until you
            unsubscribe.
          </li>
          <li>
            Images for articles are served from Cloudflare R2. No personal data
            sits there.
          </li>
          <li>
            The site itself runs on Vercel. Vercel keeps short-lived
            request logs but receives no email content.
          </li>
        </ul>

        <h2>How long we keep it</h2>
        <p>
          Email addresses are kept for as long as you're subscribed. If you
          unsubscribe, your address is flagged as unsubscribed in Resend and is
          no longer used to send anything. We may retain the unsubscribed
          record briefly to make sure we don't accidentally re-email you.
        </p>

        <h2>Your rights</h2>
        <p>
          Under GDPR and similar regimes you have the right to:
        </p>
        <ul>
          <li>
            <strong>Unsubscribe</strong> at any time. Every newsletter has a
            one-click unsubscribe link in the footer. You can also reach the
            unsubscribe page directly at{' '}
            <a href="/unsubscribe">/unsubscribe</a> (you'll need the token from
            an old newsletter).
          </li>
          <li>
            <strong>Access, correct, or delete</strong> your data. Email{' '}
            <a href="mailto:privacy@horsetounicorn.com">
              privacy@horsetounicorn.com
            </a>{' '}
            and we'll handle it within 30 days.
          </li>
        </ul>

        <h2>Cookies</h2>
        <p>
          The site itself sets no tracking cookies. The admin panel uses one
          session cookie for authentication and only loads for the site owner.
        </p>

        <h2>Changes</h2>
        <p>
          If this policy changes materially, the next newsletter will mention
          it. The “Last updated” date above will reflect the change.
        </p>
      </div>
    </div>
  );
}
