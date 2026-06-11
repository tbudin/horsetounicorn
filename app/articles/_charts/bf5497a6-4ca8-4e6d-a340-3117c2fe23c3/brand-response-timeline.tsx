import { ChartCard } from '@/components/charts/chart-card';
import { BURGUNDY, BLUE, ORANGE, GREEN, INK_SUBTLE } from '@/lib/chart-colors';

type Item = {
  date: string;
  /** Which search wave this maps to, if any. */
  wave?: string;
  event: string;
  reaction: string;
  color: string;
};

const ITEMS: Item[] = [
  {
    date: 'Mar 18 2025',
    event: 'FDA/HHS launch “Operation Stork Speed”: first review of infant-formula nutrients since 1998.',
    reaction:
      'CEOs of Abbott, Reckitt, Perrigo, Nestlé and Bobbie meet RFK Jr. and commit to stricter standards and clearer labels.',
    color: BLUE,
  },
  {
    date: 'May 22 2025',
    event: '“Make Our Children Healthy Again” (MAHA) assessment targets ultra-processed foods in children’s diets.',
    reaction:
      'Clean-label brands (Cerebelly, Serenity Kids, Once Upon a Farm, Danone’s Happy Family) lean into purity and heavy-metal testing under California AB 899.',
    color: GREEN,
  },
  {
    date: 'Aug–Sep 2025',
    wave: 'Wave 1',
    event:
      'MAHA strategy release + toddler-milk marketing lawsuits put infant/toddler nutrition on front pages.',
    reaction:
      'Infant- and toddler-nutrition searches jump ~5.5×, the first of three waves.',
    color: BURGUNDY,
  },
  {
    date: 'Sep 22 2025',
    event:
      'HHS report links prenatal Tylenol + low folate to autism; FDA moves to approve leucovorin (folinic acid).',
    reaction:
      'Prenatal/supplement brands lean into methylfolate (5-MTHF) over synthetic folic acid (e.g. Ritual, Pink Stork).',
    color: ORANGE,
  },
  {
    date: 'Nov 7–11 2025',
    wave: 'Wave 2',
    event:
      'ByHeart botulism recall, all batches pulled after ~83 infant-botulism cases nationwide.',
    reaction:
      'ByHeart searches spike 34× in one week. Bobbie adds botulism-spore (clostridia) screening; DTC formula brands pause new orders as demand surges.',
    color: BURGUNDY,
  },
  {
    date: 'Jan 5–22 2026',
    event:
      'Global cereulide-toxin recall traced to one Chinese ARA-oil supplier: Nestlé (SMA, Beba), Danone (Aptamil, Cow & Gate) and Lactalis (Picot) pull products in 60+ countries.',
    reaction:
      'Nestlé posts its biggest search month in five years; Aptamil searches jump ~2×. Shares fall; French prosecutors open a probe.',
    color: BLUE,
  },
  {
    date: 'Apr 2026',
    wave: 'Wave 3',
    event:
      'RFK Jr. announces a renewed autism research effort (report due Sep 2026); a $53M Similac NEC jury verdict lands the same month.',
    reaction:
      'Infant-nutrition and folic-acid searches hit all-time peaks; Similac and Enfamil interest ticks up.',
    color: BURGUNDY,
  },
];

export function BrandResponseTimeline() {
  return (
    <ChartCard
      title="Eighteen months that reshaped early-life nutrition search"
      subtitle="Six news events, three of which produced distinct search waves, and how the brands responded."
      source="Compiled from FDA/HHS, CDC, CNN, FoodNavigator, Euronews, CNBC and company communications, 2025–2026."
    >
      <ol className="not-prose relative ml-1 border-l border-[#EEE6EC]">
        {ITEMS.map((it) => (
          <li key={it.date} className="relative pl-6 pb-6 last:pb-0">
            <span
              className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: it.color }}
            />
            <div className="flex items-baseline gap-2">
              <span
                className="data-num text-xs font-semibold"
                style={{ color: it.color, fontFamily: 'var(--font-roboto-mono), monospace' }}
              >
                {it.date}
              </span>
              {it.wave ? (
                <span
                  className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: it.color, color: '#fff' }}
                >
                  {it.wave}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink">{it.event}</p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: INK_SUBTLE }}>
              <span className="font-semibold text-ink">Brand response: </span>
              {it.reaction}
            </p>
          </li>
        ))}
      </ol>
    </ChartCard>
  );
}

export default BrandResponseTimeline;
