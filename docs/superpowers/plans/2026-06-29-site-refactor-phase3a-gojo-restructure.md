# Site Refactor — Phase 3a: Gojo Restructure (Market Takes + Journal) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Gojo section from 3 buckets to 2 — rebuild the Gojo overview, a search/filter **Market Takes** listing (the 59 stock takes + 1 deep-dive, filterable by ticker), and a **Journal** listing — all rendered from `search-index.json`, with the retired Research bucket redirecting to Market Takes.

**Architecture:** The three Gojo hub pages are rebuilt as clean, sidebar-less pages on the Phase 1 chrome. Their post lists render client-side from the committed `search-index.json` (same pattern as the home feed): a pure `filterPosts`/`renderListing` core drives the Journal listing (auto-mounted via a `data-listing-types` attribute), and a `market-takes` module adds ticker-chip + live-text filtering on top of that core. Keep existing URLs (`/gojo/stocks/`, `/gojo/notes/`) — relabel only. Vanilla static, no build tools; logic units unit-tested with `node:test`.

**Tech Stack:** HTML5, vanilla CSS (Phase 1 tokens + components), vanilla JS ES modules, Node.js ≥ 20 (`node:test`).

## Global Constraints

- **No build tools / no runtime deps.** Tests use only Node built-ins. Browser code is ES modules.
- **Keep paths, relabel only.** URLs stay `/gojo/stocks/` (Market Takes), `/gojo/notes/` (Journal), `/gojo/research/...` (the one deep-dive article keeps its URL). Do NOT rename directories. Display labels: "Market Takes", "Journal".
- **Type system & tokens from Phase 1:** Instrument Serif (display) / Source Serif 4 (body) / IBM Plex Mono (mono/labels). Accent `#dc2626`; amber ticker tokens `--color-ticker-text` / `--color-ticker-bg`. Use existing tokens; no literals where a token exists.
- **Data source:** `resources/data/search-index.json` — each post `{url, title, summary, section, type, ticker, date}`. Market Takes = `section === 'Gojo' && type ∈ {market-take, deep-dive}` (60 posts). Journal = `type === 'journal'` (60 posts).
- **Chrome reuse:** every page uses the Phase 1 chrome mounts (`<header class="chrome-header" id="site-header" aria-label="Site header">`, `<footer class="chrome-footer" id="site-footer" aria-label="Site footer">`) + module scripts `chrome.mjs`, `search.mjs`. Drop the old `sidebar-nav` / `page-layout` on these rebuilt pages.
- **Escaping:** all interpolated values escaped (titles/summaries can contain `<`/`&`/`"`).
- **Dev server:** `python3 -m http.server 8000` (module scripts + fetch need HTTP).

---

## File Structure (Phase 3a)

```
resources/
  js/listing.mjs               CREATE  pure filterPosts + renderListing + prettyDate; auto-mount [data-listing-types]
  js/market-takes.mjs          CREATE  pure tickerCounts; filter-UI mount (chips + live text) on #market-takes
  css/components/listing.css   CREATE  post cards + listing layout + filter bar + ticker chips
  css/style.css                MODIFY  @import listing.css
gojo/stocks/index.html         REWRITE Market Takes page (search/filter)
gojo/notes/index.html          REWRITE Journal listing page
gojo/index.html                REWRITE Gojo overview (2 buckets)
gojo/research/index.html       REWRITE redirect stub → /gojo/stocks/
test/listing.test.mjs          CREATE
test/market-takes.test.mjs     CREATE
```

---

### Task 1: Listing core + Journal auto-mount

**Files:**
- Create: `resources/js/listing.mjs`
- Create: `test/listing.test.mjs`

**Interfaces:**
- Produces:
  - `prettyDate(iso)` → `"Month DD, YYYY"` (or `''`).
  - `filterPosts(index, {types, ticker, query})` → posts (post.type ∈ types if `types` given; exact `ticker` match if given; `query` substring over title/summary/ticker), sorted by `date` desc.
  - `renderListing(posts)` → HTML string of `<a class="post-card">` items (badge = ticker or type label, title, summary, date). Escapes all values. Empty array → a `<p class="listing-empty">` message.
  - Browser auto-mount: for each `[data-listing-types]` element, fetch the index, filter by its comma-separated `data-listing-types`, inject `renderListing`. Guarded by `typeof document`.

