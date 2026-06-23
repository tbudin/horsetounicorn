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
import { DataTable } from '@/components/article/data-table';
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

// $100,000 in the S&P 500 for 20 years, held by a Singapore-resident investor.
// Same index, two wrappers: US-listed SPY versus Ireland-domiciled CSPX.
// Gross 7%/yr total return, of which 1.5% is dividends exposed to US
// withholding tax (30% for US-domiciled funds, 15% via the Ireland-US treaty),
// plus each fund's expense ratio.
const data = [
  { y: 0, spy: 100000, cspx: 100000 }, { y: 1, spy: 106455, cspx: 106705 },
  { y: 2, spy: 113328, cspx: 113860 }, { y: 3, spy: 120644, cspx: 121494 },
  { y: 4, spy: 128432, cspx: 129640 }, { y: 5, spy: 136723, cspx: 138332 },
  { y: 6, spy: 145549, cspx: 147608 }, { y: 7, spy: 154945, cspx: 157505 },
  { y: 8, spy: 164947, cspx: 168065 }, { y: 9, spy: 175595, cspx: 179334 },
  { y: 10, spy: 186931, cspx: 191358 }, { y: 11, spy: 198998, cspx: 204189 },
  { y: 12, spy: 211845, cspx: 217880 }, { y: 13, spy: 225520, cspx: 232489 },
  { y: 14, spy: 240079, cspx: 248077 }, { y: 15, spy: 255577, cspx: 264711 },
  { y: 16, spy: 272076, cspx: 282460 }, { y: 17, spy: 289639, cspx: 301399 },
  { y: 18, spy: 308337, cspx: 321607 }, { y: 19, spy: 328242, cspx: 343171 },
  { y: 20, spy: 349432, cspx: 366181 },
];

const SERIES = [
  { key: 'cspx', label: 'CSPX — Ireland-domiciled', color: BURGUNDY },
  { key: 'spy', label: 'SPY — US-domiciled', color: BLUE },
] as const;

const layers = [
  {
    fund: 'SPY (US-domiciled)',
    wht: '0.45%',
    ter: '0.09%',
    net: '6.46%',
    fv: 349432,
    accent: BLUE,
  },
  {
    fund: 'CSPX (Ireland-domiciled)',
    wht: '0.23%',
    ter: '0.07%',
    net: '6.71%',
    fv: 366181,
    accent: BURGUNDY,
  },
];

export function SingaporeCostLayers() {
  return (
    <ChartCard
      title="The same index, $16,700 apart"
      subtitle="$100,000 in the S&P 500 for twenty years, held from Singapore. Same index, same gross 7% a year. The only difference is the fund's home country, and the dividend withholding tax that comes with it."
      footnote={
        <>
          As a Singapore resident I have no tax treaty with the US, so a US-listed
          fund like SPY loses 30% of its dividends to withholding. An
          Ireland-domiciled fund holding the same stocks loses only 15%, thanks to
          the Ireland-US treaty. That quiet edge, about a quarter-point a year,
          mostly tax with a little fee, compounds into about $16,700 over twenty
          years. Domicile is a cost layer most people never see.
        </>
      }
      source="Assumes 7% gross annual return, 1.5% dividend yield, US withholding of 30% (US-domiciled) vs 15% (Ireland-domiciled, via the Ireland-US treaty), and expense ratios of 0.0945% (SPY) and 0.07% (CSPX). Withholding rates and domicile mechanics per Endowus and StashAway Singapore."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 18, left: 8 }}>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis
              dataKey="y"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
              tickFormatter={(v) => `${v}y`}
              label={{
                value: 'Years held',
                position: 'insideBottom',
                offset: -8,
                style: { fontSize: 11, fill: INK_MUTED },
              }}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtUsd}
              domain={[100000, 'auto']}
            />
            <Tooltip
              cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as (typeof data)[number];
                return (
                  <ChartTooltip title={`Year ${label}`} minWidth={230}>
                    {SERIES.map((s) => (
                      <TooltipRow
                        key={s.key}
                        label={s.label}
                        value={fmtUsdLong(row[s.key])}
                        dotColor={s.color}
                      />
                    ))}
                    <TooltipRow
                      label="Irish edge"
                      value={fmtUsdLong(row.cspx - row.spy)}
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

      <DataTable
        columns={[
          {
            header: 'Fund',
            align: 'left',
            render: (r) => (
              <span style={{ fontWeight: 500, color: INK }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    background: r.accent,
                    marginRight: 8,
                    verticalAlign: 'middle',
                    borderRadius: '50%',
                  }}
                />
                {r.fund}
              </span>
            ),
          },
          {
            header: 'Dividend tax drag',
            render: (r) => <span style={{ color: INK_MUTED }}>{r.wht}</span>,
            headerColor: INK_MUTED,
          },
          {
            header: 'Fee',
            render: (r) => <span style={{ color: INK_MUTED }}>{r.ter}</span>,
            headerColor: INK_MUTED,
          },
          {
            header: 'Net return',
            render: (r) => (
              <span style={{ fontWeight: 600, color: r.accent }}>{r.net}</span>
            ),
            headerColor: INK,
          },
          {
            header: 'After 20 years',
            render: (r) => (
              <span style={{ fontWeight: 600, color: INK }}>
                {fmtUsdLong(r.fv)}
              </span>
            ),
            headerColor: INK,
          },
        ]}
        rows={layers}
      />
    </ChartCard>
  );
}

export default SingaporeCostLayers;
