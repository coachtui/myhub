# Tui Alailima — Site Design System

**Version:** 2.0
**Refactored:** June 2026
**Philosophy:** Publishing engine with a sharp front door.

The site is the owned home for depth — indexed, permanent, proof of work. Social handles distribution; this is where the thinking lives. Design decisions follow from one sentence: *be the best place on the internet to read what Tui and Gojo write, wrapped in an identity that tells a first-timer who he is in five seconds.*

---

## Architecture

**Vanilla static site — no build tools.**

- `resources/css/style.css` orchestrates all CSS via `@import`.
- `resources/css/tokens.css` is the single source of truth for every design value.
- Shared chrome (header, nav, search pill, footer, command palette) is JS-injected at runtime by `resources/js/chrome.mjs`, which reads configuration from `resources/js/site-config.mjs`. Every page mounts chrome through a single `<script>` tag; changing `site-config.mjs` or `chrome.mjs` propagates everywhere.
- Listings, feed rows, and section counts are rendered client-side from `resources/data/search-index.json` — no server required.
- The index is rebuilt by `npm run build:index` (runs `scripts/build-index.mjs`). A freshness guard test (`test/index-fresh.test.mjs`) fails CI if the committed index is stale.
- The GitHub Action (`.github/workflows/build-index.yml`) triggers on every push that touches article directories or scripts, runs `npm run build:index`, then commits the refreshed `search-index.json` if it changed.

---

## Typography

Three typefaces, one role each. All served from Google Fonts.

| Token | Family | Role |
|---|---|---|
| `--font-display` | **Instrument Serif**, Georgia, serif | Display headings, article titles, hero text. Weight 400 only — no bold variant is available. |
| `--font-primary` | **Source Serif 4**, Georgia, Times New Roman, serif | All body copy, prose, descriptions, leads. |
| `--font-mono` | **IBM Plex Mono**, ui-monospace, SF Mono, Menlo, monospace | Kickers, meta lines, dates in data rows, ticker tags, `⌘K` keycaps, code. |

### Fluid Type Scale

All sizes use `clamp()` — one value scales across every viewport.

```css
--text-xs:   clamp(0.75rem,  0.7rem  + 0.2vw,  0.875rem);    /* 12–14px  */
--text-sm:   clamp(0.875rem, 0.85rem + 0.2vw,  0.9375rem);   /* 14–15px  */
--text-base: clamp(1rem,     0.95rem + 0.3vw,  1.0625rem);   /* 16–17px  */
--text-lg:   clamp(1.125rem, 1.05rem + 0.4vw,  1.25rem);     /* 18–20px  */
--text-xl:   clamp(1.25rem,  1.15rem + 0.5vw,  1.5rem);      /* 20–24px  */
--text-2xl:  clamp(1.5rem,   1.3rem  + 1vw,    2rem);        /* 24–32px  */
--text-3xl:  clamp(1.875rem, 1.6rem  + 1.4vw,  2.5rem);      /* 30–40px  */
--text-4xl:  clamp(2.25rem,  1.8rem  + 2vw,    3.5rem);      /* 36–56px  */
--text-5xl:  clamp(3rem,     2.5rem  + 2.5vw,  4.5rem);      /* 48–72px  */
```

### Line Heights

```css
--leading-none:    1;
--leading-tight:   1.25;
--leading-snug:    1.375;
--leading-normal:  1.5;
--leading-relaxed: 1.625;
--leading-loose:   2;
```

### Font Weights

```css
--weight-normal:    400;
--weight-medium:    500;
--weight-semibold:  600;
--weight-bold:      700;
--weight-extrabold: 800;
```

---

## Color

### Light Mode

**Backgrounds:**
```css
--color-bg-primary:   #ffffff
--color-bg-secondary: #f8f9fa
--color-bg-tertiary:  #f1f3f5
--color-bg-elevated:  #ffffff
--color-bg-overlay:   rgba(0, 0, 0, 0.03)
```

**Text Hierarchy:**
```css
--color-text-primary:    #1a1a1a
--color-text-secondary:  #4a4a4a
--color-text-tertiary:   #737373
--color-text-quaternary: #a3a3a3
```

