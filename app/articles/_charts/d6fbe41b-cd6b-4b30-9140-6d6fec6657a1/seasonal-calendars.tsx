'use client';

import { ChartCard } from '@/components/charts/chart-card';
import { cn } from '@/lib/utils';
import { BURGUNDY, GREEN, ORANGE, BLUE, INK, INK_MUTED } from '@/lib/chart-colors';

// Month-of-year seasonal index for "pistachio" search interest, averaged over
// 2010-2023 (before the craze distorted things), 100 = each country's own
// annual average. Four countries, four different peak months. Shown as a
// heatmap: each row shaded to its own range, the peak month outlined.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Row = { key: string; label: string; note: string; color: string; vals: number[] };
const ROWS: Row[] = [
  { key: 'us', label: 'United States', note: 'December (Christmas)', color: BURGUNDY, vals: [107, 103, 112, 100, 94, 96, 93, 87, 82, 86, 111, 128] },
  { key: 'eg', label: 'Egypt', note: 'spring (Ramadan)', color: GREEN, vals: [83, 83, 108, 125, 122, 105, 101, 96, 98, 92, 94, 92] },
  { key: 'ir', label: 'Iran', note: 'September (the harvest)', color: ORANGE, vals: [87, 94, 116, 100, 89, 77, 73, 98, 145, 127, 97, 97] },
  { key: 'in', label: 'India', note: 'November (Diwali)', color: BLUE, vals: [100, 91, 92, 90, 94, 96, 96, 99, 97, 109, 129, 108] },
];

// Per-row min/max → opacity ramp, so each country reads against its own range.
const alphaHex = (t: number) =>
  Math.round((0.1 + 0.82 * t) * 255)
    .toString(16)
    .padStart(2, '0');

const GRID = 'grid grid-cols-[104px_repeat(12,minmax(0,1fr))] gap-px';

export function SeasonalCalendars() {
  return (
    <ChartCard
      title="The world keeps four pistachio calendars"
      subtitle="Average search interest in “pistachio” by month of the year (2010–2023, before the craze), each country indexed to its own annual average. Four countries, four completely different peaks."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          The West peaks at <b>Christmas</b>, the Gulf and North Africa around
          <b> Ramadan</b>, India at <b>Diwali</b>, and Iran, the grower, every
          <b> September</b>, when the trees are harvested. There is no single
          season for a nut.
        </p>
      }
      source="Google Trends, “pistachio”, monthly per country, 2010–2023 averaged by calendar month (100 = each country’s mean). Each row is shaded against its own range and the peak month is outlined. Ramadan is a lunar month, so Egypt’s spring bump is its 2010–2023 average position; see the next chart for the slide."
    >
      <div className="overflow-x-auto">
        <div className="min-w-[440px]">
          {/* month header */}
          <div className={GRID}>
            <div />
            {MONTHS.map((m) => (
              <div key={m} className="pb-1 text-center text-[10px] text-ink-subtle data-num">
                {m[0]}
              </div>
            ))}
          </div>

          {ROWS.map((r) => {
            const max = Math.max(...r.vals);
            const min = Math.min(...r.vals);
            return (
              <div key={r.key} className={cn(GRID, 'py-px')}>
                <div className="flex flex-col justify-center pr-2">
                  <span className="text-xs font-medium leading-tight text-ink-heading">{r.label}</span>
                  <span className="text-[10px] leading-tight text-ink-subtle">{r.note}</span>
                </div>
                {r.vals.map((v, i) => {
                  const t = (v - min) / (max - min || 1);
                  const peak = v === max;
                  return (
                    <div
                      key={i}
                      title={`${r.label}, ${MONTHS[i]}: ${v}`}
                      className="flex h-9 items-center justify-center text-[10px] data-num"
                      style={{
                        backgroundColor: `${r.color}${alphaHex(t)}`,
                        color: t > 0.55 ? '#ffffff' : INK_MUTED,
                        outline: peak ? `2px solid ${INK}` : undefined,
                        outlineOffset: '-2px',
                      }}
                    >
                      {v}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-subtle">
        Darker = higher search interest that month (each country scaled to its own
        range). The outlined cell is each country’s peak month.
      </p>
    </ChartCard>
  );
}

export default SeasonalCalendars;
