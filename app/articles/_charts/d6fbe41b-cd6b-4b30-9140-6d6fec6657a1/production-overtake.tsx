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
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// In-shell production, million pounds, by crop year (labelled by harvest
// year). Converted from USDA FAS PSD in-shell metric tons (x 2.2046). US is
// NASS/ACP; Iran is USDA (Iranian Pistachio Association). Pistachios
// "alternate bear" (a heavy crop one year, a light one the next), which is
// why every line zig-zags. 2025 is a forecast.
const data = [
  { y: '2008', us: 278, iran: 198, world: 805 },
  { y: '2009', us: 355, iran: 406, world: 1004 },
  { y: '2010', us: 522, iran: 476, world: 1393 },
  { y: '2011', us: 444, iran: 353, world: 1058 },
  { y: '2012', us: 551, iran: 403, world: 1367 },
  { y: '2013', us: 470, iran: 375, world: 1109 },
  { y: '2014', us: 514, iran: 507, world: 1363 },
  { y: '2015', us: 270, iran: 463, world: 1127 },
  { y: '2016', us: 897, iran: 337, world: 1722 },
  { y: '2017', us: 600, iran: 496, world: 1430 },
  { y: '2018', us: 987, iran: 115, world: 1720 },
  { y: '2019', us: 740, iran: 452, world: 1581 },
  { y: '2020', us: 1045, iran: 419, world: 2213 },
  { y: '2021', us: 1155, iran: 298, world: 1794 },
  { y: '2022', us: 882, iran: 234, world: 1727 },
  { y: '2023', us: 1490, iran: 375, world: 2438 },
  { y: '2024', us: 1100, iran: 496, world: 2615 },
  { y: '2025', us: 1571, iran: 441, world: 2409 },
];

const SERIES = [
  { key: 'us', label: 'United States (California)', color: BURGUNDY, shape: 'line' as const },
  { key: 'iran', label: 'Iran', color: BLUE, shape: 'line' as const },
  { key: 'world', label: 'World total', color: INK_SUBTLE, shape: 'line' as const },
];

const fmt = (v: number) => `${(v / 1000).toFixed(2)} bn lb`;

export function ProductionOvertake() {
  return (
    <ChartCard
      title="While the world wasn’t looking, California planted a pistachio empire"
      subtitle="In-shell production, billion pounds, by crop year. The US and Iran traded the lead through the 2000s; from the 2016 crop the US pulls away for good, climbing from roughly a third of world output to about 60%."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          <b>2015 was the last year Iran out-grew the US.</b> Since the 2016 crop
          America has been the undisputed number one every single year, on its way
          to a record <b>~1.57 billion pounds</b> in 2025, roughly three times Iran’s.
        </p>
      }
      source="USDA FAS PSD / Tree Nuts circulars (in-shell metric tons, converted to pounds); US current year from the Administrative Committee for Pistachios. 2025 is a forecast. Iran sourced via the Iranian Pistachio Association."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="y"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              interval={1}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[0, 2700]}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}bn`}
            />
            <ReferenceLine
              x="2016"
              stroke={INK_SUBTLE}
              strokeDasharray="4 4"
              label={{
                value: '2016: US takes the lead for good',
                position: 'top',
                fill: INK,
                fontSize: 11,
                fontFamily: 'var(--font-roboto-mono), ui-monospace, monospace',
              }}
            />
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltip title={String(label)}>
                    {SERIES.map((s) => {
                      const p = payload.find((pp) => pp.dataKey === s.key);
                      return (
                        <TooltipRow
                          key={s.key}
                          label={s.label}
                          value={fmt(p?.value as number)}
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
                strokeWidth={s.key === 'world' ? 1.25 : 2}
                strokeDasharray={s.key === 'world' ? '5 4' : undefined}
                dot={s.key === 'world' ? false : { r: 2, fill: s.color }}
                name={s.label}
                {...chartDefaults}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={SERIES.map((s) => ({ label: s.label, color: s.color, shape: s.shape }))}
      />
    </ChartCard>
  );
}

export default ProductionOvertake;
