'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SubscribeForm({ inverted = false }: { inverted?: boolean }) {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || pending) return;
    setPending(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? 'Something went wrong. Try again?');
        return;
      }
      toast.success("You're in. Check your inbox to confirm.");
      setEmail('');
    } catch {
      toast.error('Network error. Try again?');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <input
        type="email"
        required
        placeholder="you@domain.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={pending}
        aria-label="Email address"
        className={cn(
          'flex-1 h-10 rounded-md px-3 py-2 text-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          inverted
            ? 'bg-white text-ink placeholder:text-ink-subtle border border-white focus-visible:ring-white/40 focus-visible:ring-offset-burgundy'
            : 'bg-background text-ink placeholder:text-ink-subtle border border-input focus-visible:ring-ring focus-visible:ring-offset-background',
        )}
      />
      <button
        type="submit"
        disabled={pending}
        className={inverted ? 'btn-puffy-inverse' : 'btn-puffy'}
      >
        {pending ? 'Subscribing…' : 'Subscribe'}
      </button>
    </form>
  );
}
