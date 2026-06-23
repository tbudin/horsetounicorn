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
  BLUE,
  INK,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// In-shell production, million pounds. US = industry (ACP) crop figures;
// Iran converted from USDA in-shell metric tons (x 2.2046). Pistachios
// "alternate bear": a heavy crop one year, a light one the next, which is
// why both lines zig-zag. Crop years labelled by harvest year.
const data = [
  { y: '2020', us: 1045, iran: 298 },
  { y: '2021', us: 1155, iran: 234 },
  { y: '2022', us: 882, iran: 375 },
  { y: '2023', us: 1492, iran: 441 },
  { y: '2024', us: 1109, iran: 496 },
  { y: '2025', us: 1570, iran: 441 },
];

const SERIES = [
  { key: 'us', label: 'United States (California)', color: BURGUNDY },
  { key: 'iran', label: 'Iran', color: BLUE },
] as const;

const fmt = (v: number) => `${(v / 1000).toFixed(2)} bn lb`;

export function ProductionOvertake() {
  return (
    <ChartCard
      title="While the world wasn’t looking, California planted a pistachio empire"
      subtitle="In-shell production, billion pounds. The US now grows roughly three times what Iran does and is still climbing, the supply was being planted a decade before the demand showed up."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          The 2025 US crop is forecast at a record <b>~1.57 billion pounds</b>, up
          from ~1 billion in 2020. The saw-tooth is the trees’ natural
          <b> alternate-bearing</b> cycle: a big year, then a small one.
        </p>
      }
      source="US: Administrative Committee for Pistachios / American Pistachio Growers (2025/26 forecast). Iran: USDA FAS, in-shell metric tons converted to pounds. Both in-shell basis."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="y"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[0, 1700]}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}bn`}
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
                strokeWidth={2}
                dot={{ r: 2.5, fill: s.color }}
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

export default ProductionOvertake;
