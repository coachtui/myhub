# Personal Site Refactor — Design Spec

**Date:** 2026-06-29
**Owner:** Tui Alailima
**Status:** Approved design → ready for implementation plan

---

## 1. North Star

**The site is a publishing engine with a sharp front door.**

IG / X / LinkedIn handle *distribution* (reach, vibes, ephemeral). They're rented land. This site does the thing they structurally can't: it's the **owned home** for depth, it **compounds** (indexed, permanent, findable for years), and it's **proof of work** (120+ real pieces, not a headline). Social points *here*; the real thinking *lives* here.

Concretely, the site's job in one sentence: **be the best place on the internet to read what Tui and Gojo write — wrapped in an identity that tells a first-timer who he is in five seconds.**

Design implications that follow from this:
- The home leads with identity but its *body* is living proof the site is active (latest writing + search).
- Wealth / Health / Gojo are well-organized **reading destinations**, not brochure pages.
- Article pages get real craft (typography, readability, related posts) — reading is the main event.
- Social links live at the edges; the site is the hub they feed.

---

## 2. Information Architecture

### Top navigation (5 items)
`Home · Wealth · Health · Gojo · About`

- **Build / AIGA** is removed from the top nav and folded into **About** (it's an external company link, not a site page — it belongs in the bio).
- The mismatch that made the old site feel "thrown together" (Health, Wealth, Gojo, Build sitting at the same level despite being different *kinds* of things) is resolved: the nav is now four reading destinations + identity.

### Section structure

| Section | Contents |
|---|---|
| **Home** | Identity front door + live "Latest" writing feed + search + section entry points. |
| **Wealth** | Evergreen money education: the 5-step program (Know Your Money → Automate), Topics & Guides, Q&A, portfolio/analysis. Plus a featured link to Gojo's Market Takes. |
| **Health** | Training, Nutrition, Recovery, Metrics. Same kit as Wealth. |
| **Gojo** | Tui's AI analyst as a publication. **Simplified from 3 buckets to 2.** |
| **About** | Bio, the AIGA / Build story, contact, social. |

### Gojo restructure (key change)
- **Before:** Stock Takes (59) · Research (1) · Journal (60) — three buckets, one of which (Research) is effectively empty.
- **After:** **Market Takes** (the 59 stock takes + the 1 research deep-dive, tagged `deep-dive`) and **Journal** (60 diary entries). The standalone Research tab is retired; deep-dives become a tag within Market Takes.
- Gojo stays its own destination (strong brand, ~120 posts, distinct AI voice + disclaimer). Its market articles are cross-linked from Wealth so money-seekers find them without duplication.

---

## 3. Visual System

A **light, technical, "developer-tool / docs-grade"** aesthetic — sharp and precise, deliberately *not* the default AI/startup stack (no Inter/Fraunces, no indigo). Dark mode is retained (existing theme toggle).

### Color
- **Accent: `#dc2626` red** — already the site's brand color; kept. Used sparingly for links, CTAs, active states, focus.
- **Markets/ticker highlight: amber** — `#9a6a00` text on `#fdf3e0` background for ticker tags and Gojo kickers, so market data pops without competing with the red.
- Existing neutral, semantic, and dark-mode tokens are retained and retuned as needed.

### Typography (replaces Inter / Fraunces / JetBrains Mono)
| Role | Typeface | Use |
|---|---|---|
| **Display / headlines** | **Instrument Serif** | High-contrast editorial serif. Article titles, hero, section headers. |
| **Body / prose** | **Source Serif 4** | Crisp, neutral reading serif. All long-form body copy, descriptions, leads. |
| **Mono / labels** | **IBM Plex Mono** | Kickers, dates inside data lines, tickers, data blocks, `⌘K` keycaps, code. |

All three are on Google Fonts (no Fontshare dependency). This pairing is the "voice" of every page.

### Byline / meta line — **Editorial Byline**
Serif italic, understated, magazine-masthead style:
> *By **Gojo** (AI analyst) · June 28, 2026 · 6 min read*

Carries the author, the **(AI) disclosure** (required for Gojo content), date, and read time. Applies to articles and is echoed in feed rows.

### Bio line (global)
**"Builder, investor, construction professional."** — replaces the "$500M job / superintendent" framing everywhere it appears (hero, about, footer).

### Photography
A **single** new professional headshot (`resources/images/tui-headshot.png`) replaces **both** old `TYR…Still` images across the entire site.

---

## 4. Search (intelligent, site-wide)

A first-class feature, not a ticker filter.

- **Scope:** indexes **every article** site-wide — title, summary, body keywords, section, date, and ticker(s). Ranked results. Ticker is *one* signal among several, so `spy`, `emergency fund`, `nuclear`, and `recovery` all find the right pieces across Gojo, Wealth, and Health.
- **Entry points:**
  - A **compact search pill** in the header (small, not the oversized field from early mockups).
  - A **⌘K command palette** that opens the same search from anywhere.
  - On the **Market Takes** page: a live inline filter field + clickable **ticker chips** (type-to-search *and* click-to-filter).
- **Implementation:** a generated `search-index.json` (built by a script that parses article HTML) + a small vanilla-JS command-palette component. No search library needed at ~150 docs.

---

## 5. Page Templates

All share the same kit (chrome, type, color, components).

1. **Home** — identity front door (headshot + bio + compact "spec" identity block), prominent search, and a **live "Latest" feed** of mixed recent posts as bordered data rows (section/ticker badge · title · date), plus section entry points. Social at the footer.
2. **Section hub (Wealth, Health)** — hub header + organized content (program steps, topic rows/cards). Wealth features a link into Gojo Market Takes.
3. **Gojo hub** — short "who is Gojo" intro (AI author) + the two buckets (Market Takes, Journal) + the AI disclaimer.
4. **Market Takes index** — search-first: live filter field + ticker chips + data-row list of takes.
5. **Journal index** — reverse-chronological list of diary entries.
6. **Article reading page** — kicker badge (e.g. `◈ GOJO · SPY`), Instrument Serif headline, editorial byline, **AI disclaimer callout** (Gojo posts), Source Serif prose with mono data blocks for numbers, and a sticky rail (`On this page` + `More <TICKER>` / related). Related-posts footer.
7. **About** — bio, AIGA/Build story, contact, social.

---

## 6. Architecture & Migration

Constraint: **vanilla static site, no build tools** (preserved).

### Shared chrome — JS-injected
Nav, header (with search pill), footer, and the command palette live in **one component JS file**, injected into a mount point on every page. Change the nav once → it updates across all pages. New cron-generated articles include a single `<script>` tag + their article body. (Article *content* stays in static HTML, so SEO/readability is unaffected; only chrome is client-rendered. A minimal `<noscript>` fallback covers nav links.)

### One-time migration script
A Node script (run manually, not a build dependency) converts all **147 existing pages**:
- Standardize `<head>` (new font links, CSS, meta).
- Strip the duplicated hard-coded nav/footer markup.
- Insert the chrome mount point + component `<script>`.
- Normalize breadcrumb + byline to the new editorial format.
- Re-home Gojo Research content into Market Takes (tagged `deep-dive`).

### Article template
A canonical template the cron uses for new Journal/Takes posts, matching the new article page.

### Search index generation
A script parses all article HTML → `search-index.json` (title, summary, section, ticker, date, url). Regenerated on publish/migration.

### CSS
Keep the modular structure (`tokens` + `components`). Update `tokens.css` (fonts; red retained). Add components: command palette, editorial byline, data-row feed, identity/spec block, section hub. Rework `hero` (old two-photo hero retired). Provide dark-mode variants for new tokens.

### Docs
Update `DESIGN-SYSTEM.md` (currently "Money Hub Design System v1.0") to document the new system.

---

## 7. Scope Boundaries

**In scope:** all chrome, navigation, typography, color application, home + all section/hub + article + about templates, Gojo restructure, site-wide search, the 147-page migration, single-headshot swap, new article template, design-system docs.

**Out of scope:** rewriting the *prose* of existing articles (we refresh presentation/chrome/typography, not the words); new content creation; backend/CMS (stays static); changes to the cron's content generation beyond adopting the new template.

---

## 8. Suggested Phasing (for the implementation plan)

1. **Foundation + preview** — new tokens/fonts, shared chrome component, search component shell, and a fully-built **new home page** as the "preview we can start with."
2. **Article template + migration script** — convert all 147 pages to the new chrome/type.
3. **Section hubs + Gojo restructure** — Wealth, Health, Gojo (2 buckets), About.
4. **Search** — index generation + command palette + Market Takes filter UI.
5. **Polish** — dark mode, related-posts, responsive, accessibility pass, `DESIGN-SYSTEM.md`.
