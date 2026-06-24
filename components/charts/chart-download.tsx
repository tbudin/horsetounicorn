'use client';

/**
 * Per-chart PNG download, shared by every ChartCard across every article.
 *
 * Public articles render the default context (watermark on): one "Download
 * PNG" button that stamps the site URL into the corner. The admin article
 * preview wraps its charts in <ChartDownloadProvider allowUnwatermarked> to
 * additionally offer a clean, watermark-free export.
 *
 * The button finds its enclosing card via `closest('[data-chart-card]')`,
 * rasterises it with html-to-image (excluding the buttons and any toolbar),
 * optionally stamps the watermark onto the canvas, then downloads the PNG.
 */

import { createContext, useContext, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ChartDownloadContext = createContext<{ allowUnwatermarked: boolean }>({
  allowUnwatermarked: false,
});

export function ChartDownloadProvider({
  allowUnwatermarked = false,
  children,
}: {
  allowUnwatermarked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ChartDownloadContext.Provider value={{ allowUnwatermarked }}>
      {children}
    </ChartDownloadContext.Provider>
  );
}

function useChartDownload() {
  return useContext(ChartDownloadContext);
}

function siteHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://horsetounicorn.com';
  try {
    return new URL(raw).host;
  } catch {
    return 'horsetounicorn.com';
  }
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'chart'
  );
}

function stampWatermark(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const pad = Math.round(canvas.width * 0.012) + 10;
  const fs = Math.max(15, Math.round(canvas.width * 0.016));
  ctx.font = `600 ${fs}px var(--font-roboto), ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(158, 10, 113, 0.62)'; // burgundy, semi-transparent
  ctx.fillText(siteHost(), canvas.width - pad, canvas.height - pad);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ChartDownloadButton({ title }: { title: string }) {
  const { allowUnwatermarked } = useChartDownload();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'wm' | 'clean' | null>(null);

  async function run(watermark: boolean) {
    const card = ref.current?.closest('[data-chart-card]') as HTMLElement | null;
    if (!card || busy) return;
    setBusy(watermark ? 'wm' : 'clean');
    try {
      const { toCanvas } = await import('html-to-image');
      const canvas = await toCanvas(card, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        // Keep everything except the download buttons and interactive toolbars.
        filter: (node) => {
          const el = node as HTMLElement;
          return !(
            el?.dataset &&
            (el.dataset.noExport !== undefined ||
              el.dataset.chartToolbar !== undefined)
          );
        },
      });
      if (watermark) stampWatermark(canvas);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (blob) {
        triggerDownload(blob, `${slugify(title)}${watermark ? '' : '-clean'}.png`);
      }
    } catch {
      /* a failed export should never break the page */
    } finally {
      setBusy(null);
    }
  }

  const base =
    'inline-flex h-7 items-center gap-1 rounded-md border border-[#EEE6EC] bg-white/85 px-2 text-[11px] text-ink-subtle backdrop-blur transition-colors hover:border-burgundy hover:text-burgundy disabled:opacity-50';
  const Icon = (on: boolean) =>
    on ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />;

  return (
    <div ref={ref} data-no-export className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={() => run(true)}
        disabled={busy !== null}
        title="Download PNG"
        aria-label="Download chart as PNG"
        className={cn(base, allowUnwatermarked && 'px-2')}
      >
        {Icon(busy === 'wm')}
        {allowUnwatermarked ? 'PNG' : null}
      </button>
      {allowUnwatermarked ? (
        <button
          type="button"
          onClick={() => run(false)}
          disabled={busy !== null}
          title="Download PNG without watermark"
          className={base}
        >
          {Icon(busy === 'clean')}
          clean
        </button>
      ) : null}
    </div>
  );
}
