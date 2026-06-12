'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Plus,
  X,
  Clock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Type,
  List,
  Image as ImageIcon,
} from 'lucide-react';
import type { ArticleStatus, BroadcastRecord } from '@/lib/articles';
import { cn } from '@/lib/utils';
import { ToggleGroup } from '@/components/charts/toggle-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ImageOption {
  src: string;
  label: string;
  kind: 'cover' | 'inline';
}

type Audience = 'inner_circle' | 'main';
type Variant = 'standard' | 'minimal';

type Block =
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'highlights'; items: string[] }
  | { id: string; type: 'image'; src: string };

export interface PublishComposerProps {
  articleId: string;
  title: string;
  status: ArticleStatus;
  broadcasts: { innerCircle?: BroadcastRecord; main?: BroadcastRecord };
  hasInnerCircleAudience: boolean;
  hasMainAudience: boolean;
  images: ImageOption[];
  chartNames: string[];
  /** Deterministic URL each chart's PNG would live at, for existence probing. */
  chartCandidates: Record<string, string>;
  /** Prefilled address for the real-inbox test send. */
  defaultTestEmail: string;
}

const SCHEDULE_PRESETS: { label: string; minutes: number }[] = [
  { label: 'Now', minutes: 0 },
  { label: '+10 min', minutes: 10 },
  { label: '+30 min', minutes: 30 },
  { label: '+1 h', minutes: 60 },
  { label: '+24 h', minutes: 60 * 24 },
];

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '');

