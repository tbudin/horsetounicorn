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
  GREEN,
  BLUE,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// The calendar month in which "pistachio" search interest peaked, each year,
// for Egypt and the UAE (plotted as dots), against the month Ramadan fell in
// (the line). A lunar month drifts ~11 days earlier each year, and the peak
// dots ride the Ramadan line down with it. UAE 2024 omitted: the
// Dubai-chocolate craze threw its peak to September.
const data = [
  { yr: '2018', eg: 5, uae: 5, ram: 5 },
  { yr: '2019', eg: 5, uae: 5, ram: 5 },
  { yr: '2020', eg: 5, uae: 5, ram: 4 },
  { yr: '2021', eg: 4, uae: 5, ram: 4 },
  { yr: '2022', eg: 4, uae: 4, ram: 4 },
  { yr: '2023', eg: 3, uae: 4, ram: 3 },
  { yr: '2024', eg: 4, uae: null, ram: 3 },
  { yr: '2025', eg: 3, uae: 3, ram: 3 },
  { yr: '2026', eg: 2, uae: 2, ram: 2 },
];

const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
const fmtMon = (v: number) => MN[Math.round(v)] ?? '';

export function RamadanSlide() {
  return (
    <ChartCard
      title="A pistachio season that moves: the Gulf follows Ramadan"
      subtitle="The month each year when “pistachio” search peaked in Egypt and the UAE (dots), against the month Ramadan fell in (line). Because Ramadan is lunar, it slides about eleven days earlier every year, and the pistachio peak slides with it."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          Egypt’s pistachio peak marched from <b>May 2018</b> to <b>February 2026</b>,
          tracking Ramadan almost month for month. A holiday on a moving calendar
          gives a craving that moves too, something a fixed-December view of demand
          would completely miss.
        </p>
      }
      source="Google Trends, “pistachio”, monthly per country. Peak = the calendar month of highest interest that year. Ramadan month from the Islamic calendar. UAE 2024 omitted (the craze shifted its peak to September)."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="yr"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[1.5, 5.5]}
              ticks={[2, 3, 4, 5]}
              tickFormatter={fmtMon}
              reversed
              label={{
                value: 'month of peak →',
                angle: -90,
                position: 'insideLeft',
                offset: 6,
                style: { fontSize: 11, fill: INK_SUBTLE },
              }}
            />
            <Tooltip
              cursor={{ stroke: INK_SUBTLE, strokeOpacity: 0.3 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as { eg: number; uae: number | null; ram: number };
                return (
                  <ChartTooltip title={String(label)}>
                    <TooltipRow label="Ramadan" value={fmtMon(d.ram)} dotColor={INK_SUBTLE} />
                    <TooltipRow label="Egypt peak" value={fmtMon(d.eg)} dotColor={GREEN} />
                    {d.uae != null ? (
                      <TooltipRow label="UAE peak" value={fmtMon(d.uae)} dotColor={BLUE} />
                    ) : null}
                  </ChartTooltip>
                );
              }}
            />
            {/* Ramadan: the reference spine */}
            <Line
              type="monotone"
              dataKey="ram"
              stroke={INK_SUBTLE}
              strokeWidth={2}
              dot={{ r: 2, fill: INK_SUBTLE }}
              name="Ramadan month"
              {...chartDefaults}
            />
            {/* Pistachio peaks: dots that ride the Ramadan line */}
            <Line
              type="monotone"
              dataKey="eg"
              stroke={GREEN}
              strokeWidth={0}
              dot={{ r: 5, fill: GREEN, stroke: '#ffffff', strokeWidth: 1.5 }}
              name="Egypt pistachio peak"
              {...chartDefaults}
            />
            <Line
              type="monotone"
              dataKey="uae"
              stroke={BLUE}
              strokeWidth={0}
              dot={{ r: 4, fill: BLUE, stroke: '#ffffff', strokeWidth: 1.5 }}
              connectNulls={false}
              name="UAE pistachio peak"
              {...chartDefaults}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={[
          { label: 'Ramadan month', color: INK_SUBTLE, shape: 'line' },
          { label: 'Egypt pistachio peak', color: GREEN, shape: 'square' },
          { label: 'UAE pistachio peak', color: BLUE, shape: 'square' },
        ]}
      />
    </ChartCard>
  );
}

export default RamadanSlide;
