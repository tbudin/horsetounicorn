/**
 * One-shot: download every remote cover + inline image referenced by the
 * articles, centre-crop to a 3:2 aspect ratio, save into
 * `public/articles/[slug]/` and rewrite the article's metadata.json /
 * content.json to point at the new local URLs.
 *
 * Already-local URLs (anything starting with `/`) are skipped, so the
 * script is idempotent — safe to re-run as new remote URLs land.
 *
 *   pnpm tsx scripts/recrop-images.ts            # crop + rewrite
 *   pnpm tsx scripts/recrop-images.ts --dry-run  # report only, no writes
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DRY = process.argv.includes('--dry-run');
const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content', 'articles');
const PUBLIC_DIR = path.join(ROOT, 'public', 'articles');

const TARGET_RATIO = 3 / 2; // width / height

function log(msg: string) {
  // eslint-disable-next-line no-console
  console.log(msg);
}

/** Pull the substack image hash + original extension out of a fetch URL. */
function deriveBasename(url: string, fallback: string): { stem: string; ext: string } {
  // Substack URLs URL-encode the original S3 path, e.g.
  //   .../%2Fimages%2F3e97de4d-add7-426b-99bb-b1add70b7a53_1495x890.png
  // Decode first, then match a proper UUID + dimensions + ext.
  const decoded = (() => {
    try { return decodeURIComponent(url); } catch { return url; }
  })();
  const uuid = decoded.match(
    /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:_\d+x\d+)?\.(png|jpe?g|gif|webp|svg)/i,
  );
  if (uuid) {
    const ext = '.' + uuid[2].toLowerCase().replace('jpeg', 'jpg');
    return { stem: uuid[1], ext };
  }
  // Last-resort: just the trailing filename.
  const tail = decoded.match(/([\w-]+)\.(png|jpe?g|gif|webp|svg)(?:\?|$)/i);
  if (tail) {
    return { stem: tail[1], ext: '.' + tail[2].toLowerCase().replace('jpeg', 'jpg') };
  }
  return { stem: fallback, ext: '.jpg' };
}

async function fetchBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

/**
 * Centre-crop the buffer to a 3:2 frame. Uses sharp's `cover` resize +
 * attention crop so the focal area is preserved when possible. SVGs are
 * passed through untouched.
 */
async function cropTo3x2(buf: Buffer, ext: string): Promise<Buffer> {
  if (ext === '.svg') return buf;
  const img = sharp(buf, { failOnError: false });
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error('Could not read image metadata');

  const sourceRatio = meta.width / meta.height;
  let cropW: number;
  let cropH: number;
  if (sourceRatio > TARGET_RATIO) {
    // Source wider than 3:2 → crop the sides.
    cropH = meta.height;
    cropW = Math.round(cropH * TARGET_RATIO);
  } else {
    // Source taller than 3:2 → crop the top/bottom.
    cropW = meta.width;
    cropH = Math.round(cropW / TARGET_RATIO);
  }
  const left = Math.round((meta.width - cropW) / 2);
  const top = Math.round((meta.height - cropH) / 2);
  return img.extract({ left, top, width: cropW, height: cropH }).toBuffer();
}

interface RewriteStat {
  slug: string;
  covers: number;
  inlines: number;
}

