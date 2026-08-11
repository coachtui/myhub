import { filterPosts, renderListing } from './listing.mjs';

const TYPES = ['market-take', 'deep-dive'];

export async function mountMarketTakes(doc = document) {
  const root = doc.getElementById('market-takes');
  if (!root) return;
  const types = root.dataset.listingTypes
    ? root.dataset.listingTypes.split(',').map(s => s.trim()).filter(Boolean)
    : TYPES;
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { root.innerHTML = '<p class="listing-empty">Serve over HTTP to load posts.</p>'; return; }

  let query = '';
  root.innerHTML = `
    <div class="filter-bar">
      <div class="filter-bar__field">
        <input type="text" aria-label="Filter market takes" placeholder="Filter — type a ticker or keyword">
        <span class="filter-bar__count"></span>
      </div>
    </div>
    <div class="listing" id="mt-listing"></div>`;

  const input = root.querySelector('.filter-bar__field input');
  const countEl = root.querySelector('.filter-bar__count');
  const listEl = root.querySelector('#mt-listing');

  const render = () => {
    const rows = filterPosts(index, { types, query });
    listEl.innerHTML = renderListing(rows);
    countEl.textContent = `${rows.length} post${rows.length === 1 ? '' : 's'}`;
  };

  input.addEventListener('input', () => { query = input.value; render(); });
  render();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountMarketTakes());
  else mountMarketTakes();
}
