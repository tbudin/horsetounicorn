/**
 * Shared formatters. Use these everywhere instead of inlining toString tricks.
 */

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

const isoDateFmt = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isoDate(iso: string): string {
  return isoDateFmt.format(new Date(iso));
}

// -- Numeric formatters (used by chart cards, stat cards, etc.) --------

/** Compact USD: $5k, $1.2M, $42. */
export const fmtUsd = (v: number | null | undefined): string => {
  if (v == null) return '';
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};

/** Full USD with commas: $1,234,567. */
export const fmtUsdLong = (v: number | null | undefined): string => {
  if (v == null) return '';
  return `$${Math.round(v).toLocaleString()}`;
};

/** Percentage with sign: +5.12%, -2.04%. */
export const fmtPct = (v: number | null | undefined, digits = 2): string => {
  if (v == null) return '';
  return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}%`;
};

/** Percentage without sign: 5.12%, 2.04%. */
export const fmtPctPlain = (v: number | null | undefined, digits = 2): string => {
  if (v == null) return '';
  return `${v.toFixed(digits)}%`;
};

/** Multiplier: 7.6x, 14.0x. */
export const fmtMult = (v: number | null | undefined, digits = 1): string => {
  if (v == null) return '';
  return `${v.toFixed(digits)}x`;
};

/** Date string yyyy-mm-dd → yyyy-mm (for chart axes). */
export const fmtDateAxis = (d: string | null | undefined): string => {
  if (!d) return '';
  return d.slice(0, 7);
};
