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
import { Check, Ruler, Activity, Globe, TrendingUp, ChevronDown } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

// Per-country search interest for three topics (Google Trends, Jun 2025 - May
// 2026): "infant nutrition" (search term), "baby formula" (/m/0hc4p) and
// "infant feeding" (/g/11fxwmyz6v). Fertility (TFR) latest 2024-25, annual
// births (thousands) and population (millions): World Bank / UN / CDC.
type Row = {
  country: string;
  region: 'Asia' | 'Europe' | 'Africa' | 'Americas';
  tfr: number;
  births: number; // thousands / yr
  pop: number; // millions
  nut: number;
  bf: number;
  inf: number;
};

const RAW: Row[] = [
  { country: 'South Korea', region: 'Asia', tfr: 0.75, births: 230, pop: 51.7, nut: 100, bf: 16, inf: 27 },
  { country: 'Singapore', region: 'Asia', tfr: 0.87, births: 28, pop: 6.0, nut: 74, bf: 38, inf: 32 },
  { country: 'China', region: 'Asia', tfr: 1.0, births: 9000, pop: 1410, nut: 72, bf: 23, inf: 50 },
  { country: 'Israel', region: 'Asia', tfr: 2.9, births: 180, pop: 9.8, nut: 53, bf: 19, inf: 19 },
  { country: 'United Arab Emirates', region: 'Asia', tfr: 1.2, births: 100, pop: 11, nut: 34, bf: 25, inf: 21 },
  { country: 'Saudi Arabia', region: 'Asia', tfr: 2.3, births: 580, pop: 33, nut: 33, bf: 10, inf: 12 },
  { country: 'Philippines', region: 'Asia', tfr: 1.9, births: 1750, pop: 116, nut: 26, bf: 23, inf: 24 },
  { country: 'Vietnam', region: 'Asia', tfr: 1.9, births: 1500, pop: 100, nut: 27, bf: 24, inf: 8 },
  { country: 'India', region: 'Asia', tfr: 2.0, births: 23000, pop: 1450, nut: 19, bf: 11, inf: 20 },
  { country: 'Japan', region: 'Asia', tfr: 1.2, births: 720, pop: 123, nut: 18, bf: 11, inf: 5 },
  { country: 'Indonesia', region: 'Asia', tfr: 2.1, births: 4600, pop: 283, nut: 11, bf: 35, inf: 4 },
  { country: 'Slovenia', region: 'Europe', tfr: 1.5, births: 17, pop: 2.1, nut: 44, bf: 11, inf: 31 },
  { country: 'Ireland', region: 'Europe', tfr: 1.5, births: 54, pop: 5.3, nut: 40, bf: 39, inf: 36 },
  { country: 'Switzerland', region: 'Europe', tfr: 1.3, births: 80, pop: 8.9, nut: 38, bf: 9, inf: 9 },
  { country: 'Netherlands', region: 'Europe', tfr: 1.5, births: 170, pop: 18, nut: 34, bf: 17, inf: 9 },
  { country: 'Finland', region: 'Europe', tfr: 1.3, births: 44, pop: 5.6, nut: 34, bf: 8, inf: 9 },
  { country: 'United Kingdom', region: 'Europe', tfr: 1.5, births: 620, pop: 69, nut: 32, bf: 42, inf: 51 },
  { country: 'Germany', region: 'Europe', tfr: 1.4, births: 690, pop: 84, nut: 26, bf: 5, inf: 7 },
  { country: 'France', region: 'Europe', tfr: 1.6, births: 660, pop: 66, nut: 23, bf: 13, inf: 7 },
  { country: 'Spain', region: 'Europe', tfr: 1.2, births: 320, pop: 48, nut: 24, bf: 13, inf: 16 },
  { country: 'Italy', region: 'Europe', tfr: 1.2, births: 370, pop: 59, nut: 15, bf: 9, inf: 5 },
  { country: 'Ethiopia', region: 'Africa', tfr: 3.9, births: 4200, pop: 130, nut: 46, bf: 16, inf: 35 },
  { country: 'Kenya', region: 'Africa', tfr: 3.2, births: 1500, pop: 56, nut: 37, bf: 15, inf: 21 },
  { country: 'Ghana', region: 'Africa', tfr: 3.4, births: 900, pop: 34, nut: 34, bf: 21, inf: 17 },
  { country: 'Nigeria', region: 'Africa', tfr: 4.3, births: 7600, pop: 230, nut: 31, bf: 16, inf: 15 },
  { country: 'Morocco', region: 'Africa', tfr: 2.3, births: 660, pop: 38, nut: 28, bf: 7, inf: 10 },
  { country: 'South Africa', region: 'Africa', tfr: 2.3, births: 1100, pop: 61, nut: 17, bf: 41, inf: 12 },
  { country: 'Egypt', region: 'Africa', tfr: 2.8, births: 2200, pop: 114, nut: 16, bf: 4, inf: 5 },
  { country: 'United States', region: 'Americas', tfr: 1.6, births: 3600, pop: 342, nut: 93, bf: 53, inf: 31 },
  { country: 'Canada', region: 'Americas', tfr: 1.3, births: 360, pop: 41, nut: 43, bf: 39, inf: 36 },
  { country: 'Mexico', region: 'Americas', tfr: 1.8, births: 1900, pop: 130, nut: 17, bf: 15, inf: 7 },
  { country: 'Colombia', region: 'Americas', tfr: 1.7, births: 550, pop: 52, nut: 17, bf: 12, inf: 7 },
  { country: 'Peru', region: 'Americas', tfr: 2.0, births: 580, pop: 34, nut: 17, bf: 13, inf: 16 },
  { country: 'Ecuador', region: 'Americas', tfr: 1.8, births: 280, pop: 18, nut: 17, bf: 13, inf: 12 },
  { country: 'Chile', region: 'Americas', tfr: 1.2, births: 180, pop: 19.6, nut: 15, bf: 11, inf: 10 },
  { country: 'Argentina', region: 'Americas', tfr: 1.4, births: 480, pop: 46, nut: 13, bf: 9, inf: 5 },
  { country: 'Brazil', region: 'Americas', tfr: 1.6, births: 2500, pop: 213, nut: 10, bf: 20, inf: 3 },
];

