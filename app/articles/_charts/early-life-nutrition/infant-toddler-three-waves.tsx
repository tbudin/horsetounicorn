'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { ChartLegend } from '@/components/charts/chart-legend';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import {
  BURGUNDY,
  BLUE,
  ORANGE,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Google Trends, Worldwide, monthly. Dedicated infant/toddler export, here
// the terms scale to their own peak (vs the broad "breastfeeding"-dominated
// export where they sit at the rounding floor). June 2026 excluded.
const data = [
  { m: '2024-01', infant: 5, toddler: 3, early: 1 },
  { m: '2024-02', infant: 6, toddler: 4, early: 2 },
  { m: '2024-03', infant: 6, toddler: 3, early: 2 },
  { m: '2024-04', infant: 7, toddler: 3, early: 2 },
  { m: '2024-05', infant: 5, toddler: 3, early: 2 },
  { m: '2024-06', infant: 5, toddler: 3, early: 1 },
  { m: '2024-07', infant: 5, toddler: 3, early: 1 },
  { m: '2024-08', infant: 5, toddler: 3, early: 2 },
  { m: '2024-09', infant: 6, toddler: 3, early: 2 },
  { m: '2024-10', infant: 7, toddler: 4, early: 2 },
  { m: '2024-11', infant: 7, toddler: 3, early: 2 },
  { m: '2024-12', infant: 6, toddler: 3, early: 1 },
  { m: '2025-01', infant: 5, toddler: 3, early: 2 },
  { m: '2025-02', infant: 7, toddler: 4, early: 2 },
  { m: '2025-03', infant: 7, toddler: 4, early: 3 },
  { m: '2025-04', infant: 7, toddler: 3, early: 2 },
  { m: '2025-05', infant: 6, toddler: 3, early: 2 },
  { m: '2025-06', infant: 6, toddler: 3, early: 2 },
  { m: '2025-07', infant: 9, toddler: 5, early: 3 },
  { m: '2025-08', infant: 30, toddler: 17, early: 8 },
  { m: '2025-09', infant: 34, toddler: 17, early: 14 },
  { m: '2025-10', infant: 35, toddler: 17, early: 13 },
  { m: '2025-11', infant: 46, toddler: 22, early: 13 },
  { m: '2025-12', infant: 41, toddler: 21, early: 11 },
  { m: '2026-01', infant: 42, toddler: 24, early: 11 },
  { m: '2026-02', infant: 53, toddler: 29, early: 13 },
  { m: '2026-03', infant: 60, toddler: 37, early: 14 },
  { m: '2026-04', infant: 100, toddler: 59, early: 14 },
  { m: '2026-05', infant: 99, toddler: 57, early: 15 },
];

const SERIES = [
  { key: 'infant', label: 'Infant nutrition', color: BURGUNDY },
  { key: 'toddler', label: 'Toddler nutrition', color: BLUE },
  { key: 'early', label: 'Early childhood nutrition', color: ORANGE },
] as const;

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+mo]} ${y.slice(2)}`;
};

const EVENTS = [
  { x: '2025-08', label: 'Aug 2025: MAHA strategy + toddler-milk scrutiny' },
  { x: '2025-11', label: 'Nov 2025: ByHeart botulism recall' },
  { x: '2026-04', label: 'Apr 2026: autism research push' },
];

/**
 * Renders a small numbered circle at the top of each reference line. Keeps
 * the chart unobstructed; the full event description lives in the legend
 * underneath.
 */
const NumberedMarker = (n: number) =>
  function MarkerLabel(props: { viewBox?: { x?: number; y?: number } }) {
    const cx = props.viewBox?.x ?? 0;
    const cy = (props.viewBox?.y ?? 0) + 10;
    return (
      <g>
        <circle cx={cx} cy={cy} r={9} fill="#FFFFFF" stroke={INK_SUBTLE} strokeWidth={1} />
        <text
          x={cx}
          y={cy + 3}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill={INK}
          fontFamily="var(--font-roboto-mono), ui-monospace, monospace"
        >
          {n}
        </text>
      </g>
    );
  };

export function InfantToddlerThreeWaves() {
  return (
    <ChartCard
      title="Three news shocks lifted infant and toddler nutrition"
      subtitle="After four flat years, searches for infant and toddler nutrition stepped up three times in nine months, each step tied to a distinct early-life-nutrition news event."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          Infant-nutrition interest jumped <b>~5.5× in a single month</b> (Aug 2025),
          then climbed again after the ByHeart recall and peaked during the spring
          2026 autism cycle, a <b>~18× rise</b> off its four-year baseline.
        </p>
      }
      source="Google Trends, Worldwide, monthly, indexed 0–100 to each series' own peak. June 2026 excluded (incomplete)."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 28, right: 16, bottom: 8, left: 4 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="m"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={fmtMonth}
              interval={2}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[0, 100]}
            />
            {EVENTS.map((e, i) => (
              <ReferenceLine
                key={e.x}
                x={e.x}
                stroke={INK_SUBTLE}
                strokeDasharray="4 4"
                label={NumberedMarker(i + 1)}
              />
            ))}
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltip title={fmtMonth(String(label))}>
                    {SERIES.map((s) => {
                      const p = payload.find((pp) => pp.dataKey === s.key);
                      return (
                        <TooltipRow
                          key={s.key}
                          label={s.label}
                          value={p?.value as number}
                          dotColor={s.color}
                        />
                      );
                    })}
                  </ChartTooltip>
                );
              }}
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                name={s.label}
                {...chartDefaults}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={SERIES.map((s) => ({ label: s.label, color: s.color, shape: 'line' }))}
      />
      <ol className="mt-3 space-y-1 text-xs text-ink-muted">
        {EVENTS.map((e, i) => (
          <li key={e.x} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink-subtle text-[10px] font-medium text-ink-heading data-num"
            >
              {i + 1}
            </span>
            <span>{e.label}</span>
          </li>
        ))}
      </ol>
    </ChartCard>
  );
}

export default InfantToddlerThreeWaves;
