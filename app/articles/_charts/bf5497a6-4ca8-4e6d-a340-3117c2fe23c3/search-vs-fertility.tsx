'use client';

import { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import {
  BURGUNDY,
  BLUE,
  ORANGE,
  GREEN,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Per-country interest for four consistent Google Trends topics (geoMap, past
// 5 years): breastfeeding, baby formula, infant feeding, baby food. Values are
// 0-100 relative interest; null = no data for that topic (e.g. China). TFR
// 2024-25, annual births (thousands), population (millions): World Bank/UN/CDC.
type Topic = 'bf' | 'fo' | 'if' | 'ba';
type Row = {
  country: string;
  region: 'Asia' | 'Europe' | 'Africa' | 'Americas';
  tfr: number;
  births: number;
  pop: number;
  bf: number | null;
  fo: number | null;
  if: number | null;
  ba: number | null;
};

const RAW: Row[] = [
  { country: 'South Korea', region: 'Asia', tfr: 0.75, births: 230, pop: 51.7, bf: 15, fo: 13, if: 18, ba: 7 },
  { country: 'Singapore', region: 'Asia', tfr: 0.87, births: 28, pop: 6.0, bf: 44, fo: 45, if: 40, ba: 12 },
  { country: 'China', region: 'Asia', tfr: 1.0, births: 9000, pop: 1410, bf: null, fo: null, if: 33, ba: null },
  { country: 'Israel', region: 'Asia', tfr: 2.9, births: 180, pop: 9.8, bf: 62, fo: 20, if: 18, ba: null },
  { country: 'United Arab Emirates', region: 'Asia', tfr: 1.2, births: 100, pop: 11, bf: 39, fo: 28, if: 25, ba: 8 },
  { country: 'Saudi Arabia', region: 'Asia', tfr: 2.3, births: 580, pop: 33, bf: 51, fo: 8, if: 11, ba: 2 },
  { country: 'Philippines', region: 'Asia', tfr: 1.9, births: 1750, pop: 116, bf: 50, fo: 30, if: 33, ba: 4 },
  { country: 'Vietnam', region: 'Asia', tfr: 1.9, births: 1500, pop: 100, bf: 50, fo: 25, if: 3, ba: 1 },
  { country: 'India', region: 'Asia', tfr: 2.0, births: 23000, pop: 1450, bf: 23, fo: 10, if: 18, ba: 4 },
  { country: 'Japan', region: 'Asia', tfr: 1.2, births: 720, pop: 123, bf: 19, fo: 13, if: 0, ba: 100 },
  { country: 'Indonesia', region: 'Asia', tfr: 2.1, births: 4600, pop: 283, bf: 84, fo: 48, if: 0, ba: 6 },
  { country: 'Slovenia', region: 'Europe', tfr: 1.5, births: 17, pop: 2.1, bf: null, fo: null, if: 44, ba: null },
  { country: 'Ireland', region: 'Europe', tfr: 1.5, births: 54, pop: 5.3, bf: 52, fo: 46, if: 48, ba: 6 },
  { country: 'Switzerland', region: 'Europe', tfr: 1.3, births: 80, pop: 8.9, bf: 46, fo: 7, if: 7, ba: 14 },
  { country: 'Netherlands', region: 'Europe', tfr: 1.5, births: 170, pop: 18, bf: 44, fo: 20, if: 7, ba: 10 },
  { country: 'Finland', region: 'Europe', tfr: 1.3, births: 44, pop: 5.6, bf: 31, fo: null, if: 7, ba: null },
  { country: 'United Kingdom', region: 'Europe', tfr: 1.5, births: 620, pop: 69, bf: 50, fo: 50, if: 66, ba: 7 },
  { country: 'Germany', region: 'Europe', tfr: 1.4, births: 690, pop: 84, bf: 49, fo: 3, if: 3, ba: 16 },
  { country: 'France', region: 'Europe', tfr: 1.6, births: 660, pop: 66, bf: 42, fo: 10, if: 3, ba: 3 },
  { country: 'Spain', region: 'Europe', tfr: 1.2, births: 320, pop: 48, bf: 49, fo: 13, if: 14, ba: 1 },
  { country: 'Italy', region: 'Europe', tfr: 1.2, births: 370, pop: 59, bf: 42, fo: 11, if: 3, ba: 1 },
  { country: 'Ethiopia', region: 'Africa', tfr: 3.9, births: 4200, pop: 130, bf: null, fo: null, if: 77, ba: null },
  { country: 'Kenya', region: 'Africa', tfr: 3.2, births: 1500, pop: 56, bf: 87, fo: 25, if: 33, ba: 6 },
  { country: 'Ghana', region: 'Africa', tfr: 3.4, births: 900, pop: 34, bf: 74, fo: 27, if: 37, ba: 13 },
  { country: 'Nigeria', region: 'Africa', tfr: 4.3, births: 7600, pop: 230, bf: 73, fo: 21, if: 29, ba: 10 },
  { country: 'Morocco', region: 'Africa', tfr: 2.3, births: 660, pop: 38, bf: 46, fo: null, if: null, ba: null },
  { country: 'South Africa', region: 'Africa', tfr: 2.3, births: 1100, pop: 61, bf: 50, fo: 56, if: 18, ba: 7 },
  { country: 'Egypt', region: 'Africa', tfr: 2.8, births: 2200, pop: 114, bf: 81, fo: 5, if: 3, ba: 1 },
  { country: 'United States', region: 'Americas', tfr: 1.6, births: 3600, pop: 342, bf: 51, fo: 68, if: 37, ba: 10 },
  { country: 'Canada', region: 'Americas', tfr: 1.3, births: 360, pop: 41, bf: 51, fo: 55, if: 44, ba: 7 },
  { country: 'Mexico', region: 'Americas', tfr: 1.8, births: 1900, pop: 130, bf: 54, fo: 19, if: 3, ba: 1 },
  { country: 'Colombia', region: 'Americas', tfr: 1.7, births: 550, pop: 52, bf: 54, fo: 11, if: 3, ba: 1 },
  { country: 'Peru', region: 'Americas', tfr: 2.0, births: 580, pop: 34, bf: 57, fo: 16, if: 14, ba: 1 },
  { country: 'Ecuador', region: 'Americas', tfr: 1.8, births: 280, pop: 18, bf: 63, fo: 16, if: 7, ba: null },
  { country: 'Chile', region: 'Americas', tfr: 1.2, births: 180, pop: 19.6, bf: 58, fo: 12, if: 3, ba: 1 },
  { country: 'Argentina', region: 'Americas', tfr: 1.4, births: 480, pop: 46, bf: 33, fo: 9, if: 3, ba: 1 },
  { country: 'Brazil', region: 'Americas', tfr: 1.6, births: 2500, pop: 213, bf: 72, fo: 21, if: 0, ba: 1 },
];

const REGION_COLORS: Record<Row['region'], string> = {
  Asia: BURGUNDY,
  Europe: BLUE,
  Africa: ORANGE,
  Americas: GREEN,
};

type Metric = 'perBirth' | 'perCap' | 'raw';
type Scale = 'linear' | 'log';
type Region = 'All' | Row['region'];

const TOPICS: { key: Topic; label: string }[] = [
  { key: 'bf', label: 'breastfeeding' },
  { key: 'fo', label: 'baby formula' },
  { key: 'if', label: 'infant feeding' },
  { key: 'ba', label: 'baby food' },
];
const METRICS: { key: Metric; label: string }[] = [
  { key: 'perBirth', label: 'per birth' },
  { key: 'perCap', label: 'per capita' },
  { key: 'raw', label: 'raw' },
];
const SCALES: { key: Scale; label: string }[] = [
  { key: 'linear', label: 'linear' },
  { key: 'log', label: 'log' },
];
const REGIONS: Region[] = ['All', 'Americas', 'Europe', 'Africa', 'Asia'];

const interestOf = (r: Row, t: Topic): number | null => r[t];
const metricValue = (r: Row, t: Topic, m: Metric): number | null => {
  const i = interestOf(r, t);
  if (i == null) return null;
  return m === 'raw' ? i : m === 'perBirth' ? i / r.births : i / r.pop;
};

function Seg<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-[11px] text-ink-subtle">{label}</span>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className="rounded-[6px] border px-2.5 py-1 text-xs"
            style={{ borderColor: on ? BURGUNDY : '#D3D1C7', background: on ? BURGUNDY : 'transparent', color: on ? '#fff' : INK_SUBTLE }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SearchVsFertility() {
  const [topic, setTopic] = useState<Topic>('bf');
  const [metric, setMetric] = useState<Metric>('perBirth');
  const [scale, setScale] = useState<Scale>('linear');
  const [region, setRegion] = useState<Region>('All');

  const { points, labelSet } = useMemo(() => {
    const vals = RAW.map((r) => metricValue(r, topic, metric)).filter((v): v is number => v != null);
    const max = vals.length ? Math.max(...vals) : 1;
    const rows = RAW.filter((r) => (region === 'All' || r.region === region) && interestOf(r, topic) != null);
    const pts = rows.map((r) => {
      const raw = metricValue(r, topic, metric) as number;
      const lin = Math.round((raw / max) * 1000) / 10;
      return {
        x: r.tfr,
        yLin: lin,
        y: scale === 'log' ? Math.max(0.1, lin) : lin,
        z: Math.sqrt(r.births),
        country: r.country,
        region: r.region,
        interest: interestOf(r, topic) as number,
        births: r.births,
      };
    });
    const sorted = [...pts].sort((a, b) => b.y - a.y);
    const set = new Set<string>();
    if (pts.some((p) => p.country === 'United States')) set.add('United States');
    if (pts.some((p) => p.country === 'India')) set.add('India');
    for (const p of sorted) {
      if (set.size >= 4) break;
      set.add(p.country);
    }
    return { points: pts, labelSet: set };
  }, [topic, metric, scale, region]);

  const metricCaption =
    metric === 'perBirth'
      ? 'Topic interest ÷ annual births, rescaled 0–100. Bubble size = births.'
      : metric === 'perCap'
        ? 'Topic interest ÷ population, rescaled 0–100. Bubble size = births.'
        : 'Raw Google Trends topic interest (0–100). Bubble size = births.';

  return (
    <ChartCard
      title="The fewer the babies, the louder the search"
      subtitle={metricCaption}
      headline={
        <p className="text-sm leading-relaxed text-ink">
          On raw interest, high-birth countries often search the most. But{' '}
          <b>per birth it flips</b>: Singapore, Ireland and Slovenia rise to the top
          while India, China and Nigeria sink. Attention per child tracks fewer
          babies, not more, whichever topic you pick.
        </p>
      }
      source="Search: Google Trends topics, past 5 years (geoMap). Fertility & births: World Bank, UN, CDC 2024–25. Rescaled globally per topic; controls filter the view. China and some others lack data on certain topics."
    >
      <div className="not-prose mb-2.5">
        <Seg label="topic" options={TOPICS} value={topic} onChange={setTopic} />
      </div>
      <div className="not-prose mb-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Seg label="measure" options={METRICS} value={metric} onChange={setMetric} />
        <Seg label="scale" options={SCALES} value={scale} onChange={setScale} />
      </div>
      <div className="not-prose mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] text-ink-subtle">region</span>
        {REGIONS.map((r) => {
          const on = r === region;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className="rounded-[6px] border px-2.5 py-1 text-xs lowercase"
              style={{ borderColor: on ? BURGUNDY : '#D3D1C7', background: on ? BURGUNDY : 'transparent', color: on ? '#fff' : INK_SUBTLE }}
            >
              {r}
            </button>
          );
        })}
      </div>

      <div className="not-prose mb-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
        {(Object.keys(REGION_COLORS) as Row['region'][]).map((r) => (
          <span key={r} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: REGION_COLORS[r] }} />
            {r}
          </span>
        ))}
      </div>

      <ChartContainer aspect="3 / 2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0.4, 4.7]}
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              label={{ value: 'Total fertility rate (births per woman)', position: 'insideBottom', offset: -14, style: { fontSize: 12, fill: INK_SUBTLE } }}
            />
            <YAxis
              type="number"
              dataKey="y"
              scale={scale === 'log' ? 'log' : 'linear'}
              domain={scale === 'log' ? [0.1, 120] : [0, 120]}
              ticks={scale === 'log' ? [0.1, 1, 10, 100] : [0, 20, 40, 60, 80, 100, 120]}
              allowDataOverflow
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              label={{ value: scale === 'log' ? 'Search intensity (0–100, log)' : 'Search intensity (0–100)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: INK_SUBTLE } }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 650]} name="Births" />
            <ReferenceLine
              x={2.1}
              stroke={INK_SUBTLE}
              strokeDasharray="4 4"
              label={{ value: 'replacement 2.1', position: 'insideTopRight', style: { fontSize: 10, fill: INK_SUBTLE } }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: BURGUNDY, strokeOpacity: 0.3 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof points)[number];
                return (
                  <ChartTooltip title={d.country} accent={REGION_COLORS[d.region]} minWidth={190}>
                    <TooltipRow label="Intensity" value={d.yLin} dotColor={REGION_COLORS[d.region]} />
                    <TooltipRow label="Fertility rate" value={d.x.toFixed(2)} />
                    <TooltipRow label="Raw interest" value={d.interest} />
                    <TooltipRow label="Births / yr" value={`~${d.births.toLocaleString()}k`} />
                  </ChartTooltip>
                );
              }}
            />
            <Scatter data={points} {...chartDefaults}>
              {points.map((p) => (
                <Cell
                  key={p.country}
                  fill={`${REGION_COLORS[p.region]}73`}
                  stroke={p.country === 'United States' ? INK : REGION_COLORS[p.region]}
                  strokeWidth={p.country === 'United States' ? 1.5 : 1}
                />
              ))}
              <LabelList
                dataKey="country"
                content={(props: any) => {
                  const { x, y, value } = props as { x?: number; y?: number; value?: string | number };
                  if (x == null || y == null || !labelSet.has(String(value))) return null;
                  return (
                    <text x={x} y={y - 12} textAnchor="middle" fontSize={11} fill={INK} fontFamily="var(--font-roboto), sans-serif">
                      {value}
                    </text>
                  );
                }}
              />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}

export default SearchVsFertility;
