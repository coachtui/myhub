# Investing Hub Redesign — Start Here Treatment — Design Spec

**Date:** 2026-07-08
**Owner:** Tui Alailima
**Status:** Approved design → ready for implementation plan

---

## 1. Problem & Goal

The five investing guides (`moneyhub/investing/`) predate the Start Here series: each is 9–12
dense numbered sections of nested lists (~1,200–2,000 raw words), and beginner feedback says
they're hard to get through. The Start Here series proved the fix: plain language, one idea at
a time, interactive visuals carrying the teaching, structural scaffolding (TL;DR, terms recap,
self-check), and hard limits on visible reading.

**Goal:** rebuild all five guide pages in the Start Here style while keeping their full
substance — these are decision/action pages, not concept pages, so depth is preserved but
**layered** instead of dumped.

**Not the goal:** shortening for its own sake, changing URLs, or touching the 5-step path
(`moneyhub/step1–5`) — that is Phase 2, a separate spec.

## 2. Safekeeping (step zero)

Before the first content commit, tag the pre-rewrite state:

```
git tag pre-investing-rewrite
```

Any old page is then always recoverable via
`git show pre-investing-rewrite:moneyhub/investing/<page>.html`. No archived file copies —
duplicates under `moneyhub/` would enter the search index and pollute results.

## 3. The layered-depth contract (applies to every guide)

Each page, top to bottom:

1. Site chrome, breadcrumb, disclaimer callout (unchanged shell — same as today's pages).
2. **"In one sentence"** box (`.lesson-tldr`).
3. **Visible walkthrough** — plain language, first person, ~8th-grade reading level,
   **≤ 500 visible words** (test-enforced; excludes widget figures, collapsible bodies,
   terms recap, and quiz). This layer alone must let a beginner act correctly.
4. **Interactive widget(s)** inline where they teach better than prose (per-page list in §4).
5. **Collapsible detail sections** (`<details class="lesson-details">` with a
   `<summary>` like "Show me the numbers" / "The full comparison") holding the dense
   reference material — tables, edge cases, per-provider comparisons. Content inside
   collapsibles is NOT capped; this is where today's substance survives.
6. **"Terms you now know"** recap (`.lesson-terms`, ≥3 items).
7. **Self-check** (2–3 `<details class="quiz__item">` questions).
8. Prev/next **step-nav footer** — existing chain preserved exactly:
   brokerage-basics → account-types → starter-portfolios → automating-contributions →
   staying-invested. Endpoints stay as they are today: brokerage-basics's prev and
   staying-invested's next both point to `/moneyhub/investing/` (the hub index), and every
   page's home link is `/moneyhub/investing/`.

New CSS: one `.lesson-details` component (summary style, open/closed affordance, inner
padding) added to `lesson.css`, tokens only.

## 4. Per-page treatment

### 4.1 Brokerage Basics (`brokerage-basics.html`)
- **Visible:** what a brokerage is (a store where you buy investments), opening one takes
  ~15 minutes online, the big names are all fine for a beginner — pick one and move on.
- **Widget `order-ticket`:** annotated fake buy screen; tap each part (ticker field, dollar
  vs. share amount, market vs. limit, review button) for a plain-language explanation of
  what it is and what a beginner should pick (market order, dollar amount).
- **Collapsed:** the pre-internet history section; the brokerage-by-brokerage comparison
  ("how I think about the big names"); account-opening step-by-step details.

### 4.2 Account Types (`account-types.html`)
- **Visible:** the three buckets — tax-deferred, tax-free, taxable — each in two sentences;
  the punchline that order-of-operations matters more than perfection.
- **Widget `ops-stepper`:** order-of-operations stepper — 1) get the 401(k) match,
  2) max Roth IRA, 3) back to 401(k), 4) taxable — tap through; each step shows the "why"
  in one sentence.
- **Widget `roth-toggle`:** Roth vs. Traditional toggle — a simple two-phase timeline
  (working years → retirement) that flips where the tax bite lands.
- **Collapsed:** contribution-limit table — **UPDATED to current-year (2026) IRS values,
  verified at implementation time against an authoritative source** (the live page still
  says 2024); HSA section; RMD details; Roth-vs-Traditional decision detail.

### 4.3 Starter Portfolios (`starter-portfolios.html`)
- **Visible:** the Bogle idea (own everything, cheaply, forever) and "pick one of these
  three portfolios — any of them is fine."
- **Widget `allocation`:** portfolio toggle — tap 1-fund / 2-fund / 3-fund; a donut chart
  re-slices with plain-language slice labels (e.g. "US stocks — the engine") and a
  one-line note on who each suits.
