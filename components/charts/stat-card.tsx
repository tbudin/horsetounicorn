'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  /** Small uppercase label above the number. */
  label: string;
  /** The headline number, already formatted. */
  value: string | number;
  /** Optional small caption below the number. */
  caption?: ReactNode;
  /** Override the value colour for wins/losses or grouping. */
  valueColor?: string;
  /** Override the caption colour for emphasis. */
  captionColor?: string;
  /** Click handler — turns the card into a toggle button. */
  onClick?: () => void;
  /** Whether the card is currently selected. */
  selected?: boolean;
}

/**
 * Big-number summary card. Use in a StatGrid for summary strips.
 */
export function StatCard({
  label,
  value,
  caption,
  valueColor,
  captionColor,
  onClick,
  selected = false,
}: StatCardProps) {
  const interactive = !!onClick;

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        'px-4 py-3.5 transition-colors outline-none',
        interactive ? 'cursor-pointer' : 'cursor-default',
        selected
          ? 'bg-white border-2 border-burgundy'
          : 'bg-[#FAF7F9] border border-[#EEE6EC]',
      )}
    >
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-subtle">
        {label}
      </div>
      <div
        className={cn(
          'font-serif text-2xl md:text-[26px] font-normal leading-tight tracking-heading',
          !valueColor && (selected ? 'text-burgundy' : 'text-ink-heading'),
        )}
        style={{ color: valueColor }}
      >
        {value}
      </div>
      {caption ? (
        <div
          className={cn(
            'mt-1 text-[11px]',
            !captionColor && 'text-ink-muted',
          )}
          style={{ color: captionColor }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
}

export interface StatGridProps {
  children: ReactNode;
  /** Min card width before wrapping. Defaults to 220px. */
  minWidth?: number;
}

/** Auto-responsive grid for a row of StatCards. */
export function StatGrid({ children, minWidth = 220 }: StatGridProps) {
  return (
    <div
      className="mb-6 grid gap-3"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}
