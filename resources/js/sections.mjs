// Single source of truth for the site's sections and content types.
//
// Consumed by: site-config.mjs (primary nav), scripts/build-index.mjs (which
// directories to index), scripts/lib/extract-post.mjs (URL → section/type),
// scripts/lib/extract-article.mjs (default author), scripts/lib/render-article.mjs
// (kicker), feed.mjs / listing.mjs (badges and labels), counts.mjs (filters).
//
// Browser-safe: no Node imports. Order of SECTIONS is nav order.

export const SECTIONS = [
  { id: 'money',   label: 'Wealth',  href: '/moneyhub/',  index: 'Wealth',  author: 'Tui Alailima',        ai: false, nav: true },
  { id: 'health',  label: 'Health',  href: '/healthhub/', index: 'Health',  author: 'Tui Alailima',        ai: false, nav: true },
  { id: 'gojo',    label: 'Gojo',    href: '/gojo/',      index: 'Gojo',    author: 'Gojo (AI analyst)',    ai: true,  nav: true },
  { id: 'lelouch', label: 'Lelouch', href: '/lelouch/',   index: 'Lelouch', author: 'Lelouch (AI analyst)', ai: true,  nav: true },
  { id: 'about',   label: 'About',   href: '/about/',     index: null,      author: 'Tui Alailima',        ai: false, nav: true },
];

// Content types, keyed by the `type` value stored in search-index.json.
//   dir     – repo directory whose pages carry this type (URL prefix "/<dir>/")
//   ticker  – whether the first filename segment is a ticker symbol
//   label   – listing card badge when there is no ticker
//   badge   – compact home-feed badge when there is no ticker
//   kicker  – first word of the article kicker
export const TYPES = {
  'lelouch-take': { section: 'lelouch', dir: 'lelouch/stocks', ticker: true,  label: 'TAKE',      badge: 'LELO', kicker: 'LELOUCH' },
  'market-take':  { section: 'gojo',    dir: 'gojo/stocks',    ticker: true,  label: 'TAKE',      badge: 'GOJO', kicker: 'GOJO' },
  'deep-dive':    { section: 'gojo',    dir: 'gojo/research',  ticker: true,  label: 'DEEP DIVE', badge: 'GOJO', kicker: 'GOJO' },
  'journal':      { section: 'gojo',    dir: 'gojo/notes',     ticker: false, label: 'JOURNAL',   badge: 'JRNL', kicker: 'GOJO' },
  'wealth':       { section: 'money',   dir: 'moneyhub',       ticker: false, label: 'WEALTH',    badge: 'WLTH', kicker: 'WEALTH' },
  'health':       { section: 'health',  dir: 'healthhub',      ticker: false, label: 'HEALTH',    badge: 'HLTH', kicker: 'HEALTH' },
};

export const NAV = SECTIONS.filter(s => s.nav).map(({ label, href }) => ({ label, href }));

export const CONTENT_DIRS = Object.values(TYPES).map(t => t.dir);

export const sectionById = id => SECTIONS.find(s => s.id === id) || null;

// The section whose URL prefix contains this path, e.g. "/gojo/notes/x.html" → gojo.
export const sectionForUrl = url => SECTIONS.find(s => url.startsWith(s.href)) || null;

// Index classification for a page URL. Unknown paths are plain site pages.
export function classifyUrl(url) {
  for (const [type, t] of Object.entries(TYPES)) {
    if (url.startsWith('/' + t.dir + '/')) return { type, section: sectionById(t.section).index, ticker: t.ticker };
  }
  return { type: 'page', section: 'Site', ticker: false };
}

const upper = s => (s || '').toUpperCase();
export const typeLabel = post => TYPES[post.type]?.label || upper(post.section);
export const feedBadge = post => TYPES[post.type]?.badge || upper(post.section).slice(0, 4);
export const kickerFor = post => TYPES[post.type]?.kicker || upper(post.section);
