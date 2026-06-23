'use client';

import {
  LineChart,
  Line,
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
  INK_MUTED,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';
import { fmtUsd, fmtUsdLong } from '@/lib/format';

// Two investors, each contributing $12,000 a year, 1994-2025.
// "Always in" invests every contribution the moment it arrives.
// "Wait for the dip" parks each contribution in cash (earning 2%) and only
// deploys the pile after a down year. Same money in, very different finishes.
// Source: S&P 500 annual total returns (slickcharts.com); author's backtest.
const data = [
  { y: 1994, ai: 12158, wd: 12240 }, { y: 1995, ai: 33237, wd: 24725 },
  { y: 1996, ai: 55624, wd: 37459 }, { y: 1997, ai: 90183, wd: 50448 },
  { y: 1998, ai: 131387, wd: 63697 }, { y: 1999, ai: 173555, wd: 77211 },
  { y: 2000, ai: 168670, wd: 90996 }, { y: 2001, ai: 159188, wd: 90749 },
  { y: 2002, ai: 133355, wd: 80042 }, { y: 2003, ai: 187043, wd: 118439 },
  { y: 2004, ai: 220699, wd: 143566 }, { y: 2005, ai: 244125, wd: 162499 },
  { y: 2006, ai: 296567, wd: 196987 }, { y: 2007, ai: 325507, wd: 218735 },
  { y: 2008, ai: 212630, wd: 169718 }, { y: 2009, ai: 284067, wd: 229800 },
  { y: 2010, ai: 340654, wd: 276648 }, { y: 2011, ai: 360095, wd: 294712 },
  { y: 2012, ai: 431631, wd: 350645 }, { y: 2013, ai: 587322, wd: 465074 },
  { y: 2014, ai: 681370, wd: 535086 }, { y: 2015, ai: 702938, wd: 555105 },
  { y: 2016, ai: 800445, wd: 626045 }, { y: 2017, ai: 989801, wd: 756906 },
  { y: 2018, ai: 957923, wd: 742696 }, { y: 2019, ai: 1275351, wd: 992350 },
  { y: 2020, ai: 1524224, wd: 1187183 }, { y: 2021, ai: 1977274, wd: 1536993 },
  { y: 2022, ai: 1629016, wd: 1275856 }, { y: 2023, ai: 2072439, wd: 1626433 },
  { y: 2024, ai: 2605966, wd: 2045607 }, { y: 2025, ai: 3086058, wd: 2421658 },
];

const SERIES = [
  { key: 'ai', label: 'Always invested', color: BURGUNDY },
  { key: 'wd', label: 'Wait for the dip', color: BLUE },
] as const;

export function HybridTrap() {
  return (
    <ChartCard
      title="Waiting for the dip cost $664,000"
      subtitle="Two investors, the same $12,000 added every year from 1994 to 2025, $384,000 in all. One invests each contribution the day it lands. The other holds it in cash and waits to buy after a down year. Patience for a bargain, it turns out, is expensive."
      footnote={
        <>
          The dip-waiter does buy in cheaper sometimes, but spends most of the
          three decades holding cash through a market that kept rising. By 2025 the
          always-invested account is worth about 27% more, on identical
          contributions. The clever-looking hybrid is a trap: the cost of being out
          dwarfs the discount of buying in low.
        </>
      }
      source="S&P 500 annual total returns, 1994-2025 (slickcharts.com). Author's backtest: idle cash earns 2% a year; the dip-waiter deploys all accumulated cash at the start of the year after any calendar-year decline."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis
              dataKey="y"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtUsd}
            />
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as (typeof data)[number];
                const gap = row.ai - row.wd;
                return (
                  <ChartTooltip title={String(label)} minWidth={210}>
                    {SERIES.map((s) => (
                      <TooltipRow
                        key={s.key}
                        label={s.label}
                        value={fmtUsdLong(row[s.key])}
                        dotColor={s.color}
                      />
                    ))}
                    <TooltipRow
                      label="Cost of waiting"
                      value={fmtUsdLong(gap)}
                      color={INK_MUTED}
                    />
                  </ChartTooltip>
                );
              }}
            />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2.2}
                dot={false}
                {...chartDefaults}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={SERIES.map((s) => ({ label: s.label, color: s.color, shape: 'line' }))}
      />
    </ChartCard>
  );
}

export default HybridTrap;
