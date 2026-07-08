# Wealth "Start Here" Beginner Series Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/moneyhub/start-here/` — an index page plus 10 short, plain-language lessons with interactive SVG widgets that take a total beginner from "what is a stock?" to reading a Gojo Market Take, leaning long-term investing throughout.

**Architecture:** Static HTML pages on the existing site template (chrome header/footer, breadcrumb, article layout, step-nav footer). Interactivity comes from one new vanilla-JS module (`start-here.mjs`) that mounts widgets into `[data-widget]` placeholders, backed by a pure, DOM-free geometry library (`chart-svg.mjs`) that is unit-tested in Node. New `lesson.css` component holds all new styles, tokens-only colors (dark mode free). A new Node test file enforces page structure, prev/next chain integrity, and the per-lesson word cap.

**Tech Stack:** Plain HTML/CSS, vanilla ES modules, `node --test` (no new dependencies).

**Spec:** `docs/superpowers/specs/2026-07-07-wealth-start-here-design.md` (approved 2026-07-07).

## Global Constraints

- Lesson body prose (before the "Terms you now know" section, excluding widget figures): **300–450 words max — the test enforces ≤ 450**. Plain language, ~8th-grade reading level, first-person Tui voice.
- **Long-term investing lean:** every lesson's takeaway must point at simple, boring, decades-long investing. Charts/jargon/VIX are taught as literacy for decoding noise, never as trading technique. Candlesticks framed as "I can read them; I don't trade off them."
- Colors ONLY via `tokens.css` CSS variables (e.g. `var(--color-accent-primary)`) — never hardcoded hex. This makes dark mode work automatically.
- No new dependencies, no external requests, no live market data. All chart data is synthetic/simplified static arrays.
- Widgets must: work by tap/click (not hover-only), be keyboard operable (`<button>`s, `tabindex="0"` + focus handlers on candles), carry `aria-label`s, and degrade to a readable static fallback with JS disabled.
- **Every commit that adds/changes a content page under `moneyhub/` MUST run `npm run build:index` and include `resources/data/search-index.json` in the same commit** — otherwise `test/index-fresh.test.mjs` fails.
- Commit message style: plain imperative ("Add …", "Fix …"), matching repo history.
- All work happens on branch `start-here`, merged to `main` at the end.
- The `<head>` in §SHELL (Google Fonts, Font Awesome kit script) is copied verbatim from the existing site template for consistency. Known caveat: the FA kit script has no SRI hash — FA kits are dynamically versioned and don't support `integrity` attributes. Revisiting that is a site-wide decision, out of scope here; do NOT add SRI to just these pages.

## Lesson Order (canonical — used by index page, prev/next links, and tests)

| # | Slug | Title |
|---|---|---|
| 1 | `what-is-a-stock` | What Is a Stock? |
| 2 | `what-is-the-stock-market` | What Is the Stock Market? |
| 3 | `why-invest` | Why Invest at All? |
| 4 | `tickers-and-indices` | Tickers and Indices |
| 5 | `funds-and-etfs` | Funds and ETFs |
| 6 | `how-to-read-a-chart` | How to Read a Chart |
| 7 | `bulls-bears-and-crashes` | Bulls, Bears, and Crashes |
| 8 | `volatility-and-the-vix` | Volatility and the VIX |
| 9 | `earnings-sectors-analyst-talk` | Earnings, Sectors, and Analyst Talk |
| 10 | `read-a-market-take` | How to Read a Market Take |

Prev/next chain: lesson 1 has no prev; lesson 10's next points to `/moneyhub/investing/` (hand-off to the existing investing guides). Every lesson's home link points to `/moneyhub/start-here/`.

## §SHELL — Canonical lesson page shell

Every lesson page (Tasks 5–14) is EXACTLY this file with the seven `{{SLOT}}`s filled in. Do not deviate from it — the tests match this structure literally.

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} | Start Here | Tui Alailima</title>
  <meta name="description" content="{{DESC}}">
  <link rel="icon" href="/resources/images/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://kit.fontawesome.com/ed35775394.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="/resources/css/style.css">
  <script src="/resources/js/theme.js"></script>
</head>
<body>
  <header class="chrome-header" id="site-header" aria-label="Site header"></header>
  <main class="article-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/moneyhub/">Wealth</a></li><li><a href="/moneyhub/start-here/">Start Here</a></li><li aria-current="page">{{TITLE}}</li></ol></nav>
    <div class="article-page__grid">
      <article class="article">
        <header class="article__header">
          <span class="kicker">WEALTH · START HERE</span>
          <h1 class="article__title">{{TITLE}}</h1>
          <p class="byline">By <b>Tui Alailima</b> · 2 min read</p>
        </header>
        <aside class="callout callout--ai">
          <span class="callout__icon" aria-hidden="true">▲</span>
          <p>I'm not a CPA or licensed financial advisor. This page explains how I personally think about money. It's for education only, not tailored advice.</p>
        </aside>
        <div class="article__content">{{CONTENT}}</div>
        <nav class="step-nav-footer">
        {{PREV_BLOCK}}
        <a href="/moneyhub/start-here/" class="step-nav-footer__home">
            Start Here
        </a>
        <a href="{{NEXT_HREF}}" class="step-nav-footer__next">
            <span>
                <span class="label">Next</span>
                <span class="title">{{NEXT_TITLE}}</span>
            </span>
            <span class="arrow">→</span>
        </a>
    </nav>
      </article>
      <aside class="article-rail" id="article-rail" data-url="/moneyhub/start-here/{{SLUG}}.html" data-ticker="" data-section="Wealth"></aside>
    </div>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
  <script type="module" src="/resources/js/article.mjs"></script>
  <script type="module" src="/resources/js/start-here.mjs"></script>
</body>
</html>
```

`{{PREV_BLOCK}}` for lesson 1 is empty (omit the anchor entirely). For lessons 2–10 it is:

```html
<a href="/moneyhub/start-here/{{PREV_SLUG}}.html" class="step-nav-footer__prev">
    <span class="arrow">←</span>
    <span>
        <span class="label">Previous</span>
        <span class="title">{{PREV_TITLE}}</span>
    </span>
</a>
```

`{{CONTENT}}` always follows this internal order:

1. `<aside class="lesson-tldr">…` (the one-sentence summary)
2. optional `<blockquote class="lesson-opener">…` (real Gojo quote) + note
3. body prose (`<p>`, `<h2>`, `<ul>`, widget `<figure>`s)
4. `<section class="lesson-terms">…` (Terms you now know)
5. `<section class="quiz">…` (Check yourself, ≥2 `<details class="quiz__item">`)

Widget placeholder pattern (JS replaces the fallback inside `.widget__body`):

```html
<figure class="widget" data-widget="{{WIDGET_NAME}}">
  <div class="widget__body">
    <p class="widget__fallback">{{FALLBACK_TEXT}}</p>
  </div>
  <figcaption class="widget__caption">{{CAPTION}}</figcaption>
</figure>
```

---

### Task 1: Branch + `lesson.css` component

**Files:**
- Create: `resources/css/components/lesson.css`
- Modify: `resources/css/style.css` (add one `@import` after the `authored-dark.css` line)

**Interfaces:**
- Produces: CSS classes `.lesson-tldr`, `.lesson-tldr__label`, `.lesson-opener`, `.lesson-opener__note`, `.lesson-terms`, `.quiz`, `.quiz__item`, `.widget`, `.widget__body`, `.widget__fallback`, `.widget__caption`, `.widget__controls`, `.widget__btn`, `.widget__btn.is-active`, `.widget__note`, `.widget__readout` — used verbatim by all lesson pages (Tasks 5–14) and by `start-here.mjs` (Task 3).

- [ ] **Step 1: Create the branch**

```bash
git checkout -b start-here
```

- [ ] **Step 2: Write `resources/css/components/lesson.css`**

```css
/* ============================================
   LESSON — Start Here beginner series
   TL;DR box, Gojo opener quote, terms recap,
   self-check quiz, interactive widget frame.
   Tokens only — dark mode comes for free.
   ============================================ */

.lesson-tldr {
  background: var(--color-bg-secondary);
  border-left: 3px solid var(--color-accent-primary);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-8);
}

.lesson-tldr__label {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent-primary);
  margin-bottom: var(--space-2);
}

.lesson-tldr p {
  font-size: var(--text-lg);
  color: var(--color-text-primary);
  line-height: var(--leading-snug);
  margin: 0;
}

.lesson-opener {
  border-left: 3px solid var(--color-border-strong);
  padding: var(--space-2) var(--space-5);
  margin: 0 0 var(--space-2);
  font-style: italic;
  color: var(--color-text-secondary);
}

.lesson-opener p { margin-bottom: var(--space-2); }

.lesson-opener cite {
  display: block;
  font-style: normal;
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.lesson-opener__note {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-8);
}

.lesson-terms {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  margin-top: var(--space-12);
}

.lesson-terms h2 {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin: 0 0 var(--space-4);
}

.lesson-terms ul { margin-bottom: 0; }
.lesson-terms li { font-size: var(--text-sm); }

.quiz { margin-top: var(--space-8); }

.quiz h2 {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-4);
}

.quiz__item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  background: var(--color-bg-primary);
}

.quiz__item summary {
  cursor: pointer;
  padding: var(--space-4) var(--space-5);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  list-style: none;
}

.quiz__item summary::before {
  content: "Q ";
  font-family: var(--font-mono);
  color: var(--color-accent-primary);
  font-weight: var(--weight-bold);
}

.quiz__item[open] summary { border-bottom: 1px solid var(--color-border); }

