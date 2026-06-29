# Site Refactor — Phase 1: Foundation + Preview Home — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the new design-system foundation (fonts, tokens), a JS-injected shared chrome (nav/header/footer), a generated content index, site-wide command-palette search, and a fully rebuilt **home page** — delivering a working, navigable, searchable preview of the new site.

**Architecture:** Vanilla static site, no build tools. A one-time Node script parses every article into `search-index.json`. Browser ES modules render the shared chrome and a command palette from that index. The home page is static HTML that mounts the chrome and renders a live "Latest" feed from the same index. Logic-bearing modules (parser, search ranking, render functions) are pure and unit-tested with `node:test`; presentational work is verified by serving the site locally.

**Tech Stack:** HTML5, vanilla CSS (modular tokens + components), vanilla JS ES modules, Node.js ≥ 20 (`node:test`, `node:assert`) for tooling/tests. Fonts via Google Fonts.

## Global Constraints

- **No build tools / no runtime dependencies.** Tests use only Node built-ins (`node:test`, `node:assert`). Browser code is plain ES modules.
- **Typography (exact):** display/headings `Instrument Serif`; body/prose `Source Serif 4`; mono/labels `IBM Plex Mono`. No Inter / Fraunces / JetBrains Mono.
- **Accent color (exact):** `#dc2626` red. Ticker/markets highlight amber: text `#9a6a00` on background `#fdf3e0`.
- **Bio line (exact, verbatim):** `Builder, investor, construction professional.`
- **Single headshot:** `resources/images/tui-headshot.png` — never reference `TYR1.00_00_19_20.Still002.JPG` or `TYR1.00_00_21_05.Still001.JPG`.
- **Existing URLs are stable in Phase 1.** Nav labels are Wealth/Health but hrefs point to existing dirs `/moneyhub/`, `/healthhub/`, `/gojo/`. Directory renames + redirects are deferred to Phase 3.
- **Dev server required for JS:** `fetch()` of the index and ES modules need HTTP. Serve with `python3 -m http.server 8000` from repo root; open `http://localhost:8000/`.

---

## File Structure (Phase 1)

```
package.json                         CREATE  test script (node --test)
scripts/
  lib/extract-post.mjs               CREATE  pure: parse one article HTML → post object
  build-index.mjs                    CREATE  walk *.html → resources/data/search-index.json
test/
  extract-post.test.mjs              CREATE
  search-rank.test.mjs               CREATE
  chrome-render.test.mjs             CREATE
  feed-render.test.mjs               CREATE
  fixtures/sample-take.html          CREATE  small article fixture
resources/
  data/search-index.json            GENERATED (committed)
  css/
    tokens.css                       MODIFY  font vars → new families
    base.css                         MODIFY  apply serif body / serif headings
    style.css                        MODIFY  import new components
    components/
      chrome.css                     CREATE  header/nav/footer
      command-palette.css            CREATE
      feed.css                       CREATE  identity block + kicker/byline + data rows
  js/
    site-config.mjs                  CREATE  nav/social/profile data
    chrome.mjs                       CREATE  pure render fns + DOM mount
    search.mjs                       CREATE  pure rankResults + ⌘K palette
    feed.mjs                         CREATE  pure renderFeedRows + DOM mount
index.html                           REWRITE new home page
```

---

### Task 1: Tooling & test harness

**Files:**
- Create: `package.json`
- Create: `test/smoke.test.mjs`
- Create (dir): `resources/data/.gitkeep`

**Interfaces:**
- Produces: `npm test` runs `node --test` over `test/`.

- [ ] **Step 1: Write the failing test**

`test/smoke.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('node test runner works', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 2: Run it — verify it fails (no script yet)**

Run: `npm test`
Expected: FAIL — `npm error Missing script: "test"`.

- [ ] **Step 3: Create package.json**

`package.json`:
```json
{
  "name": "tuialailima-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "build:index": "node scripts/build-index.mjs"
  }
}
```

- [ ] **Step 4: Create the data dir placeholder**

Create `resources/data/.gitkeep` (empty file).

- [ ] **Step 5: Run tests — verify pass**

Run: `npm test`
Expected: PASS — `tests 1`, `pass 1`.

- [ ] **Step 6: Commit**

```bash
git add package.json test/smoke.test.mjs resources/data/.gitkeep
git commit -m "chore: add node:test harness and npm scripts"
```

---

### Task 2: Post metadata extractor

**Files:**
- Create: `scripts/lib/extract-post.mjs`
- Create: `test/extract-post.test.mjs`
- Create: `test/fixtures/sample-take.html`

**Interfaces:**
- Produces: `extractPost(html: string, url: string) => { url, title, summary, section, type, ticker, date }`
  - `section`: one of `Gojo | Wealth | Health | Site`
  - `type`: one of `market-take | deep-dive | journal | wealth | health | page`
  - `ticker`: uppercase string or `''`
  - `date`: `YYYY-MM-DD` or `''`

- [ ] **Step 1: Create the fixture**

`test/fixtures/sample-take.html`:
```html
<!DOCTYPE html><html><head>
<title>SPY Market Review — June 28, 2026: The AI Tax Arrives | Gojo Stock Takes</title>
<meta name="description" content="SPY closed at $728.99 as AI hardware costs hit consumer prices &mdash; Apple &amp; Microsoft hiked, Kospi broke twice, PCE 4.1%.">
</head><body>
<article class="article"><header class="article__header">
<h1 class="article__title">SPY Market Review &mdash; June 28, 2026: The AI Tax Arrives</h1>
<p class="article__subtitle">SPY closed the week at $728.99.</p>
</header></article></body></html>
```

- [ ] **Step 2: Write the failing test**

`test/extract-post.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractPost } from '../scripts/lib/extract-post.mjs';

