'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

// August value each year per topic, Google Trends, Worldwide, each topic
// normalised to itself. Of the four, only baby formula breaks trend in 2025.
type Topic = 'bf' | 'fo' | 'if' | 'ba';
const YEARS = ['2021', '2022', '2023', '2024', '2025'];
const AUG: Record<Topic, number[]> = {
  bf: [88.0, 83.8, 79.5, 78.2, 82.4],
  fo: [20.4, 25.2, 23.0, 23.0, 31.6],
  if: [2.8, 1.8, 18.2, 40.5, 42.4],
  ba: [68.4, 84.8, 77.0, 68.8, 78.8],
};
const TOPICS: { key: Topic; label: string }[] = [
  { key: 'bf', label: 'breastfeeding' },
  { key: 'fo', label: 'baby formula' },
  { key: 'if', label: 'infant feeding' },
  { key: 'ba', label: 'baby food' },
];

const deltaStr = (vals: number[]) => {
  const base = (vals[0] + vals[1] + vals[2] + vals[3]) / 4;
  const pct = Math.round((vals[4] / base - 1) * 100);
  return pct <= 2 && pct >= -2 ? 'flat' : `${pct > 0 ? '+' : ''}${pct}%`;
};

export function August2025CategoryLift() {
  const [topic, setTopic] = useState<Topic>('fo');

  const { data, delta, domain } = useMemo(() => {
    const vals = AUG[topic];
    return {
      data: YEARS.map((y, i) => ({ year: y, v: vals[i] })),
      delta: deltaStr(vals),
      domain: [0, Math.ceil(Math.max(...vals) / 10) * 10 + 5] as [number, number],
    };
  }, [topic]);

  return (
    <ChartCard
      title="What actually moved in August 2025"
      subtitle="August value by year, one topic at a time. Of the four, only baby formula breaks its trend in 2025; breastfeeding and baby food stay flat, and infant feeding had already been climbing for two years."
      footnote={
        <>
          The dramatic August 2025 jump lived in narrower terms (infant and toddler
          nutrition, see the previous chart), not in these four broad topics. Read
          this as a check: the lift was concentrated, not category-wide.
        </>
      }
      source="Google Trends, Worldwide, August value each year, each topic normalised to itself. Δ = 2025 vs 2021–24 average."
    >
      <div className="not-prose mb-2 flex items-center gap-1">
        <span className="mr-1 text-[11px] text-ink-subtle">topic</span>
        {TOPICS.map((t) => {
          const on = t.key === topic;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTopic(t.key)}
              className="rounded-[6px] border px-2.5 py-1 text-xs"
              style={{ borderColor: on ? BURGUNDY : '#D3D1C7', background: on ? BURGUNDY : 'transparent', color: on ? '#fff' : INK_SUBTLE }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <p className="not-prose mb-3 text-xs text-ink-muted">
        2025 vs its 2021–24 August average:{' '}
        <span className="font-medium" style={{ color: delta === 'flat' ? INK_SUBTLE : BURGUNDY }}>
          {delta}
        </span>
      </p>

      <ChartContainer aspect="16 / 9">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 4 }}>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis dataKey="year" tick={axisTickStyle} axisLine={{ stroke: INK }} tickLine={false} tickFormatter={(y: string) => `'${y.slice(2)}`} />
            <YAxis tick={axisTickStyle} axisLine={{ stroke: INK }} tickLine={false} domain={domain} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: BURGUNDY, fillOpacity: 0.06 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltip title={`August ${label}`}>
                    <TooltipRow label={TOPICS.find((t) => t.key === topic)!.label} value={(payload[0].value as number).toFixed(1)} dotColor={BURGUNDY} />
                  </ChartTooltip>
                );
              }}
            />
            <Bar dataKey="v" radius={[2, 2, 0, 0]} {...chartDefaults}>
              {data.map((d, i) => (
                <Cell key={d.year} fill={i === YEARS.length - 1 ? BURGUNDY : BURGUNDY_FADED} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}

export default August2025CategoryLift;
