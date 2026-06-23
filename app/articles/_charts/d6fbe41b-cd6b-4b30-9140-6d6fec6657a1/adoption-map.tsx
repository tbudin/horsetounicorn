'use client';

import {
  ScatterChart,
  Scatter,
  LabelList,
  XAxis,
  YAxis,
  ZAxis,
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
  BLUE_LIGHT,
  GREEN,
  ORANGE,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
} from '@/lib/chart-colors';

// One dot per country (32). x = months from the late-2024 launch to that
// country's peak; y = "persistence", the last six weeks of the export as a
// share of that country's own peak (high = the craving stuck; low = it
// crashed). Each country's "Dubai chocolate" series is self-indexed, so this
// compares SHAPE, not size. Weekly Google Trends, resampled.
type Pt = { iso: string; name: string; region: string; mtp: number; end: number };
const DATA: Pt[] = [
  { iso: 'AT', name: 'Austria', region: 'Europe', mtp: 1, end: 1 },
  { iso: 'DE', name: 'Germany', region: 'Europe', mtp: 1, end: 1 },
  { iso: 'CH', name: 'Switzerland', region: 'Europe', mtp: 2, end: 2 },
  { iso: 'TR', name: 'Turkey', region: 'MEast', mtp: 3, end: 12 },
  { iso: 'GR', name: 'Greece', region: 'Europe', mtp: 4, end: 1 },
  { iso: 'CZ', name: 'Czechia', region: 'Europe', mtp: 4, end: 2 },
  { iso: 'DK', name: 'Denmark', region: 'Europe', mtp: 4, end: 2 },
  { iso: 'IS', name: 'Iceland', region: 'Europe', mtp: 4, end: 10 },
  { iso: 'PT', name: 'Portugal', region: 'Europe', mtp: 5, end: 0 },
  { iso: 'NO', name: 'Norway', region: 'Europe', mtp: 5, end: 1 },
  { iso: 'FI', name: 'Finland', region: 'Europe', mtp: 5, end: 2 },
  { iso: 'FR', name: 'France', region: 'Europe', mtp: 5, end: 2 },
  { iso: 'IR', name: 'Iran', region: 'MEast', mtp: 5, end: 2 },
  { iso: 'UK', name: 'United Kingdom', region: 'Anglo', mtp: 5, end: 4 },
  { iso: 'ES', name: 'Spain', region: 'Europe', mtp: 5, end: 5 },
  { iso: 'BE', name: 'Belgium', region: 'Europe', mtp: 5, end: 7 },
  { iso: 'NZ', name: 'New Zealand', region: 'Anglo', mtp: 5, end: 8 },
  { iso: 'NL', name: 'Netherlands', region: 'Europe', mtp: 5, end: 12 },
  { iso: 'AE', name: 'UAE', region: 'MEast', mtp: 5, end: 18 },
  { iso: 'US', name: 'United States', region: 'Anglo', mtp: 5, end: 19 },
  { iso: 'ID', name: 'Indonesia', region: 'Asia', mtp: 5, end: 40 },
  { iso: 'MY', name: 'Malaysia', region: 'Asia', mtp: 5, end: 46 },
  { iso: 'BR', name: 'Brazil', region: 'LatAm', mtp: 6, end: 18 },
  { iso: 'SE', name: 'Sweden', region: 'Europe', mtp: 7, end: 9 },
  { iso: 'AU', name: 'Australia', region: 'Anglo', mtp: 7, end: 15 },
  { iso: 'CL', name: 'Chile', region: 'LatAm', mtp: 8, end: 15 },
  { iso: 'AR', name: 'Argentina', region: 'LatAm', mtp: 9, end: 9 },
  { iso: 'MX', name: 'Mexico', region: 'LatAm', mtp: 9, end: 34 },
  { iso: 'CA', name: 'Canada', region: 'Anglo', mtp: 10, end: 18 },
  { iso: 'SG', name: 'Singapore', region: 'Asia', mtp: 13, end: 35 },
  { iso: 'TW', name: 'Taiwan', region: 'Asia', mtp: 17, end: 42 },
  { iso: 'JP', name: 'Japan', region: 'Asia', mtp: 17, end: 46 },
];

const REGIONS: { key: string; label: string; color: string }[] = [
  { key: 'Asia', label: 'East / SE Asia', color: GREEN },
  { key: 'Europe', label: 'Europe', color: BLUE },
  { key: 'Anglo', label: 'Anglosphere', color: BURGUNDY },
  { key: 'LatAm', label: 'Latin America', color: ORANGE },
  { key: 'MEast', label: 'Middle East', color: BLUE_LIGHT },
];
const COLOR: Record<string, string> = Object.fromEntries(REGIONS.map((r) => [r.key, r.color]));

export function AdoptionMap() {
  return (
    <ChartCard
      title="Map all of it and a split appears: the West flashes, Asia sustains"
      subtitle="Every country that searched for “Dubai chocolate,” placed by how long it took to peak (across) and how much interest survived to mid-2026 (up). Colour is region. The textbook predictor, national “uncertainty avoidance,” does essentially nothing here (correlation with timing ≈ 0). Geography does almost all the work."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          The green dots (East and Southeast Asia) sit alone in the upper band:
          they adopted later and the craving <b>stuck</b>. Almost every Western
          market piles into the bottom-left, a <b>fast spike that crashed</b> to
          near nothing. Mexico is the lone Western hold-out.
        </p>
      }
      source="Google Trends, weekly “Dubai chocolate” interest by country (32 markets), each self-indexed to its own peak. “Persistence” = mean of the last six weeks as a share of that country’s peak. Uncertainty-avoidance from Hofstede; correlation with peak timing r ≈ −0.01 (n = 32)."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 12 }}>
            <CartesianGrid {...gridProps} />
            <ReferenceLine y={28} stroke={INK_SUBTLE} strokeDasharray="4 4" label={{ value: 'the craving stuck', position: 'insideTopRight', fill: INK_SUBTLE, fontSize: 10 }} />
            <XAxis
              type="number"
              dataKey="mtp"
              domain={[0, 18]}
              ticks={[0, 3, 6, 9, 12, 15, 18]}
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={(v) => `${v}mo`}
              label={{ value: 'months from launch to peak →', position: 'insideBottom', offset: -14, fill: INK_SUBTLE, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="end"
              domain={[-2, 50]}
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              label={{ value: 'interest still alive (% of peak) →', angle: -90, position: 'insideLeft', offset: 6, fill: INK_SUBTLE, fontSize: 11 }}
            />
            <ZAxis range={[55, 55]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: INK_SUBTLE }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as Pt;
                const reg = REGIONS.find((r) => r.key === d.region);
                return (
                  <ChartTooltip title={d.name}>
                    <TooltipRow label="Months to peak" value={`${d.mtp}`} dotColor={COLOR[d.region]} />
                    <TooltipRow label="Interest still alive" value={`${d.end}% of peak`} />
                    <TooltipRow label="Region" value={reg?.label ?? d.region} />
                  </ChartTooltip>
                );
              }}
            />
            {REGIONS.map((r) => (
              <Scatter
                key={r.key}
                data={DATA.filter((d) => d.region === r.key)}
                fill={r.color}
                fillOpacity={0.85}
                isAnimationActive={false}
              >
                <LabelList dataKey="iso" position="top" fontSize={9} fill={INK} />
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={REGIONS.map((r) => ({ label: r.label, color: r.color, shape: 'square' }))}
      />
    </ChartCard>
  );
}

export default AdoptionMap;
