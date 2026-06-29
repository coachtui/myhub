# Site Refactor — Phase 2: Article Template + 147-Page Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every existing page to the new design system — rebuild the ~137 article pages on a clean article template (kicker, Instrument Serif title, editorial byline, AI-disclaimer callout, Source Serif prose, right "On this page"/related rail), give the 8 hub/index pages a chrome-only swap for nav consistency, and remove the home's redundant "Who I am" block.

**Architecture:** Regenerate-from-template, not in-place surgery. A pure extractor pulls structured fields (title, description, breadcrumb, header, prose HTML, disclaimer, step-nav, author, date, read-time) out of each existing article; a pure renderer emits a brand-new page from a template that uses the Phase 1 JS-injected chrome + new fonts/CSS and drops the old left sidebar / `page-layout` two-column wrapper. A migration driver classifies each page (article vs hub-index) and applies the right transform; hub pages get a lighter chrome-only swap pending their Phase 3 restructure. Vanilla static, no build tools; logic units unit-tested with `node:test`.

**Tech Stack:** HTML5, vanilla CSS (modular tokens + components from Phase 1), vanilla JS ES modules, Node.js ≥ 20 (`node:test`).

## Global Constraints

- **No build tools / no runtime dependencies.** Tests use only Node built-ins.
- **Type system (from Phase 1):** Instrument Serif (display) / Source Serif 4 (body) / IBM Plex Mono (mono). Accent `#dc2626`; amber ticker tokens `--color-ticker-text`/`--color-ticker-bg`.
- **Byline format (exact):** editorial style — `By <Author> · <Month DD, YYYY> · <N> min read`. Author is `Gojo (AI analyst)` for any `/gojo/` page, `Tui Alailima` for `/moneyhub/` and `/healthhub/`.
- **AI disclaimer:** preserve on every page that currently has one (`class="disclaimer"`, 71 pages — all Gojo). Restyle as a callout; do not invent it on non-Gojo pages.
- **Drop the left sidebar** (`sidebar-nav`) and `page-layout` two-column wrapper on **article** pages. Keep them on the 8 hub/index pages (Phase 3 restructures those).
- **Chrome reuse:** every migrated page uses the Phase 1 chrome — `<header class="chrome-header" id="site-header" aria-label="Site header"></header>`, `<footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>`, and module scripts `chrome.mjs`, `search.mjs`. Article pages additionally load `article.mjs`.
- **Headshot/bio:** never reintroduce `TYR1.00_00_19_20.Still002.JPG` / `TYR1.00_00_21_05.Still001.JPG`. Bio phrase stays `Builder, investor, construction professional.`
- **Article prose is preserved verbatim** — the inner HTML of `<div class="article__content">` is carried over unchanged; we restyle via CSS, we do not rewrite prose.
- **Idempotent migration:** re-running the migration on an already-migrated page must be a no-op (detect the new chrome and skip).
- **Dev server for JS:** serve with `python3 -m http.server 8000`; module scripts + `fetch` need HTTP.

---

## File Structure (Phase 2)

```
scripts/
  lib/extract-post.mjs        MODIFY  fix decode() — numeric + extended named entities
  lib/extract-article.mjs     CREATE  pure: parse full article fields from existing HTML
  lib/render-article.mjs      CREATE  pure: fields → new article page HTML string
  lib/page-head.mjs           CREATE  pure: shared <head> builder (fonts/css/meta)
  migrate-pages.mjs           CREATE  driver: classify + rewrite all pages (dry-run/apply)
resources/
  css/components/article.css  CREATE  kicker, byline, disclaimer callout, prose, toc rail, related, step-nav
  css/style.css               MODIFY  @import article.css
  js/article.mjs              CREATE  build "On this page" TOC + related from headings/index; mount
index.html                    MODIFY  remove "Who I am" section
test/
  decode.test.mjs             CREATE  numeric/extended entity decoding
  extract-article.test.mjs    CREATE
  render-article.test.mjs     CREATE
  article-enhance.test.mjs    CREATE  TOC + related pure builders
  migrate-classify.test.mjs   CREATE  page classification + idempotency guard
```

---

### Task 1: Fix entity decoding (Phase 2 prerequisite)

**Files:**
- Modify: `scripts/lib/extract-post.mjs` (the `decode()` helper + its `ENTITIES` map)
- Create: `test/decode.test.mjs`

**Interfaces:**
- Produces: `decode(s)` now resolves numeric entities (`&#8217;`, `&#x2019;`) and an extended named set (`&rarr;`, `&times;`, `&deg;`, `&trade;`, `&copy;`) in addition to the existing set. `extractPost`'s output shape is unchanged.

- [ ] **Step 1: Write the failing test**

`test/decode.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPost } from '../scripts/lib/extract-post.mjs';

test('decodes numeric decimal entities in summary', () => {
  const html = `<h1 class="article__title">T</h1><meta name="description" content="Don&#8217;t fight the tape &#8212; it&#39;s 4.1%.">`;
  const p = extractPost(html, '/gojo/stocks/x-2026-01-01.html');
  assert.equal(p.summary, 'Don’t fight the tape — it’s 4.1%.');
});

test('decodes hex numeric entities', () => {
  const html = `<h1 class="article__title">A &#x2192; B</h1>`;
  const p = extractPost(html, '/gojo/stocks/x-2026-01-01.html');
  assert.equal(p.title, 'A → B');
});