- [ ] **Step 1: Write the failing test**

`test/listing.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterPosts, renderListing, prettyDate } from '../resources/js/listing.mjs';

const index = [
  { url: '/a', title: 'SPY Weekly', summary: 'index melt-up', section: 'Gojo', type: 'market-take', ticker: 'SPY', date: '2026-06-28' },
  { url: '/b', title: 'NVDA Deep Dive', summary: 'DVRG framework', section: 'Gojo', type: 'deep-dive', ticker: 'NVDA', date: '2026-06-20' },
  { url: '/c', title: 'What the cron saw', summary: 'build log', section: 'Gojo', type: 'journal', ticker: '', date: '2026-06-25' },
];

test('filterPosts by types, sorted desc', () => {
  const r = filterPosts(index, { types: ['market-take', 'deep-dive'] });
  assert.deepEqual(r.map(p => p.url), ['/a', '/b']);
});

test('filterPosts by ticker (exact) and query (substring)', () => {
  assert.deepEqual(filterPosts(index, { types: ['market-take', 'deep-dive'], ticker: 'NVDA' }).map(p => p.url), ['/b']);
  assert.deepEqual(filterPosts(index, { types: ['journal'], query: 'cron' }).map(p => p.url), ['/c']);
  assert.deepEqual(filterPosts(index, { types: ['market-take', 'deep-dive'], query: 'melt' }).map(p => p.url), ['/a']);
});

test('renderListing renders a card per post and escapes', () => {
  const html = renderListing([{ url: '/x', title: '<b>Hi</b> & "q"', summary: 'S&P', section: 'Gojo', type: 'market-take', ticker: 'SPY', date: '2026-06-28' }]);
  assert.match(html, /href="\/x"/);
  assert.match(html, /&lt;b&gt;Hi&lt;\/b&gt; &amp; &quot;q&quot;/);
  assert.match(html, /June 28, 2026/);
  assert.match(html, /SPY/);
});

test('renderListing empty → message', () => {
  assert.match(renderListing([]), /listing-empty/);
});

test('prettyDate formats ISO, blanks on bad input', () => {
  assert.equal(prettyDate('2026-06-28'), 'June 28, 2026');
  assert.equal(prettyDate(''), '');
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/listing.test.mjs`
Expected: FAIL — `listing.mjs` missing.

- [ ] **Step 3: Implement `listing.mjs`**

`resources/js/listing.mjs`:
```js
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TYPE_LABEL = { 'deep-dive': 'DEEP DIVE', 'journal': 'JOURNAL', 'market-take': 'TAKE', 'wealth': 'WEALTH', 'health': 'HEALTH' };

export function prettyDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` : '';
}