const html = readFileSync(new URL('./fixtures/sample-take.html', import.meta.url), 'utf8');

test('extracts title, summary, section, type, ticker, date from a stock take', () => {
  const p = extractPost(html, '/gojo/stocks/spy-market-review-2026-06-28.html');
  assert.equal(p.title, 'SPY Market Review — June 28, 2026: The AI Tax Arrives');
  assert.match(p.summary, /Apple & Microsoft hiked/);
  assert.equal(p.section, 'Gojo');
  assert.equal(p.type, 'market-take');
  assert.equal(p.ticker, 'SPY');
  assert.equal(p.date, '2026-06-28');
  assert.equal(p.url, '/gojo/stocks/spy-market-review-2026-06-28.html');
});

test('classifies a journal note and falls back to prose date', () => {
  const note = '<h1 class="article__title">Daily Note</h1><p>Logged June 24, 2026 here.</p>';
  const p = extractPost(note, '/gojo/notes/2026-05-21-notes.html');
  assert.equal(p.type, 'journal');
  assert.equal(p.section, 'Gojo');
  assert.equal(p.ticker, '');
  assert.equal(p.date, '2026-05-21');
});

test('classifies wealth and health by directory', () => {
  assert.equal(extractPost('<h1 class="article__title">X</h1>', '/moneyhub/step4-investing-basics.html').section, 'Wealth');
  assert.equal(extractPost('<h1 class="article__title">X</h1>', '/healthhub/training.html').type, 'health');
});
```

- [ ] **Step 3: Run test — verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../scripts/lib/extract-post.mjs'`.

- [ ] **Step 4: Implement the extractor**

`scripts/lib/extract-post.mjs`:
```js
import { basename } from 'node:path';

const SECTIONS = [
  { re: /\/gojo\/stocks\//,   section: 'Gojo',   type: 'market-take' },
  { re: /\/gojo\/research\//, section: 'Gojo',   type: 'deep-dive' },
  { re: /\/gojo\/notes\//,    section: 'Gojo',   type: 'journal' },
  { re: /\/moneyhub\//,       section: 'Wealth', type: 'wealth' },
  { re: /\/healthhub\//,      section: 'Health', type: 'health' },
];

const ENTITIES = { '&amp;':'&','&mdash;':'—','&ndash;':'–','&rsquo;':'’','&lsquo;':'‘',
  '&ldquo;':'“','&rdquo;':'”','&middot;':'·','&hellip;':'…','&nbsp;':' ' };
const MONTHS = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',
  July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' };

function decode(s) { return s.replace(/&[a-z]+;/g, m => ENTITIES[m] ?? m).replace(/\s+/g, ' ').trim(); }
function pick(re, html) { const m = html.match(re); return m ? decode(m[1]) : ''; }
function toISO(s) {
  const m = s.match(/([A-Z][a-z]+) (\d{1,2}), (20\d{2})/);
  return m ? `${m[3]}-${MONTHS[m[1]]}-${String(m[2]).padStart(2, '0')}` : '';
}

export function extractPost(html, url) {
  const file = basename(url);
  const klass = SECTIONS.find(s => s.re.test(url)) || { section: 'Site', type: 'page' };

  const title = pick(/<h1 class="article__title">([\s\S]*?)<\/h1>/, html)
    || decode((pick(/<title>([\s\S]*?)<\/title>/, html).split('|')[0]) || '');
  const summary = pick(/<meta name="description" content="([\s\S]*?)">/, html)
    || pick(/<p class="article__subtitle">([\s\S]*?)<\/p>/, html);

  let date = (file.match(/(20\d{2}-\d{2}-\d{2})/) || [])[1] || '';
  if (!date) date = toISO((html.match(/([A-Z][a-z]+ \d{1,2}, 20\d{2})/) || [])[1] || '');

  let ticker = '';
  if (klass.type === 'market-take' || klass.type === 'deep-dive') {
    const seg = file.split('-')[0];
    if (/^[a-z]{2,5}$/.test(seg)) ticker = seg.toUpperCase();
  }

  return { url, title, summary, section: klass.section, type: klass.type, ticker, date };
}
```

- [ ] **Step 5: Run tests — verify pass**