test('decodes extended named entities', () => {
  const html = `<h1 class="article__title">Up 3&deg; &times; 2 &rarr; done</h1>`;
  const p = extractPost(html, '/gojo/notes/2026-01-01-notes.html');
  assert.equal(p.title, 'Up 3° × 2 → done');
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/decode.test.mjs`
Expected: FAIL — current `decode()` leaves `&#8217;`/`&#x2192;`/`&rarr;` literal.

- [ ] **Step 3: Update `extract-post.mjs`**

In `scripts/lib/extract-post.mjs`, extend the `ENTITIES` map to include:
```js
  '&times;':'×','&deg;':'°','&trade;':'™','&copy;':'©','&rarr;':'→','&larr;':'←','&hellip;':'…','&ndash;':'–'
```
(keep all existing entries) and replace the `decode` function with:
```js
function decode(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-zA-Z]+;/g, m => ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}
```

- [ ] **Step 4: Run all tests — verify pass**

Run: `npm test`
Expected: PASS — new `decode` tests green AND the existing `extract-post` tests still pass (they used `&amp;`, `&mdash;`, etc., all still mapped).

- [ ] **Step 5: Rebuild the index so committed data reflects the fix**

Run: `npm run build:index`
Then verify the previously-broken summaries are clean:
Run: `node -e "const a=require('./resources/data/search-index.json'); console.log(a.filter(p=>/&#\d|&rarr;|&#x/.test(p.summary+p.title)).length)"`
Expected: `0`.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/extract-post.mjs test/decode.test.mjs resources/data/search-index.json
git commit -m "fix: decode numeric and extended HTML entities in metadata"
```

---

### Task 2: Remove the home "Who I am" block

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Remove the section**

In `index.html`, delete the entire `<section class="identity" id="about"> … </section>` block (the bottom "Who I am" block, including its `<noscript>`-adjacent content if inside it — keep the `<noscript>` feed fallback that sits with `#latest-feed`). The page should end its `<main>` after the `feed` section. Leave the chrome footer and module scripts intact. Also remove the `id="about"`-targeting `About me` link's reliance on that anchor: in this file the hero CTA `<a class="btn btn--secondary" href="/#about">About me</a>` should now point to `/about/` (the Phase 3 About page) — change its href to `/about/`.

- [ ] **Step 2: Verify structurally**

Run: `python3 -m http.server 8000 >/tmp/h.log 2>&1 & sleep 1; curl -s http://localhost:8000/ | grep -c 'Who I am'; curl -s http://localhost:8000/ | grep -c 'id="latest-feed"'; pkill -f http.server`
Expected: `0` for "Who I am", `1` for the feed (feed retained, about block gone).

- [ ] **Step 3: Verify tests still pass**

Run: `npm test`
Expected: PASS (unchanged count).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: drop redundant Who I am block from home (moves to About page in Phase 3)"
```

---

### Task 3: Shared page-head builder

**Files:**
- Create: `scripts/lib/page-head.mjs`
- Create: `test/render-article.test.mjs` (shared test file; head tests live here too)

**Interfaces:**
- Produces: `renderHead({ title, description }) => string` — the `<head>…</head>` inner HTML with the new Google Fonts link (Instrument Serif / Source Serif 4 / IBM Plex Mono), favicon, `style.css`, and early `theme.js`. Used by `render-article.mjs` and the hub chrome-swap.

- [ ] **Step 1: Write the failing test**

`test/render-article.test.mjs` (start it with the head tests):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHead } from '../scripts/lib/page-head.mjs';

test('head includes new fonts, css, theme, and escaped title/description', () => {
  const h = renderHead({ title: 'SPY & the Fed', description: 'A "tight" read <here>' });
  assert.match(h, /Instrument\+Serif/);
  assert.match(h, /Source\+Serif\+4/);
  assert.match(h, /IBM\+Plex\+Mono/);
  assert.match(h, /\/resources\/css\/style\.css/);
  assert.match(h, /\/resources\/js\/theme\.js/);
  assert.match(h, /<title>SPY &amp; the Fed<\/title>/);
  assert.match(h, /content="A &quot;tight&quot; read &lt;here&gt;"/);
  assert.doesNotMatch(h, /Inter|Fraunces|JetBrains/);
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/render-article.test.mjs`
Expected: FAIL — `page-head.mjs` missing.

- [ ] **Step 3: Implement `page-head.mjs`**

`scripts/lib/page-head.mjs`:
```js
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FONTS = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap';

export function renderHead({ title, description }) {
  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="icon" href="/resources/images/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONTS}" rel="stylesheet">
  <script src="https://kit.fontawesome.com/ed35775394.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="/resources/css/style.css">
  <script src="/resources/js/theme.js"></script>`;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `node --test test/render-article.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/page-head.mjs test/render-article.test.mjs
git commit -m "feat: shared page-head builder with new font stack"
```

---

### Task 4: Article fields extractor

**Files:**
- Create: `scripts/lib/extract-article.mjs`
- Create: `test/extract-article.test.mjs`
- Create: `test/fixtures/full-article.html`

**Interfaces:**
- Consumes: `extractPost` (for section/type/ticker/date) from Task 1.
- Produces: `extractArticle(html, url) => { url, title, description, headerTitle, subtitle, contentHtml, breadcrumb: [{label, href}], hasDisclaimer, disclaimerText, stepNavHtml, author, date, readTime, section, type, ticker }`
  - `headerTitle`/`subtitle`: inner HTML of `h1.article__title` / `p.article__subtitle` (kept as-is, not entity-decoded — they're rendered into the page).
  - `contentHtml`: inner HTML of `div.article__content` verbatim.
  - `breadcrumb`: parsed `<ol>` items of `nav.breadcrumb` as `{label, href}` (last item has `href:null`).
  - `author`: `Gojo (AI analyst)` if url starts `/gojo/`, else `Tui Alailima`.
  - `readTime`: `Math.max(1, round(words/220))` where words counts text in `contentHtml`.

- [ ] **Step 1: Create the fixture**

`test/fixtures/full-article.html` — a trimmed real-shape stock article:
```html
<!DOCTYPE html><html lang="en" data-theme="light"><head>
<title>SPY Market Review — June 28, 2026 | Gojo Stock Takes</title>
<meta name="description" content="SPY closed at $728.99.">
</head><body>
<nav class="nav-global">OLD NAV</nav>
<nav class="nav-mobile">OLD MOBILE</nav>
<div class="page-layout">
<aside class="sidebar-nav">OLD SIDEBAR</aside>
<main class="page-content">
<div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><ol>
<li><a href="/">Home</a></li><li><a href="/gojo/">Gojo</a></li><li aria-current="page">SPY Market Review</li>
</ol></nav></div>
<div class="container"><aside class="disclaimer"><p class="disclaimer__text">AI-generated. Not advice.</p></aside></div>
<article class="article"><header class="article__header">
<h1 class="article__title">SPY Market Review &mdash; June 28, 2026</h1>
<p class="article__subtitle">SPY closed the week at $728.99.</p>
</header><div class="article__content">
<p>First paragraph with several words here to compute a read time correctly.</p><h2>What moved</h2><p>More words.</p>
</div></article>
<footer class="footer">OLD FOOTER</footer>
</main></div>
<script src="/resources/js/navigation.js"></script>
</body></html>
```

- [ ] **Step 2: Write the failing test**

`test/extract-article.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractArticle } from '../scripts/lib/extract-article.mjs';

const html = readFileSync(new URL('./fixtures/full-article.html', import.meta.url), 'utf8');
const a = extractArticle(html, '/gojo/stocks/spy-market-review-2026-06-28.html');

test('extracts header, subtitle, and verbatim content', () => {
  assert.match(a.headerTitle, /SPY Market Review/);
  assert.match(a.subtitle, /\$728\.99/);
  assert.match(a.contentHtml, /<h2>What moved<\/h2>/);
  assert.match(a.contentHtml, /First paragraph/);
});

test('parses the breadcrumb trail', () => {
  assert.deepEqual(a.breadcrumb, [
    { label: 'Home', href: '/' },
    { label: 'Gojo', href: '/gojo/' },
    { label: 'SPY Market Review', href: null },
  ]);
});

test('detects disclaimer and sets Gojo author', () => {
  assert.equal(a.hasDisclaimer, true);
  assert.match(a.disclaimerText, /Not advice/);
  assert.equal(a.author, 'Gojo (AI analyst)');
});

test('computes a positive read time and carries section/ticker/date', () => {
  assert.ok(a.readTime >= 1);
  assert.equal(a.section, 'Gojo');
  assert.equal(a.ticker, 'SPY');
  assert.equal(a.date, '2026-06-28');
});

test('non-gojo pages get Tui as author', () => {
  const w = extractArticle('<article class="article"><header class="article__header"><h1 class="article__title">Money</h1></header><div class="article__content"><p>hi</p></div></article>', '/moneyhub/step1-know-your-money.html');
  assert.equal(w.author, 'Tui Alailima');
});
```

- [ ] **Step 3: Run — verify it fails**

Run: `node --test test/extract-article.test.mjs`
Expected: FAIL — `extract-article.mjs` missing.

- [ ] **Step 4: Implement `extract-article.mjs`**

`scripts/lib/extract-article.mjs`:
```js
import { extractPost } from './extract-post.mjs';

function inner(re, html) { const m = html.match(re); return m ? m[1].trim() : ''; }

function parseBreadcrumb(html) {
  const ol = inner(/<nav class="breadcrumb"[^>]*>\s*<ol>([\s\S]*?)<\/ol>/, html);
  if (!ol) return [];
  const items = [...ol.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(m => m[1].trim());
  return items.map(li => {
    const a = li.match(/<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (a) return { label: a[2].replace(/<[^>]+>/g, '').trim(), href: a[1] };
    return { label: li.replace(/<[^>]+>/g, '').trim(), href: null };
  });
}

function wordCount(htmlFragment) {
  return htmlFragment.replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').split(/\s+/).filter(Boolean).length;
}

export function extractArticle(html, url) {
  const post = extractPost(html, url);
  const headerTitle = inner(/<h1 class="article__title">([\s\S]*?)<\/h1>/, html);
  const subtitle = inner(/<p class="article__subtitle">([\s\S]*?)<\/p>/, html);
  const contentHtml = inner(/<div class="article__content">([\s\S]*?)<\/div>\s*<\/article>/, html)
    || inner(/<div class="article__content">([\s\S]*?)<\/div>/, html);
  const stepNavHtml = inner(/(<nav class="step-nav-footer">[\s\S]*?<\/nav>)/, html);
  const disc = html.match(/<aside class="disclaimer">[\s\S]*?<p class="disclaimer__text">([\s\S]*?)<\/p>/);
  return {
    url,
    title: post.title,
    description: inner(/<meta name="description" content="([\s\S]*?)">/, html),
    headerTitle, subtitle, contentHtml,
    breadcrumb: parseBreadcrumb(html),
    hasDisclaimer: !!disc,
    disclaimerText: disc ? disc[1].replace(/\s+/g, ' ').trim() : '',
    stepNavHtml,
    author: url.startsWith('/gojo/') ? 'Gojo (AI analyst)' : 'Tui Alailima',
    date: post.date, section: post.section, type: post.type, ticker: post.ticker,
    readTime: Math.max(1, Math.round(wordCount(contentHtml) / 220)),
  };
}
```

- [ ] **Step 5: Run — verify pass**

Run: `node --test test/extract-article.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/extract-article.mjs test/extract-article.test.mjs test/fixtures/full-article.html
git commit -m "feat: full article-fields extractor for migration"
```

---

### Task 5: Article page renderer

**Files:**
- Create: `scripts/lib/render-article.mjs`
- Modify: `test/render-article.test.mjs` (append renderer tests)

**Interfaces:**
- Consumes: `renderHead` (Task 3); the field object from `extractArticle` (Task 4).
- Produces: `renderArticle(fields) => string` — a complete HTML document using the Phase 1 chrome mounts, dropping the old sidebar/page-layout. Includes: chrome header, breadcrumb (rebuilt), kicker (section + ticker), `h1` title, editorial byline, AI-disclaimer callout (only if `hasDisclaimer`), the verbatim `contentHtml` inside a reading column, optional `stepNavHtml`, an empty `#article-rail` for the JS-built TOC/related, chrome footer, and module scripts (`chrome.mjs`, `search.mjs`, `article.mjs`).

- [ ] **Step 1: Append failing tests**

Add to `test/render-article.test.mjs`:
```js
import { renderArticle } from '../scripts/lib/render-article.mjs';

const fields = {
  url: '/gojo/stocks/spy-x.html', title: 'SPY Review', description: 'desc',
  headerTitle: 'SPY Review', subtitle: 'A close read.', contentHtml: '<p>Body</p><h2>Section</h2>',
  breadcrumb: [{label:'Home',href:'/'},{label:'Gojo',href:'/gojo/'},{label:'SPY Review',href:null}],
  hasDisclaimer: true, disclaimerText: 'AI-generated. Not advice.', stepNavHtml: '',
  author: 'Gojo (AI analyst)', date: '2026-06-28', section: 'Gojo', type: 'market-take', ticker: 'SPY', readTime: 6,
};

test('renders chrome mounts and drops old structure', () => {
  const h = renderArticle(fields);
  assert.match(h, /id="site-header"/);
  assert.match(h, /id="site-footer"/);
  assert.match(h, /id="article-rail"/);
  assert.doesNotMatch(h, /nav-global|sidebar-nav|page-layout/);
  assert.match(h, /resources\/js\/chrome\.mjs/);
  assert.match(h, /resources\/js\/article\.mjs/);
});

test('renders kicker, title, editorial byline, and verbatim content', () => {
  const h = renderArticle(fields);
  assert.match(h, /class="kicker"[^>]*>[\s\S]*GOJO[\s\S]*SPY/);
  assert.match(h, /<h1 class="article__title">SPY Review<\/h1>/);
  assert.match(h, /By <b>Gojo \(AI analyst\)<\/b>/);
  assert.match(h, /June 28, 2026/);
  assert.match(h, /6 min read/);
  assert.match(h, /<p>Body<\/p><h2>Section<\/h2>/);
});

test('includes disclaimer callout only when hasDisclaimer', () => {
  assert.match(renderArticle(fields), /class="callout callout--ai"/);
  assert.doesNotMatch(renderArticle({ ...fields, hasDisclaimer: false }), /callout--ai/);
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/render-article.test.mjs`
Expected: FAIL — `render-article.mjs` missing.

- [ ] **Step 3: Implement `render-article.mjs`**

`scripts/lib/render-article.mjs`:
```js
import { renderHead } from './page-head.mjs';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function prettyDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${MONTHS[+m[2]-1]} ${+m[3]}, ${m[1]}` : '';
}
const BADGE = { 'market-take':'GOJO','deep-dive':'GOJO','journal':'GOJO','wealth':'WEALTH','health':'HEALTH' };

function crumbs(items) {
  return items.map(c => c.href
    ? `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`
    : `<li aria-current="page">${esc(c.label)}</li>`).join('');
}

export function renderArticle(f) {
  const kicker = [BADGE[f.type] || (f.section || '').toUpperCase(), f.ticker].filter(Boolean).map(esc).join(' · ');
  const dateBits = [prettyDate(f.date), f.readTime ? `${f.readTime} min read` : ''].filter(Boolean).map(esc).join(' · ');
  const byline = `By <b>${esc(f.author)}</b>${dateBits ? ' · ' + dateBits : ''}`;
  const disclaimer = f.hasDisclaimer ? `
        <aside class="callout callout--ai">
          <span class="callout__icon" aria-hidden="true">▲</span>
          <p>${esc(f.disclaimerText || 'AI-generated by Gojo. Not financial advice — do your own research.')}</p>
        </aside>` : '';
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>${renderHead({ title: f.title, description: f.description })}
</head>
<body>
  <header class="chrome-header" id="site-header" aria-label="Site header"></header>
  <main class="article-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>${crumbs(f.breadcrumb)}</ol></nav>
    <div class="article-page__grid">
      <article class="article">
        <header class="article__header">
          <span class="kicker">${kicker}</span>
          <h1 class="article__title">${f.headerTitle}</h1>
          <p class="byline">${byline}</p>
        </header>${disclaimer}
        ${f.subtitle ? `<p class="article__lead">${f.subtitle}</p>` : ''}
        <div class="article__content">${f.contentHtml}</div>
        ${f.stepNavHtml || ''}
      </article>
      <aside class="article-rail" id="article-rail" data-url="${esc(f.url)}" data-ticker="${esc(f.ticker)}" data-section="${esc(f.section)}"></aside>
    </div>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
  <script type="module" src="/resources/js/article.mjs"></script>
</body>
</html>
`;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `node --test test/render-article.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/render-article.mjs test/render-article.test.mjs
git commit -m "feat: article page renderer on new chrome + editorial byline"
```

---

### Task 6: Article CSS

**Files:**
- Create: `resources/css/components/article.css`
- Modify: `resources/css/style.css` (@import)

**Interfaces:** styles the classes emitted by `render-article.mjs` + `article.mjs`: `.article-page`, `.article-page__grid`, `.kicker` (exists from Phase 1 feed.css — reuse, don't redefine), `.byline` (exists — reuse), `.article__lead`, `.article__content` prose, `.callout--ai`, `.article-rail`, `.article-rail__toc`, `.article-rail__related`, `.step-nav-footer`.

- [ ] **Step 1: Create `article.css`**

`resources/css/components/article.css`:
```css
.article-page { max-width: var(--width-content-xl); margin: 0 auto; padding: var(--space-6) var(--space-5) var(--space-16); }
.article-page__grid { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: var(--space-12); align-items: start; }
.article { min-width: 0; max-width: var(--width-content-md); }
.article__header { margin-bottom: var(--space-6); }
.article__title { font-family: var(--font-display); font-weight: 400; font-size: var(--text-4xl); line-height: 1.08; margin: var(--space-3) 0 var(--space-4); }
.article__lead { font-size: var(--text-lg); line-height: var(--leading-relaxed); color: var(--color-text-primary); margin-bottom: var(--space-6); }
.article__content { font-size: var(--text-base); line-height: var(--leading-relaxed); color: var(--color-text-secondary); }
.article__content p { margin-bottom: var(--space-5); }
.article__content h2 { font-family: var(--font-display); font-weight: 400; font-size: var(--text-2xl); color: var(--color-text-primary); margin: var(--space-10) 0 var(--space-4); scroll-margin-top: 90px; }
.article__content h3 { font-size: var(--text-xl); font-weight: var(--weight-semibold); color: var(--color-text-primary); margin: var(--space-8) 0 var(--space-3); scroll-margin-top: 90px; }
.article__content a { color: var(--color-accent-primary); }
.article__content ul, .article__content ol { margin: 0 0 var(--space-5) var(--space-6); }
.article__content li { margin-bottom: var(--space-2); }
.callout--ai { display: flex; gap: var(--space-3); background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-left: 3px solid var(--color-accent-primary); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-6); font-size: var(--text-sm); color: var(--color-text-tertiary); }
.callout--ai .callout__icon { color: var(--color-accent-primary); }
.article-rail { position: sticky; top: 90px; font-size: var(--text-sm); }
.article-rail__label { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: .12em; text-transform: uppercase; color: var(--color-text-quaternary); margin-bottom: var(--space-3); }
.article-rail__toc a { display: block; color: var(--color-text-tertiary); text-decoration: none; padding: 4px 0 4px var(--space-3); border-left: 2px solid var(--color-border); }
.article-rail__toc a.is-sub { padding-left: var(--space-5); }
.article-rail__toc a:hover, .article-rail__toc a.is-active { color: var(--color-accent-primary); border-left-color: var(--color-accent-primary); }
.article-rail__related { margin-top: var(--space-8); }
.article-rail__related a { display: block; color: var(--color-text-secondary); text-decoration: none; padding: var(--space-2) 0; border-top: 1px solid var(--color-border); }
.article-rail__related a:hover { color: var(--color-accent-primary); }
.step-nav-footer { display: flex; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-12); padding-top: var(--space-6); border-top: 1px solid var(--color-border); }
@media (max-width: 860px) { .article-page__grid { grid-template-columns: 1fr; } .article-rail { position: static; display: none; } }
```

- [ ] **Step 2: Import it**

In `resources/css/style.css` add (with the other component imports): `@import url('components/article.css');`

- [ ] **Step 3: Verify tokens + import**

Run: `grep -n "article.css" resources/css/style.css` (shows import); `grep -nE "weight-semibold|width-content-md|leading-relaxed" resources/css/tokens.css` (all exist). `npm test` → unchanged pass.

- [ ] **Step 4: Commit**

```bash
git add resources/css/components/article.css resources/css/style.css
git commit -m "feat: article reading-page styles + right rail"
```

---

### Task 7: Article enhancer (TOC + related)

**Files:**
- Create: `resources/js/article.mjs`
- Create: `test/article-enhance.test.mjs`

**Interfaces:**
- Produces (pure, testable): `buildToc(headings) => string` where `headings` is `[{id, text, level}]` (level 2 or 3) → HTML anchors (`.is-sub` for level 3); returns `''` for fewer than 2 headings. `buildRelated(index, {url, ticker, section}, limit=5) => string` → related-post anchors (same ticker first, then same section), excluding the current `url`.
- Browser-only `mountArticle(doc)`: assigns ids to `.article__content h2,h3`, builds the rail TOC + related (fetching `/resources/data/search-index.json`), injects into `#article-rail`. Guarded by `typeof document`.

- [ ] **Step 1: Write failing tests**

`test/article-enhance.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildToc, buildRelated } from '../resources/js/article.mjs';

test('buildToc returns anchors for h2/h3 and marks subs', () => {
  const html = buildToc([{id:'a',text:'What moved',level:2},{id:'b',text:'Detail',level:3}]);
  assert.match(html, /href="#a"[^>]*>What moved/);
  assert.match(html, /class="is-sub"[^>]*href="#b"/);
});

test('buildToc returns empty for <2 headings', () => {
  assert.equal(buildToc([{id:'a',text:'Only',level:2}]), '');
});

test('buildRelated prefers same ticker, excludes current, respects limit', () => {
  const index = [
    { url:'/cur', ticker:'SPY', section:'Gojo', title:'Current' },
    { url:'/a', ticker:'SPY', section:'Gojo', title:'Another SPY' },
    { url:'/b', ticker:'ORCL', section:'Gojo', title:'Oracle' },
  ];
  const html = buildRelated(index, { url:'/cur', ticker:'SPY', section:'Gojo' }, 5);
  assert.match(html, /href="\/a"/);
  assert.doesNotMatch(html, /href="\/cur"/);
  assert.ok(html.indexOf('/a') < html.indexOf('/b'), 'same-ticker first');
});

test('buildRelated escapes titles', () => {
  const html = buildRelated([{url:'/x',ticker:'',section:'Gojo',title:'<b>Hi</b> & "q"'}], {url:'/cur',ticker:'',section:'Gojo'});
  assert.match(html, /&lt;b&gt;Hi&lt;\/b&gt; &amp; &quot;q&quot;/);
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/article-enhance.test.mjs`
Expected: FAIL — `article.mjs` missing.

- [ ] **Step 3: Implement `article.mjs`**

`resources/js/article.mjs`:
```js
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildToc(headings) {
  if (!headings || headings.length < 2) return '';
  const links = headings.map(h =>
    `<a class="${h.level === 3 ? 'is-sub' : ''}" href="#${esc(h.id)}">${esc(h.text)}</a>`).join('');
  return `<div class="article-rail__label">On this page</div><nav class="article-rail__toc">${links}</nav>`;
}

export function buildRelated(index, { url, ticker, section }, limit = 5) {
  const pool = index.filter(p => p.url !== url);
  const score = p => (ticker && p.ticker === ticker ? 2 : 0) + (p.section === section ? 1 : 0);
  const rows = pool.filter(p => score(p) > 0).sort((a, b) => score(b) - score(a)).slice(0, limit);
  if (!rows.length) return '';
  const links = rows.map(p => `<a href="${esc(p.url)}">${esc(p.title)}</a>`).join('');
  return `<div class="article-rail__related"><div class="article-rail__label">Related</div>${links}</div>`;
}

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50); }

export async function mountArticle(doc = document) {
  const rail = doc.getElementById('article-rail');
  if (!rail) return;
  const heads = [...doc.querySelectorAll('.article__content h2, .article__content h3')].map(el => {
    if (!el.id) el.id = slug(el.textContent);
    return { id: el.id, text: el.textContent, level: el.tagName === 'H3' ? 3 : 2 };
  });
  let related = '';
  try {
    const index = await (await fetch('/resources/data/search-index.json')).json();
    related = buildRelated(index, { url: rail.dataset.url, ticker: rail.dataset.ticker, section: rail.dataset.section });
  } catch { /* offline: skip related */ }
  rail.innerHTML = buildToc(heads) + related;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountArticle());
  else mountArticle();
}
```

- [ ] **Step 4: Run — verify pass**

Run: `node --test test/article-enhance.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/article.mjs test/article-enhance.test.mjs
git commit -m "feat: article TOC + related-posts enhancer"
```

---

### Task 8: Migration driver (classify + transform, dry-run)

**Files:**
- Create: `scripts/migrate-pages.mjs`
- Create: `test/migrate-classify.test.mjs`

**Interfaces:**
- Consumes: `extractArticle` + `renderArticle` (articles); `renderHead` (hub chrome-swap).
- Produces:
  - `classifyPage(html, url) => 'article' | 'hub' | 'migrated' | 'skip'` — `migrated` if it already contains `id="site-header"`; `hub` if filename is `index.html`; `article` if it has `article__content` and is not an index; else `skip`.
  - `swapHubChrome(html) => string` — replaces the `<head>` inner, the `nav-global`+`nav-mobile` block, and the `footer.footer` with the new chrome mounts + scripts, KEEPING `page-layout`/`sidebar-nav`/body (Phase 3 restructures). Idempotent.
  - CLI: `node scripts/migrate-pages.mjs [--apply]` — walks all `.html` under the content + hub dirs (excludes `/resources/`, `/.superpowers/`, `index.html` at repo root), prints a classification summary; with `--apply` writes the transformed files.

- [ ] **Step 1: Write failing classification + idempotency tests**

`test/migrate-classify.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyPage, swapHubChrome } from '../scripts/migrate-pages.mjs';

test('classifies article vs hub vs already-migrated', () => {
  assert.equal(classifyPage('<div class="article__content">x</div>', '/gojo/stocks/a.html'), 'article');
  assert.equal(classifyPage('<aside class="sidebar-nav"></aside>', '/gojo/stocks/index.html'), 'hub');
  assert.equal(classifyPage('<header id="site-header"></header>', '/gojo/stocks/a.html'), 'migrated');
});

test('swapHubChrome is idempotent and injects chrome', () => {
  const old = '<html><head><title>T</title><meta name="description" content="d"></head><body><nav class="nav-global">N</nav><nav class="nav-mobile">M</nav><div class="page-layout"><aside class="sidebar-nav">S</aside><main>BODY</main></div><footer class="footer">F</footer></body></html>';
  const once = swapHubChrome(old);
  assert.match(once, /id="site-header"/);
  assert.match(once, /class="sidebar-nav"/);     // body kept
  assert.doesNotMatch(once, /nav-global/);        // old top nav gone
  assert.equal(swapHubChrome(once), once);        // idempotent
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `node --test test/migrate-classify.test.mjs`
Expected: FAIL — `migrate-pages.mjs` missing.

- [ ] **Step 3: Implement `migrate-pages.mjs`**

`scripts/migrate-pages.mjs`:
```js
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArticle } from './lib/extract-article.mjs';
import { renderArticle } from './lib/render-article.mjs';
import { renderHead } from './lib/page-head.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIRS = ['gojo', 'moneyhub', 'healthhub'];

