'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  /** Date value in ISO yyyy-mm-dd format (or empty string for no date). */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function fmtIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  // Treat as local midnight to avoid UTC offsetting the displayed day.
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

const FORMATTER = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  disabled,
}: DatePickerProps) {
  const selected = value ? parseIsoDate(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        className={cn(
          'inline-flex h-9 w-full items-center justify-between border border-[#EEE6EC] bg-white px-3 py-2 text-sm text-ink',
          'focus:outline-none focus:border-burgundy',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-ink-subtle',
          className,
        )}
      >
        {selected ? FORMATTER.format(selected) : placeholder}
        <CalendarIcon className="h-4 w-4 text-ink-subtle" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => onChange?.(d ? fmtIsoDate(d) : '')}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
