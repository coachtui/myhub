export function rankResults(index, query, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return index
    .map(post => ({ post, score: scorePost(post, q, terms) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || (b.post.date || '').localeCompare(a.post.date || ''))
    .slice(0, limit)
    .map(r => r.post);
}

function scorePost(post, q, terms) {
  const ticker = (post.ticker || '').toLowerCase();
  const title = (post.title || '').toLowerCase();
  const summary = (post.summary || '').toLowerCase();
  const section = (post.section || '').toLowerCase();
  let score = 0;
  if (ticker && ticker === q) score += 100;
  for (const t of terms) {
    if (ticker && ticker === t) score += 80;
    if (title.includes(t)) score += 20;
    if (summary.includes(t)) score += 8;
    if (section.includes(t)) score += 5;
  }
  return score;
}

// ---- browser-only palette ----
const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let searchInitialized = false;

export async function initSearch(doc = document) {
  if (searchInitialized) return;
  searchInitialized = true;
  let index = [];
  try {
    index = await (await fetch('/resources/data/search-index.json')).json();
  } catch { /* offline / file://: search disabled, pill still inert-safe */ }

  const overlay = doc.createElement('div');
  overlay.className = 'cmdk';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="cmdk__panel" role="dialog" aria-label="Search">
      <input class="cmdk__input" type="text" placeholder="Search takes, tickers, guides — e.g. SPY, emergency fund" aria-label="Search query">
      <ul class="cmdk__results"></ul>
    </div>`;
  doc.body.appendChild(overlay);
  const input = overlay.querySelector('.cmdk__input');
  const results = overlay.querySelector('.cmdk__results');

  const close = () => { overlay.hidden = true; input.value = ''; results.innerHTML = ''; };
  const open = () => { overlay.hidden = false; input.focus(); };

  input.addEventListener('input', () => {
    const rows = rankResults(index, input.value);
    results.innerHTML = rows.map(p => `
      <li><a href="${esc(p.url)}">
        ${p.ticker ? `<span class="cmdk__tag">${esc(p.ticker)}</span>` : `<span class="cmdk__tag cmdk__tag--sec">${esc(p.section)}</span>`}
        <span class="cmdk__title">${esc(p.title)}</span>
        <span class="cmdk__date">${esc(p.date || '')}</span>
      </a></li>`).join('');
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  doc.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.hidden ? open() : close(); }
    if (e.key === 'Escape' && !overlay.hidden) close();
  });
  doc.addEventListener('click', e => { if (e.target.closest('[data-search-trigger]')) open(); });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initSearch());
  else initSearch();
}
