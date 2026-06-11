'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import {
  BURGUNDY,
  BURGUNDY_FADED,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Average relative interest for the "Breastfeeding" topic by calendar month,
// 2021-2026 (Google Trends, Worldwide). June 2026 excluded.
const data = [
  { mon: 'Jan', avg: 88.4 },
  { mon: 'Feb', avg: 85.0 },
  { mon: 'Mar', avg: 83.4 },
  { mon: 'Apr', avg: 82.6 },
  { mon: 'May', avg: 84.2 },
  { mon: 'Jun', avg: 81.6 },
  { mon: 'Jul', avg: 85.6 },
  { mon: 'Aug', avg: 91.8 },
  { mon: 'Sep', avg: 84.4 },
  { mon: 'Oct', avg: 86.2 },
  { mon: 'Nov', avg: 83.2 },
  { mon: 'Dec', avg: 82.8 },
];

const ALL_MEAN = data.reduce((s, d) => s + d.avg, 0) / data.length;

export function BreastfeedingSeasonality() {
  return (
    <ChartCard
      title="August is breastfeeding's month, every year"
      subtitle="Averaging five years of monthly search interest for the Breastfeeding topic, August stands clearly above every other month, a stable seasonal peak, not a one-off."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          August interest runs <b>3–11% above each year's own average</b>, and it
          has done so in all five years on record, aligned with{' '}
          <b>World Breastfeeding Week (Aug 1–7)</b>.
        </p>
      }
      source="Google Trends, Worldwide. Breastfeeding topic, mean of 2021–2026 by calendar month (0–100 scale). Dashed line = all-month average."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 88, bottom: 8, left: 4 }}>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis
              dataKey="mon"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[70, 95]}
            />
            <Tooltip
              cursor={{ fill: BURGUNDY, fillOpacity: 0.06 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const v = payload[0].value as number;
                return (
                  <ChartTooltip title={label as string}>
                    <TooltipRow label="Avg interest" value={v.toFixed(1)} dotColor={BURGUNDY} />
                    <TooltipRow
                      label="vs all-month avg"
                      value={`${v > ALL_MEAN ? '+' : ''}${(v - ALL_MEAN).toFixed(1)}`}
                    />
                  </ChartTooltip>
                );
              }}
            />
            <Bar dataKey="avg" {...chartDefaults} radius={[2, 2, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.mon} fill={d.mon === 'Aug' ? BURGUNDY : BURGUNDY_FADED} />
              ))}
            </Bar>
            {/* Rendered after the bars so the line + label paint on top. */}
            <ReferenceLine
              y={ALL_MEAN}
              stroke={INK}
              strokeOpacity={0.55}
              strokeDasharray="4 4"
              label={{
                value: `all-month avg ${ALL_MEAN.toFixed(1)}`,
                position: 'right',
                style: { fontSize: 10, fill: INK_SUBTLE },
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}

export default BreastfeedingSeasonality;
