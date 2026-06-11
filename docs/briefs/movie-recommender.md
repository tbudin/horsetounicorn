# Brief: "What to watch tonight" — movie recommender for DATAIRL

## Context

This is a v1 of a personal movie recommender, building on a 2018 analysis at
https://datairl.com/posts/2018-04-20.html where I compared IMDb, Rotten Tomatoes,
Metacritic, and Fandango ratings against my own. The conclusions then were:

- IMDb and RT user ratings correlate well with personal taste
- Percentiles tell you more than raw scores
- Comedies were my outlier genre (I rate them higher than IMDb does)

The new project goes further: instead of just analyzing aggregate ratings, build a
recommender that takes a short emotional-memory quiz and returns *one* movie to
watch tonight, with conviction.

The output is two things:
1. A public, polished web tool that lives on the DATAIRL blog
2. A blog post telling the story of how it was built, with charts and analysis

The audience is me and my friends — opinionated taste is a feature, not a bug.

## What I want from you

This brief covers **Phase 1 (data + analysis)** only. I'll come back in
claude.ai to write the blog content and the quiz UX once the analysis is done.

The deliverables for this phase:

1. A reproducible data pipeline that builds the movie catalog from bulk
   datasets first, with targeted API enrichment second
2. LLM-generated trait scores per movie
3. Polarization and quality metrics per movie (using real rating distributions
   from MovieLens, not just averages)
4. Exploratory analysis charts (styled per the spec below) — to inform both the
   recommender design and the blog post
5. A TypeScript interface for the movie data shape, so the future Next.js app
   can consume the JSON with full type safety

## Architecture decisions

**Bulk-first, API-second.** Download IMDb's free TSV dataset and MovieLens 32M
to get the candidate universe and real rating distributions. Use TMDb and OMDb
APIs only to enrich the filtered subset with keywords, plot synopses, streaming
availability, and RT/Metacritic scores. This is faster, cheaper, and more
reproducible than an API-only approach.

**No database.** The runtime artifact is plain JSON. Reasoning:
- Catalog is ~2-5 MB (fits in browser memory)
- Read-only at runtime; the pipeline writes weekly, the site only reads
- Recommendation logic is array filter+sort, not SQL — faster in memory
- Zero hosting cost, infinitely scalable, perfect for a static blog deployment

Pipeline writes `movies.json` to disk. That file gets copied into the Next.js
project's `public/data/` directory and is fetched by the browser on quiz load.

**DuckDB is the pipeline workhorse.** Use it to query the gzipped TSVs and CSVs
directly with SQL — much faster and less memory-hungry than loading everything
into pandas. DuckDB is Python-side only; the site never touches it.

**The future Next.js app stack** (out of scope for this phase, but worth knowing
so the data shape is compatible):
- Next.js (latest) with App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts for charts
- No backend except a single serverless API route for feedback collection
  (writes to a JSON file or external service like Airtable — TBD later)

## Tech stack for this phase

- Python 3.11+ for the data pipeline
- DuckDB for querying bulk datasets in place (gzipped TSV, CSV)
- Pandas for the final tidy DataFrames + analysis
- TMDb API (free, non-commercial) for keywords, synopsis, streaming, posters
- OMDb API (free tier, $1+/month if needed) for RT critic/audience and Metacritic
- Anthropic API (Claude) for LLM trait scoring
- Pydantic for the movie schema (auto-generates the TypeScript interface)
- Output: a single `movies.json` (committed to the repo), a `meta.json` with
  catalog statistics, plus chart components as `.tsx` files

## Data sources

### Bulk downloads (no API key needed)

**IMDb non-commercial datasets** — https://datasets.imdbws.com
- `title.basics.tsv.gz` — every title's id, name, year, runtime, genres
- `title.ratings.tsv.gz` — average rating + vote count
- `title.crew.tsv.gz` — director and writer IDs
- `title.principals.tsv.gz` — cast and crew per title (large; only fetch if
  needed for the filtered subset)
- `name.basics.tsv.gz` — to resolve person IDs to names

Download these to `data/raw/imdb/`. Refresh check: compare `Last-Modified`
header against local mtime; only re-download if remote is newer. License:
personal/non-commercial use is free.

**MovieLens 32M** — https://files.grouplens.org/datasets/movielens/ml-32m.zip
- ~265 MB zipped, ~1 GB unzipped
- Contains: `ratings.csv` (32M user-movie ratings), `movies.csv`, `tags.csv`,
  `links.csv` (maps MovieLens IDs to IMDb and TMDb IDs)
