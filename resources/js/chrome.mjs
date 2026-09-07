import { SITE } from './site-config.mjs';
import { esc } from './esc.mjs';

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
</div>`;
}

export function renderFooter(site) {
  const social = site.social.map(s =>
    `<a href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.label)}"><i class="fa-brands fa-${esc(s.icon)}"></i></a>`
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
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountChrome());
  else mountChrome();
}
