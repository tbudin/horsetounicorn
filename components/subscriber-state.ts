'use client';

import { useEffect, useState } from 'react';

/**
 * Lightweight, account-free "is this visitor a subscriber?" signal, used to
 * personalise the CTA (subscribers don't need to see "Subscribe"). It's a
 * per-device localStorage flag, set when someone:
 *   - arrives from a tagged newsletter link (?s=<email>, see analytics.tsx),
 *   - submits the on-site subscribe form, or
 *   - confirms their subscription.
 *
 * This is UI personalisation, not access control: nothing is gated behind it,
 * so a stale or absent flag only affects which button we show.
 */
const KEY = 'htu_subscribed';
const EVENT = 'htu:subscribed-change';

export function markSubscribed() {
  try {
    if (localStorage.getItem(KEY) !== '1') {
      localStorage.setItem(KEY, '1');
      window.dispatchEvent(new Event(EVENT));
    }
  } catch {
    /* storage may be unavailable (private mode); the CTA just stays default */
  }
}

export function useSubscribed(): boolean {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setSubscribed(localStorage.getItem(KEY) === '1');
      } catch {
        /* ignore */
      }
    };
    read();
    window.addEventListener(EVENT, read); // same-tab updates
    window.addEventListener('storage', read); // other tabs
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener('storage', read);
    };
  }, []);

  return subscribed;
}
