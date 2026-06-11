# Article datasets

Raw data files for long-form essays in `/app/articles/[slug]/`.

```
content/articles/[slug]/
├── data/                # raw CSVs (committed to git)
│   ├── source-1.csv
│   └── source-2.csv
└── notes.md             # (optional) draft notes, source URLs, scraping commands
```

## Workflow

1. Drop raw CSVs into `content/articles/[slug]/data/`.
2. Run `pnpm data` to parse all CSVs and emit typed JSON into
   `public/data/[slug]/*.json` (gitignored — re-generated from the raw CSVs).
3. In your chart component, fetch the JSON:

   ```ts
   const res = await fetch('/data/[slug]/source-1.json');
   const data = await res.json();
   ```

   Or, for charts that should hydrate immediately, import the JSON at
   build time:

   ```ts
   import data from '@/public/data/[slug]/source-1.json';
   ```

## Why this layout

- Raw data stays versioned in `content/articles/` so you can audit / re-run.
- Parsed JSON in `public/data/` is the runtime artifact — fast to fetch,
  easy to import, gitignored so the diff stays clean.
- Charts and articles import their data from the same predictable place.