**Brand Accent — Red:**
```css
--color-accent-primary:       #dc2626   /* primary links, CTAs, active states */
--color-accent-primary-hover: #b91c1c
--color-accent-secondary:     #f87171
--color-accent-tertiary:      #fef2f2
```

**Markets / Ticker — Amber:**

Used for ticker tags and Gojo kickers so market data pops without competing with the red accent.
```css
--color-ticker-text: #9a6a00
--color-ticker-bg:   #fdf3e0
```

**Borders:**
```css
--color-border:        #e5e7eb
--color-border-strong: #d1d5db
```

**Semantic:**
```css
--color-success:    #10b981
--color-success-bg: #d1fae5
--color-warning:    #f59e0b
--color-warning-bg: #fef3c7
--color-info:       #3b82f6
--color-info-bg:    #dbeafe
```

### Dark Mode

Dark mode is applied via the `[data-theme="dark"]` attribute on `<html>`. The theme toggle in the chrome header writes this attribute and persists the choice in `localStorage`. Every token override is defined in `tokens.css`.

**Backgrounds:**
```css
--color-bg-primary:   #0a0a0a
--color-bg-secondary: #171717
--color-bg-tertiary:  #262626
--color-bg-elevated:  #1a1a1a
--color-bg-overlay:   rgba(255, 255, 255, 0.05)
```

**Text Hierarchy:**
```css
--color-text-primary:    #fafafa
--color-text-secondary:  #d4d4d4
--color-text-tertiary:   #a3a3a3
--color-text-quaternary: #737373
```

**Brand Accent — Softened for dark:**
```css
--color-accent-primary:       #f87171
--color-accent-primary-hover: #fca5a5
--color-accent-secondary:     #dc2626
--color-accent-tertiary:      #450a0a
```

**Markets / Ticker — Amber (dark):**
```css
--color-ticker-text: #f5b13d
--color-ticker-bg:   rgba(245, 177, 61, 0.12)
```

**Borders:**
```css
--color-border:        #404040
--color-border-strong: #525252
```

**Semantic — Adjusted for dark:**
```css
--color-success:    #34d399
--color-success-bg: #064e3b
--color-warning:    #fbbf24
--color-warning-bg: #78350f
--color-info:       #60a5fa
--color-info-bg:    #1e3a8a
```

---

## Spacing

8px base grid. Steps follow a 4px to 128px scale.

```css
--space-0:  0
--space-1:  0.25rem   /*   4px */
--space-2:  0.5rem    /*   8px */
--space-3:  0.75rem   /*  12px */
--space-4:  1rem      /*  16px */
--space-5:  1.25rem   /*  20px */
--space-6:  1.5rem    /*  24px */
--space-8:  2rem      /*  32px */
--space-10: 2.5rem    /*  40px */
--space-12: 3rem      /*  48px */
--space-16: 4rem      /*  64px */
--space-20: 5rem      /*  80px */
--space-24: 6rem      /*  96px */
--space-32: 8rem      /* 128px */
```

---

## Layout

**Max widths:**
```css
--width-content-sm: 42rem   /* 672px  — narrow reading */
--width-content-md: 48rem   /* 768px  — standard reading */
--width-content-lg: 56rem   /* 896px  — wide content */
--width-content-xl: 72rem   /* 1152px — hero / hub sections */
--width-full:       100%
```

**Border radius:**
```css
--radius-none: 0
--radius-sm:   0.25rem   /*   4px — subtle */
--radius-md:   0.5rem    /*   8px — cards */
--radius-lg:   0.75rem   /*  12px — elevated cards */
--radius-xl:   1rem      /*  16px — hero sections */
--radius-2xl:  1.5rem    /*  24px — large elements */
--radius-full: 9999px    /* pills, avatars */
```

---

## Elevation

**Box shadows:**
```css
--shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

Dark mode overrides deepen shadow alpha (0.3–0.7).

**Z-index scale:**
```css
--z-base:     0
--z-dropdown: 10
--z-sticky:   20
--z-fixed:    30
--z-modal:    40
--z-popover:  50
--z-tooltip:  60
--z-overlay:  100
```

---

## Transitions

```css
--transition-fast:   150ms ease;
--transition-base:   200ms ease;
--transition-slow:   300ms ease;
--transition-slower: 400ms ease;

