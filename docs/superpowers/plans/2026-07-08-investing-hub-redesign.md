# Investing Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the five `moneyhub/investing/` guides in the Start Here style — ≤500 visible words each, dense material folded into collapsibles, six new interactive widgets — with no URL changes and no substance lost.

**Architecture:** Pages keep the existing site shell; their `<main>` content is rebuilt on a layered template (TL;DR → visible walkthrough + widgets → `<details class="lesson-details">` collapsibles → terms → quiz → step-nav). A new `resources/js/invest-widgets.mjs` owns the six new widget mounts; shared UI helpers (`makeButtons`, svg scaffolding) move to `resources/js/lib/widget-ui.mjs` so `start-here.mjs` and `invest-widgets.mjs` both import them instead of duplicating. A new Node test harness enforces the structure and the visible-word cap.

**Tech Stack:** Plain HTML/CSS, vanilla ES modules, `node --test` (no new dependencies).

**Spec:** `docs/superpowers/specs/2026-07-08-investing-hub-redesign-design.md` (approved 2026-07-08).

## Global Constraints

- **Step zero (Task 1):** `git tag pre-investing-rewrite` before any content change. Carried-over content is extracted from this tag with `git show pre-investing-rewrite:moneyhub/investing/<page>.html`.
- **Visible-word cap ≤ 500** per page, test-enforced. Visible = article content after stripping widget `<figure>`s, ALL `<details>` elements (collapsibles and quiz), the `.lesson-terms` section, and the `.quiz` section. The TL;DR box COUNTS.
- Plain language, ~8th-grade reading level, first-person Tui voice; long-term lean everywhere.
- Colors ONLY via `tokens.css` CSS variables — never hardcoded hex.
- No new dependencies, no external requests, no live data. Widget datasets are static synthetic arrays; captions say "(Illustrative.)" where data is stylized.
- Widgets: real `<button>`s with `aria-pressed`, tap/click parity, keyboard operable, `aria-live` notes, `.widget__fallback` replaced only when JS runs, all DOM work behind `typeof document !== 'undefined'`, named exports for datasets/pure helpers.
- Coexistence rule: each widget module's mount loop claims only its own `data-widget` names. `invest-widgets.mjs` names: `order-ticket`, `ops-stepper`, `roth-toggle`, `allocation`, `paycheck-flow`, `best-days`. (`start-here.mjs` keeps: `timeframe`, `compound`, `anatomy`, `crash`, `candles`.)
- **Meta descriptions must contain no literal double quotes** (parser-breaking; bug class already hit once).
- **Every commit touching a `moneyhub/` content page runs `npm run build:index` and includes `resources/data/search-index.json`** — the freshness test fails otherwise. (The hub `index.html` is skipped by the indexer; no rebuild needed for it.)
- Reading chain preserved EXACTLY: brokerage-basics → account-types → starter-portfolios → automating-contributions → staying-invested; endpoints and every `home` link → `/moneyhub/investing/`.
- 2026 dollar figures (verified against IRS Notice 2025-67 / irs.gov newsroom, July 2026): 401(k) employee limit **$24,500** (+$8,000 catch-up 50+; $11,250 for ages 60–63); IRA **$7,500** (+$1,100 catch-up 50+); HSA **$4,400 self / $8,750 family** (+$1,000 catch-up 55+). Monthly IRA math: $7,500/yr = **$625/month**.
- Commit style: plain imperative. All work on branch `investing-redesign`, merged to `main` at the end.
- The `<head>` block is copied verbatim from the existing pages (fonts, FA kit — no SRI, known site-wide caveat; do NOT add SRI to just these pages).

## Page order & slugs (canonical)

| # | Slug | Title | Widgets |
|---|---|---|---|
| 1 | `brokerage-basics` | Brokerage Basics | `order-ticket` |
| 2 | `account-types` | Account Types | `ops-stepper`, `roth-toggle` |
| 3 | `starter-portfolios` | Simple Starter Portfolios | `allocation` |
| 4 | `automating-contributions` | Automating Contributions | `paycheck-flow` |
| 5 | `staying-invested` | Staying Invested Through Volatility | `crash` (reuse), `best-days` |

## §SHELL-G — Canonical guide page shell

Every guide page (Tasks 4–8) is EXACTLY this file with the `{{SLOT}}`s filled. It matches the current live pages' shell, plus the `invest-widgets.mjs` script (and `start-here.mjs` only on staying-invested).

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
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
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/moneyhub/">Money Hub</a></li><li><a href="/moneyhub/investing/">Investing Hub</a></li><li aria-current="page">{{TITLE}}</li></ol></nav>
    <div class="article-page__grid">
      <article class="article">
        <header class="article__header">
          <span class="kicker">WEALTH</span>
          <h1 class="article__title">{{TITLE}}</h1>
          <p class="byline">By <b>Tui Alailima</b> · 3 min read</p>
        </header>
        <aside class="callout callout--ai">
          <span class="callout__icon" aria-hidden="true">▲</span>
          <p>I'm not a CPA, financial advisor, or attorney. This page explains how I personally think about money. It's for education only, not tailored advice.</p>
        </aside>
        <div class="article__content">{{CONTENT}}</div>
        <nav class="step-nav-footer">
        {{PREV_BLOCK}}
        <a href="/moneyhub/investing/" class="step-nav-footer__home">
            Investing Hub
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
      <aside class="article-rail" id="article-rail" data-url="/moneyhub/investing/{{SLUG}}.html" data-ticker="" data-section="Wealth"></aside>
    </div>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
  <script type="module" src="/resources/js/article.mjs"></script>
  {{EXTRA_SCRIPTS}}
</body>
</html>
```

- `{{PREV_BLOCK}}` for page 1 (brokerage-basics):

```html
<a href="/moneyhub/investing/" class="step-nav-footer__prev">
    <span class="arrow">←</span>
    <span>
        <span class="label">Back to</span>
        <span class="title">Investing Hub</span>
    </span>
</a>
```

  For pages 2–5:

```html
<a href="/moneyhub/investing/{{PREV_SLUG}}.html" class="step-nav-footer__prev">
    <span class="arrow">←</span>
    <span>
        <span class="label">Previous</span>
        <span class="title">{{PREV_TITLE}}</span>
    </span>
</a>
```

- Page 5 (staying-invested)'s next block is replaced by:

```html
<a href="/moneyhub/investing/" class="step-nav-footer__next">
    <span>
        <span class="label">Next</span>
        <span class="title">Investing Hub</span>
    </span>
    <span class="arrow">→</span>
</a>
```

- `{{EXTRA_SCRIPTS}}` = `<script type="module" src="/resources/js/invest-widgets.mjs"></script>` for pages 1–4; for page 5 it is BOTH lines:

```html
<script type="module" src="/resources/js/start-here.mjs"></script>
  <script type="module" src="/resources/js/invest-widgets.mjs"></script>
```

`{{CONTENT}}` internal order: `.lesson-tldr` → visible prose + widget figures + `details.lesson-details` collapsibles (interleaved where each task specifies) → `section.lesson-terms` → `section.quiz`.

Collapsible pattern:

```html
<details class="lesson-details">
  <summary>{{SUMMARY_LABEL}}</summary>
  <div class="lesson-details__body">
    {{FOLDED_CONTENT}}
  </div>
</details>
```

Widget figure pattern (same as Start Here):

```html
<figure class="widget" data-widget="{{NAME}}">
  <div class="widget__body">
    <p class="widget__fallback">{{FALLBACK}}</p>
  </div>
  <figcaption class="widget__caption">{{CAPTION}}</figcaption>
