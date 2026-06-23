'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { ChartLegend } from '@/components/charts/chart-legend';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import {
  BURGUNDY,
  GREEN,
  INK,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Two independent attention signals, each indexed to its own peak (= 100):
// Google search interest in "pistachio" (worldwide, monthly) and the monthly
// count of pistachio-related Reddit posts (author's export, 23 Jun 2026).
// They co-move (Pearson r ~= 0.71). CAVEAT: Reddit search ranks by
// relevance/recency, so the most recent months are inflated; read direction
// and timing, not absolute volume. June 2026 excluded (incomplete).
const data = [
  { m: '2020-01', red: 4, goo: 40 },
  { m: '2020-04', red: 4, goo: 39 },
  { m: '2020-07', red: 1, goo: 39 },
  { m: '2020-10', red: 4, goo: 45 },
  { m: '2021-01', red: 9, goo: 51 },
  { m: '2021-04', red: 2, goo: 49 },
  { m: '2021-07', red: 4, goo: 44 },
  { m: '2021-10', red: 9, goo: 44 },
  { m: '2022-01', red: 10, goo: 51 },
  { m: '2022-04', red: 6, goo: 52 },
  { m: '2022-07', red: 4, goo: 47 },
  { m: '2022-10', red: 7, goo: 47 },
  { m: '2023-01', red: 15, goo: 50 },
  { m: '2023-04', red: 5, goo: 61 },
  { m: '2023-07', red: 7, goo: 49 },
  { m: '2023-10', red: 6, goo: 54 },
  { m: '2023-12', red: 9, goo: 75 },
  { m: '2024-02', red: 7, goo: 62 },
  { m: '2024-04', red: 11, goo: 69 },
  { m: '2024-06', red: 15, goo: 69 },
  { m: '2024-08', red: 27, goo: 71 },
  { m: '2024-10', red: 18, goo: 79 },
  { m: '2024-12', red: 16, goo: 98 },
  { m: '2025-02', red: 28, goo: 87 },
  { m: '2025-03', red: 31, goo: 100 },
  { m: '2025-05', red: 37, goo: 79 },
  { m: '2025-07', red: 45, goo: 81 },
  { m: '2025-09', red: 58, goo: 75 },
  { m: '2025-11', red: 55, goo: 81 },
  { m: '2026-01', red: 72, goo: 79 },
  { m: '2026-03', red: 83, goo: 85 },
  { m: '2026-05', red: 96, goo: 82 },
];

const SERIES = [
  { key: 'goo', label: 'Google search ("pistachio")', color: GREEN, dash: undefined },
  { key: 'red', label: 'Reddit posts (pistachio)', color: BURGUNDY, dash: '5 4' },
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

export function RedditVsTrends() {
  return (
    <ChartCard
      title="A search box and a forum, lighting up together"
      subtitle="Two independent attention signals, each indexed to its own peak: worldwide Google searches for “pistachio” and the monthly volume of pistachio posts on Reddit. They rise together as the craze builds (Pearson r ≈ 0.71)."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          The two move as one through the boom, but notice the Reddit line, if
          anything, <b>trails</b> the search spike rather than leading it. Neither
          a forum nor a search box is an early-warning system; both light up once
          a thing is already happening.
        </p>
      }
      footnote={
        <span>
          A caution on the Reddit line: the export is relevance- and
          recency-ranked, so the most recent months are <b>over-counted</b>. Read
          this as corroboration of <i>timing and direction</i>, not as true post
          volume, and treat the late-2025/2026 climb as partly an artefact of how
          Reddit search returns results.
        </span>
      }
      source="Google Trends (worldwide, monthly, “pistachio”) and a Reddit search export of ~2,000 pistachio-related posts (23 Jun 2026), counted by month. Both series indexed to their own peak = 100. June 2026 excluded (incomplete)."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 4 }}>
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
                strokeDasharray={s.dash}
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
    </ChartCard>
  );
}

export default RedditVsTrends;
