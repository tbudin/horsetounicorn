'use client';

import {
  ComposedChart,
  Bar,
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
  GREEN_LIGHTER,
  GREEN,
  INK,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// US in-shell production (billion lb, left axis) vs wholesale pistachio
// KERNEL price (USD/lb, right axis) — kernels are the cut used in pistachio
// cream and Dubai chocolate. Price points are approximate, drawn from trade
// reporting; 2026 has no US crop figure yet (harvested in autumn).
const data = [
  { y: '2022', prod: 0.882, price: null },
  { y: '2023', prod: 1.492, price: 7.0 },
  { y: '2024', prod: 1.109, price: 7.65 },
  { y: '2025', prod: 1.57, price: 10.3 },
  { y: '2026', prod: null, price: 11.0 },
];

export function SupplyDemandCollision() {
  return (
    <ChartCard
      title="Record supply, record prices — at the same time"
      subtitle="US production hit an all-time high in 2025, yet the kernel price kept climbing. When demand is instant and supply takes seven years, even a record crop can feel like a shortage."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          The kernel grade — the cut Dubai chocolate needs — went from
          <b> ~$7.65/lb in 2024 to ~$10.30 in 2025</b> and neared
          <b> $11 by early 2026</b>, a roughly <b>50% jump</b> even as America
          harvested its biggest crop ever.
        </p>
      }
      source="Production: ACP / American Pistachio Growers (in-shell, billion lb; 2025/26 forecast). Price: wholesale kernel grade, approximate, from trade reporting (TasteTech, Fast Company, FreshPlaza). 2026 production not yet harvested."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis
              dataKey="y"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
            />
            <YAxis
              yAxisId="prod"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[0, 1.7]}
              tickFormatter={(v) => `${v.toFixed(1)}bn`}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[0, 12]}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              cursor={{ fill: BURGUNDY, fillOpacity: 0.06 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as { prod: number | null; price: number | null };
                return (
                  <ChartTooltip title={String(label)}>
                    <TooltipRow
                      label="US production"
                      value={d.prod != null ? `${d.prod.toFixed(2)} bn lb` : '—'}
                      dotColor={GREEN}
                    />
                    <TooltipRow
                      label="Kernel price"
                      value={d.price != null ? `$${d.price.toFixed(2)}/lb` : '—'}
                      dotColor={BURGUNDY}
                    />
                  </ChartTooltip>
                );
              }}
            />
            <Bar
              yAxisId="prod"
              dataKey="prod"
              fill={GREEN_LIGHTER}
              stroke={GREEN}
              strokeWidth={1}
              maxBarSize={54}
              {...chartDefaults}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              stroke={BURGUNDY}
              strokeWidth={2.5}
              dot={{ r: 3, fill: BURGUNDY }}
              connectNulls
              {...chartDefaults}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={[
          { label: 'US production (bn lb, left)', color: GREEN, shape: 'square' },
          { label: 'Kernel price ($/lb, right)', color: BURGUNDY, shape: 'line' },
        ]}
      />
    </ChartCard>
  );
}

export default SupplyDemandCollision;
