'use client';

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
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import {
  BURGUNDY,
  BURGUNDY_FADED,
  INK,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Google Trends, Worldwide, August value each year. Each term on its own scale
// (small multiples) so the synchronised 2025 step-up is visible in all three.
const YEARS = ['2021', '2022', '2023', '2024', '2025'];

const PANELS: { term: string; values: number[]; delta: string }[] = [
  { term: 'breastfeeding', values: [56, 56, 57, 58, 69], delta: '+19%' },
  { term: 'baby food', values: [21, 22, 20, 20, 25], delta: '+25%' },
  { term: 'infant formula', values: [1, 2, 2, 2, 5], delta: '+150%' },
];

function MiniChart({ term, values, delta }: { term: string; values: number[]; delta: string }) {
  const data = YEARS.map((y, i) => ({ year: y, v: values[i] }));
  return (
    <div className="rounded-[8px] border border-[#F0E8EE] bg-[#FAF7F9] px-3 py-2.5">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink-heading">{term}</span>
        <span className="text-xs font-medium" style={{ color: BURGUNDY }}>
          {delta}
        </span>
      </div>
      <div className="relative h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis dataKey="year" tick={{ ...axisTickStyle, fontSize: 10 }} axisLine={{ stroke: INK }} tickLine={false} tickFormatter={(y: string) => `'${y.slice(2)}`} />
            <YAxis tick={{ ...axisTickStyle, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              cursor={{ fill: BURGUNDY, fillOpacity: 0.06 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltip title={`August ${label}`}>
                    <TooltipRow label={term} value={payload[0].value as number} dotColor={BURGUNDY} />
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
      </div>
    </div>
  );
}

export function August2025CategoryLift() {
  return (
    <ChartCard
      title="August 2025: the whole basket stepped up"
      subtitle="August value each year, each term on its own scale. Flat for four years, then a jump in 2025 across all of them. The Δ shows 2025 against 2024."
      footnote={
        <>
          Splitting the terms lets each small absolute move show its true shape:
          infant formula&apos;s jump is large in percentage terms but off a tiny base.
          In this breastfeeding-dominated export &ldquo;toddler nutrition&rdquo; sits
          at the rounding floor, see the three-wave chart for its real size. Read this
          as evidence the whole basket rose together.
        </>
      }
      source="Google Trends, Worldwide, August value each year. Δ = 2025 vs 2024."
    >
      <div className="not-prose grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {PANELS.map((p) => (
          <MiniChart key={p.term} {...p} />
        ))}
      </div>
    </ChartCard>
  );
}

export default August2025CategoryLift;