Run: `npm test`
Expected: PASS — all `extract-post` tests green.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/extract-post.mjs test/extract-post.test.mjs test/fixtures/sample-take.html
git commit -m "feat: add article metadata extractor"
```

---

### Task 3: Build the search index

**Files:**
- Create: `scripts/build-index.mjs`
- Modify: `resources/data/search-index.json` (generated output, committed)

**Interfaces:**
- Consumes: `extractPost` (Task 2).
- Produces: `resources/data/search-index.json` — a JSON array of post objects, sorted by `date` descending.

- [ ] **Step 1: Write the index builder**

`scripts/build-index.mjs`:
```js
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPost } from './lib/extract-post.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIRS = ['gojo/stocks', 'gojo/research', 'gojo/notes', 'moneyhub', 'healthhub'];
const SKIP = /index\.html$/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.html') && !SKIP.test(name)) out.push(full);
  }
  return out;
}

const posts = [];
for (const d of CONTENT_DIRS) {
  const abs = join(ROOT, d);
  try { statSync(abs); } catch { continue; }
  for (const file of walk(abs)) {
    const url = '/' + relative(ROOT, file).split(sep).join('/');
    posts.push(extractPost(readFileSync(file, 'utf8'), url));
  }
}
posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const outPath = join(ROOT, 'resources/data/search-index.json');
writeFileSync(outPath, JSON.stringify(posts, null, 0) + '\n');
console.log(`Indexed ${posts.length} posts → resources/data/search-index.json`);
```

- [ ] **Step 2: Run the builder**

Run: `npm run build:index`
Expected: prints `Indexed <N> posts …` where N ≈ 120 (59 takes + 1 research + 60 notes; moneyhub/healthhub may add a few).

- [ ] **Step 3: Verify the output shape**

Run: `node -e "const a=require('./resources/data/search-index.json'); console.log(a.length, a[0]); console.log('SPY takes:', a.filter(p=>p.ticker==='SPY').length)"`
Expected: a count, a well-formed first object with non-empty `title`/`date`, and several SPY takes (≥ 5).

- [ ] **Step 4: Commit**

```bash
git add scripts/build-index.mjs resources/data/search-index.json
git commit -m "feat: generate search-index.json from articles"
```

---

### Task 4: Design tokens & fonts

**Files:**
- Modify: `resources/css/tokens.css` (font-family custom properties)
- Modify: `resources/css/base.css` (apply body/heading families)

**Interfaces:**
- Produces: CSS custom properties `--font-display`, `--font-primary`, `--font-mono` set to the new families; base elements use them.

- [ ] **Step 1: Update font tokens**

In `resources/css/tokens.css`, replace the three font-family declarations with:
```css
  --font-primary: 'Source Serif 4', Georgia, 'Times New Roman', serif;
  --font-display: 'Instrument Serif', Georgia, serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace;
```
(Keep all color tokens unchanged — `--color-accent-primary` stays `#dc2626`.)

- [ ] **Step 2: Add the amber ticker tokens**

In `resources/css/tokens.css`, inside the light `:root` block add:
```css
  --color-ticker-text: #9a6a00;
  --color-ticker-bg: #fdf3e0;
```
And inside the `[data-theme="dark"]` block add:
```css
  --color-ticker-text: #f5b13d;
  --color-ticker-bg: rgba(245,177,61,0.12);
```

- [ ] **Step 3: Apply families in base.css**

In `resources/css/base.css`, ensure `body` uses `var(--font-primary)` and headings use `var(--font-display)`. Add/confirm:
```css
body { font-family: var(--font-primary); }
h1, h2, h3, .article__title { font-family: var(--font-display); font-weight: 400; letter-spacing: 0; }
```
(`Instrument Serif` ships at weight 400; do not request 600/700.)

- [ ] **Step 4: Verify visually**

Run: `python3 -m http.server 8000` (from repo root), open `http://localhost:8000/gojo/stocks/spy-market-review-2026-06-28.html`.
Expected: the existing article's `<head>` still loads old fonts (migrated in Phase 2), but once the home is built (Task 11) it shows Instrument Serif headings + Source Serif body. For now confirm no CSS errors in the browser console.

- [ ] **Step 5: Commit**

```bash
git add resources/css/tokens.css resources/css/base.css
git commit -m "feat: switch type tokens to Instrument Serif / Source Serif 4 / IBM Plex Mono"
```

---

### Task 5: Site configuration module

**Files:**
- Create: `resources/js/site-config.mjs`
- Create: `test/fixtures` already exists; no new fixture.

**Interfaces:**
- Produces: `SITE` object — `{ name, bio, nav:[{label,href}], social:[{label,href,icon}] }`.

- [ ] **Step 1: Write the failing test**

Append to a new file `test/chrome-render.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SITE } from '../resources/js/site-config.mjs';

test('site config exposes nav, bio, social', () => {
  assert.equal(SITE.bio, 'Builder, investor, construction professional.');
  assert.deepEqual(SITE.nav.map(n => n.label), ['Wealth', 'Health', 'Gojo', 'About']);
  assert.ok(SITE.social.length >= 3);
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `site-config.mjs`.

- [ ] **Step 3: Create the config**

`resources/js/site-config.mjs`:
```js
export const SITE = {
  name: 'Tui Alailima',
  bio: 'Builder, investor, construction professional.',
  nav: [
    { label: 'Wealth', href: '/moneyhub/' },
    { label: 'Health', href: '/healthhub/' },
    { label: 'Gojo',   href: '/gojo/' },
    { label: 'About',  href: '/#about' },
  ],
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/coach.tui/', icon: 'instagram' },
    { label: 'GitHub',    href: 'https://github.com/coachtui',          icon: 'github' },
    { label: 'X',         href: 'https://twitter.com/tuialailima',      icon: 'x-twitter' },
  ],
};
```

- [ ] **Step 4: Run — verify pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/site-config.mjs test/chrome-render.test.mjs
git commit -m "feat: add site-config module"
```

