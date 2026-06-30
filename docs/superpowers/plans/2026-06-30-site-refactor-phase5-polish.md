# Site Refactor — Phase 5: Polish & Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pay down the deferred polish from Phases 1–4 — remove dead CSS, consolidate the duplicated `esc` helper, add keyboard navigation + a11y to the ⌘K search palette, fix the small CSS/determinism nits, and rewrite the stale design-system doc.

**Architecture:** Pure code cleanup + one UX enhancement (search keyboard nav) on the existing vanilla static site. No new dependencies, no behavioral changes to content. Dark-mode/visual fixes are handled separately (the owner is sending specific screenshots) and are NOT in this plan. Logic-bearing changes are unit-tested with `node:test`; CSS/markup changes are verified by serving + grep (visual confirmation is the owner's).

**Tech Stack:** HTML5, vanilla CSS (modular tokens + components), vanilla JS ES modules, Node.js ≥ 20 (`node:test`).

## Global Constraints

- **No build tools / no runtime deps.** Tests use only Node built-ins.
- **No appearance change from cleanup.** Removing dead CSS must not alter any page — the removed component files style classes that NO live page uses (only the Phase-2 test fixture `test/fixtures/full-article.html` contains them, and it never loads CSS). Verify before deleting.
- **Tokens, not literals.** New CSS values use existing design tokens where one exists; add a token rather than hardcode.
- **Search index stays fresh + deterministic.** Any change to the index builder's sort must be followed by `npm run build:index` + commit so the freshness guard (Phase 4) stays green.
- **Dark mode is out of scope here** — handled in a separate visual pass from the owner's screenshots.
- **Dev:** `npm test` runs the suite; `python3 -m http.server 8000` to serve.

---

## File Structure (Phase 5)

```
resources/css/components/{navigation,sidebar-nav,step-progress,hero,card,footer}.css  DELETE (dead)
resources/css/style.css            MODIFY  drop the 6 dead @imports
resources/css/components/listing.css  MODIFY  remove dead .filter-chip* rules
resources/js/esc.mjs               CREATE  shared escape helper
resources/js/{chrome,article,listing,search,feed}.mjs  MODIFY  import esc from ./esc.mjs
scripts/lib/{render-article,page-head}.mjs             MODIFY  import esc from ../../resources/js/esc.mjs
test/esc.test.mjs                  CREATE
resources/js/search.mjs            MODIFY  keyboard nav + a11y + empty state (+ pure nextActive helper)
resources/css/components/command-palette.css  MODIFY  active-item + empty styles; z-index token
resources/css/components/chrome.css           MODIFY  z-index → token
resources/css/components/callout.css          MODIFY  .callout > p flat-callout rule
resources/css/tokens.css           MODIFY  add --z-overlay token
about/index.html                   MODIFY  rel="noopener noreferrer"
scripts/build-index.mjs            MODIFY  locale-independent sort; rebuild index
resources/data/search-index.json   MODIFY  rebuilt if order changes
test/search-nav.test.mjs           CREATE
DESIGN-SYSTEM.md                   REWRITE to the new system
```

---

### Task 1: Remove dead CSS

**Files:**
- Delete: `resources/css/components/navigation.css`, `sidebar-nav.css`, `step-progress.css`, `hero.css`, `card.css`, `footer.css`
- Modify: `resources/css/style.css` (drop those 6 `@import` lines)
- Modify: `resources/css/components/listing.css` (remove the dead `.filter-chip*` rules)

**Confirmed dead (verified):** no live page uses `.nav-global`/`.nav-mobile`, `.sidebar-nav`/`.page-layout`, `.step-progress`, `.hero`, `.card`, or `.footer` — the only references are in `test/fixtures/full-article.html` (a parser test fixture that doesn't load CSS). `.btn` (button.css) and `.callout` (callout.css) ARE still used — keep those.

- [ ] **Step 1: Re-confirm each is unused, then delete**

For each candidate, confirm zero live-page usage (the test fixture is the only allowed hit):
```bash
for c in 'nav-global' 'class="sidebar-nav"' 'step-progress' 'class="hero"' 'class="card"' 'class="footer"'; do
  echo "$c: $(grep -rl "$c" --include=*.html . | grep -v '.superpowers' | grep -v 'test/fixtures' | wc -l | tr -d ' ') live pages"
done
```
Expected: every line shows `0 live pages`. If any shows ≥1, STOP and report which page (it would be an un-migrated page — do not delete that component).
Then: `git rm resources/css/components/navigation.css resources/css/components/sidebar-nav.css resources/css/components/step-progress.css resources/css/components/hero.css resources/css/components/card.css resources/css/components/footer.css`

- [ ] **Step 2: Drop the 6 @imports from style.css**

In `resources/css/style.css`, delete exactly these six lines:
```css
@import url('components/navigation.css');
@import url('components/sidebar-nav.css');
@import url('components/card.css');
@import url('components/hero.css');
@import url('components/step-progress.css');
@import url('components/footer.css');
```
(Keep `button.css`, `callout.css`, `feed.css`, `chrome.css`, `command-palette.css`, `article.css`, `listing.css`, `hub.css`, and the tokens/reset/base/utilities imports.)

- [ ] **Step 3: Remove the dead .filter-chip rules from listing.css**

In `resources/css/components/listing.css`, delete the `.filter-bar__field`? — NO: keep `.filter-bar` (the Market Takes search bar still uses it). Remove ONLY the chip rules: `.filter-chips`, `.filter-chip`, `.filter-chip[aria-pressed="true"]`, `.filter-chip__count`, and `.filter-chip[aria-pressed="true"] .filter-chip__count`. (The chips were removed from Market Takes; `.filter-bar`/`.filter-bar__field`/`.filter-bar__count` are still used — keep them.)
Verify: `grep -c "filter-chip" resources/css/components/listing.css` → `0`; `grep -c "filter-bar" resources/css/components/listing.css` → ≥ `3`.

- [ ] **Step 4: Verify nothing broke**

Run: `grep -c "@import" resources/css/style.css` → should be 12 (was 18, minus 6).
Run: serve (`python3 -m http.server 8000 >/tmp/h.log 2>&1 & sleep 1`), then confirm key pages still 200 and reference only live components:
`for p in "" "gojo/stocks/" "gojo/stocks/spy-market-review-2026-06-28.html" "moneyhub/" "about/"; do echo "$p $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/$p)"; done` → all 200. `pkill -f http.server`.
Run: `npm test` → all green (unchanged count). Note: the deleted CSS styled only unused classes, so no page's appearance can change — controller does a visual spot-check.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove dead CSS components (navigation/sidebar-nav/step-progress/hero/card/footer + dead filter-chip rules)"
```

---

### Task 2: Consolidate the `esc` helper

**Files:**
- Create: `resources/js/esc.mjs`
- Create: `test/esc.test.mjs`
- Modify: `resources/js/chrome.mjs`, `resources/js/article.mjs`, `resources/js/listing.mjs`, `resources/js/search.mjs`, `resources/js/feed.mjs` (import esc)
- Modify: `scripts/lib/render-article.mjs`, `scripts/lib/page-head.mjs` (import esc)

**Interfaces:**
- Produces: `esc(s) => string` — escapes `&`, `<`, `>`, `"` (the canonical helper all modules already use, with `String(s ?? '')` coercion).

- [ ] **Step 1: Write the failing test**

`test/esc.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc } from '../resources/js/esc.mjs';

test('escapes &, <, >, "', () => {
  assert.equal(esc('<b>A & "B" > C</b>'), '&lt;b&gt;A &amp; &quot;B&quot; &gt; C&lt;/b&gt;');
});
test('coerces null/undefined/number to safe strings', () => {
  assert.equal(esc(null), '');
  assert.equal(esc(undefined), '');
  assert.equal(esc(42), '42');
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/esc.test.mjs`
Expected: FAIL — `esc.mjs` missing.

- [ ] **Step 3: Create `resources/js/esc.mjs`**

```js
export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
```

- [ ] **Step 4: Replace the inline `esc` in each module with an import**

In each of these BROWSER modules, delete its local `const esc = …` line and add `import { esc } from './esc.mjs';` at the top (with the other imports):
- `resources/js/chrome.mjs`
- `resources/js/article.mjs`
- `resources/js/listing.mjs`
- `resources/js/search.mjs`
- `resources/js/feed.mjs`

In each of these NODE scripts, delete its local `const esc = …` and add `import { esc } from '../../resources/js/esc.mjs';` at the top:
- `scripts/lib/render-article.mjs`
- `scripts/lib/page-head.mjs`

(The behavior is identical — every site already used this exact escape set; this is pure de-duplication.)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: all green (unchanged count + the 2 new esc tests). The render/search/feed/article/chrome tests still pass because the escaping behavior is unchanged.

- [ ] **Step 6: Commit**

```bash
git add resources/js/esc.mjs test/esc.test.mjs resources/js/chrome.mjs resources/js/article.mjs resources/js/listing.mjs resources/js/search.mjs resources/js/feed.mjs scripts/lib/render-article.mjs scripts/lib/page-head.mjs
git commit -m "refactor: consolidate the 7 duplicated esc helpers into resources/js/esc.mjs"
```

---

### Task 3: Search palette — keyboard nav + a11y + empty state

**Files:**
- Modify: `resources/js/search.mjs` (browser portion)
- Create: `test/search-nav.test.mjs`
- Modify: `resources/css/components/command-palette.css` (active-item + empty styles)

**Interfaces:**
- Produces (pure, testable): `nextActive(count, current, delta) => number` — moves the highlighted index within `[0, count-1]` with wraparound; returns `-1` when `count === 0`.
- Behavior (browser): ↑/↓ move the active result, Enter navigates to it, the active `<a>` gets `.cmdk__active aria-selected="true"` and scrolls into view; empty query → no results shown; non-empty query with 0 matches → a "No results" row; on open the input is focused and the trigger remembered; on close focus returns to the trigger; the panel has `aria-modal="true"`.

- [ ] **Step 1: Write the failing test**

`test/search-nav.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextActive } from '../resources/js/search.mjs';

test('nextActive moves and wraps within bounds', () => {
  assert.equal(nextActive(3, 0, 1), 1);
  assert.equal(nextActive(3, 2, 1), 0);   // wrap forward
  assert.equal(nextActive(3, 0, -1), 2);  // wrap backward
  assert.equal(nextActive(3, -1, 1), 0);  // from none → first
});
test('nextActive returns -1 when there are no results', () => {
  assert.equal(nextActive(0, -1, 1), -1);
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/search-nav.test.mjs`
Expected: FAIL — `nextActive` not exported.

- [ ] **Step 3: Replace the browser portion of `search.mjs`**

Keep the top-of-file imports (including `import { esc } from './esc.mjs';` added in Task 2) and `rankResults`/`scorePost` unchanged. Replace everything from `let searchInitialized = false;` through the end of the file (the browser-palette section + the auto-init block) with the code below — which adds the `nextActive` export and uses the already-imported `esc` (do NOT re-declare `esc`):
```js
export function nextActive(count, current, delta) {
  if (count <= 0) return -1;
  return ((current + delta) % count + count) % count;
}

let searchInitialized = false;

export async function initSearch(doc = document) {
  if (searchInitialized) return;
  searchInitialized = true;
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { /* offline: search disabled */ }

  const overlay = doc.createElement('div');
  overlay.className = 'cmdk';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="cmdk__panel" role="dialog" aria-modal="true" aria-label="Search">
      <input class="cmdk__input" type="text" placeholder="Search takes, tickers, guides — e.g. SPY, emergency fund" aria-label="Search query">
      <ul class="cmdk__results" role="listbox"></ul>
    </div>`;
  doc.body.appendChild(overlay);
  const input = overlay.querySelector('.cmdk__input');
  const results = overlay.querySelector('.cmdk__results');

  let rows = [];
  let active = -1;
  let trigger = null;

  const paint = () => {
    [...results.children].forEach((li, i) => {
      const a = li.firstElementChild;
      const on = i === active;
      a.classList.toggle('cmdk__active', on);
      a.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) a.scrollIntoView({ block: 'nearest' });
    });
  };

  const render = () => {
    const q = input.value.trim();
    rows = rankResults(index, input.value);
    active = rows.length ? 0 : -1;
    if (!q) { results.innerHTML = ''; return; }
    if (!rows.length) { results.innerHTML = '<li class="cmdk__empty">No results.</li>'; return; }
    results.innerHTML = rows.map(p => `
      <li><a href="${esc(p.url)}" role="option">
        ${p.ticker ? `<span class="cmdk__tag">${esc(p.ticker)}</span>` : `<span class="cmdk__tag cmdk__tag--sec">${esc(p.section)}</span>`}
        <span class="cmdk__title">${esc(p.title)}</span>
        <span class="cmdk__date">${esc(p.date || '')}</span>
      </a></li>`).join('');
    paint();
  };

  const open = () => { trigger = doc.activeElement; overlay.hidden = false; input.value = ''; rows = []; active = -1; results.innerHTML = ''; input.focus(); };
  const close = () => { overlay.hidden = true; input.value = ''; results.innerHTML = ''; if (trigger && trigger.focus) trigger.focus(); };

  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = nextActive(rows.length, active, 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = nextActive(rows.length, active, -1); paint(); }
    else if (e.key === 'Enter' && active >= 0 && rows[active]) { e.preventDefault(); window.location.href = rows[active].url; }
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  doc.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.hidden ? open() : close(); }
    if (e.key === 'Escape' && !overlay.hidden) close();
  });
  doc.addEventListener('click', e => { if (e.target.closest('[data-search-trigger]')) open(); });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initSearch());
  else initSearch();
}
```

- [ ] **Step 4: Add active-item + empty styles**

In `resources/css/components/command-palette.css`, add:
```css
.cmdk__results a.cmdk__active { background: var(--color-bg-tertiary); }
.cmdk__empty { padding: var(--space-4); color: var(--color-text-tertiary); font-size: var(--text-sm); list-style: none; }
```

- [ ] **Step 5: Run + serve check**

Run: `node --test test/search-nav.test.mjs` → PASS; `npm test` → all green.
Serve, then `curl -s http://localhost:8000/ | grep -c 'search.mjs'` → 1 (home still loads search). The keyboard behavior + focus are JS-runtime — controller confirms in a browser.