export function classifyPage(html, url) {
  if (html.includes('id="site-header"')) return 'migrated';
  if (basename(url) === 'index.html') return 'hub';
  if (html.includes('article__content')) return 'article';
  return 'skip';
}

export function swapHubChrome(html) {
  if (html.includes('id="site-header"')) return html;
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1];
  const description = (html.match(/<meta name="description" content="([\s\S]*?)">/) || [, ''])[1];
  let out = html.replace(/<head>[\s\S]*?<\/head>/, `<head>${renderHead({ title, description })}\n</head>`);
  out = out.replace(/<nav class="nav-global">[\s\S]*?<\/nav>\s*<nav class="nav-mobile">[\s\S]*?<\/nav>/,
    '<header class="chrome-header" id="site-header" aria-label="Site header"></header>');
  out = out.replace(/<footer class="footer">[\s\S]*?<\/footer>/,
    '<footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>');
  out = out.replace(/<script src="\/resources\/js\/navigation\.js"><\/script>/,
    '<script type="module" src="/resources/js/chrome.mjs"></script>\n<script type="module" src="/resources/js/search.mjs"></script>');
  return out;
}

function walk(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const full = join(dir, n);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (n.endsWith('.html')) out.push(full);
  }
  return out;
}

function run({ apply }) {
  const counts = { article: 0, hub: 0, migrated: 0, skip: 0 };
  for (const d of DIRS) {
    const abs = join(ROOT, d); try { statSync(abs); } catch { continue; }
    for (const file of walk(abs)) {
      const url = '/' + relative(ROOT, file).split(sep).join('/');
      const html = readFileSync(file, 'utf8');
      const kind = classifyPage(html, url);
      counts[kind]++;
      if (!apply) continue;
      if (kind === 'article') writeFileSync(file, renderArticle(extractArticle(html, url)));
      else if (kind === 'hub') writeFileSync(file, swapHubChrome(html));
    }
  }
  console.log(`${apply ? 'APPLIED' : 'DRY-RUN'} ${JSON.stringify(counts)}`);
}

