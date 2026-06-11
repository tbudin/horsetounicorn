import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  isR2Configured,
  removeLocalCoverFiles,
  saveImage,
} from '@/lib/storage';

const ALLOWED_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const TARGET_RATIO = 3 / 2;

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

/**
 * Centre-crop a raster image buffer to 3:2. SVGs (vector) and GIFs
 * (animated, hard to crop cleanly with sharp) are passed through.
 */
async function cropTo3x2(buf: Buffer, ext: string): Promise<Buffer> {
  if (ext === '.svg' || ext === '.gif') return buf;
  const img = sharp(buf, { failOnError: false });
  const meta = await img.metadata();
  if (!meta.width || !meta.height) return buf;
  const sourceRatio = meta.width / meta.height;
  if (Math.abs(sourceRatio - TARGET_RATIO) < 0.005) return buf; // already 3:2
  let cropW: number;
  let cropH: number;
  if (sourceRatio > TARGET_RATIO) {
    cropH = meta.height;
    cropW = Math.round(cropH * TARGET_RATIO);
  } else {
    cropW = meta.width;
    cropH = Math.round(cropW / TARGET_RATIO);
  }
  const left = Math.round((meta.width - cropW) / 2);
  const top = Math.round((meta.height - cropH) / 2);
  return img.extract({ left, top, width: cropW, height: cropH }).toBuffer();
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueLocalFilename(dir: string, desired: string): string {
  if (!fs.existsSync(path.join(dir, desired))) return desired;
  const ext = path.extname(desired);
  const stem = desired.slice(0, desired.length - ext.length);
  for (let i = 2; i < 1000; i++) {
    const candidate = `${stem}-${i}${ext}`;
    if (!fs.existsSync(path.join(dir, candidate))) return candidate;
  }
  return `${stem}-${Date.now()}${ext}`;
}

/**
 * Admin image upload.
 *
 * multipart/form-data:
 *   articleId — owning article id (UUID)
 *   kind      — 'inline' (default) or 'cover'
 *   file      — the image
 *
 * Cropped to 3:2 (raster) and persisted via `lib/storage/saveImage`. In
 * production (R2 env vars set) the image lands in the bucket and a CDN URL
 * is returned. Locally it lands in /public/articles/[articleId]/.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const form = await req.formData();
  const articleId = form.get('articleId');
  const kind = (form.get('kind') as string | null) ?? 'inline';
  const file = form.get('file');

  if (typeof articleId !== 'string' || !UUID_RE.test(articleId)) {
    return NextResponse.json({ ok: false, error: 'Invalid articleId' }, { status: 400 });
  }
  if (kind !== 'inline' && kind !== 'cover') {
    return NextResponse.json(
      { ok: false, error: 'Invalid kind (expected inline or cover)' },
      { status: 400 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'No file uploaded' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 413 },
    );
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json(
      { ok: false, error: `Unsupported extension: ${ext}` },
      { status: 415 },
    );
  }

  const original = Buffer.from(await file.arrayBuffer());
  const buffer = await cropTo3x2(original, ext);

  let filename: string;
  if (kind === 'cover') {
    // Locally we delete any prior cover.* so a re-upload with a different
    // extension doesn't leave a stale file. Remote bucket overwrites the
    // same key — a different extension would leave the old key behind, but
    // that's a niche corner-case.
    removeLocalCoverFiles(articleId);
    filename = `cover${ext}`;
  } else {
    const baseName = sanitizeFilename(file.name) || `image${ext}`;
    if (isR2Configured()) {
      // Remote mode: prefix with a timestamp so re-uploads of the same name
      // don't collide.
      const stem = baseName.slice(0, baseName.length - path.extname(baseName).length);
      const finalExt = path.extname(baseName) || ext;
      filename = `${Date.now().toString(36)}-${stem}${finalExt}`;
    } else {
      // Local mode: dedup by suffixing -2, -3, …
      const dir = path.join(process.cwd(), 'public', 'articles', articleId, 'images');
      fs.mkdirSync(dir, { recursive: true });
      filename = uniqueLocalFilename(dir, baseName);
    }
  }

  const publicUrl = await saveImage({
    articleId,
    kind,
    filename,
    body: buffer,
    contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
  });

  return NextResponse.json({
    ok: true,
    url: publicUrl,
    filename,
    bytes: buffer.length,
    kind,
  });
}