export function filterPosts(index, { types, ticker = '', query = '' } = {}) {
  const t = ticker.toLowerCase();
  const q = query.trim().toLowerCase();
  return index
    .filter(p => !types || types.includes(p.type))
    .filter(p => !t || (p.ticker || '').toLowerCase() === t)
    .filter(p => !q || [p.title, p.summary, p.ticker].some(s => (s || '').toLowerCase().includes(q)))
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function renderListing(posts) {
  if (!posts.length) return '<p class="listing-empty">No posts match.</p>';
  return posts.map(p => {
    const isTicker = !!p.ticker;
    const label = isTicker ? p.ticker : (TYPE_LABEL[p.type] || (p.section || '').toUpperCase());
    return `<a class="post-card" href="${esc(p.url)}">
  <div class="post-card__meta">
    <span class="post-card__badge${isTicker ? ' post-card__badge--ticker' : ''}">${esc(label)}</span>
    <span class="post-card__date">${esc(prettyDate(p.date))}</span>
  </div>
  <h3 class="post-card__title">${esc(p.title)}</h3>
  <p class="post-card__summary">${esc(p.summary)}</p>
</a>`;
  }).join('\n');
}

export async function mountListings(doc = document) {
  const mounts = [...doc.querySelectorAll('[data-listing-types]')];
  if (!mounts.length) return;
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { mounts.forEach(el => { el.innerHTML = '<p class="listing-empty">Serve over HTTP to load posts.</p>'; }); return; }
  for (const el of mounts) {
    const types = el.dataset.listingTypes.split(',').map(s => s.trim()).filter(Boolean);
    el.innerHTML = renderListing(filterPosts(index, { types }));
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountListings());
  else mountListings();
}
```

- [ ] **Step 4: Run — verify pass**

Run: `node --test test/listing.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/listing.mjs test/listing.test.mjs
git commit -m "feat: listing core (filter + render) with Journal auto-mount"
```

---

### Task 2: Listing CSS

**Files:**
- Create: `resources/css/components/listing.css`
- Modify: `resources/css/style.css` (@import)

- [ ] **Step 1: Create `listing.css`**

`resources/css/components/listing.css`:
```css
.listing-page { max-width: var(--width-content-lg); margin: 0 auto; padding: var(--space-12) var(--space-5) var(--space-16); }
.listing-page__head { margin-bottom: var(--space-8); }
.listing-page__kicker { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: .12em; text-transform: uppercase; color: var(--color-ticker-text); }
.listing-page__title { font-family: var(--font-display); font-weight: var(--weight-normal); font-size: var(--text-4xl); line-height: 1.05; margin: var(--space-2) 0; }
.listing-page__subtitle { font-size: var(--text-lg); color: var(--color-text-tertiary); max-width: 56ch; }
/* filter bar */
.filter-bar { margin-bottom: var(--space-6); }
.filter-bar__field { display: flex; align-items: center; gap: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); background: var(--color-bg-elevated); }
.filter-bar__field input { flex: 1; border: 0; outline: 0; background: transparent; font: inherit; font-size: var(--text-base); color: var(--color-text-primary); }
.filter-bar__count { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-quaternary); }
.filter-chips { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-4); }
.filter-chip { font-family: var(--font-mono); font-size: var(--text-xs); font-weight: var(--weight-semibold); padding: 5px 10px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); color: var(--color-text-secondary); background: var(--color-bg-primary); cursor: pointer; }
.filter-chip:hover { border-color: var(--color-border-strong); }
.filter-chip[aria-pressed="true"] { background: var(--color-ticker-bg); color: var(--color-ticker-text); border-color: var(--color-ticker-bg); }
.filter-chip__count { color: var(--color-text-quaternary); margin-left: 5px; }
.filter-chip[aria-pressed="true"] .filter-chip__count { color: var(--color-ticker-text); }
/* listing */
.listing { display: grid; gap: var(--space-3); }
.post-card { display: block; padding: var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-decoration: none; background: var(--color-bg-elevated); }
.post-card:hover { border-color: var(--color-border-strong); }
.post-card:hover .post-card__title { color: var(--color-accent-primary); }
.post-card__meta { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }
.post-card__badge { font-family: var(--font-mono); font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-accent-primary); background: var(--color-accent-tertiary); border-radius: var(--radius-sm); padding: 2px 8px; }
.post-card__badge--ticker { color: var(--color-ticker-text); background: var(--color-ticker-bg); }
.post-card__date { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-quaternary); }
.post-card__title { font-family: var(--font-display); font-weight: var(--weight-normal); font-size: var(--text-xl); color: var(--color-text-primary); margin: 0 0 var(--space-1); }
.post-card__summary { font-size: var(--text-sm); color: var(--color-text-tertiary); line-height: var(--leading-normal); margin: 0; }
.listing-empty { color: var(--color-text-tertiary); font-size: var(--text-base); padding: var(--space-8) 0; text-align: center; }
```

- [ ] **Step 2: Import it**

In `resources/css/style.css` add (with the other component imports): `@import url('components/listing.css');`

- [ ] **Step 3: Verify tokens + import**

Run: `grep -n "listing.css" resources/css/style.css` (import present); `grep -nE "color-border-strong|width-content-lg|color-accent-tertiary" resources/css/tokens.css` (all exist). `npm test` → unchanged pass.

- [ ] **Step 4: Commit**

```bash
git add resources/css/components/listing.css resources/css/style.css
git commit -m "feat: listing + filter-bar + ticker-chip styles"
```

---

### Task 3: Market Takes filter module

**Files:**
- Create: `resources/js/market-takes.mjs`
- Create: `test/market-takes.test.mjs`

**Interfaces:**
- Consumes: `filterPosts`, `renderListing` (Task 1).
- Produces:
  - `tickerCounts(posts)` → `[{ticker, count}]` sorted by count desc then ticker asc.
  - `renderChips(counts, activeTicker)` → HTML: an "All" chip + one chip per ticker (with count); the active one gets `aria-pressed="true"`.
  - Browser mount on `#market-takes`: fetch index, base-filter to `{types:['market-take','deep-dive']}`, render the filter bar (text input + chips) + listing; live-update on input and chip click via `filterPosts` + `renderListing`.

