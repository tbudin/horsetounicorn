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
// for Egypt and the UAE, against the month Ramadan fell in. A lunar month
// drifts ~11 days earlier each year, and the pistachio peak drifts with it.
// UAE 2024 omitted: the Dubai-chocolate craze threw its peak to September.
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

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
const fmtMon = (v: number) => MONTHS[v] ?? '';

const SERIES = [
  { key: 'eg', label: 'Egypt: pistachio peak', color: GREEN, dash: undefined },
  { key: 'uae', label: 'UAE: pistachio peak', color: BLUE, dash: undefined },
  { key: 'ram', label: 'Ramadan (the month it fell in)', color: INK_SUBTLE, dash: '5 4' },
] as const;

export function RamadanSlide() {
  return (
    <ChartCard
      title="A pistachio season that moves: the Gulf follows Ramadan"
      subtitle="The month each year when “pistachio” search peaked in Egypt and the UAE, against the month Ramadan fell in. Because Ramadan is lunar, it slides about eleven days earlier every year, and the pistachio peak slides with it."
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
              domain={[1, 6]}
              ticks={[2, 3, 4, 5]}
              tickFormatter={fmtMon}
              reversed
            />
            <Tooltip
              cursor={{ stroke: GREEN, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltip title={String(label)}>
                    {SERIES.map((s) => {
                      const p = payload.find((pp) => pp.dataKey === s.key);
                      if (p?.value == null) return null;
                      return <TooltipRow key={s.key} label={s.label} value={fmtMon(p.value as number)} dotColor={s.color} />;
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
                strokeWidth={s.key === 'ram' ? 1.5 : 2}
                strokeDasharray={s.dash}
                dot={{ r: 2.5, fill: s.color }}
                connectNulls
                name={s.label}
                {...chartDefaults}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend items={SERIES.map((s) => ({ label: s.label, color: s.color, shape: 'line' }))} />
    </ChartCard>
  );
}

export default RamadanSlide;
