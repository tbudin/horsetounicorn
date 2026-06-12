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
import { ChartToolbar, TopicPill } from '@/components/charts/chart-controls';
import {
  BURGUNDY,
  BURGUNDY_FADED,
  INK,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Calendar-month average interest per topic, Google Trends, Worldwide, 2021-26
// (each topic normalised to itself). Each topic peaks in a different month.
type Topic = 'bf' | 'fo' | 'if' | 'ba';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASON: Record<Topic, number[]> = {
  bf: [80.7, 79.6, 77.9, 76.6, 78.4, 76.6, 81.1, 82.4, 78.6, 80.2, 77.7, 78.3],
  fo: [26.6, 27.2, 25.9, 26.0, 33.4, 23.6, 23.5, 24.6, 24.3, 24.8, 25.2, 24.1],
  if: [21.2, 27.8, 27.0, 30.5, 33.5, 17.9, 18.7, 21.1, 20.0, 20.8, 22.0, 19.0],
  ba: [82.3, 80.8, 80.7, 78.7, 78.7, 77.8, 78.4, 75.5, 75.9, 74.7, 73.2, 71.6],
};
const TOPICS: { key: Topic; label: string; note: string }[] = [
  { key: 'bf', label: 'breastfeeding', note: 'peaks in August, with World Breastfeeding Week' },
  { key: 'fo', label: 'baby formula', note: 'peaks in May' },
  { key: 'if', label: 'infant feeding', note: 'peaks in May' },
  { key: 'ba', label: 'baby food', note: 'peaks in January' },
];

export function BreastfeedingSeasonality() {
  const [topic, setTopic] = useState<Topic>('bf');
  const meta = TOPICS.find((t) => t.key === topic)!;

  const { data, peak, domain } = useMemo(() => {
    const vals = SEASON[topic];
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const peakIdx = vals.indexOf(max);
    return {
      data: MONTHS.map((m, i) => ({ mon: m, v: vals[i] })),
      peak: peakIdx,
      domain: [Math.floor(min) - 2, Math.ceil(max) + 2] as [number, number],
    };
  }, [topic]);

  return (
    <ChartCard
      title="Each topic keeps its own season"
      subtitle="Five-year monthly average per topic. Breastfeeding peaks in August, but formula and infant feeding peak in May, and baby food in January. There is no single season for the category."
      source="Google Trends, Worldwide, mean by calendar month 2021–2026, each topic normalised to itself."
    >
      <ChartToolbar label="topic" className="mb-2">
        {TOPICS.map((t) => (
          <TopicPill
            key={t.key}
            active={t.key === topic}
            onClick={() => setTopic(t.key)}
          >
            {t.label}
          </TopicPill>
        ))}
      </ChartToolbar>
      <p className="not-prose mb-3 text-xs text-ink-muted">
        <span className="font-medium text-ink">{meta.label}</span> {meta.note}.
      </p>

      <ChartContainer aspect="16 / 9">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 4 }}>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis dataKey="mon" tick={axisTickStyle} axisLine={{ stroke: INK }} tickLine={false} />
            <YAxis tick={axisTickStyle} axisLine={{ stroke: INK }} tickLine={false} domain={domain} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: BURGUNDY, fillOpacity: 0.06 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltip title={String(label)}>
                    <TooltipRow label={meta.label} value={(payload[0].value as number).toFixed(1)} dotColor={BURGUNDY} />
                  </ChartTooltip>
                );
              }}
            />
            <Bar dataKey="v" radius={[2, 2, 0, 0]} {...chartDefaults}>
              {data.map((d, i) => (
                <Cell key={d.mon} fill={i === peak ? BURGUNDY : BURGUNDY_FADED} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}

export default BreastfeedingSeasonality;
