'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import { DataTable } from '@/components/article/data-table';
import {
  BURGUNDY,
  BURGUNDY_MID,
  BURGUNDY_FADED,
  INK,
  INK_MUTED,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';
import { fmtPctPlain } from '@/lib/format';

// Backtest: a $12,000 windfall, either invested all at once or spread in equal
// yearly tranches, then held to a common 10-year horizon. Idle cash earns 2%.
// Run across every start year 1994-2015 of S&P 500 annual total returns.
// "Lump win rate" = share of windows where investing immediately ended ahead.
// Source: S&P 500 annual total returns (slickcharts.com); author's backtest.
const data = [
  { spread: 'Over 2 years', win: 83, adv: 6.0 },
  { spread: 'Over 3 years', win: 78, adv: 9.5 },
  { spread: 'Over 5 years', win: 70, adv: 22.4 },
];

const BAR_COLORS = [BURGUNDY, BURGUNDY_MID, BURGUNDY_FADED];

export function LumpSumVsDca() {
  return (
    <ChartCard
      title="Investing it all at once usually won"
      subtitle="A $12,000 windfall, invested immediately versus drip-fed in equal yearly tranches, then held to a common ten-year finish line. Tested across every starting year from 1994 to 2015. The bars show how often the all-at-once investor finished ahead."
      footnote={
        <>
          The longer you spread the money out, the more often investing it all at
          once won, and the wider the average gap when it did. Spreading a windfall
          over five years left the immediate investor ahead by a median of 22%.
          Markets rise more often than they fall, so cash on the sidelines is
          usually cash missing the climb.
        </>
      }
      source="S&P 500 annual total returns, 1994-2025 (slickcharts.com). Author's backtest: idle cash earns 2% a year. Vanguard's larger study (1976-2022) found lump-sum investing beat dollar-cost averaging about two-thirds of the time."
    >
      <ChartContainer aspect="2 / 1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 16, bottom: 8, left: 4 }}
          >
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis
              dataKey="spread"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(158,10,113,0.06)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as (typeof data)[number];
                return (
                  <ChartTooltip title={String(label)} minWidth={200}>
                    <TooltipRow
                      label="Invest-it-all won"
                      value={`${d.win}% of the time`}
                      dotColor={BURGUNDY}
                    />
                    <TooltipRow
                      label="Median advantage"
                      value={`+${d.adv.toFixed(1)}%`}
                    />
                  </ChartTooltip>
                );
              }}
            />
            <Bar dataKey="win" radius={[2, 2, 0, 0]} {...chartDefaults}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i]} />
              ))}
              <LabelList
                dataKey="win"
                position="top"
                formatter={(v: number) => `${v}%`}
                style={{
                  fontFamily: 'var(--font-roboto-mono), monospace',
                  fontSize: 12,
                  fill: INK_MUTED,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <DataTable
        columns={[
          {
            header: 'Windfall spread',
            align: 'left',
            render: (r) => (
              <span style={{ fontWeight: 500, color: INK }}>{r.spread}</span>
            ),
          },
          {
            header: 'All-at-once win rate',
            render: (r) => (
              <span style={{ color: BURGUNDY, fontWeight: 600 }}>
                {fmtPctPlain(r.win, 0)}
              </span>
            ),
            headerColor: INK_MUTED,
          },
          {
            header: 'Median advantage when it won',
            render: (r) => (
              <span style={{ color: INK_MUTED }}>+{r.adv.toFixed(1)}%</span>
            ),
            headerColor: INK_MUTED,
          },
        ]}
        rows={data}
      />
    </ChartCard>
  );
}

export default LumpSumVsDca;
