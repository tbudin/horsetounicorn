# Horse to Unicorn

The blog at [horsetounicorn.com](https://horsetounicorn.com), rebuilt off Substack.

Next.js 15 (App Router) + TypeScript, MDX posts, Recharts for interactive charts,
Resend for email (subscribe + per-post broadcasts), Tailwind + shadcn/ui.

## Quick start

```bash
pnpm install
cp .env.example .env  # fill in Resend keys (see below)
pnpm dev              # http://localhost:3000
```

Build:

```bash
pnpm build && pnpm start
```

Typecheck / lint:

```bash
pnpm typecheck
pnpm lint
```

## Environment

Required env vars (see [.env.example](.env.example)):

| Var | What |
| --- | --- |
| `RESEND_API_KEY` | From <https://resend.com/api-keys> |
| `RESEND_AUDIENCE_ID` | Create an audience at <https://resend.com/audiences>, paste the UUID |
| `EMAIL_FROM` | A verified sender on Resend, e.g. `"Tom @ Horse to Unicorn <hello@horsetounicorn.com>"` |
| `EMAIL_REPLY_TO` | Optional reply-to |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (used in emails, RSS, OG tags) |
| `PUBLISH_SECRET` | Random string protecting `/api/publish`. Generate with `openssl rand -hex 32` |

## Two content types

The site has two content surfaces:

- **`/posts`** — weekly MDX pieces (Substack-style). Source: `content/posts/*.mdx`. Use for short opinion / analysis pieces.
- **`/articles`** — long-form data essays with interactive charts and datasets. Source: `app/articles/[slug]/`. Use when an essay needs full React control, multiple charts, or its own dataset.

Both share the same brand tokens (`text-ink-heading`, `bg-burgundy`, etc.), chart primitives (`components/charts/`), and helpers (`lib/format.ts`, `lib/chart-colors.ts`).

## Writing a post (MDX, weekly)

1. Create `content/posts/your-slug.mdx`:

   ```mdx
   ---
   title: "Your post title"
   description: "One sentence that shows up on the home page and in the OG card."
   publishedAt: "2026-05-30"
   tags: ["marketing", "ops"]
   draft: false
   ---

   Your markdown here.
   ```

2. Drop in any registered MDX component:

   ```mdx
   <ChartCard title="Acquisition by channel" source="Internal analytics, Q1 2026">
     <ExampleBarChart
       data={[
         { label: 'Organic', value: 42 },
         { label: 'Paid', value: 18 },
         { label: 'Direct', value: 27 },
       ]}
       yLabel="% of new signups"
     />
   </ChartCard>

   <Callout variant="tip" title="Why this matters">
     Long-form aside that needs to stand out.
   </Callout>
   ```

3. `pnpm dev` to preview, push to ship.

Set `draft: true` to hide from the home page and RSS while keeping the post
URL working (useful for sharing a preview link).

## Writing an article (TSX, long-form data essay)

1. Create a folder under `app/articles/your-slug/` with a `page.tsx`:

   ```tsx
   import type { Metadata } from 'next';
   import { ArticleLayout } from '@/components/article/article-layout';
   import { Callout } from '@/components/article/callout';
   import MyChart from './charts/my-chart';

   export const metadata: Metadata = {
     title: 'Your article',
     description: '…',
   };

   export default function Article() {
     return (
       <ArticleLayout
         title="Your article"
         subtitle="…"
         date="2026-06-01"
         readingTime="10 min read"
       >
         <p>Body prose as JSX.</p>
         <MyChart />
         <Callout headline="Pull-quote">…</Callout>
       </ArticleLayout>
     );
   }
   ```

2. Co-locate charts in `app/articles/your-slug/charts/*.tsx`. Each chart is a
   client component that uses `ChartCard` + `ChartContainer` from
   `@/components/charts/`.

3. **Datasets**: put raw CSVs in `content/articles/your-slug/data/`, then run
   `pnpm data` — it walks every CSV and emits typed JSON to
   `public/data/your-slug/*.json` (gitignored). Charts fetch or import the
   JSON.

4. Add the article to the index list in
   [`app/articles/page.tsx`](app/articles/page.tsx). Set `draft: true` to keep
   it out of the list while you write — the URL still works for previews.

## Adding a new interactive chart

Charts are React components in [`components/charts/`](components/charts/). To make
one usable from MDX:

1. Create `components/charts/my-chart.tsx`. Start the file with `'use client'`
   (Recharts needs the browser).
2. Import brand colors from [`lib/chart-colors.ts`](lib/chart-colors.ts). Use
   `BURGUNDY` as the primary series color, lighter tints for secondary series.
3. Register it in
   [`components/mdx-components.tsx`](components/mdx-components.tsx):

   ```ts
   import { MyChart } from '@/components/charts/my-chart';

   export const mdxComponents = {
     // …
     MyChart,
   };
   ```

4. Use it in any MDX file: `<MyChart data={…} />`. Wrap it in `<ChartCard>` for
   the framed look with title + source line.

[`components/charts/example-bar-chart.tsx`](components/charts/example-bar-chart.tsx)
and `example-line-chart.tsx` are reference implementations. They show the
default conventions: dashed grid (`#E8E8E8`, `3 3`), Roboto Mono tick labels,
`isAnimationActive={false}`, INK axis lines, 6%-alpha tooltip cursor.

## Subscribe flow

`/api/subscribe` is called by the form on the home and about pages. It:

1. Validates the email (zod).
2. Adds the address to your Resend Audience (`RESEND_AUDIENCE_ID`).
3. Sends a welcome email if this is a new contact.

If the same address tries to subscribe twice, Resend reports "already a
contact" and we silently succeed without re-sending the welcome email.

## Sending a post as a newsletter

There are two ways:

**A — CLI (recommended for now):**

```bash
pnpm broadcast your-post-slug          # create a draft on Resend
pnpm broadcast your-post-slug --send   # create AND send to the audience
```

This uses [`scripts/broadcast-post.ts`](scripts/broadcast-post.ts) and reads
`.env` directly. The broadcast email links to the live post — charts stay
interactive on the site.

**B — HTTP (for automation/deploy hooks):**

```bash
curl -X POST https://horsetounicorn.com/api/publish \
  -H "Authorization: Bearer $PUBLISH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "slug": "your-post-slug", "send": true }'
```

If you don't want this to be Substack-style auto-send-on-publish, leave
`send: false` (the default). The broadcast lands in your Resend dashboard as a
draft you can review and send manually.

The email template lives in
[`emails/post-broadcast.tsx`](emails/post-broadcast.tsx). Subject = post title,
body = title + description + "Read on the web" button. Charts are intentionally
not rendered in email — the whole point of the move off Substack is that they
stay interactive on the web.

## Substack migration

`pnpm migrate:substack` reads
<https://horsetounicorn.com/feed> and writes one `.mdx` per post into
`content/posts/`. Idempotent — re-running overwrites, so you can tune the
converter and re-run.

After re-running, **review each file**:

- Image URLs still point to `substackcdn.com`. Fine for v1 but you may want to
  download and rehost (drop into `public/images/posts/{slug}/` and update
  paths). Substack's CDN is the single biggest hostage your archive has.
- The migrator strips Substack subscribe widgets and "Thanks for reading"
  footers, but check for any leftover noise.
- The migrator shifts heading levels down by one (`#` → `##`) so the post page
  `<h1>` is the only top-level heading.

## Project layout

```
app/
  layout.tsx              # fonts (Instrument Serif, Roboto, Roboto Mono), shell
  page.tsx                # home — post list + hero + subscribe
  about/page.tsx
  posts/[slug]/page.tsx   # MDX renderer
  api/
    subscribe/route.ts    # POST email → Resend contact + welcome
    publish/route.ts      # POST { slug, send } → broadcast (auth: PUBLISH_SECRET)
  rss.xml/route.ts
  robots.ts
  sitemap.ts
components/
  charts/                 # Recharts components — all "use client"
  mdx/                    # custom MDX blocks (Callout)
  ui/                     # shadcn primitives (Card, Button, Input)
  mdx-components.tsx      # registry of components usable in .mdx
  subscribe-form.tsx
  post-card.tsx
  site-header.tsx
  site-footer.tsx
  subscribe-section.tsx
content/
  posts/*.mdx             # source of truth for all posts
emails/
  welcome.tsx
  post-broadcast.tsx
lib/
  posts.ts                # MDX loader, frontmatter, reading time
  resend.ts               # Resend client + audience helpers
  chart-colors.ts         # brand palette + Recharts defaults
  format.ts               # date formatting
  utils.ts                # cn() helper
scripts/
  migrate-substack.ts
  broadcast-post.ts
```

## Brand reference

| Token | Hex | Notes |
| --- | --- | --- |
| Burgundy (primary) | `#9E0A71` | Series 1, links, CTA |
| Burgundy light | `#FF80DF` | Series 2 |
| Burgundy lighter | `#FFCEF4` | Accent surfaces |
| Orange | `#F17E00` | Series 3 |
| Green | `#136A4A` | Series 4 |
| Blue | `#00568B` | Series 5 |
| INK | `#1A1A1A` | Body text, axis lines |
| Grid | `#E8E8E8` | Chart gridlines |

Fonts: **Instrument Serif** (headings), **Roboto** (body), **Roboto Mono**
(numeric values, axis ticks).

All defined in [`tailwind.config.ts`](tailwind.config.ts) and
[`app/globals.css`](app/globals.css). Charts import constants from
[`lib/chart-colors.ts`](lib/chart-colors.ts).

## Deploy

Vercel. `NEXT_PUBLIC_SITE_URL` and Resend env vars need to be set in the
project settings. Old Substack URLs of the form `/p/slug` redirect to
`/posts/slug` via [`next.config.mjs`](next.config.mjs).