const isMain = process.argv[1] && process.argv[1].endsWith('migrate-pages.mjs');
if (isMain) run({ apply: process.argv.includes('--apply') });
```

- [ ] **Step 4: Run — verify tests pass + dry-run summary**

Run: `node --test test/migrate-classify.test.mjs` → PASS.
Run: `node scripts/migrate-pages.mjs` (dry-run)
Expected: `DRY-RUN {"article":<A>,"hub":<H>,"migrated":0,"skip":<S>}` where `article` is the large majority (~140 — the Gojo takes/notes/research + moneyhub/healthhub content pages), `hub` equals the number of `index.html` files under gojo/moneyhub/healthhub (~6), and `migrated` is `0` (nothing migrated yet). The repo-root `index.html` is excluded (not under those dirs). **Record the printed `article` and `hub` numbers — Task 9 verifies against them, not against hardcoded counts.**

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-pages.mjs test/migrate-classify.test.mjs
git commit -m "feat: page migration driver (classify + article/hub transforms)"
```

---

### Task 9: Run the migration + rebuild index + verify

**Files:**
- Modify: all article + hub pages under `gojo/`, `moneyhub/`, `healthhub/` (generated by the driver)
- Modify: `resources/data/search-index.json` (rebuilt)

- [ ] **Step 1: Apply on a single sample first (safety)**

