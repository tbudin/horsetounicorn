#!/usr/bin/env tsx
/**
 * One-off: convert every content/articles/[slug]/content.json from the
 * old Block[] format to the new ArticleDocument (TipTap JSON tree).
 *
 *   pnpm migrate:docs
 *
 * Idempotent — already-migrated files are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import { migrateBlockArrayToDocument } from '../lib/articles';

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');

function migrateOne(slug: string): 'migrated' | 'already' | 'missing' {
  const file = path.join(ARTICLES_DIR, slug, 'content.json');
  if (!fs.existsSync(file)) return 'missing';
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(raw)) return 'already';
  const doc = migrateBlockArrayToDocument(raw);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2), 'utf8');
  return 'migrated';
}

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log('No content/articles/ directory.');
    return;
  }
  const slugs = fs.readdirSync(ARTICLES_DIR).filter((name) => {
    const s = fs.statSync(path.join(ARTICLES_DIR, name));
    return s.isDirectory();
  });
  console.log(`Scanning ${slugs.length} article folders…`);
  let migrated = 0;
  let already = 0;
  let missing = 0;
  for (const slug of slugs) {
    const result = migrateOne(slug);
    const tag = result === 'migrated' ? '✓' : result === 'already' ? '·' : '?';
    console.log(`  ${tag} ${slug}  (${result})`);
    if (result === 'migrated') migrated++;
    else if (result === 'already') already++;
    else missing++;
  }
  console.log(
    `\nDone. ${migrated} migrated, ${already} already in new format, ${missing} missing.`,
  );
}

main();
