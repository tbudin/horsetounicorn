#!/usr/bin/env tsx
/**
 * One-off migration: convert every .mdx file in content/posts/ into the
 * block-based article format under content/articles/[slug]/.
 *
 *   pnpm migrate:posts
 *
 * Per post, writes:
 *   content/articles/[slug]/metadata.json
 *   content/articles/[slug]/content.json
 *
 * Idempotent — re-running overwrites. Original MDX is left in place; delete
 * it manually after the migration looks good.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Block, ArticleMetadata } from '../lib/articles';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');

// -- Markdown → blocks ---------------------------------------------------

/**
 * Convert markdown inline formatting (bold, italic, links) to HTML.
 * Order matters: links first (so we don't accidentally munge bold inside
 * link text), then bold, then italic.
 */
function inlineMarkdownToHtml(text: string): string {
  let out = text;
  // Links: [label](url) → <a href="url">label</a>
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
    const safeUrl = url.replace(/"/g, '&quot;');
    return `<a href="${safeUrl}">${label}</a>`;
  });
  // Bold: **text** → <strong>text</strong>
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: _text_ → <em>text</em>  (only when bounded by non-word chars)
  out = out.replace(/(^|[\s(])_([^_]+?)_(?=[\s.,!?:;)]|$)/g, '$1<em>$2</em>');
  return out;
}

function parseImage(line: string): { src: string; alt: string } | null {
  const m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
  if (!m) return null;
  return { alt: m[1], src: m[2] };
}

function isHorizontalRule(line: string): boolean {
  return /^\s*\*\s*\*\s*\*\s*$/.test(line) || /^---+\s*$/.test(line);
}

function markdownToBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let blockCounter = 0;
  const id = (prefix: string) => `${prefix}-${String(++blockCounter).padStart(3, '0')}`;

  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(' ').trim();
    paragraphBuffer = [];
    if (!text) return;
    blocks.push({
      id: id('p'),
      type: 'paragraph',
      html: inlineMarkdownToHtml(text),
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === '') {
      flushParagraph();
      continue;
    }
    if (isHorizontalRule(line)) {
      flushParagraph();
      continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      flushParagraph();
      blocks.push({ id: id('h'), type: 'heading', level: 3, text: h3[1] });
      continue;
    }
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      flushParagraph();
      blocks.push({ id: id('h'), type: 'heading', level: 2, text: h2[1] });
      continue;
    }

    // Image alone on a line
    const img = parseImage(line);
    if (img) {
      flushParagraph();
      blocks.push({
        id: id('img'),
        type: 'image',
        src: img.src,
        alt: img.alt,
      });
      continue;
    }

    // Otherwise it's prose
    paragraphBuffer.push(line);
  }
  flushParagraph();

  return blocks;
}

// -- Per-post migration --------------------------------------------------

function readingTimeFor(blocks: Block[]): string {
  let words = 0;
  for (const b of blocks) {
    if (b.type === 'paragraph') words += b.html.split(/\s+/).length;
    if (b.type === 'heading') words += b.text.split(/\s+/).length;
    if (b.type === 'callout') words += b.html.split(/\s+/).length;
  }
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}

interface PostFrontmatter {
  title?: string;
  description?: string;
  publishedAt?: string;
  tags?: string[];
  cover?: string;
  draft?: boolean;
}

function migratePost(file: string): { slug: string; status: 'published' | 'draft' } {
  const slug = file.replace(/\.mdx$/, '');
  const filePath = path.join(POSTS_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;

  const blocks = markdownToBlocks(content);
  const metadata: ArticleMetadata = {
    slug,
    title: fm.title ?? slug,
    description: fm.description,
    date: fm.publishedAt ?? new Date().toISOString().slice(0, 10),
    readingTime: readingTimeFor(blocks),
    cover: fm.cover,
    tags: fm.tags ?? [],
    author: 'Thomas Budin',
    status: fm.draft ? 'draft' : 'published',
    publishedAt: fm.draft ? undefined : fm.publishedAt,
  };

  const outDir = path.join(ARTICLES_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(outDir, 'content.json'),
    JSON.stringify(blocks, null, 2),
    'utf8',
  );

  return { slug, status: metadata.status as 'published' | 'draft' };
}

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No content/posts/ directory; nothing to migrate.');
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
  if (files.length === 0) {
    console.log('No .mdx files found in content/posts/.');
    return;
  }

  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  console.log(`Migrating ${files.length} posts → content/articles/`);

  for (const file of files) {
    try {
      const { slug, status } = migratePost(file);
      console.log(`  ✓ ${slug}  (${status})`);
    } catch (err) {
      console.error(`  ✗ ${file}:`, err);
    }
  }
  console.log(
    `\nDone. Review content/articles/[slug]/{metadata,content}.json then ` +
      `delete content/posts/ once you're happy.`,
  );
}

main();