Run: `git stash list >/dev/null; cp gojo/stocks/spy-market-review-2026-06-28.html /tmp/spy-before.html`
Run: `node -e "import('./scripts/lib/extract-article.mjs').then(async m=>{const r=await import('./scripts/lib/render-article.mjs');const {readFileSync,writeFileSync}=await import('node:fs');const u='/gojo/stocks/spy-market-review-2026-06-28.html';writeFileSync('gojo/stocks/spy-market-review-2026-06-28.html', r.renderArticle(m.extractArticle(readFileSync('.'+u,'utf8'),u)))})"`
Run: serve + `curl -s http://localhost:8000/gojo/stocks/spy-market-review-2026-06-28.html | grep -c 'id="site-header"\|article__content\|byline\|callout--ai'` → expect ≥4; confirm the prose body still present (`grep -c '728.99'` ≥1). Then restore: `cp /tmp/spy-before.html gojo/stocks/spy-market-review-2026-06-28.html`.

- [ ] **Step 2: Apply the full migration**

Run: `node scripts/migrate-pages.mjs --apply`
Expected: `APPLIED {"article":<A>,"hub":<H>,...}` with the SAME `<A>`/`<H>` the dry-run printed in Task 8 (now `migrated` will be 0 → all transformed this pass). Record `<A>` and `<H>`; let `TOTAL = A + H`.

