/**
 * Cloudflare R2 image storage. R2 is S3-compatible, so we just point the
 * AWS S3 client at the R2 endpoint.
 *
 * Required env:
 *   R2_ACCOUNT_ID          — Cloudflare account ID
 *   R2_ACCESS_KEY_ID       — R2 access key (Cloudflare → R2 → Manage API tokens)
 *   R2_SECRET_ACCESS_KEY   — R2 secret
 *   R2_BUCKET              — bucket name (e.g. "horsetounicorn-media")
 *   R2_PUBLIC_BASE_URL     — public base URL for objects (e.g.
 *                            "https://cdn.horsetounicorn.com"). Required so the
 *                            editor can store a CDN URL that the public site
 *                            renders. Set up via "Connect Custom Domain" in the
 *                            R2 dashboard, or the default
 *                            https://pub-<hash>.r2.dev domain (fine but ugly).
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 client requested but R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY env vars are missing',
    );
  }
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error('R2_BUCKET env var is missing');
  return bucket;
}

function getPublicBase(): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) throw new Error('R2_PUBLIC_BASE_URL env var is missing');
  return base.replace(/\/+$/, '');
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      // Cache for a year — image names are content-hashed by article uuid so
      // they don't change. Cover.png gets overwritten on re-upload; the CDN
      // cache will hold the old version briefly but bust within minutes.
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return `${getPublicBase()}/${key}`;
}

/** True when the env is configured to talk to R2. */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_BASE_URL
  );
}
