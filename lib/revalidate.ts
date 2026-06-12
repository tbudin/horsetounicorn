import { revalidatePath } from 'next/cache';

/**
 * Refresh every public surface that lists or shows articles, so a publish /
 * status change is reflected immediately instead of waiting on the ISR timer
 * or the next deploy. The home, index, sitemap, and RSS all read the
 * GitHub-fresh metadata list, so revalidating them re-reads the just-committed
 * status right away.
 */
export function revalidatePublicArticleSurfaces(slug?: string): void {
  revalidatePath('/'); // home — featured + recent grid
  revalidatePath('/articles'); // index
  if (slug) revalidatePath(`/articles/${slug}`); // the article itself
  revalidatePath('/sitemap.xml');
  revalidatePath('/rss.xml');
}
