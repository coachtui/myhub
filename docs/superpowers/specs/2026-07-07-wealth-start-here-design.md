# Wealth "Start Here" — Beginner Market Basics Series — Design Spec

**Date:** 2026-07-07
**Owner:** Tui Alailima
**Status:** Approved design → ready for implementation plan

---

## 1. Problem & Goal

Feedback on the Wealth section: it's too much to read and hard for beginners. The specific
gap is **market literacy** — readers don't know what a ticker is, what SPY means, how to read
a chart, or what the VIX is, so both the Wealth guides and Gojo's Market Takes read as gibberish
to them.

**Goal:** a beginner series that takes someone with zero prior knowledge — never bought a stock,
never looked at a chart — and walks them up to the point where they (a) understand the case for
simple long-term investing and (b) can read a Gojo Market Take without getting lost.

**Philosophical constraint (load-bearing):** the series must lean **long-term investing**, not
trading — consistent with the site's stated philosophy ("think in decades, no need to trade or
time the market"). Chart-reading, jargon, and the VIX are taught as *literacy for decoding market
noise*, not as trading skills. Candlesticks are covered briefly, explicitly framed as
"you'll see these in commentary; here's how to read them; I don't trade off them."
Investing foundation always comes before market-noise material.

**Anti-goal:** do NOT add more long reading. The whole 10-lesson series should total *less*
reading than three of the current step pages. Interactive visuals carry the teaching load.

## 2. What & Where

A new sub-section: **`/moneyhub/start-here/`** — an index page plus 10 short lesson pages,
following the existing `moneyhub/investing/` pattern (hub index + guide pages, site chrome,
breadcrumbs, prev/next step-nav footer).

### URL / file naming
Lesson files use **descriptive slugs without numbers** (e.g. `what-is-a-stock.html`, not
`lesson1-...`). Ordering lives in the index page and the prev/next nav, so lessons can be
reordered or inserted later without breaking URLs. (Divergence from the root-level
`stepN-*.html` convention — intentional, since this curriculum already reordered twice
during design.)

## 3. Curriculum (10 lessons, fixed order)

### Part 1 — The ground floor
1. **What is a stock?** (`what-is-a-stock.html`) — a tiny slice of a real company; why
   companies sell slices.
2. **What is the stock market?** (`what-is-the-stock-market.html`) — where slices trade;
   exchanges; why prices move every day (someone's buying, someone's selling).
3. **Why invest?** (`why-invest.html`) — compounding, time in the market, the 20-year view
   vs. cash in a drawer. Short — three paragraphs plus one compounding visual.

### Part 2 — The long-term investor's toolkit
4. **Tickers and indices** (`tickers-and-indices.html`) — what "SPY" means; S&P 500, QQQ/Nasdaq,
   Dow; the index as the hero, not stock-picking.
5. **Funds and ETFs** (`funds-and-etfs.html`) — why owning a slice of everything beats picking
   winners; what "the market averages ~10%/yr" actually means; stocks vs. ETFs vs. mutual funds
   in plain terms.
6. **How to read a chart** (`how-to-read-a-chart.html`) — interactive centerpiece. Chart anatomy
   (price axis, time axis, volume) with tap/hover labels, plus a **timeframe toggle**
   (1D → 1M → 1Y → 20Y) on the same ticker: terrifying daily zigzags become a smooth 20-year
   upward line. The lesson's moral is "zoom out," not "spot the pattern."

### Part 3 — Decoding the noise (so it doesn't scare you)
7. **Bull, bear, dip, correction, crash** (`bulls-bears-and-crashes.html`) — what the scary
   words mean; how often corrections normally happen; a zoomed-out "every crash since 1990"
   chart showing recovery every time.
8. **Volatility and the VIX** (`volatility-and-the-vix.html`) — the "fear index" in plain terms;
   why fear spikes are normal; what a long-term investor does during one: nothing.
9. **Earnings, sectors, and analyst talk** (`earnings-sectors-analyst-talk.html`) — literacy for
   market commentary: earnings, guidance, sectors, and a brief candlestick primer
   (open/high/low/close via an interactive hoverable candle) framed as reading, not trading.

### Capstone
10. **Read a real market take** (`read-a-market-take.html`) — an annotated real Gojo Market
    Takes post; every term in it is one the reader has now learned. Framing: you can understand
    daily commentary without letting it change a 20-year plan. Ends with "ready to actually
    start?" linking to `moneyhub/investing/` (account types, starter portfolios) and the
    5-step path.

## 4. Lesson page template