const REGION_COLORS: Record<Row['region'], string> = {
  Asia: BURGUNDY,
  Europe: BLUE,
  Africa: ORANGE,
  Americas: GREEN,
};

type Topic = 'nut' | 'bf' | 'inf';
type Metric = 'perBirth' | 'perCap' | 'raw';
type Scale = 'linear' | 'log';
type RechartsShape = 'circle' | 'triangle' | 'cross';

const TOPICS: { key: Topic; label: string }[] = [
  { key: 'nut', label: 'infant nutrition' },
  { key: 'bf', label: 'baby formula' },
  { key: 'inf', label: 'infant feeding' },
];
const TOPIC_SHAPE: Record<Topic, RechartsShape> = {
  nut: 'circle',
  bf: 'triangle',
  inf: 'cross',
};
const SHAPE_GLYPH: Record<RechartsShape, string> = {
  circle: '●',
  triangle: '▲',
  cross: '✚',
};
const METRICS: { key: Metric; label: string }[] = [
  { key: 'perBirth', label: 'per birth' },
  { key: 'perCap', label: 'per capita' },
  { key: 'raw', label: 'raw' },
];
const SCALES: { key: Scale; label: string }[] = [
  { key: 'linear', label: 'linear' },
  { key: 'log', label: 'log' },
];
const REGION_OPTIONS: Row['region'][] = ['Americas', 'Europe', 'Africa', 'Asia'];

