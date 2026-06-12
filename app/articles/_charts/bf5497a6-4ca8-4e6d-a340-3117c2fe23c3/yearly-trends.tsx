'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
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
  ORANGE,
  GREEN,
  INK,
  INK_SUBTLE,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Google Trends, Worldwide, monthly, the four topics compared on one scale
// (normalised together). Breastfeeding dominates; formula creeps up from late
// 2025; the May 2022 formula spike is the US shortage. June 2026 excluded.
const data = [
  { m: '2021-06', bf: 84, fo: 16, inf: 0, ba: 13 }, { m: '2021-07', bf: 86, fo: 16, inf: 0, ba: 12 },
  { m: '2021-08', bf: 88, fo: 16, inf: 0, ba: 13 }, { m: '2021-09', bf: 83, fo: 16, inf: 0, ba: 14 },
  { m: '2021-10', bf: 83, fo: 16, inf: 0, ba: 14 }, { m: '2021-11', bf: 80, fo: 17, inf: 0, ba: 13 },
  { m: '2021-12', bf: 80, fo: 17, inf: 0, ba: 12 }, { m: '2022-01', bf: 87, fo: 18, inf: 0, ba: 14 },
  { m: '2022-02', bf: 84, fo: 24, inf: 0, ba: 14 }, { m: '2022-03', bf: 81, fo: 20, inf: 0, ba: 14 },
  { m: '2022-04', bf: 78, fo: 21, inf: 0, ba: 14 }, { m: '2022-05', bf: 82, fo: 49, inf: 0, ba: 14 },
  { m: '2022-06', bf: 80, fo: 24, inf: 0, ba: 15 }, { m: '2022-07', bf: 86, fo: 20, inf: 0, ba: 16 },
  { m: '2022-08', bf: 84, fo: 20, inf: 0, ba: 16 }, { m: '2022-09', bf: 83, fo: 20, inf: 0, ba: 15 },
  { m: '2022-10', bf: 87, fo: 19, inf: 0, ba: 15 }, { m: '2022-11', bf: 80, fo: 18, inf: 0, ba: 14 },
  { m: '2022-12', bf: 82, fo: 19, inf: 0, ba: 14 }, { m: '2023-01', bf: 87, fo: 19, inf: 0, ba: 17 },
  { m: '2023-02', bf: 85, fo: 18, inf: 0, ba: 16 }, { m: '2023-03', bf: 79, fo: 17, inf: 0, ba: 16 },
  { m: '2023-04', bf: 75, fo: 17, inf: 0, ba: 16 }, { m: '2023-05', bf: 77, fo: 18, inf: 0, ba: 16 },
  { m: '2023-06', bf: 77, fo: 17, inf: 0, ba: 17 }, { m: '2023-07', bf: 82, fo: 18, inf: 0, ba: 16 },
  { m: '2023-08', bf: 80, fo: 18, inf: 0, ba: 14 }, { m: '2023-09', bf: 76, fo: 18, inf: 0, ba: 14 },
  { m: '2023-10', bf: 75, fo: 18, inf: 0, ba: 13 }, { m: '2023-11', bf: 76, fo: 18, inf: 0, ba: 13 },
  { m: '2023-12', bf: 76, fo: 17, inf: 0, ba: 12 }, { m: '2024-01', bf: 76, fo: 18, inf: 0, ba: 14 },
  { m: '2024-02', bf: 75, fo: 18, inf: 0, ba: 14 }, { m: '2024-03', bf: 72, fo: 17, inf: 0, ba: 13 },
  { m: '2024-04', bf: 72, fo: 18, inf: 0, ba: 13 }, { m: '2024-05', bf: 73, fo: 18, inf: 0, ba: 13 },
  { m: '2024-06', bf: 70, fo: 17, inf: 0, ba: 12 }, { m: '2024-07', bf: 76, fo: 18, inf: 0, ba: 12 },
  { m: '2024-08', bf: 78, fo: 18, inf: 0, ba: 13 }, { m: '2024-09', bf: 73, fo: 18, inf: 0, ba: 12 },
  { m: '2024-10', bf: 76, fo: 20, inf: 0, ba: 12 }, { m: '2024-11', bf: 76, fo: 19, inf: 0, ba: 12 },
  { m: '2024-12', bf: 76, fo: 19, inf: 0, ba: 12 }, { m: '2025-01', bf: 76, fo: 19, inf: 0, ba: 14 },
  { m: '2025-02', bf: 76, fo: 19, inf: 0, ba: 14 }, { m: '2025-03', bf: 74, fo: 20, inf: 0, ba: 13 },
  { m: '2025-04', bf: 74, fo: 20, inf: 0, ba: 14 }, { m: '2025-05', bf: 74, fo: 19, inf: 0, ba: 13 },
  { m: '2025-06', bf: 72, fo: 20, inf: 0, ba: 13 }, { m: '2025-07', bf: 76, fo: 22, inf: 0, ba: 14 },
  { m: '2025-08', bf: 82, fo: 25, inf: 0, ba: 14 }, { m: '2025-09', bf: 79, fo: 24, inf: 0, ba: 14 },
  { m: '2025-10', bf: 80, fo: 24, inf: 0, ba: 14 }, { m: '2025-11', bf: 77, fo: 28, inf: 1, ba: 14 },
  { m: '2025-12', bf: 77, fo: 24, inf: 1, ba: 13 }, { m: '2026-01', bf: 78, fo: 30, inf: 1, ba: 16 },
  { m: '2026-02', bf: 79, fo: 28, inf: 1, ba: 16 }, { m: '2026-03', bf: 83, fo: 28, inf: 1, ba: 15 },
  { m: '2026-04', bf: 84, fo: 28, inf: 1, ba: 16 }, { m: '2026-05', bf: 86, fo: 28, inf: 1, ba: 15 },
];