</figure>
```

## Extraction rule (used by Tasks 4–8)

"EXTRACT §N–M of `<page>`" means: run `git show pre-investing-rewrite:moneyhub/investing/<page>.html`, copy the HTML starting at the line containing `<h2>N.` up to (not including) the line containing `<h2>M+1.` (or `<section class` / `<nav class="step-nav-footer">` if it was the last section), then apply exactly these transforms and no others:
1. Demote headings: `<h2>` → `<h3>`, `<h3>` → `<h4>`.
2. Strip the leading `N. ` numbering from each demoted heading's text.
3. Apply only the explicit edits the task lists (e.g., 2026 figures). Prose is otherwise preserved verbatim.

---

### Task 1: Tag, branch, and `.lesson-details` CSS

**Files:**
- Modify: `resources/css/components/lesson.css` (append one component block)

**Interfaces:**
- Produces: git tag `pre-investing-rewrite` (on current main HEAD), branch `investing-redesign`, CSS classes `.lesson-details`, `.lesson-details__body` used by Tasks 4–8.

- [ ] **Step 1: Tag and branch**

```bash
git checkout main && git pull
git tag pre-investing-rewrite
git push origin pre-investing-rewrite
git checkout -b investing-redesign
```

- [ ] **Step 2: Append to `resources/css/components/lesson.css`**

```css
/* Collapsible detail sections — dense reference material lives here */
.lesson-details {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin: var(--space-4) 0;
  background: var(--color-bg-secondary);
}

.lesson-details summary {
  cursor: pointer;
  padding: var(--space-4) var(--space-5);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  list-style: none;
}

.lesson-details summary::before {
  content: "▸ ";
  color: var(--color-accent-primary);
  font-weight: var(--weight-bold);
}

.lesson-details[open] summary::before { content: "▾ "; }

.lesson-details[open] summary { border-bottom: 1px solid var(--color-border); }

.lesson-details__body {
  padding: var(--space-4) var(--space-5);
}

.lesson-details__body > :last-child { margin-bottom: 0; }
```

- [ ] **Step 3: Verify and run suite**

Run: `grep -c "lesson-details" resources/css/components/lesson.css` → Expected: ≥ 6
Run: `npm test` → Expected: all pass (77).

- [ ] **Step 4: Commit**

```bash
git add resources/css/components/lesson.css
git commit -m "Add lesson-details collapsible component for investing guides"
```

---

### Task 2: `widget-ui.mjs` extraction + `invest-widgets.mjs` (TDD)

**Files:**
- Create: `resources/js/lib/widget-ui.mjs`
- Create: `resources/js/invest-widgets.mjs`
- Modify: `resources/js/start-here.mjs` (import shared helpers instead of local copies)
- Test: `test/invest-widgets.test.mjs`

**Interfaces:**
- Consumes: `linePath`, `extent`, `scale` from `resources/js/lib/chart-svg.mjs`.
- Produces:
  - `widget-ui.mjs` exports: `W` (640), `H` (280), `PAD` (16), `svgOpen(label)`, `axes()`, `makeButtons(container, items, onPick)` (with `aria-pressed`, exactly the behavior currently in `start-here.mjs`).
  - `invest-widgets.mjs` named exports (unit-tested): `ALLOCATIONS`, `BEST_DAYS`, `OPS_STEPS`, `TICKET_PARTS`, `FLOW_ROUTES`, `ROTH_MODES`, `donutSegments(slices)`.
  - Browser side effect: mounts `order-ticket`, `ops-stepper`, `roth-toggle`, `allocation`, `paycheck-flow`, `best-days`.

- [ ] **Step 1: Write the failing test `test/invest-widgets.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOCATIONS, BEST_DAYS, OPS_STEPS, TICKET_PARTS, FLOW_ROUTES, ROTH_MODES,
  donutSegments,
} from '../resources/js/invest-widgets.mjs';

test('every allocation preset sums to 100 and has plain-language labels', () => {
  for (const [name, slices] of Object.entries(ALLOCATIONS)) {
    const total = slices.reduce((s, x) => s + x.pct, 0);
    assert.equal(total, 100, `${name} sums to 100`);
    for (const s of slices) {
      assert.ok(s.label.includes('—'), `${name}: label has a plain-language gloss`);
      assert.ok(s.color.startsWith('var(--'), `${name}: token color`);
    }
  }
  assert.deepEqual(Object.keys(ALLOCATIONS), ['1 fund', '2 funds', '3 funds']);
});

test('donutSegments converts slices to arc geometry covering the full ring', () => {
  const segs = donutSegments([{ pct: 60 }, { pct: 30 }, { pct: 10 }]);
  assert.equal(segs.length, 3);
  let cum = 0;
  for (const [i, g] of segs.entries()) {
    assert.ok(Math.abs(g.offset - cum) < 1e-6, `segment ${i} starts where prior ended`);
    cum += g.frac;
  }
  assert.ok(Math.abs(cum - 1) < 1e-6, 'segments cover the ring');
});

test('best-days series tell the documented story: full >> miss10 >> miss20', () => {
  const { full, miss10, miss20 } = BEST_DAYS;
  assert.equal(full.length, miss10.length);
  assert.equal(full.length, miss20.length);
  assert.ok(full.length >= 12);
  assert.ok(full[full.length - 1] > miss10[miss10.length - 1] * 2, 'missing 10 best days roughly halves it or worse');
  assert.ok(miss10[miss10.length - 1] > miss20[miss20.length - 1], 'missing 20 is worse than 10');
  assert.equal(full[0], miss10[0]);
  assert.equal(full[0], miss20[0]);
});