export function PublishComposer({
  articleId,
  title,
  status,
  broadcasts,
  hasInnerCircleAudience,
  hasMainAudience,
  images,
  chartNames,
  chartCandidates,
  defaultTestEmail,
}: PublishComposerProps) {
  const router = useRouter();

  const [audience, setAudience] = useState<Audience>(
    hasInnerCircleAudience ? 'inner_circle' : 'main',
  );
  const [variant, setVariant] = useState<Variant>('standard');
  const [subject, setSubject] = useState(title);
  const [signoff, setSignoff] = useState('Thomas');

  const idRef = useRef(1);
  const nextId = () => String(++idRef.current);
  const [blocks, setBlocks] = useState<Block[]>([{ id: '1', type: 'text', text: '' }]);

  const [presetMinutes, setPresetMinutes] = useState<number | null>(0);
  const [customWhen, setCustomWhen] = useState<string>('');
  const [chartImages, setChartImages] = useState<Record<string, string>>({});
  const [chartBusy, setChartBusy] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  // Probe for already-generated chart PNGs so they're pickable without a
  // re-render.
  useEffect(() => {
    let cancelled = false;
    for (const [name, url] of Object.entries(chartCandidates)) {
      const probe = new Image();
      probe.onload = () => {
        if (!cancelled) setChartImages((prev) => (prev[name] ? prev : { ...prev, [name]: url }));
      };
      probe.src = url;
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // src → label, across article images + generated charts.
  const labelBySrc = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of images) m.set(i.src, i.label);
    for (const [name, src] of Object.entries(chartImages)) m.set(src, name);
    return m;
  }, [images, chartImages]);

  // Compose payload — strip ids, drop empty blocks.
  const composeBlocks = useMemo(
    () =>
      blocks
        .map((b) => {
          if (b.type === 'text') {
            const text = b.text.trim();
            return text ? { type: 'text' as const, text } : null;
          }
          if (b.type === 'highlights') {
            const items = b.items.map((h) => h.trim()).filter(Boolean);
            return items.length ? { type: 'highlights' as const, items } : null;
          }
          return b.src
            ? { type: 'image' as const, src: b.src, alt: labelBySrc.get(b.src) ?? '' }
            : null;
        })
        .filter(Boolean),
    [blocks, labelBySrc],
  );

  const composePayload = useMemo(
    () => ({ variant, audience, subject, signoff, blocks: composeBlocks }),
    [variant, audience, subject, signoff, composeBlocks],
  );

  // --- live preview (debounced) ----------------------------------------
  const payloadKey = JSON.stringify(composePayload);
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/articles/${articleId}/broadcast/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadKey,
        });
        const data = (await res.json()) as { ok: boolean; html?: string };
        if (data.ok && data.html) setPreviewHtml(data.html);
      } catch {
        /* best-effort */
      }
    }, 450);
    return () => clearTimeout(t);
  }, [articleId, payloadKey]);

  // --- block ops -------------------------------------------------------
  const update = (id: string, patch: Partial<Block>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  const remove = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const move = (id: string, dir: -1 | 1) =>
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const addBlock = (type: Block['type']) =>
    setBlocks((prev) => [
      ...prev,
      type === 'text'
        ? { id: nextId(), type: 'text', text: '' }
        : type === 'highlights'
          ? { id: nextId(), type: 'highlights', items: [''] }
          : { id: nextId(), type: 'image', src: '' },
    ]);

  // --- chart generation ------------------------------------------------
  async function generateChart(name: string) {
    if (chartBusy) return;
    setChartBusy(name);
    setChartError(null);
    try {
      const res = await fetch('/api/admin/charts/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, chart: name }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || !data.url) {
        setChartError(data.error ?? 'Render failed');
        return;
      }
      setChartImages((prev) => ({ ...prev, [name]: data.url! }));
    } catch {
      setChartError('Network error');
    } finally {
      setChartBusy(null);
    }
  }

  // --- scheduling ------------------------------------------------------
  function resolveScheduledAt(): string | null {
    if (customWhen) {
      const d = new Date(customWhen);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (presetMinutes && presetMinutes > 0) {
      return new Date(Date.now() + presetMinutes * 60_000).toISOString();
    }
    return null;
  }

  // --- test send -------------------------------------------------------
  async function sendTest() {
    if (testBusy) return;
    const to = testEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      setTestMsg('Enter a valid email address');
      return;
    }
    setTestBusy(true);
    setTestMsg(null);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/broadcast/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...composePayload, to }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      setTestMsg(res.ok && data.ok ? `Test sent to ${to}` : (data.error ?? 'Test send failed'));
    } catch {
      setTestMsg('Network error');
    } finally {
      setTestBusy(false);
    }
  }

  // --- send ------------------------------------------------------------
  async function send() {
    if (sending) return;
    const scheduledAt = resolveScheduledAt();
    const already = audience === 'inner_circle' ? broadcasts.innerCircle : broadcasts.main;
    const when = scheduledAt
      ? `scheduled for ${new Date(scheduledAt).toLocaleString()}`
      : 'sent now';
    const audienceLabel = audience === 'inner_circle' ? 'inner-circle' : 'MAIN';
    const warn = already?.sentAt
      ? `\n\n⚠ This audience already received a broadcast on ${fmt(already.sentAt)}.`
      : '';
    if (!window.confirm(`Send to the ${audienceLabel} audience — ${when}?${warn}`)) return;

    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...composePayload, scheduledAt }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        broadcastId?: string;
        scheduledAt?: string | null;
        status?: ArticleStatus;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Send failed');
        return;
      }
      const parts: string[] = [];
      if (data.broadcastId) parts.push(`Broadcast ${data.broadcastId.slice(0, 8)} created`);
      parts.push(data.scheduledAt ? `scheduled for ${fmt(data.scheduledAt)}` : 'dispatched');
      if (data.status) parts.push(`status → ${data.status}`);
      setInfo(parts.join(' · '));
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setSending(false);
    }
  }

  // --- status-only transitions -----------------------------------------
  async function statusAction(
    action: 'publish_only' | 'revert_draft' | 'archive',
    confirmText: string,
  ) {
    if (statusBusy) return;
    if (!window.confirm(confirmText)) return;
    setStatusBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; status?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Action failed');
        return;
      }
      setInfo(`status → ${data.status}`);
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(360px,440px)]">
      {/* ---- left: compose ---- */}
      <div className="space-y-6">
        {/* 1. Audience */}
        <Section title="1 · Audience">
          <div className="divide-y divide-[#EEE6EC]">
            <AudienceRow
              label="Inner circle"
              hint="A smaller list for a feedback pass before the main send."
              available={hasInnerCircleAudience}
              record={broadcasts.innerCircle}
              selected={audience === 'inner_circle'}
              onSelect={() => setAudience('inner_circle')}
            />
            <AudienceRow
              label="Main audience"
              hint="Everyone. This is the real publish."
              available={hasMainAudience}
              record={broadcasts.main}
              selected={audience === 'main'}
              onSelect={() => setAudience('main')}
            />
          </div>
        </Section>

        {/* 2. Template */}
        <Section title="2 · Template">
          <ToggleGroup
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'minimal', label: 'Minimal' },
            ]}
            value={variant}
            onChange={(v) => setVariant(v as Variant)}
          />
          <p className="text-xs text-ink-muted">
            {variant === 'standard'
              ? 'Branded header image, full chrome.'
              : 'Clean wordmark, text-first.'}
          </p>
        </Section>

        {/* 3. Compose */}
        <Section title="3 · Compose">
          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>

          <Field label="Body">
            <div className="space-y-3">
              {blocks.map((block, i) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  first={i === 0}
                  last={i === blocks.length - 1}
                  images={images}
                  chartNames={chartNames}
                  chartImages={chartImages}
                  chartBusy={chartBusy}
                  onGenerate={generateChart}
                  onChange={(patch) => update(block.id, patch)}
                  onRemove={() => remove(block.id)}
                  onMove={(dir) => move(block.id, dir)}
                />
              ))}
              {chartError ? <p className="text-xs text-burgundy">{chartError}</p> : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <AddButton icon={Type} onClick={() => addBlock('text')}>
                  Text
                </AddButton>
                <AddButton icon={List} onClick={() => addBlock('highlights')}>
                  Highlights
                </AddButton>
                <AddButton icon={ImageIcon} onClick={() => addBlock('image')}>
                  Image / chart
                </AddButton>
              </div>
            </div>
          </Field>

          <Field label="Sign-off">
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-muted">—</span>
              <Input
                value={signoff}
                onChange={(e) => setSignoff(e.target.value)}
                className="max-w-[160px]"
              />
            </div>
          </Field>

          <p className="border-t border-[#EEE6EC] pt-3 text-[11px] text-ink-subtle">
            Automatically appended after the body: a read-on-web card with the
            cover image, then the buy-me-a-coffee link and unsubscribe footer.
          </p>
        </Section>

        {/* 4. Schedule */}
        <Section title="4 · Schedule">
          <div className="flex flex-wrap gap-1.5">
            {SCHEDULE_PRESETS.map((p) => {
              const on = !customWhen && presetMinutes === p.minutes;
              return (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => {
                    setPresetMinutes(p.minutes);
                    setCustomWhen('');
                  }}
                  className={cn(
                    'border px-3 py-1.5 text-xs transition-colors',
                    on
                      ? 'border-burgundy bg-burgundy text-white'
                      : 'border-[#EEE6EC] bg-white text-ink-muted hover:text-ink-heading',
                  )}
                >
                  {p.label}
                </button>
              );
            })}
            <label
              className={cn(
                'inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs',
                customWhen ? 'border-burgundy text-ink-heading' : 'border-[#EEE6EC] text-ink-muted',
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <input
                type="datetime-local"
                value={customWhen}
                onChange={(e) => setCustomWhen(e.target.value)}
                className="bg-transparent text-xs outline-none"
              />
            </label>
          </div>
        </Section>

        {/* Test send */}
        <Section title="Test send">
          <p className="text-xs text-ink-muted">
            Send this exact email to one address to preview it in a real inbox.
            Subject is prefixed with <span className="font-mono">[TEST]</span>; no
            one on your list is emailed.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className="max-w-xs"
            />
            <button
              type="button"
              onClick={sendTest}
              disabled={testBusy}
              className="border border-[#EEE6EC] bg-white px-3 py-2 text-xs font-medium text-ink-heading hover:border-burgundy hover:text-burgundy disabled:opacity-50 transition-colors"
            >
              {testBusy ? 'Sending…' : 'Send test'}
            </button>
            {testMsg ? (
              <span
                className={cn(
                  'text-xs',
                  testMsg.startsWith('Test sent') ? 'text-green' : 'text-burgundy',
                )}
              >
                {testMsg}
              </span>
            ) : null}
          </div>
        </Section>

        {/* Send */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="bg-burgundy px-5 py-2.5 text-sm font-medium text-white hover:bg-burgundy/90 disabled:opacity-50 transition-colors"
          >
            {sending ? 'Sending…' : 'Send broadcast'}
          </button>
          {error ? <span className="text-xs text-burgundy">{error}</span> : null}
          {info ? <span className="text-xs text-green">{info}</span> : null}
        </div>

        {/* Status */}
        <Section title="Status">
          <p className="text-xs text-ink-subtle">Current status: {status}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <StatusButton
              onClick={() =>
                statusAction('publish_only', 'Mark as published without sending any email?')
              }
              disabled={statusBusy}
            >
              Mark as published
            </StatusButton>
            <StatusButton
              onClick={() =>
                statusAction(
                  'revert_draft',
                  'Move back to draft? It disappears from the public archive.',
                )
              }
              disabled={statusBusy}
            >
              Revert to draft
            </StatusButton>
            <StatusButton
              onClick={() =>
                statusAction('archive', 'Archive? Hidden from the index, URL still resolves.')
              }
              disabled={statusBusy}
            >
              Archive
            </StatusButton>
          </div>
        </Section>
      </div>

      {/* ---- right: live preview ---- */}
      <div className="space-y-2 lg:sticky lg:top-4 lg:self-start">
        <div className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">
          Live preview
        </div>
        <div className="overflow-hidden border border-[#EEE6EC] bg-white">
          <iframe title="Email preview" srcDoc={previewHtml} className="h-[640px] w-full" />
        </div>
      </div>
    </div>
  );
}

// -- block editor -------------------------------------------------------

function BlockEditor({
  block,
  first,
  last,
  images,
  chartNames,
  chartImages,
  chartBusy,
  onGenerate,
  onChange,
  onRemove,
  onMove,
}: {
  block: Block;
  first: boolean;
  last: boolean;
  images: ImageOption[];
  chartNames: string[];
  chartImages: Record<string, string>;
  chartBusy: string | null;
  onGenerate: (name: string) => void;
  onChange: (patch: Partial<Block>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const label =
    block.type === 'text' ? 'Text' : block.type === 'highlights' ? 'Highlights' : 'Image / chart';

  return (
    <div className="border border-[#EEE6EC] bg-[#FCFAFB]">
      <div className="flex items-center justify-between border-b border-[#EEE6EC] px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">
          {label}
        </span>
        <div className="flex items-center gap-0.5">
          <IconBtn disabled={first} onClick={() => onMove(-1)} title="Move up">
            <ArrowUp className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn disabled={last} onClick={() => onMove(1)} title="Move down">
            <ArrowDown className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn onClick={onRemove} title="Remove">
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>
      <div className="p-2">
        {block.type === 'text' ? (
          <Textarea
            rows={3}
            value={block.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Write a paragraph. Blank lines start a new paragraph."
          />
        ) : null}

        {block.type === 'highlights' ? (
          <HighlightsEditor
            items={block.items}
            onChange={(items) => onChange({ items })}
          />
        ) : null}

        {block.type === 'image' ? (
          <ImagePicker
            src={block.src}
            images={images}
            chartNames={chartNames}
            chartImages={chartImages}
            chartBusy={chartBusy}
            onGenerate={onGenerate}
            onPick={(src) => onChange({ src })}
          />
        ) : null}
      </div>
    </div>
  );
}

function HighlightsEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((h, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={h}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={`Highlight ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="shrink-0 border border-[#EEE6EC] bg-white p-2 text-ink-subtle hover:border-burgundy hover:text-burgundy"
            aria-label="Remove highlight"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-burgundy"
      >
        <Plus className="h-3.5 w-3.5" /> Add highlight
      </button>
    </div>
  );
}

function ImagePicker({
  src,
  images,
  chartNames,
  chartImages,
  chartBusy,
  onGenerate,
  onPick,
}: {
  src: string;
  images: ImageOption[];
  chartNames: string[];
  chartImages: Record<string, string>;
  chartBusy: string | null;
  onGenerate: (name: string) => void;
  onPick: (src: string) => void;
}) {
  if (src) {
    return (
      <div className="space-y-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="max-h-40 w-auto border border-[#EEE6EC]" />
        <button
          type="button"
          onClick={() => onPick('')}
          className="text-[11px] text-ink-subtle hover:text-burgundy"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img) => (
            <button
              key={img.src}
              type="button"
              onClick={() => onPick(img.src)}
              className="overflow-hidden border border-[#EEE6EC] bg-white hover:border-burgundy"
              title={img.label}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.label} className="aspect-[3/2] w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {chartNames.length > 0 ? (
        <>
          <div className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">
            Charts
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {chartNames.map((name) => {
              const url = chartImages[name];
              if (url) {
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onPick(url)}
                    className="overflow-hidden border border-[#EEE6EC] bg-white hover:border-burgundy"
                    title={name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={name} className="aspect-[3/2] w-full object-contain" />
                  </button>
                );
              }
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onGenerate(name)}
                  disabled={chartBusy === name}
                  className="flex aspect-[3/2] flex-col items-center justify-center gap-1 border border-dashed border-[#EEE6EC] bg-white px-1 text-center text-ink-subtle hover:border-burgundy hover:text-burgundy disabled:opacity-50"
                  title={name}
                >
                  <span className="truncate font-mono text-[9px] leading-tight">{name}</span>
                  <span className="text-[9px] uppercase tracking-wider">
                    {chartBusy === name ? 'Rendering…' : 'Generate'}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

// -- small building blocks ----------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border border-[#EEE6EC] bg-white p-4">
      <h2 className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle data-num">{label}</div>
      {children}
    </div>
  );
}

function AddButton({
  icon: Icon,
  onClick,
  children,
}: {
  icon: typeof Type;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 border border-[#EEE6EC] bg-white px-2.5 py-1.5 text-xs text-ink-muted hover:border-burgundy hover:text-burgundy transition-colors"
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-1 text-ink-subtle hover:text-burgundy disabled:opacity-30 disabled:hover:text-ink-subtle"
    >
      {children}
    </button>
  );
}

function AudienceRow({
  label,
  hint,
  available,
  record,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  available: boolean;
  record?: BroadcastRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const statusEl = !available ? (
    <span className="text-[11px] text-ink-subtle">not configured</span>
  ) : record?.sentAt ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-green">
      <Check className="h-3.5 w-3.5" /> Sent {fmt(record.sentAt)}
    </span>
  ) : record?.scheduledFor ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-orange">
      <Clock className="h-3.5 w-3.5" /> Scheduled {fmt(record.scheduledFor)}
    </span>
  ) : (
    <span className="text-[11px] text-ink-subtle">Not sent yet</span>
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!available}
      className="flex w-full items-center gap-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
          selected ? 'border-burgundy' : 'border-ink-subtle',
        )}
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-burgundy" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink-heading">{label}</span>
        <span className="block text-xs text-ink-muted">{hint}</span>
      </span>
      <span className="shrink-0">{statusEl}</span>
    </button>
  );
}

function StatusButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="border border-[#EEE6EC] bg-white px-3 py-1.5 text-xs text-ink-heading hover:border-burgundy hover:text-burgundy disabled:opacity-40 transition-colors"
    >
      {children}
    </button>
  );
}
