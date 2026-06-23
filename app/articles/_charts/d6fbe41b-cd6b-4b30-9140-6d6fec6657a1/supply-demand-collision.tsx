'use client';

import {
  ScatterChart,
  Scatter,
  Cell,
  LabelList,
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
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
} from '@/lib/chart-colors';

// Each point is one crop year: US in-shell production (x, billion lb) against
// the US grower in-shell price (y, USD/lb, USDA NASS marketing-year average).
// The path runs in time order, so you can read where the system is heading.
// History (2008-2021) is muted; the recent break (2022-2025) is highlighted.
type Pt = { yr: string; prod: number; price: number };
const HIST: Pt[] = [
  { yr: '2008', prod: 0.278, price: 2.05 },
  { yr: '2009', prod: 0.355, price: 1.67 },
  { yr: '2010', prod: 0.522, price: 2.00 },
  { yr: '2011', prod: 0.444, price: 2.00 },
  { yr: '2012', prod: 0.551, price: 2.61 },
  { yr: '2013', prod: 0.470, price: 3.48 },
  { yr: '2014', prod: 0.514, price: 3.57 },
  { yr: '2015', prod: 0.270, price: 3.29 },
  { yr: '2016', prod: 0.897, price: 1.68 },
  { yr: '2017', prod: 0.600, price: 1.69 },
  { yr: '2018', prod: 0.987, price: 2.65 },
  { yr: '2019', prod: 0.740, price: 2.81 },
  { yr: '2020', prod: 1.045, price: 2.51 },
  { yr: '2021', prod: 1.155, price: 2.52 },
];
// Recent path starts at 2021 so the highlighted line joins the history cloud.
const RECENT: Pt[] = [
  { yr: '2021', prod: 1.155, price: 2.52 },
  { yr: '2022', prod: 0.882, price: 2.11 },
  { yr: '2023', prod: 1.490, price: 1.87 },
  { yr: '2024', prod: 1.100, price: 2.25 },
  { yr: '2025', prod: 1.580, price: 2.48 },
];
// Years to label on the history cloud (the textbook inverse extremes).
const HIST_LABELS = new Set(['2008', '2015', '2016']);

const fmtYr = (v: string) => (HIST_LABELS.has(v) ? v : '');
const fmtYrR = (v: string) => (v === '2021' ? '' : v);

export function SupplyDemandCollision() {
  return (
    <ChartCard
      title="For fifteen years, bigger crops meant cheaper nuts. Then the rule broke."
      subtitle="Every dot is one crop year: how much America grew (across) versus what growers were paid (up). For most of the 2010s the cloud slopes down, the textbook law of supply. Since 2023 the path bends up and to the right: record harvests, and rising prices anyway."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          2016 sits bottom-right (a huge crop, price near <b>$1.68</b>); 2015
          top-left (a frost-hit crop, <b>$3.29</b>). Then watch 2023 to 2025: the
          two <b>biggest harvests ever</b>, yet the price climbs from $1.87 to $2.48.
          Demand started overriding supply.
        </p>
      }
      footnote={
        <span>
          This is the <b>grower</b> price for ordinary in-shell nuts. The shortage
          everyone felt was in a narrower grade: peeled green <b>kernels</b> for
          pistachio cream, which roughly doubled from ~$7.65/lb (2024) to ~$11/lb
          (early 2026). Same crop, very different cuts.
        </span>
      }
      source="Production: USDA FAS PSD / ACP (in-shell, billion lb; 2025 forecast). Price: USDA NASS marketing-year average grower price for in-shell pistachios ($/lb). 2024–25 prices are preliminary."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 20, bottom: 24, left: 12 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              type="number"
              dataKey="prod"
              domain={[0, 1.8]}
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(1)}bn`}
              label={{ value: 'US production (bn lb) →', position: 'insideBottom', offset: -12, fill: INK_SUBTLE, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="price"
              domain={[0, 4]}
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              label={{ value: 'grower price ($/lb) →', angle: -90, position: 'insideLeft', offset: 4, fill: INK_SUBTLE, fontSize: 11 }}
            />
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as Pt;
                return (
                  <ChartTooltip title={d.yr}>
                    <TooltipRow label="US production" value={`${d.prod.toFixed(2)} bn lb`} dotColor={INK_SUBTLE} />
                    <TooltipRow label="Grower price" value={`$${d.price.toFixed(2)}/lb`} dotColor={BURGUNDY} />
                  </ChartTooltip>
                );
              }}
            />
            <Scatter data={HIST} fill={BLUE} line={{ stroke: INK_SUBTLE, strokeWidth: 1 }} isAnimationActive={false}>
              {HIST.map((d) => (
                <Cell key={d.yr} fill={BLUE} />
              ))}
              <LabelList dataKey="yr" position="top" formatter={fmtYr} fontSize={10} fill={INK_SUBTLE} />
            </Scatter>
            <Scatter data={RECENT} fill={BURGUNDY} line={{ stroke: BURGUNDY, strokeWidth: 2 }} isAnimationActive={false}>
              {RECENT.map((d) => (
                <Cell key={d.yr} fill={d.yr === '2021' ? BLUE : BURGUNDY} />
              ))}
              <LabelList dataKey="yr" position="top" formatter={fmtYrR} fontSize={10} fill={BURGUNDY} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={[
          { label: '2008–2021', color: BLUE, shape: 'square' },
          { label: '2022–2025 (the break)', color: BURGUNDY, shape: 'line' },
        ]}
      />
    </ChartCard>
  );
}

export default SupplyDemandCollision;
