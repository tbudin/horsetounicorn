import fs from 'node:fs';
import path from 'node:path';
import type { ArticleDocument } from './article-doc';

export type { ArticleDocument } from './article-doc';

// -- Article content model -----------------------------------------------
// Articles are stored as { metadata.json, content.json } in
// content/articles/[slug]/. The admin UI is the editor. The page.tsx for
// each article is a thin shell that reads these JSON files and renders the
// document.
//
// content.json contains an ArticleDocument (TipTap-compatible JSON tree).
// Legacy Block[] format is auto-converted on read for any unmigrated files
// — see migrateBlockArrayToDocument.

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'chart'
  | 'callout'
  | 'image';

interface BaseBlock {
  id: string;
  type: BlockType;
}

/** Plain prose. Stored as HTML so we can have <strong>, <em>, links inline. */
export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  html: string;
}

/** Section headings inside the article body. */
export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 2 | 3;
  text: string;
}

/**
 * Reference to a chart React component co-located with the article in
 * app/articles/[slug]/charts/[chartName].tsx. The block stores the file
 * name (kebab-case, no extension) and the page-level chart registry maps
 * names to imports.
 */
export interface ChartBlock extends BaseBlock {
  type: 'chart';
  chartName: string;
  caption?: string;
}

/** Pull-quote callout. */
export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  headline?: string;
  html: string;
}

/** Inline image with optional caption. */
export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | ChartBlock
  | CalloutBlock
  | ImageBlock;

// -- Metadata + status ---------------------------------------------------

export type ArticleStatus =
  | 'draft'
  | 'inner_circle_sent'
  | 'published'
  | 'archived';

export interface BroadcastRecord {
  id: string;
  sentAt?: string;
  scheduledFor?: string;
}

export interface ArticleMetadata {
  /**
   * Immutable UUID. Set once at creation, used to key every slug-
   * agnostic file path (folders, charts, R2 keys). Articles can rename
   * freely without ever touching this.
   */
  id: string;
  /** Current URL slug. Changes are tracked in `previousSlugs[]`. */
  slug: string;
  /**
   * Old slugs this article has been published under. Each one serves a
   * permanent 308 redirect to the current `slug`. Newest-first.
   */
  previousSlugs?: string[];
  title: string;
  subtitle?: string;
  /** One-line summary used in lists, OG tags, RSS. */
  description?: string;
  /** ISO date of intended publication. */
  date: string;
  readingTime?: string;
  /** Cover image URL (used in list views and OG cards). */
  cover?: string;
  /** Free-form tags. */
  tags?: string[];
  /** Display name of the author. Defaults to "Thomas Budin". */
  author?: string;

  status: ArticleStatus;
  publishedAt?: string;
  innerCircleSentAt?: string;

  broadcasts?: {
    innerCircle?: BroadcastRecord;
    main?: BroadcastRecord;
  };
}

// -- Filesystem loaders --------------------------------------------------

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');

function articleDir(id: string): string {
  return path.join(ARTICLES_DIR, id);
}

export interface LoadedArticle {
  metadata: ArticleMetadata;
  document: ArticleDocument;
}

/**
 * Slug → article resolution table. Built once, cached for the lifetime of
 * the process. Both the current slug and every previous slug map to the
 * article's id; the `isCurrent` flag tells routing whether to render the
 * page or 308 to the canonical URL.
 */
interface SlugIndex {
  bySlug: Map<string, { id: string; isCurrent: boolean }>;
  currentSlugById: Map<string, string>;
}

let _slugIndex: SlugIndex | null = null;

function buildSlugIndex(): SlugIndex {
  const bySlug = new Map<string, { id: string; isCurrent: boolean }>();
  const currentSlugById = new Map<string, string>();
  if (!fs.existsSync(ARTICLES_DIR)) return { bySlug, currentSlugById };
  for (const id of fs.readdirSync(ARTICLES_DIR)) {
    const metaPath = path.join(ARTICLES_DIR, id, 'metadata.json');
    if (!fs.existsSync(metaPath)) continue;
    const meta = JSON.parse(
      fs.readFileSync(metaPath, 'utf8'),
    ) as ArticleMetadata;
    if (!meta.id) continue; // unmigrated article — skip
    currentSlugById.set(meta.id, meta.slug);
    bySlug.set(meta.slug, { id: meta.id, isCurrent: true });
    for (const old of meta.previousSlugs ?? []) {
      if (!bySlug.has(old)) bySlug.set(old, { id: meta.id, isCurrent: false });
    }
  }
  return { bySlug, currentSlugById };
}

