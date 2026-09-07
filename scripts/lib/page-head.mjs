import { esc } from '../../resources/js/esc.mjs';
import { SITE_ORIGIN, META_KEYS } from '../../resources/js/sections.mjs';

const FONTS = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap';

// Public URL for a repo path: directory indexes are addressed by their folder.
export const canonicalUrl = url => SITE_ORIGIN + url.replace(/index\.html$/, '');

// Render the shared <head>. `url` (repo path, e.g. /moneyhub/qa.html) adds the
// canonical link and Open Graph tags; `meta` is the page's site:* metadata,
// emitted in META_KEYS order so every page's head is byte-comparable.
export function renderHead({ title, description, url = '', meta = {} }) {
  const canonical = url ? canonicalUrl(url) : '';
  const social = canonical ? `
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="${meta.kind === 'hub' || meta.kind === 'page' ? 'website' : 'article'}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">` : '';
  const site = META_KEYS
    .filter(k => meta[k] !== undefined && meta[k] !== null && meta[k] !== '')
    .map(k => `\n  <meta name="site:${k}" content="${esc(Array.isArray(meta[k]) ? meta[k].join(', ') : meta[k])}">`)
    .join('');
  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">${social}${site}
  <link rel="icon" href="/resources/images/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONTS}" rel="stylesheet">
  <script src="https://kit.fontawesome.com/ed35775394.js" crossorigin="anonymous"></script>
  <link rel="stylesheet" href="/resources/css/style.css">
  <script src="/resources/js/theme.js"></script>`;
}

// Read site:* metadata back out of a page head. Lists come back as arrays.
export function parseSiteMeta(html) {
  const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [, html])[1];
  const meta = {};
  for (const m of head.matchAll(/<meta\s+name="site:([a-z]+)"\s+content="([^"]*)"\s*\/?>/g)) {
    const key = m[1];
    const raw = m[2].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    meta[key] = LIST_KEYS.has(key) ? raw.split(',').map(s => s.trim()).filter(Boolean) : raw;
  }
  return meta;
}

export const LIST_KEYS = new Set(['topics', 'tickers']);