- [ ] **Step 6: Commit**

```bash
git add resources/js/search.mjs test/search-nav.test.mjs resources/css/components/command-palette.css
git commit -m "feat: search palette keyboard nav, empty state, aria-modal + focus restore"
```

---

### Task 4: Small CSS + determinism fixes

**Files:**
- Modify: `resources/css/components/callout.css` (flat-callout `.callout > p`)
- Modify: `resources/css/tokens.css` (add `--z-overlay`)
- Modify: `resources/css/components/command-palette.css` + `resources/css/components/chrome.css` (z-index → tokens)
- Modify: `about/index.html` (`rel="noopener noreferrer"`)
- Modify: `scripts/build-index.mjs` (locale-independent sort) + `resources/data/search-index.json` (rebuild)

- [ ] **Step 1: Flat-callout paragraph rule**

The new callouts use `<aside class="callout callout--X"><span class="callout__icon">…</span><p>…</p></aside>` (no `.callout__content` wrapper), so the `<p>` currently inherits base.css's `p { margin-bottom: … }`. Add to `resources/css/components/callout.css`:
```css
.callout > p { margin: 0; color: var(--color-text-secondary); line-height: var(--leading-relaxed); }
```

- [ ] **Step 2: z-index tokens**

In `resources/css/tokens.css`, add to the Z-INDEX SCALE block: `  --z-overlay: 100;`
In `resources/css/components/command-palette.css`, change `.cmdk { … z-index: 100; … }` → `z-index: var(--z-overlay);`
In `resources/css/components/chrome.css`, change `.chrome-header { … z-index: 50; … }` → `z-index: var(--z-popover);` (`--z-popover` is 50 — same value).
Verify: `grep -c "z-index: 100\|z-index: 50" resources/css/components/command-palette.css resources/css/components/chrome.css` → `0`.

