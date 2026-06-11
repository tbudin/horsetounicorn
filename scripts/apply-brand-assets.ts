/**
 * One-shot: take the brand assets in public/brand/ and place them where
 * Next.js auto-detects them:
 *   - Favicon  → app/icon.png   (512×512)
 *   - iOS icon → app/apple-icon.png   (180×180, resized)
 *   - OG card  → app/opengraph-image.png (1200×630)
 *   - Twitter  → app/twitter-image.png   (1200×630)
 *
 * Also removes the old programmatic stubs at app/opengraph-image.tsx and
 * app/twitter-image.tsx so Next picks up the static PNGs.
 *
 *   pnpm tsx scripts/apply-brand-assets.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

async function main() {
  const root = process.cwd();
  const brand = path.join(root, 'public', 'brand');
  const app = path.join(root, 'app');

  // 1. Favicon — Next will derive multiple sizes from the 512×512 source.
  await sharp(path.join(brand, 'htu-logo.png'))
    .resize(512, 512)
    .png()
    .toFile(path.join(app, 'icon.png'));
  console.log('  app/icon.png (512×512)');

  // 2. Apple touch icon — 180×180 for iOS home-screen.
  await sharp(path.join(brand, 'htu-logo.png'))
    .resize(180, 180)
    .png()
    .toFile(path.join(app, 'apple-icon.png'));
  console.log('  app/apple-icon.png (180×180)');

  // 3. OG / Twitter card. We DELETE the .tsx programmatic versions so Next
  //    picks up the static .png ones we're about to write.
  for (const stub of ['opengraph-image.tsx', 'twitter-image.tsx']) {
    const p = path.join(app, stub);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  rm app/${stub}`);
    }
  }

  // The brand meta-image is already 1200×630, so just copy.
  fs.copyFileSync(
    path.join(brand, 'htu-meta-image.png'),
    path.join(app, 'opengraph-image.png'),
  );
  console.log('  app/opengraph-image.png (1200×630)');
  fs.copyFileSync(
    path.join(brand, 'htu-meta-image.png'),
    path.join(app, 'twitter-image.png'),
  );
  console.log('  app/twitter-image.png (1200×630)');

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('apply-brand-assets failed:', err);
  process.exit(1);
});