---

### Task 6: Shared chrome render + mount

**Files:**
- Create: `resources/js/chrome.mjs`
- Modify: `test/chrome-render.test.mjs` (add render tests)

**Interfaces:**
- Consumes: `SITE` (Task 5).
- Produces:
  - `renderHeader(site, currentPath) => string` (HTML for `<header>` incl. logo, nav, search pill, theme toggle button)
  - `renderFooter(site) => string`
  - `mountChrome(doc)` — injects header into `#site-header` and footer into `#site-footer`, marking the active nav link by `location.pathname`.

- [ ] **Step 1: Add failing render tests**

Append to `test/chrome-render.test.mjs`:
```js
import { renderHeader, renderFooter } from '../resources/js/chrome.mjs';

test('header renders all nav links and marks the active one', () => {
  const html = renderHeader(SITE, '/moneyhub/');
  for (const item of SITE.nav) assert.ok(html.includes(item.href), `missing ${item.href}`);
  assert.match(html, /aria-current="page"[^>]*>Wealth|Wealth<\/a>/);
  assert.ok(html.includes('data-search-trigger'), 'has search pill');
  assert.ok(html.includes('data-theme-toggle'), 'has theme toggle');
});

test('footer renders bio and social links', () => {
  const html = renderFooter(SITE);
  assert.ok(html.includes('construction professional'));
  assert.ok(html.includes('github.com/coachtui'));
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `chrome.mjs`.

- [ ] **Step 3: Implement chrome.mjs**

`resources/js/chrome.mjs`:
```js
import { SITE } from './site-config.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export function renderHeader(site, currentPath = '/') {
  const links = site.nav.map(n => {
    const active = currentPath === n.href || (n.href !== '/' && currentPath.startsWith(n.href) && n.href.endsWith('/'));
    return `<li><a class="chrome-nav__link" href="${esc(n.href)}"${active ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`;
  }).join('');
  return `
<div class="chrome-header__inner">
  <a class="chrome-header__logo" href="/">${esc(site.name)}</a>
  <nav class="chrome-nav" aria-label="Primary"><ul>${links}</ul></nav>
  <div class="chrome-header__actions">
    <button class="chrome-search-pill" data-search-trigger aria-label="Search">
      <span>Search</span><kbd>⌘K</kbd>
    </button>
    <button class="theme-toggle" data-theme-toggle aria-label="Toggle dark mode">◐</button>
  </div>
</div>`;
}

export function renderFooter(site) {
  const social = site.social.map(s =>
    `<a href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}"><i class="fa-brands fa-${esc(s.icon)}"></i></a>`
  ).join('');
  const links = site.nav.map(n => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('');
  return `
<div class="chrome-footer__inner">
  <div class="chrome-footer__brand">
    <a class="chrome-footer__logo" href="/">${esc(site.name)}</a>
    <p>${esc(site.bio)}</p>
    <div class="chrome-footer__social">${social}</div>
  </div>
  <nav class="chrome-footer__nav" aria-label="Footer"><ul>${links}</ul></nav>
</div>
<div class="chrome-footer__bottom">© 2026 ${esc(site.name)}. Gojo content is AI-generated — not financial advice.</div>`;
}

export function mountChrome(doc = document) {
  const header = doc.getElementById('site-header');
  const footer = doc.getElementById('site-footer');
  if (header) header.innerHTML = renderHeader(SITE, doc.location?.pathname || location.pathname);
  if (footer) footer.innerHTML = renderFooter(SITE);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountChrome());
  else mountChrome();
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/chrome.mjs test/chrome-render.test.mjs
git commit -m "feat: add JS-injected shared chrome (header/nav/footer)"
```

---

### Task 7: Chrome CSS

**Files:**
- Create: `resources/css/components/chrome.css`
- Modify: `resources/css/style.css` (import it)

**Interfaces:**
- Consumes: tokens from Task 4. Styles classes emitted by `chrome.mjs`.

- [ ] **Step 1: Create chrome.css**

`resources/css/components/chrome.css`:
```css
.chrome-header { position: sticky; top: 0; z-index: 50; background: color-mix(in srgb, var(--color-bg-primary) 88%, transparent);
  backdrop-filter: blur(10px); border-bottom: 1px solid var(--color-border); }
.chrome-header__inner { max-width: var(--width-content-xl); margin: 0 auto; display: flex; align-items: center;
  gap: var(--space-6); padding: var(--space-3) var(--space-5); }
.chrome-header__logo { font-family: var(--font-display); font-size: var(--text-xl); color: var(--color-text-primary); text-decoration: none; }
.chrome-nav ul { display: flex; gap: var(--space-5); list-style: none; margin: 0; padding: 0; }
.chrome-nav__link { font-size: var(--text-sm); color: var(--color-text-secondary); text-decoration: none; }
.chrome-nav__link[aria-current="page"] { color: var(--color-text-primary); font-weight: 600; }
.chrome-header__actions { margin-left: auto; display: flex; align-items: center; gap: var(--space-3); }
.chrome-search-pill { display: inline-flex; align-items: center; gap: var(--space-3); font-family: var(--font-mono);
  font-size: var(--text-xs); color: var(--color-text-tertiary); background: var(--color-bg-primary);
  border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 6px 10px; cursor: pointer; }
.chrome-search-pill kbd { border: 1px solid var(--color-border); border-radius: 4px; padding: 1px 5px; font: inherit; }
.chrome-footer { border-top: 1px solid var(--color-border); margin-top: var(--space-24); background: var(--color-bg-secondary); }
.chrome-footer__inner { max-width: var(--width-content-xl); margin: 0 auto; display: flex; flex-wrap: wrap;
  gap: var(--space-12); justify-content: space-between; padding: var(--space-16) var(--space-5) var(--space-8); }
.chrome-footer__logo { font-family: var(--font-display); font-size: var(--text-lg); color: var(--color-text-primary); text-decoration: none; }
.chrome-footer__brand p { color: var(--color-text-tertiary); margin: var(--space-2) 0; max-width: 32ch; }
.chrome-footer__social { display: flex; gap: var(--space-4); font-size: var(--text-lg); }
.chrome-footer__social a { color: var(--color-text-tertiary); }
.chrome-footer__nav ul { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--space-2); }
.chrome-footer__nav a { color: var(--color-text-secondary); text-decoration: none; font-size: var(--text-sm); }
.chrome-footer__bottom { max-width: var(--width-content-xl); margin: 0 auto; padding: var(--space-6) var(--space-5);
  border-top: 1px solid var(--color-border); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-quaternary); }
