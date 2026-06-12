import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ADMIN_COOKIE, verifySession } from '@/lib/admin-auth';
import { signChartShotToken } from '@/lib/subscribe-tokens';
import { screenshotChart } from '@/lib/chart-screenshot';
import { saveChartImage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Headless Chromium cold start + render needs headroom.
export const maxDuration = 60;

const Body = z.object({
  articleId: z.string().regex(/^[0-9a-f-]{36}$/i),
  chart: z.string().regex(/^[a-z0-9-]+$/),
});

/**
 * Render one article chart to a PNG and store it. Returns the public URL.
 * Called from the publish composer's "Generate chart image" button. The send
 * path only ever references already-stored URLs, so a flaky render here never
 * blocks an email send.
 */
export async function POST(req: Request) {
  // This route bypasses the admin middleware (under /api), so verify the
  // session ourselves.
  const session = await verifySession((await cookies()).get(ADMIN_COOKIE)?.value ?? '');
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', detail: String(err) },
      { status: 400 },
    );
  }
  const { articleId, chart } = body;

  const token = await signChartShotToken(`${articleId}:${chart}`);
  // Screenshot the chart on the SAME host that served this request — works in
  // prod (canonical domain) and local dev (localhost:port) without config.
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto =
    req.headers.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https');
  const base = host ? `${proto}://${host}` : 'http://localhost:3000';
  const url = `${base}/chart-shot/${articleId}/${encodeURIComponent(chart)}?token=${encodeURIComponent(token)}`;

  let png: Buffer;
  try {
    png = await screenshotChart({ url });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Render failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  let publicUrl: string;
  try {
    publicUrl = await saveChartImage(articleId, chart, png);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Store failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  // Cache-bust so a re-render shows immediately in the composer.
  return NextResponse.json({ ok: true, url: `${publicUrl}?v=${Date.now()}`, chart });
}
