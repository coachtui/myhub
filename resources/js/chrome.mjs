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
  <nav class="chrome-nav" aria-label="Primary"><ul>${links}</ul></nav>
  <div class="chrome-header__actions">
    <button class="chrome-search-pill" type="button" data-search-trigger aria-label="Search">
      <span>Search</span><kbd>⌘K</kbd>
    </button>
    <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">◐</button>
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
<div class="chrome-footer__bottom">© 2026 ${esc(site.name)}. Gojo content is AI-generated — not financial advice.</div>`;
}

export function mountChrome(doc = document) {
  const header = doc.getElementById('site-header');
  const footer = doc.getElementById('site-footer');
  if (header) header.innerHTML = renderHeader(SITE, doc.location?.pathname ?? '/');
  if (footer) footer.innerHTML = renderFooter(SITE);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountChrome());
  else mountChrome();
}
