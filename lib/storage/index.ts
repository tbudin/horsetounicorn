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
import { commitFiles, isGitHubConfigured } from './github';
import { isR2Configured, uploadToR2 } from './r2';

export interface SaveImageOptions {
  /** Owning article id (UUID). Becomes the storage path prefix. */
  articleId: string;
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
  articleId,
  kind,
  filename,
  body,
  contentType,
}: SaveImageOptions): Promise<string> {
  const key =
    kind === 'cover'
      ? `articles/${articleId}/${filename}`
      : `articles/${articleId}/images/${filename}`;

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
 * remote mode the new cover commits as `articles/<id>/cover.<ext>` and
 * R2 just overwrites any prior key with the same name (different extension
 * would leave a stale key behind, accepted trade-off).
 */
export function removeLocalCoverFiles(articleId: string): void {
  if (isR2Configured()) return;
  const dir = path.join(process.cwd(), 'public', 'articles', articleId);
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (/^cover\.(png|jpe?g|gif|webp|svg)$/i.test(f)) {
      fs.unlinkSync(path.join(dir, f));
    }
  }
}

/**
 * Persist a generated chart PNG and return its public URL. Stored under
 * `articles/<articleId>/charts/<chartName>.png` so the publish composer can
 * reference it. R2 in remote mode, public/ filesystem locally.
 */
export async function saveChartImage(
  articleId: string,
  chartName: string,
  body: Buffer,
): Promise<string> {
  const key = `articles/${articleId}/charts/${chartName}.png`;
  if (isR2Configured()) {
    return uploadToR2(key, body, 'image/png');
  }
  const targetPath = path.join(process.cwd(), 'public', key);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, body);
  return `/${key}`;
}

export interface SaveArticleOptions {
  articleId: string;
  metadata?: string;
  document?: string;
  /** Commit message when committing to GitHub. */
  message: string;
}

/**
 * Persist one or both article files atomically. In remote mode this is a
 * single GitHub commit; in local mode it's a pair of fs writes.
 *
 * Because every article folder is now keyed by its immutable id, slug
 * changes are pure metadata edits — no folder moves, no image-URL
 * rewrites, no chart-registry updates. The old `renameArticleFolder()`
 * is gone for that reason.
 */
export async function saveArticleFiles({
  articleId,
  metadata,
  document,
  message,
}: SaveArticleOptions): Promise<void> {
  const repoPath = (file: string) => `content/articles/${articleId}/${file}`;
  const writes: { path: string; content: string }[] = [];
  if (metadata != null) writes.push({ path: repoPath('metadata.json'), content: metadata });
  if (document != null) writes.push({ path: repoPath('content.json'), content: document });
  if (writes.length === 0) return;

  if (isGitHubConfigured()) {
    await commitFiles({ writes, message });
    return;
  }

  // Local fallback.
  const dir = path.join(process.cwd(), 'content', 'articles', articleId);
  fs.mkdirSync(dir, { recursive: true });
  for (const w of writes) {
    const file = w.path.split('/').pop()!;
    fs.writeFileSync(path.join(dir, file), w.content, 'utf8');
  }
}

export { isGitHubConfigured, isR2Configured };
