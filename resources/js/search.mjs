import { esc } from './esc.mjs';

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

export function nextActive(count, current, delta) {
  if (count <= 0) return -1;
  return ((current + delta) % count + count) % count;
}

let searchInitialized = false;

export async function initSearch(doc = document) {
  if (searchInitialized) return;
  searchInitialized = true;
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { /* offline: search disabled */ }

  const overlay = doc.createElement('div');
  overlay.className = 'cmdk';
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="cmdk__panel" role="dialog" aria-modal="true" aria-label="Search">
      <input class="cmdk__input" type="text" placeholder="Search takes, tickers, guides — e.g. SPY, emergency fund" aria-label="Search query">
      <ul class="cmdk__results" role="listbox"></ul>
    </div>`;
  doc.body.appendChild(overlay);
  const input = overlay.querySelector('.cmdk__input');
  const results = overlay.querySelector('.cmdk__results');

  let rows = [];
  let active = -1;
  let trigger = null;

  const paint = () => {
    [...results.children].forEach((li, i) => {
      const a = li.firstElementChild;
      const on = i === active;
      a.classList.toggle('cmdk__active', on);
      a.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) a.scrollIntoView({ block: 'nearest' });
    });
  };

  const render = () => {
    const q = input.value.trim();
    rows = rankResults(index, input.value);
    active = rows.length ? 0 : -1;
    if (!q) { results.innerHTML = ''; return; }
    if (!rows.length) { results.innerHTML = '<li class="cmdk__empty">No results.</li>'; return; }
    results.innerHTML = rows.map(p => `
      <li><a href="${esc(p.url)}" role="option">
        ${p.ticker ? `<span class="cmdk__tag">${esc(p.ticker)}</span>` : `<span class="cmdk__tag cmdk__tag--sec">${esc(p.section)}</span>`}
        <span class="cmdk__title">${esc(p.title)}</span>
        <span class="cmdk__date">${esc(p.date || '')}</span>
      </a></li>`).join('');
    paint();
  };

  const open = () => { trigger = doc.activeElement; overlay.hidden = false; input.value = ''; rows = []; active = -1; results.innerHTML = ''; input.focus(); };
  const close = () => { overlay.hidden = true; input.value = ''; results.innerHTML = ''; if (trigger && trigger.focus) trigger.focus(); };

  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = nextActive(rows.length, active, 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = nextActive(rows.length, active, -1); paint(); }
    else if (e.key === 'Enter' && active >= 0 && rows[active]) { e.preventDefault(); window.location.href = rows[active].url; }
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
