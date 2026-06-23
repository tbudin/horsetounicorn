'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
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
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Align every country at its OWN peak (week 0) and average two groups: the
// fast risers (took <=6 weeks to peak, 14 mostly-Western markets) and the slow
// risers (>=15 weeks, 10 mostly-Asian markets). Each curve is % of its own
// peak. The point: the two groups are near-mirror-images, fast up means fast
// down, slow up means slow down.
const data = [
  { w: -44, fast: 0, slow: 8 },
  { w: -40, fast: 0, slow: 6 },
  { w: -36, fast: 0, slow: 8 },
  { w: -32, fast: 0, slow: 11 },
  { w: -28, fast: 0, slow: 9 },
  { w: -24, fast: 0, slow: 15 },
  { w: -20, fast: 0, slow: 25 },
  { w: -16, fast: 1, slow: 32 },
  { w: -12, fast: 2, slow: 44 },
  { w: -8, fast: 7, slow: 49 },
  { w: -6, fast: 12, slow: 53 },
  { w: -4, fast: 26, slow: 59 },
  { w: -2, fast: 45, slow: 63 },
  { w: 0, fast: 100, slow: 100 },
  { w: 2, fast: 64, slow: 67 },
  { w: 4, fast: 50, slow: 63 },
  { w: 6, fast: 38, slow: 61 },
  { w: 8, fast: 29, slow: 52 },
  { w: 10, fast: 26, slow: 50 },
  { w: 12, fast: 23, slow: 48 },
];

const SERIES = [
  { key: 'fast', label: 'Fast risers (sharp spike, mostly the West)', short: 'Fast risers', color: BURGUNDY },
  { key: 'slow', label: 'Slow risers (gentle climb, mostly Asia)', short: 'Slow risers', color: GREEN },
] as const;

export function AlignedArcs() {
  return (
    <ChartCard
      title="Line them up at the peak and two mechanisms appear"
      subtitle="Every country aligned at its own peak (week 0), then averaged into two groups by how fast it rose. Read left of zero as the climb, right of zero as the fall. The shapes are near mirror images of themselves."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          Rise speed and decay speed are the <b>same property</b>. The sharp
          spikes (burgundy) halve within a month of the peak; the slow climbs
          (green) come down just as gently, still near <b>half</b> three months on.
          Fast up, fast down; slow up, slow down.
        </p>
      }
      source="Google Trends, weekly “Dubai chocolate”, each country self-indexed to its peak (=100). Fast risers reached peak in ≤6 weeks (n=14); slow risers in ≥15 weeks (n=10). Lines are group means at each week relative to peak."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 20, bottom: 20, left: 4 }}>
            <CartesianGrid {...gridProps} />
            <ReferenceLine x={0} stroke={INK_SUBTLE} strokeDasharray="4 4" label={{ value: 'peak', position: 'top', fill: INK_SUBTLE, fontSize: 10 }} />
            <XAxis
              type="number"
              dataKey="w"
              domain={[-44, 12]}
              ticks={[-40, -30, -20, -10, 0, 10]}
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
              label={{ value: 'weeks relative to each country’s peak →', position: 'insideBottom', offset: -12, fill: INK_SUBTLE, fontSize: 11 }}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const w = Number(label);
                return (
                  <ChartTooltip title={`${w > 0 ? '+' : ''}${w} weeks from peak`}>
                    {SERIES.map((s) => {
                      const p = payload.find((pp) => pp.dataKey === s.key);
                      return <TooltipRow key={s.key} label={s.short} value={`${p?.value as number}%`} dotColor={s.color} />;
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

export default AlignedArcs;