- [ ] **Step 3: Rebuild the search index**

Run: `npm run build:index`
Expected: `Indexed <N> posts …` where `<N>` equals the count from the Phase 1 build (the migration neither adds nor removes files, so `<N>` is unchanged — ~139); metadata is now decoded clean.

- [ ] **Step 4: Whole-site verification**

Run each; all must hold:
- No old chrome remains: `grep -rl 'nav-global\|class="footer"\|navigation.js' gojo moneyhub healthhub | wc -l` → `0`.
- No old fonts: `grep -rl 'Inter:wght\|Fraunces\|JetBrains' gojo moneyhub healthhub | wc -l` → `0`.
- No old photos: `grep -rl 'TYR1.00_00' . --include=*.html | grep -v .superpowers | wc -l` → `0`.
- Every page got new chrome: `grep -rl 'id="site-header"' gojo moneyhub healthhub | wc -l` → equals `TOTAL` (A + H from Step 2).
- Sidebar kept only on hubs: `grep -rl 'sidebar-nav' gojo moneyhub healthhub | wc -l` → equals `H` (the hub count; articles dropped it).
- Serve + spot-check three pages return 200 and contain `article__content`: a stock take, a journal note, a moneyhub step. Confirm a Gojo page has `callout--ai` and a moneyhub page does NOT.
- `npm test` → all green.

