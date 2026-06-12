'use client';

import { useMemo, useState } from 'react';
import { ChartCard } from '@/components/charts/chart-card';
import { ChartToolbar, TopicPill } from '@/components/charts/chart-controls';
import { INK_SUBTLE } from '@/lib/chart-colors';

// Seasonal anomaly per topic: each month minus that year's own average, so the
// long-term trend is removed. A real season repeats down a column; a one-off
// news spike is a single dark cell. Google Trends, Worldwide, 2021-26.
type Topic = 'bf' | 'fo' | 'if' | 'ba';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = ['2021', '2022', '2023', '2024', '2025', '2026'];

const ANOM: Record<Topic, Record<string, Record<number, number>>> = {
  bf: { '2021': { 6: 0.9, 7: 2.6, 8: 4.6, 9: -0.6, 10: -0.6, 11: -3.1, 12: -3.6 }, '2022': { 1: 4.0, 2: 1.5, 3: -1.5, 4: -4.5, 5: -1.0, 6: -3.0, 7: 3.0, 8: 1.0, 9: 0.2, 10: 4.4, 11: -3.3, 12: -0.5 }, '2023': { 1: 7.9, 2: 6.0, 3: 0.3, 4: -3.7, 5: -1.7, 6: -1.5, 7: 2.9, 8: 0.8, 9: -3.0, 10: -3.3, 11: -2.5, 12: -2.3 }, '2024': { 1: 1.3, 2: 0.5, 3: -1.8, 4: -2.5, 5: -1.5, 6: -4.6, 7: 1.5, 8: 4.0, 9: -1.2, 10: 1.3, 11: 1.3, 12: 1.6 }, '2025': { 1: -0.2, 2: -0.7, 3: -2.7, 4: -2.7, 5: -2.2, 6: -4.1, 7: -0.2, 8: 5.9, 9: 2.3, 10: 3.8, 11: 0.3, 12: 0.8 }, '2026': { 1: -3.7, 2: -3.5, 3: 1.0, 4: 2.3, 5: 4.0 } },
  fo: { '2021': { 6: -0.7, 7: -0.2, 8: -0.1, 9: -0.2, 10: 0.3, 11: 0.3, 12: 0.8 }, '2022': { 1: -5.5, 2: 1.3, 3: -3.7, 4: -2.5, 5: 33.9, 6: 2.5, 7: -2.9, 8: -3.5, 9: -4.2, 10: -4.7, 11: -5.2, 12: -5.5 }, '2023': { 1: 1.0, 2: 0.2, 3: -0.3, 4: -1.6, 5: -0.3, 6: -0.6, 7: 0.0, 8: 0.4, 9: 0.7, 10: 0.4, 11: 0.7, 12: -0.8 }, '2024': { 1: 0.4, 2: 0.2, 3: -1.0, 4: -0.6, 5: -0.3, 6: -2.2, 7: -1.1, 8: 0.2, 9: 0.6, 10: 2.9, 11: 0.4, 12: 0.8 }, '2025': { 1: -2.9, 2: -3.4, 3: -2.1, 4: -3.2, 5: -3.9, 6: -3.1, 7: -0.7, 8: 3.9, 9: 2.6, 10: 2.8, 11: 7.3, 12: 2.8 }, '2026': { 1: 1.8, 2: 0.1, 3: -1.2, 4: -0.4, 5: -0.4 } },
  if: { '2021': { 6: 0.7, 7: 0.5, 8: 0.5, 9: 0.2, 10: -0.3, 11: -1.0, 12: -0.8 }, '2022': { 1: -0.8, 2: 0.3, 3: -0.2, 4: -0.2, 5: -0.8, 6: -0.9, 7: -1.8, 8: -1.7, 9: -1.2, 10: 0.0, 11: 4.1, 12: 3.1 }, '2023': { 1: -9.4, 2: -9.3, 3: -2.3, 4: 1.2, 5: 3.0, 6: 2.2, 7: -0.2, 8: 1.2, 9: 2.0, 10: 4.2, 11: 5.2, 12: 2.0 }, '2024': { 1: -7.1, 2: -9.8, 3: -9.3, 4: -11.6, 5: 8.7, 6: 4.3, 7: 10.7, 8: 12.4, 9: 6.1, 10: 7.4, 11: -2.8, 12: -9.3 }, '2025': { 1: -11.5, 2: -3.3, 3: -5.3, 4: -5.3, 5: -7.0, 6: -5.3, 7: -3.8, 8: 4.9, 9: 4.5, 10: 4.2, 11: 16.5, 12: 11.5 }, '2026': { 1: -21.1, 2: 4.9, 3: -4.1, 4: 12.4, 5: 7.9 } },
  ba: { '2021': { 6: -0.6, 7: -2.8, 8: -2.9, 9: 4.4, 10: 3.9, 11: -0.3, 12: -1.6 }, '2022': { 1: -1.5, 2: -2.2, 3: 1.1, 4: -5.4, 5: -1.9, 6: 2.3, 7: 7.5, 8: 4.1, 9: 0.6, 10: -0.3, 11: -1.9, 12: -2.7 }, '2023': { 1: 9.4, 2: 6.0, 3: 6.3, 4: 4.4, 5: 6.5, 6: 9.8, 7: 5.4, 8: -6.0, 9: -6.5, 10: -10.8, 11: -11.0, 12: -13.6 }, '2024': { 1: 4.7, 2: 3.5, 3: 3.5, 4: -0.3, 5: 2.0, 6: -2.1, 7: -1.5, 8: -1.5, 9: -1.5, 10: -1.0, 11: -3.3, 12: -2.5 }, '2025': { 1: 3.2, 2: 0.2, 3: -1.8, 4: -0.8, 5: -4.8, 6: -1.4, 7: 2.2, 8: 3.0, 9: 1.2, 10: 0.5, 11: 1.2, 12: -2.8 }, '2026': { 1: 1.0, 2: 2.0, 3: -0.4, 4: 0.7, 5: -3.2 } },
};

