/**
 * One-shot cleanup over every article's metadata.json + content.json.
 *
 * 1. Strips `**` markdown bold markers from heading nodes (left over from
 *    the Substack export). Headings render as plain text, so the markers
 *    were showing up literally as "**Title**".
 * 2. Removes the trailing signature stanza ("Thanks for reading." / "There
 *    is no road." / "The road is made by walking." / "— Thomas" — in
 *    whatever combination each article has).
 * 3. Strips emoji characters from article titles + subtitles in
 *    metadata.json and from every heading node's text in content.json.
 *
 * Run with:
 *   pnpm tsx scripts/clean-article-content.ts            # apply
 *   pnpm tsx scripts/clean-article-content.ts --dry-run  # report only
 */
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry-run');

// Pieces of the trailing signature. We match each paragraph against this
// set (case-insensitive, trimmed, trailing punctuation tolerated) and
// drop matching paragraphs from the END of the article only.
const SIG_LINES = new Set(
  [
    'thanks for reading',
    'there is no road',
    'the road is made by walking',
    'there is no road. the road is made by walking',
    'wanderer, there is no road. the road is made by walking',
    'wanderer, there is no road. the road is made by walking. — thomas',
    'wanderer, there is no road. the road is made by walking. - thomas',
    '— thomas',
    '- thomas',
  ].map((s) => s.toLowerCase()),
);

// Match a wide range of emoji code points. Catches the ⛳ 📚 🧩 🧪 🌱 🐴 ➡ 🦄
// glyphs in the corpus + ZWJ + variation selectors.
const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F2FF}\u{1F900}-\u{1F9FF}\u{FE0F}\u{200D}]+/gu;

function stripEmoji(s: string): string {
  return s
    .replace(EMOJI_RE, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s.,:;!?-]+/, '')
    .trim();
}

function isSignatureText(raw: string): boolean {
  const t = raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '');
  if (!t) return false;
  if (SIG_LINES.has(t)) return true;
  // Tolerate a `— Thomas` baked at the end of the same paragraph.
  for (const line of SIG_LINES) {
    if (t === line) return true;
  }
  return false;
}

interface InlineNode {
  type: string;
  text?: string;
  marks?: { type: string }[];
}

interface DocNode {
  type: string;
  content?: (DocNode | InlineNode)[];
  attrs?: Record<string, unknown>;
}

function nodeText(node: DocNode | InlineNode): string {
  const n = node as DocNode;
  if (!n.content) return (node as InlineNode).text ?? '';
  return n.content.map(nodeText).join('');
}

function stripMarkersFromHeading(node: DocNode): boolean {
  // Walk text-bearing children and rewrite their `text` in place.
  let changed = false;
  function visit(n: DocNode | InlineNode) {
    const inline = n as InlineNode;
    if (typeof inline.text === 'string') {
      const before = inline.text;
      // Strip leading/trailing `**` pairs anywhere in the text.
      let next = before.replace(/\*\*(.+?)\*\*/g, '$1');
      // Then strip stray `**` that might remain (unbalanced from migration).
      next = next.replace(/\*\*/g, '');
      const after = stripEmoji(next);
      if (after !== before) {
        inline.text = after;
        changed = true;
      }
      return;
    }
    const compound = n as DocNode;
    if (compound.content) for (const c of compound.content) visit(c);
  }
  visit(node);
  return changed;
}

interface Stats {
  slug: string;
  titleStripped: boolean;
  subtitleStripped: boolean;
  headingsCleaned: number;
  signatureRemoved: number;
}

function processArticle(slug: string, dir: string): Stats {
  const stats: Stats = {
    slug,
    titleStripped: false,
    subtitleStripped: false,
    headingsCleaned: 0,
    signatureRemoved: 0,
  };

  // ---- metadata.json -------------------------------------------------
  const metaPath = path.join(dir, 'metadata.json');
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as {
      title?: string;
      subtitle?: string;
    };
    if (typeof meta.title === 'string') {
      const cleaned = stripEmoji(meta.title);
      if (cleaned !== meta.title) {
        meta.title = cleaned;
        stats.titleStripped = true;
      }
    }
    if (typeof meta.subtitle === 'string') {
      const cleaned = stripEmoji(meta.subtitle);
      if (cleaned !== meta.subtitle) {
        meta.subtitle = cleaned;
        stats.subtitleStripped = true;
      }
    }
    if (!DRY && (stats.titleStripped || stats.subtitleStripped)) {
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8');
    }
  }

  // ---- content.json --------------------------------------------------
  const contentPath = path.join(dir, 'content.json');
  if (fs.existsSync(contentPath)) {
    const doc = JSON.parse(fs.readFileSync(contentPath, 'utf8')) as {
      type: string;
      content?: DocNode[];
    };
    const nodes = doc.content ?? [];

    // 1. Heading cleanup
    for (const n of nodes) {
      if (n.type === 'heading') {
        if (stripMarkersFromHeading(n)) stats.headingsCleaned += 1;
      }
    }

    // 2. Signature paragraphs at the end
    while (nodes.length > 0) {
      const last = nodes[nodes.length - 1];
      if (last.type !== 'paragraph') break;
      const text = nodeText(last);
      if (isSignatureText(text)) {
        nodes.pop();
        stats.signatureRemoved += 1;
        continue;
      }
      break;
    }

    if (!DRY && (stats.headingsCleaned > 0 || stats.signatureRemoved > 0)) {
      fs.writeFileSync(contentPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
    }
  }

  return stats;
}

function main() {
  const articlesDir = path.join(process.cwd(), 'content', 'articles');
  if (!fs.existsSync(articlesDir)) {
    console.log('No content/articles/');
    return;
  }
  const slugs = fs
    .readdirSync(articlesDir)
    .filter((s) => fs.statSync(path.join(articlesDir, s)).isDirectory());

  const all: Stats[] = [];
  for (const slug of slugs) {
    const stats = processArticle(slug, path.join(articlesDir, slug));
    all.push(stats);
  }

  console.log(`${DRY ? '[DRY]' : '[APPLIED]'}`);
  for (const s of all) {
    const bits: string[] = [];
    if (s.titleStripped) bits.push('title');
    if (s.subtitleStripped) bits.push('subtitle');
    if (s.headingsCleaned) bits.push(`${s.headingsCleaned} heading(s)`);
    if (s.signatureRemoved) bits.push(`${s.signatureRemoved} sig paragraph(s)`);
    if (bits.length === 0) continue;
    console.log(`  ${s.slug}: ${bits.join(', ')}`);
  }
}

main();
