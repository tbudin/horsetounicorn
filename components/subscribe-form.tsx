'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Status =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'sent'; email: string };

export function SubscribeForm({ inverted = false }: { inverted?: boolean }) {
  const [email, setEmail] = useState('');
  // Honeypot — kept in component state but never shown to a real user. Bots
  // tend to fill every visible input, including ones with "company" in the
  // name; humans don't because they can't see it.
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status.kind === 'pending') return;
    setStatus({ kind: 'pending' });
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company }),
      });
      const data = (await res.json()) as { ok: boolean; email?: string; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'Something went wrong. Try again?');
        setStatus({ kind: 'idle' });
        return;
      }
      setStatus({ kind: 'sent', email: data.email ?? email });
    } catch {
      toast.error('Network error. Try again?');
      setStatus({ kind: 'idle' });
    }
  }

  // Confirmation-sent state — swap the form for an inline message so the
  // user knows exactly what to do next.
  if (status.kind === 'sent') {
    return (
      <div
        className={cn(
          'w-full max-w-md rounded-md px-4 py-3 text-sm',
          inverted
            ? 'bg-white/95 text-ink-heading'
            : 'bg-burgundy-lighter/40 text-ink-heading',
        )}
        role="status"
      >
        <p className="font-medium mb-1">Check your inbox.</p>
        <p className="text-ink-muted">
          We sent a confirmation link to <strong>{status.email}</strong>. Click
          it within 14 days and you're in.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus({ kind: 'idle' });
            setEmail('');
          }}
          className="mt-2 text-xs underline text-ink-subtle hover:text-burgundy"
        >
          Wrong email? Use a different one.
        </button>
      </div>
    );
  }

  const pending = status.kind === 'pending';

  return (
    <div className="w-full max-w-md">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          aria-label="Email address"
          autoComplete="email"
          className={cn(
            'flex-1 h-10 rounded-md px-3 py-2 text-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            inverted
              ? 'bg-white text-ink placeholder:text-ink-subtle border border-white focus-visible:ring-white/40 focus-visible:ring-offset-burgundy'
              : 'bg-background text-ink placeholder:text-ink-subtle border border-input focus-visible:ring-ring focus-visible:ring-offset-background',
          )}
        />
        {/* Honeypot — hidden via inline style and aria-hidden so screen
            readers ignore it. Tab-removed so keyboard users can't reach it. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          aria-hidden
          style={{
            position: 'absolute',
            left: '-10000px',
            top: 'auto',
            width: 1,
            height: 1,
            overflow: 'hidden',
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className={inverted ? 'btn-puffy-inverse' : 'btn-puffy'}
        >
          {pending ? 'Sending…' : 'Subscribe'}
        </button>
      </form>
      <p
        className={cn(
          'mt-3 text-[11px] leading-relaxed',
          inverted ? 'text-white/80' : 'text-ink-subtle',
        )}
      >
        By subscribing you agree to receive Horse to Unicorn by email.
        Unsubscribe with one click any time. See our{' '}
        <a
          href="/privacy"
          className={cn(
            'underline',
            inverted ? 'text-white hover:text-white/90' : 'hover:text-burgundy',
          )}
        >
          privacy policy
        </a>
        .
      </p>
    </div>
  );
}
