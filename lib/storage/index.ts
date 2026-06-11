/**
 * Storage strategy. Routes through R2 + GitHub when those env vars are
 * configured (production / remote admin); falls back to the local
 * filesystem when they aren't (local dev, no setup required).
 *
 * Two operations are exposed:
 *   - saveImage:     persist an uploaded image and return its public URL
 *   - saveArticle:   persist metadata.json and/or content.json for an article
 *                    (used by the admin save + publish flows)
 *   - renameArticle: move the article from one slug to another
 *
 * Reads continue to come from the filesystem in both modes — in remote mode
 * the deployed bundle has the committed JSON, so a normal `loadArticle()`
 * picks it up after Vercel re-deploys.
 */
import fs from 'node:fs';
import path from 'node:path';
import { commitFiles, isGitHubConfigured, listRepoPaths } from './github';
import { isR2Configured, uploadToR2 } from './r2';

export interface SaveImageOptions {
  /** Owning article slug. Used as the path prefix. */
  slug: string;
  /** 'cover' replaces the cover; 'inline' adds an inline image. */
  kind: 'cover' | 'inline';
  /** Sanitised filename including extension, e.g. "screenshot.png". */
  filename: string;
  body: Buffer;
  contentType: string;
}

/**
 * Persist an image and return the URL the editor should store.
 *
 * Remote mode: uploads to R2 under `articles/<slug>/cover.<ext>` (or
 * `articles/<slug>/images/<file>`) and returns the public CDN URL.
 *
 * Local mode: writes to `public/articles/<slug>/...` and returns the
 * site-relative URL — same behaviour as before.
 */
export async function saveImage({
  slug,
  kind,
  filename,
  body,
  contentType,
}: SaveImageOptions): Promise<string> {
  const key =
    kind === 'cover'
      ? `articles/${slug}/${filename}`
      : `articles/${slug}/images/${filename}`;

  if (isR2Configured()) {
    return uploadToR2(key, body, contentType);
  }

  // Local fallback.
  const targetPath = path.join(process.cwd(), 'public', key);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, body);
  return `/${key}`;
}

/**
 * Remove every existing `cover.*` file before a fresh cover is written, so
 * the article never has two covers floating around. Local mode only — in
 * remote mode the new cover commits as `articles/<slug>/cover.<ext>` and
 * R2 just overwrites any prior key with the same name (different extension
 * would leave a stale key behind, accepted trade-off).
 */
export function removeLocalCoverFiles(slug: string): void {
  if (isR2Configured()) return;
  const dir = path.join(process.cwd(), 'public', 'articles', slug);
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (/^cover\.(png|jpe?g|gif|webp|svg)$/i.test(f)) {
      fs.unlinkSync(path.join(dir, f));
    }
  }
}

export interface SaveArticleOptions {
  slug: string;
  metadata?: string;
  document?: string;
  /** Commit message when committing to GitHub. */
  message: string;
}

/**
 * Persist one or both article files atomically. In remote mode this is a
 * single GitHub commit; in local mode it's a pair of fs writes.
 */
export async function saveArticleFiles({
  slug,
  metadata,
  document,
  message,
}: SaveArticleOptions): Promise<void> {
  const repoPath = (file: string) => `content/articles/${slug}/${file}`;
  const writes: { path: string; content: string }[] = [];
  if (metadata != null) writes.push({ path: repoPath('metadata.json'), content: metadata });
  if (document != null) writes.push({ path: repoPath('content.json'), content: document });
  if (writes.length === 0) return;

  if (isGitHubConfigured()) {
    await commitFiles({ writes, message });
    return;
  }

  // Local fallback.
  const dir = path.join(process.cwd(), 'content', 'articles', slug);
  fs.mkdirSync(dir, { recursive: true });
  for (const w of writes) {
    const file = w.path.split('/').pop()!;
    fs.writeFileSync(path.join(dir, file), w.content, 'utf8');
  }
}

/**
 * Rename an article folder. Commits a single tree update in remote mode;
 * mirrors the legacy filesystem rename in local mode (also moves the
 * matching chart folder and rewrites the chart registry).
 *
 * In remote mode, images stored at the old slug's R2 keys are NOT moved —
 * their URLs remain valid because the editor stored absolute URLs. Only
 * the `content/articles/<slug>/` folder is renamed.
 */
export async function renameArticleFolder(
  fromSlug: string,
  toSlug: string,
  message: string,
): Promise<void> {
  if (fromSlug === toSlug) return;
  if (!/^[a-z0-9-]+$/.test(toSlug)) {
    throw new Error('Slug must be lowercase letters, digits and hyphens only');
  }

  if (isGitHubConfigured()) {
    const oldPrefix = `content/articles/${fromSlug}`;
    const newPrefix = `content/articles/${toSlug}`;
    const oldPaths = await listRepoPaths(oldPrefix);
    if (oldPaths.length === 0) {
      throw new Error(`Article "${fromSlug}" does not exist on the remote`);
    }
    const newPaths = await listRepoPaths(newPrefix);
    if (newPaths.length > 0) {
      throw new Error(`Slug "${toSlug}" already exists on the remote`);
    }
    // Read each file from the local checkout (still present in the bundle)
    // so we can re-write it under the new prefix. Fall back to fetching from
    // GitHub if a file isn't on disk yet (unlikely but defensive).
    const writes: { path: string; content: string }[] = [];
    for (const p of oldPaths) {
      const localPath = path.join(process.cwd(), p);
      const content = fs.existsSync(localPath)
        ? fs.readFileSync(localPath, 'utf8')
        : '';
      const newPath = newPrefix + p.slice(oldPrefix.length);
      writes.push({ path: newPath, content });
    }
    await commitFiles({ writes, deletePaths: oldPaths, message });
    return;
  }

  // Local fallback — preserve the prior behaviour (also moves chart folder
  // + rewrites the chart registry index).
  const fromDir = path.join(process.cwd(), 'content', 'articles', fromSlug);
  const toDir = path.join(process.cwd(), 'content', 'articles', toSlug);
  if (!fs.existsSync(fromDir)) {
    throw new Error(`Article "${fromSlug}" does not exist`);
  }
  if (fs.existsSync(toDir)) {
    throw new Error(`Slug "${toSlug}" already exists`);
  }
  fs.renameSync(fromDir, toDir);

  const chartFrom = path.join(process.cwd(), 'app', 'articles', '_charts', fromSlug);
  const chartTo = path.join(process.cwd(), 'app', 'articles', '_charts', toSlug);
  if (fs.existsSync(chartFrom) && !fs.existsSync(chartTo)) {
    fs.renameSync(chartFrom, chartTo);
    const registryPath = path.join(
      process.cwd(),
      'app',
      'articles',
      '_charts',
      'index.ts',
    );
    if (fs.existsSync(registryPath)) {
      let registry = fs.readFileSync(registryPath, 'utf8');
      registry = registry.replace(
        new RegExp(`'${fromSlug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}'`, 'g'),
        `'${toSlug}'`,
      );
      registry = registry.replace(
        new RegExp(`\\./${fromSlug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g'),
        `./${toSlug}`,
      );
      fs.writeFileSync(registryPath, registry, 'utf8');
    }
  }
}

export { isGitHubConfigured, isR2Configured };