- [ ] **Step 3: About external links → noreferrer**

In `about/index.html`, change every `rel="noopener"` to `rel="noopener noreferrer"`.
Verify: `grep -c 'rel="noopener"' about/index.html` → `0`; `grep -c 'rel="noopener noreferrer"' about/index.html` → ≥ `3`.

- [ ] **Step 4: Locale-independent index sort**

In `scripts/build-index.mjs`, replace the sort line inside `buildIndex` with a code-point comparison (locale/ICU-independent, identical on every runner):
```js
  const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
  posts.sort((a, b) => cmp(b.date || '', a.date || '') || cmp(a.url, b.url));
```
Then rebuild + check whether the order changed:
Run: `npm run build:index`
Run: `git diff --stat resources/data/search-index.json` (may or may not show a change — for the current all-ASCII data the order is likely identical, but commit whatever it produces so the freshness guard stays green).

- [ ] **Step 5: Run the suite**

Run: `npm test` → all green (the build-index tie test uses `<`, now matching the build; the freshness guard matches the rebuilt index).

- [ ] **Step 6: Commit**

```bash
git add resources/css/components/callout.css resources/css/tokens.css resources/css/components/command-palette.css resources/css/components/chrome.css about/index.html scripts/build-index.mjs resources/data/search-index.json
git commit -m "fix: flat-callout margin, z-index tokens, noreferrer, locale-independent index sort"
```

