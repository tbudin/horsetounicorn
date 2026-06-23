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
  GREEN,
  ORANGE,
  INK,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// k-means (k=4) over all 32 countries' "Dubai chocolate" curves, each
// self-normalised to its own peak, monthly Oct 2024 - May 2026. The four
// cluster centroids (x100) are the canonical shapes. This is the
// shape-classification lens of Yang & Leskovec (2011) and the
// exogenous/endogenous mechanism of Crane & Sornette (2008), applied to one
// trend across markets.
const MONTHS = ['2024-10','2024-11','2024-12','2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05'];
const C = {
  flash:   [15,98,84,23,18,18,12,7,5,5,4,4,4,4,6,3,4,4,2,2],
  spike:   [0,1,11,26,58,80,59,43,33,34,25,22,20,19,19,15,16,15,10,9],
  plateau: [0,1,19,40,57,89,80,74,63,63,56,46,53,57,58,56,61,52,41,36],
  slow:    [0,0,6,10,18,21,14,13,10,7,8,9,9,11,16,39,64,100,76,64],
};
const data = MONTHS.map((m, i) => ({
  m,
  flash: C.flash[i],
  spike: C.spike[i],
  plateau: C.plateau[i],
  slow: C.slow[i],
}));

const SERIES = [
  { key: 'flash', label: 'Flash: instant spike, instant crash', short: 'Flash', color: BURGUNDY },
  { key: 'spike', label: 'Spike: the mainstream fad', short: 'Spike', color: BLUE },
  { key: 'plateau', label: 'Plateau: viral, then it stuck', short: 'Plateau', color: GREEN },
  { key: 'slow', label: 'Slow burn: a late, climbing peak', short: 'Slow burn', color: ORANGE },
] as const;

const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtMonth = (m: string) => { const [y, mo] = m.split('-'); return `${MN[+mo]} ${y.slice(2)}`; };
const fmtYear = (m: string) => { const [y, mo] = m.split('-'); return mo === '01' || m === '2024-10' ? y : ''; };

export function ShapeClasses() {
  return (
    <ChartCard
      title="The same craze, four canonical shapes"
      subtitle="Cluster all thirty-two countries by the shape of their “Dubai chocolate” curve (each normalised to its own peak) and they collapse into four. Not metaphors: these are the cluster centroids, and each matches a known class in the attention-dynamics literature."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          One trend, four curves. A near-vertical <b>Flash</b> that is gone in a
          month; a clean <b>Spike</b>; a <b>Plateau</b> whose tail refuses to die;
          and a <b>Slow burn</b> that doesn’t even peak until 2026. Same product,
          four different physics.
        </p>
      }
      footnote={
        <span>
          <b>Flash</b> (Germany, Austria, Switzerland): an external jolt with no
          word-of-mouth, the “exogenous, subcritical” curve.{' '}
          <b>Spike</b> (France, UK, Greece, Turkey and 13 more): the mainstream
          fad. <b>Plateau</b> (US, UAE, Singapore, Malaysia, Indonesia, Australia,
          Canada, Mexico, Brazil, Sweden): a shock that caught on and held, the
          heavy-tailed “exogenous, critical” curve. <b>Slow burn</b> (Japan,
          Taiwan): a gentle, organic “endogenous” climb to a late peak.
        </span>
      }
      source="k-means (k = 4) over 32 countries’ weekly “Dubai chocolate” series, each self-indexed to its own peak and aggregated monthly; lines are cluster centroids. Method after Yang & Leskovec (2011); mechanism labels after Crane & Sornette (2008)."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 4 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="m"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={fmtYear}
              interval={0}
              minTickGap={0}
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
                return (
                  <ChartTooltip title={fmtMonth(String(label))}>
                    {SERIES.map((s) => {
                      const p = payload.find((pp) => pp.dataKey === s.key);
                      return (
                        <TooltipRow key={s.key} label={s.short} value={`${p?.value as number}%`} dotColor={s.color} />
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
                dot={false}
                name={s.short}
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

export default ShapeClasses;
