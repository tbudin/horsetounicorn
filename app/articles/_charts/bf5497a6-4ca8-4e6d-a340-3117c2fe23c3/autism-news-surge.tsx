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

// Google Trends, Worldwide, monthly relative interest (0-100 within the
// source export). June 2026 excluded as an incomplete month.
const data = [
  { m: '2024-01', folic: 28, bfdiet: 5, prenatal: 57 },
  { m: '2024-02', folic: 27, bfdiet: 5, prenatal: 55 },
  { m: '2024-03', folic: 25, bfdiet: 5, prenatal: 51 },
  { m: '2024-04', folic: 24, bfdiet: 5, prenatal: 51 },
  { m: '2024-05', folic: 24, bfdiet: 5, prenatal: 49 },
  { m: '2024-06', folic: 23, bfdiet: 5, prenatal: 50 },
  { m: '2024-07', folic: 25, bfdiet: 5, prenatal: 52 },
  { m: '2024-08', folic: 24, bfdiet: 5, prenatal: 51 },
  { m: '2024-09', folic: 25, bfdiet: 5, prenatal: 50 },
  { m: '2024-10', folic: 24, bfdiet: 5, prenatal: 51 },
  { m: '2024-11', folic: 22, bfdiet: 5, prenatal: 50 },
  { m: '2024-12', folic: 23, bfdiet: 5, prenatal: 53 },
  { m: '2025-01', folic: 27, bfdiet: 6, prenatal: 62 },
  { m: '2025-02', folic: 26, bfdiet: 5, prenatal: 55 },
  { m: '2025-03', folic: 25, bfdiet: 5, prenatal: 56 },
  { m: '2025-04', folic: 22, bfdiet: 5, prenatal: 51 },
  { m: '2025-05', folic: 25, bfdiet: 4, prenatal: 51 },
  { m: '2025-06', folic: 24, bfdiet: 5, prenatal: 56 },
  { m: '2025-07', folic: 25, bfdiet: 5, prenatal: 58 },
  { m: '2025-08', folic: 33, bfdiet: 7, prenatal: 64 },
  { m: '2025-09', folic: 39, bfdiet: 8, prenatal: 67 },
  { m: '2025-10', folic: 41, bfdiet: 9, prenatal: 64 },
  { m: '2025-11', folic: 41, bfdiet: 8, prenatal: 67 },
  { m: '2025-12', folic: 37, bfdiet: 8, prenatal: 71 },
  { m: '2026-01', folic: 40, bfdiet: 8, prenatal: 87 },
  { m: '2026-02', folic: 43, bfdiet: 10, prenatal: 98 },
  { m: '2026-03', folic: 63, bfdiet: 17, prenatal: 82 },
  { m: '2026-04', folic: 81, bfdiet: 28, prenatal: 88 },
  { m: '2026-05', folic: 100, bfdiet: 37, prenatal: 87 },
];

const SERIES = [
  { key: 'folic', label: 'Folic acid (pregnancy)', color: BURGUNDY },
  { key: 'prenatal', label: 'Prenatal vitamins', color: BLUE },
  { key: 'bfdiet', label: 'Breastfeeding diet', color: ORANGE },
] as const;

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+mo]} ${y.slice(2)}`;
};

const EVENTS = [
  { x: '2025-01', label: 'Jan 2025: New Year prenatal bump (seasonal)' },
  { x: '2025-09', label: 'Sep 2025: HHS folate/Tylenol report' },
  { x: '2026-02', label: 'Feb 2026: prenatal-vitamin peak (New Year + folate wave)' },
  { x: '2026-04', label: 'Apr 2026: autism study push' },
];

/**
 * Small numbered circle marker on each reference line, keeps the chart
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

export function AutismNewsSurge() {
  return (
    <ChartCard
      title="Two news shocks, one signature"
      subtitle="Search interest in folic acid, prenatal vitamins and the breastfeeding diet was flat for years, then stepped up twice, both times tracking the HHS autism news cycle, not the calendar."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          <b>Folic acid searches roughly tripled</b> between February and May 2026
          (43 → 100), with no comparable spring rise in any prior year.
        </p>
      }
      source="Google Trends, Worldwide, monthly. Index = 100 at each series' own peak within the export. June 2026 excluded (incomplete)."
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

export default AutismNewsSurge;
