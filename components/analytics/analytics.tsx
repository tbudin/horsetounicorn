'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { markSubscribed } from '@/components/subscriber-state';

let initialized = false;

function ensureInit(): boolean {
  if (typeof window === 'undefined') return false;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false; // inert until configured
  if (!initialized) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      // App Router: we send $pageview manually on navigation. $pageleave gives
      // PostHog the dwell time it needs for time-on-article.
      capture_pageview: false,
      capture_pageleave: true,
      // Only build person profiles for identified subscribers (anonymous
      // visitors are still counted, just not profiled) — leaner + more private.
      person_profiles: 'identified_only',
    });
    initialized = true;
  }
  return true;
}

function Tracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    // A subscriber arriving from a tagged email link carries ?s=<email>. Mark
    // them as a subscriber (for the CTA) and strip the param so the email
    // doesn't linger in the URL / history / referrers. This runs regardless of
    // whether PostHog is configured; identify + pageview only when it is.
    const s = search.get('s');
    if (s) {
      const email = decodeURIComponent(s).trim().toLowerCase();
      const valid = email.includes('@');
      if (valid) markSubscribed();
      if (valid && ensureInit()) posthog.identify(email, { email });
      const url = new URL(window.location.href);
      url.searchParams.delete('s');
      window.history.replaceState(
        {},
        '',
        url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '') + url.hash,
      );
    }

    if (ensureInit()) posthog.capture('$pageview');
  }, [pathname, search]);

  return null;
}

/**
 * Public-site analytics. No-op until NEXT_PUBLIC_POSTHOG_KEY is set. Tracks
 * pageviews + dwell time and identifies subscribers who arrive from email
 * links, so time-on-article can be broken down per audience member in PostHog.
 */
export function Analytics() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
