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
  GREEN,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Google Trends, Worldwide, monthly relative search interest (0-100 within
// this export). June 2026 excluded as an incomplete month.
const data = [
  { m: '2018-01', pist: 32, dubai: 0 },
  { m: '2018-02', pist: 32, dubai: 0 },
  { m: '2018-03', pist: 35, dubai: 0 },
  { m: '2018-04', pist: 31, dubai: 0 },
  { m: '2018-05', pist: 33, dubai: 0 },
  { m: '2018-06', pist: 31, dubai: 0 },
  { m: '2018-07', pist: 30, dubai: 0 },
  { m: '2018-08', pist: 30, dubai: 0 },
  { m: '2018-09', pist: 31, dubai: 0 },
  { m: '2018-10', pist: 30, dubai: 0 },
  { m: '2018-11', pist: 35, dubai: 0 },
  { m: '2018-12', pist: 44, dubai: 0 },
  { m: '2019-01', pist: 35, dubai: 0 },
  { m: '2019-02', pist: 35, dubai: 0 },
  { m: '2019-03', pist: 35, dubai: 0 },
  { m: '2019-04', pist: 33, dubai: 0 },
  { m: '2019-05', pist: 33, dubai: 0 },
  { m: '2019-06', pist: 31, dubai: 0 },
  { m: '2019-07', pist: 34, dubai: 0 },
  { m: '2019-08', pist: 35, dubai: 0 },
  { m: '2019-09', pist: 35, dubai: 0 },
  { m: '2019-10', pist: 37, dubai: 0 },
  { m: '2019-11', pist: 40, dubai: 0 },
  { m: '2019-12', pist: 46, dubai: 0 },
  { m: '2020-01', pist: 40, dubai: 0 },
  { m: '2020-02', pist: 37, dubai: 0 },
  { m: '2020-03', pist: 33, dubai: 0 },
  { m: '2020-04', pist: 39, dubai: 0 },
  { m: '2020-05', pist: 42, dubai: 0 },
  { m: '2020-06', pist: 38, dubai: 0 },
  { m: '2020-07', pist: 39, dubai: 0 },
  { m: '2020-08', pist: 39, dubai: 0 },
  { m: '2020-09', pist: 40, dubai: 0 },
  { m: '2020-10', pist: 45, dubai: 0 },
  { m: '2020-11', pist: 47, dubai: 0 },
  { m: '2020-12', pist: 56, dubai: 0 },
  { m: '2021-01', pist: 51, dubai: 0 },
  { m: '2021-02', pist: 49, dubai: 0 },
  { m: '2021-03', pist: 53, dubai: 0 },
  { m: '2021-04', pist: 49, dubai: 0 },
  { m: '2021-05', pist: 46, dubai: 0 },
  { m: '2021-06', pist: 43, dubai: 0 },
  { m: '2021-07', pist: 44, dubai: 0 },
  { m: '2021-08', pist: 42, dubai: 0 },
  { m: '2021-09', pist: 42, dubai: 0 },
  { m: '2021-10', pist: 44, dubai: 0 },
  { m: '2021-11', pist: 46, dubai: 0 },
  { m: '2021-12', pist: 52, dubai: 0 },
  { m: '2022-01', pist: 51, dubai: 0 },
  { m: '2022-02', pist: 51, dubai: 0 },
  { m: '2022-03', pist: 49, dubai: 0 },
  { m: '2022-04', pist: 52, dubai: 0 },
  { m: '2022-05', pist: 46, dubai: 0 },
  { m: '2022-06', pist: 45, dubai: 0 },
  { m: '2022-07', pist: 47, dubai: 0 },
  { m: '2022-08', pist: 52, dubai: 0 },
  { m: '2022-09', pist: 49, dubai: 0 },
  { m: '2022-10', pist: 47, dubai: 0 },
  { m: '2022-11', pist: 47, dubai: 0 },
  { m: '2022-12', pist: 56, dubai: 0 },
  { m: '2023-01', pist: 50, dubai: 0 },
  { m: '2023-02', pist: 51, dubai: 0 },
  { m: '2023-03', pist: 56, dubai: 0 },
  { m: '2023-04', pist: 61, dubai: 0 },
  { m: '2023-05', pist: 51, dubai: 0 },
  { m: '2023-06', pist: 53, dubai: 0 },
  { m: '2023-07', pist: 49, dubai: 0 },
  { m: '2023-08', pist: 55, dubai: 0 },
  { m: '2023-09', pist: 56, dubai: 0 },
  { m: '2023-10', pist: 54, dubai: 0 },
  { m: '2023-11', pist: 60, dubai: 0 },
  { m: '2023-12', pist: 75, dubai: 0 },
  { m: '2024-01', pist: 58, dubai: 0 },
  { m: '2024-02', pist: 62, dubai: 0 },
  { m: '2024-03', pist: 76, dubai: 0 },
  { m: '2024-04', pist: 69, dubai: 0 },
  { m: '2024-05', pist: 68, dubai: 0 },
  { m: '2024-06', pist: 69, dubai: 0 },
  { m: '2024-07', pist: 70, dubai: 0 },
  { m: '2024-08', pist: 71, dubai: 0 },
  { m: '2024-09', pist: 74, dubai: 0 },
  { m: '2024-10', pist: 79, dubai: 4 },
  { m: '2024-11', pist: 88, dubai: 31 },
  { m: '2024-12', pist: 98, dubai: 35 },
  { m: '2025-01', pist: 86, dubai: 31 },
  { m: '2025-02', pist: 87, dubai: 57 },
  { m: '2025-03', pist: 100, dubai: 78 },
  { m: '2025-04', pist: 93, dubai: 63 },
  { m: '2025-05', pist: 79, dubai: 49 },
  { m: '2025-06', pist: 76, dubai: 35 },
  { m: '2025-07', pist: 81, dubai: 38 },
  { m: '2025-08', pist: 83, dubai: 39 },
  { m: '2025-09', pist: 75, dubai: 29 },
  { m: '2025-10', pist: 74, dubai: 27 },
  { m: '2025-11', pist: 81, dubai: 26 },
  { m: '2025-12', pist: 95, dubai: 28 },
  { m: '2026-01', pist: 79, dubai: 30 },
  { m: '2026-02', pist: 86, dubai: 32 },
  { m: '2026-03', pist: 85, dubai: 32 },
  { m: '2026-04', pist: 80, dubai: 24 },
  { m: '2026-05', pist: 82, dubai: 20 },
];

const SERIES = [
  { key: 'pist', label: 'Pistachio', color: GREEN },
  { key: 'dubai', label: 'Dubai chocolate', color: BURGUNDY },
] as const;

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return `${MONTHS[+mo]} ${y.slice(2)}`;
};
const fmtYear = (m: string) => {
  const [y, mo] = m.split('-');
  return mo === '01' ? y : '';
};

