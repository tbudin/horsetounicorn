import { notFound } from 'next/navigation';
import { getChartsFor } from '@/app/articles/_charts';
import { verifyChartShotToken } from '@/lib/subscribe-tokens';

export const dynamic = 'force-dynamic';

/**
 * Full-bleed, token-gated render of a single chart, used as the screenshot
 * target for the chart-to-PNG pipeline. Lives OUTSIDE /admin so the headless
 * browser isn't blocked by the admin middleware; the short-lived `token`
 * (scoped to this exact article+chart) is the access control.
 *
 * The interactive toolbars are hidden (`[data-chart-toolbar]`) so the image is
 * a clean chart — title, graphic, legend, source — with no filter UI.
 */
export default async function ChartShotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; chart: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id, chart } = await params;
  const { token } = await searchParams;

  if (!token || !(await verifyChartShotToken(token, `${id}:${chart}`))) {
    notFound();
  }

  const charts = await getChartsFor(id);
  const Chart = charts[chart];
  if (!Chart) notFound();

  return (
    <div
      style={{
        background: '#ffffff',
        padding: '24px',
        width: '940px',
      }}
    >
      <style>{`
        [data-chart-toolbar] { display: none !important; }
        body { background: #ffffff; margin: 0; }
        /* Neutralise the card's own outer margin so #shot wraps it tightly. */
        #shot > * { margin: 0 !important; }
      `}</style>
      <div id="shot">
        <Chart />
      </div>
    </div>
  );
}
