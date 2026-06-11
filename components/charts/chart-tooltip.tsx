import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BURGUNDY } from '@/lib/chart-colors';

export interface ChartTooltipProps {
  /** Tooltip header — usually the X-axis label of the hovered point. */
  title: string | number;
  /** Body content. Pass <TooltipRow> elements. */
  children: ReactNode;
  /** Border accent colour. Defaults to brand burgundy. */
  accent?: string;
  /** Minimum width to prevent jitter when values change length. */
  minWidth?: number;
}

/**
 * Drop-in tooltip body. Use inside Recharts' `content` prop:
 *
 *   <Tooltip content={({ active, payload, label }) => {
 *     if (!active || !payload?.length) return null;
 *     const d = payload[0].payload;
 *     return (
 *       <ChartTooltip title={label}>
 *         <TooltipRow label="Value" value={fmtUsdLong(d.value)} />
 *       </ChartTooltip>
 *     );
 *   }} />
 */
export function ChartTooltip({
  title,
  children,
  accent = BURGUNDY,
  minWidth = 180,
}: ChartTooltipProps) {
  return (
    <div
      className="bg-white px-3 py-2.5 text-[11px] leading-relaxed text-ink"
      style={{ border: `1px solid ${accent}`, minWidth }}
    >
      <div className="mb-1.5 font-semibold text-ink-heading">{title}</div>
      {children}
    </div>
  );
}

export interface TooltipRowProps {
  label: string;
  value: ReactNode;
  /** Optional dot colour to the left of the label. */
  dotColor?: string;
  /** Override the row text colour (useful for "vs baseline" rows). */
  color?: string;
  bold?: boolean;
}

/** One row inside a ChartTooltip — left-aligned label, right-aligned value. */
export function TooltipRow({
  label,
  value,
  dotColor,
  color,
  bold,
}: TooltipRowProps) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-3',
        bold && 'font-semibold',
      )}
      style={{ color }}
    >
      <span className="text-ink-muted">
        {dotColor ? (
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: dotColor }}
          />
        ) : null}
        {label}
      </span>
      <b className="data-num text-ink-heading" style={{ color }}>
        {value}
      </b>
    </div>
  );
}

export interface TooltipFooterProps {
  children: ReactNode;
  color?: string;
  bold?: boolean;
}

/** Bottom row of a tooltip, separated by a subtle border. */
export function TooltipFooter({ children, color, bold }: TooltipFooterProps) {
  return (
    <div
      className={cn(
        'mt-1.5 border-t border-[#EEE6EC] pt-1 text-ink-muted',
        bold && 'font-semibold',
      )}
      style={{ color }}
    >
      {children}
    </div>
  );
}
