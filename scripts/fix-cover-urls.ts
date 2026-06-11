#!/usr/bin/env tsx
/**
 * One-off fix. The original migrate-to-uuid script rewrote inline image
 * `src` URLs in content.json but missed the `cover` field in metadata.json,
 * leaving cover URLs pointing to the now-deleted slug-named folders.
 *
 * For every metadata.json under content/articles/<id>/ this script:
 *   - reads the article id
 *   - rewrites `cover` from /articles/<old-slug>/cover.<ext>
 *                       to  /articles/<id>/cover.<ext>
 *   - confirms the new path actually exists in /public before writing
 *
 *   pnpm tsx scripts/fix-cover-urls.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let fixed = 0;
let skipped = 0;

for (const entry of fs.readdirSync(ARTICLES_DIR)) {
  const dir = path.join(ARTICLES_DIR, entry);
  if (!fs.statSync(dir).isDirectory()) continue;
  const metaPath = path.join(dir, 'metadata.json');
  if (!fs.existsSync(metaPath)) continue;

  const raw = fs.readFileSync(metaPath, 'utf8');
  const meta = JSON.parse(raw) as { id: string; cover?: string; slug?: string };
  if (!meta.cover) continue;

  // Only rewrite URLs that look like /articles/<segment>/<rest> where
  // <segment> is not already the article's UUID.
  const m = meta.cover.match(/^\/articles\/([^/]+)\/(.+)$/);
  if (!m) {
    console.log(`  skip (non-matching pattern): ${meta.cover}`);
    skipped++;
    continue;
  }
  const [, currentSegment, rest] = m;
  if (currentSegment === meta.id) {
    skipped++;
    continue; // already correct
  }
  const newCover = `/articles/${meta.id}/${rest}`;

  // Sanity check: the new file must exist on disk
  const onDisk = path.join(PUBLIC_DIR, 'articles', meta.id, rest);
  if (!fs.existsSync(onDisk)) {
    console.warn(
      `  ⚠ ${meta.id}: target ${onDisk} does not exist — skipping rewrite of ${meta.cover}`,
    );
    skipped++;
    continue;
  }

  meta.cover = newCover;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  console.log(`  ✓ ${meta.id}: ${currentSegment} → ${meta.id}`);
  fixed++;
}

console.log(`\nDone. Rewrote ${fixed} cover URLs, skipped ${skipped}.`);