---

### Task 5: Rewrite DESIGN-SYSTEM.md

**Files:**
- Modify (rewrite): `DESIGN-SYSTEM.md`

**Context:** the current doc is "Money Hub Design System v1.0 (February 2026)" describing the pre-refactor system. Rewrite it to document the NEW system as built across Phases 1–4. Read the live `resources/css/tokens.css` and the spec (`docs/superpowers/specs/2026-06-29-site-refactor-design.md`) for exact values.

- [ ] **Step 1: Rewrite the document**

Replace `DESIGN-SYSTEM.md` with a v2 doc covering, accurately (pull exact token values from `resources/css/tokens.css`):
- **Header:** "Tui Alailima — Site Design System", Version 2.0, the refactor date, one-line philosophy ("publishing engine with a sharp front door").
- **Typography:** Instrument Serif (display/headings), Source Serif 4 (body/prose), IBM Plex Mono (labels/meta/data) — with the `--font-*` token names. Note Instrument Serif is weight 400 only.
- **Color:** accent red `#dc2626`; amber ticker tokens (`--color-ticker-text`/`--color-ticker-bg`); the neutral/semantic scales; dark mode via `[data-theme="dark"]`.
- **Architecture:** vanilla static, no build tools; JS-injected shared chrome (`chrome.mjs` from `site-config.mjs`); listings/search/counts rendered client-side from `search-index.json`; the index auto-rebuilds via the GitHub Action on push.
- **Components (live):** chrome (header/nav/footer), command-palette (⌘K search), feed (home latest), article (reading page: kicker/byline/callout/rail), listing (post cards + Market Takes filter), hub (card grid + numbered steps), callout, button.
- **Page templates:** home, article, listing (Market Takes/Journal), hub (Wealth/Health/Gojo overview), About.
- **Build/publish:** `npm run build:index`, the freshness guard test, the reindex Action.
- **Removed in the refactor:** the old sidebar-nav/navigation/hero/card/step-progress/footer components and the two TYR photos.

