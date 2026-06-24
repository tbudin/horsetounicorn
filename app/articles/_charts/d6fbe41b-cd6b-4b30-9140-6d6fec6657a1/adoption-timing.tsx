'use client';

import { useMemo, useState } from 'react';
import { Globe, Activity } from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  LabelList,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { ChartLegend } from '@/components/charts/chart-legend';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import { ChartToolbar, ComboSelect, MultiSelectPopover } from '@/components/charts/chart-controls';
import {
  BURGUNDY,
  BLUE,
  BLUE_LIGHT,
  GREEN,
  ORANGE,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
} from '@/lib/chart-colors';

// Two independent axes. x = WHEN a country took off, in weeks since the first
// market crossed 20% of its own peak (a shared t=0). y = how fast it then rose
// (weeks from take-off to peak): a low value is a sharp external spike, a high
// value a slow word-of-mouth climb. Weekly Google Trends, 35 markets.
type Pt = { iso: string; region: string; takeoff: number; rise: number };
const DATA: Pt[] = [
  { iso: 'AT', region: 'Europe', takeoff: 9.6, rise: 4 },
  { iso: 'DE', region: 'Europe', takeoff: 9.6, rise: 3 },
  { iso: 'CH', region: 'Europe', takeoff: 10.1, rise: 6 },
  { iso: 'GR', region: 'Europe', takeoff: 11.0, rise: 11 },
  { iso: 'MY', region: 'Asia', takeoff: 11.2, rise: 16 },
  { iso: 'BE', region: 'Europe', takeoff: 11.2, rise: 15 },
  { iso: 'AE', region: 'MEast', takeoff: 11.2, rise: 15 },
  { iso: 'CA', region: 'Anglo', takeoff: 11.5, rise: 33 },
  { iso: 'NL', region: 'Europe', takeoff: 11.5, rise: 14 },
  { iso: 'ID', region: 'Asia', takeoff: 11.5, rise: 15 },
  { iso: 'SG', region: 'Asia', takeoff: 11.5, rise: 46 },
  { iso: 'UK', region: 'Anglo', takeoff: 12.1, rise: 11 },
  { iso: 'US', region: 'Anglo', takeoff: 12.1, rise: 8 },
  { iso: 'TR', region: 'MEast', takeoff: 12.4, rise: 2 },
  { iso: 'NZ', region: 'Anglo', takeoff: 12.4, rise: 7 },
  { iso: 'DK', region: 'Europe', takeoff: 12.6, rise: 3 },
  { iso: 'MX', region: 'LatAm', takeoff: 12.6, rise: 25 },
  { iso: 'IS', region: 'Europe', takeoff: 12.6, rise: 2 },
  { iso: 'AU', region: 'Anglo', takeoff: 12.6, rise: 15 },
  { iso: 'CZ', region: 'Europe', takeoff: 12.8, rise: 4 },
  { iso: 'IR', region: 'MEast', takeoff: 13.0, rise: 6 },
  { iso: 'NO', region: 'Europe', takeoff: 13.3, rise: 4 },
  { iso: 'JP', region: 'Asia', takeoff: 13.3, rise: 56 },
  { iso: 'SE', region: 'Europe', takeoff: 13.5, rise: 11 },
  { iso: 'BR', region: 'LatAm', takeoff: 13.7, rise: 7 },
  { iso: 'CL', region: 'LatAm', takeoff: 14.0, rise: 16 },
  { iso: 'ES', region: 'Europe', takeoff: 14.0, rise: 2 },
  { iso: 'FR', region: 'Europe', takeoff: 14.0, rise: 3 },
  { iso: 'FI', region: 'Europe', takeoff: 14.3, rise: 3 },
  { iso: 'PT', region: 'Europe', takeoff: 14.5, rise: 1 },
  { iso: 'AR', region: 'LatAm', takeoff: 15.2, rise: 13 },
  { iso: 'TW', region: 'Asia', takeoff: 25.0, rise: 6 },
  { iso: 'SA', region: 'MEast', takeoff: 12.1, rise: 7 },
  { iso: 'EG', region: 'MEast', takeoff: 11.5, rise: 8 },
  { iso: 'IN', region: 'Asia', takeoff: 11.5, rise: 13 },
];

const REGIONS: { key: string; label: string; color: string }[] = [
  { key: 'Asia', label: 'Asia', color: GREEN },
  { key: 'Europe', label: 'Europe', color: BLUE },
  { key: 'Anglo', label: 'Anglosphere', color: BURGUNDY },
  { key: 'LatAm', label: 'Latin America', color: ORANGE },
  { key: 'MEast', label: 'Middle East', color: BLUE_LIGHT },
];
const COLOR: Record<string, string> = Object.fromEntries(REGIONS.map((r) => [r.key, r.color]));
const REGION_LABELS = REGIONS.map((r) => r.label);
const LABEL_BY_KEY: Record<string, string> = Object.fromEntries(REGIONS.map((r) => [r.key, r.label]));

