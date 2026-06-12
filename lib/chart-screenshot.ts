/**
 * Headless-browser screenshot of a chart. Used by the publish flow to turn an
 * interactive Recharts chart into a static PNG for email.
 *
 * - Serverless (Vercel): puppeteer-core + @sparticuz/chromium.
 * - Local dev: puppeteer-core driving the system Chrome (`channel: 'chrome'`),
 *   or a binary at PUPPETEER_EXECUTABLE_PATH. No heavyweight `puppeteer` dep.
 *
 * Both deps are `serverExternalPackages` (see next.config) so the chromium
 * layer is never bundled.
 */

const VIEWPORT = { width: 1200, height: 900, deviceScaleFactor: 2 };

async function launch() {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_REGION;
  const puppeteer = (await import('puppeteer-core')).default;

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default;
    // The chromium binary isn't bundled (tracing it breaks the Turbopack
    // build). When CHROMIUM_PACK_URL is set, @sparticuz/chromium downloads and
    // extracts the pack to /tmp at runtime; otherwise it falls back to the
    // (likely absent) bundled bin and surfaces a clear error — the publish
    // flow never depends on this, and `pnpm chart:shots` is the local path.
    const packUrl = process.env.CHROMIUM_PACK_URL;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(packUrl),
      headless: true,
      defaultViewport: VIEWPORT,
    });
  }

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  return puppeteer.launch({
    headless: true,
    defaultViewport: VIEWPORT,
    ...(executablePath ? { executablePath } : { channel: 'chrome' }),
  });
}

/**
 * Navigate to `url`, wait for the chart to render, and screenshot the element
 * matching `selector` (default `#shot`). Returns a PNG buffer.
 */
export async function screenshotChart({
  url,
  selector = '#shot',
}: {
  url: string;
  selector?: string;
}): Promise<Buffer> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
    await page.waitForSelector(selector, { timeout: 15_000 });
    // Recharts renders synchronously (animations are disabled) but give the
    // layout a beat to settle so axes/labels are placed.
    await new Promise((r) => setTimeout(r, 700));
    const el = await page.$(selector);
    if (!el) throw new Error(`Chart element ${selector} not found`);
    const buf = (await el.screenshot({ type: 'png' })) as Buffer;
    return Buffer.from(buf);
  } finally {
    await browser.close();
  }
}