- [ ] **Step 5: Commit**

```bash
git add gojo moneyhub healthhub resources/data/search-index.json
git commit -m "refactor: migrate all article + hub pages to new chrome/article template"
```

---

## Self-Review

**Spec coverage:** Article template (kicker/title/byline/disclaimer/prose/rail) — Tasks 4–7 ✓. 147-page migration (articles full, hubs chrome-only) — Tasks 8–9 ✓. `decode()` prerequisite — Task 1 ✓. Home "Who I am" removal — Task 2 ✓. Drop-sidebar-on-articles + keep-on-hubs — Task 5 (renderArticle drops it) + Task 8 (swapHubChrome keeps it) ✓. Byline author rule (Gojo vs Tui) — Task 4 ✓. Disclaimer preserved only where present — Tasks 4–5 ✓. Verbatim prose — Task 4 `contentHtml` + Task 5 injection ✓. Idempotency — Task 8 `classifyPage`→`migrated` + `swapHubChrome` guard ✓.

**Placeholder scan:** none — every step has complete code/commands and concrete expected output.

**Type consistency:** `extractArticle` field object (Task 4) is consumed field-for-field by `renderArticle` (Task 5: `headerTitle, subtitle, contentHtml, breadcrumb, hasDisclaimer, disclaimerText, stepNavHtml, author, date, section, type, ticker, readTime, url, title, description`). `buildToc`/`buildRelated` (Task 7) signatures match their tests. `classifyPage`/`swapHubChrome` (Task 8) match their tests. `renderHead` (Task 3) consumed by Tasks 5 and 8. `#article-rail` `data-*` attributes emitted in Task 5 are read in Task 7 `mountArticle`.

---

## Notes for Phase 3 (next plan)
- Restructure the 8 hub/index pages (Gojo → Market Takes + Journal, Wealth/Health hubs, new About page), and decide `moneyhub`→`wealth` / `healthhub`→`health` directory renames with redirects.
- Build the Market Takes search/filter page (inline filter + ticker chips) on the existing index.
- The About page absorbs the home's removed "Who I am" content (expanded) + AIGA/Build.
- Consolidate the now-four `esc` helpers (chrome/search/feed/article/page-head/render-article) into one shared `resources/js/esc.mjs` + a `scripts/lib/esc.mjs` (deferred from the Phase 1 final review).