const interestOf = (r: Row, t: Topic) => (t === 'nut' ? r.nut : t === 'bf' ? r.bf : r.inf);
const metricValue = (r: Row, t: Topic, m: Metric) => {
  const i = interestOf(r, t);
  return m === 'raw' ? i : m === 'perBirth' ? i / r.births : i / r.pop;
};

/**
 * Topic pill — neutral background, tinted-pink fill + checkmark when active.
 * Greyer/softer than the old burgundy fill so the chart itself stays the
 * star.
 */
function TopicPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-3 text-xs transition-colors"
      style={{
        borderColor: active ? '#E0BBD0' : '#D3D1C7',
        background: active ? '#FFE6F5' : 'transparent',
        color: active ? INK : INK_SUBTLE,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Small icon + select combo used for measure / scale. Keeps the filter
 * row compact so it reads as a toolbar rather than a wall of pills.
 */
function ComboSelect<T extends string>({
  icon: Icon,
  options,
  value,
  onChange,
}: {
  icon: typeof Ruler;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="h-8 w-auto gap-1.5 rounded-[6px] border-[#D3D1C7] bg-white px-2.5 text-xs text-ink-body">
        <Icon className="h-3.5 w-3.5 text-ink-subtle" strokeWidth={1.75} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.key} value={o.key} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Region filter — toggle one or more regions on. Empty selection = all
 * regions shown.
 */
function RegionMultiSelect({
  selected,
  onChange,
}: {
  selected: Set<Row['region']>;
  onChange: (next: Set<Row['region']>) => void;
}) {
  const isAll = selected.size === 0 || selected.size === REGION_OPTIONS.length;
  const triggerLabel = isAll
    ? 'All regions'
    : selected.size === 1
      ? Array.from(selected)[0]
      : `${selected.size} regions`;

  function toggle(r: Row['region']) {
    const next = new Set(selected);
    if (next.has(r)) next.delete(r);
    else next.add(r);
    onChange(next);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#D3D1C7] bg-white px-2.5 text-xs text-ink-body"
        >
          <Globe className="h-3.5 w-3.5 text-ink-subtle" strokeWidth={1.75} />
          {triggerLabel}
          <ChevronDown className="h-4 w-4 text-ink-subtle" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-44 rounded-[6px] border-[#D3D1C7] p-1"
      >
        <ul className="text-xs">
          {REGION_OPTIONS.map((r) => {
            const on = selected.has(r);
            return (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => toggle(r)}
                  className="flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-ink-body hover:bg-[#FAF7F9]"
                >
                  <span
                    aria-hidden
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border"
                    style={{
                      borderColor: on ? '#E0BBD0' : '#D3D1C7',
                      background: on ? '#FFE6F5' : 'transparent',
                    }}
                  >
                    {on ? (
                      <Check className="h-3 w-3 text-ink" strokeWidth={2.5} />
                    ) : null}
                  </span>
                  {r}
                </button>
              </li>
            );
          })}
          {selected.size > 0 ? (
            <>
              <li>
                <hr className="my-1 border-[#EEE6EC]" />
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onChange(new Set())}
                  className="w-full rounded-[4px] px-2 py-1.5 text-left text-ink-subtle hover:bg-[#FAF7F9]"
                >
                  Clear selection
                </button>
              </li>
            </>
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function SearchVsFertility() {
  const [topics, setTopics] = useState<Set<Topic>>(new Set(['nut']));
  const [metric, setMetric] = useState<Metric>('perBirth');
  const [scale, setScale] = useState<Scale>('log');
  const [regions, setRegions] = useState<Set<Row['region']>>(new Set());
  const [trend, setTrend] = useState(false);

  const isSingleTopic = topics.size === 1;

  const { datasets, labelSet, fit } = useMemo(() => {
    const baseRows = RAW.filter(
      (r) => regions.size === 0 || regions.has(r.region),
    );
    const orderedTopics = TOPICS.filter((t) => topics.has(t.key));
    const dsets = orderedTopics.map(({ key: t }) => {
      const max = Math.max(...RAW.map((r) => metricValue(r, t, metric)));
      const points = baseRows.map((r) => {
        const lin = Math.round((metricValue(r, t, metric) / max) * 1000) / 10;
        return {
          x: r.tfr,
          yLin: lin,
          y: scale === 'log' ? Math.max(0.1, lin) : lin,
          z: Math.sqrt(r.births),
          country: r.country,
          region: r.region,
          interest: interestOf(r, t),
          births: r.births,
          topic: t,
        };
      });
      return { topic: t, shape: TOPIC_SHAPE[t], points };
    });

    // Auto-labels and the OLS fit are only meaningful for one topic at a
    // time — skip both when comparing multiple series.
    const labelSet = new Set<string>();
    let fit: { r: number; seg: { x: number; y: number }[] } = {
      r: 0,
      seg: [],
    };
    if (dsets.length === 1) {
      const pts = dsets[0].points;
      const sorted = [...pts].sort((a, b) => b.y - a.y);
      if (pts.some((p) => p.country === 'United States')) labelSet.add('United States');
      if (pts.some((p) => p.country === 'China')) labelSet.add('China');
      for (const p of sorted) {
        if (labelSet.size >= 4) break;
        labelSet.add(p.country);
      }
      const n = pts.length;
      const mx = pts.reduce((s, p) => s + p.x, 0) / n;
      const my = pts.reduce((s, p) => s + p.yLin, 0) / n;
      let sxy = 0, sxx = 0, syy = 0;
      for (const p of pts) {
        sxy += (p.x - mx) * (p.yLin - my);
        sxx += (p.x - mx) ** 2;
        syy += (p.yLin - my) ** 2;
      }
      const slope = sxx ? sxy / sxx : 0;
      const intercept = my - slope * mx;
      const r = sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
      const xs = pts.map((p) => p.x);
      const x1 = Math.min(...xs), x2 = Math.max(...xs);
      const clamp = (v: number) => Math.min(120, Math.max(0.1, v));
      fit = {
        r,
        seg: [
          { x: x1, y: clamp(intercept + slope * x1) },
          { x: x2, y: clamp(intercept + slope * x2) },
        ],
      };
    }

    return { datasets: dsets, labelSet, fit };
  }, [topics, metric, scale, regions]);

  function toggleTopic(t: Topic) {
    const next = new Set(topics);
    if (next.has(t)) {
      // Keep at least one topic selected.
      if (next.size > 1) next.delete(t);
    } else {
      next.add(t);
    }
    setTopics(next);
  }

  const metricCaption =
    metric === 'perBirth'
      ? 'Search interest ÷ annual births, rescaled 0–100. Bubble size = births.'
      : metric === 'perCap'
        ? 'Search interest ÷ population, rescaled 0–100. Bubble size = births.'
        : 'Raw Google Trends interest (0–100). Bubble size = births.';

  return (
    <ChartCard
      title="The fewer the babies, the louder the search"
      subtitle={metricCaption}
      headline={
        <p className="text-sm leading-relaxed text-ink">
          On raw interest South Korea leads, but <b>per birth, Singapore is #1</b>,
          with Slovenia beside it. The big-birth countries (India, China, Nigeria,
          the US) sink to the floor. The pattern holds whichever topic you pick.
        </p>
      }
      source="Search: Google Trends, Jun 2025–May 2026. Fertility & births: World Bank, UN, CDC, national stats 2024–25. Rescaled globally per topic; controls filter the view."
    >
      {/* Topic — pick one or more; each gets its own marker shape on the
          chart (circle / triangle / cross). */}
      <div className="not-prose mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] uppercase tracking-wider text-ink-subtle data-num">
          topic
        </span>
        {TOPICS.map((t) => {
          const active = topics.has(t.key);
          return (
            <TopicPill
              key={t.key}
              active={active}
              onClick={() => toggleTopic(t.key)}
            >
              <span
                aria-hidden
                className="mr-0.5 text-[11px] leading-none"
                style={{ opacity: active ? 1 : 0.55 }}
              >
                {SHAPE_GLYPH[TOPIC_SHAPE[t.key]]}
              </span>
              {t.label}
            </TopicPill>
          );
        })}
      </div>

      {/* Everything else lives in a single tidy toolbar row. */}
      <div className="not-prose mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] uppercase tracking-wider text-ink-subtle data-num">
          filters
        </span>
        <ComboSelect
          icon={Ruler}
          options={METRICS}
          value={metric}
          onChange={setMetric}
        />
        <ComboSelect
          icon={Activity}
          options={SCALES}
          value={scale}
          onChange={setScale}
        />
        <RegionMultiSelect selected={regions} onChange={setRegions} />
        <button
          type="button"
          onClick={() => setTrend((v) => !v)}
          aria-pressed={trend && isSingleTopic}
          disabled={!isSingleTopic}
          title={!isSingleTopic ? 'Trend line is only available for one topic at a time' : undefined}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderColor: trend && isSingleTopic ? '#E0BBD0' : '#D3D1C7',
            background: trend && isSingleTopic ? '#FFE6F5' : 'transparent',
            color: trend && isSingleTopic ? INK : INK_SUBTLE,
          }}
        >
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          trend{trend && isSingleTopic ? ` · r = ${fit.r.toFixed(2)}` : ''}
        </button>
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
            {trend && isSingleTopic ? (
              <ReferenceLine
                stroke={INK}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                segment={fit.seg}
                ifOverflow="extendDomain"
              />
            ) : null}
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: BURGUNDY, strokeOpacity: 0.3 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as {
                  country: string;
                  region: Row['region'];
                  topic: Topic;
                  x: number;
                  yLin: number;
                  interest: number;
                  births: number;
                };
                const topicLabel = TOPICS.find((t) => t.key === d.topic)?.label;
                return (
                  <ChartTooltip
                    title={d.country}
                    accent={REGION_COLORS[d.region]}
                    minWidth={190}
                  >
                    {!isSingleTopic && topicLabel ? (
                      <TooltipRow label="Topic" value={topicLabel} />
                    ) : null}
                    <TooltipRow label="Intensity" value={d.yLin} dotColor={REGION_COLORS[d.region]} />
                    <TooltipRow label="Fertility rate" value={d.x.toFixed(2)} />
                    <TooltipRow label="Raw interest" value={d.interest} />
                    <TooltipRow label="Births / yr" value={`~${d.births.toLocaleString()}k`} />
                  </ChartTooltip>
                );
              }}
            />
            {datasets.map(({ topic: t, shape, points: pts }) => (
              <Scatter
                key={t}
                data={pts}
                shape={shape}
                {...chartDefaults}
              >
                {pts.map((p) => (
                  <Cell
                    key={`${t}-${p.country}`}
                    fill={`${REGION_COLORS[p.region]}73`}
                    stroke={p.country === 'United States' ? INK : REGION_COLORS[p.region]}
                    strokeWidth={p.country === 'United States' ? 1.5 : 1}
                  />
                ))}
                {isSingleTopic ? (
                  <LabelList
                    dataKey="country"
                    content={(props: any) => {
                      const { x, y, value } = props as {
                        x?: number;
                        y?: number;
                        value?: string | number;
                      };
                      if (x == null || y == null || !labelSet.has(String(value))) return null;
                      return (
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          fontSize={11}
                          fill={INK}
                          fontFamily="var(--font-roboto), sans-serif"
                        >
                          {value}
                        </text>
                      );
                    }}
                  />
                ) : null}
              </Scatter>
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
    </ChartCard>
  );
}

export default SearchVsFertility;
