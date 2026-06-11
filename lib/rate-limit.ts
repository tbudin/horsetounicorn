/**
 * Per-key sliding-window rate limit. Backed by an in-memory Map — fine for
 * a single-instance blog where the only consumer is /api/subscribe. If we
 * ever scale to multiple regions or need cross-restart persistence we'll
 * swap in Vercel KV / Upstash.
 *
 *   const { ok, retryAt } = rateLimit('subscribe:' + ip, { max: 5, windowMs: 15 * 60_000 });
 *   if (!ok) return 429;
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function purgeIfFull() {
  // Cheap GC to keep the map bounded — runs once per ~200 unique keys.
  if (buckets.size < 200) return;
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
}

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAt?: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  purgeIfFull();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.max - 1 };
  }

  if (bucket.count >= opts.max) {
    return { ok: false, remaining: 0, retryAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { ok: true, remaining: opts.max - bucket.count };
}

/** Best-effort client IP from common proxy headers. */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