(Write real content — no `[TBD]`/placeholder sections.)

- [ ] **Step 2: Verify**

Run: `grep -c "Money Hub Design System\|Version: 1.0" DESIGN-SYSTEM.md` → `0` (old header gone). `grep -c "Instrument Serif\|Source Serif 4\|IBM Plex Mono\|chrome.mjs\|search-index" DESIGN-SYSTEM.md` → ≥ `5`. `npm test` → unchanged green.

- [ ] **Step 3: Commit**

```bash
git add DESIGN-SYSTEM.md
git commit -m "docs: rewrite DESIGN-SYSTEM.md for the new (v2) system"
```

---

### Task 6: Verification

**Files:** none (verification + any fix surfaced).

- [ ] **Step 1: Whole-branch verification**

Run: `npm test` → all green; record the total count.
Run: `npm run build:index && git diff --quiet resources/data/search-index.json && echo "INDEX CLEAN"` → `INDEX CLEAN`.
Run: confirm dead CSS is gone — `ls resources/css/components/ | grep -E "navigation|sidebar-nav|step-progress|hero|card|footer"` → no output; `grep -rc "const esc = s =>" resources/js scripts | grep -v ':0' | grep -v 'esc.mjs'` → no output (no module still defines its own esc).
Run: serve, then confirm representative pages 200 and no dead-component classes leaked: `for p in "" "gojo/stocks/" "gojo/notes/" "moneyhub/" "healthhub/" "about/" "gojo/stocks/spy-market-review-2026-06-28.html"; do echo "$p $(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/$p)"; done` → all 200. `pkill -f http.server`.

