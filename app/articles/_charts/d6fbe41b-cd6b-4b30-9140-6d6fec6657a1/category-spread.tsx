'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartTooltip, TooltipRow } from '@/components/charts/chart-tooltip';
import {
  BURGUNDY,
  BLUE,
  GREEN,
  ORANGE,
  INK_SUBTLE,
} from '@/lib/chart-colors';

// Google Trends, "pistachio" within four Google product categories, plus the
// query "pistachio price", worldwide, monthly. Each series is self-indexed to
// its OWN peak (=100), so this compares timing and shape, not size. The dashed
// line marks Dec 2023, when "Dubai chocolate" went viral.
const data = [
  { m: '2020-01', baked: 24, bev: 8, supp: 29, frag: 5, price: 5 },
  { m: '2020-02', baked: 23, bev: 10, supp: 25, frag: 5, price: 5 },
  { m: '2020-03', baked: 24, bev: 8, supp: 27, frag: 3, price: 4 },
  { m: '2020-04', baked: 32, bev: 7, supp: 24, frag: 4, price: 4 },
  { m: '2020-05', baked: 35, bev: 9, supp: 28, frag: 6, price: 5 },
  { m: '2020-06', baked: 27, bev: 9, supp: 27, frag: 6, price: 5 },
  { m: '2020-07', baked: 25, bev: 10, supp: 27, frag: 5, price: 6 },
  { m: '2020-08', baked: 23, bev: 9, supp: 33, frag: 5, price: 6 },
  { m: '2020-09', baked: 24, bev: 9, supp: 37, frag: 7, price: 6 },
  { m: '2020-10', baked: 26, bev: 9, supp: 37, frag: 5, price: 6 },
  { m: '2020-11', baked: 35, bev: 15, supp: 32, frag: 9, price: 7 },
  { m: '2020-12', baked: 51, bev: 13, supp: 32, frag: 6, price: 7 },
  { m: '2021-01', baked: 32, bev: 88, supp: 38, frag: 4, price: 6 },
  { m: '2021-02', baked: 31, bev: 43, supp: 30, frag: 5, price: 6 },
  { m: '2021-03', baked: 38, bev: 24, supp: 36, frag: 5, price: 5 },
  { m: '2021-04', baked: 32, bev: 15, supp: 33, frag: 5, price: 5 },
  { m: '2021-05', baked: 30, bev: 13, supp: 31, frag: 5, price: 5 },
  { m: '2021-06', baked: 24, bev: 13, supp: 29, frag: 3, price: 6 },
  { m: '2021-07', baked: 25, bev: 12, supp: 29, frag: 5, price: 5 },
  { m: '2021-08', baked: 24, bev: 13, supp: 34, frag: 5, price: 5 },
  { m: '2021-09', baked: 24, bev: 18, supp: 36, frag: 6, price: 5 },
  { m: '2021-10', baked: 26, bev: 51, supp: 35, frag: 5, price: 5 },
  { m: '2021-11', baked: 33, bev: 24, supp: 35, frag: 6, price: 6 },
  { m: '2021-12', baked: 45, bev: 15, supp: 30, frag: 10, price: 6 },
  { m: '2022-01', baked: 28, bev: 63, supp: 40, frag: 7, price: 6 },
  { m: '2022-02', baked: 29, bev: 43, supp: 46, frag: 6, price: 6 },
  { m: '2022-03', baked: 30, bev: 25, supp: 42, frag: 8, price: 6 },
  { m: '2022-04', baked: 37, bev: 18, supp: 37, frag: 8, price: 7 },
  { m: '2022-05', baked: 26, bev: 15, supp: 34, frag: 7, price: 6 },
  { m: '2022-06', baked: 25, bev: 14, supp: 35, frag: 5, price: 5 },
  { m: '2022-07', baked: 28, bev: 14, supp: 33, frag: 6, price: 6 },
  { m: '2022-08', baked: 25, bev: 14, supp: 39, frag: 7, price: 6 },
  { m: '2022-09', baked: 25, bev: 12, supp: 38, frag: 7, price: 6 },
  { m: '2022-10', baked: 27, bev: 17, supp: 42, frag: 7, price: 7 },
  { m: '2022-11', baked: 31, bev: 16, supp: 37, frag: 7, price: 6 },
  { m: '2022-12', baked: 46, bev: 14, supp: 39, frag: 8, price: 7 },
  { m: '2023-01', baked: 29, bev: 62, supp: 43, frag: 9, price: 7 },
  { m: '2023-02', baked: 29, bev: 58, supp: 42, frag: 12, price: 8 },
  { m: '2023-03', baked: 39, bev: 41, supp: 46, frag: 32, price: 7 },
  { m: '2023-04', baked: 42, bev: 25, supp: 48, frag: 30, price: 7 },
  { m: '2023-05', baked: 30, bev: 19, supp: 40, frag: 26, price: 6 },
  { m: '2023-06', baked: 29, bev: 19, supp: 46, frag: 28, price: 7 },
  { m: '2023-07', baked: 29, bev: 15, supp: 47, frag: 28, price: 6 },
  { m: '2023-08', baked: 31, bev: 16, supp: 51, frag: 23, price: 7 },
  { m: '2023-09', baked: 32, bev: 17, supp: 60, frag: 25, price: 7 },
  { m: '2023-10', baked: 31, bev: 17, supp: 53, frag: 25, price: 7 },
  { m: '2023-11', baked: 45, bev: 44, supp: 53, frag: 38, price: 9 },
  { m: '2023-12', baked: 67, bev: 71, supp: 50, frag: 52, price: 9 },
  { m: '2024-01', baked: 38, bev: 62, supp: 65, frag: 49, price: 8 },
  { m: '2024-02', baked: 42, bev: 42, supp: 59, frag: 51, price: 8 },
  { m: '2024-03', baked: 62, bev: 36, supp: 58, frag: 46, price: 8 },
  { m: '2024-04', baked: 46, bev: 35, supp: 62, frag: 52, price: 8 },
  { m: '2024-05', baked: 51, bev: 30, supp: 64, frag: 52, price: 8 },
  { m: '2024-06', baked: 54, bev: 26, supp: 55, frag: 62, price: 9 },
  { m: '2024-07', baked: 56, bev: 29, supp: 68, frag: 58, price: 10 },
  { m: '2024-08', baked: 54, bev: 29, supp: 66, frag: 58, price: 11 },
  { m: '2024-09', baked: 52, bev: 26, supp: 81, frag: 56, price: 10 },
  { m: '2024-10', baked: 58, bev: 24, supp: 72, frag: 67, price: 11 },
  { m: '2024-11', baked: 74, bev: 29, supp: 82, frag: 73, price: 14 },
  { m: '2024-12', baked: 100, bev: 28, supp: 80, frag: 79, price: 15 },
  { m: '2025-01', baked: 63, bev: 96, supp: 100, frag: 66, price: 15 },
  { m: '2025-02', baked: 73, bev: 74, supp: 90, frag: 64, price: 26 },
  { m: '2025-03', baked: 85, bev: 62, supp: 86, frag: 78, price: 23 },
  { m: '2025-04', baked: 80, bev: 51, supp: 88, frag: 80, price: 22 },
  { m: '2025-05', baked: 60, bev: 49, supp: 81, frag: 91, price: 20 },
  { m: '2025-06', baked: 54, bev: 45, supp: 76, frag: 89, price: 18 },
  { m: '2025-07', baked: 55, bev: 44, supp: 82, frag: 86, price: 31 },
  { m: '2025-08', baked: 57, bev: 40, supp: 76, frag: 96, price: 100 },
  { m: '2025-09', baked: 48, bev: 37, supp: 73, frag: 83, price: 75 },
  { m: '2025-10', baked: 53, bev: 33, supp: 76, frag: 85, price: 67 },
  { m: '2025-11', baked: 62, bev: 36, supp: 74, frag: 94, price: 72 },
  { m: '2025-12', baked: 85, bev: 42, supp: 66, frag: 100, price: 68 },
  { m: '2026-01', baked: 54, bev: 100, supp: 74, frag: 72, price: 58 },
  { m: '2026-02', baked: 56, bev: 81, supp: 71, frag: 75, price: 68 },
  { m: '2026-03', baked: 59, bev: 63, supp: 76, frag: 84, price: 66 },
  { m: '2026-04', baked: 49, bev: 51, supp: 71, frag: 83, price: 59 },
  { m: '2026-05', baked: 44, bev: 49, supp: 74, frag: 80, price: 59 },
];

