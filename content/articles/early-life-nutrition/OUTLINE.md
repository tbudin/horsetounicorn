# Early-life nutrition search trends — article outline

**Working title:** What America Googles about feeding babies — and the year the news rewired it

**Thesis:** Search behaviour is a near-real-time mirror of the news cycle. Against a
stable, seasonal, globally-distributed baseline of interest in early-life nutrition,
2025–26 delivered an unusually loud run of news — policy (MAHA), safety (two formula
recalls) and science (the autism–folate cycle) — and the search graph caught every beat.

**Scope decision:** US-centric narrative with an explicit *global chapter* (the January
2026 cereulide recall). Avoid blanket "worldwide" claims — the spikes are US-led; the
baseline is global.

**Data note:** All Google Trends series exclude June 2026 (incomplete month). "Search
interest" is a proxy for *attention*, not sales or market share — stated explicitly
wherever brands or "share" are discussed.

---

## Part 1 — The landscape (the "normal")

### 1. The shape of the category
What people actually search, and the relative sizes: breastfeeding dominates, then
prenatal vitamins and baby food, with a long niche tail. Establishes the vocabulary.
- *Chart:* (to build) ranked "category map" of term sizes.
- *Takeaway:* a small set of evergreen concerns carries most of the volume.

### 1b. Who's actually having babies — and where the searching happens
The fertility paradox: the most search-intense markets have the lowest birth rates.
- South Korea (TFR ~0.75, the world's lowest) leads search; Singapore (0.87) is top-5.
- US (1.6, ~3.6M births — record-low rate) and China (1.0, ~8.7M births) are the volume.
- Israel (~2.9, above replacement) is the developed-world outlier.
- The world's birth *volume* (India ~23M, Nigeria 7.6M > all Europe) barely registers
  in the English term.
- *Chart:* `search-vs-fertility.tsx` (bubble: x=TFR, y=search, size=births).
- *Takeaway:* attention tracks per-child anxiety and spend, not the number of babies —
  the loudest markets are premium and shrinking.

### 2. Seasonality — the calendar you can set your watch to
- *Chart:* `breastfeeding-seasonality.tsx`.
- *Takeaway:* August = World Breastfeeding Week; January + back-to-school lift kids'
  vitamins. The category has a stable annual rhythm — the baseline a surge breaks from.

### 3. The brand landscape (share of *attention*)
- *Chart:* `formula-brand-search.tsx`.
- *Takeaway:* flat incumbents (Similac, Enfamil, Aptamil) vs Bobbie's marketing-driven
  growth arc. Frame explicitly as share of attention, not market share.

### 4. Country specificities
- *Chart:* `interest-by-country.tsx`.
- *Takeaway:* English ≠ US. Korea #1, US #2, strong East-Asian + European baselines.
  Sets up "global baseline / US spikes."

---

## Part 2 — The anomalies and surges (the "story")

### 5. The turn
State the thesis plainly: late 2025–26 broke the seasonal pattern. Foreshadow 3 waves.

### 6. Wave 1 — infant & toddler nutrition explodes (Aug 2025)
- *Charts:* `august-2025-category-lift.tsx`, `infant-toddler-three-waves.tsx`.
- Driver: MAHA "Make Our Children Healthy Again" strategy + toddler-milk marketing
  lawsuits. ~5.5× jump.
- *Sidebar — how to read Trends:* why one export hid the move at the rounding floor.

### 7. Wave 2 — the formula-safety scares (Nov 2025 & Jan 2026)
- *Charts:* `formula-brand-search.tsx`, per-spike region snapshots.
- ByHeart botulism recall (US, one-week 34× spike) → global cereulide recall
  (Nestlé/Danone/Lactalis, 60+ countries). Domestic scare vs worldwide one.

### 8. Wave 3 — the autism–folate cycle (spring 2026)
- *Chart:* `autism-news-surge.tsx`.
- Folic acid triples, prenatal vitamins peak, breastfeeding diet rides along. The
  supplement industry's methylfolate (5-MTHF) pivot.
- *Caveat:* the folate–autism science is contested — report search behaviour, don't
  endorse the claims.

### 9. How the brands responded
- *Chart:* `brand-response-timeline.tsx`.
- Synthesis: Stork Speed → MAHA → autism report → ByHeart → cereulide → autism push.
- Campaign evidence: Bobbie (Cardi B "Chief Confidence Officer"; Alex Morgan "No
  Scoreboard in Motherhood"; "Formula Is Food") = confidence + transparency; Danone/
  Gallia "MommyPhone" = postpartum emotional support; Abbott/Reckitt on the defensive
  (NEC litigation, clean-label scrutiny).

---

## Part 3 — What adjacent brands can learn

### 10. Crisis management (from ByHeart & cereulide)
- Speed + transparency decide who wins switchers (FDA called ByHeart's recall too slow;
  Bobbie pre-empted with extra screening + reassurance content and demand surged).
- Category contagion is an opportunity: a rival's recall spikes whole-category anxiety —
  have supply, SEO and "[brand] recall alternative" landing pages ready (don't pause
  orders and lose the capture).
- Never fear-monger — WHO code + heavy scrutiny on formula marketing.

### 11. Promotion (from seasonality + geography)
- Lead the seasonal peak by ~3 months: breastfeeding peaks August → ramp from May;
  kids' vitamins peak January and Aug–Sep → start October and June.
- Match message to each market's live concern: folate/autism is a US conversation;
  heavy-metals/clean-label is US (AB 899); formula safety/recall went global (cereulide).
- Tier by fertility profile: premium low-volume markets (Korea, Singapore, Israel,
  Switzerland) reward ingredient-science/premium; the US rewards agile, news-reactive
  budgets; high-birth markets (India, Nigeria, SE Asia) need value tiers + vernacular.

---

## Close

### 12. What search can and can't tell you
Honest limits: attention ≠ sales; contested science; monthly region data is noisy.
Bigger idea: in a MAHA-era news environment a quiet category became a weekly news
subject, and the search graph recorded every beat.

---

## Chart inventory (components in `app/articles/early-life-nutrition/charts/`)
| Section | Component | Status |
|---|---|---|
| 1 | category-map (ranked term sizes) | TODO |
| 1b | `search-vs-fertility.tsx` | built |
| 2 | `breastfeeding-seasonality.tsx` | built |
| 3 / 7 | `formula-brand-search.tsx` | built |
| 4 | `interest-by-country.tsx` | built |
| 6 | `august-2025-category-lift.tsx` | built |
| 6 | `infant-toddler-three-waves.tsx` | built |
| 7 | per-spike region snapshots | inline only — TODO component |
| 8 | `autism-news-surge.tsx` | built |
| 9 | `brand-response-timeline.tsx` | built |

## Open data gaps / next steps
- Section 1 "category map" chart (ranked term sizes) — not yet built.
- Per-spike region snapshots — exists inline, no repo component yet.
- Meta Ad Library copy-diff (Aptamil, Bobbie, ByHeart, Similac, Enfamil, SMA) around
  Nov 2025 / Jan 2026 / spring 2026 — blocked on a connected browser.
- Optional: real market-share data (Euromonitor / press) to pair with share-of-attention.
- Optional: re-pull formula brands as Topic entities to confirm the search-term shapes.
