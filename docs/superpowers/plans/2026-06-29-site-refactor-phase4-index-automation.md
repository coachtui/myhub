# Site Refactor — Phase 4: Search-Index Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `search-index.json` rebuild automatically whenever content is published — so the home feed, Market Takes, Journal, search, and hub counts never go stale — via a deterministic index build, a freshness guard test, and a GitHub Action that re-indexes on every push.

**Architecture:** The site's listings/search are driven by `resources/data/search-index.json`, generated from article HTML by `scripts/build-index.mjs`. We refactor that script to export a pure, **deterministic** `buildIndex(root)` (sorted by date desc then URL asc, so it's identical across machines), add a `node:test` that fails if the committed index is stale, and add a GitHub Action that — on any push touching content — rebuilds the index, runs the suite, and commits the refreshed index back. The publish flow (cron jobs + the agent that posts on demand) all push to GitHub, so the Action covers every path with no changes to them. Vanilla static site, no build tools; tests use `node:test`.

**Tech Stack:** HTML5, vanilla CSS/JS ES modules, Node.js ≥ 20 (`node:test`), GitHub Actions (one workflow). GitHub Pages hosting (unchanged).

## Global Constraints

- **No build tools / no runtime deps.** Tests use only Node built-ins. The GitHub Action uses only `actions/checkout`, `actions/setup-node`, and `npm`/`git`.
- **Determinism:** `buildIndex` must produce byte-identical output for the same content regardless of filesystem read order — sort by `date` descending, then `url` ascending (url is unique → total order).
- **No workflow loops:** the Action triggers only on pushes to content paths (`gojo/**`, `moneyhub/**`, `healthhub/**`); its own commit changes only `resources/data/search-index.json` (not a content path), so it cannot re-trigger itself.
- **Index shape unchanged:** posts stay `{url, title, summary, section, type, ticker, date}`; serialization stays single-line `JSON.stringify(posts, null, 0) + '\n'` (so existing consumers and the committed file format are unaffected apart from ordering).
- **Repo prerequisite (manual, one-time):** GitHub repo Settings → Actions → General → Workflow permissions must be **Read and write** so the Action can push the refreshed index. Flagged in Task 3; the implementer cannot change repo settings — the human enables it.
- **Dev:** `npm test` runs the full suite (now incl. the freshness guard). `npm run build:index` regenerates the index.

---

## File Structure (Phase 4)

```
scripts/build-index.mjs          MODIFY  export deterministic buildIndex + serializeIndex + INDEX_PATH; CLI uses them
resources/data/search-index.json MODIFY  rebuilt (fresh + deterministic order) and committed
test/build-index.test.mjs        CREATE  deterministic-sort + tiebreak tests
test/index-fresh.test.mjs        CREATE  freshness guard (committed == fresh build)
.github/workflows/build-index.yml CREATE  reindex-on-push Action
resources/js/counts.mjs          CREATE  pure computeCounts + browser fill of [data-count]
moneyhub/index.html              MODIFY  Wealth hub: data-count on the Market Takes + Investing card metas; load counts.mjs
test/counts.test.mjs             CREATE  computeCounts tests
```

---

### Task 1: Deterministic index builder + rebuild the stale index

**Files:**
- Modify: `scripts/build-index.mjs`
- Modify: `resources/data/search-index.json` (regenerated)
- Create: `test/build-index.test.mjs`

**Interfaces:**
- Produces:
  - `buildIndex(root: string) => post[]` — walks the content dirs under `root`, extracts each post, returns them sorted by `date` desc then `url` asc. Pure (reads the filesystem, no writes).
  - `serializeIndex(posts) => string` — the exact JSON string written to disk (`JSON.stringify(posts, null, 0) + '\n'`).
  - `INDEX_PATH = 'resources/data/search-index.json'` (repo-relative).

- [ ] **Step 1: Write the failing test**

`test/build-index.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { buildIndex, serializeIndex, INDEX_PATH } from '../scripts/build-index.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('buildIndex returns the shaped, sorted post list', () => {
  const posts = buildIndex(ROOT);
  assert.ok(posts.length > 100, `expected >100 posts, got ${posts.length}`);
  assert.deepEqual(Object.keys(posts[0]).sort(), ['date', 'section', 'summary', 'ticker', 'title', 'type', 'url']);
});

test('sorted by date desc, then url asc within a date (deterministic)', () => {
  const posts = buildIndex(ROOT);
  for (let i = 1; i < posts.length; i++) {
    const a = posts[i - 1], b = posts[i];
    if ((a.date || '') === (b.date || '')) {
      assert.ok(a.url < b.url, `tie not url-ordered: ${a.url} before ${b.url}`);
    } else {
      assert.ok((a.date || '') > (b.date || '') || (a.date && !b.date), `date order broken: ${a.date} before ${b.date}`);
    }
  }
});

test('serializeIndex is single-line JSON with trailing newline', () => {
  const s = serializeIndex([{ url: '/a', title: 't', summary: 's', section: 'Gojo', type: 'journal', ticker: '', date: '2026-01-01' }]);
  assert.ok(s.endsWith('\n'));
  assert.equal(s.indexOf('\n'), s.length - 1, 'should be exactly one line + trailing newline');
});

test('INDEX_PATH points at the committed index', () => {
  assert.equal(INDEX_PATH, 'resources/data/search-index.json');
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/build-index.test.mjs`
Expected: FAIL — `buildIndex`/`serializeIndex`/`INDEX_PATH` are not exported yet.