function getSlugIndex(): SlugIndex {
  if (!_slugIndex) _slugIndex = buildSlugIndex();
  return _slugIndex;
}

/** Force a refresh of the slug index — called after admin writes. */
export function invalidateSlugIndex(): void {
  _slugIndex = null;
}

/**
 * Resolve a URL slug to an article ID. Returns `null` for unknown slugs.
 * `isCurrent` is true for the article's live slug, false for any slug in
 * its `previousSlugs[]` history.
 */
export function resolveSlug(slug: string): {
  id: string;
  currentSlug: string;
  isCurrent: boolean;
} | null {
  const idx = getSlugIndex();
  const hit = idx.bySlug.get(slug);
  if (!hit) return null;
  const current = idx.currentSlugById.get(hit.id);
  if (!current) return null;
  return { id: hit.id, currentSlug: current, isCurrent: hit.isCurrent };
}

/** Load an article by its immutable UUID. Throws if not present. */
export function loadArticleById(id: string): LoadedArticle {
  const dir = articleDir(id);
  const metaPath = path.join(dir, 'metadata.json');
  const contentPath = path.join(dir, 'content.json');

  if (!fs.existsSync(metaPath) || !fs.existsSync(contentPath)) {
    throw new Error(
      `Article "${id}" is missing metadata.json or content.json in ${dir}`,
    );
  }

  const metadata = JSON.parse(
    fs.readFileSync(metaPath, 'utf8'),
  ) as ArticleMetadata;
  const raw = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

  // Legacy: block array → document
  let document: ArticleDocument;
  if (Array.isArray(raw)) {
    document = migrateBlockArrayToDocument(raw as Block[]);
  } else {
    document = raw as ArticleDocument;
  }

  return { metadata, document };
}

/**
 * Load an article by its current slug. Previous slugs throw — callers
 * that want redirect-on-old-slug behaviour should use `resolveSlug()`
 * first to check `isCurrent`, then `loadArticleById()`.
 */
export function loadArticle(slug: string): LoadedArticle {
  const resolved = resolveSlug(slug);
  if (!resolved) throw new Error(`Article "${slug}" not found`);
  if (!resolved.isCurrent) {
    throw new Error(
      `Article "${slug}" is a previous slug for "${resolved.currentSlug}"`,
    );
  }
  return loadArticleById(resolved.id);
}

/** List every article on disk (regardless of status). */
export function listArticles(): ArticleMetadata[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((name) => {
      const stat = fs.statSync(path.join(ARTICLES_DIR, name));
      return (
        stat.isDirectory() &&
        fs.existsSync(path.join(ARTICLES_DIR, name, 'metadata.json'))
      );
    })
    .map((id) => loadArticleById(id).metadata)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** List articles that are publicly visible (status === 'published'). */
export function listPublishedArticles(): ArticleMetadata[] {
  return listArticles().filter((a) => a.status === 'published');
}

// -- Filesystem writers (used by admin API routes) -----------------------

export function saveMetadata(slug: string, metadata: ArticleMetadata): void {
  const dir = articleDir(slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf8',
  );
}

export function saveBlocks(slug: string, blocks: Block[]): void {
  const dir = articleDir(slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'content.json'),
    JSON.stringify(blocks, null, 2),
    'utf8',
  );
}

/** Save the article document (TipTap JSON). */
export function saveDocument(slug: string, doc: ArticleDocument): void {
  const dir = articleDir(slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'content.json'),
    JSON.stringify(doc, null, 2),
    'utf8',
  );
}

// -- Legacy block → document migration ---------------------------------

/**
 * Convert the old Block[] format to the new ArticleDocument. Used when
 * loading articles whose content.json hasn't been migrated yet, and by
 * the one-off migration script.
 */
export function migrateBlockArrayToDocument(blocks: Block[]): ArticleDocument {
  // Parse HTML strings to TipTap inline content using a minimal walker —
  // we don't run the full TipTap parser at request time because it's a
  // heavy client dep. The migration handles paragraphs, bold, italic,
  // links, and inline strong/em that we know our source uses.
  const content: ArticleDocument['content'] = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'paragraph':
        content.push({ type: 'paragraph', content: htmlToInline(b.html) });
        break;
      case 'heading':
        content.push({
          type: 'heading',
          attrs: { level: b.level },
          content: [{ type: 'text', text: b.text }],
        });
        break;
      case 'chart':
        content.push({
          type: 'chart',
          attrs: { chartName: b.chartName, caption: b.caption ?? null },
        });
        break;
      case 'callout':
        content.push({
          type: 'callout',
          attrs: { headline: b.headline ?? null },
          // Wrap the html as a single paragraph inside the callout
          content: [{ type: 'paragraph', content: htmlToInline(b.html) }],
        });
        break;
      case 'image':
        content.push({
          type: 'image',
          attrs: {
            src: b.src,
            alt: b.alt,
            caption: b.caption ?? null,
          },
        });
        break;
    }
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'doc', content };
}