.quiz__item p {
  padding: var(--space-4) var(--space-5);
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.widget {
  margin: var(--space-8) 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background: var(--color-bg-primary);
}

.widget__body svg {
  display: block;
  width: 100%;
  height: auto;
}

.widget__fallback {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.widget__caption {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin-top: var(--space-3);
}

.widget__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.widget__btn {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  min-height: 36px;
  transition: all var(--transition-fast);
}

.widget__btn:hover { border-color: var(--color-accent-primary); }

.widget__btn:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

.widget__btn.is-active {
  background: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  color: var(--color-bg-primary);
}

.widget__note,
.widget__readout {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-top: var(--space-3);
  min-height: 2.5em;
}

.widget [tabindex="0"]:focus-visible {
  outline: 2px solid var(--color-accent-primary);
}
```

- [ ] **Step 3: Wire the import into `resources/css/style.css`**

After the line `@import url('components/authored-dark.css');` add:

```css
@import url('components/lesson.css');
```

- [ ] **Step 4: Verify wiring and run existing suite**

Run: `grep -c "lesson.css" resources/css/style.css` → Expected: `1`
Run: `npm test` → Expected: all existing tests PASS (this task adds no testable JS).

- [ ] **Step 5: Commit**

```bash
git add resources/css/components/lesson.css resources/css/style.css
git commit -m "Add lesson.css component for Start Here beginner series"
```

---

### Task 2: `chart-svg.mjs` — pure geometry library (TDD)

**Files:**
- Create: `resources/js/lib/chart-svg.mjs`
- Test: `test/chart-svg.test.mjs`

**Interfaces:**
- Produces (consumed by Task 3):
  - `extent(values: number[]) -> [min, max]` (pads equal min/max by ±1)
  - `scale(v, dMin, dMax, rMin, rMax) -> number` (linear map)
  - `linePath(values: number[], w, h, pad=10) -> string` (SVG path `M…L…`)
  - `candleGeometry(ohlc: {o,h,l,c}[], w, h, pad=10) -> {x, w, xMid, bodyY, bodyH, wickY1, wickY2, up}[]`

- [ ] **Step 1: Write the failing test `test/chart-svg.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extent, scale, linePath, candleGeometry } from '../resources/js/lib/chart-svg.mjs';

test('extent finds min/max and pads a flat series', () => {
  assert.deepEqual(extent([3, 9, 5]), [3, 9]);
  assert.deepEqual(extent([7, 7]), [6, 8]);
});

test('scale maps domain endpoints to range endpoints', () => {
  assert.equal(scale(0, 0, 10, 100, 200), 100);
  assert.equal(scale(10, 0, 10, 100, 200), 200);
  assert.equal(scale(5, 0, 10, 200, 100), 150); // inverted range (SVG y-axis)
});

test('linePath emits one command per value, M first, within bounds', () => {
  const path = linePath([1, 2, 3, 2], 100, 50, 10);
  const cmds = path.split(' ');
  assert.equal(cmds.length, 4);
  assert.ok(cmds[0].startsWith('M'));
  assert.ok(cmds.slice(1).every(c => c.startsWith('L')));
  for (const c of cmds) {
    const [x, y] = c.slice(1).split(',').map(Number);
    assert.ok(x >= 10 && x <= 90, `x ${x} within pad`);
    assert.ok(y >= 10 && y <= 40, `y ${y} within pad`);
  }
});

test('candleGeometry: up candle when close >= open, wicks span high/low', () => {
  const geo = candleGeometry(
    [{ o: 10, h: 14, l: 9, c: 13 }, { o: 13, h: 13.5, l: 10, c: 11 }],
    200, 100, 10
  );
  assert.equal(geo.length, 2);
  assert.equal(geo[0].up, true);
  assert.equal(geo[1].up, false);
  // wick top (high) is above body top; wick bottom (low) is below body bottom
  assert.ok(geo[0].wickY1 <= geo[0].bodyY);
  assert.ok(geo[0].wickY2 >= geo[0].bodyY + geo[0].bodyH);
  assert.ok(geo[0].bodyH >= 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/chart-svg.test.mjs`
Expected: FAIL — `Cannot find module … chart-svg.mjs`

- [ ] **Step 3: Write `resources/js/lib/chart-svg.mjs`**

```js
// Pure SVG-geometry helpers for the Start Here widgets.
// No DOM access — unit-testable under node --test.

export function extent(values) {
  let min = Infinity, max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) { min -= 1; max += 1; }
  return [min, max];
}

export function scale(v, dMin, dMax, rMin, rMax) {
  return rMin + ((v - dMin) / (dMax - dMin)) * (rMax - rMin);
}

export function linePath(values, w, h, pad = 10) {
  const [lo, hi] = extent(values);
  return values
    .map((v, i) => {
      const x = scale(i, 0, values.length - 1, pad, w - pad);
      const y = scale(v, lo, hi, h - pad, pad);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function candleGeometry(ohlc, w, h, pad = 10) {
  const lo = Math.min(...ohlc.map(c => c.l));
  const hi = Math.max(...ohlc.map(c => c.h));
  const slot = (w - pad * 2) / ohlc.length;
  const bodyW = slot * 0.6;
  const y = v => scale(v, lo, hi, h - pad, pad);
  return ohlc.map((c, i) => {
    const xMid = pad + slot * i + slot / 2;
    const top = Math.max(c.o, c.c);
    const bot = Math.min(c.o, c.c);
    return {
      x: xMid - bodyW / 2,
      w: bodyW,
      xMid,
      bodyY: y(top),
      bodyH: Math.max(1, y(bot) - y(top)),
      wickY1: y(c.h),
      wickY2: y(c.l),
      up: c.c >= c.o,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/chart-svg.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add resources/js/lib/chart-svg.mjs test/chart-svg.test.mjs
git commit -m "Add pure SVG chart geometry library for Start Here widgets"
```

---

### Task 3: `start-here.mjs` — widget datasets + DOM mounting (TDD on data)

**Files:**
- Create: `resources/js/start-here.mjs`
- Test: `test/start-here-data.test.mjs`

**Interfaces:**
- Consumes: `linePath`, `candleGeometry`, `extent`, `scale` from `resources/js/lib/chart-svg.mjs` (Task 2).
- Produces:
  - Named exports (unit-tested): `SERIES` (`{'1D'|'1M'|'1Y'|'20Y': {label, note, values}}`), `CRASHES` (`{years, values, markers}`), `CANDLES` (`{o,h,l,c}[]`), `compoundSeries(monthly, annualRate, years) -> number[]`
  - Side effect on import in a browser: mounts widgets into every `[data-widget]` element. Widget names (used by lesson pages Tasks 7, 10, 11, 13): `compound`, `anatomy`, `timeframe`, `crash`, `candles`.

- [ ] **Step 1: Write the failing test `test/start-here-data.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERIES, CRASHES, CANDLES, compoundSeries } from '../resources/js/start-here.mjs';

test('SERIES has all four timeframes with enough points to draw', () => {
  for (const key of ['1D', '1M', '1Y', '20Y']) {
    assert.ok(SERIES[key], `missing ${key}`);
    assert.ok(SERIES[key].values.length >= 10, `${key} has >= 10 points`);
    assert.ok(SERIES[key].label.length > 0);
    assert.ok(SERIES[key].note.length > 0);
  }
});

test('20Y series ends higher than it starts (the whole point of the lesson)', () => {
  const v = SERIES['20Y'].values;
  assert.ok(v[v.length - 1] > v[0] * 3);
});

test('CRASHES markers all fall inside the year range', () => {
  const { years, values, markers } = CRASHES;
  assert.equal(years.length, values.length);
  for (const m of markers) {
    assert.ok(years.includes(m.year), `marker year ${m.year} in series`);
    assert.ok(m.label.length > 0);
  }
  assert.ok(values[values.length - 1] > values[0]);
});

test('CANDLES are internally consistent OHLC', () => {
  assert.ok(CANDLES.length >= 5);
  for (const c of CANDLES) {
    assert.ok(c.h >= Math.max(c.o, c.c), 'high >= body top');
    assert.ok(c.l <= Math.min(c.o, c.c), 'low <= body bottom');
  }
});

test('compoundSeries grows and beats the cash pile', () => {
  const years = 30, monthly = 200;
  const invested = compoundSeries(monthly, 0.08, years);
  const cash = compoundSeries(monthly, 0.005, years);
  assert.equal(invested.length, years + 1);
  assert.equal(invested[0], 0);
  for (let i = 1; i < invested.length; i++) assert.ok(invested[i] > invested[i - 1]);
  assert.ok(invested[years] > cash[years] * 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/start-here-data.test.mjs`
Expected: FAIL — `Cannot find module … start-here.mjs`

- [ ] **Step 3: Write `resources/js/start-here.mjs`**

Complete file (datasets, render helpers, five mounts, guarded init — importing under Node must NOT touch `document`):

```js
// Start Here beginner-series widgets.
// Mounts interactive SVG charts into [data-widget] placeholders.
// Data is synthetic/simplified — shapes echo real history, values are illustrative.

import { linePath, candleGeometry, extent, scale } from './lib/chart-svg.mjs';

const W = 640, H = 280, PAD = 16;

export const SERIES = {
  '1D': {
    label: '1 day',
    note: 'One trading day, half-hour steps. Down 0.1%. Feels like it matters. It doesn’t.',
    values: [745.7, 745.2, 744.1, 743.5, 744.4, 745.9, 745.1, 743.8, 742.9, 743.6, 744.5, 745.3, 744.9, 744.78],
  },
  '1M': {
    label: '1 month',
    note: 'A month of daily closes. Some scary red days in the middle. Still noise.',
    values: [721, 724, 719, 715, 722, 726, 730, 727, 733, 738, 735, 729, 725, 731, 737, 741, 739, 744, 742, 746, 743, 744.78],
  },
  '1Y': {
    label: '1 year',
    note: 'Twelve months. A real dip, a real recovery. The trend starts to show.',
    values: [640, 655, 671, 662, 648, 668, 684, 701, 693, 712, 728, 741, 744.78],
  },
  '20Y': {
    label: '20 years',
    note: 'Same fund, twenty years — including two brutal crashes you can barely see. Zoom out.',
    values: [127, 132, 90, 102, 114, 114, 130, 168, 187, 186, 205, 245, 240, 300, 340, 430, 380, 455, 540, 620, 744.78],
  },
};

export const CRASHES = {
  years: [1990, 1992, 1994, 1996, 1998, 2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026],
  values: [330, 435, 459, 740, 1229, 1320, 880, 1212, 1418, 903, 1258, 1426, 2059, 2239, 2507, 3756, 3840, 5882, 7450],
  markers: [
    { year: 2000, label: 'Dot-com bust −49%' },
    { year: 2008, label: 'Financial crisis −57%' },
    { year: 2020, label: 'COVID crash −34%' },
    { year: 2022, label: 'Rate-hike bear −25%' },
  ],
};

export const CANDLES = [
  { o: 738, h: 743, l: 736, c: 741 },
  { o: 741, h: 745, l: 739, c: 744 },
  { o: 744, h: 746, l: 737, c: 739 },
  { o: 739, h: 741, l: 733, c: 735 },
  { o: 735, h: 742, l: 734, c: 741 },
  { o: 741, h: 748, l: 740, c: 747 },
  { o: 747, h: 749, l: 743, c: 745 },
];

export function compoundSeries(monthly, annualRate, years) {
  const out = [0];
  let bal = 0;
  for (let y = 1; y <= years; y++) {
    bal = bal * (1 + annualRate) + monthly * 12;
    out.push(Math.round(bal));
  }
  return out;
}

/* ---------- rendering helpers (browser only) ---------- */

const fmt = n => '$' + Math.round(n).toLocaleString('en-US');

function svgOpen(label) {
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">`;
}

function axes() {
  return `<line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/>` +
         `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/>`;
}

function lineSvg(values, label, extra = '') {
  return svgOpen(label) + axes() +
    `<path d="${linePath(values, W, H, PAD)}" fill="none" stroke="var(--color-accent-primary)" stroke-width="2.5"/>` +
    extra + '</svg>';
}

function makeButtons(container, items, onPick) {
  const wrap = document.createElement('div');
  wrap.className = 'widget__controls';
  items.forEach((item, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'widget__btn' + (i === 0 ? ' is-active' : '');
    b.textContent = item;
    b.addEventListener('click', () => {
      wrap.querySelectorAll('.widget__btn').forEach(x => x.classList.remove('is-active'));
      b.classList.add('is-active');
      onPick(item, i);
    });
    wrap.appendChild(b);
  });
  container.appendChild(wrap);
  return wrap;
}

/* ---------- widget mounts ---------- */

function mountTimeframe(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = document.createElement('p');
  note.className = 'widget__note';
  note.setAttribute('aria-live', 'polite');
  const draw = key => {
    const s = SERIES[key];
    chart.innerHTML = lineSvg(s.values, `Fund price over ${s.label}`);
    note.textContent = s.note;
  };
  makeButtons(body, Object.keys(SERIES), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('1D');
}

function mountCompound(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = document.createElement('p');
  note.className = 'widget__note';
  note.setAttribute('aria-live', 'polite');
  const draw = label => {
    const years = parseInt(label, 10);
    const invested = compoundSeries(200, 0.08, years);
    const cash = compoundSeries(200, 0.005, years);
    const [, hi] = extent(invested);
    const path = v => v.map((n, i) =>
      `${i === 0 ? 'M' : 'L'}${scale(i, 0, years, PAD, W - PAD).toFixed(1)},${scale(n, 0, hi, H - PAD, PAD).toFixed(1)}`
    ).join(' ');
    chart.innerHTML = svgOpen(`$200 a month for ${years} years: invested versus cash`) + axes() +
      `<path d="${path(cash)}" fill="none" stroke="var(--color-text-tertiary)" stroke-width="2" stroke-dasharray="4 4"/>` +
      `<path d="${path(invested)}" fill="none" stroke="var(--color-accent-primary)" stroke-width="2.5"/>` +
      '</svg>';
    note.textContent = `$200/month for ${years} years — cash: ${fmt(cash[years])}. Invested at 8%/yr: ${fmt(invested[years])}. Same deposits, different machine.`;
  };
  makeButtons(body, ['10 years', '20 years', '30 years'], draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('10 years');
}

function mountAnatomy(body) {
  body.textContent = '';
  const s = SERIES['1M'].values;
  const [lo, hi] = extent(s);
  const vols = s.map((_, i) => 20 + ((i * 37) % 40)); // deterministic pseudo-volume
  const bars = vols.map((v, i) => {
    const x = scale(i, 0, s.length - 1, PAD, W - PAD);
    return `<rect x="${(x - 4).toFixed(1)}" y="${(H - PAD - v).toFixed(1)}" width="8" height="${v}" fill="var(--color-border)"/>`;
  }).join('');
  const parts = {
    'Price line': { sel: 'g[data-part="price"]', text: 'The line is the price over time — each point is what the fund cost that day. Up and to the right is what you want over years, not days.' },
    'Price axis': { sel: 'g[data-part="yaxis"]', text: 'The vertical axis is price in dollars. Careful: it often does not start at zero, which makes small moves look dramatic.' },
    'Time axis': { sel: 'g[data-part="xaxis"]', text: 'The horizontal axis is time. Always check it first — a scary cliff on a 1-day chart is invisible on a 10-year chart.' },
    'Volume': { sel: 'g[data-part="volume"]', text: 'The bars along the bottom are volume — how many shares changed hands. Tall bars mean busy days, usually around news.' },
  };
  const chart = document.createElement('div');
  chart.innerHTML = svgOpen('Anatomy of a price chart') +
    `<g data-part="yaxis"><line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/><text x="${PAD + 6}" y="${PAD + 12}" font-size="12" fill="var(--color-text-tertiary)">$${Math.round(hi)}</text><text x="${PAD + 6}" y="${H - PAD - 6}" font-size="12" fill="var(--color-text-tertiary)">$${Math.round(lo)}</text></g>` +
    `<g data-part="xaxis"><line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/><text x="${W - PAD - 80}" y="${H - 2}" font-size="12" fill="var(--color-text-tertiary)">time →</text></g>` +
    `<g data-part="volume">${bars}</g>` +
    `<g data-part="price"><path d="${linePath(s, W, H, PAD)}" fill="none" stroke="var(--color-accent-primary)" stroke-width="2.5"/></g>` +
    '</svg>';
  const note = document.createElement('p');
  note.className = 'widget__note';
  note.setAttribute('aria-live', 'polite');
  note.textContent = 'Tap a label to highlight that part of the chart.';
  makeButtons(body, Object.keys(parts), name => {
    chart.querySelectorAll('g[data-part]').forEach(g => (g.style.opacity = '0.25'));
    chart.querySelector(parts[name].sel).style.opacity = '1';
    note.textContent = parts[name].text;
  });
  body.appendChild(chart);
  body.appendChild(note);
}

function mountCrash(body) {
  body.textContent = '';
  const { years, values, markers } = CRASHES;
  const [lo, hi] = extent(values);
  const dots = markers.map(m => {
    const i = years.indexOf(m.year);
    const x = scale(i, 0, years.length - 1, PAD, W - PAD);
    const y = scale(values[i], lo, hi, H - PAD, PAD);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="var(--color-warning)"/>` +
           `<text x="${Math.min(x + 8, W - 150).toFixed(1)}" y="${Math.max(y - 8, 14).toFixed(1)}" font-size="12" fill="var(--color-text-secondary)">${m.year} ${m.label}</text>`;
  }).join('');
  const chart = document.createElement('div');
  chart.innerHTML = lineSvg(values, 'US market since 1990 with major crashes marked', dots);
  const note = document.createElement('p');
  note.className = 'widget__note';
  note.textContent = 'Four brutal crashes. Zoomed out, every one of them is a wiggle on the way up. (Simplified index levels.)';
  body.appendChild(chart);
  body.appendChild(note);
}

function mountCandles(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const readout = document.createElement('p');
  readout.className = 'widget__readout';
  readout.setAttribute('aria-live', 'polite');
  readout.textContent = 'Tap or focus a candle to read it.';
  let mode = 'Candles';
  const draw = () => {
    if (mode === 'Line') {
      chart.innerHTML = lineSvg(CANDLES.map(c => c.c), 'The same week as a simple line of closing prices');
      readout.textContent = 'Same seven days, just the closing prices. This is all a long-term investor needs.';
      return;
    }
    const geo = candleGeometry(CANDLES, W, H, PAD);
    const inner = geo.map((g, i) => {
      const c = CANDLES[i];
      const color = g.up ? 'var(--color-success)' : 'var(--color-error)';
      const desc = `Day ${i + 1}: opened $${c.o}, high $${c.h}, low $${c.l}, closed $${c.c} — ${g.up ? 'an up day (green)' : 'a down day (red)'}`;
      return `<g tabindex="0" role="button" data-idx="${i}" aria-label="${desc}">` +
        `<line x1="${g.xMid.toFixed(1)}" y1="${g.wickY1.toFixed(1)}" x2="${g.xMid.toFixed(1)}" y2="${g.wickY2.toFixed(1)}" stroke="${color}" stroke-width="1.5"/>` +
        `<rect x="${g.x.toFixed(1)}" y="${g.bodyY.toFixed(1)}" width="${g.w.toFixed(1)}" height="${g.bodyH.toFixed(1)}" fill="${color}"/>` +
        '</g>';
    }).join('');
    chart.innerHTML = svgOpen('Seven days of candlesticks; each candle is one day') + axes() + inner + '</svg>';
    chart.querySelectorAll('g[data-idx]').forEach(g => {
      const show = () => (readout.textContent = g.getAttribute('aria-label'));
      g.addEventListener('click', show);
      g.addEventListener('focus', show);
      g.addEventListener('mouseenter', show);
    });
  };
  makeButtons(body, ['Candles', 'Line'], name => { mode = name; draw(); });
  body.appendChild(chart);
  body.appendChild(readout);
  draw();
}

/* ---------- init ---------- */

const MOUNTS = {
  timeframe: mountTimeframe,
  compound: mountCompound,
  anatomy: mountAnatomy,
  crash: mountCrash,
  candles: mountCandles,
};

if (typeof document !== 'undefined') {
  for (const el of document.querySelectorAll('[data-widget]')) {
    const mount = MOUNTS[el.dataset.widget];
    const body = el.querySelector('.widget__body');
    if (mount && body) mount(body);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/start-here-data.test.mjs`
Expected: PASS (5 tests). Also run `npm test` — all existing tests still PASS (module import must not touch `document` under Node).

- [ ] **Step 5: Commit**

```bash
git add resources/js/start-here.mjs test/start-here-data.test.mjs
git commit -m "Add Start Here widget module: datasets and interactive SVG mounts"
```

---

### Task 4: Page-structure test harness + Start Here index page

**Files:**
- Create: `test/start-here.test.mjs`
- Create: `moneyhub/start-here/index.html`

**Interfaces:**
- Produces: `test/start-here.test.mjs` with a `CREATED` array — **each lesson task (5–14) appends its slug to `CREATED`**, which activates the full structural check for that page (title, disclaimer, tldr, terms, quiz, word cap, prev/next chain, meta description).

- [ ] **Step 1: Write the failing test `test/start-here.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'moneyhub', 'start-here');
const BASE = '/moneyhub/start-here';

const ORDER = [
  ['what-is-a-stock', 'What Is a Stock?'],
  ['what-is-the-stock-market', 'What Is the Stock Market?'],
  ['why-invest', 'Why Invest at All?'],
  ['tickers-and-indices', 'Tickers and Indices'],
  ['funds-and-etfs', 'Funds and ETFs'],
  ['how-to-read-a-chart', 'How to Read a Chart'],
  ['bulls-bears-and-crashes', 'Bulls, Bears, and Crashes'],
  ['volatility-and-the-vix', 'Volatility and the VIX'],
  ['earnings-sectors-analyst-talk', 'Earnings, Sectors, and Analyst Talk'],
  ['read-a-market-take', 'How to Read a Market Take'],
];

// Pages built so far. Each lesson task appends its slug here.
const CREATED = [];

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('start-here index links every lesson, in order', () => {
  const html = readFileSync(join(DIR, 'index.html'), 'utf8');
  let pos = -1;
  for (const [slug] of ORDER) {
    const i = html.indexOf(`href="${BASE}/${slug}.html"`);
    assert.ok(i > pos, `index links ${slug} after the previous lesson`);
    pos = i;
  }
  assert.match(html, /class="breadcrumb"/);
});

for (const slug of CREATED) {
  const idx = ORDER.findIndex(([s]) => s === slug);
  const [, title] = ORDER[idx];
  test(`lesson page: ${slug}`, () => {
    const html = readFileSync(join(DIR, `${slug}.html`), 'utf8');
    assert.match(html, new RegExp(`<h1 class="article__title">${esc(title)}</h1>`));
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /class="callout callout--ai"/);
    assert.match(html, /class="lesson-tldr"/);
    assert.ok((html.match(/<li>/g) || []).length >= 3, 'terms recap has >= 3 items');
    assert.match(html, /class="lesson-terms"/);
    assert.ok(
      (html.match(/<details class="quiz__item">/g) || []).length >= 2,
      'has >= 2 self-check questions'
    );
    // Word cap: prose between article__content start and the terms recap,
    // with widget figures stripped, must be <= 450 words.
    const body = html.match(
      /<div class="article__content">([\s\S]*?)<section class="lesson-terms">/
    );
    assert.ok(body, 'content ends with a lesson-terms section');
    const words = body[1]
      .replace(/<figure class="widget"[\s\S]*?<\/figure>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .trim()
      .split(/\s+/).length;
    assert.ok(words <= 450, `body prose is ${words} words (cap 450)`);
    // Prev/next chain integrity.
    const prev = idx === 0 ? null : `${BASE}/${ORDER[idx - 1][0]}.html`;
    const next = idx === ORDER.length - 1
      ? '/moneyhub/investing/'
      : `${BASE}/${ORDER[idx + 1][0]}.html`;
    if (prev) {
      assert.ok(html.includes(`href="${prev}" class="step-nav-footer__prev"`), 'prev link');
    } else {
      assert.ok(!html.includes('step-nav-footer__prev'), 'lesson 1 has no prev');
    }
    assert.ok(html.includes(`href="${next}" class="step-nav-footer__next"`), 'next link');
    assert.ok(html.includes(`href="${BASE}/" class="step-nav-footer__home"`), 'home link');
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/start-here.test.mjs`
Expected: FAIL — index test throws `ENOENT … moneyhub/start-here/index.html`

- [ ] **Step 3: Create `moneyhub/start-here/index.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Start Here | Wealth | Tui Alailima</title>
  <meta name="description" content="Ten short, plain-language lessons for total beginners — what a stock is, what SPY means, how to read a chart, and why I invest for decades instead of trading.">
  <link rel="icon" href="/resources/images/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://kit.fontawesome.com/ed35775394.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="/resources/css/style.css">
  <script src="/resources/js/theme.js"></script>
</head>
<body>
  <header class="chrome-header" id="site-header" aria-label="Site header"></header>
  <main class="hub-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li><a href="/moneyhub/">Wealth</a></li><li aria-current="page">Start Here</li>
    </ol></nav>
    <header class="hub-page__head">
      <span class="hub-page__kicker">Wealth · Start Here</span>
      <h1 class="hub-page__title">Start Here</h1>
      <p class="hub-page__subtitle">Never bought a stock? Never read a chart? Ten short lessons, no experience assumed — and no pressure to trade anything, ever.</p>
    </header>
    <section class="hub-section">
      <h2 class="hub-section__title">Part 1 — The ground floor</h2>
      <div class="hub-steps">
        <a class="hub-step" href="/moneyhub/start-here/what-is-a-stock.html"><span class="hub-step__num">1</span><span><span class="hub-step__title">What Is a Stock?</span><span class="hub-step__desc">A tiny ownership slice of a real company — and why companies sell slices at all.</span></span></a>
        <a class="hub-step" href="/moneyhub/start-here/what-is-the-stock-market.html"><span class="hub-step__num">2</span><span><span class="hub-step__title">What Is the Stock Market?</span><span class="hub-step__desc">Where those slices get bought and sold, and why prices move every single day.</span></span></a>
        <a class="hub-step" href="/moneyhub/start-here/why-invest.html"><span class="hub-step__num">3</span><span><span class="hub-step__title">Why Invest at All?</span><span class="hub-step__desc">Compounding, in one interactive chart. What $200 a month actually turns into.</span></span></a>
      </div>
    </section>
    <section class="hub-section">
      <h2 class="hub-section__title">Part 2 — The long-term investor's toolkit</h2>
      <div class="hub-steps">
        <a class="hub-step" href="/moneyhub/start-here/tickers-and-indices.html"><span class="hub-step__num">4</span><span><span class="hub-step__title">Tickers and Indices</span><span class="hub-step__desc">What "SPY" actually means. Tickers, the S&amp;P 500, QQQ, and the Dow.</span></span></a>
        <a class="hub-step" href="/moneyhub/start-here/funds-and-etfs.html"><span class="hub-step__num">5</span><span><span class="hub-step__title">Funds and ETFs</span><span class="hub-step__desc">Why owning a slice of everything beats trying to pick winners.</span></span></a>
        <a class="hub-step" href="/moneyhub/start-here/how-to-read-a-chart.html"><span class="hub-step__num">6</span><span><span class="hub-step__title">How to Read a Chart</span><span class="hub-step__desc">The parts of a price chart — and how the same fund looks terrifying at 1 day and unstoppable at 20 years.</span></span></a>
      </div>
    </section>
    <section class="hub-section">
      <h2 class="hub-section__title">Part 3 — Decoding the noise</h2>
      <div class="hub-steps">
        <a class="hub-step" href="/moneyhub/start-here/bulls-bears-and-crashes.html"><span class="hub-step__num">7</span><span><span class="hub-step__title">Bulls, Bears, and Crashes</span><span class="hub-step__desc">What the scary words mean, and every crash since 1990 — zoomed out.</span></span></a>
        <a class="hub-step" href="/moneyhub/start-here/volatility-and-the-vix.html"><span class="hub-step__num">8</span><span><span class="hub-step__title">Volatility and the VIX</span><span class="hub-step__desc">The "fear index" in plain terms, and what a long-term investor does when it spikes: nothing.</span></span></a>
        <a class="hub-step" href="/moneyhub/start-here/earnings-sectors-analyst-talk.html"><span class="hub-step__num">9</span><span><span class="hub-step__title">Earnings, Sectors, and Analyst Talk</span><span class="hub-step__desc">Earnings, guidance, sectors — plus candlesticks, briefly. Reading, not trading.</span></span></a>
      </div>
    </section>
    <section class="hub-section">
      <h2 class="hub-section__title">Capstone</h2>
      <div class="hub-steps">
        <a class="hub-step" href="/moneyhub/start-here/read-a-market-take.html"><span class="hub-step__num">10</span><span><span class="hub-step__title">How to Read a Market Take</span><span class="hub-step__desc">A real Gojo post, decoded line by line. By now, you speak the language.</span></span></a>
      </div>
    </section>
    <section class="hub-section">
      <h2 class="hub-section__title">Then keep going</h2>
      <div class="hub-grid">
        <a class="hub-card" href="/moneyhub/investing/"><span class="hub-card__title">📈 Investing Guides</span><span class="hub-card__desc">Account types, brokerage basics, starter portfolios — how to actually start.</span><span class="hub-card__meta">5 guides →</span></a>
        <a class="hub-card" href="/moneyhub/"><span class="hub-card__title">🧭 The 5-Step Path</span><span class="hub-card__desc">Know your money, kill debt, build a buffer, invest, automate.</span><span class="hub-card__meta">Browse →</span></a>
        <a class="hub-card" href="/gojo/stocks/"><span class="hub-card__title">◈ Gojo Market Takes</span><span class="hub-card__desc">The live market commentary you'll be able to read after lesson 10.</span><span class="hub-card__meta">Read →</span></a>
      </div>
    </section>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
</body>
</html>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/start-here.test.mjs` → Expected: PASS (1 test — index links in order).
Run: `npm test` → Expected: PASS (`build-index` skips `index.html` files, so the search index is unaffected).

- [ ] **Step 5: Commit**

```bash
git add test/start-here.test.mjs moneyhub/start-here/index.html
git commit -m "Add Start Here hub index and page-structure test harness"
```

---

### Task 5: Lesson 1 — What Is a Stock?

**Files:**
- Create: `moneyhub/start-here/what-is-a-stock.html`
- Modify: `test/start-here.test.mjs` (append to `CREATED`)
- Modify (generated): `resources/data/search-index.json`

**Interfaces:**
- Consumes: §SHELL, `lesson.css` classes (Task 1), test harness (Task 4).

- [ ] **Step 1: Add the slug to `CREATED` in `test/start-here.test.mjs`**

```js
const CREATED = ['what-is-a-stock'];
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/start-here.test.mjs`
Expected: FAIL — `lesson page: what-is-a-stock` throws ENOENT.

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `What Is a Stock?` · `SLUG` = `what-is-a-stock` · `DESC` = `A stock is a small ownership slice of a real company. Plain-language lesson 1 of the Start Here series — no experience assumed.` · `PREV_BLOCK` = *(empty — lesson 1)* · `NEXT_HREF` = `/moneyhub/start-here/what-is-the-stock-market.html` · `NEXT_TITLE` = `What Is the Stock Market?`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>A stock is a small ownership slice of a real company — when you buy one, you own a piece of that business.</p></aside>
            <p>Forget the flashing numbers and the guys yelling on TV. Start with something simpler: a business.</p>
            <p>Imagine your neighbor runs a food truck that makes good money, and she wants to buy three more trucks. She doesn't have the cash, so she offers you a deal: give her $10,000, and you'll own 10% of the business — 10% of every future dollar it earns.</p>
            <p>That's a stock. That's the entire idea.</p>
            <h2>Companies sell slices to raise money</h2>
            <p>Big companies do exactly what the food truck did, just at massive scale. Apple, Costco, John Deere — at some point each of them said: "We want money to grow, so we'll sell ownership slices to the public." Each slice is called a <strong>share</strong>. Anyone who owns shares is a <strong>shareholder</strong> — a part-owner of the company.</p>
            <p>When you hear someone "owns Apple stock," they literally own a piece of Apple. A very small piece, but a real one.</p>
            <h2>What owning a slice gets you</h2>
            <ul>
                <li><strong>A claim on profits.</strong> Some companies pay out part of their profit to shareholders in cash. That payment is a <strong>dividend</strong>.</li>
                <li><strong>A stake in the growth.</strong> If the company becomes more valuable over the years, your slice becomes more valuable too.</li>
            </ul>
            <p>Notice what's <em>not</em> on that list: a lottery ticket. A stock isn't a bet on a number. It's ownership of a business that sells real things to real people. That framing matters, because everything else in this series builds on it — including why I'm comfortable owning stocks for decades.</p>
            <p>One thing might bug you: if you own a slice, what's it worth on any given day? Whatever someone else will pay for it. Where do those buyers and sellers meet? That's the next lesson.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Stock</strong> — ownership in a company, sold in slices.</li>
                <li><strong>Share</strong> — one slice.</li>
                <li><strong>Shareholder</strong> — anyone who owns shares; a part-owner.</li>
                <li><strong>Dividend</strong> — cash a company pays out to its shareholders.</li>
                <li><strong>Public company</strong> — a company whose shares anyone can buy.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>You buy one share of Costco. What do you actually own?</summary><p>A real (tiny) ownership slice of Costco the business — including a claim on its future profits. Not a coupon, not a bet: ownership.</p></details>
                <details class="quiz__item"><summary>Why would a successful company sell slices of itself?</summary><p>To raise money to grow — new stores, new products, new trucks — without taking out a loan.</p></details>
                <details class="quiz__item"><summary>What's a dividend?</summary><p>Cash a company pays out to shareholders, usually a few times a year, as their share of the profits.</p></details>
            </section>
```

- [ ] **Step 4: Rebuild the search index**

Run: `npm run build:index`
Expected: `Indexed N posts → resources/data/search-index.json` (N grows by 1).

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS, including `lesson page: what-is-a-stock`.

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/what-is-a-stock.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 1: What Is a Stock?"
```

---

### Task 6: Lesson 2 — What Is the Stock Market?

**Files:** Create `moneyhub/start-here/what-is-the-stock-market.html`; modify `test/start-here.test.mjs`, `resources/data/search-index.json`.

- [ ] **Step 1: Append `'what-is-the-stock-market'` to `CREATED`**

```js
const CREATED = ['what-is-a-stock', 'what-is-the-stock-market'];
```

- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (ENOENT for the new page).

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `What Is the Stock Market?` · `SLUG` = `what-is-the-stock-market` · `DESC` = `The stock market is where ownership slices of companies get bought and sold. Lesson 2: exchanges, prices, and why they move every day.` · `PREV_SLUG` = `what-is-a-stock` · `PREV_TITLE` = `What Is a Stock?` · `NEXT_HREF` = `/moneyhub/start-here/why-invest.html` · `NEXT_TITLE` = `Why Invest at All?`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>The stock market is the marketplace where people buy and sell company slices — and a price is just the last deal two strangers agreed on.</p></aside>
            <p>Last lesson you owned 10% of a food truck. Suppose you want out — who buys your slice? You'd have to find a buyer yourself and haggle. Painful.</p>
            <p>The stock market solves exactly that problem, at scale. It's a giant, organized farmer's market where the thing being sold is ownership slices. The big U.S. marketplaces are called <strong>exchanges</strong> — you've heard of them: the <strong>New York Stock Exchange</strong> and the <strong>Nasdaq</strong>. Millions of buyers and sellers show up every weekday, so you can sell your Apple shares in seconds, because somebody out there wants them.</p>
            <h2>Where prices come from</h2>
            <p>Here's the thing nobody tells beginners: there's no committee setting prices. A stock's price is simply <em>the last price a buyer and a seller agreed on</em>. When you hear "Apple is at $230," it means someone just sold a share to someone else for $230. That's it.</p>
            <h2>So why do prices move every day?</h2>
            <p>Because people's opinions move. Every day, millions of people update their view of what a company is worth based on:</p>
            <ul>
                <li><strong>News</strong> — a new product, a lawsuit, a factory fire.</li>
                <li><strong>Results</strong> — the company reports how much it actually earned.</li>
                <li><strong>Mood</strong> — plain old fear and greed, in both directions.</li>
            </ul>
            <p>More buyers than sellers, price drifts up. More sellers than buyers, it drifts down. Multiply that by thousands of companies and you get the daily wiggle you see on the news.</p>
            <p>Two takeaways to carry forward. First: daily moves are mostly opinion changes, not business changes — a company rarely becomes 3% worse by Tuesday. Second: when the news says "the market was up today," they're averaging lots of stocks together. How that averaging works — and what "SPY" means — is lesson 4. First, though: why bother with any of this?</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Stock market</strong> — the organized marketplace for buying and selling shares.</li>
                <li><strong>Exchange</strong> — a specific marketplace, like the NYSE or the Nasdaq.</li>
                <li><strong>Market price</strong> — the last price a buyer and seller agreed on.</li>
                <li><strong>Trading day</strong> — U.S. markets are open weekdays, roughly 9:30am–4pm Eastern.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>Who decides that a share of Apple costs $230?</summary><p>Nobody. $230 is just the most recent price a real buyer and a real seller agreed on. The next trade might be a few cents different.</p></details>
                <details class="quiz__item"><summary>A stock drops 2% today on no news. Did the company get 2% worse?</summary><p>Almost certainly not. Daily moves mostly reflect shifting opinions and moods, not real changes in the business.</p></details>
            </section>
```

- [ ] **Step 4: Run `npm run build:index`**, then **Step 5: `npm test`** — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/what-is-the-stock-market.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 2: What Is the Stock Market?"
```

---

### Task 7: Lesson 3 — Why Invest at All? (compound widget)

**Files:** Create `moneyhub/start-here/why-invest.html`; modify `test/start-here.test.mjs`, `resources/data/search-index.json`.

**Interfaces:** Consumes widget `data-widget="compound"` (Task 3).

- [ ] **Step 1: Append `'why-invest'` to `CREATED`**
- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (ENOENT).

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `Why Invest at All?` · `SLUG` = `why-invest` · `DESC` = `Compounding, plain and simple: why invested money grows on itself, and what $200 a month becomes over 10, 20, and 30 years.` · `PREV_SLUG` = `what-is-the-stock-market` · `PREV_TITLE` = `What Is the Stock Market?` · `NEXT_HREF` = `/moneyhub/start-here/tickers-and-indices.html` · `NEXT_TITLE` = `Tickers and Indices`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>Investing puts your money into things that grow, and given enough years, growth feeding on growth — compounding — does most of the work for you.</p></aside>
            <p>Fair question: the last two lessons described a market that wiggles around on people's moods. Why hand your money to <em>that</em>?</p>
            <p>Two reasons.</p>
            <h2>1. Cash quietly loses</h2>
            <p>Prices rise a little almost every year — that's <strong>inflation</strong>. Money sitting in a drawer (or a near-zero savings account) buys a bit less every year. It feels safe, but it's a slow leak.</p>
            <h2>2. Ownership compounds</h2>
            <p>When you own slices of businesses, your money grows two ways: the businesses grow, and your gains start earning gains of their own. That second part is <strong>compounding</strong>, and it's the entire engine of long-term wealth. Growth on top of growth doesn't add up — it snowballs.</p>
            <p>Don't take my word for it. Play with this:</p>
            <figure class="widget" data-widget="compound">
              <div class="widget__body">
                <p class="widget__fallback">$200 a month for 30 years is $72,000 of deposits. In cash it stays roughly $74,000. Invested at 8% a year — near the market's long-run average — it grows to roughly $280,000. Same deposits, wildly different outcome.</p>
              </div>
              <figcaption class="widget__caption">$200/month: cash (dashed) vs. invested at 8%/yr (red). Toggle the horizon — notice the gap explodes in the LAST ten years. That's compounding.</figcaption>
            </figure>
            <p>Look at the 30-year view. The gap between the lines isn't from saving harder — it's the same $200 a month. The gap is time. Which is why the single biggest advantage you have as a beginner isn't stock-picking skill. It's <strong>time in the market</strong> — starting early and staying in.</p>
            <p>This is also why I don't trade. Trading risks interrupting the snowball. My whole approach is: buy broadly, keep buying, don't interrupt. The next lessons give you the vocabulary for exactly what to buy broadly.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Inflation</strong> — prices creeping up, so idle cash buys less each year.</li>
                <li><strong>Return</strong> — what your money earns, usually shown as % per year.</li>
                <li><strong>Compounding</strong> — gains earning their own gains; the snowball.</li>
                <li><strong>Time in the market</strong> — how long you stay invested; the beginner's superpower.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>Same $200/month, same 8% return — why does the second decade build so much more money than the first?</summary><p>Compounding. By the second decade your earlier gains are earning gains themselves, so the snowball is bigger and rolls faster.</p></details>
                <details class="quiz__item"><summary>Is money in a drawer really "safe"?</summary><p>It's safe from market drops but guaranteed to lose buying power to inflation. Over decades, that's a real loss too.</p></details>
            </section>
```

- [ ] **Step 4: Run `npm run build:index`**, then **Step 5: `npm test`** — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/why-invest.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 3: Why Invest at All? with compounding widget"
```

---

### Task 8: Lesson 4 — Tickers and Indices

**Files:** Create `moneyhub/start-here/tickers-and-indices.html`; modify `test/start-here.test.mjs`, `resources/data/search-index.json`.

- [ ] **Step 1: Append `'tickers-and-indices'` to `CREATED`**
- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (ENOENT).

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `Tickers and Indices` · `SLUG` = `tickers-and-indices` · `DESC` = `What SPY actually means: ticker symbols, the S&P 500, QQQ, and the Dow — the shorthand behind every market headline, in plain language.` · `PREV_SLUG` = `why-invest` · `PREV_TITLE` = `Why Invest at All?` · `NEXT_HREF` = `/moneyhub/start-here/funds-and-etfs.html` · `NEXT_TITLE` = `Funds and ETFs`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>A ticker is a stock's short nickname, and an index is a basket of many stocks measured together — "SPY" is a fund that tracks the 500 biggest U.S. companies.</p></aside>
            <blockquote class="lesson-opener"><p>"SPY closed Thursday, July 2 at $744.78, down a marginal 0.13% on the day … up 9.2% year-to-date."</p><cite>— Gojo, <a href="/gojo/stocks/spy-market-review-2026-07-05.html">SPY Market Review, July 5, 2026</a></cite></blockquote>
            <p class="lesson-opener__note">By the end of this page, that sentence reads like plain English.</p>
            <h2>Tickers: stock nicknames</h2>
            <p>Every stock trades under a short code called a <strong>ticker symbol</strong>: Apple is <strong>AAPL</strong>, Microsoft is <strong>MSFT</strong>, Costco is <strong>COST</strong>. It's just an address — nothing more mysterious than a license plate.</p>
            <h2>Indices: measuring the whole market</h2>
            <p>With thousands of stocks, how do you answer "how did the market do today?" You build a measuring stick: pick a basket of stocks, average them (weighted by size), and publish the number. That's an <strong>index</strong>. Three you'll hear constantly:</p>
            <ul>
                <li><strong>S&amp;P 500</strong> — the 500 biggest U.S. companies. When people say "the market," they usually mean this.</li>
                <li><strong>Nasdaq-100</strong> — 100 large Nasdaq companies, heavy on tech.</li>
                <li><strong>The Dow</strong> — 30 giant companies; the oldest measuring stick, still quoted from habit.</li>
            </ul>
            <h2>So what is SPY?</h2>
            <p>You can't buy an index directly — it's a math formula, not a product. But fund companies build funds that hold the same stocks as the index and move with it. <strong>SPY</strong> is a ticker for exactly that: a fund tracking the S&amp;P 500. <strong>QQQ</strong> does the same for the Nasdaq-100. Buy one share of SPY and you own a sliver of 500 companies at once.</p>
            <p>Reread Gojo's sentence: a fund tracking the 500 biggest U.S. companies traded at $744.78, barely moved that day, and is up 9.2% since January. You now speak ticker.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Ticker</strong> — a stock's short trading code (AAPL, MSFT).</li>
                <li><strong>Index</strong> — a measuring-stick basket of stocks (S&amp;P 500, Nasdaq-100, Dow).</li>
                <li><strong>SPY</strong> — a fund that tracks the S&amp;P 500.</li>
                <li><strong>QQQ</strong> — a fund that tracks the Nasdaq-100.</li>
                <li><strong>Year-to-date (YTD)</strong> — the change since January 1.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>"The market was up 1% today" — up according to what?</summary><p>Usually the S&amp;P 500 index — the weighted average of the 500 biggest U.S. companies.</p></details>
                <details class="quiz__item"><summary>What do you own if you buy one share of SPY?</summary><p>A slice of a fund that holds all 500 S&amp;P companies — effectively a tiny piece of each of them in one purchase.</p></details>
            </section>
```

- [ ] **Step 4: Run `npm run build:index`**, then **Step 5: `npm test`** — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/tickers-and-indices.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 4: Tickers and Indices"
```

---

### Task 9: Lesson 5 — Funds and ETFs

**Files:** Create `moneyhub/start-here/funds-and-etfs.html`; modify `test/start-here.test.mjs`, `resources/data/search-index.json`.

- [ ] **Step 1: Append `'funds-and-etfs'` to `CREATED`**
- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (ENOENT).

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `Funds and ETFs` · `SLUG` = `funds-and-etfs` · `DESC` = `Funds, ETFs, and index funds in plain language — why owning a slice of everything beats trying to pick the winners.` · `PREV_SLUG` = `tickers-and-indices` · `PREV_TITLE` = `Tickers and Indices` · `NEXT_HREF` = `/moneyhub/start-here/how-to-read-a-chart.html` · `NEXT_TITLE` = `How to Read a Chart`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>A fund is a bundle of many stocks you buy as one thing, and an ETF is a fund that trades like a stock — which is how one purchase of SPY buys you 500 companies.</p></aside>
            <p>Quick recap: SPY is "a fund that tracks the S&amp;P 500." This lesson is about what a fund actually is — because funds, not individual stocks, are how I invest almost everything.</p>
            <h2>The bundle</h2>
            <p>A <strong>fund</strong> pools money from lots of people and buys a big basket of stocks. Own a piece of the fund, and you own a piece of everything inside it. One purchase, instant variety. That variety has a name — <strong>diversification</strong> — and it means no single company can sink you. If one of 500 companies has a terrible year, you barely feel it.</p>
            <h2>ETF vs. mutual fund</h2>
            <p>Two wrappers for the same idea:</p>
            <ul>
                <li>An <strong>ETF</strong> (exchange-traded fund) trades on an exchange all day with a ticker — SPY and QQQ are ETFs. This is the modern default.</li>
                <li>A <strong>mutual fund</strong> is the older wrapper: you buy in once a day at the closing price. Common in 401(k)s.</li>
            </ul>
            <p>For a beginner the differences barely matter. What matters is what's inside and what it costs. A fund's fee is its <strong>expense ratio</strong> — good broad index funds charge 0.1% a year or less. Cheap matters, because fees compound against you just like returns compound for you.</p>
            <h2>Why not just pick the winners?</h2>
            <p>Because almost nobody can — reliably, for decades. Most professional fund managers fail to beat the plain S&amp;P 500 over long periods, and they do it full-time. An <strong>index fund</strong> skips the guessing: hold everything, ride the average. And the average is good! Broad U.S. stocks have returned roughly 10% a year over the long run — with huge swings along the way, which is exactly what the next lessons teach you to look at calmly.</p>
            <p>My approach in one line: own everything, cheaply, forever.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Fund</strong> — a pooled basket of many stocks bought as one thing.</li>
                <li><strong>ETF</strong> — a fund that trades all day under a ticker.</li>
                <li><strong>Mutual fund</strong> — a fund you buy once a day at the closing price.</li>
                <li><strong>Index fund</strong> — a fund that just copies an index instead of picking stocks.</li>
                <li><strong>Diversification</strong> — spreading money across many companies.</li>
                <li><strong>Expense ratio</strong> — a fund's yearly fee.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>One company in your 500-stock index fund goes bankrupt. Roughly what happens to you?</summary><p>Almost nothing — it was one of 500 holdings. That's diversification doing its job.</p></details>
                <details class="quiz__item"><summary>Why do I default to index funds instead of picking stocks?</summary><p>Because even most professionals fail to beat the index over long periods. Holding everything cheaply captures the market's growth without the guessing.</p></details>
            </section>
```

- [ ] **Step 4: Run `npm run build:index`**, then **Step 5: `npm test`** — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/funds-and-etfs.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 5: Funds and ETFs"
```

---

### Task 10: Lesson 6 — How to Read a Chart (anatomy + timeframe widgets)

**Files:** Create `moneyhub/start-here/how-to-read-a-chart.html`; modify `test/start-here.test.mjs`, `resources/data/search-index.json`.

**Interfaces:** Consumes widgets `data-widget="anatomy"` and `data-widget="timeframe"` (Task 3).

- [ ] **Step 1: Append `'how-to-read-a-chart'` to `CREATED`**
- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (ENOENT).

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `How to Read a Chart` · `SLUG` = `how-to-read-a-chart` · `DESC` = `The parts of a price chart, explained interactively — and why the same fund looks terrifying at 1 day and unstoppable at 20 years.` · `PREV_SLUG` = `funds-and-etfs` · `PREV_TITLE` = `Funds and ETFs` · `NEXT_HREF` = `/moneyhub/start-here/bulls-bears-and-crashes.html` · `NEXT_TITLE` = `Bulls, Bears, and Crashes`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>A price chart shows price over time — and the timeframe you pick completely changes the story it tells.</p></aside>
            <blockquote class="lesson-opener"><p>"SPY's 50-day range of $708.45–$759.57 puts current price in the upper third of its recent band."</p><cite>— Gojo, <a href="/gojo/stocks/spy-market-review-2026-07-05.html">SPY Market Review, July 5, 2026</a></cite></blockquote>
            <p class="lesson-opener__note">Range? Band? It's all just chart-reading. Let's learn the parts.</p>
            <h2>The parts of a chart</h2>
            <p>Every price chart is the same four pieces. Tap each label:</p>
            <figure class="widget" data-widget="anatomy">
              <div class="widget__body">
                <p class="widget__fallback">A price chart has four parts: a vertical price axis (in dollars — watch out, it rarely starts at zero), a horizontal time axis, the price line itself, and volume bars along the bottom showing how many shares traded each day.</p>
              </div>
              <figcaption class="widget__caption">One month of a fund's price. The pieces never change: price axis, time axis, price line, volume.</figcaption>
            </figure>
            <p>One trap worth repeating: <strong>the price axis usually doesn't start at zero.</strong> A chart can make a 1% wobble look like a cliff. Always glance at the numbers before you let a chart scare you.</p>
            <h2>The most important button on any chart</h2>
            <p>It's not a drawing tool or an indicator. It's the <strong>timeframe</strong> selector. Same fund, four windows:</p>
            <figure class="widget" data-widget="timeframe">
              <div class="widget__body">
                <p class="widget__fallback">At 1 day the fund looks like chaotic zigzags. At 1 month, choppy. At 1 year, a dip and a recovery. At 20 years, a smooth line climbing from about $127 to $745 — including two crashes you can barely spot. Same fund every time.</p>
              </div>
              <figcaption class="widget__caption">Same fund. Tap 1D, then 20Y. This is the entire argument for long-term investing, in one toggle.</figcaption>
            </figure>
            <p>This is the skill: whenever a chart makes your stomach drop, zoom out. The 1-day view is weather. The 20-year view is climate — and climate is what I invest in.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Price axis</strong> — the vertical scale, in dollars; rarely starts at zero.</li>
                <li><strong>Time axis</strong> — the horizontal scale; always check it first.</li>
                <li><strong>Volume</strong> — how many shares changed hands; the bars at the bottom.</li>
                <li><strong>Timeframe</strong> — the window of time a chart shows (1D, 1Y, 20Y…).</li>
                <li><strong>Range</strong> — the low-to-high span over some period, like a "50-day range."</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>A chart shows a stock "plunging." What two things should you check before reacting?</summary><p>The timeframe (is this one day or ten years?) and the price axis (does it start near the price, exaggerating the move?).</p></details>
                <details class="quiz__item"><summary>Why does the same fund look scary at 1 day and calm at 20 years?</summary><p>Short windows show the random daily wiggle of opinions. Long windows show the underlying growth of the businesses. Zooming out reveals the trend that matters.</p></details>
            </section>
```

- [ ] **Step 4: Run `npm run build:index`**, then **Step 5: `npm test`** — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/how-to-read-a-chart.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 6: How to Read a Chart with anatomy and timeframe widgets"
```

---

### Task 11: Lesson 7 — Bulls, Bears, and Crashes (crash widget)

**Files:** Create `moneyhub/start-here/bulls-bears-and-crashes.html`; modify `test/start-here.test.mjs`, `resources/data/search-index.json`.

**Interfaces:** Consumes widget `data-widget="crash"` (Task 3).

- [ ] **Step 1: Append `'bulls-bears-and-crashes'` to `CREATED`**
- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (ENOENT).

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `Bulls, Bears, and Crashes` · `SLUG` = `bulls-bears-and-crashes` · `DESC` = `Bull markets, bear markets, corrections, and crashes — what the scary words mean, how often they happen, and the zoomed-out chart that defuses them.` · `PREV_SLUG` = `how-to-read-a-chart` · `PREV_TITLE` = `How to Read a Chart` · `NEXT_HREF` = `/moneyhub/start-here/volatility-and-the-vix.html` · `NEXT_TITLE` = `Volatility and the VIX`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>Markets regularly fall 10, 20, even 50 percent — it has a vocabulary, it happens on a schedule, and so far the U.S. market has recovered from every single one.</p></aside>
            <p>Market headlines run on a small set of animal words. Here's the whole dictionary:</p>
            <ul>
                <li><strong>Bull market</strong> — prices broadly rising. (Bulls attack upward.)</li>
                <li><strong>Bear market</strong> — down 20% or more from the peak. (Bears swipe down.)</li>
                <li><strong>Correction</strong> — a drop of 10–20%. Sounds clinical; feels bad; is routine.</li>
                <li><strong>Dip</strong> — any smaller slide, usually a few percent.</li>
                <li><strong>All-time high (ATH)</strong> — the highest price ever. Headlines treat it as a cliff edge; historically it's just… a Tuesday.</li>
                <li><strong>Crash</strong> — a fast, violent drop. Rare, unforgettable, survivable.</li>
            </ul>
            <h2>How often does the scary stuff happen?</h2>
            <p>More often than headlines imply — which is exactly why it shouldn't panic you. Roughly: a <strong>correction every year or two</strong>, and a <strong>bear market every five to seven years</strong>. These aren't malfunctions. They're the market's normal breathing. If you invest for 30 years, you will personally sit through four or five bear markets. Plan on it.</p>
            <h2>Now zoom out</h2>
            <figure class="widget" data-widget="crash">
              <div class="widget__body">
                <p class="widget__fallback">The U.S. market since 1990, with the dot-com bust (−49%), the 2008 financial crisis (−57%), the COVID crash (−34%), and the 2022 bear (−25%) marked. Zoomed out, all four are wiggles on a line that climbs from about 330 to about 7,450.</p>
              </div>
              <figcaption class="widget__caption">Every major crash since 1990, marked in amber. Each felt like the end of the world in the moment. (Simplified index levels.)</figcaption>
            </figure>
            <p>Every marked dot was a moment when smart-sounding people said "this time is different." Selling during those drops was the single most expensive mistake an investor could make — the recoveries did the heavy lifting. The lesson I carry: <strong>drops are the admission price for the long-term returns.</strong> You don't dodge them; you outlast them.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Bull / bear market</strong> — broadly rising / down 20%+ from the peak.</li>
                <li><strong>Correction</strong> — a routine 10–20% drop.</li>
                <li><strong>Dip</strong> — a small slide.</li>
                <li><strong>All-time high</strong> — the highest price ever; more common than it sounds.</li>
                <li><strong>Drawdown</strong> — the fall from a peak to a bottom, in percent.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>The market falls 12% over two months. What is that called, and how unusual is it?</summary><p>A correction — and it's routine. One happens roughly every year or two. It's the market breathing, not breaking.</p></details>
                <details class="quiz__item"><summary>You'll invest for 30 years. Roughly how many bear markets should you expect to live through?</summary><p>Four or five. Expecting them ahead of time is what makes it possible to hold through them.</p></details>
            </section>
```

- [ ] **Step 4: Run `npm run build:index`**, then **Step 5: `npm test`** — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/bulls-bears-and-crashes.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 7: Bulls, Bears, and Crashes with crash-history widget"
```

---

### Task 12: Lesson 8 — Volatility and the VIX

**Files:** Create `moneyhub/start-here/volatility-and-the-vix.html`; modify `test/start-here.test.mjs`, `resources/data/search-index.json`.

- [ ] **Step 1: Append `'volatility-and-the-vix'` to `CREATED`**
- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (ENOENT).

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `Volatility and the VIX` · `SLUG` = `volatility-and-the-vix` · `DESC` = `The VIX — the market's "fear index" — explained in plain language, and why a long-term investor treats it as a weather report, not an instruction.` · `PREV_SLUG` = `bulls-bears-and-crashes` · `PREV_TITLE` = `Bulls, Bears, and Crashes` · `NEXT_HREF` = `/moneyhub/start-here/earnings-sectors-analyst-talk.html` · `NEXT_TITLE` = `Earnings, Sectors, and Analyst Talk`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>The VIX measures how nervous investors are right now — for a long-term investor it's a weather report, not an instruction.</p></aside>
            <blockquote class="lesson-opener"><p>"SPY Market Review — Record Highs Meet Record Fear"</p><cite>— Gojo, <a href="/gojo/stocks/spy-market-review-2026-07-05.html">headline, July 5, 2026</a></cite></blockquote>
            <p class="lesson-opener__note">"Record fear" is a VIX reference. Here's what that means.</p>
            <h2>Volatility: the size of the swings</h2>
            <p><strong>Volatility</strong> just means how violently prices are moving around — in either direction. A calm market drifts a fraction of a percent a day. A volatile one lurches 2–3% daily and makes everyone seasick. Note what volatility is <em>not</em>: it's not the same as losing money. It's turbulence, not altitude.</p>
            <h2>The VIX: fear, as a number</h2>
            <p>The <strong>VIX</strong> condenses expected volatility into one number, computed from how much traders are paying for insurance against big swings in the S&amp;P 500 over the next 30 days. More demand for insurance = more fear = higher VIX. Rough map:</p>
            <ul>
                <li><strong>Under ~15</strong> — calm, almost sleepy.</li>
                <li><strong>15–25</strong> — normal weather.</li>
                <li><strong>30–40</strong> — scared. Something's rattling people.</li>
                <li><strong>50+</strong> — panic. It touched ~80 in 2008 and again in March 2020.</li>
            </ul>
            <h2>What should you do when the VIX spikes?</h2>
            <p>If your horizon is decades: <strong>nothing.</strong> Keep the automatic contributions running. That's the entire strategy, and it's harder than it sounds — a VIX spike means every screen is red and every headline is screaming. But notice something from the chart in lesson 7: the great buying moments of the last 35 years were precisely the panics. Fear was highest exactly when patience paid most.</p>
            <p>So when Gojo writes "record highs meet record fear," you can translate calmly: prices are near their peak while insurance-buying suggests traders are jumpy. Interesting weather. The climate plan doesn't change.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Volatility</strong> — how big the price swings are, in either direction.</li>
                <li><strong>VIX</strong> — the "fear index": expected S&amp;P 500 volatility over the next 30 days.</li>
                <li><strong>Fear index</strong> — the VIX's nickname; high means nervous, low means calm.</li>
                <li><strong>Panic selling</strong> — dumping investments during a scare; how paper losses become real ones.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>The VIX jumps from 14 to 38. What happened, and what should a decades-horizon investor do?</summary><p>Traders got scared and bid up insurance against big swings. The long-term move: nothing — keep contributions running. Volatility is turbulence, not a crash landing.</p></details>
                <details class="quiz__item"><summary>Is high volatility the same thing as losing money?</summary><p>No. Volatility measures the size of the swings in both directions. You only lock in a loss if you sell into the turbulence.</p></details>
            </section>
```

- [ ] **Step 4: Run `npm run build:index`**, then **Step 5: `npm test`** — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/volatility-and-the-vix.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 8: Volatility and the VIX"
```

---

### Task 13: Lesson 9 — Earnings, Sectors, and Analyst Talk (candles widget)

**Files:** Create `moneyhub/start-here/earnings-sectors-analyst-talk.html`; modify `test/start-here.test.mjs`, `resources/data/search-index.json`.

**Interfaces:** Consumes widget `data-widget="candles"` (Task 3).

- [ ] **Step 1: Append `'earnings-sectors-analyst-talk'` to `CREATED`**
- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (ENOENT).

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `Earnings, Sectors, and Analyst Talk` · `SLUG` = `earnings-sectors-analyst-talk` · `DESC` = `Earnings, guidance, sectors, and a five-minute candlestick primer — the last vocabulary you need to read market commentary. Reading, not trading.` · `PREV_SLUG` = `volatility-and-the-vix` · `PREV_TITLE` = `Volatility and the VIX` · `NEXT_HREF` = `/moneyhub/start-here/read-a-market-take.html` · `NEXT_TITLE` = `How to Read a Market Take`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>Companies report results four times a year, stocks get grouped into sectors, and analysts have a compact vocabulary for all of it — including candlestick charts.</p></aside>
            <blockquote class="lesson-opener"><p>"…the Dow rose 1.14% and Utilities gained 2.3% on July 2, while the Nasdaq fell 0.80%."</p><cite>— Gojo, <a href="/gojo/stocks/spy-market-review-2026-07-05.html">SPY Market Review, July 5, 2026</a></cite></blockquote>
            <p class="lesson-opener__note">Utilities? Rotation? One more vocabulary lesson and you're fluent.</p>
            <h2>Earnings: the quarterly report card</h2>
            <p>Public companies must report results every three months — that's <strong>earnings</strong>. Alongside the numbers, management predicts the next stretch: that's <strong>guidance</strong>. Here's the counterintuitive part: stocks move on results <em>versus expectations</em>, not results alone. A company can post record profits and drop 8% — because traders expected even more. When you see "beat" or "miss," that's what it means.</p>
            <h2>Sectors: the market's neighborhoods</h2>
            <p>Stocks get grouped into eleven <strong>sectors</strong> — technology, energy, utilities, health care, financials, and so on. When money flows out of one neighborhood and into another (like tech into utilities in Gojo's line above), commentary calls it <strong>rotation</strong>. For an index-fund investor it's mostly spectator sport: you own all the neighborhoods already.</p>
            <h2>Candlesticks: five minutes, tops</h2>
            <p>Market commentary loves candlestick charts, so let's read one. Each candle is one day. The thick body spans the day's <strong>open</strong> and <strong>close</strong>; the thin wicks reach the day's <strong>high</strong> and <strong>low</strong>. Green means it closed up, red means down.</p>
            <figure class="widget" data-widget="candles">
              <div class="widget__body">
                <p class="widget__fallback">Seven days as candlesticks: each candle's thick body spans open-to-close (green up, red down) and the thin wicks mark the day's high and low. The same week as a simple line of closing prices tells a long-term investor everything they need.</p>
              </div>
              <figcaption class="widget__caption">Tap a candle to read its story. Then tap "Line" — same week, and honestly all I ever need.</figcaption>
            </figure>
            <p>To be clear about where I stand: I can read candlesticks, and now you can too. I don't trade off them. Traders hunt patterns in these shapes; decades of evidence says that game is very hard to win. We learned this to <em>read</em>, not to bet.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Earnings</strong> — the mandatory quarterly report card.</li>
                <li><strong>Guidance</strong> — management's forecast for what's next.</li>
                <li><strong>Beat / miss</strong> — results above / below expectations.</li>
                <li><strong>Sector</strong> — a market neighborhood (tech, energy, utilities…).</li>
                <li><strong>Rotation</strong> — money shifting between sectors.</li>
                <li><strong>Candlestick / OHLC</strong> — one bar showing a day's open, high, low, close.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>A company reports record profit and its stock falls 8% the next morning. What most likely happened?</summary><p>Expectations were even higher — a "miss" versus what traders had priced in, or weak guidance about the next quarter. Stocks trade on results versus expectations.</p></details>
                <details class="quiz__item"><summary>On a red candlestick, what do the body and the wicks show?</summary><p>The body spans the open and close (red = closed lower than it opened); the wicks mark the highest and lowest prices touched that day.</p></details>
            </section>
```

- [ ] **Step 4: Run `npm run build:index`**, then **Step 5: `npm test`** — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/earnings-sectors-analyst-talk.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 9: Earnings, Sectors, and Analyst Talk with candle widget"
```

---

### Task 14: Lesson 10 — How to Read a Market Take (capstone)

**Files:** Create `moneyhub/start-here/read-a-market-take.html`; modify `test/start-here.test.mjs`, `resources/data/search-index.json`.

- [ ] **Step 1: Append `'read-a-market-take'` to `CREATED`** (all ten slugs now present)
- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (ENOENT).

- [ ] **Step 3: Create the page from §SHELL**

Slots: `TITLE` = `How to Read a Market Take` · `SLUG` = `read-a-market-take` · `DESC` = `Capstone: a real Gojo Market Take decoded line by line using everything from lessons 1–9 — proof you now speak the language.` · `PREV_SLUG` = `earnings-sectors-analyst-talk` · `PREV_TITLE` = `Earnings, Sectors, and Analyst Talk` · `NEXT_HREF` = `/moneyhub/investing/` · `NEXT_TITLE` = `Investing Guides`

`CONTENT`:

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>You can now read real market commentary — let it inform you, and never let it steer a 20-year plan.</p></aside>
            <p>Ten lessons ago, this would have been gibberish. Let's decode a real <a href="/gojo/stocks/spy-market-review-2026-07-05.html">Gojo Market Take from July 5, 2026</a>, line by line.</p>
            <blockquote class="lesson-opener"><p>"SPY closed Thursday, July 2 at $744.78, down a marginal 0.13% on the day…"</p><cite>— every term: lessons 2 &amp; 4</cite></blockquote>
            <p><strong>Translation:</strong> the fund tracking the 500 biggest U.S. companies ended the trading day at $744.78, essentially flat. A 0.13% move is daily weather — nothing.</p>
            <blockquote class="lesson-opener"><p>"That leaves the ETF within 2.1% of its 52-week (and all-time) high of $760.40, and up 9.2% year-to-date."</p><cite>— lessons 5 &amp; 7</cite></blockquote>
            <p><strong>Translation:</strong> the fund is close to the highest price it has ever traded at, and it's had a good year so far. Remember lesson 7: all-time highs are normal in a rising market, not a cliff edge.</p>
            <blockquote class="lesson-opener"><p>"…the S&amp;P 500 is trading at roughly 32 times trailing earnings, its richest level since just before the 2020 pandemic crash."</p><cite>— lesson 9, plus one new idea</cite></blockquote>
            <p><strong>Translation:</strong> stock prices are high relative to the profits companies actually earn — that ratio is called a <strong>valuation</strong>. High valuation doesn't predict a crash next week; it suggests leaner returns ahead and less cushion for bad news. Worth knowing; not worth panicking over.</p>
            <blockquote class="lesson-opener"><p>"Record Highs Meet Record Fear"</p><cite>— the headline; lesson 8</cite></blockquote>
            <p><strong>Translation:</strong> prices near the peak while the VIX says traders are nervous. Interesting tension. For a decades-long plan, it changes nothing.</p>
            <h2>That's the whole trick</h2>
            <p>Commentary tells you what the market is doing and how people feel about it. Your plan — buy broadly, keep buying, don't interrupt the compounding — was set in lessons 3 and 5, and it doesn't take instructions from headlines. Read Gojo with curiosity, not your finger on the sell button.</p>
            <p><strong>Ready to actually start?</strong> The <a href="/moneyhub/investing/">Investing guides</a> cover account types, opening a brokerage, and simple starter portfolios — and the <a href="/moneyhub/">5-step path</a> puts investing in order behind debt and your emergency fund.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Valuation</strong> — price relative to profits (like "32 times earnings").</li>
                <li><strong>Cheat sheet</strong> — SPY = S&amp;P 500 fund · VIX = fear gauge · ATH = all-time high.</li>
                <li><strong>The plan</strong> — buy broadly, keep buying, zoom out, don't interrupt.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>Gojo writes "SPY is 2% off its all-time high with the VIX creeping up." Should you pause your automatic monthly investment?</summary><p>No. That sentence describes weather — prices near the peak, traders a bit nervous. Your monthly buying is climate policy. It doesn't take orders from weather.</p></details>
                <details class="quiz__item"><summary>"Trading at 32 times earnings" — what is that comparing?</summary><p>The market's price against the profits its companies actually earn — a valuation. High numbers mean expensive; expensive means less cushion, not doom.</p></details>
            </section>
```

- [ ] **Step 4: Run `npm run build:index`**, then **Step 5: `npm test`** — Expected: PASS (all 10 lesson tests + index test green).

- [ ] **Step 6: Commit**

```bash
git add moneyhub/start-here/read-a-market-take.html test/start-here.test.mjs resources/data/search-index.json
git commit -m "Add Start Here lesson 10: capstone — How to Read a Market Take"
```

---

### Task 15: Site integration — Wealth hub card + Market Takes pointer (TDD)

**Files:**
- Modify: `moneyhub/index.html` (insert a new section BEFORE the "Start here — the 5-step path" section, i.e. immediately after the "My Money Philosophy" `</section>`)
- Modify: `gojo/stocks/index.html` (insert one line inside `<header class="listing-page__head">`, after the existing subtitle `<p>`)
- Test: `test/start-here.test.mjs` (append two tests at the end of the file)

- [ ] **Step 1: Write the failing tests (append to `test/start-here.test.mjs`)**

```js
test('wealth hub links the Start Here series', () => {
  const html = readFileSync(join(ROOT, 'moneyhub', 'index.html'), 'utf8');
  const i = html.indexOf('href="/moneyhub/start-here/"');
  assert.ok(i > -1, 'moneyhub index links start-here');
  assert.ok(i < html.indexOf('the 5-step path'), 'start-here card appears before the 5-step path');
});

test('market takes page points beginners at Start Here', () => {
  const html = readFileSync(join(ROOT, 'gojo', 'stocks', 'index.html'), 'utf8');
  assert.ok(html.includes('href="/moneyhub/start-here/"'), 'market takes links start-here');
});
```

- [ ] **Step 2: Run `node --test test/start-here.test.mjs`** — Expected: FAIL (both new tests).

- [ ] **Step 3: Add the Wealth hub section**

In `moneyhub/index.html`, directly after the closing `</section>` of the "My Money Philosophy" section, insert:

```html
    <section class="hub-section">
      <h2 class="hub-section__title">Never looked at the market before?</h2>
      <div class="hub-grid">
        <a class="hub-card" href="/moneyhub/start-here/"><span class="hub-card__title">🌱 Start Here — Market Basics</span><span class="hub-card__desc">Ten short lessons, no experience assumed: what a stock is, what "SPY" means, how to read a chart, and why I invest for decades instead of trading.</span><span class="hub-card__meta">10 lessons →</span></a>
      </div>
    </section>
```

- [ ] **Step 4: Add the Market Takes pointer**

In `gojo/stocks/index.html`, inside `<header class="listing-page__head">`, immediately after the existing `<p class="listing-page__subtitle">…</p>` line, insert:

```html
      <p class="listing-page__subtitle">New to tickers, charts, and the VIX? <a href="/moneyhub/start-here/">Start Here — ten short lessons</a>, then come back.</p>
```

- [ ] **Step 5: Run `npm test`** — Expected: PASS (index pages are skipped by `build-index`, so the search index is unchanged; no rebuild needed).

- [ ] **Step 6: Commit**

```bash
git add moneyhub/index.html gojo/stocks/index.html test/start-here.test.mjs
git commit -m "Link Start Here series from Wealth hub and Market Takes"
```

---

### Task 16: Final verification, manual QA, merge

**Files:** none created; verification + merge only.

- [ ] **Step 1: Full suite + index freshness**

Run: `npm test`
Expected: ALL tests PASS (existing suite + `chart-svg` + `start-here-data` + 13 `start-here` structure tests).

Run: `node scripts/migrate-pages.mjs` (dry run)
Expected: reports 0 un-migrated pages (new pages are authored on the current template).

- [ ] **Step 2: Manual QA in a browser**

Run: `python3 -m http.server 8000` from the repo root, open `http://localhost:8000/moneyhub/start-here/`.

Checklist (fix anything that fails before proceeding):
- [ ] Index page renders; all 10 lessons reachable in order; prev/next footers walk 1→10; lesson 10's Next lands on `/moneyhub/investing/`.
- [ ] All five widgets render and respond to CLICK (not just hover): compound horizon buttons, anatomy labels, timeframe toggle, crash chart, candle inspector + Line toggle.
- [ ] Keyboard: Tab reaches every widget button and every candle; Enter/Space activates; focus ring visible.
- [ ] Dark mode (site theme toggle): all widgets and lesson components legible, no hardcoded-looking colors.
- [ ] Narrow viewport (~375px): widgets scale down, buttons wrap, no horizontal page scroll.
- [ ] JS disabled (DevTools → Settings → Disable JavaScript): every widget shows its `.widget__fallback` text; quizzes (`<details>`) still open.
- [ ] Search (Cmd/Ctrl-K): searching "candlestick" and "VIX" surfaces the new lessons.

- [ ] **Step 3: Merge and push**

```bash
git checkout main
git pull
git merge start-here
npm test        # green on main (re-run build:index + commit if the cron added posts meanwhile)
git push
git branch -d start-here
```

---

## Self-Review (completed at plan time)

- **Spec coverage:** 10 lessons ✓ (Tasks 5–14, spec §3 order preserved), lesson template ✓ (§SHELL matches spec §4 ordering), 6 widget types — compound/anatomy/timeframe/crash/candles ✓ + quiz via native `<details>` (spec §5 allows this), index page ✓ (Task 4, spec §6), integration ✓ (Task 15, spec §7), a11y/no-JS fallbacks ✓ (Global Constraints + Task 16 QA), word cap enforced by test ✓ (spec §10), long-term framing baked into every lesson's copy ✓.
- **Placeholder scan:** none — every page has complete final copy; every code step shows complete code.
- **Type consistency:** `linePath/candleGeometry/extent/scale` signatures match between Task 2 (definitions), Task 2 tests, and Task 3 (imports); widget names in Task 3's `MOUNTS` match every `data-widget` attribute in Tasks 7, 10, 11, 13; slugs/titles in the test harness `ORDER` match §Lesson Order, the index page hrefs, and every `{{PREV/NEXT}}` slot.