- [ ] **Step 3: Refactor `scripts/build-index.mjs`**

Replace the file with:
```js
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPost } from './lib/extract-post.mjs';

const CONTENT_DIRS = ['gojo/stocks', 'gojo/research', 'gojo/notes', 'moneyhub', 'healthhub'];
const SKIP = /index\.html$/;
export const INDEX_PATH = 'resources/data/search-index.json';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.html') && !SKIP.test(name)) out.push(full);
  }
  return out;
}

export function buildIndex(root) {
  const posts = [];
  for (const d of CONTENT_DIRS) {
    const abs = join(root, d);
    try { statSync(abs); } catch { continue; }
    for (const file of walk(abs)) {
      const url = '/' + relative(root, file).split(sep).join('/');
      posts.push(extractPost(readFileSync(file, 'utf8'), url));
    }
  }
  // Total order → identical output on any filesystem: date desc, then url asc.
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.url.localeCompare(b.url));
  return posts;
}

export function serializeIndex(posts) {
  return JSON.stringify(posts, null, 0) + '\n';
}

const isMain = process.argv[1] && process.argv[1].endsWith('build-index.mjs');
if (isMain) {
  const ROOT = fileURLToPath(new URL('..', import.meta.url));
  const posts = buildIndex(ROOT);
  writeFileSync(join(ROOT, INDEX_PATH), serializeIndex(posts));
  console.log(`Indexed ${posts.length} posts → ${INDEX_PATH}`);
}
```

- [ ] **Step 4: Run — verify pass**

Run: `node --test test/build-index.test.mjs`
Expected: PASS.

- [ ] **Step 5: Regenerate the (currently stale) committed index**