const ROWS: { key: string; aisle: string; what: string; where: string; color: string }[] = [
  { key: 'baked', aisle: 'The kitchen', what: 'baked goods', where: 'biggest in Italy & the Levant', color: GREEN },
  { key: 'bev', aisle: 'The café', what: 'lattes & drinks', where: 'the Gulf, Korea, the US', color: BLUE },
  { key: 'supp', aisle: 'The medicine cabinet', what: 'supplements & protein', where: 'Iran & the Levant', color: ORANGE },
  { key: 'frag', aisle: 'The perfume counter', what: 'fragrance', where: 'the UAE (Kayali), still climbing', color: BURGUNDY },
  { key: 'price', aisle: 'The wallet', what: '“pistachio price”', where: 'South Asia & the Gulf, spiked Aug 2025', color: INK_SUBTLE },
];

const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtMonth = (m: string) => { const [y, mo] = m.split('-'); return `${MN[+mo]} ${y.slice(2)}`; };

function MiniArea({ k, color, name }: { k: string; color: string; name: string }) {
  const gid = `cat-${k}`;
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <XAxis dataKey="m" hide />
        <YAxis hide domain={[0, 100]} />
        <Tooltip
          cursor={{ stroke: color, strokeOpacity: 0.45, strokeWidth: 1 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <ChartTooltip title={fmtMonth(String(label))}>
                <TooltipRow label={name} value={`${payload[0].value} / 100`} dotColor={color} />
              </ChartTooltip>
            );
          }}
        />
        <ReferenceLine x="2023-12" stroke={INK_SUBTLE} strokeDasharray="2 3" strokeOpacity={0.6} />
        <Area type="monotone" dataKey={k} stroke={color} strokeWidth={1.75} fill={`url(#${gid})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategorySpread() {
  return (
    <ChartCard
      title="How a nut colonised five aisles"
      subtitle="Search interest in “pistachio” inside four Google product categories, plus searches for its price, each indexed to its own peak, 2020 to 2026. The dashed line is Dec 2023, when Dubai chocolate went viral. The craving spread outward from the kitchen, ring by ring."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          Kitchen, then café, then the medicine cabinet, then the perfume counter,
          and finally the wallet. The <b>fragrance</b> wave is the newest and the
          only one still climbing; the <b>price</b> wave spiked in Aug 2025, the
          moment shoppers felt the shortage.
        </p>
      }
      source="Google Trends, worldwide, monthly. Categories: Baked Goods, Non-Alcoholic Beverages, Vitamins & Supplements, Perfumes & Fragrances; plus the query “pistachio price”. Each row self-indexed to its own peak (=100), so heights are not comparable across rows. June 2026 excluded."
      maxWidth={null}
    >
      <div className="flex flex-col gap-1">
        {ROWS.map((r) => (
          <div key={r.key} className="flex items-center gap-3 border-t border-[#EEE6EC] pt-1.5 first:border-t-0">
            <div className="w-[150px] shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: r.color }} />
                <span className="font-serif text-sm font-medium text-ink-heading">{r.aisle}</span>
              </div>
              <div className="pl-4 text-[11px] leading-tight text-ink-muted">{r.what}</div>
              <div className="pl-4 text-[10px] leading-tight text-ink-subtle">{r.where}</div>
            </div>
            <div className="min-w-0 flex-1">
              <MiniArea k={r.key} color={r.color} name={r.what} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between pl-[162px] pr-1 text-[10px] text-ink-subtle data-num">
        <span>2020</span><span>2022</span><span>2024</span><span>2026</span>
      </div>
    </ChartCard>
  );
}

export default CategorySpread;