- **Collapsed:** age/risk adjustments and sample portfolios by life stage; rebalancing
  mechanics; expense-ratio detail; the individual-stocks caveat section.

### 4.4 Automating Contributions (`automating-contributions.html`)
- **Visible:** automation is the whole system (willpower is not a plan); the three layers —
  paycheck → 401(k), bank → IRA, cash → funds; start with any amount.
- **Widget `paycheck-flow`:** flow diagram — a paycheck node routing into 401(k), IRA, and
  taxable via animated-on-tap arrows; tapping a route explains that layer and what to set up.
- **Collapsed:** per-layer setup walkthroughs; raises/bonuses handling; common mistakes;
  the full automation blueprint.

### 4.5 Staying Invested (`staying-invested.html`)
- **Visible:** volatility is the price of admission; what to do in a 30% drop: nothing, or
  keep buying; behavior is the edge.
- **Widget reuse `crash`:** the crash-history chart from Start Here lesson 7 — the page
  includes `start-here.mjs` (its mount loop only claims its own `data-widget` names).
- **Widget `best-days`:** "miss the best days" chart — growth of the same investment fully
  invested vs. missing the 10 (toggle: 20) best days, static-but-synthetic data echoing the
  well-documented shape (missing a handful of days roughly halves the outcome). This is the
  page's centerpiece.
- **Collapsed:** the personal volatility-plan worksheet; rebalancing-during-crashes;
  emergency-fund connection.

## 5. Widget module structure

- New file **`resources/js/invest-widgets.mjs`**: imports geometry helpers from
  `resources/js/lib/chart-svg.mjs`; owns mounts for `order-ticket`, `ops-stepper`,
  `roth-toggle`, `allocation`, `paycheck-flow`, `best-days`. Same conventions as
  `start-here.mjs`: static inline data only, tokens-only colors, buttons are real
  `<button>`s with `aria-pressed`, tap ≥ click parity, keyboard operable, `aria-live`
  notes, fallback `<p class="widget__fallback">` replaced only when JS runs, all DOM work
  behind `typeof document !== 'undefined'`, named exports for datasets/pure helpers so
  Node tests can import them.
- Coexistence rule: each module's mount loop claims only its own `data-widget` names, so
  `staying-invested.html` can load both modules without double-mounting.
- Guide pages include `invest-widgets.mjs` (and `start-here.mjs` only where a Start Here
  widget is reused).

## 6. Hub index alignment

`moneyhub/investing/index.html` card order currently disagrees with the reading chain.
Reorder cards to match the chain (brokerage-basics first) and add a numbered feel consistent
with the Start Here hub (parts not required — a single ordered list of 5 is fine). Update
card descriptions if a rewrite changes a page's emphasis. Also verify the Start Here
capstone's hand-off links still read correctly (no URL changes expected).

## 7. Testing

- New **`test/investing-guides.test.mjs`** mirroring the Start Here harness:
  - per-page structural checks: disclaimer callout, `.lesson-tldr`, scoped
    `.lesson-terms` (≥3 items), ≥2 quiz items, ≥1 `details.lesson-details`
    collapsible, prev/next/home chain integrity;
  - **visible-word cap ≤ 500**: count words in the article content after stripping widget
    `<figure>`s, all `<details>` elements (collapsibles AND quiz), and the terms section;
  - hub index lists all five guides in chain order.
- Data/unit tests for `invest-widgets.mjs` exports (dataset validity, e.g. best-days series:
  fully-invested end value ≫ miss-10 ≫ miss-20; allocation slices sum to 100).
- Existing suite (including Start Here harness and index-freshness) stays green; every
  content commit rebuilds `resources/data/search-index.json`.
- Manual QA pass: widgets in light/dark, mobile tap, keyboard, JS-off fallbacks — same
  checklist as Start Here.

## 8. Out of scope (Phase 2+)

- The 5-step path pages (`moneyhub/step1–5`) — same treatment, separate spec.
- URL or filename changes; Q&A and Topics pages; video content.
- Live data in widgets; progress tracking.

## 9. Success criteria

- A beginner can read only the visible layer of all five pages (≤ 2,500 words total) and
  correctly: open a brokerage, pick the right account order, choose a starter portfolio,
  set up automation, and know what to do in a crash.
- No substance lost: every table/comparison/edge case from the old pages either appears in
  a collapsible or was deliberately cut (the plan lists any cuts explicitly).
- Contribution limits and any dated facts are current-year and sourced.
- All existing URLs resolve with the same reading chain; suite green; old text recoverable
  via the `pre-investing-rewrite` tag.
