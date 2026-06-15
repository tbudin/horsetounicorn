'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

interface Audience {
  id: string;
  name: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

export function AudienceManager() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [mainId, setMainId] = useState<string | null>(null);
  const [innerId, setInnerId] = useState<string | null>(null);
  const [audienceId, setAudienceId] = useState<string>('');
  const [bootError, setBootError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

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

  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // -- boot: list audiences --------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/audience');
        const data = (await res.json()) as {
          ok: boolean;
          audiences?: Audience[];
          mainId?: string | null;
          innerId?: string | null;
          error?: string;
        };
        if (!res.ok || !data.ok) {
          setBootError(data.error ?? 'Could not list audiences');
          return;
        }
        const auds = data.audiences ?? [];
        setAudiences(auds);
        setMainId(data.mainId ?? null);
        setInnerId(data.innerId ?? null);
        setAudienceId(
          auds.find((a) => a.id === data.mainId)?.id ?? auds[0]?.id ?? '',
        );
      } catch {
        setBootError('Network error');
      } finally {
        setBooted(true);
      }
    })();
  }, []);

  const loadContacts = useCallback(async () => {
    if (!audienceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audience/${audienceId}`);
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
  }, [audienceId]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

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
    if (!isEmail(email)) {
      setAddMsg('Enter a valid email');
      return;
    }
    setAdding(true);
    setAddMsg(null);
    try {
      const res = await fetch(`/api/admin/audience/${audienceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName: newFirst.trim() || undefined }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setAddMsg(data.error ?? 'Could not add contact');
        return;
      }
      setNewEmail('');
      setNewFirst('');
      setAddMsg(`Added ${email}`);
      void loadContacts();
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
      const res = await fetch(`/api/admin/audience/${audienceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, unsubscribed: !c.unsubscribed }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) setError(data.error ?? 'Update failed');
      else void loadContacts();
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
      const res = await fetch(`/api/admin/audience/${audienceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) setError(data.error ?? 'Remove failed');
      else void loadContacts();
    } catch {
      setError('Network error');
    } finally {
      setBusyId(null);
    }
  }

  // Bulk import — parse "email" or "email, First Last" per line, then add
  // them one at a time, throttled to respect Resend's 2 req/s limit.
  async function bulkImport() {
    if (importing) return;
    const rows = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [email, ...rest] = l.split(/[,;\t]/).map((s) => s.trim());
        return { email, firstName: rest.join(' ').trim() || undefined };
      })
      .filter((r) => isEmail(r.email));

    if (rows.length === 0) {
      setImportMsg('No valid emails found');
      return;
    }
    setImporting(true);
    let added = 0;
    let failed = 0;
    for (let i = 0; i < rows.length; i++) {
      setImportMsg(`Importing ${i + 1}/${rows.length}…`);
      try {
        const res = await fetch(`/api/admin/audience/${audienceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rows[i]),
        });
        const data = (await res.json()) as { ok: boolean };
        if (res.ok && data.ok) added++;
        else failed++;
      } catch {
        failed++;
      }
      await sleep(650); // ~1.5/s, under Resend's 2/s
    }
    setImporting(false);
    setImportMsg(`Done — ${added} added${failed ? `, ${failed} failed` : ''}.`);
    setBulkText('');
    void loadContacts();
  }

  if (!booted) {
    return <p className="text-sm text-ink-muted">Loading audiences…</p>;
  }
  if (bootError) {
    return (
      <div className="border-l-2 border-orange bg-orange-lighter/40 px-3 py-2 text-xs text-ink">
        {bootError}
        {/restricted/i.test(bootError) ? (
          <>
            {' '}
            — your <code className="font-mono">RESEND_API_KEY</code> needs audience/contact access
            (Full access), not a send-only key.
          </>
        ) : null}
      </div>
    );
  }
  if (audiences.length === 0) {
    return <p className="text-sm text-ink-muted">No audiences found in your Resend account.</p>;
  }

  const tagFor = (id: string) =>
    id === mainId ? 'main' : id === innerId ? 'inner' : null;

  return (
    <div className="space-y-5">
      {/* Audience selector */}
      <div className="flex flex-wrap gap-2">
        {audiences.map((a) => {
          const on = a.id === audienceId;
          const tag = tagFor(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAudienceId(a.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                on
                  ? 'border border-[#E7DCE5] bg-white text-ink-heading shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(20,8,16,0.07)]'
                  : 'border border-transparent bg-[#F4EFF3] text-ink-muted hover:text-ink-heading',
              )}
            >
              {a.name}
              {tag ? (
                <span className="rounded bg-burgundy-lighter/60 px-1.5 py-px text-[9px] uppercase tracking-wider text-burgundy">
                  {tag}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Counts */}
      <div className="flex flex-wrap gap-3">
        <Stat label="Total" value={counts.total} />
        <Stat label="Subscribed" value={counts.subscribed} tone="green" />
        <Stat label="Unsubscribed" value={counts.unsubscribed} tone="muted" />
      </div>

      {/* Add + bulk import */}
      <section className="space-y-3 border border-[#EEE6EC] bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">
            Add contact
          </h2>
          <button
            type="button"
            onClick={() => setShowBulk((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted hover:text-burgundy"
          >
            <Upload className="h-3.5 w-3.5" /> {showBulk ? 'Hide bulk import' : 'Bulk import'}
          </button>
        </div>

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
            <span className={cn('text-xs', addMsg.startsWith('Added') ? 'text-green' : 'text-burgundy')}>
              {addMsg}
            </span>
          ) : null}
        </div>

        {showBulk ? (
          <div className="space-y-2 border-t border-[#EEE6EC] pt-3">
            <p className="text-[11px] text-ink-subtle">
              One email per line. Optionally add a name:{' '}
              <code className="font-mono">email@x.com, Jane Doe</code>. Added one at a time
              (throttled), so large lists take a moment.
            </p>
            <Textarea
              rows={5}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'jane@example.com\nbob@example.com, Bob Smith'}
              className="font-mono text-xs"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={bulkImport}
                disabled={importing}
                className="btn-admin-primary px-3 py-2 text-xs"
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
              {importMsg ? (
                <span
                  className={cn(
                    'text-xs',
                    importMsg.startsWith('Done') ? 'text-green' : 'text-ink-muted',
                  )}
                >
                  {importMsg}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
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

      {/* Contacts */}
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
                      c.unsubscribed ? 'bg-[#EEE6EC] text-ink-subtle' : 'bg-green-lighter text-green',
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
