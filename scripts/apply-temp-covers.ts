/**
 * One-shot: take every cover in public/temp/, centre-crop to 3:2, and save
 * to public/articles/<slug>/cover.png — overwriting whatever cover is there.
 * Then delete the temp folder.
 *
 *   pnpm tsx scripts/apply-temp-covers.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TARGET_RATIO = 3 / 2;

const MAPPING: Record<string, string> = {
  'htu0001-a.png': 'if-you-dont-choose-you-lose',
  'htu0002-a.png': 'what-the-walkman-can-teach-us-about',
  'htu0003-a.png': 'beyond-demographics-a-practical-guide',
  'htu0005-a.png': 'the-psychology-behind-pop-marts-success',
  'htu0006-a.png': 'the-blind-box-playbook-for-founders',
  'htu0007-a.png': 'i-only-understood-this-ai-product',
  'htu0008-a.png': 'early-life-nutrition',
};

async function cropTo3x2(input: string): Promise<Buffer> {
  const img = sharp(input, { failOnError: false });
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new Error(`Unreadable: ${input}`);
  const ratio = meta.width / meta.height;
  if (Math.abs(ratio - TARGET_RATIO) < 0.005) return img.toBuffer();
  let cropW: number;
  let cropH: number;
  if (ratio > TARGET_RATIO) {
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

async function main() {
  const tempDir = path.join(process.cwd(), 'public', 'temp');
  if (!fs.existsSync(tempDir)) {
    console.log('No public/temp/ — nothing to do.');
    return;
  }

  let done = 0;
  for (const [file, slug] of Object.entries(MAPPING)) {
    const src = path.join(tempDir, file);
    if (!fs.existsSync(src)) {
      console.warn(`  skip: ${file} not found in public/temp/`);
      continue;
    }
    const articleDir = path.join(process.cwd(), 'public', 'articles', slug);
    fs.mkdirSync(articleDir, { recursive: true });

    // Remove any prior cover.* so we never have two.
    for (const f of fs.readdirSync(articleDir)) {
      if (/^cover\.(png|jpe?g|gif|webp|svg)$/i.test(f)) {
        fs.unlinkSync(path.join(articleDir, f));
      }
    }
    const cropped = await cropTo3x2(src);
    const dest = path.join(articleDir, 'cover.png');
    fs.writeFileSync(dest, cropped);
    console.log(`  ${file} → /articles/${slug}/cover.png`);
    done++;
  }

  // Now delete the temp folder entirely.
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`\nApplied ${done} covers. Removed public/temp/.`);
}

main().catch((err) => {
  console.error('apply-temp-covers failed:', err);
  process.exit(1);
});
