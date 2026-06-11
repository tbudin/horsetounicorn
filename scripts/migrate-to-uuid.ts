/**
 * One-shot migration from slug-keyed filesystem to UUID-keyed filesystem.
 *
 * For each article in content/articles/:
 *   1. Generate a v4 UUID
 *   2. Rename content/articles/<slug>/    →    content/articles/<id>/
 *   3. Rename public/articles/<slug>/     →    public/articles/<id>/
 *   4. Rename app/articles/_charts/<slug>/ →   app/articles/_charts/<id>/
 *   5. Update metadata.json: add { id, previousSlugs: [] }, keep slug
 *   6. Rewrite content.json image src attrs from /articles/<slug>/ → /articles/<id>/
 *   7. Update app/articles/_charts/index.ts registry to key by id
 *
 *   pnpm tsx scripts/migrate-to-uuid.ts
 *   pnpm tsx scripts/migrate-to-uuid.ts --dry-run
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry-run');

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content', 'articles');
const PUBLIC_DIR = path.join(ROOT, 'public', 'articles');
const CHARTS_DIR = path.join(ROOT, 'app', 'articles', '_charts');
const CHARTS_INDEX = path.join(CHARTS_DIR, 'index.ts');

interface MigrationStep {
  slug: string;
  id: string;
  movedContent: boolean;
  movedPublic: boolean;
  movedCharts: boolean;
  rewriteContentJson: number;
}

function uuid(): string {
  return crypto.randomUUID();
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file: string, data: unknown) {
  if (DRY) return;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function moveDir(from: string, to: string): boolean {
  if (!fs.existsSync(from)) return false;
  if (fs.existsSync(to)) {
    throw new Error(`target already exists: ${to}`);
  }
  if (DRY) return true;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  return true;
}

// ---- Pass 1: collect every article and assign a UUID --------------------

function collectArticles(): { slug: string; id: string }[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const slugs = fs
    .readdirSync(CONTENT_DIR)
    .filter((s) => {
      const dir = path.join(CONTENT_DIR, s);
      return (
        fs.statSync(dir).isDirectory() &&
        fs.existsSync(path.join(dir, 'metadata.json'))
      );
    });
  return slugs.map((slug) => {
    const metaPath = path.join(CONTENT_DIR, slug, 'metadata.json');
    const meta = readJson<{ id?: string }>(metaPath);
    return { slug, id: meta.id ?? uuid() };
  });
}

// ---- Pass 2: rewrite content.json img src ------------------------------

function rewriteContentJson(slugId: { slug: string; id: string }[], contentJsonPath: string): number {
  if (!fs.existsSync(contentJsonPath)) return 0;
  const raw = fs.readFileSync(contentJsonPath, 'utf8');
  let next = raw;
  let count = 0;
  for (const { slug, id } of slugId) {
    const re = new RegExp(`/articles/${slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}/`, 'g');
    const before = next;
    next = next.replace(re, `/articles/${id}/`);
    if (next !== before) {
      count += (before.match(re) ?? []).length;
    }
  }
  if (count > 0 && !DRY) {
    fs.writeFileSync(contentJsonPath, next, 'utf8');
  }
  return count;
}

// ---- Pass 3: rewrite charts index --------------------------------------

function rewriteChartsIndex(slugId: { slug: string; id: string }[]): boolean {
  if (!fs.existsSync(CHARTS_INDEX)) return false;
  let src = fs.readFileSync(CHARTS_INDEX, 'utf8');
  let changed = false;
  for (const { slug, id } of slugId) {
    // 'slug' as key
    const keyRe = new RegExp(`'${slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}'`, 'g');
    if (keyRe.test(src)) {
      src = src.replace(keyRe, `'${id}'`);
      changed = true;
    }
    // ./slug path
    const pathRe = new RegExp(`\\./${slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
    if (pathRe.test(src)) {
      src = src.replace(pathRe, `./${id}`);
      changed = true;
    }
  }
  if (changed && !DRY) {
    fs.writeFileSync(CHARTS_INDEX, src, 'utf8');
  }
  return changed;
}

// ---- Main ---------------------------------------------------------------

function main() {
  const articles = collectArticles();
  if (articles.length === 0) {
    console.log('No articles found.');
    return;
  }

  console.log(`${DRY ? '[DRY-RUN]' : '[APPLY]'} migrating ${articles.length} article(s)\n`);

  // Detect anything already migrated (has `id` in metadata) so we don't
  // double-rename.
  const stepsNeeded = articles.filter((a) => {
    const meta = readJson<{ id?: string }>(
      path.join(CONTENT_DIR, a.slug, 'metadata.json'),
    );
    // If id is already set AND the folder name equals the id, it's done.
    return !(meta.id && a.slug === meta.id);
  });

  if (stepsNeeded.length === 0) {
    console.log('Everything is already migrated. Nothing to do.');
    return;
  }

  const steps: MigrationStep[] = [];

  // 1. Folder renames + metadata updates per article.
  for (const { slug, id } of stepsNeeded) {
    console.log(`▸ ${slug} → ${id}`);

    const movedContent = moveDir(
      path.join(CONTENT_DIR, slug),
      path.join(CONTENT_DIR, id),
    );
    const movedPublic = moveDir(
      path.join(PUBLIC_DIR, slug),
      path.join(PUBLIC_DIR, id),
    );
    const movedCharts = moveDir(
      path.join(CHARTS_DIR, slug),
      path.join(CHARTS_DIR, id),
    );

    // Update metadata.json with id + previousSlugs (empty for now — the
    // article hasn't been renamed yet, just relocated).
    const metaPath = path.join(CONTENT_DIR, DRY ? slug : id, 'metadata.json');
    if (!DRY) {
      const meta = readJson<Record<string, unknown>>(metaPath);
      meta.id = id;
      if (!meta.previousSlugs) meta.previousSlugs = [];
      // Reorder so id sits at the top of the file for readability.
      const { id: _id, slug: _slug, previousSlugs: _ps, ...rest } = meta as {
        id: string;
        slug: string;
        previousSlugs: string[];
      } & Record<string, unknown>;
      writeJson(metaPath, { id: _id, slug: _slug, previousSlugs: _ps, ...rest });
    }

    steps.push({
      slug,
      id,
      movedContent,
      movedPublic,
      movedCharts,
      rewriteContentJson: 0,
    });
  }

  // 2. content.json image src rewrites — need to do this AFTER all folders
  //    are renamed so we know the canonical id paths.
  for (const step of steps) {
    const contentPath = path.join(
      CONTENT_DIR,
      DRY ? step.slug : step.id,
      'content.json',
    );
    const allSlugIds = stepsNeeded.map((a) => ({ slug: a.slug, id: a.id }));
    step.rewriteContentJson = rewriteContentJson(allSlugIds, contentPath);
  }

  // 3. Charts registry rewrite.
  const registryChanged = rewriteChartsIndex(
    stepsNeeded.map((a) => ({ slug: a.slug, id: a.id })),
  );

  // Summary
  console.log('\n=== Summary ===');
  for (const s of steps) {
    const bits: string[] = [];
    if (s.movedContent) bits.push('content');
    if (s.movedPublic) bits.push('public');
    if (s.movedCharts) bits.push('charts');
    if (s.rewriteContentJson > 0) bits.push(`${s.rewriteContentJson} url(s)`);
    console.log(`  ${s.slug}: ${bits.join(', ') || 'nothing'}`);
  }
  console.log(
    `  charts registry: ${registryChanged ? 'rewritten' : 'unchanged'}`,
  );
  console.log('\nDone' + (DRY ? ' (dry-run, no files written)' : '') + '.');
}

main();