--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Component Library

Eight components, one CSS file each under `resources/css/components/`. All are imported in `resources/css/style.css`.

### chrome (`chrome.css`)

The shared header, primary nav, search pill, theme toggle, and footer — injected into every page by `chrome.mjs`. Configuration (site name, nav links, social links) comes from `site-config.mjs`. Key classes:

- `.chrome-header` / `.chrome-header__inner` — sticky top bar
- `.chrome-nav` / `.chrome-nav__link` — primary navigation links; `aria-current="page"` marks the active item
- `.chrome-search-pill` — compact search button triggering the command palette
- `.chrome-footer` / `.chrome-footer__inner` — footer with logo, nav repeat, and social icon links

### command-palette (`command-palette.css`)

Full-screen modal search, opened by pressing `⌘K` or clicking the search pill. Queries `search-index.json` client-side; returns ranked results by title match, section, and recency. Classes:

- `.cmdk` — the overlay backdrop
- `.cmdk__panel` — the search box and results panel
- `.cmdk__input` — the live search field
- `.cmdk__results` — results list container
- `.cmdk__title` / `.cmdk__date` / `.cmdk__tag` — result row parts (title, date, section badge)
- `.cmdk__active` — highlighted/focused result row
- `.cmdk__empty` — empty-state message when no results match

### feed (`feed.css`)

Home page "Latest" section: bordered data rows of recent posts across all sections. Each row shows a section/ticker badge, article title, and date. Classes:

- `.feed` — the list container
- `.feed-row` — one bordered row
- `.feed-row__badge` — section or ticker label (amber tokens for ticker, accent red for section)
- `.feed-row__title` — article title link
- `.feed-row__date` — mono-styled date

### article (`article.css`)

Reading page layout. Defines the prose column, kicker badge, editorial byline, and content typography. Classes:

- `.article` — page wrapper with constrained reading width
- `.article__header` — kicker + title + subtitle block
- `.article__title` — Instrument Serif display heading
- `.kicker` — section/ticker badge above the title (e.g., `◈ GOJO · SPY`)
- `.article__lead` — Source Serif lead paragraph (subtitle)
- `.byline` — editorial byline (*By Author · Date · N min read*)
- `.article__content` — prose body; `h2`, `h3`, `p`, `ul/ol`, `a` are all styled here

### listing (`listing.css`)

Post-card list pages: Market Takes and Journal. Market Takes adds a live text filter above the list; all filtering is client-side via `market-takes.mjs`. Classes:

- `.listing` — the page container
- `.filter-bar` — text filter field and result count (Market Takes only; `.filter-bar__field` / `.filter-bar__count`)
- `.post-card` — individual post entry (kicker, title, date, summary)
- `.post-card__badge` / `.post-card__badge--ticker` — section or ticker badge
- `.post-card__title` / `.post-card__date` / `.post-card__summary` — card content parts

### hub (`hub.css`)

Section overview pages (Wealth, Health, Gojo). Two layout patterns: a card grid for topic areas and a numbered-step list for the program sequence. Classes:

- `.hub-page` — outer section wrapper
- `.hub-grid` — card grid for topic cards
- `.hub-card` — one topic area card (`.hub-card__icon`, `.hub-card__title`, `.hub-card__desc`)
- `.hub-steps` — numbered program steps (e.g., the Wealth 5-step progression)
- `.hub-step` — one step entry (`.hub-step__num`, `.hub-step__title`, `.hub-step__desc`)

### callout (`callout.css`)

Inline callout block for article content — used for the AI-author disclaimer on Gojo posts and for tips or warnings. Renders as a left-bordered block with a semantic background.

- `.callout` — base callout with border-left accent
- `.callout--warning` — amber-tinted variant
- `.callout--info` — blue-tinted variant
- `.callout--ai` — Gojo AI-author disclosure

### button (`button.css`)

Standalone button component used for CTAs and nav-adjacent actions.

- `.btn` — base button (red accent fill)
- `.btn--secondary` — bordered ghost variant
- `.btn--sm` / `.btn--lg` — size variants

---

## Page Templates