test('stepper, ticket, flow, and roth datasets all carry non-empty teaching text', () => {
  assert.equal(OPS_STEPS.length, 4);
  for (const s of OPS_STEPS) { assert.ok(s.title.length > 0); assert.ok(s.why.length > 20); }
  assert.ok(Object.keys(TICKET_PARTS).length >= 4);
  for (const p of Object.values(TICKET_PARTS)) assert.ok(p.text.length > 20);
  assert.ok(Object.keys(FLOW_ROUTES).length === 3);
  for (const r of Object.values(FLOW_ROUTES)) assert.ok(r.text.length > 20);
  assert.deepEqual(Object.keys(ROTH_MODES), ['Roth', 'Traditional']);
  for (const m of Object.values(ROTH_MODES)) assert.ok(m.text.length > 20);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/invest-widgets.test.mjs`
Expected: FAIL — `Cannot find module … invest-widgets.mjs`

- [ ] **Step 3: Create `resources/js/lib/widget-ui.mjs`** (moved verbatim from `start-here.mjs`, unchanged behavior)

```js
// Shared widget UI scaffolding for start-here.mjs and invest-widgets.mjs.
// DOM helpers live here; importing under Node is safe (no top-level DOM access).

export const W = 640, H = 280, PAD = 16;

export function svgOpen(label) {
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">`;
}

export function axes() {
  return `<line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/>` +
         `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/>`;
}

export function makeButtons(container, items, onPick) {
  const wrap = document.createElement('div');
  wrap.className = 'widget__controls';
  items.forEach((item, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'widget__btn' + (i === 0 ? ' is-active' : '');
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.textContent = item;
    b.addEventListener('click', () => {
      wrap.querySelectorAll('.widget__btn').forEach(x => {
        x.classList.remove('is-active');
        x.setAttribute('aria-pressed', 'false');
      });
      b.classList.add('is-active');
      b.setAttribute('aria-pressed', 'true');
      onPick(item, i);
    });
    wrap.appendChild(b);
  });
  container.appendChild(wrap);
  return wrap;
}
```

- [ ] **Step 4: Refactor `resources/js/start-here.mjs`**

Replace its local `const W = 640, H = 280, PAD = 16;`, `svgOpen`, `axes`, and `makeButtons` definitions with:

```js
import { W, H, PAD, svgOpen, axes, makeButtons } from './lib/widget-ui.mjs';
```

(Keep `lineSvg`, `fmt`, datasets, and all mounts in place. No behavior change — the moved code must be byte-identical to what was removed, including the `aria-pressed` handling.)

Run: `npm test` → Expected: all 77 still pass (start-here data tests import the module; a broken refactor fails loudly).

- [ ] **Step 5: Create `resources/js/invest-widgets.mjs`**

```js
// Investing-guide widgets: order-ticket, ops-stepper, roth-toggle,
// allocation, paycheck-flow, best-days.
// Static illustrative data only. Coexists with start-here.mjs: each module's
// mount loop claims only its own data-widget names.

import { extent, scale } from './lib/chart-svg.mjs';
import { W, H, PAD, svgOpen, axes, makeButtons } from './lib/widget-ui.mjs';

/* ---------- datasets (exported for tests) ---------- */

export const ALLOCATIONS = {
  '1 fund': [
    { label: 'Target-date fund — the whole plan in one ticket', pct: 100, color: 'var(--color-accent-primary)' },
  ],
  '2 funds': [
    { label: 'World stocks — the engine', pct: 90, color: 'var(--color-accent-primary)' },
    { label: 'Bonds — the shock absorber', pct: 10, color: 'var(--color-info)' },
  ],
  '3 funds': [
    { label: 'US stocks — the engine', pct: 60, color: 'var(--color-accent-primary)' },
    { label: 'International stocks — the diversifier', pct: 30, color: 'var(--color-info)' },
    { label: 'Bonds — the shock absorber', pct: 10, color: 'var(--color-success)' },
  ],
};

// Growth of $10,000 over ~30 years, sampled every 2 years. Shapes echo the
// well-documented "miss the best days" studies; values are illustrative.
export const BEST_DAYS = {
  full:   [10, 13, 17, 23, 20, 26, 34, 30, 22, 30, 41, 55, 72, 95, 128, 172, 224],
  miss10: [10, 12, 14, 18, 15, 19, 24, 21, 15, 19, 25, 32, 41, 52, 66, 83, 102],
  miss20: [10, 11, 12, 15, 12, 15, 18, 15, 11, 13, 17, 21, 26, 32, 40, 49, 61],
};

export const OPS_STEPS = [
  { title: '1. Grab the 401(k) match', why: 'If your employer matches contributions, that is an instant 50–100% return. Nothing else in investing comes close. Contribute at least enough to get every matching dollar.' },
  { title: '2. Max the Roth IRA', why: 'Up to $7,500 a year (2026). You fund it with taxed money, then it grows and comes out tax-free — and you can withdraw your contributions in a pinch without penalty.' },
  { title: '3. Back to the 401(k)', why: 'Still have room in the budget? Raise your 401(k) contribution toward its $24,500 limit (2026). Tax-advantaged space is use-it-or-lose-it each year.' },
  { title: '4. Taxable brokerage', why: 'Everything above the limits goes here. No caps, no age rules, full flexibility — you just pay taxes as you go. Great for goals before retirement age.' },
];

export const TICKET_PARTS = {
  'Ticker': { text: 'The fund you are buying, by its nickname — for a starter index fund that might be VTI or VT. Type it exactly; the screen will show the full fund name so you can double-check.' },
  'Amount': { text: 'Most brokerages let you enter dollars instead of shares. Dollars is easier: $100 buys $100 worth, including a fraction of a share if needed.' },
  'Order type': { text: 'Market means buy now at the going price — that is all a long-term investor needs. Limit means only buy at or below a price I set. Skip it; you are not day trading.' },
  'Review': { text: 'One last look: right ticker, right amount, right account. Then submit. Congratulations — you own a slice of thousands of companies.' },
};

export const FLOW_ROUTES = {
  'Paycheck → 401(k)': { text: 'Set once in your employer payroll portal: a percentage comes out of every paycheck before it touches your bank, and buys your chosen fund automatically. The money you never see is the easiest money to invest.' },
  'Bank → IRA': { text: 'A recurring transfer at your brokerage: for example $300 on the 5th of every month, checking → Roth IRA. Schedule it a few days after payday so it never bounces.' },
  'Cash → funds': { text: 'The step people forget: cash sitting at the brokerage is not invested. Set an automatic investment so every transfer buys your fund the next day. Transfer on the 5th, invest on the 6th.' },
};

export const ROTH_MODES = {
  'Roth': { taxOn: 'work', text: 'Roth: you pay tax on the money now, while you are working. Decades of growth and every withdrawal in retirement are tax-free. Best when your tax rate is modest today.' },
  'Traditional': { taxOn: 'retire', text: 'Traditional: contributions skip tax now, lowering this year’s bill. You pay income tax when you withdraw in retirement. Best when your tax rate is high today.' },
};

/* ---------- pure helpers (exported for tests) ---------- */

export function donutSegments(slices) {
  const total = slices.reduce((s, x) => s + x.pct, 0);
  let cum = 0;
  return slices.map(s => {
    const frac = s.pct / total;
    const seg = { frac, offset: cum };
    cum += frac;
    return seg;
  });
}

/* ---------- mounts (browser only) ---------- */

const fmt = n => '$' + Math.round(n * 1000).toLocaleString('en-US');

function noteEl() {
  const p = document.createElement('p');
  p.className = 'widget__note';
  p.setAttribute('aria-live', 'polite');
  return p;
}

function mountAllocation(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const R = 90, CX = W / 2, CY = H / 2, CIRC = 2 * Math.PI * R;
  const draw = name => {
    const slices = ALLOCATIONS[name];
    const segs = donutSegments(slices);
    const rings = segs.map((g, i) =>
      `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${slices[i].color}" stroke-width="42" ` +
      `stroke-dasharray="${(g.frac * CIRC).toFixed(1)} ${(CIRC - g.frac * CIRC).toFixed(1)}" ` +
      `stroke-dashoffset="${(-g.offset * CIRC + CIRC / 4).toFixed(1)}"/>`
    ).join('');
    const legend = slices.map((s, i) =>
      `<rect x="${W - 250}" y="${30 + i * 26 - 11}" width="12" height="12" fill="${s.color}"/>` +
      `<text x="${W - 232}" y="${30 + i * 26}" font-size="13" fill="var(--color-text-secondary)">${s.pct}% ${s.label}</text>`
    ).join('');
    chart.innerHTML = svgOpen(`${name} portfolio allocation`) +
      `<g transform="translate(-120,0)">${rings}</g>` + legend + '</svg>';
    note.textContent = name === '1 fund'
      ? 'One target-date fund. It rebalances itself and gets more conservative as you age. Genuinely fine forever.'
      : name === '2 funds'
        ? 'One world stock fund plus a bond fund. Global diversification with two tickets.'
        : 'The classic three-fund portfolio. A common starting mix for someone in their 30s; shift toward bonds as you age.';
  };
  makeButtons(body, Object.keys(ALLOCATIONS), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('1 fund');
}

function mountBestDays(body) {
  body.textContent = '';
  const { full, miss10, miss20 } = BEST_DAYS;
  const [, hi] = extent(full);
  const path = v => v.map((n, i) =>
    `${i === 0 ? 'M' : 'L'}${scale(i, 0, v.length - 1, PAD, W - PAD).toFixed(1)},${scale(n, 0, hi, H - PAD, PAD).toFixed(1)}`
  ).join(' ');
  const legend = [
    ['Fully invested', 'var(--color-accent-primary)', full],
    ['Missed the 10 best days', 'var(--color-info)', miss10],
    ['Missed the 20 best days', 'var(--color-warning)', miss20],
  ].map(([label, color, v], i) =>
    `<rect x="${PAD + 12}" y="${24 + i * 22 - 10}" width="12" height="4" fill="${color}"/>` +
    `<text x="${PAD + 32}" y="${24 + i * 22}" font-size="13" fill="var(--color-text-secondary)">${label} — ${fmt(v[v.length - 1] / 1)}</text>`
  ).join('');
  const chart = document.createElement('div');
  chart.innerHTML = svgOpen('Growth of $10,000 over 30 years: fully invested versus missing the best days') + axes() +
    `<path d="${path(miss20)}" fill="none" stroke="var(--color-warning)" stroke-width="2" stroke-dasharray="4 4"/>` +
    `<path d="${path(miss10)}" fill="none" stroke="var(--color-info)" stroke-width="2" stroke-dasharray="4 4"/>` +
    `<path d="${path(full)}" fill="none" stroke="var(--color-accent-primary)" stroke-width="2.5"/>` +
    legend + '</svg>';
  const note = noteEl();
  note.textContent = 'The catch: the best days cluster right next to the worst ones. Sell during a crash and you are almost guaranteed to miss them. (Illustrative values echoing published studies.)';
  body.appendChild(chart);
  body.appendChild(note);
}

function mountOpsStepper(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const labels = ['Match', 'Roth IRA', '401(k)', 'Taxable'];
  const draw = (_, idx) => {
    const boxes = labels.map((l, i) => {
      const x = PAD + 10 + i * 152;
      const active = i === idx;
      return `<rect x="${x}" y="105" width="130" height="70" rx="10" fill="${active ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)'}" stroke="var(--color-border-strong)"/>` +
        `<text x="${x + 65}" y="133" text-anchor="middle" font-size="14" font-weight="600" fill="${active ? 'var(--color-bg-primary)' : 'var(--color-text-primary)'}">${i + 1}. ${l}</text>` +
        `<text x="${x + 65}" y="155" text-anchor="middle" font-size="11" fill="${active ? 'var(--color-bg-primary)' : 'var(--color-text-tertiary)'}">${['free money', 'tax-free growth', 'more shelter', 'no limits'][i]}</text>` +
        (i < 3 ? `<text x="${x + 141}" y="145" font-size="16" fill="var(--color-text-tertiary)">→</text>` : '');
    }).join('');
    chart.innerHTML = svgOpen('Order of operations: match, Roth IRA, 401(k), taxable') + boxes + '</svg>';
    note.textContent = OPS_STEPS[idx].why;
  };
  makeButtons(body, OPS_STEPS.map(s => s.title), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw(null, 0);
}

function mountRothToggle(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const draw = name => {
    const m = ROTH_MODES[name];
    const phase = (x, label, taxed) =>
      `<rect x="${x}" y="100" width="250" height="80" rx="10" fill="var(--color-bg-secondary)" stroke="var(--color-border-strong)"/>` +
      `<text x="${x + 125}" y="132" text-anchor="middle" font-size="15" font-weight="600" fill="var(--color-text-primary)">${label}</text>` +
      (taxed
        ? `<rect x="${x + 75}" y="145" width="100" height="24" rx="12" fill="var(--color-warning)"/>` +
          `<text x="${x + 125}" y="161" text-anchor="middle" font-size="12" font-weight="600" fill="var(--color-bg-primary)">TAX HERE</text>`
        : `<text x="${x + 125}" y="161" text-anchor="middle" font-size="12" fill="var(--color-success)">tax-free</text>`);
    chart.innerHTML = svgOpen(`${name}: when the tax bite lands`) +
      phase(50, 'Working years', m.taxOn === 'work') +
      `<text x="${W / 2}" y="145" text-anchor="middle" font-size="18" fill="var(--color-text-tertiary)">→</text>` +
      phase(340, 'Retirement', m.taxOn === 'retire') + '</svg>';
    note.textContent = m.text;
  };
  makeButtons(body, Object.keys(ROTH_MODES), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('Roth');
}

function mountOrderTicket(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const rows = [
    ['Ticker', 'VTI — Vanguard Total Stock Market ETF'],
    ['Amount', '$100.00  (dollars)'],
    ['Order type', 'Market'],
    ['Review', 'Review order →'],
  ];
  const draw = name => {
    const inner = rows.map(([key, val], i) => {
      const y = 40 + i * 52;
      const active = key === name;
      return `<g data-row="${key}" opacity="${active ? 1 : 0.45}">` +
        `<rect x="${PAD + 40}" y="${y}" width="${W - PAD * 2 - 80}" height="42" rx="8" fill="${key === 'Review' ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)'}" stroke="${active ? 'var(--color-accent-primary)' : 'var(--color-border-strong)'}" stroke-width="${active ? 2.5 : 1}"/>` +
        (key === 'Review'
          ? `<text x="${W / 2}" y="${y + 27}" text-anchor="middle" font-size="14" font-weight="600" fill="var(--color-bg-primary)">${val}</text>`
          : `<text x="${PAD + 56}" y="${y + 27}" font-size="13" fill="var(--color-text-tertiary)">${key}:</text>` +
            `<text x="${PAD + 150}" y="${y + 27}" font-size="14" font-weight="600" fill="var(--color-text-primary)">${val}</text>`) +
        '</g>';
    }).join('');
    chart.innerHTML = svgOpen('A typical buy screen at a brokerage') + inner + '</svg>';
    note.textContent = TICKET_PARTS[name].text;
  };
  makeButtons(body, Object.keys(TICKET_PARTS), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('Ticker');
}

function mountPaycheckFlow(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const routes = Object.keys(FLOW_ROUTES);
  const targets = [['401(k)', 90], ['Roth IRA', 270], ['Taxable', 450]];
  const draw = (_, idx) => {
    const src = `<rect x="${W / 2 - 70}" y="24" width="140" height="44" rx="10" fill="var(--color-accent-primary)"/>` +
      `<text x="${W / 2}" y="51" text-anchor="middle" font-size="14" font-weight="600" fill="var(--color-bg-primary)">Paycheck</text>`;
    const nodes = targets.map(([label, x], i) => {
      const active = i === idx || (idx === 2 && i === 1);
      return `<g opacity="${i === idx ? 1 : 0.5}">` +
        `<path d="M${W / 2},68 C${W / 2},110 ${x + 50},130 ${x + 50},168" fill="none" stroke="${i === idx ? 'var(--color-accent-primary)' : 'var(--color-border-strong)'}" stroke-width="${i === idx ? 3 : 1.5}"/>` +
        `<rect x="${x}" y="170" width="100" height="44" rx="10" fill="var(--color-bg-secondary)" stroke="${active ? 'var(--color-accent-primary)' : 'var(--color-border-strong)'}"/>` +
        `<text x="${x + 50}" y="197" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-text-primary)">${label}</text>` +
        '</g>';
    }).join('');
    const cashNote = idx === 2
      ? `<text x="${W / 2}" y="248" text-anchor="middle" font-size="12" fill="var(--color-text-tertiary)">…and inside each account, cash auto-buys your fund the next day</text>`
      : '';
    chart.innerHTML = svgOpen('Money routing itself from paycheck to investments') + src + nodes + cashNote + '</svg>';
    note.textContent = FLOW_ROUTES[routes[idx]].text;
  };
  makeButtons(body, routes, draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw(null, 0);
}

/* ---------- init ---------- */

const MOUNTS = {
  'order-ticket': mountOrderTicket,
  'ops-stepper': mountOpsStepper,
  'roth-toggle': mountRothToggle,
  'allocation': mountAllocation,
  'paycheck-flow': mountPaycheckFlow,
  'best-days': mountBestDays,
};

if (typeof document !== 'undefined') {
  for (const el of document.querySelectorAll('[data-widget]')) {
    const mount = MOUNTS[el.dataset.widget];
    const body = el.querySelector('.widget__body');
    if (mount && body) mount(body);
  }
}
```

- [ ] **Step 6: Run tests**

Run: `node --test test/invest-widgets.test.mjs` → Expected: PASS (4 tests).
Run: `npm test` → Expected: full suite green (81), including untouched Start Here data tests.
Run: `node --input-type=module -e "import('./resources/js/invest-widgets.mjs').then(m => console.log(Object.keys(m).length + ' exports'))"` → Expected: prints without error (Node import-safe).

- [ ] **Step 7: Commit**

```bash
git add resources/js/lib/widget-ui.mjs resources/js/invest-widgets.mjs resources/js/start-here.mjs test/invest-widgets.test.mjs
git commit -m "Add invest-widgets module and shared widget-ui helpers"
```

---

### Task 3: Guide-page test harness + hub index alignment (TDD)

**Files:**
- Create: `test/investing-guides.test.mjs`
- Modify: `moneyhub/investing/index.html` (reorder cards to the reading chain)

**Interfaces:**
- Produces: harness with a `REBUILT` array — **each page task (4–8) appends its slug**, activating structural checks for that page.

- [ ] **Step 1: Write the failing test `test/investing-guides.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'moneyhub', 'investing');
const BASE = '/moneyhub/investing';

const ORDER = [
  ['brokerage-basics', 'Brokerage Basics'],
  ['account-types', 'Account Types'],
  ['starter-portfolios', 'Simple Starter Portfolios'],
  ['automating-contributions', 'Automating Contributions'],
  ['staying-invested', 'Staying Invested Through Volatility'],
];

// Pages rebuilt so far. Each page task appends its slug here.
const REBUILT = [];

test('investing hub lists the five guides in reading-chain order', () => {
  const html = readFileSync(join(DIR, 'index.html'), 'utf8');
  let pos = -1;
  for (const [slug] of ORDER) {
    const i = html.indexOf(`href="${BASE}/${slug}.html"`);
    assert.ok(i > pos, `hub lists ${slug} after the previous guide`);
    pos = i;
  }
});

for (const slug of REBUILT) {
  const idx = ORDER.findIndex(([s]) => s === slug);
  const [, title] = ORDER[idx];
  test(`guide page: ${slug}`, () => {
    const html = readFileSync(join(DIR, `${slug}.html`), 'utf8');
    assert.match(html, new RegExp(`<h1 class="article__title">${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /class="callout callout--ai"/);
    assert.match(html, /class="lesson-tldr"/);
    assert.ok((html.match(/<details class="lesson-details">/g) || []).length >= 1, 'has >= 1 collapsible');
    const terms = html.match(/<section class="lesson-terms">([\s\S]*?)<\/section>/);
    assert.ok(terms, 'has a lesson-terms section');
    assert.ok((terms[1].match(/<li>/g) || []).length >= 3, 'terms recap has >= 3 items');
    assert.ok((html.match(/<details class="quiz__item">/g) || []).length >= 2, 'has >= 2 self-check questions');
    // Visible-word cap: strip widget figures, ALL details elements, terms, quiz.
    const body = html.match(/<div class="article__content">([\s\S]*?)<nav class="step-nav-footer">/);
    assert.ok(body, 'article content present');
    const visible = body[1]
      .replace(/<figure class="widget"[\s\S]*?<\/figure>/g, ' ')
      .replace(/<details[\s\S]*?<\/details>/g, ' ')
      .replace(/<section class="lesson-terms">[\s\S]*?<\/section>/g, ' ')
      .replace(/<section class="quiz"[\s\S]*?<\/section>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .trim()
      .split(/\s+/).length;
    assert.ok(visible <= 500, `visible prose is ${visible} words (cap 500)`);
    // Chain integrity.
    const prev = idx === 0 ? `${BASE}/` : `${BASE}/${ORDER[idx - 1][0]}.html`;
    const next = idx === ORDER.length - 1 ? `${BASE}/` : `${BASE}/${ORDER[idx + 1][0]}.html`;
    assert.ok(html.includes(`href="${prev}" class="step-nav-footer__prev"`), 'prev link');
    assert.ok(html.includes(`href="${next}" class="step-nav-footer__next"`), 'next link');
    assert.ok(html.includes(`href="${BASE}/" class="step-nav-footer__home"`), 'home link');
    assert.ok(html.includes('src="/resources/js/invest-widgets.mjs"'), 'loads invest-widgets');
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/investing-guides.test.mjs`
Expected: FAIL — the hub-order test fails (current card order starts with account-types).

- [ ] **Step 3: Reorder the hub cards**

In `moneyhub/investing/index.html`, reorder the five `<a class="hub-card">` elements inside `.hub-grid` to: brokerage-basics, account-types, starter-portfolios, automating-contributions, staying-invested. Update these two card descriptions (others stay):

- brokerage-basics card desc → `What a brokerage is, opening one in 15 minutes, and reading a buy screen.`
- staying-invested card desc → `The hardest part — what to do in a crash (nothing), and why missing the best days is so expensive.`

- [ ] **Step 4: Run tests**

Run: `node --test test/investing-guides.test.mjs` → Expected: PASS (1 test).
Run: `npm test` → Expected: full suite green (index.html files are skipped by the indexer — no rebuild needed).

- [ ] **Step 5: Commit**

```bash
git add test/investing-guides.test.mjs moneyhub/investing/index.html
git commit -m "Add investing-guide test harness and align hub card order with reading chain"
```

---

### Task 4: Rebuild Brokerage Basics

**Files:**
- Rewrite: `moneyhub/investing/brokerage-basics.html` (full file from §SHELL-G)
- Modify: `test/investing-guides.test.mjs` (append `'brokerage-basics'` to `REBUILT`)
- Modify (generated): `resources/data/search-index.json`

Slots: `TITLE` = `Brokerage Basics` · `SLUG` = `brokerage-basics` · `DESC` = `What a brokerage actually is, how to open one in about 15 minutes, and how to read a buy screen — in plain language.` · `PREV_BLOCK` = page-1 variant (back to Investing Hub) · `NEXT_HREF` = `/moneyhub/investing/account-types.html` · `NEXT_TITLE` = `Account Types` · `EXTRA_SCRIPTS` = invest-widgets only.

- [ ] **Step 1: Append `'brokerage-basics'` to `REBUILT`; run `node --test test/investing-guides.test.mjs`** — Expected: FAIL (page not yet rebuilt: missing lesson-tldr etc.).

- [ ] **Step 2: Rebuild the page from §SHELL-G with this `CONTENT`:**

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>A brokerage is just the store where you buy investments — opening one takes about 15 minutes online, and any of the big names will do fine.</p></aside>
            <p>Most people start with "what should I buy?" The real first question is: <strong>where does this money live?</strong> That place is a brokerage.</p>
            <h2>Bank vs. brokerage</h2>
            <p>Your bank holds cash for daily life. A brokerage holds investments: you move cash in, then use it to buy funds. Same idea as a bank account — different job. You'll want both.</p>
            <h2>Opening one is genuinely easy</h2>
            <p>Every brokerage follows the same flow: create a login, enter your personal details (name, address, Social Security number — required by law, not nosiness), pick an account type, link your bank, move money in. About 15 minutes. No minimums at the major firms, and trading the basics is free.</p>
            <details class="lesson-details">
  <summary>The step-by-step, and why it's all free now</summary>
  <div class="lesson-details__body">
    [EXTRACT §1 of brokerage-basics — the pre-internet history and $0-commission era]
    [EXTRACT §3 of brokerage-basics — the account-opening walkthrough]
  </div>
</details>
            <h2>Which one? They're all fine</h2>
            <p>There is no secret best brokerage. Match the vibe: want a solid long-term home with good tools — <strong>Fidelity, Schwab, or Vanguard</strong>. Want phone-first simplicity — <strong>Robinhood or SoFi</strong>, with one warning: don't let a slick app turn investing into a casino. Want global markets and pro tools — Interactive Brokers, which is not where a beginner starts.</p>
            <details class="lesson-details">
  <summary>The big names, compared</summary>
  <div class="lesson-details__body">
    [EXTRACT §4–5 of brokerage-basics — the per-brokerage rundown and "how I'd help someone pick"]
  </div>
</details>
            <h2>Your first buy screen</h2>
            <p>Here's the screen that intimidates everyone the first time. Tap each part — there are only four:</p>
            <figure class="widget" data-widget="order-ticket">
  <div class="widget__body">
    <p class="widget__fallback">A buy screen has four parts: the ticker (the fund's nickname, like VTI), the amount (enter dollars — $100 buys $100 worth, fractions included), the order type (market means buy now at the going price — all a long-term investor needs), and a review step to double-check before submitting.</p>
  </div>
  <figcaption class="widget__caption">A typical buy screen. Tap each label. Market order, dollar amount — that's the whole trick.</figcaption>
</figure>
            <p>Once the account is open and linked, the hard part is never the website again. The hard part is sticking to a plan — which is what the rest of these guides are for.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Brokerage</strong> — the company (and account) that holds your investments.</li>
                <li><strong>Taxable account</strong> — the flexible default account; you pay taxes as you go.</li>
                <li><strong>Market order</strong> — buy now at the going price; the long-term default.</li>
                <li><strong>Limit order</strong> — only buy at a price I set; trader tool, safe to ignore.</li>
                <li><strong>Fractional shares</strong> — buying by dollars instead of whole shares.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>What's the difference between your bank and your brokerage?</summary><p>The bank holds cash for daily life; the brokerage holds investments. You move cash from bank to brokerage, then buy funds with it.</p></details>
                <details class="quiz__item"><summary>Which order type should a beginner use, and why?</summary><p>Market order — it buys right away at the going price. Limit orders are for traders trying to time entries, which is exactly what a long-term investor doesn't do.</p></details>
                <details class="quiz__item"><summary>Does it matter much whether you pick Fidelity, Schwab, or Vanguard?</summary><p>Not really. All three are excellent long-term homes with $0 trades and no minimums. Picking one and starting matters far more than which one.</p></details>
            </section>
```

Replace each `[EXTRACT …]` line per the Extraction rule (§ at top of plan). No 2026-figure edits needed on this page.

- [ ] **Step 3: `npm run build:index`, then `npm test`** — Expected: all green including `guide page: brokerage-basics`.

- [ ] **Step 4: Commit**

```bash
git add moneyhub/investing/brokerage-basics.html test/investing-guides.test.mjs resources/data/search-index.json
git commit -m "Rebuild Brokerage Basics guide in Start Here style with order-ticket widget"
```

---

### Task 5: Rebuild Account Types

**Files:** Rewrite `moneyhub/investing/account-types.html`; modify `test/investing-guides.test.mjs`, `resources/data/search-index.json`.

Slots: `TITLE` = `Account Types` · `SLUG` = `account-types` · `DESC` = `Tax-deferred, tax-free, taxable — the three buckets in plain language, and the order to fill them. Updated with 2026 IRS limits.` · `PREV_SLUG` = `brokerage-basics` · `PREV_TITLE` = `Brokerage Basics` · `NEXT_HREF` = `/moneyhub/investing/starter-portfolios.html` · `NEXT_TITLE` = `Simple Starter Portfolios` · `EXTRA_SCRIPTS` = invest-widgets only.

- [ ] **Step 1: Append `'account-types'` to `REBUILT`; run the harness** — Expected: FAIL.

- [ ] **Step 2: Rebuild the page from §SHELL-G with this `CONTENT`:**

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>There are three buckets — taxed later, taxed never again, and taxed as you go — and the order you fill them matters more than filling them perfectly.</p></aside>
            <p>Same investments, different wrappers. The wrapper decides when the tax man shows up.</p>
            <h2>The three buckets</h2>
            <ul>
                <li><strong>Tax-deferred</strong> (Traditional 401(k), Traditional IRA) — skip tax now, pay income tax when you withdraw in retirement.</li>
                <li><strong>Tax-free</strong> (Roth 401(k), Roth IRA) — pay tax now; growth and withdrawals are tax-free forever.</li>
                <li><strong>Taxable</strong> (regular brokerage) — no special treatment, no limits, no age rules. Full flexibility, taxes as you go.</li>
            </ul>
            <h2>Fill them in this order</h2>
            <p>This sequence beats agonizing over any single choice. Tap through:</p>
            <figure class="widget" data-widget="ops-stepper">
  <div class="widget__body">
    <p class="widget__fallback">The order: 1) contribute enough to get every dollar of your employer 401(k) match — an instant 50–100% return; 2) max a Roth IRA ($7,500 in 2026); 3) go back and raise your 401(k) toward its $24,500 limit; 4) anything beyond that goes to a taxable brokerage — no caps, full flexibility.</p>
  </div>
  <figcaption class="widget__caption">The order of operations. Free money first, tax-free growth second, more shelter third, flexibility last.</figcaption>
</figure>
            <h2>Roth or Traditional?</h2>
            <p>One question does most of the work: <strong>is your tax rate low now, or high now?</strong> Modest bracket today — lean Roth and lock in today's low rate. Peak earning years — lean Traditional and take the deduction. Unsure — split. Having some of each gives future-you options.</p>
            <figure class="widget" data-widget="roth-toggle">
  <div class="widget__body">
    <p class="widget__fallback">Roth: tax comes out during your working years; retirement withdrawals are tax-free. Traditional: contributions skip tax now; withdrawals are taxed in retirement. Low bracket today favors Roth; high bracket today favors Traditional.</p>
  </div>
  <figcaption class="widget__caption">Same timeline, different tax bite. Toggle to see where it lands.</figcaption>
</figure>
            <details class="lesson-details">
  <summary>2026 contribution limits — the actual numbers</summary>
  <div class="lesson-details__body">
    <p>Limits below are the 2026 IRS figures; they adjust most years.</p>
    <h3>401(k) / 403(b) / TSP</h3>
    <ul>
        <li>$24,500 per year (under age 50)</li>
        <li>+$8,000 catch-up at age 50+ · a higher $11,250 catch-up applies at ages 60–63</li>
        <li>Employer match doesn't count toward your limit</li>
    </ul>
    <h3>IRA (Traditional or Roth)</h3>
    <ul>
        <li>$7,500 per year — that's $625/month (under age 50)</li>
        <li>+$1,100 catch-up at age 50+</li>
        <li>Roth IRA has income limits that phase out eligibility at higher incomes</li>
    </ul>
    <h3>Taxable brokerage</h3>
    <ul>
        <li>No limit — invest as much as you want</li>
    </ul>
    <h3>Also worth knowing</h3>
    <ul>
        <li>Tax-deferred accounts have Required Minimum Distributions (RMDs) starting at age 73; Roth IRAs have none</li>
        <li>Roth IRA contributions (not earnings) can be withdrawn anytime without penalty</li>
    </ul>
  </div>
</details>
            <details class="lesson-details">
  <summary>The full Roth vs. Traditional breakdown</summary>
  <div class="lesson-details__body">
    [EXTRACT §2–4 of account-types — the three buckets in full detail]
    [EXTRACT §7 of account-types — Roth vs Traditional: how to decide]
  </div>
</details>
            <details class="lesson-details">
  <summary>What about HSAs?</summary>
  <div class="lesson-details__body">
    [EXTRACT §8 of account-types — with ONE edit: append to the triple-tax-benefit list item the sentence "For 2026 the limits are $4,400 (self-only) or $8,750 (family), plus a $1,000 catch-up at age 55+."]
  </div>
</details>
            <p>The big picture: the perfect account mix matters less than investing consistently in low-cost index funds inside <em>any</em> of these buckets. Pick a reasonable order, automate it, move on.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Tax-deferred</strong> — skip tax now, pay it in retirement (Traditional).</li>
                <li><strong>Tax-free</strong> — pay tax now, never again (Roth).</li>
                <li><strong>Employer match</strong> — free money; always grab all of it.</li>
                <li><strong>Contribution limit</strong> — the yearly cap on tax-advantaged accounts.</li>
                <li><strong>RMD</strong> — required withdrawals from tax-deferred accounts starting at 73.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>You have $300/month to invest and your employer matches 401(k) contributions. Where does the first dollar go?</summary><p>The 401(k), up to the full match — it's an instant 50–100% return. Then the Roth IRA.</p></details>
                <details class="quiz__item"><summary>You're early-career in a low tax bracket. Roth or Traditional, and why?</summary><p>Lean Roth: pay tax now while your rate is low, and decades of growth come out tax-free later.</p></details>
                <details class="quiz__item"><summary>What's the one account with no contribution limit?</summary><p>The taxable brokerage account — invest any amount, anytime, with taxes as you go.</p></details>
            </section>
```

Replace `[EXTRACT …]` per the Extraction rule.

- [ ] **Step 3: `npm run build:index`, then `npm test`** — Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add moneyhub/investing/account-types.html test/investing-guides.test.mjs resources/data/search-index.json
git commit -m "Rebuild Account Types guide with 2026 limits, ops-stepper and roth-toggle widgets"
```

---

### Task 6: Rebuild Starter Portfolios

**Files:** Rewrite `moneyhub/investing/starter-portfolios.html`; modify `test/investing-guides.test.mjs`, `resources/data/search-index.json`.

Slots: `TITLE` = `Simple Starter Portfolios` · `SLUG` = `starter-portfolios` · `DESC` = `One, two, or three broad index funds is a complete portfolio. The classic starter mixes, in plain language, with an interactive allocation chart.` · `PREV_SLUG` = `account-types` · `PREV_TITLE` = `Account Types` · `NEXT_HREF` = `/moneyhub/investing/automating-contributions.html` · `NEXT_TITLE` = `Automating Contributions` · `EXTRA_SCRIPTS` = invest-widgets only.

- [ ] **Step 1: Append `'starter-portfolios'` to `REBUILT`; run the harness** — Expected: FAIL.

- [ ] **Step 2: Rebuild the page from §SHELL-G with this `CONTENT`:**

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>You don't need perfect picks — one, two, or three broad index funds is a complete portfolio you can hold for decades.</p></aside>
            <p>This is where people freeze: "what do I actually buy?" The answer is deliberately boring, courtesy of Vanguard founder John Bogle: <strong>own the whole market, keep costs low, don't trade, stay the course.</strong> Everything below is just that idea in three sizes.</p>
            <h2>Pick a size</h2>
            <figure class="widget" data-widget="allocation">
  <div class="widget__body">
    <p class="widget__fallback">Three starter portfolios: one fund (a target-date fund — 100%, rebalances itself as you age); two funds (90% world stocks + 10% bonds); three funds (60% US stocks + 30% international + 10% bonds — the classic three-fund portfolio, shifting toward bonds as you age).</p>
  </div>
  <figcaption class="widget__caption">Tap 1, 2, or 3 funds. Every one of these is a complete, respectable plan. More funds ≠ better returns — just more knobs.</figcaption>
</figure>
            <p><strong>Any of these is fine.</strong> The one-fund target-date option is genuinely enough for a whole investing life. The best portfolio isn't the optimal one — it's the one you'll actually stick with through a crash.</p>
            <details class="lesson-details">
  <summary>The exact funds, by brokerage, and sample mixes by age</summary>
  <div class="lesson-details__body">
    [EXTRACT §2–4 of starter-portfolios — the three/two/one-fund portfolios with tickers]
    [EXTRACT §8 of starter-portfolios — sample portfolios by age/stage]
    [EXTRACT §11 of starter-portfolios — how to actually implement this]
  </div>
</details>
            <h2>What about picking stocks?</h2>
            <p>Most professionals fail to beat a plain index fund over 20+ years. If the itch is real, cap it: 5–10% of your portfolio, treated as fun money, after the boring core is built.</p>
            <details class="lesson-details">
  <summary>The full case against stock-picking, rebalancing, and fees</summary>
  <div class="lesson-details__body">
    [EXTRACT §5–7 of starter-portfolios — age/risk adjustment, individual stocks, rebalancing]
    [EXTRACT §9 of starter-portfolios — expense ratios]
  </div>
</details>
            <p>Then the real work: check it once a year, rebalance if it drifted, and otherwise leave it alone. The next two guides make that automatic.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Three-fund portfolio</strong> — US stocks + international + bonds; the classic.</li>
                <li><strong>Target-date fund</strong> — one fund that rebalances itself as you age.</li>
                <li><strong>Allocation</strong> — your mix of stocks and bonds.</li>
                <li><strong>Rebalancing</strong> — nudging the mix back to target, about once a year.</li>
                <li><strong>Expense ratio</strong> — the fund's yearly fee; under 0.10% is good.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>Is a single target-date fund a "real" portfolio?</summary><p>Yes — completely. It holds thousands of stocks and bonds and adjusts itself as you age. Many people should never own anything else.</p></details>
                <details class="quiz__item"><summary>What do bonds do in these mixes?</summary><p>They're the shock absorber — they smooth the ride so you can hold on during stock crashes. More bonds as you age, fewer when retirement is decades away.</p></details>
                <details class="quiz__item"><summary>You really want to buy individual stocks. What's the rule?</summary><p>Core first: broad index funds. Then cap the stock-picking at 5–10%, treated as fun money you can afford to lose.</p></details>
            </section>
```

Replace `[EXTRACT …]` per the Extraction rule.

- [ ] **Step 3: `npm run build:index`, then `npm test`** — Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add moneyhub/investing/starter-portfolios.html test/investing-guides.test.mjs resources/data/search-index.json
git commit -m "Rebuild Starter Portfolios guide with interactive allocation widget"
```

---

### Task 7: Rebuild Automating Contributions

**Files:** Rewrite `moneyhub/investing/automating-contributions.html`; modify `test/investing-guides.test.mjs`, `resources/data/search-index.json`.

Slots: `TITLE` = `Automating Contributions` · `SLUG` = `automating-contributions` · `DESC` = `Money that moves itself beats willpower every month. The three layers of investing automation, in plain language.` · `PREV_SLUG` = `starter-portfolios` · `PREV_TITLE` = `Simple Starter Portfolios` · `NEXT_HREF` = `/moneyhub/investing/staying-invested.html` · `NEXT_TITLE` = `Staying Invested Through Volatility` · `EXTRA_SCRIPTS` = invest-widgets only.

- [ ] **Step 1: Append `'automating-contributions'` to `REBUILT`; run the harness** — Expected: FAIL.

- [ ] **Step 2: Rebuild the page from §SHELL-G with this `CONTENT`:**

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>Automation is the plan — money that moves itself every month beats willpower, motivation, and market moods.</p></aside>
            <p>"I'll invest when I have extra" fails for everyone, everywhere, always. Life gets busy, the market feels scary, the money finds something else to be. The fix isn't discipline. It's plumbing.</p>
            <h2>Three pipes to connect</h2>
            <figure class="widget" data-widget="paycheck-flow">
  <div class="widget__body">
    <p class="widget__fallback">Three automations: paycheck → 401(k), set once in your payroll portal — money invests before you see it; bank → IRA, a recurring monthly transfer at your brokerage, scheduled a few days after payday; and cash → funds, an automatic investment so transferred cash actually buys your fund the next day instead of sitting idle.</p>
  </div>
  <figcaption class="widget__caption">Tap each route. The third one is the step everyone forgets — cash at the brokerage isn't invested until something buys the fund.</figcaption>
</figure>
            <p>Set all three once and the system runs whether you're motivated, busy, or asleep. Your only jobs afterward: glance at it quarterly, and turn the dial up when income rises.</p>
            <h2>Start with any number</h2>
            <p>$50 a month builds the same habit as $500. The person who automates $100/month for 20 years beats the person who plans $500 and never starts. When a raise lands, bump the 401(k) by 1–2% before the raise reaches your checking account — future-you gets paid first and present-you never feels it.</p>
            <details class="lesson-details">
  <summary>Setup walkthroughs, layer by layer</summary>
  <div class="lesson-details__body">
    [EXTRACT §3–6 of automating-contributions — 401(k), IRA transfers, auto-investing, taxable — with ONE edit: in the IRA section, replace the sentence citing the 2024 limit ($7,000/year, $583/month) with "2026 IRA contribution limit: $7,500/year ($625/month)"]
  </div>
</details>
            <details class="lesson-details">
  <summary>The complete blueprint, plus raises and bonuses</summary>
  <div class="lesson-details__body">
    [EXTRACT §7–8 of automating-contributions]
  </div>
</details>
            <details class="lesson-details">
  <summary>The four ways automation breaks (and the fixes)</summary>
  <div class="lesson-details__body">
    [EXTRACT §10 of automating-contributions — common mistakes]
  </div>
</details>
            <p>Why this works isn't math, it's behavior: no monthly "should I invest?" decision, no waiting for better prices, no lifestyle creep eating the surplus. The system doesn't need you to be good — just to leave it alone.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Payroll contribution</strong> — 401(k) money taken from your paycheck before you see it.</li>
                <li><strong>Recurring transfer</strong> — an automatic monthly bank → brokerage move.</li>
                <li><strong>Automatic investment plan</strong> — cash auto-buys your fund on a schedule.</li>
                <li><strong>Pay yourself first</strong> — investments come out before spending money.</li>
                <li><strong>Lifestyle creep</strong> — raises quietly becoming spending instead of wealth.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>Money transfers to your brokerage every month, but your balance never grows in up markets. What's likely wrong?</summary><p>The cash is sitting uninvested — layer 3 is missing. Set an automatic investment so each transfer buys your fund the next day.</p></details>
                <details class="quiz__item"><summary>You get a 4% raise. What's the move?</summary><p>Raise your 401(k) contribution 1–2% (or bump the IRA transfer) immediately, before the new pay hits your account. You capture the raise without ever missing it.</p></details>
                <details class="quiz__item"><summary>Why schedule transfers a few days after payday?</summary><p>So the money is definitely there — transfers that bounce or overdraft kill automation habits fast.</p></details>
            </section>
```

Replace `[EXTRACT …]` per the Extraction rule (note the 2026 edit inside the first collapsible).

- [ ] **Step 3: `npm run build:index`, then `npm test`** — Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add moneyhub/investing/automating-contributions.html test/investing-guides.test.mjs resources/data/search-index.json
git commit -m "Rebuild Automating Contributions guide with paycheck-flow widget and 2026 IRA figures"
```

---

### Task 8: Rebuild Staying Invested

**Files:** Rewrite `moneyhub/investing/staying-invested.html`; modify `test/investing-guides.test.mjs`, `resources/data/search-index.json`.

Slots: `TITLE` = `Staying Invested Through Volatility` · `SLUG` = `staying-invested` · `DESC` = `Volatility is the admission price for market returns. What to actually do in a 30% drop, why panic selling is so expensive, and the chart that proves it.` · `PREV_SLUG` = `automating-contributions` · `PREV_TITLE` = `Automating Contributions` · next block = page-5 variant (→ Investing Hub) · `EXTRA_SCRIPTS` = BOTH `start-here.mjs` and `invest-widgets.mjs` (see §SHELL-G).

- [ ] **Step 1: Append `'staying-invested'` to `REBUILT`; run the harness** — Expected: FAIL.

- [ ] **Step 2: Rebuild the page from §SHELL-G with this `CONTENT`:**

```html
<aside class="lesson-tldr"><span class="lesson-tldr__label">In one sentence</span><p>Volatility is the admission price for market returns — the plan for a 30% drop is simple: change nothing, keep buying.</p></aside>
            <p>Everything else in these guides is setup. This page is the test. One day your portfolio will be down 30% and every headline will say it's going lower. What you do that week matters more than every fund choice you'll ever make.</p>
            <h2>Drops are the feature, not the bug</h2>
            <p>Stocks pay more than cash precisely <em>because</em> they're violent in the short term. And zoomed out, every crash so far has been a wiggle:</p>
            <figure class="widget" data-widget="crash">
  <div class="widget__body">
    <p class="widget__fallback">The U.S. market since 1990, with the dot-com bust (−49%), the 2008 financial crisis (−57%), the COVID crash (−34%), and the 2022 bear (−25%) marked at their troughs. Zoomed out, all four are wiggles on a line that climbs from about 330 to about 7,450.</p>
  </div>
  <figcaption class="widget__caption">Every major crash since 1990, marked at its bottom. Each felt like the end of the world. (Simplified index levels.)</figcaption>
</figure>
            <h2>Why you can't dodge the drops</h2>
            <p>The tempting move — sell now, buy back when it's safe — has a hidden cost that kills it:</p>
            <figure class="widget" data-widget="best-days">
  <div class="widget__body">
    <p class="widget__fallback">Growth of $10,000 over 30 years: fully invested ends around $224,000. Missing just the 10 best days cuts that to roughly $102,000. Missing the 20 best days: about $61,000. The best days cluster right next to the worst ones — sellers miss them. (Illustrative values echoing published studies.)</p>
  </div>
  <figcaption class="widget__caption">The cost of "waiting until it feels safe." A handful of missed days takes half the outcome.</figcaption>
</figure>
            <h2>The 30% drop playbook</h2>
            <ul>
                <li><strong>Don't look.</strong> Check quarterly at most; delete the app if you must.</li>
                <li><strong>Don't touch the automation.</strong> Your contributions are now buying at a discount.</li>
                <li><strong>Revisit the why, not the plan.</strong> Retirement still 15+ years away? Then today's price is noise.</li>
            </ul>
            <details class="lesson-details">
  <summary>Write your volatility plan before you need it</summary>
  <div class="lesson-details__body">
    [EXTRACT §3 of staying-invested — what I tell myself during drawdowns]
    [EXTRACT §7 of staying-invested — the personal volatility plan]
  </div>
</details>
            <details class="lesson-details">
  <summary>The history and the math of panic selling</summary>
  <div class="lesson-details__body">
    [EXTRACT §4–5 of staying-invested — every crash recovered; the real cost of panic selling]
  </div>
</details>
            <details class="lesson-details">
  <summary>Rebalancing in a crash, and the emergency-fund connection</summary>
  <div class="lesson-details__body">
    [EXTRACT §8–9 of staying-invested]
  </div>
</details>
            <p>Your edge over the professionals isn't knowledge — it's that nobody can force you to sell. You can be boring for 30 years. That's the entire game.</p>
            <section class="lesson-terms"><h2>Terms you now know</h2><ul>
                <li><strong>Volatility</strong> — the size of the swings; the admission price.</li>
                <li><strong>Drawdown</strong> — the fall from a peak to a bottom.</li>
                <li><strong>Panic selling</strong> — turning a temporary drop into a permanent loss.</li>
                <li><strong>Time horizon</strong> — when you actually need the money; the noise filter.</li>
                <li><strong>Buying the dip (automatically)</strong> — what your contributions do in a crash without you lifting a finger.</li>
            </ul></section>
            <section class="quiz" aria-label="Check yourself"><h2>Check yourself</h2>
                <details class="quiz__item"><summary>Your portfolio just dropped 30% and retirement is 20 years away. What does the playbook say?</summary><p>Change nothing: stop checking, keep the automatic contributions running (they're buying at a discount), and remember the goal hasn't moved.</p></details>
                <details class="quiz__item"><summary>Why is selling in a crash so expensive even if the market recovers?</summary><p>Because the market's best days cluster right next to its worst. Sellers sit out the rebound days, and missing even 10 of them over 30 years roughly halves the outcome.</p></details>
                <details class="quiz__item"><summary>What does an emergency fund have to do with staying invested?</summary><p>Cash reserves mean a job loss or surprise bill never forces you to sell investments at the bottom — the emergency fund is what buys your portfolio time.</p></details>
            </section>
```

Replace `[EXTRACT …]` per the Extraction rule.

- [ ] **Step 3: `npm run build:index`, then `npm test`** — Expected: all green (all five `guide page:` tests active).

- [ ] **Step 4: Commit**

```bash
git add moneyhub/investing/staying-invested.html test/investing-guides.test.mjs resources/data/search-index.json
git commit -m "Rebuild Staying Invested guide with crash reuse and best-days widget"
```

---

### Task 9: Final verification, manual QA, merge

- [ ] **Step 1: Full suite + integrity checks**

Run: `npm test` → Expected: ALL green (77 prior + 4 invest-widget + 6 guide-harness tests).
Run: `node scripts/migrate-pages.mjs` → Expected: `hub:1` only (the known gojo/research redirect stub).
Run: `grep -L 'lesson-tldr' moneyhub/investing/*.html` → Expected: only `index.html`.
Run: `grep -c '2024' moneyhub/investing/account-types.html moneyhub/investing/automating-contributions.html` → Expected: `0` for both (no stale limits).

- [ ] **Step 2: Manual QA in a browser** (`python3 -m http.server 8000`)

- [ ] All six new widgets respond to click; `crash` renders on staying-invested alongside `best-days` (both modules loaded, no console errors).
- [ ] Collapsibles open/close; folded tables render correctly inside them.
- [ ] Light + dark mode; mobile ~375px; keyboard Tab/Enter on all widget buttons; JS-off fallbacks readable.
- [ ] Prev/next walk the chain 1→5 and back out to the hub at both ends.

- [ ] **Step 3: Merge and push**

```bash
git checkout main && git pull
git merge investing-redesign
npm run build:index && git add resources/data/search-index.json && git commit -m "chore: rebuild search index" || true   # only if merge changed content alongside remote commits
npm test
git push
git branch -d investing-redesign
```

---

## Self-Review (completed at plan time)

- **Spec coverage:** tag (T1), `.lesson-details` (T1), widget module + shared-ui refactor (T2), coexistence rule (T2 MOUNTS + T8 dual scripts), harness with 500-word visible cap + chain checks (T3), hub reorder (T3), five rebuilt pages with visible/collapsed mapping exactly as spec §4 (T4–T8), 2026 IRS figures with exact values and source (Global Constraints; T5, T7 edits), crash reuse (T8), no-quote meta descriptions (all DESC slots verified quote-free), merge + QA (T9). Spec §9 "plan lists any cuts explicitly": the ONLY dropped sections are brokerage-basics §2 (bank-vs-brokerage — rewritten into visible prose) and §6 (site-navigation meta-commentary, obsolete), starter-portfolios §1/§10 (rewritten into visible prose), automating §1–2/§9/§11–12 (rewritten into visible prose), staying-invested §1–2/§6/§10–12 (rewritten into visible prose), account-types §1/§5–6/§9 (rewritten into visible prose or superseded by 2026 collapsible + stepper widget). All tables/comparisons/checklists survive via EXTRACT blocks.
- **Placeholder scan:** the `[EXTRACT …]` blocks are deliberate, precisely-specified references to content at an immutable git tag (Extraction rule defines the exact mechanics and allowed transforms) — not placeholders. No TBDs otherwise.
- **Type consistency:** `donutSegments` returns `{frac, offset}` — matches Task 2's test; widget names in MOUNTS match every `data-widget` in Tasks 4–8 and the harness's `invest-widgets.mjs` script check; `widget-ui.mjs` export list matches both importers; REBUILT/ORDER slugs match §Page order and all §SHELL-G slot values; prev/next chain matches the spec's pinned endpoints.
