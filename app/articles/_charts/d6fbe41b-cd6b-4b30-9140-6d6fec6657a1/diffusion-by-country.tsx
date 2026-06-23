'use client';

import {
  AreaChart,
  Area,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import { ChartCard } from '@/components/charts/chart-card';
import { BURGUNDY, GREEN, BLUE } from '@/lib/chart-colors';

// Google Trends, "Dubai chocolate" by country, weekly interest resampled to
// monthly means, Jan 2024 to May 2026. Each country is indexed 0-100 against
// its OWN peak, so the curves show SHAPE, not relative size. Countries are
// ordered by when each first crossed 25 (the contagion order). June 2026
// excluded (incomplete).
const data = [
  { m: '2024-01', de: 0, uae: 0, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-02', de: 0, uae: 0, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-03', de: 0, uae: 0, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-04', de: 0, uae: 0, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-05', de: 0, uae: 0, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-06', de: 0, uae: 0, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-07', de: 0, uae: 0, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-08', de: 0, uae: 0, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-09', de: 0, uae: 0, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-10', de: 12, uae: 2, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 0 },
  { m: '2024-11', de: 74, uae: 6, sg: 0, us: 0, uk: 0, au: 0, jp: 0, fr: 1 },
  { m: '2024-12', de: 53, uae: 38, sg: 15, us: 9, uk: 14, au: 10, jp: 11, fr: 8 },
  { m: '2025-01', de: 14, uae: 61, sg: 42, us: 28, uk: 28, au: 21, jp: 17, fr: 10 },
  { m: '2025-02', de: 11, uae: 76, sg: 51, us: 68, uk: 50, au: 38, jp: 30, fr: 15 },
  { m: '2025-03', de: 8, uae: 84, sg: 69, us: 93, uk: 75, au: 68, jp: 35, fr: 55 },
  { m: '2025-04', de: 5, uae: 76, sg: 52, us: 76, uk: 65, au: 73, jp: 24, fr: 58 },
  { m: '2025-05', de: 3, uae: 63, sg: 48, us: 68, uk: 38, au: 86, jp: 21, fr: 23 },
  { m: '2025-06', de: 2, uae: 53, sg: 47, us: 62, uk: 27, au: 73, jp: 17, fr: 14 },
  { m: '2025-07', de: 2, uae: 50, sg: 39, us: 69, uk: 23, au: 68, jp: 12, fr: 11 },
  { m: '2025-08', de: 2, uae: 42, sg: 32, us: 71, uk: 18, au: 59, jp: 14, fr: 9 },
  { m: '2025-09', de: 2, uae: 44, sg: 29, us: 42, uk: 14, au: 55, jp: 14, fr: 10 },
  { m: '2025-10', de: 3, uae: 50, sg: 28, us: 43, uk: 14, au: 60, jp: 15, fr: 11 },
  { m: '2025-11', de: 3, uae: 57, sg: 59, us: 41, uk: 14, au: 34, jp: 18, fr: 10 },
  { m: '2025-12', de: 3, uae: 61, sg: 52, us: 40, uk: 14, au: 30, jp: 22, fr: 11 },
  { m: '2026-01', de: 2, uae: 48, sg: 53, us: 46, uk: 10, au: 24, jp: 50, fr: 7 },
  { m: '2026-02', de: 2, uae: 46, sg: 56, us: 43, uk: 10, au: 23, jp: 80, fr: 7 },
  { m: '2026-03', de: 2, uae: 17, sg: 59, us: 32, uk: 10, au: 23, jp: 85, fr: 6 },
  { m: '2026-04', de: 1, uae: 17, sg: 46, us: 26, uk: 6, au: 18, jp: 67, fr: 4 },
  { m: '2026-05', de: 1, uae: 20, sg: 37, us: 21, uk: 5, au: 17, jp: 49, fr: 3 },
];

type Arch = 'flash' | 'plateau' | 'slow';
const ARCH_COLOR: Record<Arch, string> = {
  flash: BURGUNDY,
  plateau: GREEN,
  slow: BLUE,
};

const PANELS: { key: string; name: string; arch: Arch; caught: string; note: string }[] = [
  { key: 'de', name: 'Germany', arch: 'flash', caught: 'caught it Oct ’24', note: 'First in, first out: peaked before December, gone by spring.' },
  { key: 'uae', name: 'UAE', arch: 'plateau', caught: 'caught it Dec ’24', note: 'Home turf: high for a year, only fading in 2026.' },
  { key: 'sg', name: 'Singapore', arch: 'plateau', caught: 'caught it Dec ’24', note: 'Sticky: a second wave in late ’25, still elevated.' },
  { key: 'us', name: 'United States', arch: 'plateau', caught: 'caught it Jan ’25', note: 'Broad and durable: a long plateau through 2025.' },
  { key: 'uk', name: 'United Kingdom', arch: 'plateau', caught: 'caught it Jan ’25', note: 'A clean spike in March, then a slow drift down.' },
  { key: 'au', name: 'Australia', arch: 'plateau', caught: 'caught it Jan ’25', note: 'Peaked in May, in its own southern-winter slot.' },
  { key: 'jp', name: 'Japan', arch: 'slow', caught: 'caught it Feb ’25', note: 'Slow burn: didn’t actually peak until early 2026.' },
  { key: 'fr', name: 'France', arch: 'flash', caught: 'caught it Mar ’25', note: 'Last and briefest: one March spike, then forgotten.' },
];

function MiniChart({ k, color }: { k: string; color: string }) {
  const gid = `fill-${k}`;
  return (
    <ResponsiveContainer width="100%" height={72}>
      <AreaChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <YAxis hide domain={[0, 100]} />
        <Area
          type="monotone"
          dataKey={k}
          stroke={color}
          strokeWidth={1.75}
          fill={`url(#${gid})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const LEGEND: { arch: Arch; label: string }[] = [
  { arch: 'flash', label: 'Flash (sharp spike, fast crash)' },
  { arch: 'plateau', label: 'Plateau (big, slow to fade)' },
  { arch: 'slow', label: 'Slow burn (late, still rising)' },
];

export function DiffusionByCountry() {
  return (
    <ChartCard
      title="Eight countries, eight different cravings"
      subtitle="“Dubai chocolate” search interest, by country, each indexed to its own peak so the shapes are comparable. Same product, the same global moment, and yet almost no two nations metabolised it the same way. Ordered by who caught it first."
      headline={
        <p className="text-sm leading-relaxed text-ink">
          Germany caught the craze <b>weeks before anyone else</b> and burned out
          fastest. Japan didn’t peak until <b>early 2026</b>, a year late and still
          climbing. A single trend, refracted through eight food cultures.
        </p>
      }
      source="Google Trends, weekly interest in “Dubai chocolate” by country, resampled to monthly means and indexed to each country’s own peak (Jan 2024–May 2026). June 2026 excluded (incomplete)."
      maxWidth={null}
    >
      <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-xs">
        {LEGEND.map((l) => (
          <span key={l.arch} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ARCH_COLOR[l.arch] }} />
            <span className="text-ink">{l.label}</span>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-5 md:grid-cols-4">
        {PANELS.map((p) => (
          <div key={p.key} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-serif text-sm font-medium text-ink-heading">{p.name}</span>
              <span className="data-num text-[10px] text-ink-subtle">{p.caught}</span>
            </div>
            <MiniChart k={p.key} color={ARCH_COLOR[p.arch]} />
            <p className="mt-1 text-[11px] leading-snug text-ink-muted">{p.note}</p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

export default DiffusionByCountry;