/** Very small HTML → TipTap inline parser. Handles <strong>, <em>, <a>. */
function htmlToInline(html: string): InlineNode[] {
  type Mark = NonNullable<TextNode['marks']>[number];
  const out: InlineNode[] = [];
  // Strip wrapping <p> tags from callout bodies
  let s = html.replace(/^\s*<p>/i, '').replace(/<\/p>\s*$/i, '');
  // Decode common entities
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
  const re = /<(\/?)(strong|em|i|b|a)(?:\s+href="([^"]+)")?[^>]*>|([^<]+)/gi;
  const stack: Mark[][] = [[]];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const [, close, tag, href, text] = m;
    if (text) {
      const marks = stack[stack.length - 1];
      out.push(
        marks.length
          ? { type: 'text', text, marks: [...marks] }
          : { type: 'text', text },
      );
    } else if (tag) {
      const t = tag.toLowerCase();
      const mark: Mark | null =
        t === 'strong' || t === 'b'
          ? { type: 'bold' }
          : t === 'em' || t === 'i'
            ? { type: 'italic' }
            : t === 'a' && href
              ? { type: 'link', attrs: { href, target: '_blank' } }
              : null;
      if (!mark) continue;
      if (close) {
        // pop matching
        const current = stack[stack.length - 1];
        const idx = current.findLastIndex((mm) => mm.type === mark.type);
        if (idx >= 0) {
          const next = current.slice(0, idx).concat(current.slice(idx + 1));
          stack.pop();
          stack.push(next);
        }
      } else {
        const current = stack[stack.length - 1];
        stack.pop();
        stack.push([...current, mark]);
      }
    }
  }
  if (out.length === 0) return [];
  return out;
}

// Re-export inline types used by the migrator
import type { InlineNode, TextNode } from './article-doc';

/**
 * Rename an article on disk. Also renames the matching chart folder so the
 * dynamic registry keeps working. Throws if the target slug is already
 * taken, or if the source doesn't exist.
 */
export function renameArticle(fromSlug: string, toSlug: string): void {
  if (fromSlug === toSlug) return;
  if (!/^[a-z0-9-]+$/.test(toSlug)) {
    throw new Error('Slug must be lowercase letters, digits and hyphens only');
  }
  const fromDir = articleDir(fromSlug);
  const toDir = articleDir(toSlug);
  if (!fs.existsSync(fromDir)) {
    throw new Error(`Article "${fromSlug}" does not exist`);
  }
  if (fs.existsSync(toDir)) {
    throw new Error(`Slug "${toSlug}" already exists`);
  }
  fs.renameSync(fromDir, toDir);

  // Move chart folder if any
  const chartFrom = path.join(
    process.cwd(),
    'app',
    'articles',
    '_charts',
    fromSlug,
  );
  const chartTo = path.join(
    process.cwd(),
    'app',
    'articles',
    '_charts',
    toSlug,
  );
  if (fs.existsSync(chartFrom) && !fs.existsSync(chartTo)) {
    fs.renameSync(chartFrom, chartTo);
    // Also update the chart registry index so the dynamic loader still finds it.
    const registryPath = path.join(
      process.cwd(),
      'app',
      'articles',
      '_charts',
      'index.ts',
    );
    if (fs.existsSync(registryPath)) {
      let registry = fs.readFileSync(registryPath, 'utf8');
      // Replace 'fromSlug' as a single-quoted key
      registry = registry.replace(
        new RegExp(`'${fromSlug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}'`, 'g'),
        `'${toSlug}'`,
      );
      // Replace ./fromSlug path
      registry = registry.replace(
        new RegExp(`\\./${fromSlug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g'),
        `./${toSlug}`,
      );
      fs.writeFileSync(registryPath, registry, 'utf8');
    }
  }
}

/**
 * List chart names (kebab-case, no extension) available for a given article
 * slug. Reads app/articles/_charts/[slug]/ directly. Used by the editor's
 * chart-block picker.
 */
export function listChartsForSlug(slug: string): string[] {
  const dir = path.join(process.cwd(), 'app', 'articles', '_charts', slug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => f.replace(/\.tsx$/, ''))
    .sort();
}
