import type { ChartRegistry } from '@/components/article/render-blocks';

/**
 * Per-article chart registry loader. Each slug maps to a function that
 * lazy-imports its chart index. The dynamic [slug] route calls
 * `getChartsFor(slug)` and passes the result to <RenderBlocks>.
 *
 * To add a new article with charts:
 *   1. Drop chart .tsx files under app/articles/_charts/[slug]/
 *   2. Add an index.ts in that folder exporting a ChartRegistry as default
 *   3. Add a line below pointing at it.
 */
const loaders: Record<string, () => Promise<{ default: ChartRegistry }>> = {
  'future-money': () => import('./future-money'),
  'early-life-nutrition': () => import('./early-life-nutrition'),
};

export async function getChartsFor(slug: string): Promise<ChartRegistry> {
  const loader = loaders[slug];
  if (!loader) return {};
  try {
    const mod = await loader();
    return mod.default;
  } catch {
    return {};
  }
}