- This is the source for **real rating distributions** per movie — variance,
  bimodality, true polarization. Significant analytical upgrade over the
  audience-vs-critic proxy.
- License: research and personal use; redistribution restricted

Download to `data/raw/movielens/`. This is essentially static — only re-download
manually when GroupLens publishes a new version.

### API enrichment (keyed)

After filtering down to ~2,500 candidate movies via the bulk datasets:

**TMDb API** — https://developer.themoviedb.org/reference/intro/getting-started
- Per movie: details, keywords, watch providers, top reviews, full credits
- ~4-5 calls per movie (details, keywords, providers, reviews, optionally
  credits). Free tier: ~50 req/sec, no daily cap for non-commercial use.

**OMDb API** — http://www.omdbapi.com
- Per movie: RT critic, RT audience, Metacritic — all in one response
- ~1 call per movie. Free tier: 1,000/day. We need ~2,500, so either spread the
  run over 3 days or upgrade to the $1/month tier.

## Catalog scope

Roughly 2,000-3,000 movies. Inclusion criteria (applied during the IMDb bulk
filter step):

- `titleType` = `movie` (excludes shorts, TV, episodes)
- `numVotes` >= 10,000
- `averageRating` >= 6.0 (we apply the OR-with-critic-score after OMDb enrichment)
- `startYear` >= 1970
- `runtimeMinutes` between 60 and 240 (excludes shorts and miniseries-as-movies)
- Exclude genres: `Documentary`, primarily-`Animation` *children's* films
  (keep Studio Ghibli, animated films for adults — use a curated list of
  exceptions if needed)

Then, after OMDb enrichment, add back any film with RT critic >= 75 that was
excluded by the IMDb score floor (the arthouse case from the 2018 piece — a
critically-celebrated film with a mediocre audience score is still interesting).

Document the exact filters in the pipeline so I can tune them.

## Data fields per movie

For each movie, collect:

