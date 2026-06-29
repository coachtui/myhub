const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const TYPE_LABEL = { 'deep-dive': 'DEEP DIVE', 'journal': 'JOURNAL', 'market-take': 'TAKE', 'wealth': 'WEALTH', 'health': 'HEALTH' };

export function prettyDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}` : '';
}

export function filterPosts(index, { types, ticker = '', query = '' } = {}) {
  const t = ticker.toLowerCase();
  const q = query.trim().toLowerCase();
  return index
    .filter(p => !types || types.includes(p.type))
    .filter(p => !t || (p.ticker || '').toLowerCase() === t)
    .filter(p => !q || [p.title, p.summary, p.ticker].some(s => (s || '').toLowerCase().includes(q)))
    .slice()
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function renderListing(posts) {
  if (!posts.length) return '<p class="listing-empty">No posts match.</p>';
  return posts.map(p => {
    const isTicker = !!p.ticker;
    const label = isTicker ? p.ticker : (TYPE_LABEL[p.type] || (p.section || '').toUpperCase());
    return `<a class="post-card" href="${esc(p.url)}">
  <div class="post-card__meta">
    <span class="post-card__badge${isTicker ? ' post-card__badge--ticker' : ''}">${esc(label)}</span>
    <span class="post-card__date">${esc(prettyDate(p.date))}</span>
  </div>
  <h3 class="post-card__title">${esc(p.title)}</h3>
  <p class="post-card__summary">${esc(p.summary)}</p>
</a>`;
  }).join('\n');
}

export async function mountListings(doc = document) {
  const mounts = [...doc.querySelectorAll('[data-listing-types]')];
  if (!mounts.length) return;
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { mounts.forEach(el => { el.innerHTML = '<p class="listing-empty">Serve over HTTP to load posts.</p>'; }); return; }
  for (const el of mounts) {
    const types = el.dataset.listingTypes.split(',').map(s => s.trim()).filter(Boolean);
    el.innerHTML = renderListing(filterPosts(index, { types }));
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountListings());
  else mountListings();
}