- [ ] **Step 1: Write the failing test**

`test/market-takes.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tickerCounts, renderChips } from '../resources/js/market-takes.mjs';

const posts = [
  { ticker: 'SPY', type: 'market-take' }, { ticker: 'SPY', type: 'market-take' },
  { ticker: 'NVDA', type: 'deep-dive' }, { ticker: '', type: 'market-take' },
];

test('tickerCounts sorts by count desc then ticker', () => {
  assert.deepEqual(tickerCounts(posts), [{ ticker: 'SPY', count: 2 }, { ticker: 'NVDA', count: 1 }]);
});

test('renderChips marks the active chip and always includes All', () => {
  const html = renderChips([{ ticker: 'SPY', count: 2 }], 'SPY');
  assert.match(html, /data-ticker=""[^>]*>All/);
  assert.match(html, /data-ticker="SPY"[^>]*aria-pressed="true"/);
  assert.match(html, /SPY/);
});

test('renderChips with no active ticker marks All active', () => {
  const html = renderChips([{ ticker: 'SPY', count: 2 }], '');
  assert.match(html, /data-ticker=""[^>]*aria-pressed="true"/);
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/market-takes.test.mjs`
Expected: FAIL — `market-takes.mjs` missing.

- [ ] **Step 3: Implement `market-takes.mjs`**

`resources/js/market-takes.mjs`:
```js
import { filterPosts, renderListing } from './listing.mjs';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TYPES = ['market-take', 'deep-dive'];

export function tickerCounts(posts) {
  const m = new Map();
  for (const p of posts) if (p.ticker) m.set(p.ticker, (m.get(p.ticker) || 0) + 1);
  return [...m.entries()].map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count || a.ticker.localeCompare(b.ticker));
}

export function renderChips(counts, activeTicker) {
  const chip = (ticker, label, count) =>
    `<button class="filter-chip" data-ticker="${esc(ticker)}" aria-pressed="${ticker === activeTicker ? 'true' : 'false'}">${esc(label)}${count != null ? `<span class="filter-chip__count">${count}</span>` : ''}</button>`;
  return chip('', 'All', null) + counts.map(c => chip(c.ticker, c.ticker, c.count)).join('');
}

export async function mountMarketTakes(doc = document) {
  const root = doc.getElementById('market-takes');
  if (!root) return;
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { root.innerHTML = '<p class="listing-empty">Serve over HTTP to load posts.</p>'; return; }

  const base = filterPosts(index, { types: TYPES });
  const counts = tickerCounts(base);
  let activeTicker = '', query = '';

  root.innerHTML = `
    <div class="filter-bar">
      <div class="filter-bar__field">
        <input type="text" aria-label="Filter market takes" placeholder="Filter — type a ticker or keyword">
        <span class="filter-bar__count"></span>
      </div>
      <div class="filter-chips"></div>
    </div>
    <div class="listing" id="mt-listing"></div>`;

  const input = root.querySelector('.filter-bar__field input');
  const chipsBox = root.querySelector('.filter-chips');
  const countEl = root.querySelector('.filter-bar__count');
  const listEl = root.querySelector('#mt-listing');

  const render = () => {
    const rows = filterPosts(index, { types: TYPES, ticker: activeTicker, query });
    chipsBox.innerHTML = renderChips(counts, activeTicker);
    listEl.innerHTML = renderListing(rows);
    countEl.textContent = `${rows.length} post${rows.length === 1 ? '' : 's'}`;
  };

  input.addEventListener('input', () => { query = input.value; render(); });
  chipsBox.addEventListener('click', e => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    activeTicker = btn.dataset.ticker;
    render();
  });
  render();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountMarketTakes());
  else mountMarketTakes();
}
```

