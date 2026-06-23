'use client';

import {
  ComposedChart,
  Area,
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
  INK,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Google Trends, Worldwide, monthly. Zoomed to the boom window so the
// divergence is legible: Dubai chocolate crests and falls; pistachio holds.
// June 2026 excluded (incomplete).
const data = [
  { m: '2024-09', pist: 74, dubai: 0 },
  { m: '2024-10', pist: 79, dubai: 4 },
  { m: '2024-11', pist: 88, dubai: 31 },
  { m: '2024-12', pist: 98, dubai: 35 },
  { m: '2025-01', pist: 86, dubai: 31 },
  { m: '2025-02', pist: 87, dubai: 57 },
  { m: '2025-03', pist: 100, dubai: 78 },
  { m: '2025-04', pist: 93, dubai: 63 },
  { m: '2025-05', pist: 79, dubai: 49 },
  { m: '2025-06', pist: 76, dubai: 35 },
  { m: '2025-07', pist: 81, dubai: 38 },
  { m: '2025-08', pist: 83, dubai: 39 },
  { m: '2025-09', pist: 75, dubai: 29 },
  { m: '2025-10', pist: 74, dubai: 27 },
  { m: '2025-11', pist: 81, dubai: 26 },
  { m: '2025-12', pist: 95, dubai: 28 },
  { m: '2026-01', pist: 79, dubai: 30 },
  { m: '2026-02', pist: 86, dubai: 32 },
  { m: '2026-03', pist: 85, dubai: 32 },
  { m: '2026-04', pist: 80, dubai: 24 },
  { m: '2026-05', pist: 82, dubai: 20 },
];

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return `${MONTHS[+mo]} ${y.slice(2)}`;
};

export function FadVsCategory() {
  return (
    <ChartCard
      title="The product was a fad. The flavour became a category."
      subtitle="Worldwide search interest, zoomed to the boom. Dubai chocolate (burgundy) crested in March 2025 and has since lost roughly two-thirds of its peak. Pistachio (green) barely blinked."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          A year past its peak, “Dubai chocolate” is down ~70%, a textbook fad
          curve. “Pistachio” is still bouncing around <b>80–95</b>, near its
          all-time highs. The bar lit the match; the flavour outlived it.
        </p>
      }
      source="Google Trends, Worldwide, monthly. Index shares the 0–100 scale of the main chart (pistachio peak, Mar 2025 = 100). June 2026 excluded (incomplete)."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 4 }}>
            <defs>
              <linearGradient id="dubaiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BURGUNDY} stopOpacity={0.18} />
                <stop offset="100%" stopColor={BURGUNDY} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="m"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={fmtMonth}
              interval={2}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as { pist: number; dubai: number };
                return (
                  <ChartTooltip title={fmtMonth(String(label))}>
                    <TooltipRow label="Pistachio" value={d.pist} dotColor={GREEN} />
                    <TooltipRow label="Dubai chocolate" value={d.dubai} dotColor={BURGUNDY} />
                  </ChartTooltip>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="dubai"
              stroke={BURGUNDY}
              strokeWidth={2}
              fill="url(#dubaiFill)"
              {...chartDefaults}
            />
            <Line
              type="monotone"
              dataKey="pist"
              stroke={GREEN}
              strokeWidth={2}
              dot={false}
              {...chartDefaults}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={[
          { label: 'Pistachio (the flavour)', color: GREEN, shape: 'line' },
          { label: 'Dubai chocolate (the product)', color: BURGUNDY, shape: 'square' },
        ]}
      />
    </ChartCard>
  );
}

export default FadVsCategory;
