'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BURGUNDY,
  BURGUNDY_LIGHT,
  INK,
  axisTickStyle,
  chartDefaults,
  gridProps,
} from '@/lib/chart-colors';

export interface BarDatum {
  label: string;
  value: number;
  /** Optional secondary series, plotted next to `value` */
  value2?: number;
}

export interface ExampleBarChartProps {
  data: BarDatum[];
  /** Label for the primary series — defaults to "Value" */
  seriesLabel?: string;
  /** Label for the secondary series — set to enable a second bar */
  series2Label?: string;
  yLabel?: string;
}

export function ExampleBarChart({
  data,
  seriesLabel = 'Value',
  series2Label,
  yLabel,
}: ExampleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid {...gridProps} vertical={false} />
        <XAxis dataKey="label" tick={axisTickStyle} axisLine={{ stroke: INK }} tickLine={false} />
        <YAxis
          tick={axisTickStyle}
          axisLine={{ stroke: INK }}
          tickLine={false}
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: INK } }
              : undefined
          }
        />
        <Tooltip
          cursor={{ fill: BURGUNDY, fillOpacity: 0.06 }}
          contentStyle={{
            fontFamily: 'var(--font-roboto), sans-serif',
            fontSize: 12,
            borderRadius: 6,
            border: `1px solid ${INK}`,
          }}
          labelStyle={{ color: INK, fontWeight: 500 }}
        />
        <Bar dataKey="value" fill={BURGUNDY} name={seriesLabel} {...chartDefaults} />
        {series2Label ? (
          <Bar dataKey="value2" fill={BURGUNDY_LIGHT} name={series2Label} {...chartDefaults} />
        ) : null}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
