import type { ChartRegistry } from '@/components/article/render-blocks';

/**
 * Per-article chart registry loader. Each article *id* (UUID) maps to a
 * function that lazy-imports its chart index. Keying by id (not slug) is
 * the whole point of the UUID-folder refactor — articles can rename their
 * slug freely without ever touching this file.
 *
 * To add a new article with charts:
 *   1. Drop chart .tsx files under app/articles/_charts/<article-id>/
 *   2. Add an index.ts in that folder exporting a ChartRegistry as default
 *   3. Add a line below keyed by the article id.
 */
const loaders: Record<string, () => Promise<{ default: ChartRegistry }>> = {
  '834eefd9-270a-41e9-aaf3-2807282e73a6': () => import('./834eefd9-270a-41e9-aaf3-2807282e73a6'),
  'bf5497a6-4ca8-4e6d-a340-3117c2fe23c3': () => import('./bf5497a6-4ca8-4e6d-a340-3117c2fe23c3'),
};

export async function getChartsFor(articleId: string): Promise<ChartRegistry> {
  const loader = loaders[articleId];
  if (!loader) return {};
  try {
    const mod = await loader();
    return mod.default;
  } catch {
    return {};
  }
}
