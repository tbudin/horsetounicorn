'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * react-day-picker chevron — defaults to its own blue arrow icons, so we
 * swap in lucide chevrons sized + coloured to match the rest of the UI.
 */
function Chevron({
  orientation = 'right',
  className,
}: {
  orientation?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}) {
  const Icon =
    orientation === 'left'
      ? ChevronLeft
      : orientation === 'right'
        ? ChevronRight
        : orientation === 'up'
          ? ChevronUp
          : ChevronDown;
  return (
    <Icon
      className={cn('h-4 w-4 text-ink-muted', className)}
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

/**
 * Calendar built on react-day-picker, styled to match the rest of the admin UI.
 * We intentionally do NOT import react-day-picker's default stylesheet — the
 * `classNames` overrides below cover every element, and the default sheet
 * brings in blue chevrons / focus rings that clash with the brand palette.
 */
function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn('p-3', className)}
      components={{ Chevron }}
      classNames={{
        months: 'flex flex-col gap-4',
        month: 'space-y-3',
        month_caption: 'flex items-center justify-center h-7 relative',
        caption_label: 'text-sm font-medium text-ink-heading',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous:
          'h-7 w-7 inline-flex items-center justify-center rounded-[6px] border border-[#EEE6EC] bg-white hover:bg-[#FAF7F9] text-ink-muted disabled:opacity-30 disabled:cursor-not-allowed',
        button_next:
          'h-7 w-7 inline-flex items-center justify-center rounded-[6px] border border-[#EEE6EC] bg-white hover:bg-[#FAF7F9] text-ink-muted disabled:opacity-30 disabled:cursor-not-allowed',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'text-ink-subtle w-9 h-7 inline-flex items-center justify-center text-[10px] uppercase tracking-wider data-num',
        week: 'flex w-full mt-1',
        day: 'h-9 w-9 p-0',
        day_button:
          'h-9 w-9 inline-flex items-center justify-center rounded-[6px] text-sm hover:bg-burgundy-lighter/40 focus:outline-none focus-visible:bg-burgundy-lighter/40 text-ink',
        today: 'font-semibold text-burgundy',
        selected:
          '[&_button]:bg-burgundy [&_button]:text-white [&_button]:hover:bg-burgundy [&_button]:hover:text-white',
        outside: 'text-ink-subtle/40',
        disabled: 'text-ink-subtle/40 opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