@media (max-width: 640px) { .chrome-nav { display: none; } }
```

- [ ] **Step 2: Import it in style.css**

In `resources/css/style.css`, add after the existing component imports:
```css
@import url('components/chrome.css');
```

- [ ] **Step 3: Verify**

(Verified together with the home page in Task 11.) Run `npm test` to confirm nothing broke: Expected PASS.

- [ ] **Step 4: Commit**

```bash
git add resources/css/components/chrome.css resources/css/style.css
git commit -m "feat: style shared chrome"
```

---

### Task 8: Command-palette search

**Files:**
- Create: `resources/js/search.mjs`
- Create: `test/search-rank.test.mjs`

**Interfaces:**
- Produces:
  - `rankResults(index, query, limit=8) => post[]` (pure; ticker-exact ranked highest, then title, summary, section matches).
  - `initSearch(doc)` — fetches `/resources/data/search-index.json`, wires `[data-search-trigger]` and the `⌘K` / `Ctrl+K` shortcut to open a palette, renders live results via `rankResults`.

- [ ] **Step 1: Write failing ranking tests**

`test/search-rank.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankResults } from '../resources/js/search.mjs';

const index = [
  { url: '/a', title: 'SPY Weekly Review', summary: 'index melt-up', section: 'Gojo', ticker: 'SPY', date: '2026-06-28' },
  { url: '/b', title: 'Oracle deep dive', summary: 'SPY mentioned once', section: 'Gojo', ticker: 'ORCL', date: '2026-06-26' },
  { url: '/c', title: 'Emergency fund guide', summary: 'how much to save', section: 'Wealth', ticker: '', date: '2026-06-10' },
];

test('exact ticker ranks first', () => {
  const r = rankResults(index, 'spy');
  assert.equal(r[0].url, '/a');
});

test('keyword search works across sections (not just tickers)', () => {
  const r = rankResults(index, 'emergency fund');
  assert.equal(r[0].url, '/c');
});

