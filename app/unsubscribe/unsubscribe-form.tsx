'use client';

import { useState } from 'react';
import Link from 'next/link';

type Status =
  | { kind: 'confirm' }
  | { kind: 'loading' }
  | { kind: 'success'; email: string }
  | { kind: 'error'; message: string };

export function UnsubscribeForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>(
    token ? { kind: 'confirm' } : { kind: 'error', message: 'Missing unsubscribe token.' },
  );

  async function submit() {
    setStatus({ kind: 'loading' });
    try {
      const res = await fetch('/api/subscribe/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { ok: boolean; email?: string; error?: string };
      if (!res.ok || !data.ok) {
        setStatus({ kind: 'error', message: data.error ?? 'Could not unsubscribe.' });
        return;
      }
      setStatus({ kind: 'success', email: data.email ?? 'your email' });
    } catch {
      setStatus({ kind: 'error', message: 'Network error. Try again?' });
    }
  }

  if (status.kind === 'confirm') {
    return (
      <div>
        <p className="text-ink-muted mb-6 leading-relaxed">
          Are you sure? Once you unsubscribe you'll stop receiving Horse to
          Unicorn — you can always come back later.
        </p>
        <button type="button" onClick={submit} className="btn-puffy">
          Yes, unsubscribe
        </button>
      </div>
    );
  }

  if (status.kind === 'loading') {
    return <p className="text-ink-muted">Unsubscribing…</p>;
  }

  if (status.kind === 'success') {
    return (
      <div className="card-soft p-6">
        <p className="font-serif text-xl text-ink-heading mb-2">You're out.</p>
        <p className="text-sm text-ink-muted leading-relaxed mb-4">
          <strong>{status.email}</strong> won't receive any more emails from
          Horse to Unicorn. Sorry to see you go.
        </p>
        <Link href="/articles" className="btn-puffy">
          Back to the archive →
        </Link>
      </div>
    );
  }

  return (
    <div className="card-soft p-6">
      <p className="font-serif text-xl text-ink-heading mb-2">
        Couldn't unsubscribe.
      </p>
      <p className="text-sm text-ink-muted leading-relaxed">{status.message}</p>
    </div>
  );
}