- [ ] **Step 2: Commit (only if a fix was needed)**

```bash
git add -A
git commit -m "fix: Phase 5 verification adjustments"
```

---

## Self-Review

**Spec coverage (Phase 5 scope):** Dead-CSS removal — Task 1 ✓. esc consolidation — Task 2 ✓. Search keyboard nav + a11y + empty state — Task 3 ✓. Design-system doc rewrite — Task 5 ✓. Small nits (flat-callout, z-index tokens, noreferrer, determinism) — Task 4 ✓. **Dark mode is explicitly out of scope** (owner-driven visual pass) — noted in Architecture/Constraints. The remaining `data-count` keys (journal/wealth/health) have no UI that needs them and are intentionally left unwired (computeCounts already supports them) — not a task.

**Placeholder scan:** none — every step has concrete code/commands and expected output; Task 5 explicitly forbids placeholder sections.

**Type consistency:** `esc` (Task 2) is imported by the 7 modules that previously defined it; Task 3's revised `search.mjs` uses that imported `esc` (does not re-declare it). `nextActive(count, current, delta)` (Task 3) matches its test. The `--z-overlay` token (Task 4) is referenced in command-palette.css; `--z-popover` already exists in tokens.css. `buildIndex`'s sort change (Task 4) keeps the same output shape the freshness guard + build-index tests assert.

---

## Notes / follow-ups
- **Dark mode (separate):** the owner is sending screenshots of specific discrepancies; fix those targeted, then re-verify both themes across the page types (home, article, listing, hub, About, ⌘K palette).
- Flesh out the 7 stub content pages (analysis/portfolio/trading-journal; metrics/nutrition/recovery/training) with real writing when ready.
- Consider a shared `filters.mjs` if listing/counts/market-takes filter logic grows (currently small, left as-is).
