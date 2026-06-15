'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToggleGroup } from '@/components/charts/toggle-group';
import { Input } from '@/components/ui/input';

type AudienceKey = 'main' | 'inner';

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  unsubscribed: boolean;
  created_at: string;
}

interface Counts {
  total: number;
  subscribed: number;
  unsubscribed: number;
}

export interface AudienceManagerProps {
  hasMain: boolean;
  hasInner: boolean;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export function AudienceManager({ hasMain, hasInner }: AudienceManagerProps) {
  const [audience, setAudience] = useState<AudienceKey>(hasMain ? 'main' : 'inner');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, subscribed: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newFirst, setNewFirst] = useState('');
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState<string | null>(null);

  const anyConfigured = hasMain || hasInner;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audience?audience=${audience}`);
      const data = (await res.json()) as {
        ok: boolean;
        contacts?: Contact[];
        counts?: Counts;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not load contacts');
        setContacts([]);
        setCounts({ total: 0, subscribed: 0, unsubscribed: 0 });
        return;
      }
      setContacts(data.contacts ?? []);
      setCounts(data.counts ?? { total: 0, subscribed: 0, unsubscribed: 0 });
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    if (anyConfigured) void load();
  }, [load, anyConfigured]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase().includes(q),
    );
  }, [contacts, query]);

  async function addContact() {
    if (adding) return;
    const email = newEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setAddMsg('Enter a valid email');
      return;
    }
    setAdding(true);
    setAddMsg(null);
    try {
      const res = await fetch('/api/admin/audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, email, firstName: newFirst.trim() || undefined }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setAddMsg(data.error ?? 'Could not add contact');
        return;
      }
      setNewEmail('');
      setNewFirst('');
      setAddMsg(`Added ${email}`);
      void load();
    } catch {
      setAddMsg('Network error');
    } finally {
      setAdding(false);
    }
  }

  async function toggleSub(c: Contact) {
    if (busyId) return;
    setBusyId(c.id);
    try {
      const res = await fetch('/api/admin/audience', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, id: c.id, unsubscribed: !c.unsubscribed }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Update failed');
        return;
      }
      void load();
    } catch {
      setError('Network error');
    } finally {
      setBusyId(null);
    }
  }

  async function removeContact(c: Contact) {
    if (busyId) return;
    if (!window.confirm(`Remove ${c.email} from this audience? This can't be undone.`)) return;
    setBusyId(c.id);
    try {
      const res = await fetch('/api/admin/audience', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience, id: c.id }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Remove failed');
        return;
      }
      void load();
    } catch {
      setError('Network error');
    } finally {
      setBusyId(null);
    }
  }

  if (!anyConfigured) {
    return (
      <div className="border-l-2 border-orange bg-orange-lighter/40 px-3 py-2 text-xs text-ink">
        No Resend audience configured. Set <code className="font-mono">RESEND_AUDIENCE_ID</code>{' '}
        (and optionally <code className="font-mono">RESEND_INNER_CIRCLE_AUDIENCE_ID</code>) in your
        environment.
      </div>
    );
  }

  const audienceOptions = [
    ...(hasMain ? [{ value: 'main' as const, label: 'Main' }] : []),
    ...(hasInner ? [{ value: 'inner' as const, label: 'Inner circle' }] : []),
  ];

  return (
    <div className="space-y-5">
      {audienceOptions.length > 1 ? (
        <ToggleGroup options={audienceOptions} value={audience} onChange={setAudience} />
      ) : null}

      {/* Counts */}
      <div className="flex flex-wrap gap-3">
        <Stat label="Total" value={counts.total} />
        <Stat label="Subscribed" value={counts.subscribed} tone="green" />
        <Stat label="Unsubscribed" value={counts.unsubscribed} tone="muted" />
      </div>

      {/* Add contact */}
      <section className="space-y-2 border border-[#EEE6EC] bg-white p-4">
        <h2 className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">
          Add contact
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="max-w-xs"
          />
          <Input
            type="text"
            value={newFirst}
            onChange={(e) => setNewFirst(e.target.value)}
            placeholder="First name (optional)"
            className="max-w-[180px]"
          />
          <button
            type="button"
            onClick={addContact}
            disabled={adding}
            className="btn-admin-secondary px-3 py-2 text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" /> {adding ? 'Adding…' : 'Add'}
          </button>
          {addMsg ? (
            <span
              className={cn(
                'text-xs',
                addMsg.startsWith('Added') ? 'text-green' : 'text-burgundy',
              )}
            >
              {addMsg}
            </span>
          ) : null}
        </div>
      </section>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email or name…"
          className="pl-8"
        />
      </div>

      {error ? <p className="text-xs text-burgundy">{error}</p> : null}

      {/* Contact list */}
      <div className="border border-[#EEE6EC] bg-white">
        <div className="flex items-center justify-between border-b border-[#EEE6EC] px-4 py-2 text-[10px] uppercase tracking-wider text-ink-subtle data-num">
          <span>{filtered.length} shown</span>
          {loading ? <span>Loading…</span> : null}
        </div>
        {filtered.length === 0 && !loading ? (
          <p className="px-4 py-8 text-center text-sm text-ink-muted">
            {query ? 'No matches.' : 'No contacts yet.'}
          </p>
        ) : (
          <ul className="divide-y divide-[#EEE6EC]">
            {filtered.map((c) => {
              const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
              return (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-ink-heading">{c.email}</div>
                    <div className="text-[11px] text-ink-subtle">
                      {name ? `${name} · ` : ''}added {fmtDate(c.created_at)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-wider data-num',
                      c.unsubscribed
                        ? 'bg-[#EEE6EC] text-ink-subtle'
                        : 'bg-green-lighter text-green',
                    )}
                  >
                    {c.unsubscribed ? 'unsubscribed' : 'subscribed'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSub(c)}
                    disabled={busyId === c.id}
                    className="btn-admin-secondary shrink-0 px-2.5 py-1 text-[11px]"
                  >
                    {c.unsubscribed ? 'Resubscribe' : 'Unsubscribe'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeContact(c)}
                    disabled={busyId === c.id}
                    title="Remove"
                    className="shrink-0 border border-[#EEE6EC] bg-white p-1.5 text-ink-subtle hover:border-burgundy hover:text-burgundy disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'green' | 'muted';
}) {
  return (
    <div className="border border-[#EEE6EC] bg-white px-4 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">{label}</div>
      <div
        className={cn(
          'text-xl font-medium data-num',
          tone === 'green' ? 'text-green' : tone === 'muted' ? 'text-ink-subtle' : 'text-ink-heading',
        )}
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}
