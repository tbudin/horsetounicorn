#!/usr/bin/env tsx
/**
 * Local fallback for the chart → PNG pipeline. If serverless Chromium on Vercel
 * misbehaves, render an article's chart images from your own machine instead.
 *
 *   # 1. start the app (separate terminal): pnpm dev   (or pnpm start)
 *   # 2. render every chart in the article:
 *   pnpm chart:shots <articleId> [baseUrl]
 *
 * baseUrl defaults to http://localhost:3000. Output goes to R2 when configured
 * (same as the in-app button), otherwise to public/articles/<id>/charts/.
 *
 * Needs a Chromium-family browser. By default puppeteer-core uses Google Chrome
 * (`channel: 'chrome'`); point PUPPETEER_EXECUTABLE_PATH at another binary
 * (Brave/Edge/Chromium) if Chrome isn't installed.
 */
import { loadArticleById } from '../lib/articles';
import type { BlockNode } from '../lib/article-doc';
import { signChartShotToken } from '../lib/subscribe-tokens';
import { screenshotChart } from '../lib/chart-screenshot';
import { saveChartImage, isR2Configured } from '../lib/storage';

function collectChartNames(nodes: BlockNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    if (n.type === 'chart' && n.attrs?.chartName) out.push(n.attrs.chartName);
    if ('content' in n && Array.isArray(n.content)) {
      collectChartNames(n.content as BlockNode[], out);
    }
  }
  return out;
}

async function main() {
  const articleId = process.argv[2];
  const baseUrl = (process.argv[3] ?? 'http://localhost:3000').replace(/\/+$/, '');
  if (!articleId) {
    console.error('Usage: pnpm chart:shots <articleId> [baseUrl]');
    process.exit(1);
  }

  let article;
  try {
    article = loadArticleById(articleId);
  } catch (err) {
    console.error(`Could not load article ${articleId}:`, (err as Error).message);
    process.exit(1);
  }

  const charts = Array.from(new Set(collectChartNames(article.document.content)));
  if (charts.length === 0) {
    console.log('No charts referenced in this article. Nothing to do.');
    return;
  }

  console.log(
    `Rendering ${charts.length} chart(s) for "${article.metadata.slug}" via ${baseUrl}`,
  );
  console.log(`Storage: ${isR2Configured() ? 'R2' : 'public/ (local)'}\n`);

  let ok = 0;
  for (const chart of charts) {
    process.stdout.write(`  ${chart} … `);
    try {
      const token = await signChartShotToken(`${articleId}:${chart}`);
      const url = `${baseUrl}/chart-shot/${articleId}/${encodeURIComponent(chart)}?token=${encodeURIComponent(token)}`;
      const png = await screenshotChart({ url });
      const publicUrl = await saveChartImage(articleId, chart, png);
      console.log(`✓ ${png.length} bytes → ${publicUrl}`);
      ok++;
    } catch (err) {
      console.log(`✗ ${(err as Error).message}`);
    }
  }

  console.log(`\nDone. ${ok}/${charts.length} rendered.`);
  process.exit(ok === charts.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
