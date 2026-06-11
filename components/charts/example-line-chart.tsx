'use client';

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BURGUNDY,
  BURGUNDY_LIGHT,
  INK,
  ORANGE,
  axisTickStyle,
  chartDefaults,
  gridProps,
} from '@/lib/chart-colors';

export interface LineDatum {
  x: string | number;
  a: number;
  b?: number;
  c?: number;
}

export interface ExampleLineChartProps {
  data: LineDatum[];
  series: Array<{ key: 'a' | 'b' | 'c'; label: string; color?: string }>;
  xLabel?: string;
  yLabel?: string;
}

const fallbackColors = [BURGUNDY, BURGUNDY_LIGHT, ORANGE];

export function ExampleLineChart({ data, series, xLabel, yLabel }: ExampleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="x"
          tick={axisTickStyle}
          axisLine={{ stroke: INK }}
          tickLine={false}
          label={
            xLabel
              ? { value: xLabel, position: 'insideBottom', offset: -4, style: { fontSize: 12, fill: INK } }
              : undefined
          }
        />
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
          cursor={{ stroke: BURGUNDY, strokeOpacity: 0.2 }}
          contentStyle={{
            fontFamily: 'var(--font-roboto), sans-serif',
            fontSize: 12,
            borderRadius: 6,
            border: `1px solid ${INK}`,
          }}
        />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stroke={s.color ?? fallbackColors[i % fallbackColors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            name={s.label}
            {...chartDefaults}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