async function processCover(slug: string): Promise<number> {
  const metaPath = path.join(CONTENT_DIR, slug, 'metadata.json');
  if (!fs.existsSync(metaPath)) return 0;
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { cover?: string };
  if (!meta.cover || meta.cover.startsWith('/')) return 0;

  const { ext } = deriveBasename(meta.cover, 'cover');
  log(`  cover  ${meta.cover.slice(0, 80)}…`);

  if (DRY) {
    log(`    (dry-run) would save → /articles/${slug}/cover${ext}`);
    return 1;
  }

  const raw = await fetchBuffer(meta.cover);
  const cropped = await cropTo3x2(raw, ext);
  const articleDir = path.join(PUBLIC_DIR, slug);
  fs.mkdirSync(articleDir, { recursive: true });
  // Remove any prior cover.* so we never have two.
  for (const f of fs.readdirSync(articleDir)) {
    if (/^cover\.(png|jpe?g|gif|webp|svg)$/i.test(f)) {
      fs.unlinkSync(path.join(articleDir, f));
    }
  }
  const localPath = path.join(articleDir, `cover${ext}`);
  fs.writeFileSync(localPath, cropped);
  const newCover = `/articles/${slug}/cover${ext}`;
  meta.cover = newCover;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  log(`    → ${newCover}`);
  return 1;
}

/** Walk the TipTap document tree, mutating image src attrs in place. */
async function processInlineImages(slug: string): Promise<number> {
  const contentPath = path.join(CONTENT_DIR, slug, 'content.json');
  if (!fs.existsSync(contentPath)) return 0;
  const doc = JSON.parse(fs.readFileSync(contentPath, 'utf8')) as {
    content?: unknown[];
  };

  let count = 0;
  const imagesDir = path.join(PUBLIC_DIR, slug, 'images');
  const seen = new Map<string, string>();

  async function walk(node: unknown): Promise<void> {
    if (!node || typeof node !== 'object') return;
    const n = node as {
      type?: string;
      attrs?: { src?: string };
      content?: unknown[];
    };
    if (n.type === 'image' && n.attrs?.src && !n.attrs.src.startsWith('/')) {
      const src = n.attrs.src;
      if (seen.has(src)) {
        n.attrs.src = seen.get(src)!;
        return;
      }
      const { stem, ext } = deriveBasename(src, `image-${count + 1}`);
      const filename = `${stem}${ext}`;
      log(`  image  ${src.slice(0, 80)}…`);
      if (DRY) {
        log(`    (dry-run) would save → /articles/${slug}/images/${filename}`);
        n.attrs.src = `/articles/${slug}/images/${filename}`;
        seen.set(src, n.attrs.src);
        count++;
        return;
      }
      const raw = await fetchBuffer(src);
      const cropped = await cropTo3x2(raw, ext);
      fs.mkdirSync(imagesDir, { recursive: true });
      fs.writeFileSync(path.join(imagesDir, filename), cropped);
      const newSrc = `/articles/${slug}/images/${filename}`;
      n.attrs.src = newSrc;
      seen.set(src, newSrc);
      log(`    → ${newSrc}`);
      count++;
    }
    if (Array.isArray(n.content)) {
      for (const child of n.content) await walk(child);
    }
  }

  if (Array.isArray(doc.content)) {
    for (const node of doc.content) await walk(node);
  }

  if (count > 0 && !DRY) {
    fs.writeFileSync(contentPath, JSON.stringify(doc, null, 2) + '\n');
  }
  return count;
}

async function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    log(`No content directory at ${CONTENT_DIR}`);
    return;
  }
  const slugs = fs
    .readdirSync(CONTENT_DIR)
    .filter((s) =>
      fs.statSync(path.join(CONTENT_DIR, s)).isDirectory() &&
      fs.existsSync(path.join(CONTENT_DIR, s, 'metadata.json')),
    );

  const stats: RewriteStat[] = [];
  for (const slug of slugs) {
    log(`\n▸ ${slug}`);
    const covers = await processCover(slug);
    const inlines = await processInlineImages(slug);
    stats.push({ slug, covers, inlines });
  }

  log(`\nDone${DRY ? ' (dry-run)' : ''}.`);
  const totalCovers = stats.reduce((s, x) => s + x.covers, 0);
  const totalInline = stats.reduce((s, x) => s + x.inlines, 0);
  log(`  ${totalCovers} cover image(s) processed`);
  log(`  ${totalInline} inline image(s) processed`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('\nrecrop-images failed:', err);
  process.exit(1);
});
