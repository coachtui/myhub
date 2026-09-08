import { SITE } from './site-config.mjs';
import { esc } from './esc.mjs';
import { mountExperience } from './experience.mjs';

export function renderSectionNav(path) {
  let label, links;
  if (path.startsWith('/moneyhub/')) {
    label = 'THE MONEY GUIDE';
    links = [['Overview', '/moneyhub/'], ['Your foundation', '/moneyhub/foundation/'], ['Market basics', '/moneyhub/start-here/'], ['Investing', '/moneyhub/investing/'], ['Library & tools', '/moneyhub/library/']];
  } else if (path.startsWith('/healthhub/')) {
    label = 'THE HEALTH JOURNAL';
    links = [['Overview', '/healthhub/'], ['Training', '/healthhub/training.html'], ['Nutrition', '/healthhub/nutrition.html'], ['Recovery', '/healthhub/recovery.html'], ['Metrics', '/healthhub/metrics.html']];
  } else if (path.startsWith('/research/')) {
    label = 'THE RESEARCH DESK';
    links = [['Overview', '/research/'], ['Lelouch', '/research/lelouch/'], ['Gojo archive', '/research/gojo/'], ['Market Lab', '/moneyhub/market-lab/']];
  } else return '';
  const sectionName = label === 'THE MONEY GUIDE' ? 'Money' : label === 'THE HEALTH JOURNAL' ? 'Health' : 'Research';
  return `<nav class="section-nav" aria-label="${sectionName} section"><div class="section-nav__inner"><span>${label}</span><ul>${links.map(([name, href]) => `<li><a href="${href}"${path === href || (href !== '/moneyhub/' && href.endsWith('/') && path.startsWith(href)) ? ' aria-current="page"' : ''}>${name}</a></li>`).join('')}</ul></div></nav>`;
}

export function renderHeader(site, currentPath = '/') {
  const links = site.nav.map(n => {
    const active = currentPath === n.href || (n.href !== '/' && currentPath.startsWith(n.href) && n.href.endsWith('/'));
    return `<li><a class="chrome-nav__link" href="${esc(n.href)}"${active ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`;
  }).join('');
  return `
<div class="chrome-header__inner">
  <a class="chrome-header__logo" href="/">${esc(site.name)}</a>
  <nav class="chrome-nav" id="chrome-nav" aria-label="Primary"><ul>${links}</ul></nav>
  <div class="chrome-header__actions">
    <button class="chrome-search-pill" type="button" data-search-trigger aria-label="Search">
      <span>Search</span><kbd>⌘K</kbd>
    </button>
    <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">◐</button>
    <button class="chrome-menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="chrome-nav">Menu</button>
  </div>
</div>${renderSectionNav(currentPath)}`;
}

export function renderFooter(site) {
  const social = site.social.map(s =>
    `<a href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}">${esc(s.label)} ↗</a>`
  ).join('');
  const links = site.nav.map(n => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('');
  return `
<div class="chrome-footer__inner">
  <div class="chrome-footer__brand">
    <a class="chrome-footer__logo" href="/">${esc(site.name)}</a>
    <p>${esc(site.bio)}</p>
    <div class="chrome-footer__social">${social}</div>
  </div>
  <nav class="chrome-footer__nav" aria-label="Footer"><ul>${links}</ul></nav>
</div>
<div class="chrome-footer__bottom">© 2026 ${esc(site.name)}. Gojo &amp; Lelouch content is AI-generated — not financial advice.</div>`;
}

// Small-screen menu: the primary nav is hidden under 640px (see chrome.css)
// and revealed by a labelled toggle. Escape closes and returns focus; a click
// outside the header or on a nav link closes it too.
export function wireMenu(header, doc = document) {
  const button = header.querySelector('[data-menu-toggle]');
  const nav = header.querySelector('#chrome-nav');
  if (!button || !nav) return;
  const isOpen = () => nav.classList.contains('is-open');
  const setOpen = open => {
    nav.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Close' : 'Menu';
  };
  button.addEventListener('click', () => setOpen(!isOpen()));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  doc.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); button.focus(); }
  });
  doc.addEventListener('click', e => { if (isOpen() && !header.contains(e.target)) setOpen(false); });
}

export function mountChrome(doc = document) {
  const header = doc.getElementById('site-header');
  const footer = doc.getElementById('site-footer');
  if (header) { header.innerHTML = renderHeader(SITE, doc.location?.pathname ?? '/'); wireMenu(header, doc); }
  if (footer) footer.innerHTML = renderFooter(SITE);
  mountExperience(doc);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountChrome());
  else mountChrome();
}
