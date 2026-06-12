/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the headless-chromium layer out of the bundle — loaded at runtime
  // by the chart-screenshot pipeline (lib/chart-screenshot.ts).
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'substackcdn.com' },
      { protocol: 'https', hostname: 'substack-post-media.s3.amazonaws.com' },
    ],
  },
  async redirects() {
    return [
      // Substack URL shape → new article URLs (for when the domain switches).
      { source: '/p/:slug', destination: '/articles/:slug', permanent: true },
      // Old internal /posts URLs → /articles (legacy compatibility during the
      // transition; safe to remove later).
      { source: '/posts', destination: '/articles', permanent: true },
      { source: '/posts/:slug', destination: '/articles/:slug', permanent: true },
    ];
  },
};

export default nextConfig;
