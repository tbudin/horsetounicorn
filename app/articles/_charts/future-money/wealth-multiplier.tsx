'use client';

import { useState, useMemo } from 'react';
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
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import { ChartLegend } from '@/components/charts/chart-legend';
import { DataTable } from '@/components/article/data-table';
import {
  BURGUNDY,
  BURGUNDY_MID,
  BURGUNDY_FADED,
  INK,
  INK_MUTED,
  INK_SUBTLE,
  CARD_BG,
  CHART_GRID,
  axisTickStyle,
} from '@/lib/chart-colors';
import { fmtUsd, fmtUsdLong, fmtMult } from '@/lib/format';

// Local style shim so the JSX below can keep using `colors.X` / `fonts.X` /
// `tickStyle` like the original blog-starter version. Maps to the main
// repo's brand tokens.
const colors = {
  ink: INK,
  muted: INK_MUTED,
  subtle: INK_SUBTLE,
  grid: CHART_GRID,
  bg: CARD_BG,
  primary: BURGUNDY,
  primaryMid: BURGUNDY_MID,
  primaryFaded: BURGUNDY_FADED,
} as const;
const fonts = {
  display: 'var(--font-roboto-serif), Georgia, serif',
  body: 'var(--font-roboto), sans-serif',
} as const;
const tickStyle = axisTickStyle;

// Cohort series colours: darkest = youngest starter, faded = latest starter.
const COHORT_COLORS: Record<number, string> = {
  26: BURGUNDY,
  36: BURGUNDY_MID,
  46: '#C966A8',
  56: '#D67BB6',
  66: BURGUNDY_FADED,
};

const COHORTS = [26, 36, 46, 56, 66] as const;
const END_AGE = 76;

/** Future value of monthly contributions, compounded monthly. */
function projectTrajectory(
  startAge: number,
  monthlyContrib: number,
  annualRate: number,
  endAge = END_AGE
) {
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  const points: { age: number; balance: number }[] = [];
  let balance = 0;
  const months = (endAge - startAge) * 12;
  for (let m = 0; m <= months; m++) {
    const age = startAge + m / 12;
    if (m % 12 === 0) points.push({ age, balance: Math.round(balance) });
    balance += monthlyContrib;
    balance *= 1 + monthlyRate;
  }
  return points;
}

/** Build chart-ready array, one row per age year, columns for each cohort. */
function buildChartData(monthlyContrib: number, annualRate: number) {
  const ages = Array.from({ length: END_AGE - 26 + 1 }, (_, i) => 26 + i);
  const data: Record<string, number>[] = ages.map((age) => ({ age }));
  COHORTS.forEach((start) => {
    const traj = projectTrajectory(start, monthlyContrib, annualRate);
    traj.forEach((p) => {
      const idx = ages.indexOf(p.age);
      if (idx >= 0) data[idx][`start${start}`] = p.balance;
    });
  });
  return data;
}