const EVENTS = [
  { x: '2023-12', label: 'Dec 2023: a Dubai food influencer’s ASMR TikTok of the "Can’t Get Knafeh of It" bar goes viral, 100M+ views.' },
  { x: '2024-11', label: 'Nov–Dec 2024: Lindt, Läderach, Lidl, Aldi and others ship "Dubai-style" bars; supermarkets ration them.' },
  { x: '2025-04', label: 'Apr 2025: the FT and Guardian report a global pistachio shortage, chocolatiers buying up every kernel.' },
  { x: '2026-03', label: 'Mar 2026: pistachio prices hit an eight-year high as conflict and drought cut Iran’s supply.' },
];

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

export function SearchAttention() {
  return (
    <ChartCard
      title="Pistachio was climbing for a decade before anyone said “Dubai chocolate”"
      subtitle="Worldwide Google search interest. Pistachio (green) had already tripled off its 2000s baseline by 2023. The viral bar (burgundy) then poured petrol on a fire that was already lit."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          Pistachio search hit its all-time peak in <b>March 2025</b> (100), the same
          month Dubai chocolate crested, but pistachio was already running at
          <b> ~3× its 2010 level</b> before the bar existed, and it stayed near the
          top long after the bar faded.
        </p>
      }
      source="Google Trends, Worldwide, monthly. Index = 100 at the series' peak within the export (pistachio, Mar 2025). June 2026 excluded (incomplete). Numbered events are editorial annotations dated to public reporting."
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
              tickFormatter={fmtYear}
              interval={0}
              minTickGap={0}
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

export default SearchAttention;