// month index -> short label (1 = Jan 2024), kept for the tooltip's calendar anchor
const ML = ['', 'Jan 24', 'Feb 24', 'Mar 24', '', '', '', '', '', '', 'Oct 24', '', 'Dec 24', 'Jan 25', '', 'Mar 25', '', '', 'Jun 25', '', '', 'Sep 25', '', '', 'Dec 25', 'Jan 26', '', 'Mar 26'];
const fmtMonth = (v: number) => ML[Math.round(v)] ?? '';

// Re-express take-off as weeks since the earliest market took off (shared t=0).
const T0 = Math.min(...DATA.map((d) => d.takeoff));
const toWeeks = (monthIdx: number) => Math.round(((monthIdx - T0) * 52) / 12);

type Scale = 'linear' | 'log';
const SCALES: { key: Scale; label: string }[] = [
  { key: 'linear', label: 'linear' },
  { key: 'log', label: 'log' },
];

export function AdoptionTiming() {
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [scale, setScale] = useState<Scale>('linear');
  const shown = useMemo(() => {
    const pts = DATA.map((d) => ({ ...d, xw: toWeeks(d.takeoff) }));
    return regions.size === 0
      ? pts
      : pts.filter((d) => regions.has(LABEL_BY_KEY[d.region]));
  }, [regions]);
  return (
    <ChartCard
      title="Two separate questions: when, and how fast"
      subtitle="Each country placed by when its “Dubai chocolate” interest first took off (across) and how quickly it then climbed to a peak (up). Low on the chart is a sharp, external spike; high is a slow, word-of-mouth climb. The two axes are independent."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          Most countries sit low: a fast spike, whenever they caught it. A few sit
          high, the <b>slow climbers</b> (Japan, Singapore, Canada, Mexico). And
          Taiwan, bottom-right, is the giveaway: a fast spike that simply arrived a
          <b> year late</b>, not a different shape at all.
        </p>
      }
      source="Google Trends, weekly “Dubai chocolate” by country. Take-off = first week above 20% of the country’s own peak; rise = weeks from take-off to peak. Colour is region."
    >
      <ChartToolbar label="filters">
        <ComboSelect aria-label="Scale" icon={Activity} options={SCALES} value={scale} onChange={setScale} />
        <MultiSelectPopover
          icon={Globe}
          options={REGION_LABELS}
          selected={regions}
          onChange={setRegions}
          allLabel="All regions"
          pluralNoun="regions"
        />
      </ChartToolbar>
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 18, right: 20, bottom: 26, left: 10 }}>
            <CartesianGrid {...gridProps} />
            <ReferenceLine y={12} stroke={INK_SUBTLE} strokeDasharray="4 4" label={{ value: 'slow climb ↑   /   fast spike ↓', position: 'insideTopLeft', fill: INK_SUBTLE, fontSize: 10 }} />
            <XAxis
              type="number"
              dataKey="xw"
              domain={[-2, 70]}
              ticks={[0, 13, 26, 39, 52, 65]}
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={(v) => `${v}w`}
              label={{ value: 'weeks since the first market took off →', position: 'insideBottom', offset: -14, fill: INK_SUBTLE, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="rise"
              scale={scale === 'log' ? 'log' : 'linear'}
              domain={scale === 'log' ? [1, 60] : [0, 60]}
              ticks={scale === 'log' ? [1, 2, 5, 10, 20, 50] : undefined}
              allowDataOverflow
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={(v) => `${v}w`}
              label={{ value: 'weeks to peak →', angle: -90, position: 'insideLeft', offset: 8, fill: INK_SUBTLE, fontSize: 11 }}
            />
            <ZAxis range={[55, 55]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: INK_SUBTLE }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as Pt & { xw: number };
                return (
                  <ChartTooltip title={d.iso}>
                    <TooltipRow label="Took off" value={`wk ${d.xw} · ${fmtMonth(d.takeoff)}`} dotColor={COLOR[d.region]} />
                    <TooltipRow label="Weeks to peak" value={`${d.rise}`} />
                  </ChartTooltip>
                );
              }}
            />
            {REGIONS.map((r) => (
              <Scatter key={r.key} data={shown.filter((d) => d.region === r.key)} fill={r.color} fillOpacity={0.85} isAnimationActive={false}>
                <LabelList dataKey="iso" position="top" fontSize={9} fill={INK} />
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend items={REGIONS.map((r) => ({ label: r.label, color: r.color, shape: 'square' }))} />
    </ChartCard>
  );
}

export default AdoptionTiming;