export default function WealthMultiplierChart() {
  const [monthlyContrib, setMonthlyContrib] = useState(100);
  const [annualRate, setAnnualRate] = useState(0.07);

  const chartData = useMemo(
    () => buildChartData(monthlyContrib, annualRate),
    [monthlyContrib, annualRate]
  );

  const startData = COHORTS.map((start) => {
    const trajTo76 = projectTrajectory(start, monthlyContrib, annualRate);
    const finalAt76 = trajTo76[trajTo76.length - 1]?.balance || 0;
    const invested = monthlyContrib * 12 * (END_AGE - start);
    const at66 =
      start <= 66
        ? projectTrajectory(start, monthlyContrib, annualRate, 66).slice(-1)[0]
            ?.balance
        : null;
    return {
      startAge: start,
      invested,
      valueAt66: at66,
      valueAt76: finalAt76,
      multiplier: finalAt76 / invested,
    };
  });

  return (
    <ChartCard
      title="The cost of waiting"
      subtitle="Money today isn't worth what it looks like. It's a placeholder for what it could become. Below, five hypothetical investors contribute the same monthly amount until age 76. The only thing that changes is when they start."
      source="A 7% real (inflation-adjusted) return is a reasonable estimate for long-run broad-market equities. The shape of the curves is the point, not the exact dollar values."
    >
      {/* "Future money" strip at the top */}
      <div
        style={{
          marginBottom: 24,
          padding: '20px 22px',
          background: colors.bg,
          border: `1px solid ${colors.grid}`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: colors.muted,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 14,
          }}
        >
          $10 today, invested at{' '}
          <b style={{ color: colors.ink }}>{(annualRate * 100).toFixed(1)}%</b>{' '}
          per year, becomes:
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {[10, 20, 30, 40, 50].map((years) => {
            const value = 10 * Math.pow(1 + annualRate, years);
            return (
              <div
                key={years}
                style={{ flex: '1 1 auto', minWidth: 90, textAlign: 'center' }}
              >
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 26,
                    color: colors.primary,
                    fontWeight: 400,
                    lineHeight: 1.1,
                    letterSpacing: '0.005em',
                  }}
                >
                  ${value.toFixed(value < 100 ? 2 : 0)}
                </div>
                <div
                  style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}
                >
                  in {years} years
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: colors.muted,
            marginTop: 14,
            lineHeight: 1.5,
            paddingTop: 12,
            borderTop: `1px solid ${colors.grid}`,
          }}
        >
          That $10 lunch isn't really $10. It's whatever it could have become
          if you'd invested it instead. Adjust the return slider below to see
          how the numbers shift.
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: 32,
          marginBottom: 24,
          padding: '16px 18px',
          background: colors.bg,
          border: `1px solid ${colors.grid}`,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            minWidth: 220,
          }}
        >
          <label
            style={{
              fontSize: 11,
              color: colors.muted,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Monthly contribution:{' '}
            <b style={{ color: colors.ink }}>${monthlyContrib}</b>
          </label>
          <input
            type="range"
            min={50}
            max={1000}
            step={50}
            value={monthlyContrib}
            onChange={(e) => setMonthlyContrib(Number(e.target.value))}
            style={{ accentColor: colors.primary }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: colors.subtle,
            }}
          >
            <span>$50</span>
            <span>$1,000</span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            minWidth: 220,
          }}
        >
          <label
            style={{
              fontSize: 11,
              color: colors.muted,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Expected annual return:{' '}
            <b style={{ color: colors.ink }}>
              {(annualRate * 100).toFixed(1)}%
            </b>
          </label>
          <input
            type="range"
            min={3}
            max={12}
            step={0.5}
            value={annualRate * 100}
            onChange={(e) => setAnnualRate(Number(e.target.value) / 100)}
            style={{ accentColor: colors.primary }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: colors.subtle,
            }}
          >
            <span>3% (cash)</span>
            <span>7% (real)</span>
            <span>10% (nominal)</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 24, left: 4, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="2 4"
              stroke={colors.grid}
              vertical={false}
            />
            <XAxis
              dataKey="age"
              type="number"
              domain={[26, 76]}
              ticks={[26, 36, 46, 56, 66, 76]}
              tick={tickStyle}
              axisLine={{ stroke: colors.grid }}
              tickLine={false}
              label={{
                value: 'Age',
                position: 'insideBottom',
                offset: -2,
                style: { fontSize: 11, fill: colors.muted },
              }}
            />
            <YAxis
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
              tickFormatter={fmtUsd}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const sorted = [...payload].sort(
                  (a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)
                );
                return (
                  <ChartTooltip title={`Age ${label}`}>
                    {sorted.map((p, i) => {
                      const startAge = parseInt(
                        String(p.dataKey).replace('start', '')
                      );
                      return (
                        <TooltipRow
                          key={i}
                          label={`Started at ${startAge}`}
                          value={fmtUsdLong(p.value as number)}
                          dotColor={p.color}
                          color={p.color}
                        />
                      );
                    })}
                  </ChartTooltip>
                );
              }}
            />
            <ReferenceLine
              x={66}
              stroke={colors.subtle}
              strokeDasharray="3 3"
              label={{
                value: 'Age 66',
                position: 'top',
                style: {
                  fontSize: 10,
                  fill: colors.muted,
                  fontFamily: fonts.body,
                },
              }}
            />
            {COHORTS.map((start) => (
              <Line
                key={start}
                type="monotone"
                dataKey={`start${start}`}
                stroke={COHORT_COLORS[start]}
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartLegend
        items={COHORTS.map((start) => ({
          label: `Start at ${start}`,
          color: COHORT_COLORS[start],
          shape: 'line',
        }))}
      />

      {/* Summary table */}
      <DataTable
        columns={[
          {
            header: 'Started at',
            align: 'left',
            render: (s) => (
              <span style={{ fontWeight: 500, color: colors.ink }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    background: COHORT_COLORS[s.startAge],
                    marginRight: 8,
                    verticalAlign: 'middle',
                    borderRadius: '50%',
                  }}
                />
                Age {s.startAge}
              </span>
            ),
          },
          {
            header: 'Total invested',
            render: (s) => (
              <span style={{ color: colors.muted }}>
                ${s.invested.toLocaleString()}
              </span>
            ),
            headerColor: colors.muted,
          },
          {
            header: 'At 66',
            render: (s) => (
              <span style={{ color: colors.muted }}>
                {s.valueAt66 != null ? fmtUsdLong(s.valueAt66) : '—'}
              </span>
            ),
            headerColor: colors.muted,
          },
          {
            header: 'At 76',
            render: (s) => (
              <span style={{ fontWeight: 600, color: colors.ink }}>
                {fmtUsdLong(s.valueAt76)}
              </span>
            ),
            headerColor: colors.ink,
          },
          {
            header: 'Multiplier',
            render: (s) => (
              <span
                style={{ fontWeight: 600, color: COHORT_COLORS[s.startAge] }}
              >
                {fmtMult(s.multiplier)}
              </span>
            ),
            headerColor: colors.ink,
          },
        ]}
        rows={startData}
      />
    </ChartCard>
  );
}
