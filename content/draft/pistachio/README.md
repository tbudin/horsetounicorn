# Pistachio / Dubai chocolate — raw data

Source exports for the `pistachio-boom` article. All Google Trends CSVs are
relative search interest (0–100), not absolute volume. Per-country timeline
series are each self-indexed to that country's own peak, so they compare
*shape*, not size. Geomaps are share-of-search within each country, already
normalised for country size (so they cannot be meaningfully divided by
population again).

```
worldwide/            Global timelines
  all-since-2004.csv                     pistachio + Dubai chocolate + "pistachios", monthly, worldwide
  multiTimeline-knafeh-2004.csv          knafeh, monthly, worldwide
  multiTimeline-all-dubaichocolate-5years.csv   Dubai chocolate, weekly, worldwide

by-country/
  dubai-chocolate/    32 countries, weekly, "Dubai chocolate" (5y)   multiTimeline-XX-dubaichocolate-5years.csv
  pistachio/          8 countries, monthly, "pistachio" (since 2004)
  knafeh/             8 countries, monthly, "knafeh" (since 2004)

geomaps/              Interest by country (share-of-search), for each term
related-queries/      Top related queries for pistachio and Dubai chocolate
reddit/               reddit-search-results.csv — ~2,000 posts (export 23 Jun 2026; recency-ranked)
```

Country codes are the file infixes (ISO-ish): `de`=Germany, `dn`=Denmark,
`sw`=Sweden, `tk`=Turkey, `is`=Iceland, `ir`=Iran, `uae`=UAE, `cz`=Czechia,
`gr`=Greece, etc.

## Key derived findings (see the article)
- The US overtook Iran as #1 producer durably from the **2016/17** crop (first edged ahead 2008).
- Reddit post volume tracks Google pistachio interest (**r ≈ 0.71**) but *trails* it.
- Across **32 countries**, national *uncertainty avoidance* does **not** predict adoption
  timing (**r ≈ 0**). The split is regional: Western markets flash-and-crash; **East/SE Asia**
  (Singapore, Japan, Taiwan, Malaysia, Indonesia) adopt later and sustain. Onset is driven by
  proximity (diaspora, cuisine, local discount retailers).

Analysis scripts are ad-hoc (see chat history); charts inline their data in
`app/articles/_charts/d6fbe41b-cd6b-4b30-9140-6d6fec6657a1/`.
