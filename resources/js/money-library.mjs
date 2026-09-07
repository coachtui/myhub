// Money Library: the reference view of every Moneyhub guide, tool and
// reference page, grouped by practical purpose and filterable by stage,
// topic, level and reading time. Renders from search-index.json.
// Pure functions are exported for tests; DOM wiring runs only in a browser.

import { esc } from './esc.mjs';

export const PURPOSES = [
  { id: 'manage-the-month',        label: 'Manage the month',        stage: 'Survive' },
  { id: 'handle-debt',             label: 'Handle debt',             stage: 'Stabilize' },
  { id: 'prepare-for-emergencies', label: 'Prepare for emergencies', stage: 'Stabilize' },
  { id: 'start-investing',         label: 'Start investing',         stage: 'Grow' },
  { id: 'understand-markets',      label: 'Understand markets',      stage: 'Grow' },
];

export const KIND_LABEL = { tool: 'Tool', guide: 'Guide', reference: 'Reference' };

export const READ_BUCKETS = [
  { id: 'short',  label: 'Under 5 min', test: m => m <= 5 },
  { id: 'medium', label: '5 to 10 min', test: m => m > 5 && m <= 10 },
  { id: 'long',   label: 'Over 10 min', test: m => m > 10 },
];

const purposeOf = id => PURPOSES.find(p => p.id === id);

export const stageOf = post => {
  const p = (post.topics || []).map(purposeOf).find(Boolean);
  return p ? p.stage : '';
};

export const isLibraryItem = post => post.section === 'Wealth' && ['guide', 'tool', 'reference'].includes(post.kind);

// filters: { stage, topic, level, read } — each '' or 'all' means no filter.
export function filterLibrary(index, filters = {}) {
  const on = v => v && v !== 'all';
  return index.filter(isLibraryItem).filter(p => {
    if (on(filters.stage) && stageOf(p) !== filters.stage) return false;
    if (on(filters.topic) && !(p.topics || []).includes(filters.topic)) return false;
    if (on(filters.level) && p.level !== filters.level) return false;
    if (on(filters.read)) {
      const b = READ_BUCKETS.find(x => x.id === filters.read);
      if (p.kind === 'tool' || !b || !b.test(p.readTime || 0)) return false;
    }
    return true;
  });
}

// Group by first purpose topic, in PURPOSES order; within a group, series
// order first, then title. Every item appears exactly once.
export function groupLibrary(items) {
  const byKey = (a, b) => (a.series && b.series && a.series === b.series ? a.order - b.order : 0) || a.title.localeCompare(b.title);
  return PURPOSES.map(p => ({
    ...p,
    items: items.filter(i => (i.topics || [])[0] === p.id).sort(byKey),
  })).filter(g => g.items.length);
}

export function renderCard(p) {
  const meta = [KIND_LABEL[p.kind] || p.kind, stageOf(p), p.level, p.kind !== 'tool' && p.readTime ? `${p.readTime} min read` : (p.kind === 'tool' ? 'about 10 min' : '')]
    .filter(Boolean).map(esc).join(' · ');
  return `<a class="post-card library-card" href="${esc(p.url)}">
  <div class="post-card__meta"><span class="post-card__badge">${esc(KIND_LABEL[p.kind] || p.kind)}</span><span class="library-card__meta">${meta}</span></div>
  <h3 class="post-card__title">${esc(p.title)}</h3>
  <p class="post-card__summary">${esc(p.summary)}</p>
</a>`;
}

export function renderLibrary(index, filters = {}) {
  const groups = groupLibrary(filterLibrary(index, filters));
  if (!groups.length) return '<p class="listing-empty">Nothing matches those filters. Clear one to see more.</p>';
  return groups.map(g => `<section class="library-group" aria-labelledby="lib-${g.id}">
  <h2 class="hub-section__title" id="lib-${g.id}">${esc(g.label)} <span class="library-group__count">${g.items.length}</span></h2>
  <p class="hub-section__lead">${esc(g.stage)} stage</p>
  <div class="listing">${g.items.map(renderCard).join('\n')}</div>
</section>`).join('\n');
}

/* ---------- browser wiring ---------- */

export async function mountLibrary(doc = document) {
  const root = doc.getElementById('money-library');
  if (!root) return;
  const form = doc.getElementById('library-filters');
  const status = doc.getElementById('library-status');
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { root.innerHTML = '<p class="listing-empty">Serve over HTTP to load the library.</p>'; return; }
  const render = () => {
    const filters = form ? Object.fromEntries(new FormData(form)) : {};
    const n = filterLibrary(index, filters).length;
    root.innerHTML = renderLibrary(index, filters);
    if (status) status.textContent = `${n} item${n === 1 ? '' : 's'}`;
  };
  if (form) {
    form.addEventListener('change', render);
    form.addEventListener('reset', () => setTimeout(render, 0));
  }
  render();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountLibrary());
  else mountLibrary();
}