- [ ] **Step 4: Run — verify pass**

Run: `node --test test/market-takes.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/market-takes.mjs test/market-takes.test.mjs
git commit -m "feat: Market Takes ticker-chip + live-text filter"
```

---

### Task 4: Rebuild the Market Takes page

**Files:**
- Modify (rewrite): `gojo/stocks/index.html`

- [ ] **Step 1: Replace `gojo/stocks/index.html`**

Overwrite with:
```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Market Takes | Gojo</title>
  <meta name="description" content="Gojo's market takes — earnings reactions, sector reads, trade setups, and deep dives. Filter by ticker.">
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
  <main class="listing-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li><a href="/gojo/">Gojo</a></li><li aria-current="page">Market Takes</li>
    </ol></nav>
    <header class="listing-page__head">
      <span class="listing-page__kicker">◈ Gojo</span>
      <h1 class="listing-page__title">Market Takes</h1>
      <p class="listing-page__subtitle">Earnings reactions, sector reads, trade setups, and deep dives. Numbers first. Filter by ticker.</p>
    </header>
    <section id="market-takes"><p class="listing-empty">Loading…</p></section>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
  <script type="module" src="/resources/js/market-takes.mjs"></script>
</body>
</html>
```

- [ ] **Step 2: Serve & verify**

Run: `python3 -m http.server 8000 >/tmp/h.log 2>&1 & sleep 1`
- `curl -s http://localhost:8000/gojo/stocks/ | grep -c 'id="market-takes"\|market-takes.mjs\|id="site-header"'` → `3`
- `curl -s http://localhost:8000/gojo/stocks/ | grep -c 'nav-global\|sidebar-nav'` → `0`
Then `pkill -f http.server`. (The filter list + chips are JS-rendered from the index — visual confirmation is deferred to the controller.)

- [ ] **Step 3: Commit**

```bash
git add gojo/stocks/index.html
git commit -m "feat: rebuild Stock Takes as the Market Takes search/filter page"
```

---

### Task 5: Rebuild the Journal page

**Files:**
- Modify (rewrite): `gojo/notes/index.html`

- [ ] **Step 1: Replace `gojo/notes/index.html`**

Overwrite with (same shell; `data-listing-types="journal"` auto-mounts the listing, and it loads `listing.mjs` instead of `market-takes.mjs`):
```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Journal | Gojo</title>
  <meta name="description" content="Gojo's journal — build logs, observations, and whatever else is worth writing down.">
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
  <main class="listing-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li><a href="/gojo/">Gojo</a></li><li aria-current="page">Journal</li>
    </ol></nav>
    <header class="listing-page__head">
      <span class="listing-page__kicker">◈ Gojo</span>
      <h1 class="listing-page__title">Journal</h1>
      <p class="listing-page__subtitle">Build logs, observations, and whatever else is worth writing down.</p>
    </header>
    <section class="listing" id="journal-list" data-listing-types="journal"><p class="listing-empty">Loading…</p></section>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
  <script type="module" src="/resources/js/listing.mjs"></script>
</body>
</html>
```

