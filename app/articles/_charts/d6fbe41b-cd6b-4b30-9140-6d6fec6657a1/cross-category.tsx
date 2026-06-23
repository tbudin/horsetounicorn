'use client';

import {
  BarChart,
  Bar,
  Cell,
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
  GREEN,
  INK,
  axisTickStyle,
  gridProps,
  chartDefaults,
} from '@/lib/chart-colors';

// Where "pistachio" shows up on Reddit. Top subreddits among ~2,000 posts
// returned by broad pistachio-related searches (pistachio, dubai chocolate,
// knafeh, pistachio supply, etc.). Counts show the BREADTH of the
// conversation (where it lives), not volume over time.
type Cat = 'food' | 'beauty';
const data: { sub: string; n: number; cat: Cat }[] = [
  { sub: 'r/Baking', n: 55, cat: 'food' },
  { sub: 'r/fragranceswap', n: 40, cat: 'beauty' },
  { sub: 'r/Indiemakeupandmore', n: 35, cat: 'beauty' },
  { sub: 'r/starbucks', n: 33, cat: 'food' },
  { sub: 'r/food', n: 32, cat: 'food' },
  { sub: 'r/makeupexchange', n: 24, cat: 'beauty' },
  { sub: 'r/CrumblCookies', n: 23, cat: 'food' },
  { sub: 'r/Costco', n: 21, cat: 'food' },
  { sub: 'r/FoodPorn', n: 20, cat: 'food' },
  { sub: 'r/icecream', n: 19, cat: 'food' },
];

const COLOR: Record<Cat, string> = { food: GREEN, beauty: BURGUNDY };

export function CrossCategory() {
  return (
    <ChartCard
      title="Pistachio stopped being a flavour and became a vibe"
      subtitle="Top subreddits where “pistachio” comes up. It is no longer just a food conversation: three of the ten busiest communities are fragrance and makeup, not baking."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          When a taste escapes the kitchen and starts showing up in
          <b> perfume swaps and makeup threads</b>, it has stopped being a
          flavour of the month and become an aesthetic, the surest sign a trend
          has real legs.
        </p>
      }
      source="Reddit search export, ~2,000 posts from broad pistachio-related queries (2007–2026), grouped by subreddit. Counts indicate where the conversation lives, not volume over time."
    >
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 20, bottom: 4, left: 8 }}
          >
            <CartesianGrid {...gridProps} horizontal={false} />
            <XAxis
              type="number"
              tick={axisTickStyle}
              axisLine={{ stroke: INK }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="sub"
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              width={140}
            />
            <Tooltip
              cursor={{ fill: BURGUNDY, fillOpacity: 0.06 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as { sub: string; n: number; cat: Cat };
                return (
                  <ChartTooltip title={d.sub}>
                    <TooltipRow
                      label={d.cat === 'beauty' ? 'Beauty / fragrance' : 'Food / drink'}
                      value={`${d.n} posts`}
                      dotColor={COLOR[d.cat]}
                    />
                  </ChartTooltip>
                );
              }}
            />
            <Bar dataKey="n" maxBarSize={22} {...chartDefaults}>
              {data.map((d) => (
                <Cell key={d.sub} fill={COLOR[d.cat]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <ChartLegend
        items={[
          { label: 'Food & drink', color: GREEN, shape: 'square' },
          { label: 'Beauty & fragrance', color: BURGUNDY, shape: 'square' },
        ]}
      />
    </ChartCard>
  );
}

export default CrossCategory;