test('empty query returns nothing', () => {
  assert.deepEqual(rankResults(index, '   '), []);
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `search.mjs`.

- [ ] **Step 3: Implement search.mjs**

`resources/js/search.mjs`:
```js
export function rankResults(index, query, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return index
    .map(post => ({ post, score: scorePost(post, q, terms) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || (b.post.date || '').localeCompare(a.post.date || ''))
    .slice(0, limit)
    .map(r => r.post);
}

function scorePost(post, q, terms) {
  const ticker = (post.ticker || '').toLowerCase();
  const title = (post.title || '').toLowerCase();
  const summary = (post.summary || '').toLowerCase();
  const section = (post.section || '').toLowerCase();
  let score = 0;
  if (ticker && ticker === q) score += 100;
  for (const t of terms) {
    if (ticker && ticker === t) score += 80;
    if (title.includes(t)) score += 20;
    if (summary.includes(t)) score += 8;
    if (section.includes(t)) score += 5;
  }
  return score;
}

// ---- browser-only palette ----
export async function initSearch(doc = document) {
  let index = [];
  try {
    index = await (await fetch('/resources/data/search-index.json')).json();
  } catch { /* offline / file://: search disabled, pill still inert-safe */ }

  const overlay = doc.createElement('div');
  overlay.className = 'cmdk';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="cmdk__panel" role="dialog" aria-label="Search">
      <input class="cmdk__input" type="text" placeholder="Search takes, tickers, guides — e.g. SPY, emergency fund" aria-label="Search query">
      <ul class="cmdk__results"></ul>
    </div>`;
  doc.body.appendChild(overlay);
  const input = overlay.querySelector('.cmdk__input');
  const results = overlay.querySelector('.cmdk__results');

  const close = () => { overlay.hidden = true; input.value = ''; results.innerHTML = ''; };
  const open = () => { overlay.hidden = false; input.focus(); };

  input.addEventListener('input', () => {
    const rows = rankResults(index, input.value);
    results.innerHTML = rows.map(p => `
      <li><a href="${p.url}">
        ${p.ticker ? `<span class="cmdk__tag">${p.ticker}</span>` : `<span class="cmdk__tag cmdk__tag--sec">${p.section}</span>`}
        <span class="cmdk__title">${p.title}</span>
        <span class="cmdk__date">${p.date || ''}</span>
      </a></li>`).join('');
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

- [ ] **Step 4: Run — verify pass**

Run: `npm test`
Expected: PASS (ranking tests; the browser block is guarded by `typeof document`).

- [ ] **Step 5: Commit**

```bash
git add resources/js/search.mjs test/search-rank.test.mjs
git commit -m "feat: add site-wide command-palette search"
```

---

### Task 9: Command-palette CSS

**Files:**
- Create: `resources/css/components/command-palette.css`
- Modify: `resources/css/style.css` (import)

- [ ] **Step 1: Create command-palette.css**

`resources/css/components/command-palette.css`:
```css
.cmdk { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.4);
  display: flex; align-items: flex-start; justify-content: center; padding-top: 12vh; }
.cmdk[hidden] { display: none; }
.cmdk__panel { width: min(560px, 92vw); background: var(--color-bg-elevated); border: 1px solid var(--color-border);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-2xl); overflow: hidden; }
.cmdk__input { width: 100%; border: 0; outline: 0; padding: var(--space-4) var(--space-5);
  font-family: var(--font-primary); font-size: var(--text-lg); color: var(--color-text-primary);
  background: var(--color-bg-elevated); border-bottom: 1px solid var(--color-border); }
.cmdk__results { list-style: none; margin: 0; padding: var(--space-2); max-height: 50vh; overflow-y: auto; }
.cmdk__results a { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3);
  border-radius: var(--radius-md); text-decoration: none; color: var(--color-text-primary); }
.cmdk__results a:hover { background: var(--color-bg-tertiary); }
.cmdk__tag { font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 600;
  color: var(--color-ticker-text); background: var(--color-ticker-bg); border-radius: var(--radius-sm); padding: 2px 7px; min-width: 52px; text-align: center; }
.cmdk__tag--sec { color: var(--color-accent-primary); background: var(--color-accent-tertiary); }
.cmdk__title { font-size: var(--text-sm); flex: 1; }
.cmdk__date { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-quaternary); }
```

- [ ] **Step 2: Import it**

In `resources/css/style.css` add:
```css
@import url('components/command-palette.css');
```

- [ ] **Step 3: Commit**

```bash
git add resources/css/components/command-palette.css resources/css/style.css
git commit -m "feat: style command palette"
```

---

### Task 10: Latest-feed component

**Files:**
- Create: `resources/js/feed.mjs`
- Create: `resources/css/components/feed.css`
- Create: `test/feed-render.test.mjs`
- Modify: `resources/css/style.css` (import feed.css)

**Interfaces:**
- Produces:
  - `renderFeedRows(index, limit=8) => string` (pure; reverse-chron HTML rows with section/ticker badge, title, date).
  - `mountFeed(doc)` — fetches the index, injects rows into `#latest-feed`.

- [ ] **Step 1: Write failing test**

`test/feed-render.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFeedRows } from '../resources/js/feed.mjs';

const index = [
  { url: '/a', title: 'SPY Weekly Review', section: 'Gojo', type: 'market-take', ticker: 'SPY', date: '2026-06-28' },
  { url: '/b', title: 'Emergency Fund', section: 'Wealth', type: 'wealth', ticker: '', date: '2026-06-10' },
];

test('renders one row per post with title, link, badge, date', () => {
  const html = renderFeedRows(index);
  assert.ok(html.includes('href="/a"'));
  assert.ok(html.includes('SPY'));
  assert.ok(html.includes('Emergency Fund'));
  assert.ok(html.includes('2026-06-28'));
});

test('respects the limit', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({ url: '/' + i, title: 't' + i, section: 'Gojo', ticker: '', date: '2026-01-' + String(i + 1).padStart(2, '0') }));
  const html = renderFeedRows(many, 5);
  assert.equal((html.match(/feed-row/g) || []).length, 5);
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npm test`
Expected: FAIL — cannot find `feed.mjs`.

- [ ] **Step 3: Implement feed.mjs**

`resources/js/feed.mjs`:
```js
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const BADGE = { 'market-take': 'GOJO', 'deep-dive': 'GOJO', 'journal': 'JRNL', 'wealth': 'WLTH', 'health': 'HLTH' };

export function renderFeedRows(index, limit = 8) {
  return index.slice(0, limit).map(p => {
    const label = p.ticker || BADGE[p.type] || (p.section || '').toUpperCase().slice(0, 4);
    const isTicker = !!p.ticker;
    return `<a class="feed-row" href="${esc(p.url)}">
  <span class="feed-row__badge${isTicker ? ' feed-row__badge--ticker' : ''}">${esc(label)}</span>
  <span class="feed-row__title">${esc(p.title)}</span>
  <span class="feed-row__date">${esc(p.date || '')}</span>
</a>`;
  }).join('\n');
}

export async function mountFeed(doc = document) {
  const el = doc.getElementById('latest-feed');
  if (!el) return;
  try {
    const index = await (await fetch('/resources/data/search-index.json')).json();
    el.innerHTML = renderFeedRows(index, 8);
  } catch { el.innerHTML = '<p class="feed-empty">Run <code>npm run build:index</code> and serve over HTTP to load the feed.</p>'; }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountFeed());
  else mountFeed();
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Create feed.css**

`resources/css/components/feed.css`:
```css
/* identity block */
.identity { display: grid; grid-template-columns: 132px 1fr; gap: var(--space-6); align-items: center;
  max-width: var(--width-content-lg); margin: var(--space-16) auto var(--space-8); padding: 0 var(--space-5); }
.identity__photo { width: 132px; height: 132px; border-radius: var(--radius-lg); object-fit: cover; object-position: top; border: 1px solid var(--color-border); }
.identity__name { font-family: var(--font-display); font-size: var(--text-4xl); line-height: 1; color: var(--color-text-primary); }
.identity__bio { color: var(--color-text-tertiary); font-size: var(--text-lg); margin-top: var(--space-2); }
.identity__cta { margin-top: var(--space-4); display: flex; gap: var(--space-3); }
/* kicker + byline (shared with articles later) */
.kicker { font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 600; letter-spacing: .06em;
  color: var(--color-ticker-text); background: var(--color-ticker-bg); border-radius: var(--radius-sm); padding: 4px 9px; display: inline-block; }
.byline { font-family: var(--font-primary); font-style: italic; color: var(--color-text-tertiary); font-size: var(--text-sm); }
.byline b { font-style: normal; font-weight: 600; color: var(--color-text-secondary); }
.byline .ai { color: var(--color-accent-primary); }
/* latest feed */
.feed { max-width: var(--width-content-lg); margin: 0 auto var(--space-16); padding: 0 var(--space-5); }
.feed__head { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: .12em; text-transform: uppercase;
  color: var(--color-text-quaternary); margin-bottom: var(--space-3); }
.feed-row { display: grid; grid-template-columns: 78px 1fr auto; gap: var(--space-4); align-items: baseline;
  padding: var(--space-4) 0; border-top: 1px solid var(--color-border); text-decoration: none; }
.feed-row:hover .feed-row__title { color: var(--color-accent-primary); }
.feed-row__badge { font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 600; text-align: center;
  color: var(--color-accent-primary); background: var(--color-accent-tertiary); border-radius: var(--radius-sm); padding: 3px 0; }
.feed-row__badge--ticker { color: var(--color-ticker-text); background: var(--color-ticker-bg); }
.feed-row__title { font-size: var(--text-base); color: var(--color-text-primary); }
.feed-row__date { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-quaternary); }
@media (max-width: 640px) { .identity { grid-template-columns: 1fr; text-align: left; } }
```

- [ ] **Step 6: Import feed.css**

In `resources/css/style.css` add:
```css
@import url('components/feed.css');
```

- [ ] **Step 7: Commit**

```bash
git add resources/js/feed.mjs resources/css/components/feed.css resources/css/style.css test/feed-render.test.mjs
git commit -m "feat: add latest-feed component and identity styles"
```

---

### Task 11: Rebuild the home page

**Files:**
- Modify (rewrite): `index.html`

**Interfaces:**
- Consumes: chrome.mjs, search.mjs, feed.mjs, theme.js, the new CSS, `tui-headshot.png`, `search-index.json`.

- [ ] **Step 1: Replace index.html**

Overwrite `index.html` with:
```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tui Alailima — builder, investor, construction professional</title>
  <meta name="description" content="The home for my writing on wealth, health, and the work — plus Gojo, my AI market analyst. Social brings you here; the real thinking lives here.">
  <link rel="icon" href="/resources/images/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://kit.fontawesome.com/ed35775394.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="/resources/css/style.css">
  <script src="/resources/js/theme.js"></script>
</head>
<body>
  <header class="chrome-header" id="site-header"></header>

  <main>
    <section class="identity">
      <img class="identity__photo" src="/resources/images/tui-headshot.png" alt="Tui Alailima">
      <div>
        <h1 class="identity__name">Tui Alailima</h1>
        <p class="identity__bio">Builder, investor, construction professional. I publish long-form research with Gojo, my AI analyst — searchable, dated, and built to compound.</p>
        <div class="identity__cta">
          <button class="btn btn--primary" data-search-trigger>Search the archive ⌘K</button>
          <a class="btn btn--secondary" href="/#about">About me</a>
        </div>
      </div>
    </section>

    <section class="feed">
      <h2 class="feed__head">Latest</h2>
      <div id="latest-feed"><p class="feed-empty">Loading…</p></div>
    </section>

    <section class="identity" id="about">
      <div style="grid-column: 1 / -1; max-width: 60ch;">
        <h2 style="font-family: var(--font-display); font-size: var(--text-2xl);">Who I am</h2>
        <p style="color: var(--color-text-secondary);">A construction professional building AIGA — a set of AI-native products — investing on a long horizon, and training to stay strong enough to do all of it. I write what I learn, and Gojo (my AI analyst) publishes the market research. <a href="https://aigaai.com" target="_blank" rel="noopener">AIGA →</a></p>
      </div>
    </section>
  </main>

  <footer class="chrome-footer" id="site-footer"></footer>

  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
  <script type="module" src="/resources/js/feed.mjs"></script>
</body>
</html>
```

- [ ] **Step 2: Serve and verify the full preview**

Run: `python3 -m http.server 8000` then open `http://localhost:8000/`.
Expected, all true:
1. Header shows logo + Wealth/Health/Gojo/About + search pill + theme toggle.
2. Headline is Instrument Serif; bio + body are Source Serif 4.
3. Headshot renders (the new photo).
4. "Latest" lists real recent posts (SPY June 28 at top), each linking to its article.
5. Clicking the search pill or pressing **⌘K** opens the palette; typing `spy` shows SPY takes; typing `emergency fund` shows the wealth guide; Enter/click navigates.
6. Theme toggle flips light/dark with no flash.
7. Footer shows bio + social + nav.

- [ ] **Step 3: Verify tests still pass**

Run: `npm test`
Expected: PASS (all suites).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: rebuild home page on new publishing-engine foundation"
```

---

### Task 12: Cleanup & dark-mode pass for the preview

**Files:**
- Modify: `resources/css/components/feed.css` / `chrome.css` (dark fixes only if Step 1 finds issues)
- Remove unused: none yet (old hero CSS retired in Phase 3 with the other pages)

- [ ] **Step 1: Dark-mode visual check**

Serve, toggle dark mode on `/`. Verify: header blur/border, ticker badges (amber on dark), feed row borders, command palette, and footer all read correctly. If any token looks wrong, adjust the relevant `[data-theme="dark"]` token in `tokens.css` only.

- [ ] **Step 2: Accessibility quick pass**

Confirm: search pill and theme toggle have `aria-label`; nav has `aria-label="Primary"`; active link has `aria-current="page"`; palette input has a label; images have `alt`. Fix any gap inline.

- [ ] **Step 3: Commit (if changes made)**

```bash
git add -A
git commit -m "fix: dark-mode and a11y polish for home preview"
```

---

## Self-Review

**Spec coverage (Phase 1 scope):**
- North-star home (front door + live feed + search): Tasks 10–11 ✓
- Type system (Instrument/Source Serif/IBM Plex Mono): Task 4 ✓
- Red accent + amber ticker tokens: Task 4 ✓
- Bio line verbatim: Tasks 5, 11 ✓
- Single headshot: Task 11 ✓
- Nav (Wealth/Health/Gojo/About, Build → About): Tasks 5–6 ✓
- JS-injected shared chrome: Tasks 6–7 ✓
- Site-wide intelligent search (title/summary/section/ticker, ⌘K + pill): Tasks 8–9 ✓
- Content index generator: Tasks 2–3 ✓
- *Deferred to later phases (documented below):* article template + 147-page migration, section hubs, Gojo restructure, About page, dir renames/redirects, related-posts, DESIGN-SYSTEM.md rewrite.

**Placeholder scan:** No TBD/TODO; every code step contains complete code; verification steps list concrete expected outcomes. ✓

**Type consistency:** `extractPost` shape `{url,title,summary,section,type,ticker,date}` is produced in Task 2 and consumed identically by Task 3 (build), Task 8 (`rankResults`), and Task 10 (`renderFeedRows`). `renderHeader(site,currentPath)` / `renderFooter(site)` defined in Task 6 match their tests. `data-search-trigger` is emitted by chrome (Task 6) and consumed by search (Task 8). `#latest-feed`, `#site-header`, `#site-footer` mount IDs are consistent between Tasks 6/10/11. ✓

---

## Roadmap — later phases (each becomes its own plan)

- **Phase 2 — Article template + migration.** Canonical article page (kicker, Instrument Serif title, editorial byline, AI-disclaimer callout, Source Serif prose, sticky "On this page"/related rail). A Node migration script converts all 147 pages: new `<head>` fonts, strip hard-coded nav/footer → chrome mount + module scripts, normalize breadcrumb/byline. Re-home `gojo/research/*` into Market Takes tagged `deep-dive`.
- **Phase 3 — Section hubs + restructure.** Rebuild Wealth, Health, Gojo (2 buckets: Market Takes + Journal) and Market Takes search page (inline filter + ticker chips). New About page (bio + AIGA + contact). Decide moneyhub→wealth / healthhub→health directory renames with redirects, or keep paths + relabel.
- **Phase 4 — Search depth + publishing.** Wire `build:index` into the cron's publish step so new posts auto-index; add result keyboard nav and recent/empty states.
- **Phase 5 — Polish.** Full dark-mode audit, responsive sweep, related-posts, performance (font-display, preloads), and a rewritten `DESIGN-SYSTEM.md` documenting the new system.
```
