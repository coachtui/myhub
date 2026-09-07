import { sectionById } from './sections.mjs';

const ofTypes = (...types) => p => types.includes(p.type);
const ofSection = id => { const name = sectionById(id).index; return p => p.section === name; };

// Keys are the values used by [data-count="…"] in hub pages.
const FILTERS = {
  'market-takes': ofTypes('market-take', 'deep-dive'),
  'lelouch-takes': ofTypes('lelouch-take'),
  'research': ofTypes('market-take', 'deep-dive', 'lelouch-take'),
  'journal': ofTypes('journal'),
  'investing': p => p.url.startsWith('/moneyhub/investing/'),
  'wealth': ofSection('money'),
  'health': ofSection('health'),
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
