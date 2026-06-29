const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
    related = buildRelated(index, { url: rail.dataset.url, ticker: rail.dataset.ticker, section: rail.dataset.section });
  } catch { /* offline: skip related */ }
  rail.innerHTML = buildToc(heads) + related;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountArticle());
  else mountArticle();
}
