'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, next }),
      });
      const data = (await res.json()) as { ok: boolean; next?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not sign in');
        return;
      }
      router.push(data.next ?? '/admin');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
      </div>
      {error ? <p className="text-xs text-burgundy">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || !password}
        className="btn-admin-primary w-full px-4 py-2 text-sm"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
