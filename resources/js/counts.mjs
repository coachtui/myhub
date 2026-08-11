const FILTERS = {
  'market-takes': p => p.section === 'Gojo' && (p.type === 'market-take' || p.type === 'deep-dive'),
  'lelouch-takes': p => p.type === 'lelouch-take',
  'journal': p => p.type === 'journal',
  'investing': p => p.url.startsWith('/moneyhub/investing/'),
  'wealth': p => p.section === 'Wealth',
  'health': p => p.section === 'Health',
};

export function computeCounts(index) {
  const out = {};
  for (const key of Object.keys(FILTERS)) out[key] = index.filter(FILTERS[key]).length;
  return out;
}

export async function mountCounts(doc = document) {
  const els = [...doc.querySelectorAll('[data-count]')];
  if (!els.length) return;
  let index = [];
  try { index = await (await fetch('/resources/data/search-index.json')).json(); }
  catch { return; }
  const counts = computeCounts(index);
  for (const el of els) {
    const n = counts[el.dataset.count];
    if (n != null) el.textContent = String(n);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountCounts());
  else mountCounts();
}