const TOPICS: { key: Topic; label: string; note: string }[] = [
  { key: 'bf', label: 'breastfeeding', note: 'A faint August lift repeats every year, the one real season in the category.' },
  { key: 'fo', label: 'baby formula', note: 'The single dark cell is the May 2022 US shortage. There is no recurring season.' },
  { key: 'if', label: 'infant feeding', note: 'Too low-volume to read: the swings are noise, not a pattern.' },
  { key: 'ba', label: 'baby food', note: 'A loose winter-and-spring warmth, never quite the same twice.' },
];

function cellColor(a: number | undefined, c: number): { bg: string; t: number } {
  if (a == null) return { bg: '#F1EFE8', t: 0 };
  const t = Math.max(0, Math.min(1, (a + c) / (2 * c)));
  return { bg: `rgba(158, 10, 113, ${(0.04 + 0.92 * t).toFixed(2)})`, t };
}

export function BreastfeedingSeasonality() {
  const [topic, setTopic] = useState<Topic>('bf');
  const meta = TOPICS.find((t) => t.key === topic)!;
  const scale = useMemo(() => {
    let m = 1;
    for (const y of YEARS) for (const v of Object.values(ANOM[topic][y] ?? {})) m = Math.max(m, Math.abs(v));
    return m;
  }, [topic]);

  return (
    <ChartCard
      title="Barely a season at all"
      subtitle="Each month against that year's own average, so the long-term trend is stripped out. A real season repeats down a column; a one-off news spike is a single dark cell. Only breastfeeding's August repeats."
      source="Google Trends, Worldwide, monthly. Anomaly = month value minus that year's mean, each topic normalised to itself. June 2026 partial."
    >
      <ChartToolbar label="topic" className="mb-2">
        {TOPICS.map((t) => (
          <TopicPill key={t.key} active={t.key === topic} onClick={() => setTopic(t.key)}>
            {t.label}
          </TopicPill>
        ))}
      </ChartToolbar>
      <p className="not-prose mb-4 text-xs text-ink-muted">
        <span className="font-medium text-ink">{meta.label}</span>: {meta.note}
      </p>

      <div
        className="not-prose"
        role="img"
        aria-label={`Heatmap of ${meta.label} seasonal anomalies by year and month.`}
      >
        <div className="grid items-center gap-[3px]" style={{ gridTemplateColumns: '40px repeat(12, 1fr)' }}>
          <div />
          {MONTHS.map((m) => (
            <div key={m} className="text-center text-[10px] text-ink-subtle">
              {m}
            </div>
          ))}
          {YEARS.map((y) => (
            <FragmentRow key={y} year={y} topic={topic} scale={scale} />
          ))}
        </div>
      </div>

      <div className="not-prose mt-3 flex items-center gap-2 text-[11px] text-ink-subtle">
        <span>below avg</span>
        <span className="inline-block h-3 w-32 rounded-[2px]" style={{ background: 'linear-gradient(to right, rgba(158,10,113,0.06), rgba(158,10,113,0.96))' }} />
        <span>above avg</span>
      </div>
    </ChartCard>
  );
}

function FragmentRow({ year, topic, scale }: { year: string; topic: Topic; scale: number }) {
  const row = ANOM[topic][year] ?? {};
  return (
    <>
      <div className="text-right pr-1.5 text-[11px] text-ink-muted data-num">{year}</div>
      {MONTHS.map((m, i) => {
        const a = row[i + 1];
        const { bg, t } = cellColor(a, scale);
        const big = a != null && Math.abs(a) >= 4;
        return (
          <div
            key={m}
            title={a == null ? `${year} ${m}: no data` : `${year} ${m}: ${a > 0 ? '+' : ''}${a} vs year average`}
            className="flex h-[26px] items-center justify-center rounded-[2px] text-[9px]"
            style={{ background: bg, color: t > 0.55 ? '#fff' : INK_SUBTLE }}
          >
            {big ? (a > 0 ? '+' : '') + Math.round(a) : ''}
          </div>
        );
      })}
    </>
  );
}

export default BreastfeedingSeasonality;
