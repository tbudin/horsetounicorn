'use client';

import { ChartCard } from '@/components/charts/chart-card';
import { cn } from '@/lib/utils';
import { GREEN, BLUE, INK_SUBTLE } from '@/lib/chart-colors';

// One row per year (2018 at top, 2026 at the bottom). Each row is a Jan-Dec
// strip: the shaded cell is the month Ramadan fell in, the dots are the month
// "pistachio" search peaked (green = Egypt, blue = UAE). Because Ramadan is
// lunar it lands ~11 days earlier each year, so the shading and the dots march
// leftward together down the rows. UAE 2024 omitted (the craze threw its peak
// to September).
type Year = { yr: string; eg: number; uae: number | null; ram: number };
const ROWS: Year[] = [
  { yr: '2018', eg: 5, uae: 5, ram: 5 },
  { yr: '2019', eg: 5, uae: 5, ram: 5 },
  { yr: '2020', eg: 5, uae: 5, ram: 4 },
  { yr: '2021', eg: 4, uae: 5, ram: 4 },
  { yr: '2022', eg: 4, uae: 4, ram: 4 },
  { yr: '2023', eg: 3, uae: 4, ram: 3 },
  { yr: '2024', eg: 4, uae: null, ram: 3 },
  { yr: '2025', eg: 3, uae: 3, ram: 3 },
  { yr: '2026', eg: 2, uae: 2, ram: 2 },
];

const INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const FULL = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const GRID = 'grid grid-cols-[44px_repeat(12,minmax(0,1fr))] gap-px';
const Dot = ({ color }: { color: string }) => (
  <span
    className="inline-block h-2.5 w-2.5 rounded-full"
    style={{ backgroundColor: color, boxShadow: '0 0 0 1.5px #fff' }}
  />
);

export function RamadanSlide() {
  return (
    <ChartCard
      title="A pistachio season that moves: the Gulf follows Ramadan"
      subtitle="Each row is a year. The shaded cell is the month Ramadan fell in; the dots are the month “pistachio” search peaked (green = Egypt, blue = UAE). Because Ramadan is lunar, it slides about eleven days earlier every year, and the pistachio peak slides with it, marching left down the rows."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          Egypt’s pistachio peak marched from <b>May 2018</b> to <b>February 2026</b>,
          tracking Ramadan almost month for month. A holiday on a moving calendar
          gives a craving that moves too, something a fixed-December view of demand
          would completely miss.
        </p>
      }
      source="Google Trends, “pistachio”, monthly per country. Peak = the calendar month of highest interest that year. Ramadan month from the Islamic calendar. UAE 2024 omitted (the craze shifted its peak to September)."
    >
      <div className="overflow-x-auto">
        <div className="min-w-[460px]">
          {/* month-initial header */}
          <div className={cn(GRID, 'mb-1')}>
            <div />
            {INITIALS.map((m, i) => (
              <div key={i} className="text-center text-[10px] text-ink-subtle data-num">
                {m}
              </div>
            ))}
          </div>

          {ROWS.map((r) => (
            <div key={r.yr} className={cn(GRID, 'items-center py-px')}>
              <div className="pr-1 text-[11px] text-ink-muted data-num">{r.yr}</div>
              {INITIALS.map((_, i) => {
                const mo = i + 1;
                const isRam = r.ram === mo;
                const hasEg = r.eg === mo;
                const hasUae = r.uae === mo;
                const bits: string[] = [];
                if (isRam) bits.push('Ramadan');
                if (hasEg) bits.push('Egypt peak');
                if (hasUae) bits.push('UAE peak');
                return (
                  <div
                    key={i}
                    title={bits.length ? `${r.yr} ${FULL[mo]}: ${bits.join(', ')}` : undefined}
                    className="flex h-7 items-center justify-center gap-1 rounded-sm"
                    style={{ backgroundColor: isRam ? `${INK_SUBTLE}29` : undefined }}
                  >
                    {hasEg ? <Dot color={GREEN} /> : null}
                    {hasUae ? <Dot color={BLUE} /> : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: `${INK_SUBTLE}29` }} />
          Ramadan month
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Dot color={GREEN} /> Egypt pistachio peak
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Dot color={BLUE} /> UAE pistachio peak
        </span>
      </div>
    </ChartCard>
  );
}

export default RamadanSlide;
