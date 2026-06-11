import { ChartCard } from '@/components/charts/chart-card';
import { BURGUNDY, BLUE, ORANGE } from '@/lib/chart-colors';

// Growth in search interest, mean of Dec 2025 - May 2026 vs the 2022-23
// baseline, per term (each series normalised to itself). Google Trends,
// Worldwide. Log scale, so the +800-1,100% movers (on small 2022 bases) and
// the +37% movers are all visible.
type Cat = 'spec' | 'def' | 'sup' | 'stap';
const CAT_COLOR: Record<Cat, string> = {
  spec: BURGUNDY,
  def: ORANGE,
  sup: BLUE,
  stap: '#B4B2A9',
};
const LEGEND: { cat: Cat; label: string }[] = [
  { cat: 'spec', label: 'stage-specific nutrition' },
  { cat: 'def', label: 'deficiencies' },
  { cat: 'sup', label: 'supplements' },
  { cat: 'stap', label: 'feeding staples' },
];

const DATA: { term: string; growth: number; cat: Cat }[] = [
  { term: 'toddler nutrition', growth: 1127, cat: 'spec' },
  { term: 'infant nutrition', growth: 1088, cat: 'spec' },
  { term: 'early childhood nutrition', growth: 875, cat: 'spec' },
  { term: 'breastfeeding diet', growth: 225, cat: 'spec' },
  { term: 'iron deficiency', growth: 184, cat: 'def' },
  { term: 'childhood brain development', growth: 155, cat: 'spec' },
  { term: 'vitamin D deficiency', growth: 122, cat: 'def' },
  { term: 'folic acid (pregnancy)', growth: 120, cat: 'sup' },
  { term: 'vitamins for kids', growth: 94, cat: 'sup' },
  { term: 'baby food', growth: 81, cat: 'stap' },
  { term: 'prenatal vitamins', growth: 71, cat: 'sup' },
  { term: 'infant formula', growth: 37, cat: 'stap' },
  { term: 'weaning', growth: 36, cat: 'stap' },
  { term: 'breastfeeding', growth: 0, cat: 'stap' },
];

const TICKS = [1, 2, 4, 8];
const DENOM = Math.log10(13);
const posOf = (growth: number) => (Math.log10(1 + growth / 100) / DENOM) * 100;
const LABEL_W = 156;

export function ParentalSearchMomentum() {
  return (
    <ChartCard
      title="What parents care about now, versus before"
      subtitle="Growth in search interest, recent 6 months vs 2022–23. The evergreen giant (breastfeeding) is flat; stage-specific nutrition and micronutrient deficiencies are surging."
      source="Google Trends, Worldwide, mean of Dec 2025–May 2026 vs 2022–23, each term normalised to itself. Log scale; the +800–1,100% movers sit on small 2022 bases."
    >
      <div className="not-prose mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-ink-muted">
        {LEGEND.map((l) => (
          <span key={l.cat} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CAT_COLOR[l.cat] }} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="relative" style={{ paddingBottom: 18 }}>
        {TICKS.map((t) => {
          const left = `calc(${LABEL_W}px + ${(Math.log10(t) / DENOM).toFixed(4)} * (100% - ${LABEL_W + 44}px))`;
          return (
            <div key={t}>
              <div className="absolute top-0" style={{ left, bottom: 18, borderLeft: '0.5px dashed #EEE6EC' }} />
              <div className="absolute text-[10px] text-ink-subtle" style={{ left, bottom: 0, transform: 'translateX(-50%)' }}>
                {t}×
              </div>
            </div>
          );
        })}

        {DATA.map((d) => {
          const p = posOf(d.growth);
          const color = CAT_COLOR[d.cat];
          const label =
            d.growth === 0 ? 'flat' : `+${d.growth.toLocaleString('en-US')}%`;
          return (
            <div key={d.term} className="flex items-center" style={{ height: 36 }}>
              <div className="flex-none pr-2.5 text-right text-xs text-ink-body" style={{ width: LABEL_W }}>
                {d.term}
              </div>
              <div className="relative h-full flex-1">
                <div className="absolute left-0 right-0" style={{ top: '50%', height: '0.5px', background: '#F0E8EE' }} />
                <div
                  className="absolute"
                  style={{ left: 0, top: '50%', width: `${Math.max(p, 0.5)}%`, height: 2, background: color, opacity: 0.35, transform: 'translateY(-50%)' }}
                />
                <div
                  className="absolute rounded-full"
                  style={{ left: `${p}%`, top: '50%', width: 9, height: 9, background: color, transform: 'translate(-50%, -50%)' }}
                />
                {/* Data label sits centered ABOVE the dot. */}
                <div
                  className="absolute whitespace-nowrap text-[11px] font-medium"
                  style={{
                    left: `${p}%`,
                    top: 2,
                    transform: 'translateX(-50%)',
                    color,
                    lineHeight: 1,
                  }}
                >
                  {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

export default ParentalSearchMomentum;
