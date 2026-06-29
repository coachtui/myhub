const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
