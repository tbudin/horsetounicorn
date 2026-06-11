'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Outcome = 'new' | 'resubscribed' | 'already-confirmed';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; email: string; outcome: Outcome }
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
        const data = (await res.json()) as {
          ok: boolean;
          email?: string;
          outcome?: Outcome;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          setStatus({ kind: 'error', message: data.error ?? 'Could not confirm.' });
          return;
        }
        setStatus({
          kind: 'success',
          email: data.email ?? 'your email',
          outcome: data.outcome ?? 'new',
        });
      } catch {
        setStatus({ kind: 'error', message: 'Network error. Try again?' });
      }
    })();
  }, [token]);

  if (status.kind === 'loading' || status.kind === 'idle') {
    return <p className="text-ink-muted">Confirming…</p>;
  }

  if (status.kind === 'success') {
    const copy =
      status.outcome === 'already-confirmed'
        ? {
            heading: 'You were already in.',
            body: (
              <>
                <strong>{status.email}</strong> is already subscribed — nothing
                more to do. The next post lands in your inbox when it ships.
              </>
            ),
          }
        : status.outcome === 'resubscribed'
          ? {
              heading: 'Welcome back.',
              body: (
                <>
                  <strong>{status.email}</strong> is subscribed again. We'll
                  pick up where we left off on the next post.
                </>
              ),
            }
          : {
              heading: "You're in.",
              body: (
                <>
                  We just sent a welcome email to <strong>{status.email}</strong>.
                  The next post lands in your inbox once it ships.
                </>
              ),
            };
    return (
      <div className="card-soft p-6">
        <p className="font-serif text-xl text-ink-heading mb-2">{copy.heading}</p>
        <p className="text-sm text-ink-muted leading-relaxed mb-4">{copy.body}</p>
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