const SERIES = [
  { key: 'bf', label: 'Breastfeeding', color: BURGUNDY },
  { key: 'fo', label: 'Baby formula', color: BLUE },
  { key: 'ba', label: 'Baby food', color: ORANGE },
  { key: 'inf', label: 'Infant feeding', color: GREEN },
] as const;

const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+mo]} ${y.slice(2)}`;
};

export function YearlyTrends() {
  return (
    <ChartCard
      title="Five steady years, then a stir"
      subtitle="The four topics on one scale. Breastfeeding towers over everything and drifts gently; baby food holds; baby formula is smaller but creeps up from late 2025; infant feeding barely registers."
      footnote={
        <>
          The lone earlier spike, May 2022, is the US infant-formula shortage. The
          slow climb in formula from late 2025 is the first hint of what the last
          year would bring.
        </>
      }
      source="Google Trends, Worldwide, monthly, four topics normalised together (0–100). June 2026 excluded."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 4 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="m" tick={axisTickStyle} axisLine={{ stroke: INK }} tickLine={false} tickFormatter={fmtMonth} interval={5} />
            <YAxis tick={axisTickStyle} axisLine={{ stroke: INK }} tickLine={false} domain={[0, 100]} />
            <ReferenceLine x="2022-05" stroke={INK_SUBTLE} strokeDasharray="4 4" label={{ value: 'May 2022: US shortage', position: 'insideTopRight', style: { fontSize: 10, fill: INK_SUBTLE } }} />
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltip title={fmtMonth(String(label))} minWidth={180}>
                    {SERIES.map((s) => {
                      const p = payload.find((pp) => pp.dataKey === s.key);
                      return <TooltipRow key={s.key} label={s.label} value={p?.value as number} dotColor={s.color} />;
                    })}
                  </ChartTooltip>
                );
              }}
            />
            {SERIES.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} name={s.label} {...chartDefaults} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend items={SERIES.map((s) => ({ label: s.label, color: s.color, shape: 'line' }))} />
    </ChartCard>
  );
}

export default YearlyTrends;
