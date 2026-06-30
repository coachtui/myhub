# Site Refactor — Phase 3b: Wealth + Health Hubs + About — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the section restructure — rebuild the Wealth and Health hub index pages and the investing sub-hub on the new chrome (sidebar-less, with a hub-card grid), create the new About page (`/about/`), and put the 7 thin stub content pages on the article template.

**Architecture:** These are bespoke, mostly-static pages (like the Gojo overview from Phase 3a) built on the Phase 1 chrome with a new `hub.css` card-grid component. The hub rebuilds READ the current chrome-swapped page and restructure its existing copy into the new layout (preserving all prose verbatim) — they do not invent content. The stub pages are rebuilt on the article template, carrying their current heading + short intro. Keep existing URLs (`/moneyhub/`, `/healthhub/`) — relabel display to "Wealth"/"Health". Vanilla static, no build tools; `node:test` for the one CSS-token-adjacent check is not needed — verification is serve + curl/grep + the existing suite staying green.

**Tech Stack:** HTML5, vanilla CSS (Phase 1 tokens + components), vanilla JS ES modules (Phase 1 chrome/search reused), Node.js ≥ 20.

## Global Constraints

- **No build tools / no runtime deps.** Existing `node:test` suite (47 tests) must stay green; this phase adds no logic, so it adds no tests.
- **Type system & tokens (Phase 1):** Instrument Serif (display) / Source Serif 4 (body) / IBM Plex Mono (mono). Accent `#dc2626`; tokens not literals where a token exists.
- **Keep paths, relabel only.** URLs stay `/moneyhub/`, `/moneyhub/investing/`, `/healthhub/`. Display labels: **Wealth**, **Health**. The new About page is the one new URL: `/about/`.
- **Chrome reuse:** every page uses the Phase 1 chrome mounts (`<header class="chrome-header" id="site-header" aria-label="Site header">`, `<footer class="chrome-footer" id="site-footer" aria-label="Site footer">`) + module scripts `chrome.mjs`, `search.mjs`. Drop the old `sidebar-nav` / `page-layout` on every rebuilt page.
- **Preserve prose verbatim.** Hub rebuilds carry the existing page's copy (philosophy, principles, step descriptions, disclaimers) unchanged — only the surrounding structure changes. Stub rebuilds carry their existing heading + intro.
- **Disclaimers preserved.** Wealth pages that have the financial disclaimer keep it as a `callout` (it is the author's own "I'm not a CPA…" text, not the Gojo AI disclaimer).
- **Author byline on stub/article pages:** `Tui Alailima` (these are `/moneyhub/` and `/healthhub/` pages).
- **Standard `<head>`:** the new Google Fonts link (Instrument Serif / Source Serif 4 / IBM Plex Mono), favicon, FA kit, `/resources/css/style.css`, early `/resources/js/theme.js`.
- **Dev server:** `python3 -m http.server 8000` (module scripts + fetch need HTTP).

---

## Standard page head (used by every page in this plan)

Every `<head>` in this plan uses exactly this block (only `<title>`/`<meta description>` differ per page):
```html
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>…</title>
  <meta name="description" content="…">
  <link rel="icon" href="/resources/images/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://kit.fontawesome.com/ed35775394.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="/resources/css/style.css">
  <script src="/resources/js/theme.js"></script>
```

---

## File Structure (Phase 3b)

```
resources/css/components/hub.css   CREATE  hub intro + card grid (hub-card, --soon variant)
resources/css/style.css            MODIFY  @import hub.css
moneyhub/index.html                REWRITE Wealth hub
healthhub/index.html               REWRITE Health hub
moneyhub/investing/index.html      REWRITE Investing sub-hub
about/index.html                   CREATE  About page
moneyhub/analysis.html             REWRITE stub → article template
moneyhub/portfolio.html            REWRITE stub → article template
moneyhub/trading-journal.html      REWRITE stub → article template
healthhub/metrics.html             REWRITE stub → article template
healthhub/nutrition.html           REWRITE stub → article template
healthhub/recovery.html            REWRITE stub → article template
healthhub/training.html            REWRITE stub → article template
```

---

### Task 1: Hub CSS (card grid)

**Files:**
- Create: `resources/css/components/hub.css`
- Modify: `resources/css/style.css` (@import)

**Interfaces:** styles `.hub-page`, `.hub-page__head/__kicker/__title/__subtitle`, `.hub-section`, `.hub-section__title`, `.hub-grid`, `.hub-card` (+ `--soon`), `.hub-card__icon/__title/__desc/__meta`, `.hub-steps`, `.hub-step` (+ `__num/__body/__title/__desc`). Reuses the Phase 1 `.callout` for disclaimers and `.kicker` for kickers.

- [ ] **Step 1: Create `hub.css`**

`resources/css/components/hub.css`:
```css
.hub-page { max-width: var(--width-content-lg); margin: 0 auto; padding: var(--space-12) var(--space-5) var(--space-16); }
.hub-page__head { margin-bottom: var(--space-8); }
.hub-page__kicker { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: .12em; text-transform: uppercase; color: var(--color-accent-primary); }
.hub-page__title { font-family: var(--font-display); font-weight: var(--weight-normal); font-size: var(--text-4xl); line-height: 1.05; margin: var(--space-2) 0; }
.hub-page__subtitle { font-size: var(--text-lg); color: var(--color-text-tertiary); max-width: 56ch; }
.hub-prose { font-size: var(--text-base); line-height: var(--leading-relaxed); color: var(--color-text-secondary); max-width: var(--width-content-md); }
.hub-prose p { margin-bottom: var(--space-4); }
.hub-prose ul { margin: 0 0 var(--space-4) var(--space-6); }
.hub-prose li { margin-bottom: var(--space-2); }
.hub-section { margin-top: var(--space-12); }
.hub-section__title { font-family: var(--font-display); font-weight: var(--weight-normal); font-size: var(--text-2xl); margin-bottom: var(--space-2); }
.hub-section__lead { color: var(--color-text-tertiary); font-size: var(--text-base); margin-bottom: var(--space-6); }
/* card grid */
.hub-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4); }
.hub-card { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-decoration: none; background: var(--color-bg-elevated); }
.hub-card:hover { border-color: var(--color-border-strong); }
.hub-card:hover .hub-card__title { color: var(--color-accent-primary); }
.hub-card__icon { font-size: var(--text-2xl); }
.hub-card__title { font-family: var(--font-display); font-weight: var(--weight-normal); font-size: var(--text-xl); color: var(--color-text-primary); }
.hub-card__desc { font-size: var(--text-sm); color: var(--color-text-tertiary); line-height: var(--leading-normal); }
.hub-card__meta { margin-top: auto; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-quaternary); }
.hub-card--soon { opacity: .7; }
.hub-card--soon .hub-card__meta { color: var(--color-accent-primary); }
/* numbered steps */
.hub-steps { display: grid; gap: var(--space-3); }
.hub-step { display: grid; grid-template-columns: 40px 1fr; gap: var(--space-4); padding: var(--space-4) var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-decoration: none; background: var(--color-bg-elevated); }
.hub-step:hover { border-color: var(--color-border-strong); }
.hub-step:hover .hub-step__title { color: var(--color-accent-primary); }
.hub-step__num { font-family: var(--font-display); font-size: var(--text-3xl); color: var(--color-accent-primary); line-height: 1; }
.hub-step__title { font-family: var(--font-display); font-weight: var(--weight-normal); font-size: var(--text-lg); color: var(--color-text-primary); }
.hub-step__desc { font-size: var(--text-sm); color: var(--color-text-tertiary); line-height: var(--leading-normal); margin-top: var(--space-1); }
@media (max-width: 600px) { .hub-step { grid-template-columns: 32px 1fr; } }
```

- [ ] **Step 2: Import it**

In `resources/css/style.css` add (with the other component imports): `@import url('components/hub.css');`

- [ ] **Step 3: Verify**

Run: `grep -n "hub.css" resources/css/style.css` (import present); `grep -nE "color-border-strong|width-content-md|width-content-lg|color-bg-elevated" resources/css/tokens.css` (all exist). Scan for token-literal violations: `grep -nE "font-weight: *(400|600|700)|: *4px|: *8px " resources/css/components/hub.css` — none should appear (use `var(--weight-*)`, `var(--space-*)`). `npm test` → unchanged 47/47.

- [ ] **Step 4: Commit**

```bash
git add resources/css/components/hub.css resources/css/style.css
git commit -m "feat: hub card-grid + numbered-steps styles"
```

---

### Task 2: Rebuild the Wealth hub

**Files:**
- Modify (rewrite): `moneyhub/index.html`

**Context for the implementer:** the CURRENT `moneyhub/index.html` (chrome-swapped) still contains all the copy to preserve: the financial disclaimer ("I'm not a CPA…"), the "My Money Philosophy" prose + the 5 bullet principles (think in decades / automate / kill debt / tax-advantaged / keep simple), and the "Simple 5-Step Path" with the 5 step descriptions. READ that file and carry its prose verbatim into the new structure below. The 5 steps link to `/moneyhub/step1-know-your-money.html` … `/moneyhub/step5-automation.html` (in order: Know Your Money, Kill High-Interest Debt, Build an Emergency Fund, Simple Long-Term Investing, Automate Your Money).

- [ ] **Step 1: Replace `moneyhub/index.html`**

Use this exact shell; fill the marked regions by carrying copy verbatim from the current file:
```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  [STANDARD HEAD — title: "Wealth | Tui Alailima"; description: "How I think about budgeting, saving, and investing for the long term — explained plainly."]
</head>
<body>
  <header class="chrome-header" id="site-header" aria-label="Site header"></header>
  <main class="hub-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li aria-current="page">Wealth</li>
    </ol></nav>
    <header class="hub-page__head">
      <span class="hub-page__kicker">Personal finance</span>
      <h1 class="hub-page__title">Wealth</h1>
      <p class="hub-page__subtitle">How I think about budgeting, saving, and investing for the long term.</p>
    </header>
    <aside class="callout callout--disclaimer">
      <span class="callout__icon" aria-hidden="true">▲</span>
      <p>[CARRY the existing "I'm not a CPA or licensed financial advisor…" disclaimer text verbatim]</p>
    </aside>
    <section class="hub-section">
      <h2 class="hub-section__title">My Money Philosophy</h2>
      <div class="hub-prose">
        [CARRY the existing philosophy prose + the 5-principle bullet list verbatim, as <p> and <ul><li> in .hub-prose]
      </div>
    </section>
    <section class="hub-section">
      <h2 class="hub-section__title">Start here — the 5-step path</h2>
      <p class="hub-section__lead">If you're getting serious about money, this is the order I'd work through.</p>
      <div class="hub-steps">
        <a class="hub-step" href="/moneyhub/step1-know-your-money.html"><span class="hub-step__num">1</span><span><span class="hub-step__title">Know Your Money</span><span class="hub-step__desc">[carry step-1 one-line description]</span></span></a>
        <a class="hub-step" href="/moneyhub/step2-high-interest-debt.html"><span class="hub-step__num">2</span><span><span class="hub-step__title">Kill High-Interest Debt</span><span class="hub-step__desc">[carry step-2 desc]</span></span></a>
        <a class="hub-step" href="/moneyhub/step3-emergency-fund.html"><span class="hub-step__num">3</span><span><span class="hub-step__title">Build an Emergency Fund</span><span class="hub-step__desc">[carry step-3 desc]</span></span></a>
        <a class="hub-step" href="/moneyhub/step4-investing-basics.html"><span class="hub-step__num">4</span><span><span class="hub-step__title">Simple Long-Term Investing</span><span class="hub-step__desc">[carry step-4 desc]</span></span></a>
        <a class="hub-step" href="/moneyhub/step5-automation.html"><span class="hub-step__num">5</span><span><span class="hub-step__title">Automate Your Money</span><span class="hub-step__desc">[carry step-5 desc]</span></span></a>
      </div>
    </section>
    <section class="hub-section">
      <h2 class="hub-section__title">Go deeper</h2>
      <div class="hub-grid">
        <a class="hub-card" href="/moneyhub/investing/"><span class="hub-card__icon">📈</span><span class="hub-card__title">Investing</span><span class="hub-card__desc">Account types, brokerage basics, starter portfolios, and staying invested.</span><span class="hub-card__meta">5 guides →</span></a>
        <a class="hub-card" href="/moneyhub/topics.html"><span class="hub-card__icon">🗂️</span><span class="hub-card__title">Topics &amp; Guides</span><span class="hub-card__desc">Standalone guides on specific money questions.</span><span class="hub-card__meta">Browse →</span></a>
        <a class="hub-card" href="/moneyhub/qa.html"><span class="hub-card__icon">❓</span><span class="hub-card__title">Q&amp;A</span><span class="hub-card__desc">Straight answers to common money questions.</span><span class="hub-card__meta">Read →</span></a>
        <a class="hub-card" href="/gojo/stocks/"><span class="hub-card__icon">◈</span><span class="hub-card__title">Gojo Market Takes</span><span class="hub-card__desc">My AI analyst's live market research — earnings, sector reads, deep dives.</span><span class="hub-card__meta">60 posts →</span></a>
      </div>
    </section>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
</body>
</html>
```
(Replace every `[CARRY …]` / `[STANDARD HEAD …]` marker with the real content as described. No `[…]` markers may remain in the output file.)

- [ ] **Step 2: Serve & verify**

Run: serve, then
- `curl -s http://localhost:8000/moneyhub/ | grep -c 'id="site-header"\|hub-step\|hub-card\|Wealth'` → ≥ `4`
- `curl -s http://localhost:8000/moneyhub/ | grep -c 'nav-global\|sidebar-nav\|\[CARRY\|\[STANDARD'` → `0` (no old chrome, no leftover markers)
- `curl -s http://localhost:8000/moneyhub/ | grep -c 'step1-know-your-money\|step5-automation\|/gojo/stocks/'` → `3` (program + Gojo links present)
Then `pkill -f http.server`. `npm test` → 47/47.

- [ ] **Step 3: Commit**

```bash
git add moneyhub/index.html
git commit -m "feat: rebuild Wealth hub (philosophy + 5-step program + sections)"
```

---

### Task 3: Rebuild the Health hub

**Files:**
- Modify (rewrite): `healthhub/index.html`

**Context:** the current `healthhub/index.html` holds the copy to preserve: the "Under Construction" note, "How I Think About Health" prose (Training / Nutrition / Recovery / Longevity), and "Planned Topics" (Training Frameworks, Nutrition Basics, + Recovery, Metrics). READ it and carry the prose verbatim. The planned-topic cards link to the (now article-template) stub pages: `/healthhub/training.html`, `/healthhub/nutrition.html`, `/healthhub/recovery.html`, `/healthhub/metrics.html`.

- [ ] **Step 1: Replace `healthhub/index.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  [STANDARD HEAD — title: "Health | Tui Alailima"; description: "Training, nutrition, recovery, and long-term performance — how I build a body and mind that lasts."]
</head>
<body>
  <header class="chrome-header" id="site-header" aria-label="Site header"></header>
  <main class="hub-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li aria-current="page">Health</li>
    </ol></nav>
    <header class="hub-page__head">
      <span class="hub-page__kicker">Health &amp; performance</span>
      <h1 class="hub-page__title">Health</h1>
      <p class="hub-page__subtitle">Training, nutrition, recovery, and long-term performance. Building a body and mind that lasts.</p>
    </header>
    <aside class="callout callout--info">
      <span class="callout__icon" aria-hidden="true">🚧</span>
      <p>[CARRY the existing "Under Construction" note verbatim]</p>
    </aside>
    <section class="hub-section">
      <h2 class="hub-section__title">How I think about health</h2>
      <div class="hub-prose">
        [CARRY the existing "How I Think About Health" prose verbatim, incl. the Training/Nutrition/Recovery/Longevity points as a <ul><li> or <p>s]
      </div>
    </section>
    <section class="hub-section">
      <h2 class="hub-section__title">Topics</h2>
      <p class="hub-section__lead">Areas I'm building out.</p>
      <div class="hub-grid">
        <a class="hub-card" href="/healthhub/training.html"><span class="hub-card__icon">💪</span><span class="hub-card__title">Training</span><span class="hub-card__desc">[carry the Training Frameworks one-line desc]</span><span class="hub-card__meta">Read →</span></a>
        <a class="hub-card hub-card--soon" href="/healthhub/nutrition.html"><span class="hub-card__icon">🍽️</span><span class="hub-card__title">Nutrition</span><span class="hub-card__desc">[carry the Nutrition one-line desc]</span><span class="hub-card__meta">Coming soon</span></a>
        <a class="hub-card hub-card--soon" href="/healthhub/recovery.html"><span class="hub-card__icon">🌙</span><span class="hub-card__title">Recovery</span><span class="hub-card__desc">Sleep, stress management, and knowing when to push vs back off.</span><span class="hub-card__meta">Coming soon</span></a>
        <a class="hub-card hub-card--soon" href="/healthhub/metrics.html"><span class="hub-card__icon">📊</span><span class="hub-card__title">Metrics</span><span class="hub-card__desc">What I track and why — the signals worth paying attention to.</span><span class="hub-card__meta">Coming soon</span></a>
      </div>
    </section>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
</body>
</html>
```

- [ ] **Step 2: Serve & verify**

Run: serve, then
- `curl -s http://localhost:8000/healthhub/ | grep -c 'id="site-header"\|hub-card\|Health'` → ≥ `3`
- `curl -s http://localhost:8000/healthhub/ | grep -c 'nav-global\|sidebar-nav\|\[CARRY\|\[STANDARD'` → `0`
- `curl -s http://localhost:8000/healthhub/ | grep -c 'training.html\|nutrition.html\|recovery.html\|metrics.html'` → `4`
Then `pkill -f http.server`. `npm test` → 47/47.

- [ ] **Step 3: Commit**

```bash
git add healthhub/index.html
git commit -m "feat: rebuild Health hub (philosophy + topic cards)"
```

---

### Task 4: Rebuild the Investing sub-hub

**Files:**
- Modify (rewrite): `moneyhub/investing/index.html`

**Context:** the current `moneyhub/investing/index.html` holds an intro to the investing series. READ it and carry any intro prose. The 5 sub-articles are: `account-types.html` (Account Types), `automating-contributions.html` (Automating Contributions), `brokerage-basics.html` (Brokerage Basics), `starter-portfolios.html` (Simple Starter Portfolios), `staying-invested.html` (Staying Invested Through Volatility).

- [ ] **Step 1: Replace `moneyhub/investing/index.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  [STANDARD HEAD — title: "Investing | Wealth | Tui Alailima"; description: "Simple, long-term investing — account types, brokerage basics, starter portfolios, and staying invested."]
</head>
<body>
  <header class="chrome-header" id="site-header" aria-label="Site header"></header>
  <main class="hub-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li><a href="/moneyhub/">Wealth</a></li><li aria-current="page">Investing</li>
    </ol></nav>
    <header class="hub-page__head">
      <span class="hub-page__kicker">Wealth · Investing</span>
      <h1 class="hub-page__title">Investing</h1>
      <p class="hub-page__subtitle">[CARRY the existing investing intro line, or use: "Simple, long-term investing — the parts that actually matter."]</p>
    </header>
    <section class="hub-section">
      <div class="hub-grid">
        <a class="hub-card" href="/moneyhub/investing/account-types.html"><span class="hub-card__title">Account Types</span><span class="hub-card__desc">401(k), IRA, brokerage — which account, and in what order.</span><span class="hub-card__meta">Read →</span></a>
        <a class="hub-card" href="/moneyhub/investing/brokerage-basics.html"><span class="hub-card__title">Brokerage Basics</span><span class="hub-card__desc">Opening an account and the mechanics of buying your first fund.</span><span class="hub-card__meta">Read →</span></a>
        <a class="hub-card" href="/moneyhub/investing/starter-portfolios.html"><span class="hub-card__title">Simple Starter Portfolios</span><span class="hub-card__desc">A few boring, durable portfolios to start from.</span><span class="hub-card__meta">Read →</span></a>
        <a class="hub-card" href="/moneyhub/investing/automating-contributions.html"><span class="hub-card__title">Automating Contributions</span><span class="hub-card__desc">Set it up once so good behavior runs without willpower.</span><span class="hub-card__meta">Read →</span></a>
        <a class="hub-card" href="/moneyhub/investing/staying-invested.html"><span class="hub-card__title">Staying Invested Through Volatility</span><span class="hub-card__desc">The hardest part — not selling when it gets ugly.</span><span class="hub-card__meta">Read →</span></a>
      </div>
    </section>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
</body>
</html>
```

- [ ] **Step 2: Serve & verify**

Run: serve, then
- `curl -s http://localhost:8000/moneyhub/investing/ | grep -c 'id="site-header"\|hub-card'` → ≥ `2`
- `curl -s http://localhost:8000/moneyhub/investing/ | grep -c 'account-types\|brokerage-basics\|starter-portfolios\|automating-contributions\|staying-invested'` → `5`
- `curl -s http://localhost:8000/moneyhub/investing/ | grep -c 'nav-global\|sidebar-nav\|\[CARRY\|\[STANDARD'` → `0`
Then `pkill -f http.server`.

- [ ] **Step 3: Commit**

```bash
git add moneyhub/investing/index.html
git commit -m "feat: rebuild Investing sub-hub"
```

---

### Task 5: Create the About page

**Files:**
- Create: `about/index.html`

**Context:** the home's hero CTA already links to `/about/` (currently 404s). This page absorbs the home's removed "Who I am" content plus the AIGA/Build story and contact. Use the article-page layout (like the Gojo overview). Content is provided in full below (no external file to read).

- [ ] **Step 1: Create `about/index.html`**

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  [STANDARD HEAD — title: "About | Tui Alailima"; description: "Builder, investor, construction professional. Building AIGA, investing long-horizon, and documenting what I learn."]
</head>
<body>
  <header class="chrome-header" id="site-header" aria-label="Site header"></header>
  <main class="article-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li aria-current="page">About</li>
    </ol></nav>
    <div class="article-page__grid">
      <article class="article">
        <header class="article__header">
          <span class="kicker">About</span>
          <h1 class="article__title">Tui Alailima</h1>
          <p class="byline">Builder, investor, construction professional.</p>
        </header>
        <img class="identity__photo" src="/resources/images/tui-headshot.png" alt="Tui Alailima" style="float:right;width:160px;border-radius:var(--radius-lg);margin:0 0 var(--space-4) var(--space-6);">
        <div class="article__content">
          <p>I'm a construction professional with 20 years of field experience. That work taught me how to coordinate complex systems under pressure, read risk clearly, and make decisions with incomplete information on a deadline.</p>
          <p>Outside the job site I'm building <strong>AIGA</strong> — a set of AI-native products that started in construction and expanded from there. I run <a href="/gojo/">Gojo</a>, an AI analyst I built to think through markets and publish research worth reading. I invest with a long time horizon, stay in the gym, and document what I learn along the way.</p>
          <h2>What I'm building</h2>
          <p>AIGA LLC is a multi-domain intelligence company. Current products: <strong>Operator</strong> (AI education), <strong>DVRG</strong> (investment research), <strong>CRU</strong> (construction data), and <strong>AIGA CP</strong> (a construction OS for field teams) — all built from the same foundation: deep domain expertise, applied through AI. <a href="https://aigaai.com" target="_blank" rel="noopener">aigaai.com →</a></p>
          <h2>Around the site</h2>
          <ul>
            <li><a href="/moneyhub/">Wealth</a> — how I think about money and long-term investing.</li>
            <li><a href="/healthhub/">Health</a> — training, nutrition, recovery, longevity.</li>
            <li><a href="/gojo/">Gojo</a> — my AI analyst's market takes and journal.</li>
          </ul>
          <h2>Reach me</h2>
          <p><a href="mailto:tui@tuialailima.com">tui@tuialailima.com</a> · <a href="https://www.instagram.com/coach.tui/" target="_blank" rel="noopener">Instagram</a> · <a href="https://github.com/coachtui" target="_blank" rel="noopener">GitHub</a> · <a href="https://twitter.com/tuialailima" target="_blank" rel="noopener">X</a></p>
        </div>
      </article>
      <aside class="article-rail">
        <div class="article-rail__label">Sections</div>
        <nav class="article-rail__toc">
          <a href="/moneyhub/">Wealth</a>
          <a href="/healthhub/">Health</a>
          <a href="/gojo/">Gojo</a>
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

- [ ] **Step 2: Serve & verify**

Run: serve, then
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/about/` → `200` (no longer 404s)
- `curl -s http://localhost:8000/about/ | grep -c 'id="site-header"\|tui-headshot.png\|AIGA\|construction professional'` → ≥ `4`
- `curl -s http://localhost:8000/about/ | grep -c 'nav-global\|sidebar-nav'` → `0`
Then `pkill -f http.server`.

- [ ] **Step 3: Commit**

```bash
git add about/index.html
git commit -m "feat: add About page (bio + AIGA + sections + contact)"
```

---

### Task 6: Rebuild the 7 stub content pages on the article template

**Files:**
- Modify (rewrite): `moneyhub/analysis.html`, `moneyhub/portfolio.html`, `moneyhub/trading-journal.html`, `healthhub/metrics.html`, `healthhub/nutrition.html`, `healthhub/recovery.html`, `healthhub/training.html`

**Context:** each of these 7 is a ~100-word stub (a heading + a short intro, currently chrome-swapped, no `article__content`). Put each on the article template (sidebar-less), preserving its current heading text and intro prose. They are `/moneyhub/` and `/healthhub/` pages → author byline `Tui Alailima`. No AI disclaimer (these aren't Gojo). Section kickers: Wealth pages → `WEALTH`; Health pages → `HEALTH`.

- [ ] **Step 1: For EACH of the 7 files, read its current heading + intro, then overwrite with this template** (filling per-page values):

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  [STANDARD HEAD — title: "<PageTitle> | <Wealth|Health> | Tui Alailima"; description: carry the page's existing intro sentence]
</head>
<body>
  <header class="chrome-header" id="site-header" aria-label="Site header"></header>
  <main class="article-page">
    <nav class="breadcrumb" aria-label="Breadcrumb"><ol>
      <li><a href="/">Home</a></li><li><a href="/<moneyhub|healthhub>/"><Wealth|Health></a></li><li aria-current="page"><PageTitle></li>
    </ol></nav>
    <div class="article-page__grid">
      <article class="article">
        <header class="article__header">
          <span class="kicker"><WEALTH|HEALTH></span>
          <h1 class="article__title"><PageTitle></h1>
          <p class="byline">By <b>Tui Alailima</b></p>
        </header>
        <div class="article__content">
          [CARRY the page's existing intro prose verbatim as <p>…</p> (one or two short paragraphs)]
        </div>
      </article>
      <aside class="article-rail" id="article-rail" data-url="/<dir>/<file>.html" data-ticker="" data-section="<Wealth|Health>"></aside>
    </div>
  </main>
  <footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>
  <script type="module" src="/resources/js/chrome.mjs"></script>
  <script type="module" src="/resources/js/search.mjs"></script>
  <script type="module" src="/resources/js/article.mjs"></script>
</body>
</html>
```
Per-page values:
- `moneyhub/analysis.html` → title "Analysis", Wealth, kicker WEALTH, dir moneyhub.
- `moneyhub/portfolio.html` → title "Portfolio", Wealth.
- `moneyhub/trading-journal.html` → title "Trading Journal", Wealth.
- `healthhub/training.html` → title "Training", Health, kicker HEALTH, dir healthhub.
- `healthhub/nutrition.html` → title "Nutrition", Health.
- `healthhub/recovery.html` → title "Recovery", Health.
- `healthhub/metrics.html` → title "Metrics", Health.
(No `[…]`/`<…>` markers may remain in any output file.)

- [ ] **Step 2: Serve & verify all 7**

Run: serve, then for each of the 7 confirm `200` and structure:
- `for p in moneyhub/analysis moneyhub/portfolio moneyhub/trading-journal healthhub/training healthhub/nutrition healthhub/recovery healthhub/metrics; do code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/$p.html); echo "$p $code"; done` → all `200`.
- No old chrome / no markers: `grep -rl 'nav-global\|sidebar-nav\|\[CARRY\|<PageTitle>' moneyhub/analysis.html moneyhub/portfolio.html moneyhub/trading-journal.html healthhub/training.html healthhub/nutrition.html healthhub/recovery.html healthhub/metrics.html | wc -l` → `0`.
- All have new chrome + byline: `grep -rl 'id="site-header"' moneyhub/analysis.html moneyhub/portfolio.html moneyhub/trading-journal.html healthhub/training.html healthhub/nutrition.html healthhub/recovery.html healthhub/metrics.html | wc -l` → `7`.
Then `pkill -f http.server`. `npm test` → 47/47.

- [ ] **Step 3: Commit**

```bash
git add moneyhub/analysis.html moneyhub/portfolio.html moneyhub/trading-journal.html healthhub/metrics.html healthhub/nutrition.html healthhub/recovery.html healthhub/training.html
git commit -m "feat: rebuild 7 stub content pages on the article template"
```

---

### Task 7: Whole-section verification

**Files:** none (verification + any small fix surfaced).

- [ ] **Step 1: Verify the Wealth/Health/About surface end-to-end**

Run: `npm test` → 47/47.
Run: serve, then confirm:
- About resolves: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/about/` → `200`; and the home CTA target now works (home links to `/about/`).
- Hubs: `/moneyhub/`, `/healthhub/`, `/moneyhub/investing/` each return 200, have `id="site-header"`, no `nav-global`/`sidebar-nav`.
- No leftover markers anywhere: `grep -rl '\[CARRY\|\[STANDARD\|<PageTitle>\|hub-card__title">$' moneyhub healthhub about | wc -l` → `0`.
- Old chrome fully gone from the rebuilt set: `grep -rl 'nav-global\|class="footer"\|navigation.js' moneyhub/index.html healthhub/index.html moneyhub/investing/index.html about/index.html moneyhub/analysis.html healthhub/training.html | wc -l` → `0`.
- Site-wide: only the deep article pages + these should have site-header now; confirm `grep -rl 'sidebar-nav' moneyhub healthhub | wc -l` → `0` (every Wealth/Health page is now sidebar-less).
Then `pkill -f http.server`.

- [ ] **Step 2: Commit (only if a fix was needed)**

```bash
git add -A
git commit -m "fix: Wealth/Health/About verification adjustments"
```

---

## Self-Review

**Spec coverage (Phase 3b):** Wealth hub rebuilt — Task 2 ✓. Health hub rebuilt — Task 3 ✓. Investing sub-hub — Task 4 ✓. About page (`/about/`, absorbs Who-I-am + AIGA + contact; home CTA now resolves) — Task 5 ✓. 7 stub pages on article template — Task 6 ✓. Keep-paths-relabel (Wealth/Health labels, URLs unchanged) — all tasks ✓. Sidebar dropped everywhere — Tasks 2–6 ✓. Wealth hub links Gojo Market Takes — Task 2 ✓.

**Placeholder scan:** the `[CARRY …]` / `[STANDARD HEAD …]` / `<PageTitle>` markers are explicit fill-instructions for content carried from existing files (not code TODOs); every task's verification asserts ZERO markers remain in the output. The CSS, structure, links, and per-page values are all concrete.

**Type consistency:** all rebuilt pages reuse Phase 1 chrome mounts (`#site-header`/`#site-footer`) + `chrome.mjs`/`search.mjs`; the stub pages additionally load `article.mjs` and include `#article-rail` (consistent with the Phase 2 article template). Hub pages use the `hub.css` classes defined in Task 1; the About + stub pages use the existing `article.css` classes. The `.callout--disclaimer` (Wealth) and `.callout--info` (Health) variants used in Tasks 2–3 are confirmed present in `resources/css/components/callout.css` (alongside `--ai/--success/--warning`) — no new callout CSS needed.

---

## Notes for later phases
- **Phase 4:** wire `build:index` into the cron so new posts auto-appear in the JS-rendered listings (home feed, Market Takes, Journal).
- **Phase 5 (polish):** consolidate the duplicated `esc` helpers into one shared module; full dark-mode + responsive + a11y sweep (including the Phase 1/2/3 deferred minors: z-index scale, off-grid chip paddings, FONTS-href escaping, command-palette focus trap); flesh out the 7 stub pages with real content.
- During the Phase 5 dark-mode/visual sweep, confirm `.callout--disclaimer` / `.callout--info` render distinctly from `.callout--ai` in both themes (all three already exist in `callout.css`).