**Identity**
- TMDb id, IMDb id, MovieLens id (from `links.csv`)
- Title, original title, year, runtime, original language
- Director(s), top 5 cast
- Genres (TMDb's list — preferred over IMDb's looser tagging)
- Keywords (TMDb's `/keywords` endpoint — the secret weapon)
- Poster path

**Quality signals**
- IMDb score + vote count (from bulk dataset)
- RT Tomatometer (critic) + RT audience score (via OMDb)
- Metacritic score (via OMDb)
- TMDb vote average + vote count
- MovieLens mean rating + rating count (from bulk dataset)

**Streaming availability**
- TMDb watch providers, keyed by country code (default to FR + US for v1, but
  store all so we can add regions later)

**Derived metrics**
- Quality percentile (within the catalog) per rating source
- **True polarization** from MovieLens: variance of the rating distribution per
  movie, plus a bimodality coefficient. This is the big upgrade — actual
  distributional shape, not just an audience-critic gap proxy.
- Audience-vs-critic gap (RT) — keep as a secondary polarization signal
- IMDb-vs-Metacritic gap — keep as a tertiary signal
- Combined polarization z-score
- "Rewatch proxy": votes per year since release

**Trait scores (the new bit — from LLM)**
Twelve dimensions, scored 0-10:
- Funny
- Dark-funny
- Tense
- Scary
- Emotionally-heavy
- Comfort-watch
- Mind-bending
- Romantic
- Visually-stunning
- Slow-burn
- Feel-good
- Weird

For each score, also store a one-sentence rationale (useful for debugging and
later for the "why we picked this" explanation in the UI).

## Data shape — TypeScript interface (the contract)

Define a Pydantic model in Python that mirrors this TypeScript interface, and
generate the `.ts` file as part of the pipeline. The Next.js app will import
this interface directly.

```typescript
// types/movie.ts
export interface Movie {
  // Identity
  tmdb_id: number;
  imdb_id: string | null;
  movielens_id: number | null;
  title: string;
  original_title: string;
  year: number;
  runtime_minutes: number | null;
  original_language: string;
  directors: string[];
  cast: string[];                    // top 5
  genres: string[];                  // TMDb genre names
  keywords: string[];                // TMDb keyword names
  poster_path: string | null;        // TMDb relative path

  // Quality signals
  imdb_score: number | null;
  imdb_votes: number | null;
  rt_critic: number | null;
  rt_audience: number | null;
  metacritic: number | null;
  tmdb_score: number;
  tmdb_votes: number;
  movielens_mean: number | null;
  movielens_count: number | null;

  // Streaming (keyed by ISO country code)
  streaming: Record<string, StreamingProviders>;

  // Derived metrics
  quality_percentile: number;        // 0-100, computed within catalog
  rating_variance: number | null;    // from MovieLens distribution
  bimodality: number | null;         // from MovieLens distribution
  polarization_score: number;        // combined z-score
  rewatch_proxy: number;

  // Trait scores
  traits: TraitScores;
  trait_rationales: Record<keyof TraitScores, string>;
}

export interface StreamingProviders {
  flatrate: string[];                // subscription (Netflix, Prime, etc.)
  rent: string[];
  buy: string[];
}

export interface TraitScores {
  funny: number;
  dark_funny: number;
  tense: number;
  scary: number;
  emotionally_heavy: number;
  comfort_watch: number;
  mind_bending: number;
  romantic: number;
  visually_stunning: number;
  slow_burn: number;
  feel_good: number;
  weird: number;
}

export interface CatalogMeta {
  generated_at: string;              // ISO timestamp
  movie_count: number;
  filters_applied: Record<string, unknown>;
  pipeline_version: string;
  trait_prompt_version: string;
  data_sources: {
    imdb_snapshot_date: string;      // Last-Modified of title.basics.tsv.gz
    movielens_version: string;       // e.g. "ml-32m"
    tmdb_fetched_at: string;
    omdb_fetched_at: string;
  };
}
```

The pipeline produces:
- `data/movies.json` — array of `Movie` objects
- `data/meta.json` — single `CatalogMeta` object
- `types/movie.ts` — auto-generated TypeScript file

## Pipeline steps

```
01_download_bulk.py
  - Download IMDb TSVs to data/raw/imdb/ (skip if Last-Modified <= local mtime)
  - Download MovieLens 32M zip to data/raw/movielens/ (skip if already present)
  - Verify checksums where available
  - Log download dates to a small manifest file

02_filter_imdb.py
  - Use DuckDB to query title.basics + title.ratings directly from gzipped TSVs
  - Apply the inclusion filters (votes, score, year, runtime, type, genre)
  - Output: a parquet of ~5,000-10,000 candidate movies with IMDb fields

03_join_movielens.py
  - Read MovieLens links.csv to map MovieLens IDs to IMDb IDs
  - For each candidate, compute rating mean, count, variance, and bimodality
    from the full ratings.csv (use DuckDB for the aggregation)
  - Join back onto the candidate set

04_enrich_tmdb.py
  - For each candidate, call TMDb find/{imdb_id} to get TMDb ID
  - Then fetch details, keywords, watch providers, top reviews
  - Cache every response to data/cache/tmdb/{tmdb_id}.json
  - Skip cached entries on re-run

05_enrich_omdb.py
  - For each candidate with an IMDb ID, call OMDb to get RT + Metacritic
  - Cache every response to data/cache/omdb/{imdb_id}.json
  - Apply the "rescue by critic score" rule: re-include films with RT critic
    >= 75 that were filtered out by the IMDb score floor

06_trait_scoring.py
  - For each final movie, build the trait-scoring prompt
  - Call Claude with structured JSON output
  - Cache to data/cache/traits/{tmdb_id}_{prompt_version}.json
  - Skip cached entries on re-run
  - Budget guard: stop and warn at $50 spent

07_compute_metrics.py
  - Compute quality percentiles, polarization z-scores, rewatch proxy
  - Write data/movies.json and data/meta.json

08_export_typescript.py
  - Use pydantic-to-typescript (or equivalent) to emit types/movie.ts
```

Each step is independently runnable and idempotent. The cache is the contract:
re-running step 6 with a cache hit makes zero API calls.

## LLM trait scoring approach

For each movie:

1. Build a prompt containing: title, year, director, genres, TMDb keywords,
   plot synopsis, and 3-5 short review snippets (from TMDb reviews endpoint,
   or IMDb plot keywords as a fallback)
2. Call Claude (Sonnet is fine for cost, Opus for the first ~100 to calibrate)
   with **structured JSON output** (use the API's tool-use feature for
   reliable parsing)
3. The response is the 12 trait scores + rationales
4. Cache aggressively — keyed by `(tmdb_id, prompt_version)`. Re-runs should
   not re-call the API. Persist cache to disk as JSON files.
5. Budget guard: stop the run and print a warning if total cost exceeds $50

Build a small evaluation harness: hand-score 30 films I name, compare to LLM
scores, report mean absolute error per dimension. I want to iterate the prompt
to minimize MAE on this set before running the full catalog.

The prompt should be in a separate file (`prompts/trait_scoring_v1.txt`) with
a version number, so we can A/B prompts and compare eval results.

## Polarization analysis

This is the foundation for the quiz design — polarizing movies are the most
diagnostic. Now that we have MovieLens rating distributions, polarization is:

- **Primary signal**: variance of the MovieLens rating distribution per movie
- **Bimodality coefficient**: detects the 40% love / 40% hate signature even
  when variance is moderate
- **Secondary**: RT critic-vs-audience gap
- **Tertiary**: IMDb-vs-Metacritic gap

Combine into a single z-score (document the formula).

Then identify the top 200 most polarizing films. These are quiz-anchor
candidates. I'll curate the final anchor list myself.

## Analysis charts to produce

These are the charts I want for the blog post. They should be exploratory but
publishable — same visual quality as a final piece. Each chart is a single
`.tsx` file using shadcn `Card` as the container and Recharts inside.

**Chart 1 — Updated correlation analysis**
Replicate the 2018 correlation matrix between rating sources (IMDb, RT critic,
RT audience, Metacritic, TMDb, MovieLens), but on the new catalog. Show how
much the landscape has changed (Fandango is gone, MovieLens is now included).

**Chart 2 — Score distributions**
Distribution of scores across IMDb, RT critic, RT audience, Metacritic, TMDb,
MovieLens. Mark the median on each. This is the percentile foundation from the
2018 piece, updated.

**Chart 3 — Polarization landscape**
Scatter: x = MovieLens mean rating, y = MovieLens rating variance (or
bimodality). Highlight the most polarizing films with labels. This is the
visual that motivates "polarizing movies are the best quiz anchors" — and now
it's based on real distributional data, not a proxy.

**Chart 4 — Trait-space PCA**
Run PCA on the 12 trait scores across all films. Plot the first 2 components.
Color by primary genre. The interesting question: do trait scores recover
genre structure, or do they cut across it? (My hypothesis: they cut across — a
"slow burn + emotionally heavy" axis spans drama AND horror.)

**Chart 5 — Trait correlations**
Heatmap of correlations between the 12 trait dimensions. Helps spot redundancy
(e.g. if Funny and Feel-good are correlated 0.9, we have a problem).

**Chart 6 — Quality vs popularity**
Scatter: x = vote count (log), y = score, colored by decade. The "hidden gems"
quadrant is the high-score / low-vote area.

**Chart 7 — Streaming availability landscape**
For FR, what % of the catalog is on Netflix, Prime, Disney+, Apple TV+, etc.?
Are there films exclusive to one platform? Histogram or stacked bar.

All charts: produce as React + Recharts components in TypeScript (`.tsx`), one
per file, in a `charts/` directory. Match the styling spec below exactly.

## Output structure

```
movie-recommender/
├── pipeline/
│   ├── 01_download_bulk.py
│   ├── 02_filter_imdb.py
│   ├── 03_join_movielens.py
│   ├── 04_enrich_tmdb.py
│   ├── 05_enrich_omdb.py
│   ├── 06_trait_scoring.py
│   ├── 07_compute_metrics.py
│   └── 08_export_typescript.py
├── prompts/
│   └── trait_scoring_v1.txt
├── eval/
│   ├── hand_scored_films.json
│   └── eval_runner.py
├── data/
│   ├── movies.json                # final catalog (also copy to public/data/)
│   ├── meta.json                  # catalog statistics
│   ├── candidates.parquet         # intermediate filtered catalog (gitignored)
│   ├── cache/                     # LLM + API responses (gitignored)
│   │   ├── tmdb/
│   │   ├── omdb/
│   │   └── traits/
│   └── raw/                       # bulk downloads (gitignored)
│       ├── imdb/
│       └── movielens/
├── types/
│   └── movie.ts                   # auto-generated TS interface
├── notebooks/
│   └── exploration.ipynb          # exploratory analysis in Python
├── charts/
│   ├── 01_correlation.tsx
│   ├── 02_distributions.tsx
│   ├── 03_polarization.tsx
│   ├── 04_trait_pca.tsx
│   ├── 05_trait_correlations.tsx
│   ├── 06_quality_vs_popularity.tsx
│   └── 07_streaming_landscape.tsx
├── .gitignore                     # ignore data/raw/, data/cache/, data/*.parquet
├── .env.example                   # API keys
├── pyproject.toml
└── README.md
```

The `.gitignore` is important — `data/raw/` and `data/cache/` will be hundreds
of MB and must never be committed. Only `data/movies.json`, `data/meta.json`,
and the final exports go in git.

The README should document: how to get API keys, how to run the pipeline end
to end, expected runtime, expected cost, expected disk usage, how to inspect
the results, and how to consume the JSON in the future Next.js app.

## Chart styling spec

Match the DATAIRL chart style established in the ETF analysis work. Charts are
written as TypeScript React components using shadcn's `Card` as the container
and Recharts for the visualization itself.

**Typography**
- Chart titles (Card header): **Instrument Serif**, regular weight (400),
  loaded from Google Fonts
  (`https://fonts.googleapis.com/css2?family=Instrument+Serif`)
- Body text, axis labels, legends, tooltips: **Roboto** (standard Roboto, not
  Roboto Flex)
- Numeric values, ticks, data labels: **Roboto Mono** — tabular figures look
  cleaner for data
- Heading font sizes (in chart cards): h1 = 34px, h2 = 26px, section heading
  = 24px, sub-heading = 22px
- Letter-spacing on headings: `0.005em` (very slight positive tracking)
- Line-height for headings: 1.2

These fonts should be configured globally in the Next.js app via `next/font`
later — for now, in standalone chart files, load via a Google Fonts `<link>`
and reference in inline styles.

**Colors — define as constants at the top of each chart file**

```ts
const BURGUNDY = '#9E0A71';
const BURGUNDY_LIGHT = '#FF80DF';
const BURGUNDY_LIGHTER = '#FFCEF4';
const ORANGE = '#F17E00';
const ORANGE_LIGHT = '#FFC000';
const ORANGE_LIGHTER = '#FFE0A9';
const GREEN = '#136A4A';
const GREEN_LIGHT = '#3FAF66';
const GREEN_LIGHTER = '#9EDFA7';
const BLUE = '#00568B';
const BLUE_LIGHT = '#00B1D2';
const BLUE_LIGHTER = '#B2E6F1';
const INK = '#1A1A1A';
```

When the Next.js app gets built, promote these to CSS variables in
`globals.css` and reference via Tailwind config — but for the standalone
chart files in this phase, inline constants are fine.

**Chart conventions**
- Burgundy is the primary/feature color — use it for the "main" series
- Use light tints for secondary or contextual series
- Reference lines / zero lines: `INK`, weight 1
- Tooltip cursor fill: 6% alpha of the relevant series color
- Error bars (where used): stroke color = same hue as the bar, never `INK`
- Grid lines: light gray (`#E8E8E8`), dashed `3 3`
- Aspect ratio: square (1:1) cards, ~520×520 if stacked in a column,
  otherwise responsive
- Disable animations on render (`isAnimationActive={false}`) — distracting
  for analytical charts
- Use `recharts` for everything
- Wrap each chart in a shadcn `Card` with `CardHeader` (Instrument Serif
  title) and `CardContent` (the Recharts component)

## What's out of scope for this phase

- The quiz UI
- The matching engine
- The result page
- The feedback collection endpoint
- The blog post writing itself (I'll come back to claude.ai for that)
- The Next.js app shell itself (will be built later, but the chart components
  produced here should be drop-in compatible)

The deliverable is the catalog, the trait scores, the analysis charts, and
the TypeScript interface.

## Definition of done

- [ ] Pipeline runs end-to-end from a fresh checkout with API keys set
- [ ] Bulk downloads work, cache correctly, skip on re-run
- [ ] `movies.json` exists with ~2,000-3,000 entries and all fields populated
- [ ] `meta.json` exists with catalog statistics and data-source provenance
- [ ] `types/movie.ts` is generated and matches the Pydantic schema
- [ ] Trait-scoring eval MAE is reported and is reasonable (< 1.5 on a 0-10
      scale per dimension as a starting bar)
- [ ] All 7 analysis charts render correctly as standalone `.tsx` components
      and match the styling spec
- [ ] Charts use shadcn `Card` as the container (use the `Card`, `CardHeader`,
      `CardTitle`, `CardContent` components — if shadcn isn't installed in the
      standalone chart preview, document the expected import paths so they
      drop into a real shadcn project cleanly)
- [ ] README documents setup, run, cost, and disk usage
- [ ] Total LLM cost for a full run is under $50
- [ ] Cache works: re-running the pipeline does not re-call any external service
- [ ] `.gitignore` correctly excludes raw downloads and caches

## Notes

- I'll provide API keys for TMDb, OMDb, and Anthropic — assume they're in `.env`
- Default region for streaming: France (FR), with US as a secondary
- If something in this brief is ambiguous, document the choice you made in the
  README rather than blocking on me
- Surprise me with one extra chart or analysis if you spot something
  interesting in the data — I love unexpected findings

Once this phase is done, I'll come back to claude.ai with the outputs to:
1. Write the blog post
2. Design the quiz UX
3. Build the recommendation engine + Next.js app shell