Every lesson page, top to bottom:

1. Site chrome header, breadcrumb (`Home / Wealth / Start Here / <lesson>`), standard
   not-a-financial-advisor disclaimer callout.
2. **"In one sentence"** box — the whole lesson as one plain-English sentence.
3. **Real-world opener** — 1–2 real sentences quoted from a Gojo Market Take that use the
   concept, as motivation ("by the end of this page you'll know exactly what this means").
   Lessons 1–3 may open with an everyday-money hook instead where no Gojo quote fits naturally.
4. **Body** — 300–450 words, plain language (~8th-grade reading level), first-person Tui voice,
   one idea per lesson. Interactive widget(s) inline where the lesson calls for one.
5. **"Terms you now know"** — recap list of the lesson's vocabulary (these recaps double as
   the site's glossary; no standalone glossary page in v1).
6. **Self-check** — 2–3 questions with reveal-answer interaction (native `<details>` or the
   quiz widget; implementation plan decides).
7. Prev/next **step-nav footer** (existing `step-nav.css` component) + link back to the
   Start Here index.

## 5. Interactive widgets

All widgets: vanilla JS + inline SVG, no dependencies, no live data. Chart data is
hand-crafted static arrays (realistic-but-synthetic, or sampled historical shapes) embedded
in the page. Colors/typography via `tokens.css` CSS variables only, so dark mode works
(see the authored-content CSS-var alias system already in `tokens.css`).

| Widget | Lesson(s) | Behavior |
|---|---|---|
| Compounding growth | 3 | Simple chart comparing $X saved in cash vs. invested over 10/20/30 yrs (toggle horizon). |
| Chart anatomy explorer | 6 | SVG price chart with tappable/hoverable callouts labeling axes, price line, volume bars. |
| Timeframe toggle | 6 | Same ticker at 1D / 1M / 1Y / 20Y; buttons swap the dataset; caption reinforces "zoom out." |
| Crash history zoom-out | 7 | Long-horizon index chart with major drawdowns (2000, 2008, 2020, 2022) marked; all recovered. |
| Candle inspector | 9 | A few candles; hover/tap one to see open/high/low/close labeled; line ↔ candle view toggle. |
| Self-check quiz | all | 2–3 questions, tap to reveal answer + one-line explanation. Shared component. |

**Accessibility & mobile:** hover interactions must also work as tap/click; widgets keyboard-
focusable with visible focus states; SVGs get `aria-label`/text alternatives; every widget
degrades to a readable static state with JS disabled (default view = the most informative one).

## 6. Index page (`/moneyhub/start-here/index.html`)

- Hub-style index following the `investing/index.html` pattern: intro ("New to all of this?
  Start here — no experience assumed"), then the 10 lessons as an ordered list grouped under
  the three part headings + capstone, numbered 1–10 with one-line descriptions.
- Footer cross-links: the 5-step path, `investing/` guides, Market Takes.

## 7. Integration

- **Wealth index (`moneyhub/index.html`):** add a prominent "🌱 New here? Start with the
  basics" card near the top — positioned as the entry point *before* the 5-step path for
  true beginners.
- **Market Takes page:** add a short "New to tickers and charts? Take the Start Here course"
  link near the filter bar.
- **Search:** run `npm run build:index` so all 11 pages enter the search index (automated
  cron also covers this; run locally to verify).
- **Q&A / topics pages:** no changes in v1.

## 8. Out of scope (v1)

- Video content (may embed later; the interactive widgets are the "show, don't tell" layer).
- Standalone glossary page (per-lesson "terms you now know" recaps serve this).
- Rewriting/trimming the existing 5-step pages (separate future effort if feedback persists).
- Live market data in widgets.
- Progress tracking / completion state.

## 9. Testing & verification

- Existing test suite (`npm test`) must pass; add coverage consistent with how existing pages
  are tested (e.g., link integrity / structure checks) per the implementation plan.
- Manual pass: each widget in light + dark mode, mobile tap targets, keyboard navigation,
  JS-disabled fallback.
- `node scripts/migrate-pages.mjs` dry-run should report no un-migrated pages after adding
  the new ones (new pages are authored directly on the current template).

## 10. Success criteria

- A reader with zero market knowledge can go 1 → 10 and correctly answer every self-check.
- Total series word count ≤ ~4,500 (less than three current step pages).
- Every market term used in a typical Gojo Market Take post is taught somewhere in lessons 1–9.
- Every lesson's takeaway is consistent with long-term, low-cost, boring investing.