Run: `npm run build:index`
Expected: `Indexed <N> posts → resources/data/search-index.json` (N ≈ 139).
Then confirm it now matches a fresh build (no diff on a second run):
Run: `npm run build:index && git diff --stat resources/data/search-index.json`
Expected: after the first rebuild is committed in Step 6, a re-run shows no further change. (Right now it WILL show a change versus the old committed file — that's the staleness + new ordering being fixed.)

- [ ] **Step 6: Run the full suite + commit**

Run: `npm test`
Expected: PASS (47 prior + the new build-index tests).
```bash
git add scripts/build-index.mjs test/build-index.test.mjs resources/data/search-index.json
git commit -m "feat: deterministic search-index builder; rebuild stale index"
```

---

### Task 2: Index freshness guard

**Files:**
- Create: `test/index-fresh.test.mjs`

**Interfaces:**
- Consumes: `buildIndex`, `serializeIndex`, `INDEX_PATH` (Task 1).

- [ ] **Step 1: Write the test**

`test/index-fresh.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, serializeIndex, INDEX_PATH } from '../scripts/build-index.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('committed search-index.json is up to date with the articles', () => {
  const committed = readFileSync(join(ROOT, INDEX_PATH), 'utf8');
  const fresh = serializeIndex(buildIndex(ROOT));
  assert.equal(committed, fresh, 'search-index.json is stale — run `npm run build:index` and commit the result');
});
```

- [ ] **Step 2: Run — verify it PASSES**

Run: `node --test test/index-fresh.test.mjs`
Expected: PASS — because Task 1 already rebuilt + committed a fresh, deterministic index. (If it FAILS here, Task 1's index wasn't committed; run `npm run build:index` and commit, then re-run.)

- [ ] **Step 3: Prove it catches staleness (sanity, then revert)**

Simulate content drift by adding a harmless space inside one article's title, so the rebuilt index would differ from the committed one:
Run: `perl -0pi -e 's/(<h1 class="article__title">)/$1 /' gojo/notes/2026-06-24-notes.html`
Run: `node --test test/index-fresh.test.mjs`
Expected: FAIL (committed index no longer matches the edited article) — confirming the guard works.
Then revert: `git checkout gojo/notes/2026-06-24-notes.html`
Run: `node --test test/index-fresh.test.mjs`
Expected: PASS again.

- [ ] **Step 4: Commit**

```bash
git add test/index-fresh.test.mjs
git commit -m "test: guard against stale search-index.json"
```

---

### Task 3: GitHub Action — reindex on push

**Files:**
- Create: `.github/workflows/build-index.yml`

**Manual prerequisite (human, one-time):** In the GitHub repo, Settings → Actions → General → **Workflow permissions** → select **Read and write permissions**, Save. Without this the Action cannot push the refreshed index. (The implementer cannot do this; note it in the report for the human.)

- [ ] **Step 1: Create the workflow**

`.github/workflows/build-index.yml`:
```yaml
name: Rebuild search index

on:
  push:
    branches: [main]
    paths:
      - 'gojo/**'
      - 'moneyhub/**'
      - 'healthhub/**'
      - 'scripts/**'

permissions:
  contents: write

concurrency:
  group: reindex-${{ github.ref }}
  cancel-in-progress: false

jobs:
  reindex:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Rebuild index
        run: npm run build:index
      - name: Run tests
        run: node --test
      - name: Commit refreshed index if changed
        run: |
          if [ -n "$(git status --porcelain resources/data/search-index.json)" ]; then
            git config user.name "github-actions[bot]"
            git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
            git add resources/data/search-index.json
            git commit -m "chore: rebuild search index [skip ci]"
            git push
          else
            echo "Index already current — nothing to commit."
          fi
```

- [ ] **Step 2: Validate the YAML locally (no runner needed)**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/build-index.yml','utf8');if(!/on:/.test(s)||!/permissions:/.test(s)||!/contents: write/.test(s))process.exit(1);console.log('workflow looks well-formed')"`
Expected: `workflow looks well-formed`.
Also confirm the loop-safety invariant by inspection: the `paths` trigger does NOT include `resources/data/**`, and the only file the job commits is `resources/data/search-index.json` → the bot commit cannot re-trigger the workflow. State this in the report.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/build-index.yml
git commit -m "ci: rebuild search index on content push"
```

---

### Task 4: Dynamic hub counts

**Files:**
- Create: `resources/js/counts.mjs`
- Create: `test/counts.test.mjs`
- Modify: `moneyhub/index.html` (data-count on the Market Takes + Investing card metas; load counts.mjs)

**Interfaces:**
- Produces:
  - `computeCounts(index) => { 'market-takes', 'journal', 'investing', 'wealth', 'health' }` — counts per the same filters the listings use.
  - Browser-only `mountCounts(doc)` — fetch the index, set `textContent` of every `[data-count="<key>"]` to its count. Guarded by `typeof document`.

- [ ] **Step 1: Write the failing test**

`test/counts.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCounts } from '../resources/js/counts.mjs';

const index = [
  { url: '/gojo/stocks/a.html', section: 'Gojo', type: 'market-take', ticker: 'SPY', date: '2026-06-01' },
  { url: '/gojo/research/b.html', section: 'Gojo', type: 'deep-dive', ticker: 'NVDA', date: '2026-05-01' },
  { url: '/gojo/notes/c.html', section: 'Gojo', type: 'journal', ticker: '', date: '2026-06-02' },
  { url: '/moneyhub/investing/d.html', section: 'Wealth', type: 'wealth', ticker: '', date: '2026-04-01' },
  { url: '/moneyhub/step1.html', section: 'Wealth', type: 'wealth', ticker: '', date: '2026-03-01' },
  { url: '/healthhub/training.html', section: 'Health', type: 'health', ticker: '', date: '2026-02-01' },
];

