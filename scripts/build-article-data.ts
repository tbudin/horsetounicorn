#!/usr/bin/env tsx
/**
 * CSV → JSON pipeline for article datasets.
 *
 * Walks every `content/articles/[slug]/data/*.csv`, parses it, and writes
 * the result to `public/data/[slug]/[filename].json`. Also writes a
 * `meta.json` per article listing the files and headers.
 *
 *   pnpm data
 *
 * Idempotent — re-run any time. Output directory is gitignored.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, 'content', 'articles');
const OUTPUT_ROOT = path.join(ROOT, 'public', 'data');

// -- Parser ------------------------------------------------------------

type Row = Record<string, string | number>;

function parseRow(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      const end = line.indexOf('"', i + 1);
      if (end === -1) {
        out.push(line.slice(i + 1));
        break;
      }
      out.push(line.slice(i + 1, end));
      i = end + 1;
      if (line[i] === ',') i++;
    } else {
      let end = line.indexOf(',', i);
      if (end === -1) end = line.length;
      out.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return out;
}

function parseCsv(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseRow(lines[0]);
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    if (cells.length !== headers.length) continue;
    const row: Row = {};
    headers.forEach((h, j) => {
      const raw = cells[j];
      // Treat empty strings as 0 if every other value in the column ends up
      // numeric; here we just leave it and the column type is determined per
      // cell. Simplification: numeric if it parses and is non-empty.
      if (raw === '') {
        row[h] = '';
      } else {
        const n = Number(raw);
        row[h] = !Number.isNaN(n) ? n : raw;
      }
    });
    rows.push(row);
  }
  return { headers, rows };
}

// -- Walk + write ------------------------------------------------------

interface ArticleMeta {
  slug: string;
  files: {
    sourceFile: string;
    outputFile: string;
    headers: string[];
    rowCount: number;
  }[];
  generatedAt: string;
}

function processArticle(slug: string): ArticleMeta | null {
  const dataDir = path.join(ARTICLES_DIR, slug, 'data');
  if (!fs.existsSync(dataDir)) return null;

  const csvFiles = fs
    .readdirSync(dataDir)
    .filter((f) => f.toLowerCase().endsWith('.csv'));

  if (csvFiles.length === 0) return null;

  const outputDir = path.join(OUTPUT_ROOT, slug);
  fs.mkdirSync(outputDir, { recursive: true });

  const meta: ArticleMeta = {
    slug,
    files: [],
    generatedAt: new Date().toISOString(),
  };

  for (const csvFile of csvFiles) {
    const sourcePath = path.join(dataDir, csvFile);
    const text = fs.readFileSync(sourcePath, 'utf8');
    const { headers, rows } = parseCsv(text);

    const outputName = csvFile.replace(/\.csv$/i, '.json');
    const outputPath = path.join(outputDir, outputName);
    fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), 'utf8');

    meta.files.push({
      sourceFile: csvFile,
      outputFile: outputName,
      headers,
      rowCount: rows.length,
    });

    console.log(`  ✓ ${slug}/${outputName} (${rows.length} rows)`);
  }

  fs.writeFileSync(
    path.join(outputDir, 'meta.json'),
    JSON.stringify(meta, null, 2),
    'utf8',
  );

  return meta;
}

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log('No content/articles/ directory; nothing to build.');
    return;
  }

  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  const slugs = fs
    .readdirSync(ARTICLES_DIR)
    .filter((name) => {
      const full = path.join(ARTICLES_DIR, name);
      return fs.statSync(full).isDirectory();
    });

  if (slugs.length === 0) {
    console.log('No article folders under content/articles/.');
    return;
  }

  console.log(`Building article data → public/data/`);
  const all: ArticleMeta[] = [];
  for (const slug of slugs) {
    const meta = processArticle(slug);
    if (meta) all.push(meta);
  }

  console.log(
    `\nDone. ${all.length} article${all.length === 1 ? '' : 's'} processed, ` +
      `${all.reduce((sum, m) => sum + m.files.length, 0)} files written.`,
  );
}

main();
