'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartLegend } from '@/components/charts/chart-legend';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import {
  GREEN,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// "Year-end lift" = mean search interest over Nov 2025-Jan 2026 divided by the
// Sep-Oct 2025 trough, for the 20 markets whose "Dubai chocolate" interest had
// already peaked AND was still alive at year-end (>=15% of their own peak).
// >1.0 = the craving revived for the festive season; <1.0 = it kept fading.
const data = [
  { c: 'Singapore', lift: 1.93, reb: true },
  { c: 'Iceland', lift: 1.40, reb: true },
  { c: 'Mexico', lift: 1.34, reb: true },
  { c: 'Sweden', lift: 1.30, reb: true },
  { c: 'Malaysia', lift: 1.21, reb: false },
  { c: 'UAE', lift: 1.18, reb: false },
  { c: 'Canada', lift: 1.05, reb: false },
  { c: 'United States', lift: 1.00, reb: false },
  { c: 'Brazil', lift: 0.99, reb: false },
  { c: 'Spain', lift: 0.96, reb: false },
  { c: 'Turkey', lift: 0.94, reb: false },
  { c: 'Netherlands', lift: 0.93, reb: false },
  { c: 'France', lift: 0.89, reb: false },
  { c: 'UK', lift: 0.88, reb: false },
  { c: 'Belgium', lift: 0.85, reb: false },
  { c: 'Finland', lift: 0.78, reb: false },
  { c: 'New Zealand', lift: 0.68, reb: false },
  { c: 'Chile', lift: 0.67, reb: false },
  { c: 'Argentina', lift: 0.61, reb: false },
  { c: 'Australia', lift: 0.51, reb: false },
];

export function FestiveRebound() {
  return (
    <ChartCard
      title="The festive rebound is real, but rare"
      subtitle="For markets that had already peaked, how much did “Dubai chocolate” interest revive into the year-end gifting season (Nov 2025–Jan 2026, versus the autumn trough)? Above the line, the craving came back; below it, it kept fading."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          Only <b>four of twenty</b> markets genuinely rebounded. Singapore nearly
          <b> doubled</b>; most countries kept sliding. A year-end revival is a real
          shape, but it is the exception, not the rule.
        </p>
      }
      footnote={
        <span>
          Read small markets with care: Iceland’s search volume is tiny, so its
          ratio is noisy. Singapore (large, food-obsessed, and still high a year
          on) is the cleanest signal of a fad acquiring a seasonal second life.
        </span>
      }
      source="Google Trends, weekly “Dubai chocolate” by country, aggregated monthly and self-indexed to each country’s peak. Markets that peaked after Aug 2025 (the slow burns) and those already below 15% of peak are excluded. Lift = mean(Nov 2025–Jan 2026) ÷ mean(Sep–Oct 2025)."
      maxWidth={null}
    >
      <div style={{ width: '100%', height: 520 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 8, left: 8 }}>
            <CartesianGrid {...gridProps} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 2]}
              ticks={[0, 0.5, 1, 1.5, 2]}
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={(v) => `${v}×`}
            />
            <YAxis
              type="category"
              dataKey="c"
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <ReferenceLine x={1} stroke={INK} strokeDasharray="4 4" label={{ value: 'no change', position: 'top', fill: INK_SUBTLE, fontSize: 10 }} />
            <ReferenceLine x={1.25} stroke={GREEN} strokeOpacity={0.5} strokeDasharray="2 3" label={{ value: 'rebound', position: 'top', fill: GREEN, fontSize: 10 }} />
            <Tooltip
              cursor={{ fill: GREEN, fillOpacity: 0.06 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as { c: string; lift: number; reb: boolean };
                return (
                  <ChartTooltip title={d.c}>
                    <TooltipRow label="Year-end lift" value={`${d.lift.toFixed(2)}×`} dotColor={d.reb ? GREEN : INK_SUBTLE} />
                  </ChartTooltip>
                );
              }}
            />
            <Bar dataKey="lift" maxBarSize={16} {...chartDefaults}>
              {data.map((d) => (
                <Cell key={d.c} fill={d.reb ? GREEN : INK_SUBTLE} fillOpacity={d.reb ? 0.9 : 0.45} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          { label: 'Rebounded (≥ 1.25×)', color: GREEN, shape: 'square' },
          { label: 'Kept fading', color: INK_SUBTLE, shape: 'square' },
        ]}
      />
    </ChartCard>
  );
}

export default FestiveRebound;
