# Pistachio boom — article outline

**Slug:** `pistachio-boom`
**Working title:** Why is everything pistachio?

**Thesis:** The pistachio boom is *both* a supply and a demand story, running on two
different clocks. A decade-long California planting boom (trees take ~7 years to bear)
quietly built a structural glut; a single viral product — Dubai chocolate, Dec 2023 —
detonated an instant, kernel-specific demand shock on top of it. The collision is why
record US production and record kernel prices happened in the same year. The transfer
lesson: search interest is a *trailing* indicator — the trend was readable years ahead
from early-adopter social signals plus the supply chart itself.

**Data note:** Google Trends = *attention*, not sales/supply. June 2026 excluded from all
series (incomplete month). Kernel prices are approximate, from trade reporting.

## Structure
1. Hook — noticing pistachio everywhere → pull Trends → supply or demand?
2. The shape — `search-attention` chart. Pistachio tripled *before* Dubai chocolate, and
   stayed high *after*. Spark ≠ fire.
3. Fast clock (demand) — Fix Dessert Chocolatier, Maria Vehera's Dec 2023 TikTok, retail
   pile-in, kernel-specific shortage, the bullwhip. ~21 months phone→farm.
4. Slow clock (supply) — `production-overtake` chart. California's 5× acreage build, the
   1986 Iran tariff, Iran's decline, alternate bearing. The 7-year lag callout.
5. Verdict — `supply-demand-collision` chart. Record crop + record price. Demand = match,
   supply system = dry kindling.
6. Prediction — Trends is trailing; leading signals = early-adopter chatter (Nextatlas
   flagged "pistachio cream" Dec 2023) + the supply chart + cultural priming (matcha →
   pistachio, Bronte tradition, Instagram-green, health halo).
7. Fad vs category — `fad-vs-category` chart. Dubai chocolate −70%; pistachio holds.
8. Lessons — marketers (forecast the flavour not the SKU; search = finish line; scarcity
   is a feature; arrive at abstraction not saturation) + operators (respect the
   demand/supply gap; concentration + alternate-bearing = fragility; a rival's stockout
   is your quarter if you're ready).
9. Close — read three graphs together (attention, production, price) and a trend becomes
   an anatomy.

## Charts (in app/articles/_charts/<id>/)
| Component | Role | Source data |
|---|---|---|
| `search-attention` | Trends + news/ad timeline | content/draft/pistachio CSVs |
| `production-overtake` | US vs Iran production | USDA FAS / ACP |
| `supply-demand-collision` | production (bars) vs kernel price (line) | ACP + trade price reporting |
| `fad-vs-category` | Dubai chocolate fades, pistachio holds | Trends CSVs |

## Status
`draft` — previewable at /articles/pistachio-boom but hidden from the index/RSS until
flipped to `published` in the admin.