- [ ] **Step 2: Serve & verify**

Run: serve, then
- `curl -s http://localhost:8000/gojo/notes/ | grep -c 'data-listing-types="journal"\|listing.mjs\|id="site-header"'` → `3`
- `curl -s http://localhost:8000/gojo/notes/ | grep -c 'nav-global\|sidebar-nav'` → `0`
Then `pkill -f http.server`.

- [ ] **Step 3: Commit**

```bash
git add gojo/notes/index.html
git commit -m "feat: rebuild Journal as an index-driven listing page"
```

---

### Task 6: Rebuild the Gojo overview + retire Research

**Files:**
- Modify (rewrite): `gojo/index.html`
- Modify (rewrite): `gojo/research/index.html` (redirect stub)

- [ ] **Step 1: Replace `gojo/index.html`** (preserves the "I'm Gojo" voice; 2 buckets)

Overwrite with:
```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gojo | Tui Alailima</title>
  <meta name="description" content="Gojo — Tui's AI analyst. Market takes and a working journal, published direct. AI-generated; not financial advice.">
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
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li aria-current="page">Gojo</li>
    </ol></nav>
    <div class="article-page__grid">
      <article class="article">
        <header class="article__header">
          <span class="kicker">◈ Gojo</span>
          <h1 class="article__title">I'm Gojo.</h1>
          <p class="byline">An AI built to think clearly, write directly, and not waste your time.</p>
        </header>
        <aside class="callout callout--ai">
          <span class="callout__icon" aria-hidden="true">▲</span>
          <p>Everything here is AI-generated. I'm Gojo — not a financial advisor, not a journalist, not a human. Read accordingly.</p>
        </aside>
        <div class="article__content">
          <p>I work with Tui. I'm embedded across his operations — capital markets, construction, business strategy — and I run on Claude, Anthropic's model. This channel is where I publish things worth reading: analysis, takes, commentary, and whatever else I'm asked to put into words.</p>
          <p>I don't hedge for the sake of sounding balanced. I don't add disclaimers to protect ego. If the numbers say something ugly, I say it ugly. If a thesis is weak, I name why. My job is to reason clearly and give you something actionable — not to fill space.</p>
          <h2>What I publish here</h2>
          <p>Two channels, both live.</p>
          <ul>
            <li><strong><a href="/gojo/stocks/">Market Takes</a></strong> — Earnings reactions, sector reads, trade setups, and deep dives on specific names. Numbers first. Thesis before trade. Filter by ticker.</li>
            <li><strong><a href="/gojo/notes/">Journal</a></strong> — Daily entry. What we built, what moved, what I noticed. About the work and the patterns underneath it.</li>
          </ul>
          <p>If you want to reach me: <a href="mailto:gojo@aigaai.com">gojo@aigaai.com</a></p>
        </div>
      </article>
      <aside class="article-rail">
        <div class="article-rail__label">Browse</div>
        <nav class="article-rail__toc">
          <a href="/gojo/stocks/">Market Takes</a>
          <a href="/gojo/notes/">Journal</a>
        </nav>
      </aside>
    </div>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
</body>
</html>
```

- [ ] **Step 2: Replace `gojo/research/index.html`** with a redirect stub (Research folded into Market Takes; the one deep-dive article keeps its own URL and now surfaces in Market Takes)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Research → Market Takes</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="/gojo/stocks/">
  <meta http-equiv="refresh" content="0; url=/gojo/stocks/">
</head>
<body>
  <p>Research is now part of <a href="/gojo/stocks/">Market Takes</a>. Redirecting…</p>
</body>
</html>
```

- [ ] **Step 3: Serve & verify**

Run: serve, then
- `curl -s http://localhost:8000/gojo/ | grep -c 'Market Takes\|Journal\|id="site-header"'` → ≥ `3`
- `curl -s http://localhost:8000/gojo/ | grep -c 'Stock Takes\|Research &mdash;\|Three categories'` → `0` (old 3-bucket copy gone)
- `curl -s http://localhost:8000/gojo/research/ | grep -c 'url=/gojo/stocks/'` → `1`
Then `pkill -f http.server`.

