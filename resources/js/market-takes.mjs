import { filterPosts, renderListing } from './listing.mjs';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const TYPES = ['market-take', 'deep-dive'];

export function tickerCounts(posts) {
  const m = new Map();
  for (const p of posts) if (p.ticker) m.set(p.ticker, (m.get(p.ticker) || 0) + 1);
  return [...m.entries()].map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count || a.ticker.localeCompare(b.ticker));
}

export function renderChips(counts, activeTicker) {
  const chip = (ticker, label, count) =>
    `<button class="filter-chip" data-ticker="${esc(ticker)}" aria-pressed="${ticker === activeTicker ? 'true' : 'false'}">${esc(label)}${count != null ? `<span class="filter-chip__count">${count}</span>` : ''}</button>`;
  return chip('', 'All', null) + counts.map(c => chip(c.ticker, c.ticker, c.count)).join('');
}

export async function mountMarketTakes(doc = document) {
  const root = doc.getElementById('market-takes');
  if (!root) return;
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { root.innerHTML = '<p class="listing-empty">Serve over HTTP to load posts.</p>'; return; }

  const base = filterPosts(index, { types: TYPES });
  const counts = tickerCounts(base);
  let activeTicker = '', query = '';

  root.innerHTML = `
    <div class="filter-bar">
      <div class="filter-bar__field">
        <input type="text" aria-label="Filter market takes" placeholder="Filter — type a ticker or keyword">
        <span class="filter-bar__count"></span>
      </div>
      <div class="filter-chips"></div>
    </div>
    <div class="listing" id="mt-listing"></div>`;

  const input = root.querySelector('.filter-bar__field input');
  const chipsBox = root.querySelector('.filter-chips');
  const countEl = root.querySelector('.filter-bar__count');
  const listEl = root.querySelector('#mt-listing');

  const render = () => {
    const rows = filterPosts(index, { types: TYPES, ticker: activeTicker, query });
    chipsBox.innerHTML = renderChips(counts, activeTicker);
    listEl.innerHTML = renderListing(rows);
    countEl.textContent = `${rows.length} post${rows.length === 1 ? '' : 's'}`;
  };

  input.addEventListener('input', () => { query = input.value; render(); });
  chipsBox.addEventListener('click', e => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    activeTicker = btn.dataset.ticker;
    render();
  });
  render();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountMarketTakes());
  else mountMarketTakes();
}