test('computeCounts tallies the listing filters', () => {
  const c = computeCounts(index);
  assert.equal(c['market-takes'], 2); // market-take + deep-dive
  assert.equal(c['journal'], 1);
  assert.equal(c['investing'], 1);   // url under /moneyhub/investing/
  assert.equal(c['wealth'], 2);
  assert.equal(c['health'], 1);
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/counts.test.mjs`
Expected: FAIL — `counts.mjs` missing.

- [ ] **Step 3: Implement `counts.mjs`**

`resources/js/counts.mjs`:
```js
const FILTERS = {
  'market-takes': p => p.section === 'Gojo' && (p.type === 'market-take' || p.type === 'deep-dive'),
  'journal': p => p.type === 'journal',
  'investing': p => p.url.startsWith('/moneyhub/investing/'),
  'wealth': p => p.section === 'Wealth',
  'health': p => p.section === 'Health',
};

export function computeCounts(index) {
  const out = {};
  for (const key of Object.keys(FILTERS)) out[key] = index.filter(FILTERS[key]).length;
  return out;
}

export async function mountCounts(doc = document) {
  const els = [...doc.querySelectorAll('[data-count]')];
  if (!els.length) return;
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { return; }
  const counts = computeCounts(index);
  for (const el of els) {
    const n = counts[el.dataset.count];
    if (n != null) el.textContent = String(n);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountCounts());
  else mountCounts();
}
```

- [ ] **Step 4: Run — verify pass**

Run: `node --test test/counts.test.mjs`
Expected: PASS.

- [ ] **Step 5: Wire the Wealth hub counts**

In `moneyhub/index.html`, find the two card metas with hardcoded counts and wrap the number in a `[data-count]` span (keep the surrounding text):
- The **Gojo Market Takes** card meta — change `<span class="hub-card__meta">60 posts →</span>` to `<span class="hub-card__meta"><span data-count="market-takes">60</span> posts →</span>`.
- The **Investing** card meta — change `<span class="hub-card__meta">5 guides →</span>` to `<span class="hub-card__meta"><span data-count="investing">5</span> guides →</span>`.
(If the exact surrounding text differs, preserve it — only wrap the integer in the `data-count` span.)
Then add the module script before `</body>` (after the existing chrome/search scripts):
```html
  <script type="module" src="/resources/js/counts.mjs"></script>
```

- [ ] **Step 6: Serve & verify**

Run: `python3 -m http.server 8000 >/tmp/h.log 2>&1 & sleep 1`
- `curl -s http://localhost:8000/moneyhub/ | grep -c 'data-count="market-takes"\|data-count="investing"\|counts.mjs'` → `3`
Then `pkill -f http.server`. (The numbers are filled by JS from the live index — controller does the visual confirm.)
Run: `npm test` → all green.

- [ ] **Step 7: Commit**

```bash
git add resources/js/counts.mjs test/counts.test.mjs moneyhub/index.html
git commit -m "feat: dynamic hub counts from the search index"
```

---

### Task 5: Verification

**Files:** none (verification + any fix surfaced).

- [ ] **Step 1: End-to-end verification**

Run: `npm test` → all green (build-index + freshness + counts + all prior). Record the total count.
Run: `npm run build:index && git diff --quiet resources/data/search-index.json && echo "INDEX CLEAN"` → prints `INDEX CLEAN` (committed index already matches a fresh build → determinism + freshness hold).
Confirm the workflow file exists and is loop-safe: `test -f .github/workflows/build-index.yml && grep -q "resources/data" .github/workflows/build-index.yml && echo "WARN: index path in triggers?" || echo "loop-safe (index not in triggers)"` → `loop-safe (index not in triggers)`.
Serve and confirm the Wealth hub still renders with the `data-count` spans and loads counts.mjs (curl/grep as in Task 4). 

- [ ] **Step 2: Commit (only if a fix was needed)**

```bash
git add -A
git commit -m "fix: Phase 4 verification adjustments"
```

---

## Self-Review

**Spec coverage (Phase 4):** Auto-rebuild index on publish — Task 3 (GitHub Action, cron-agnostic) ✓. Deterministic build so the Action doesn't churn — Task 1 ✓. Freshness guard (stale index can't slip through locally/CI) — Task 2 ✓. Fix the current live staleness — Task 1 Step 5–6 ✓. Dynamic hub counts (the reviewer-flagged "60 posts" drift) — Task 4 ✓. (Search-palette keyboard nav / empty states from the original spec Phase 4 note are **deferred to Phase 5 polish**, where a11y work lives — see Notes.)

**Placeholder scan:** none — every step has complete code/commands and concrete expected output.

**Type consistency:** `buildIndex`/`serializeIndex`/`INDEX_PATH` (Task 1) are consumed identically by the freshness test (Task 2). `computeCounts` (Task 4) keys (`market-takes`/`journal`/`investing`/`wealth`/`health`) match the `data-count` attributes wired into `moneyhub/index.html`. The Action (Task 3) calls `npm run build:index` (writes the index) and `node --test` (runs Tasks 1–2 guards) — the same scripts defined in package.json.

---

## Notes for Phase 5 (polish)
- Search-palette **keyboard navigation** (↑/↓ through results, Enter to open, active highlight) + an **empty/initial state** — originally grouped under Phase 4 in the spec; it's a11y/UX polish, so it lands with the Phase 5 dark-mode + a11y sweep.
- Remove the now-dead `.filter-chip*` CSS rules in `listing.css` (chips were dropped from Market Takes).
- The `.callout > p` margin fix; consolidate the duplicated `esc` helpers; flesh out the 7 stub pages.
- If GitHub branch protection is ever added to `main`, the reindex Action's push needs an exception (or switch to opening a PR).
