import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SITE } from '../resources/js/site-config.mjs';
import { renderHeader, renderFooter } from '../resources/js/chrome.mjs';

test('site config exposes nav, bio, social', () => {
  assert.equal(SITE.bio, 'Builder, investor, construction professional.');
  assert.deepEqual(SITE.nav.map(n => n.label), ['Money', 'Health', 'Work & Projects', 'Research & Notes', 'About']);
  assert.deepEqual(SITE.nav.map(n => n.href), ['/moneyhub/', '/healthhub/', '/projects/', '/research/', '/about/']);
  assert.ok(SITE.social.length >= 3);
});

test('header renders all nav links and marks the active one', () => {
  const html = renderHeader(SITE, '/moneyhub/');
  for (const item of SITE.nav) assert.ok(html.includes(item.href), `missing ${item.href}`);
  assert.match(html, /aria-current="page"[^>]*>Money<\/a>/);
  assert.ok(html.includes('data-search-trigger'), 'has search pill');
  assert.ok(html.includes('data-theme-toggle'), 'has theme toggle');
  assert.match(html, /<nav class="chrome-nav" id="chrome-nav"/, 'nav has an id for aria-controls');
  assert.match(html, /data-menu-toggle[^>]*aria-expanded="false"[^>]*aria-controls="chrome-nav"[^>]*>Menu</, 'labelled menu toggle wired to the nav');
});

test('footer renders bio and social links', () => {
  const html = renderFooter(SITE);
  assert.ok(html.includes('construction professional'));
  assert.ok(html.includes('github.com/coachtui'));
});