All pages share the same chrome, token, and component kit.

### Home

Identity front door: headshot + bio ("Builder, investor, construction professional.") + compact identity block. Below the fold: live "Latest" feed (`.feed`) of mixed recent posts from all sections, a prominent `⌘K` search entry point, and section entry cards. Social links in the footer.

### Article

Kicker badge (e.g., `◈ GOJO · SPY`) → Instrument Serif headline (`.article__title`) → optional lead paragraph (`.article__lead`) → editorial byline (`.byline`) → AI disclaimer callout (Gojo posts only) → Source Serif prose body with mono data blocks for numbers. A sticky rail anchors "On this page" navigation and related posts.

### Listing (Market Takes / Journal)

**Market Takes:** live text filter field (`.filter-bar`) above a data-row list of takes. Filtering and result counts render from `search-index.json` via `market-takes.mjs`.

**Journal:** reverse-chronological list of diary entries, no filter.

Both use `.post-card` entries showing kicker, title, date, and summary.

### Hub (Wealth / Health / Gojo / Lelouch)

The Lelouch section (added August 2026) mirrors the Gojo pattern: `/lelouch/` intro page on the article template, `/lelouch/stocks/` Stock Takes listing (`type: lelouch-take`, kicker `♟`). Posts follow the same article template with kicker `LELOUCH · <TICKER>`.

### Hub layout details

Section overview with `.hub-steps` for program sequencing (Wealth: Know Your Money through Automate) and `.hub-grid` for topic area cards. Gojo hub includes the "who is Gojo" intro and the AI disclaimer before the two bucket links (Market Takes, Journal).

### About

Bio, AIGA/Build story, contact, social. Rendered using the standard article-page template (`.article-page` / `.article-page__grid` / `.article` / `.article-rail`) — no unique About-specific layout class.

---

## Build and Publish

| Task | Command |
|---|---|
| Rebuild search index | `npm run build:index` |
| Run all tests | `npm test` (54 tests via `node --test`) |

**Freshness guard:** `test/index-fresh.test.mjs` rebuilds the index in memory and compares it to the committed `resources/data/search-index.json`. If they differ, the test fails with: *"search-index.json is stale — run `npm run build:index` and commit the result."*

**Reindex Action (`.github/workflows/build-index.yml`):** triggered on push to `main` when files under `gojo/`, `lelouch/`, `moneyhub/`, `healthhub/`, or `scripts/` change. Runs `npm run build:index` then `node --test`, and commits the refreshed `search-index.json` if it changed (`[skip ci]`).

---

## Removed in the Refactor

The following components existed in v1.0 and were deleted during the Phase 1–4 refactor. Do not reference them as present.

| Removed | Notes |
|---|---|
| `sidebar-nav.css` | Hard-coded per-page sidebar navigation; replaced by JS-injected chrome |
| `navigation.css` | Old navigation bar component; replaced by `.chrome-nav` in `chrome.css` |
| `hero.css` | Two-photo hero section (both TYR Still images); replaced by headshot + identity block |
| `card.css` | Generic card component; hub and listing use their own card patterns |
| `step-progress.css` | Animated step-progress bar; replaced by `.hub-steps` static list |
| `footer.css` | Standalone footer component; footer is now part of the chrome component |
| TYR photo assets | Both TYR Still images removed; single `tui-headshot.png` used site-wide |

---

## Version History

**v2.0 (June 2026)**
- Full rewrite: new typography system (Instrument Serif / Source Serif 4 / IBM Plex Mono)
- JS-injected shared chrome (`chrome.mjs` + `site-config.mjs`)
- Site-wide search via `search-index.json` and command palette (`⌘K`)
- Eight live component files: chrome, command-palette, feed, article, listing, hub, callout, button
- Amber ticker token pair (`--color-ticker-text` / `--color-ticker-bg`)
- Freshness guard test + GitHub Actions reindex
- Single headshot replacing the two TYR photos
- Removed: sidebar-nav, navigation, hero, card, step-progress, footer component files

**v1.0 (February 2026)**
- Initial design system (pre-refactor, "Money Hub" branding)
- Color palette, fluid type scale, dark mode
- Seven original components (since removed or replaced)
