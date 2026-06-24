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
  ORANGE,
  BLUE,
  INK,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Month-of-year seasonal index for "pistachio" search interest, averaged over
// 2010-2023 (before the craze distorted things), 100 = each country's own
// annual average. Four countries, four different peak months.
const data = [
  { mon: 'Jan', us: 107, eg: 83, ir: 87, in: 100 },
  { mon: 'Feb', us: 103, eg: 83, ir: 94, in: 91 },
  { mon: 'Mar', us: 112, eg: 108, ir: 116, in: 92 },
  { mon: 'Apr', us: 100, eg: 125, ir: 100, in: 90 },
  { mon: 'May', us: 94, eg: 122, ir: 89, in: 94 },
  { mon: 'Jun', us: 96, eg: 105, ir: 77, in: 96 },
  { mon: 'Jul', us: 93, eg: 101, ir: 73, in: 96 },
  { mon: 'Aug', us: 87, eg: 96, ir: 98, in: 99 },
  { mon: 'Sep', us: 82, eg: 98, ir: 145, in: 97 },
  { mon: 'Oct', us: 86, eg: 92, ir: 127, in: 109 },
  { mon: 'Nov', us: 111, eg: 94, ir: 97, in: 129 },
  { mon: 'Dec', us: 128, eg: 92, ir: 97, in: 108 },
];

const SERIES = [
  { key: 'us', label: 'United States: December (Christmas)', short: 'US (Christmas)', color: BURGUNDY },
  { key: 'eg', label: 'Egypt: spring (Ramadan)', short: 'Egypt (Ramadan)', color: GREEN },
  { key: 'ir', label: 'Iran: September (the harvest)', short: 'Iran (harvest)', color: ORANGE },
  { key: 'in', label: 'India: November (Diwali)', short: 'India (Diwali)', color: BLUE },
] as const;

export function SeasonalCalendars() {
  return (
    <ChartCard
      title="The world keeps four pistachio calendars"
      subtitle="Average search interest in “pistachio” by month of the year (2010–2023, before the craze), each country indexed to its own annual average. Four countries, four completely different peaks."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          The West peaks at <b>Christmas</b>, the Gulf and North Africa around
          <b> Ramadan</b>, India at <b>Diwali</b>, and Iran, the grower, every
          <b> September</b>, when the trees are harvested. There is no single
          season for a nut.
        </p>
      }
      source="Google Trends, “pistachio”, monthly per country, 2010–2023 averaged by calendar month (100 = each country’s mean). Ramadan is a lunar month, so Egypt’s spring bump is its 2010–2023 average position; see the next chart for the slide."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 4 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="mon"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[60, 160]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltip title={String(label)}>
                    {SERIES.map((s) => {
                      const p = payload.find((pp) => pp.dataKey === s.key);
                      return <TooltipRow key={s.key} label={s.short} value={p?.value as number} dotColor={s.color} />;
                    })}
                  </ChartTooltip>
                );
              }}
            />
            {SERIES.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} name={s.short} {...chartDefaults} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend items={SERIES.map((s) => ({ label: s.label, color: s.color, shape: 'line' }))} />
    </ChartCard>
  );
}

export default SeasonalCalendars;
