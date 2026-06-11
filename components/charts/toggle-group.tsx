'use client';

import { cn } from '@/lib/utils';

export interface ToggleGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Pill-style toggle for switching chart views.
 *
 *   const [view, setView] = useState<'a' | 'b'>('a');
 *
 *   <ToggleGroup
 *     options={[
 *       { value: 'a', label: 'Cash sawtooth' },
 *       { value: 'b', label: 'APY sensitivity' },
 *     ]}
 *     value={view}
 *     onChange={setView}
 *   />
 */
export function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: ToggleGroupProps<T>) {
  return (
    <div className="mb-6 inline-flex gap-2 border border-[#EEE6EC] bg-[#FAF7F9] p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'px-4 py-2 text-xs font-medium outline-none transition-colors',
              active
                ? 'border border-[#EEE6EC] bg-white text-ink-heading'
                : 'border border-transparent text-ink-muted hover:text-ink-heading',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
