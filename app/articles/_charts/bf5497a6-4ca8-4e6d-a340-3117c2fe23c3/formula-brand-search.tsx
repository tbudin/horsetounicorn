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
  GREEN,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Google Trends, Worldwide, monthly search interest for infant-formula PRODUCT
// brands (via pytrends), far cleaner than parent-company topics, which mix in
// each conglomerate's entire (non-infant) business. June 2026 excluded.
const data = [
  { m: '2024-06', similac: 21, enfamil: 17, aptamil: 23, bobbie: 15, byheart: 1 },
  { m: '2024-07', similac: 22, enfamil: 18, aptamil: 23, bobbie: 14, byheart: 1 },
  { m: '2024-08', similac: 24, enfamil: 20, aptamil: 23, bobbie: 15, byheart: 1 },
  { m: '2024-09', similac: 22, enfamil: 20, aptamil: 22, bobbie: 17, byheart: 1 },
  { m: '2024-10', similac: 23, enfamil: 18, aptamil: 22, bobbie: 22, byheart: 1 },
  { m: '2024-11', similac: 21, enfamil: 17, aptamil: 22, bobbie: 24, byheart: 1 },
  { m: '2024-12', similac: 21, enfamil: 18, aptamil: 21, bobbie: 28, byheart: 1 },
  { m: '2025-01', similac: 22, enfamil: 18, aptamil: 23, bobbie: 25, byheart: 1 },
  { m: '2025-02', similac: 21, enfamil: 19, aptamil: 22, bobbie: 25, byheart: 1 },
  { m: '2025-03', similac: 22, enfamil: 18, aptamil: 22, bobbie: 49, byheart: 1 },
  { m: '2025-04', similac: 21, enfamil: 17, aptamil: 23, bobbie: 75, byheart: 1 },
  { m: '2025-05', similac: 20, enfamil: 17, aptamil: 23, bobbie: 90, byheart: 1 },
  { m: '2025-06', similac: 21, enfamil: 17, aptamil: 23, bobbie: 89, byheart: 1 },
  { m: '2025-07', similac: 23, enfamil: 19, aptamil: 25, bobbie: 85, byheart: 1 },
  { m: '2025-08', similac: 24, enfamil: 19, aptamil: 28, bobbie: 52, byheart: 1 },
  { m: '2025-09', similac: 24, enfamil: 19, aptamil: 27, bobbie: 38, byheart: 2 },
  { m: '2025-10', similac: 23, enfamil: 18, aptamil: 27, bobbie: 37, byheart: 2 },
  { m: '2025-11', similac: 24, enfamil: 18, aptamil: 29, bobbie: 36, byheart: 12 },
  { m: '2025-12', similac: 21, enfamil: 18, aptamil: 25, bobbie: 36, byheart: 2 },
  { m: '2026-01', similac: 27, enfamil: 21, aptamil: 43, bobbie: 27, byheart: 1 },
  { m: '2026-02', similac: 25, enfamil: 18, aptamil: 42, bobbie: 23, byheart: 1 },
  { m: '2026-03', similac: 27, enfamil: 21, aptamil: 32, bobbie: 20, byheart: 1 },
  { m: '2026-04', similac: 36, enfamil: 29, aptamil: 29, bobbie: 25, byheart: 1 },
  { m: '2026-05', similac: 30, enfamil: 25, aptamil: 27, bobbie: 24, byheart: 1 },
];

const SERIES = [
  { key: 'bobbie', label: 'Bobbie', color: BURGUNDY },
  { key: 'aptamil', label: 'Aptamil (Danone)', color: BLUE },
  { key: 'similac', label: 'Similac (Abbott)', color: ORANGE },
  { key: 'enfamil', label: 'Enfamil (Reckitt)', color: GREEN },
  { key: 'byheart', label: 'ByHeart', color: INK },
] as const;

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+mo]} ${y.slice(2)}`;
};

const EVENTS = [
  { x: '2025-04', label: 'Apr 2025 — Bobbie surge (Operation Stork Speed)' },
  { x: '2025-11', label: 'Nov 2025 — ByHeart botulism recall' },
  { x: '2026-01', label: 'Jan 2026 — Aptamil cereulide recall' },
];

/**
 * Small numbered circle marker on each reference line — keeps the chart
 * unobstructed; the full event text lives in the numbered legend below.
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

export function FormulaBrandSearch() {
  return (
    <ChartCard
      title="Each formula brand spiked for a different reason"
      subtitle="Tracking the product brands (not the parent conglomerates) isolates infant-formula interest. The result: four brands, four distinct stories in the same 18 months."
      footnote={
        <>
          ByHeart shows here as a monthly average; its actual jump was a single
          week, the Nov 9 2025 recall week hit <b>34×</b> its baseline before fading.
          Aptamil&apos;s Jan–Feb 2026 lift is the cereulide recall; Similac and
          Enfamil tick up in spring 2026 (autism cycle + the April Similac NEC
          verdict); Bobbie&apos;s spring-2025 surge is marketing-driven: the lone challenger spotlighted in Operation Stork Speed (March 2025), viral influencer campaigns and a TIME100 listing, peaking as it capped sales amid record demand.
        </>
      }
      source="Google Trends, Worldwide, monthly search interest (pytrends). Each series indexed to the shared 0–100 scale across all five brands."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 4 }}>
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
                  <ChartTooltip title={fmtMonth(String(label))} minWidth={200}>
                    {SERIES.map((s) => {
                      const p = payload.find((pp) => pp.dataKey === s.key);
                      return (
                        <TooltipRow key={s.key} label={s.label} value={p?.value as number} dotColor={s.color} />
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
      <ChartLegend items={SERIES.map((s) => ({ label: s.label, color: s.color, shape: 'line' }))} />
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

export default FormulaBrandSearch;
