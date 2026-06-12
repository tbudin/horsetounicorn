'use client';

import { cn } from '@/lib/utils';

export interface ToggleGroupOption<T extends string> {
  value: T;
  label: string;
  /** Optional muted secondary text, e.g. a price or count. */
  hint?: string;
}

export interface ToggleGroupProps<T extends string> {
  options: ToggleGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Segmented control. A soft inset track with a raised white pill on the active
 * option — the same tactile language as the site's puffy buttons.
 *
 *   <ToggleGroup
 *     options={[
 *       { value: 'a', label: 'Cofounder Pro', hint: '$20' },
 *       { value: 'b', label: 'Team Plan', hint: '$50' },
 *     ]}
 *     value={view}
 *     onChange={setView}
 *   />
 */
export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className,
}: ToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex gap-1 rounded-[10px] border border-[#EAE1E8] bg-[#F4EFF3] p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              'rounded-[7px] px-3.5 py-1.5 text-xs font-medium outline-none transition-all',
              'focus-visible:ring-2 focus-visible:ring-burgundy/30',
              active
                ? 'border border-[#E7DCE5] bg-white text-ink-heading shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(20,8,16,0.07)]'
                : 'border border-transparent text-ink-muted hover:text-ink-heading',
            )}
          >
            {opt.label}
            {opt.hint ? <span className="ml-1.5 text-ink-subtle">{opt.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
