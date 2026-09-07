// Single source of truth for the site's sections and content types.
//
// Consumed by: site-config.mjs (primary nav), scripts/build-index.mjs (which
// directories to index), scripts/lib/extract-post.mjs (URL → section/type),
// scripts/lib/extract-article.mjs (default author), scripts/lib/render-article.mjs
// (kicker), feed.mjs / listing.mjs (badges and labels), counts.mjs (filters).
//
// Browser-safe: no Node imports. Order of SECTIONS is nav order.

export const SITE_ORIGIN = 'https://www.tuialailima.com';

// Authors, keyed by the id stored in <meta name="site:author"> and the index.
export const AUTHORS = {
  tui:     { name: 'Tui Alailima',        ai: false },
  gojo:    { name: 'Gojo (AI analyst)',    ai: true, role: 'Market Research Agent (retired)' },
  lelouch: { name: 'Lelouch (AI analyst)', ai: true, role: 'Operating and Investment Analyst' },
};

// Disclosure notices, keyed by <meta name="site:disclaimer">. `variant` picks the
// callout treatment: "ai" (accent border) for machine-written research and
// journals, "personal" (neutral border) for Tui's own money and health notes.
export const DISCLAIMERS = {
  'ai-market':        { variant: 'ai',       text: 'AI-generated analysis only. Not financial advice. Do your own research.' },
  'ai-journal':       { variant: 'ai',       text: 'AI-generated journal entry. Observations, not advice.' },
  'personal-finance': { variant: 'personal', text: "I'm not a CPA or licensed financial advisor. This explains how I personally think about money. It's for education only, not advice tailored to you." },
  'health':           { variant: 'personal', text: "I'm not a doctor, dietitian, or physical therapist. This explains what works for me. It's for education only, not medical advice." },
};

// Page metadata keys, in the order they are written to <meta name="site:…">.
// section  – SECTIONS id            kind    – hub | page | guide | reference | research | journal | tool | project | note
// author   – AUTHORS id             level   – beginner | intermediate | advanced
// series/order – reading chain      topics  – purpose or subject tags (comma list)
// tickers  – all tickers (comma list; the first is the index's `ticker`)
// published / updated – ISO dates    disclaimer – ai-market | ai-journal | personal-finance | health
export const META_KEYS = ['section', 'kind', 'author', 'level', 'series', 'order', 'topics', 'tickers', 'published', 'updated', 'disclaimer'];

// label – primary nav text; brand – the name used on the section's own pages
// and in breadcrumbs; parent – the nav section a non-nav section sits under.
export const SECTIONS = [
  { id: 'money',    label: 'Money',            brand: 'Moneyhub',         href: '/moneyhub/',  index: 'Wealth',  author: 'Tui Alailima',        ai: false, nav: true },
  { id: 'health',   label: 'Health',           brand: 'Healthhub',        href: '/healthhub/', index: 'Health',  author: 'Tui Alailima',        ai: false, nav: true },
  { id: 'projects', label: 'Work & Projects',  brand: 'Work & Projects',  href: '/projects/',  index: null,      author: 'Tui Alailima',        ai: false, nav: true },
  { id: 'research', label: 'Research & Notes', brand: 'Research & Notes', href: '/research/',  index: null,      author: 'Tui Alailima',        ai: false, nav: true },
  { id: 'about',    label: 'About',            brand: 'About',            href: '/about/',     index: null,      author: 'Tui Alailima',        ai: false, nav: true },
  { id: 'gojo',     label: 'Gojo',             brand: 'Gojo',             href: '/research/gojo/',    index: 'Gojo',    author: 'Gojo (AI analyst)',    ai: true,  nav: false, parent: 'research' },
  { id: 'lelouch',  label: 'Lelouch',          brand: 'Lelouch',          href: '/research/lelouch/', index: 'Lelouch', author: 'Lelouch (AI analyst)', ai: true,  nav: false, parent: 'research' },
];

// Content types, keyed by the `type` value stored in search-index.json.
//   dir     – repo directory whose pages carry this type (URL prefix "/<dir>/")
//   ticker  – whether the first filename segment is a ticker symbol
//   label   – listing card badge when there is no ticker
//   badge   – home-feed badge when there is no ticker (full words, never abbreviations)
//   kicker  – first word of the article kicker
export const TYPES = {
  'lelouch-take': { section: 'lelouch', dir: 'research/lelouch/stocks', ticker: true,  label: 'TAKE',      badge: 'LELOUCH', kicker: 'LELOUCH' },
  'market-take':  { section: 'gojo',    dir: 'research/gojo/stocks',    ticker: true,  label: 'TAKE',      badge: 'GOJO', kicker: 'GOJO' },
  'deep-dive':    { section: 'gojo',    dir: 'research/gojo/research',  ticker: true,  label: 'DEEP DIVE', badge: 'GOJO', kicker: 'GOJO' },
  'journal':      { section: 'gojo',    dir: 'research/gojo/notes',     ticker: false, label: 'JOURNAL',   badge: 'JOURNAL', kicker: 'GOJO' },
  'wealth':       { section: 'money',   dir: 'moneyhub',       ticker: false, label: 'WEALTH',    badge: 'WEALTH', kicker: 'WEALTH' },
  'health':       { section: 'health',  dir: 'healthhub',      ticker: false, label: 'HEALTH',    badge: 'HEALTH', kicker: 'HEALTH' },
};

// Reading chains: the "section home" link between previous and next.
export const SERIES_HOME = {
  'five-steps':       { href: '/moneyhub/foundation/', label: 'Your Foundation' },
  'market-basics':    { href: '/moneyhub/start-here/', label: 'Market Basics' },
  'investing-guides': { href: '/moneyhub/investing/',  label: 'Start Investing' },
};

export const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
export const KIND_LABEL = { hub: 'Hub', page: 'Page', guide: 'Guide', reference: 'Reference', research: 'Market research', journal: 'Journal', tool: 'Tool', project: 'Project', note: 'Note' };

export const NAV = SECTIONS.filter(s => s.nav).map(({ label, href }) => ({ label, href }));

export const CONTENT_DIRS = Object.values(TYPES).map(t => t.dir);

export const sectionById = id => SECTIONS.find(s => s.id === id) || null;

// The most specific section whose URL prefix contains this path,
// e.g. "/research/gojo/notes/x.html" → gojo (not research).
export const sectionForUrl = url =>
  SECTIONS.filter(s => url.startsWith(s.href)).sort((a, b) => b.href.length - a.href.length)[0] || null;

// Index classification for a page URL. Unknown paths are plain site pages.
export function classifyUrl(url) {
  for (const [type, t] of Object.entries(TYPES)) {
    if (url.startsWith('/' + t.dir + '/')) return { type, section: sectionById(t.section).index, ticker: t.ticker };
  }
  return { type: 'page', section: 'Site', ticker: false };
}

const upper = s => (s || '').toUpperCase();
export const typeLabel = post => TYPES[post.type]?.label || upper(post.section);
export const feedBadge = post => TYPES[post.type]?.badge || upper(post.section);
export const kickerFor = post => TYPES[post.type]?.kicker || upper(post.section);
