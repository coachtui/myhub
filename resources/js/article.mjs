import { esc } from './esc.mjs';
import { SERIES_HOME } from './sections.mjs';

export function buildToc(headings) {
  if (!headings || headings.length < 2) return '';
  const links = headings.map(h =>
    `<a class="${h.level === 3 ? 'is-sub' : ''}" href="#${esc(h.id)}">${esc(h.text)}</a>`).join('');
  return `<div class="article-rail__label">On this page</div><nav class="article-rail__toc">${links}</nav>`;
}

export function buildRelated(index, { url, ticker, section }, limit = 5) {
  const pool = index.filter(p => p.url !== url);
  const score = p => (ticker && p.ticker === ticker ? 2 : 0) + (p.section === section ? 1 : 0);
  const rows = pool.filter(p => score(p) > 0).sort((a, b) => score(b) - score(a)).slice(0, limit);
  if (!rows.length) return '';
  const links = rows.map(p => `<a href="${esc(p.url)}">${esc(p.title)}</a>`).join('');
  return `<div class="article-rail__related"><div class="article-rail__label">Related</div>${links}</div>`;
}

// Previous / section home / next for a page that belongs to a reading chain.
export function buildSeriesNav(index, url) {
  const me = index.find(p => p.url === url);
  if (!me || !me.series) return '';
  const chain = index.filter(p => p.series === me.series).sort((a, b) => a.order - b.order);
  const i = chain.findIndex(p => p.url === url);
  const prev = chain[i - 1], next = chain[i + 1];
  const home = SERIES_HOME[me.series] || { href: '/', label: 'Home' };
  const link = (p, cls, label, arrow) => p ? `<a href="${esc(p.url)}" class="step-nav-footer__${cls}">${arrow === '←' ? '<span class="arrow" aria-hidden="true">←</span>' : ''}<span><span class="label">${label}</span><span class="title">${esc(p.title)}</span></span>${arrow === '→' ? '<span class="arrow" aria-hidden="true">→</span>' : ''}</a>` : '<span></span>';
  return link(prev, 'prev', 'Previous', '←') + `<a href="${esc(home.href)}" class="step-nav-footer__home">${esc(home.label)}</a>` + link(next, 'next', 'Next', '→');
}

export function buildRelatedList(index, ctx, limit = 4) {
  const pool = index.filter(p => p.url !== ctx.url);
  const tags = new Set(ctx.topics || []);
  const score = p => (ctx.ticker && (p.tickers || []).includes(ctx.ticker) ? 3 : 0)
    + (p.series && p.series === ctx.series ? 2 : 0)
    + (p.topics || []).filter(t => tags.has(t)).length * 2
    + (p.section === ctx.section ? 1 : 0)
    - (ctx.level && ctx.level !== 'advanced' && p.level === 'advanced' ? 3 : 0);
  const rows = pool.map(p => [score(p), p]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, limit).map(([, p]) => p);
  if (!rows.length) return '';
  return rows.map(p => `<a class="post-card" href="${esc(p.url)}"><h3 class="post-card__title">${esc(p.title)}</h3><p class="post-card__summary">${esc(p.summary)}</p></a>`).join('');
}

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50); }

export async function mountArticle(doc = document) {
  const rail = doc.getElementById('article-rail');
  if (!rail) return;
  const heads = [...doc.querySelectorAll('.article__content h2, .article__content h3')].map(el => {
    if (!el.id) el.id = slug(el.textContent);
    return { id: el.id, text: el.textContent, level: el.tagName === 'H3' ? 3 : 2 };
  });
  let related = '';
  try {
    const index = await (await fetch('/resources/data/search-index.json')).json();
    const me = index.find(p => p.url === rail.dataset.url) || { url: rail.dataset.url, ticker: rail.dataset.ticker, section: rail.dataset.section };
    related = buildRelated(index, { url: rail.dataset.url, ticker: rail.dataset.ticker, section: rail.dataset.section });
    const nav = doc.querySelector('[data-series-nav]');
    if (nav) { const html = buildSeriesNav(index, rail.dataset.url); if (html) nav.innerHTML = html; }
    const foot = doc.querySelector('[data-related]');
    if (foot) { const html = buildRelatedList(index, me); if (html) foot.innerHTML = html; else foot.hidden = true; }
  } catch { /* offline: skip related */ }
  rail.innerHTML = buildToc(heads) + related;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountArticle());
  else mountArticle();
}
