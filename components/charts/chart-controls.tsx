'use client';

/**
 * Shared, macOS-toolbar-styled controls for interactive charts. Keeping
 * these in one place means every chart's filter row looks identical: the
 * soft tinted-pink "active" treatment, the compact icon dropdowns, and the
 * popover multi-select all match the rest of the blog's chrome.
 *
 *   <ChartToolbar label="topic">
 *     {TOPICS.map((t) => (
 *       <TopicPill key={t.key} active={...} onClick={...} glyph="●">
 *         {t.label}
 *       </TopicPill>
 *     ))}
 *   </ChartToolbar>
 *   <ChartToolbar label="filters">
 *     <ComboSelect icon={Ruler} options={METRICS} value={metric} onChange={setMetric} />
 *     <MultiSelectPopover icon={Globe} options={REGIONS} selected={regions} onChange={setRegions} />
 *     <ToggleChip icon={TrendingUp} active={trend} onClick={() => setTrend(v => !v)}>trend</ToggleChip>
 *   </ChartToolbar>
 */

import type { ReactNode } from 'react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INK_BODY, INK_SUBTLE } from '@/lib/chart-colors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Shared palette for the "active" state — a soft pink that reads as selected
// without shouting over the chart itself.
const ACTIVE_BG = '#FFE6F5';
const ACTIVE_BORDER = '#E0BBD0';
const IDLE_BORDER = '#D3D1C7';

/** One toolbar row: a small uppercase label followed by the controls. */
export function ChartToolbar({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'not-prose mb-3 flex flex-wrap items-center gap-2',
        className,
      )}
    >
      {label ? (
        <span className="mr-1 text-[11px] uppercase tracking-wider text-ink-subtle data-num">
          {label}
        </span>
      ) : null}
      {children}
    </div>
  );
}

/**
 * Toggle pill — neutral border when idle, tinted-pink fill + darker text when
 * active. Optional `glyph` renders a small marker (●/▲/◆/■) so a pill can
 * double as a legend key for its series shape.
 */
export function TopicPill({
  active,
  onClick,
  glyph,
  children,
}: {
  active: boolean;
  onClick: () => void;
  glyph?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-3 text-xs transition-colors"
      style={{
        borderColor: active ? ACTIVE_BORDER : IDLE_BORDER,
        background: active ? ACTIVE_BG : 'transparent',
        color: active ? INK_BODY : INK_SUBTLE,
      }}
    >
      {glyph ? (
        <span
          aria-hidden
          className="text-[11px] leading-none"
          style={{ opacity: active ? 1 : 0.55 }}
        >
          {glyph}
        </span>
      ) : null}
      {children}
    </button>
  );
}

/**
 * Compact icon + dropdown for single-value filters (measure, scale, …).
 * Reads as a macOS toolbar control rather than a row of pills.
 */
export function ComboSelect<T extends string>({
  icon: Icon,
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: {
  icon: LucideIcon;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  'aria-label'?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-8 w-auto gap-1.5 rounded-[6px] border-[#D3D1C7] bg-white px-2.5 text-xs text-ink-body"
      >
        <Icon className="h-3.5 w-3.5 text-ink-subtle" strokeWidth={1.75} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.key} value={o.key} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Popover multi-select with checkboxes. Empty selection conventionally means
 * "all" — the caller decides how to interpret it. Shows a "Clear selection"
 * affordance once anything is picked.
 */
export function MultiSelectPopover<T extends string>({
  icon: Icon,
  options,
  selected,
  onChange,
  allLabel = 'All',
  pluralNoun = 'items',
}: {
  icon: LucideIcon;
  options: T[];
  selected: Set<T>;
  onChange: (next: Set<T>) => void;
  /** Trigger text when nothing (or everything) is selected. */
  allLabel?: string;
  /** Used in the "N nouns" trigger label, e.g. "regions". */
  pluralNoun?: string;
}) {
  const isAll = selected.size === 0 || selected.size === options.length;
  const triggerLabel = isAll
    ? allLabel
    : selected.size === 1
      ? Array.from(selected)[0]
      : `${selected.size} ${pluralNoun}`;

  function toggle(opt: T) {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(next);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#D3D1C7] bg-white px-2.5 text-xs text-ink-body"
        >
          <Icon className="h-3.5 w-3.5 text-ink-subtle" strokeWidth={1.75} />
          {triggerLabel}
          <ChevronDown className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-44 rounded-[6px] border-[#D3D1C7] p-1">
        <ul className="text-xs">
          {options.map((opt) => {
            const on = selected.has(opt);
            return (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => toggle(opt)}
                  className="flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-ink-body hover:bg-[#FAF7F9]"
                >
                  <span
                    aria-hidden
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border"
                    style={{
                      borderColor: on ? ACTIVE_BORDER : IDLE_BORDER,
                      background: on ? ACTIVE_BG : 'transparent',
                    }}
                  >
                    {on ? <Check className="h-3 w-3 text-ink" strokeWidth={2.5} /> : null}
                  </span>
                  {opt}
                </button>
              </li>
            );
          })}
          {selected.size > 0 ? (
            <>
              <li>
                <hr className="my-1 border-[#EEE6EC]" />
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onChange(new Set())}
                  className="w-full rounded-[4px] px-2 py-1.5 text-left text-ink-subtle hover:bg-[#FAF7F9]"
                >
                  Clear selection
                </button>
              </li>
            </>
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Pill toggle with a leading icon — same active treatment as TopicPill, used
 * for on/off switches like the trend line. Supports a disabled state.
 */
export function ToggleChip({
  icon: Icon,
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  icon?: LucideIcon;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      title={title}
      className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: active && !disabled ? ACTIVE_BORDER : IDLE_BORDER,
        background: active && !disabled ? ACTIVE_BG : 'transparent',
        color: active && !disabled ? INK_BODY : INK_SUBTLE,
      }}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden /> : null}
      {children}
    </button>
  );
}
