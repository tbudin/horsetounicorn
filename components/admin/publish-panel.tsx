'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ArticleStatus } from '@/lib/articles';
import { cn } from '@/lib/utils';

const DELAY_PRESETS: { label: string; minutes: number }[] = [
  { label: 'Now', minutes: 0 },
  { label: '+10 min', minutes: 10 },
  { label: '+30 min', minutes: 30 },
  { label: '+1 h', minutes: 60 },
  { label: '+24 h', minutes: 60 * 24 },
];

type Action =
  | 'inner_circle'
  | 'main'
  | 'publish_only'
  | 'revert_draft'
  | 'archive';

export interface PublishPanelProps {
  slug: string;
  status: ArticleStatus;
  hasInnerCircleAudience: boolean;
  hasMainAudience: boolean;
  innerCircleSentAt?: string;
  publishedAt?: string;
}

export function PublishPanel({
  slug,
  status,
  hasInnerCircleAudience,
  hasMainAudience,
  innerCircleSentAt,
  publishedAt,
}: PublishPanelProps) {
  const router = useRouter();
  const [delay, setDelay] = useState(0);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function run(action: Action) {
    if (pendingAction) return;

    const when = delay === 0 ? 'now' : `in ${delay} minute${delay === 1 ? '' : 's'}`;
    const confirmText = (() => {
      switch (action) {
        case 'inner_circle':
          return `Send to inner-circle audience ${when}?`;
        case 'main':
          return `Send to MAIN audience ${when}? This goes to everyone.`;
        case 'publish_only':
          return 'Mark as published without sending any email?';
        case 'revert_draft':
          return 'Move article back to draft? It will be removed from the public archive.';
        case 'archive':
          return 'Archive this article? It will be hidden from the index but the URL still resolves.';
      }
    })();
    if (!window.confirm(confirmText)) return;

    setPendingAction(action);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/articles/${slug}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, delayMinutes: delay }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        broadcastId?: string;
        scheduledAt?: string | null;
        status?: ArticleStatus;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Action failed');
        return;
      }
      const parts: string[] = [];
      if (data.broadcastId)
        parts.push(`Broadcast ${data.broadcastId.slice(0, 8)} created`);
      if (data.scheduledAt)
        parts.push(`scheduled for ${new Date(data.scheduledAt).toLocaleString()}`);
      else if (action === 'inner_circle' || action === 'main') parts.push('dispatched');
      if (data.status) parts.push(`status → ${data.status}`);
      setInfo(parts.join(' · '));
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setPendingAction(null);
    }
  }

  const canInnerCircle = status === 'draft' && hasInnerCircleAudience;
  const canMain = status === 'draft' || status === 'inner_circle_sent';
  const canPublishOnly =
    status === 'draft' || status === 'inner_circle_sent' || status === 'archived';
  const canRevertToDraft = status === 'published' || status === 'archived';
  const canArchive = status === 'published';

  return (
    <section className="bg-white border border-[#EEE6EC] p-4 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-wider text-ink-subtle data-num">
          Publish
        </h2>
        <p className="text-xs text-ink-subtle data-num">Current status: {status}</p>
      </div>

      {innerCircleSentAt ? (
        <p className="text-xs text-ink-muted">
          Inner-circle sent at {new Date(innerCircleSentAt).toLocaleString()}
        </p>
      ) : null}
      {publishedAt ? (
        <p className="text-xs text-ink-muted">
          Published at {new Date(publishedAt).toLocaleString()}
        </p>
      ) : null}

      {!hasInnerCircleAudience ? (
        <div className="border-l-2 border-orange bg-orange-lighter/40 px-3 py-2 text-xs text-ink">
          <code className="font-mono">RESEND_INNER_CIRCLE_AUDIENCE_ID</code> is not
          set. Create a second audience in Resend and paste its ID into{' '}
          <code className="font-mono">.env</code> to enable the inner-circle send.
        </div>
      ) : null}

      {/* Delay (only relevant for email actions) */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">
          Send delay (for inner-circle / main only)
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {DELAY_PRESETS.map((p) => (
            <button
              key={p.minutes}
              type="button"
              onClick={() => setDelay(p.minutes)}
              className={cn(
                'border px-3 py-1.5 text-xs',
                delay === p.minutes
                  ? 'bg-burgundy text-white border-burgundy'
                  : 'bg-white text-ink-muted border-[#EEE6EC] hover:text-ink-heading',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary actions — sending / publishing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
        <ActionButton
          label="Send to inner circle"
          subLabel="for feedback before main send"
          enabled={canInnerCircle && hasInnerCircleAudience}
          pending={pendingAction === 'inner_circle'}
          onClick={() => run('inner_circle')}
        />
        <ActionButton
          label="Send to main audience"
          subLabel="email goes to everyone"
          enabled={canMain && hasMainAudience}
          pending={pendingAction === 'main'}
          onClick={() => run('main')}
        />
        <ActionButton
          label="Mark as published"
          subLabel="without sending any email"
          enabled={canPublishOnly}
          pending={pendingAction === 'publish_only'}
          onClick={() => run('publish_only')}
        />
      </div>

      {/* Reversible status actions */}
      {(canRevertToDraft || canArchive) ? (
        <div className="border-t border-[#EEE6EC] pt-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">
            Change status
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ActionButton
              label="Move back to draft"
              subLabel="article disappears from /articles"
              enabled={canRevertToDraft}
              pending={pendingAction === 'revert_draft'}
              onClick={() => run('revert_draft')}
            />
            <ActionButton
              label="Archive"
              subLabel="hidden from index, URL still works"
              enabled={canArchive}
              pending={pendingAction === 'archive'}
              onClick={() => run('archive')}
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-xs text-burgundy">{error}</p> : null}
      {info ? <p className="text-xs text-green">{info}</p> : null}
    </section>
  );
}

function ActionButton({
  label,
  subLabel,
  enabled,
  pending,
  onClick,
}: {
  label: string;
  subLabel: string;
  enabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  const isDisabled = !enabled || pending;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'text-left px-3 py-2 border bg-white text-ink-heading border-[#EEE6EC] transition-colors',
        isDisabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-burgundy',
      )}
    >
      <div className="text-xs font-medium">{pending ? 'Working…' : label}</div>
      <div className="text-[10px] mt-0.5 text-ink-subtle">{subLabel}</div>
    </button>
  );
}
