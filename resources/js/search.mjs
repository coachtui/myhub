import { esc } from './esc.mjs';
import { AUTHORS, KIND_LABEL, LEVEL_LABEL } from './sections.mjs';

// Site search: one ranked list over search-index.json, opened by ⌘K or the
// header pill. Every result says what it is (Beginner guide, Tool, Market
// research, Journal…) and who wrote it, so beginner education and advanced
// research never look the same.

// Filter groups shown as chips above the results. `test` decides membership.
export const SCOPES = [
  { id: 'all',      label: 'Everything',     test: () => true },
  { id: 'learn',    label: 'Guides & tools', test: p => ['guide', 'tool', 'reference'].includes(p.kind) },
  { id: 'research', label: 'Market research', test: p => p.kind === 'research' },
  { id: 'journal',  label: 'Journal & notes', test: p => ['journal', 'note'].includes(p.kind) },
];

const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'is', 'are', 'do', 'does', 'i', 'my', 'me', 'how', 'what', 'when', 'why', 'should', 'can', 'with', 'about', 'it', 'be', 'get', 'start', 'much']);

// Query terms, with question scaffolding removed ("how do I start investing" → investing).
export function queryTerms(query) {
  const words = (query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const meaningful = words.filter(w => !STOP.has(w));
  return meaningful.length ? meaningful : words;
}

// Human label for a result: what it is, at what level, and whether it is AI-written.
export function resultLabel(p) {
  const kind = KIND_LABEL[p.kind] || (p.section || '');
  const level = p.kind === 'guide' || p.kind === 'reference' ? (LEVEL_LABEL[p.level] || '') : '';
  const label = level ? `${level} ${kind.toLowerCase()}` : kind;
  const author = AUTHORS[p.author];
  return { label, author: author ? author.name.replace(' (AI analyst)', '') : '', ai: !!author?.ai };
}

export function rankResults(index, query, limit = 8, scope = 'all') {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const terms = queryTerms(q);
  const inScope = (SCOPES.find(s => s.id === scope) || SCOPES[0]).test;
  return index
    .filter(inScope)
    .map(post => ({ post, score: scorePost(post, q, terms) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || (b.post.date || '').localeCompare(a.post.date || ''))
    .slice(0, limit)
    .map(r => r.post);
}

function scorePost(post, q, terms) {
  const tickers = (post.tickers && post.tickers.length ? post.tickers : [post.ticker]).filter(Boolean).map(t => t.toLowerCase());
  const title = (post.title || '').toLowerCase();
  const summary = (post.summary || '').toLowerCase();
  const section = (post.section || '').toLowerCase();
  const headings = (post.headings || []).join(' ').toLowerCase();
  const topics = (post.topics || []).join(' ').replace(/-/g, ' ').toLowerCase();
  const author = (AUTHORS[post.author]?.name || '').toLowerCase();
  const kind = (KIND_LABEL[post.kind] || '').toLowerCase();
  let score = 0;
  if (tickers.includes(q)) score += 100;
  if (title.includes(q) && terms.length > 1) score += 30;      // whole phrase in the title
  for (const t of terms) {
    if (tickers.includes(t)) score += 80;
    if (title.includes(t)) score += 20;
    if (headings.includes(t)) score += 10;
    if (topics.includes(t)) score += 10;
    if (summary.includes(t)) score += 8;
    if (kind.includes(t)) score += 6;
    if (section.includes(t) || author.includes(t)) score += 5;
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
    <div class="cmdk__panel" role="dialog" aria-modal="true" aria-labelledby="cmdk-title">
      <h2 class="sr-only" id="cmdk-title">Search the site</h2>
      <input class="cmdk__input" type="search" placeholder="Search guides, tools, research — try “emergency fund”, “SPY”, or “how do I start investing”" aria-label="Search query" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="cmdk-results" aria-autocomplete="list">
      <div class="cmdk__scopes" role="group" aria-label="Show">
        ${SCOPES.map((s, i) => `<button type="button" class="cmdk__scope${i === 0 ? ' is-active' : ''}" data-scope="${s.id}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join('')}
      </div>
      <ul class="cmdk__results" id="cmdk-results" role="listbox" aria-label="Results"></ul>
      <p class="cmdk__status sr-only" aria-live="polite"></p>
      <button type="button" class="cmdk__close">Close</button>
    </div>`;
  doc.body.appendChild(overlay);
  const panel = overlay.querySelector('.cmdk__panel');
  const input = overlay.querySelector('.cmdk__input');
  const results = overlay.querySelector('.cmdk__results');
  const status = overlay.querySelector('.cmdk__status');
  const scopes = [...overlay.querySelectorAll('[data-scope]')];
  const closeBtn = overlay.querySelector('.cmdk__close');

  let rows = [];
  let active = -1;
  let scope = 'all';
  let trigger = null;

  const paint = () => {
    [...results.children].forEach((li, i) => {
      const on = i === active;
      li.classList.toggle('cmdk__active', on);
      li.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) { li.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', li.id); }
    });
    if (active < 0) input.removeAttribute('aria-activedescendant');
  };

  const render = () => {
    const q = input.value.trim();
    rows = rankResults(index, input.value, 8, scope);
    active = rows.length ? 0 : -1;
    input.setAttribute('aria-expanded', String(!!q));
    if (!q) { results.innerHTML = ''; status.textContent = ''; return; }
    if (!rows.length) { results.innerHTML = '<li class="cmdk__empty">No results. Try a plainer word, a ticker, or a different scope above.</li>'; status.textContent = 'No results'; return; }
    results.innerHTML = rows.map((p, i) => {
      const { label, author, ai } = resultLabel(p);
      return `<li id="cmdk-r${i}" role="option" aria-selected="false"><a href="${esc(p.url)}" tabindex="-1">
        ${p.ticker ? `<span class="cmdk__tag">${esc(p.ticker)}</span>` : `<span class="cmdk__tag cmdk__tag--sec">${esc(label.split(' ')[0])}</span>`}
        <span class="cmdk__body"><span class="cmdk__title">${esc(p.title)}</span><span class="cmdk__meta">${esc(label)}${author ? ` · ${esc(author)}` : ''}${ai ? ' · AI-generated' : ''}${p.readTime ? ` · ${p.readTime} min` : ''}</span></span>
        <span class="cmdk__date">${esc(p.date || '')}</span>
      </a></li>`;
    }).join('');
    status.textContent = `${rows.length} result${rows.length === 1 ? '' : 's'}`;
    paint();
  };

  const open = () => { trigger = doc.activeElement; overlay.hidden = false; input.value = ''; rows = []; active = -1; results.innerHTML = ''; status.textContent = ''; input.focus(); };
  const close = () => { overlay.hidden = true; input.value = ''; results.innerHTML = ''; if (trigger && trigger.focus) trigger.focus(); };

  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = nextActive(rows.length, active, 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = nextActive(rows.length, active, -1); paint(); }
    else if (e.key === 'Enter' && active >= 0 && rows[active]) { e.preventDefault(); window.location.href = rows[active].url; }
  });
  for (const b of scopes) b.addEventListener('click', () => {
    scope = b.dataset.scope;
    for (const o of scopes) { const on = o === b; o.classList.toggle('is-active', on); o.setAttribute('aria-pressed', String(on)); }
    render(); input.focus();
  });
  closeBtn.addEventListener('click', close);

  // Keep Tab inside the dialog while it is open.
  panel.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = [input, ...scopes, closeBtn];
    const i = focusable.indexOf(doc.activeElement);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); focusable[focusable.length - 1].focus(); }
    else if (!e.shiftKey && i === focusable.length - 1) { e.preventDefault(); focusable[0].focus(); }
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
