'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; email: string }
  | { kind: 'error'; message: string };

export function ConfirmForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>(token ? { kind: 'loading' } : { kind: 'error', message: 'Missing confirmation token.' });
  // Strict-mode renders the effect twice in dev; guard so we only fire one POST.
  const fired = useRef(false);

  useEffect(() => {
    if (!token || fired.current) return;
    fired.current = true;
    (async () => {
      try {
        const res = await fetch('/api/subscribe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as { ok: boolean; email?: string; error?: string };
        if (!res.ok || !data.ok) {
          setStatus({ kind: 'error', message: data.error ?? 'Could not confirm.' });
          return;
        }
        setStatus({ kind: 'success', email: data.email ?? 'your email' });
      } catch {
        setStatus({ kind: 'error', message: 'Network error. Try again?' });
      }
    })();
  }, [token]);

  if (status.kind === 'loading' || status.kind === 'idle') {
    return <p className="text-ink-muted">Confirming…</p>;
  }

  if (status.kind === 'success') {
    return (
      <div className="card-soft p-6">
        <p className="font-serif text-xl text-ink-heading mb-2">You're in.</p>
        <p className="text-sm text-ink-muted leading-relaxed mb-4">
          We just sent a welcome email to <strong>{status.email}</strong>. The
          next post lands in your inbox once it ships.
        </p>
        <Link href="/articles" className="btn-puffy">
          Read the archive →
        </Link>
      </div>
    );
  }

  return (
    <div className="card-soft p-6">
      <p className="font-serif text-xl text-ink-heading mb-2">
        We couldn't confirm.
      </p>
      <p className="text-sm text-ink-muted leading-relaxed mb-4">{status.message}</p>
      <Link href="/articles#subscribe" className="btn-puffy">
        Subscribe again →
      </Link>
    </div>
  );
}
