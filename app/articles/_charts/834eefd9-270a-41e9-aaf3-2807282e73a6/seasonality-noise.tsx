'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { ChartLegend } from '@/components/charts/chart-legend';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import {
  BURGUNDY,
  BURGUNDY_FADED,
  ORANGE,
  INK,
  INK_MUTED,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';
import { fmtPct } from '@/lib/format';

// Average S&P 500 return by calendar month since 1950, with 2024's actual
// monthly returns laid over the top. Source: YCharts via Bilello Blog, charted
// by Visual Capitalist (Mar 2025).
const data = [
  { m: 'Jan', avg: 1.07, y2024: 1.59 }, { m: 'Feb', avg: -0.01, y2024: 5.17 },
  { m: 'Mar', avg: 1.13, y2024: 3.10 }, { m: 'Apr', avg: 1.46, y2024: -4.16 },
  { m: 'May', avg: 0.30, y2024: 4.80 }, { m: 'Jun', avg: 0.11, y2024: 3.47 },
  { m: 'Jul', avg: 1.28, y2024: 1.13 }, { m: 'Aug', avg: -0.01, y2024: 2.28 },
  { m: 'Sep', avg: -0.72, y2024: 2.02 }, { m: 'Oct', avg: 0.91, y2024: -0.99 },
  { m: 'Nov', avg: 1.82, y2024: 5.73 }, { m: 'Dec', avg: 1.49, y2024: -2.50 },
];

export function SeasonalityNoise() {
  return (
    <ChartCard
      title="A calendar worth ignoring"
      subtitle="Average S&P 500 return by month since 1950 (bars), with 2024's actual monthly returns laid over the top (orange). November and December look kind, September looks mean, but the whole best-to-worst spread is just 2.5 percentage points."
      footnote={
        <>
          This is the result, and it is a quiet one. Yes, there is a faint seasonal
          tilt, the grain of truth behind &lsquo;sell in May&rsquo;. But a single
          year scatters all over it: in 2024, the historically weak September rose
          and the historically strong December fell. The seasonal signal is real
          and far too small to trade. Waiting for the &lsquo;right&rsquo; month
          mostly means waiting out of the market.
        </>
      }
      source="Average monthly returns since 1950, from YCharts via Bilello Blog, charted by Visual Capitalist (March 2025). 2024 figures are that year's actual monthly total returns."
    >
      <ChartContainer aspect="2 / 1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 4 }}>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis
              dataKey="m"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <ReferenceLine y={0} stroke={INK} strokeWidth={1} />
            <Tooltip
              cursor={{ fill: 'rgba(158,10,113,0.06)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <ChartTooltip title={String(label)} minWidth={190}>
                    <TooltipRow
                      label="Average since 1950"
                      value={fmtPct(d.avg)}
                      dotColor={BURGUNDY}
                    />
                    <TooltipRow
                      label="2024 actual"
                      value={fmtPct(d.y2024)}
                      dotColor={ORANGE}
                    />
                  </ChartTooltip>
                );
              }}
            />
            <Bar dataKey="avg" radius={[2, 2, 0, 0]} {...chartDefaults}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.avg >= 0 ? BURGUNDY : BURGUNDY_FADED} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="y2024"
              stroke={ORANGE}
              strokeWidth={2}
              dot={{ r: 2.5, fill: ORANGE }}
              {...chartDefaults}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={[
          { label: 'Average since 1950', color: BURGUNDY, shape: 'square' },
          { label: '2024 actual', color: ORANGE, shape: 'line' },
        ]}
      />
    </ChartCard>
  );
}

export default SeasonalityNoise;
