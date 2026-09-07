import { esc } from './esc.mjs';
import { feedBadge } from './sections.mjs';

// Optional filter by index type; the index is already date-sorted.
export function renderFeedRows(index, limit = 8, types = null) {
  const rows = types && types.length ? index.filter(p => types.includes(p.type)) : index;
  return rows.slice(0, limit).map(p => {
    const label = p.ticker || feedBadge(p);
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
    const limit = Number(el.dataset.feedLimit) || 8;
    const types = (el.dataset.feedTypes || '').split(',').map(s => s.trim()).filter(Boolean);
    el.innerHTML = renderFeedRows(index, limit, types);
  } catch { el.innerHTML = '<p class="feed-empty">Run <code>npm run build:index</code> and serve over HTTP to load the feed.</p>'; }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountFeed());
  else mountFeed();
}
