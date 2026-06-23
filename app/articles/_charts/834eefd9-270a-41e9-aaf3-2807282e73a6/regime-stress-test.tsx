'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartContainer } from '@/components/charts/chart-container';
import { ChartLegend } from '@/components/charts/chart-legend';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import { DataTable } from '@/components/article/data-table';
import {
  BURGUNDY,
  BLUE,
  ORANGE,
  INK,
  INK_MUTED,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';
import { fmtUsd, fmtUsdLong, fmtMult } from '@/lib/format';

// $10,000 invested as a lump at the worst possible moments, then simply held
// (dividends reinvested) through to the end of 2025.
// Source: S&P 500 annual total returns (slickcharts.com); author's backtest.
const data = [
  { y: 1999, dotcom: 10000 },
  { y: 2000, dotcom: 9090 },
  { y: 2001, dotcom: 8009 },
  { y: 2002, dotcom: 6239 },
  { y: 2003, dotcom: 8029 },
  { y: 2004, dotcom: 8902 },
  { y: 2005, dotcom: 9339 },
  { y: 2006, dotcom: 10814 },
  { y: 2007, dotcom: 11407, gfc: 10000 },
  { y: 2008, dotcom: 7187, gfc: 6300 },
  { y: 2009, dotcom: 9088, gfc: 7967 },
  { y: 2010, dotcom: 10457, gfc: 9167 },
  { y: 2011, dotcom: 10678, gfc: 9360 },
  { y: 2012, dotcom: 12386, gfc: 10858 },
  { y: 2013, dotcom: 16398, gfc: 14375 },
  { y: 2014, dotcom: 18643, gfc: 16343 },
  { y: 2015, dotcom: 18900, gfc: 16568 },
  { y: 2016, dotcom: 21161, gfc: 18550 },
  { y: 2017, dotcom: 25780, gfc: 22599 },
  { y: 2018, dotcom: 24651, gfc: 21609 },
  { y: 2019, dotcom: 32413, gfc: 28414 },
  { y: 2020, dotcom: 38377, gfc: 33642 },
  { y: 2021, dotcom: 49395, gfc: 43301, y2022: 10000 },
  { y: 2022, dotcom: 40450, gfc: 35459, y2022: 8189 },
  { y: 2023, dotcom: 51084, gfc: 44781, y2022: 10342 },
  { y: 2024, dotcom: 63865, gfc: 55986, y2022: 12929 },
  { y: 2025, dotcom: 75285, gfc: 65996, y2022: 15241 },
];

const SERIES = [
  { key: 'dotcom', label: 'Bought the 2000 dot-com peak', color: BURGUNDY },
  { key: 'gfc', label: 'Bought the 2007 pre-crash peak', color: BLUE },
  { key: 'y2022', label: 'Bought the 2021 peak', color: ORANGE },
] as const;

const summary = [
  { label: 'Dot-com peak (Jan 2000)', trough: 6239, final: 75285, mult: 7.53 },
  { label: 'GFC eve (Jan 2008)', trough: 6300, final: 65996, mult: 6.60 },
  { label: '2022 sell-off (Jan 2022)', trough: 8189, final: 15241, mult: 1.52 },
];

export function RegimeStressTest() {
  return (
    <ChartCard
      title="Even the worst-timed lump recovered"
      subtitle="$10,000 invested at the eve of the three nastiest drawdowns of a modern investing life, then simply held with dividends reinvested. The early years are brutal. The endings are not."
      footnote={
        <>
          Buy at the very top before the dot-com crash and you would have watched
          $10,000 fall to about $6,200, then climb to roughly $75,000 by 2025. The
          2008 buyer fared similarly. Only the most recent peak is still early in
          its story. The drawdowns are real and the recoveries are slow, but time
          in the market did the repairing. Bad timing hurt; staying out would have
          hurt more.
        </>
      }
      source="S&P 500 annual total returns, 1994-2025 (slickcharts.com). Author's backtest; values are year-end, so intra-year troughs were deeper than shown."
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
              interval={3}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtUsd}
            />
            <ReferenceLine
              y={10000}
              stroke={INK_MUTED}
              strokeDasharray="3 3"
              label={{
                value: 'Cost: $10k',
                position: 'insideTopLeft',
                style: { fontSize: 10, fill: INK_MUTED },
              }}
            />
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as (typeof data)[number];
                return (
                  <ChartTooltip title={String(label)} minWidth={230}>
                    {SERIES.map((s) => {
                      const v = row[s.key as keyof typeof row];
                      if (v == null) return null;
                      return (
                        <TooltipRow
                          key={s.key}
                          label={s.label}
                          value={fmtUsdLong(v as number)}
                          dotColor={s.color}
                        />
                      );
                    })}
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
                connectNulls={false}
                {...chartDefaults}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={SERIES.map((s) => ({ label: s.label, color: s.color, shape: 'line' }))}
      />

      <DataTable
        columns={[
          {
            header: 'Bought at',
            align: 'left',
            render: (r) => (
              <span style={{ fontWeight: 500, color: INK }}>{r.label}</span>
            ),
          },
          {
            header: 'Fell to',
            render: (r) => (
              <span style={{ color: INK_MUTED }}>{fmtUsdLong(r.trough)}</span>
            ),
            headerColor: INK_MUTED,
          },
          {
            header: 'Worth in 2025',
            render: (r) => (
              <span style={{ fontWeight: 600, color: INK }}>
                {fmtUsdLong(r.final)}
              </span>
            ),
            headerColor: INK,
          },
          {
            header: 'Multiple',
            render: (r) => (
              <span style={{ fontWeight: 600, color: BURGUNDY }}>
                {fmtMult(r.mult)}
              </span>
            ),
            headerColor: INK,
          },
        ]}
        rows={summary}
      />
    </ChartCard>
  );
}

export default RegimeStressTest;