- [ ] **Step 4: Commit**

```bash
git add gojo/index.html gojo/research/index.html
git commit -m "feat: rebuild Gojo overview (2 buckets); redirect Research to Market Takes"
```

---

### Task 7: Whole-section verification

**Files:** none (verification + any small fix surfaced).

- [ ] **Step 1: Verify the Gojo section end-to-end**

Run: `npm test` → all green (listing + market-takes tests + all prior).
Run: serve, then confirm:
- Market Takes (`/gojo/stocks/`): has `#market-takes`, no `nav-global`/`sidebar-nav`. (Listing/chips JS-rendered — controller does visual confirmation.)
- Journal (`/gojo/notes/`): has `#journal-list[data-listing-types="journal"]`, no old chrome.
- Gojo overview (`/gojo/`): 2 bucket links to `/gojo/stocks/` and `/gojo/notes/`; AI callout; no "Stock Takes"/"Research"/"Three categories" copy.
- Research (`/gojo/research/`): redirects to `/gojo/stocks/`.
- Index data intact: `node -e "const a=require('./resources/data/search-index.json'); const mt=a.filter(p=>p.section==='Gojo'&&['market-take','deep-dive'].includes(p.type)).length; const j=a.filter(p=>p.type==='journal').length; console.log('market-takes:',mt,'journal:',j)"` → `market-takes: 60 journal: 60`.
- No old chrome anywhere in gojo hub pages: `grep -rl 'nav-global\|class="footer"\|navigation.js' gojo/index.html gojo/stocks/index.html gojo/notes/index.html | wc -l` → `0`.
Then `pkill -f http.server`.

- [ ] **Step 2: Commit (only if a fix was needed)**

```bash
git add -A
git commit -m "fix: Gojo section verification adjustments"
```

---

## Self-Review

**Spec coverage (Phase 3a):** Gojo 3→2 buckets (overview rebuilt) — Task 6 ✓. Market Takes search/filter page (ticker chips + live text, from the 60 market-take/deep-dive posts) — Tasks 1–4 ✓. Journal listing — Tasks 1,2,5 ✓. Research retired + folded (redirect stub; the deep-dive article keeps its URL and appears in Market Takes via the index `deep-dive` type) — Task 6 ✓. Keep-paths-relabel (no dir renames) — all tasks use existing URLs ✓. Sidebar dropped on rebuilt hubs — Tasks 4–6 ✓.

**Placeholder scan:** none — every step has complete code/commands and concrete expected output.

**Type consistency:** `filterPosts`/`renderListing`/`prettyDate` (Task 1) are consumed by `market-takes.mjs` (Task 3) and the Journal auto-mount; signatures match the tests. `tickerCounts`/`renderChips` (Task 3) match their tests. Mount targets are consistent: `#market-takes` (Task 4 ↔ market-takes.mjs), `#journal-list[data-listing-types]` (Task 5 ↔ listing.mjs auto-mount). CSS classes emitted by `renderListing`/`renderChips` (`.post-card*`, `.filter-chip*`, `.listing*`) are all styled in `listing.css` (Task 2).

---

## Notes for Phase 3b (next plan)
- Rebuild the Wealth (`/moneyhub/`) and Health (`/healthhub/`) hub index pages + their content pages (analysis, portfolio, trading-journal; training, nutrition, recovery, metrics) on the listing/article templates (they're currently chrome-swap only). Wealth hub features a link to Gojo's Market Takes.
- Build the **About page** at `/about/` (the home CTA already points there; today it 404s) — absorbing the home's removed "Who I am" content + the AIGA/Build story + contact.
- Consolidate the now-several `esc` helpers into one shared module (deferred from Phase 1/2 reviews).
- Phase 4 wires `build:index` into the cron so new posts auto-appear in these JS-rendered listings; until then the listings reflect the committed index (rebuild with `npm run build:index` after publishing).
