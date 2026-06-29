import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyPage, swapHubChrome } from '../scripts/migrate-pages.mjs';

test('classifies article vs hub vs already-migrated', () => {
  assert.equal(classifyPage('<div class="article__content">x</div>', '/gojo/stocks/a.html'), 'article');
  assert.equal(classifyPage('<aside class="sidebar-nav"></aside>', '/gojo/stocks/index.html'), 'hub');
  assert.equal(classifyPage('<header id="site-header"></header>', '/gojo/stocks/a.html'), 'migrated');
});

test('non-article content pages (no article__content, not index) are chrome-swapped, not skipped', () => {
  const html = '<head><title>T</title><meta name="description" content="d"></head><body><nav class="nav-global">N</nav><nav class="nav-mobile">M</nav><div class="page-layout"><aside class="sidebar-nav">S</aside><main>custom non-article layout</main></div><footer class="footer">F</footer></body>';
  assert.equal(classifyPage(html, '/healthhub/training.html'), 'hub');
  const out = swapHubChrome(html);
  assert.match(out, /id="site-header"/);     // chrome injected
  assert.doesNotMatch(out, /nav-global/);      // old nav gone
  assert.match(out, /custom non-article layout/); // body preserved
});

test('index/listing pages stay hub even when they wrap content in article__content', () => {
  const html = '<div class="article__content"><div class="stack"><a class="card">post</a></div></div>';
  assert.equal(classifyPage(html, '/gojo/stocks/index.html'), 'hub');
});

test('swapHubChrome is idempotent and injects chrome', () => {
  const old = '<html><head><title>T</title><meta name="description" content="d"></head><body><nav class="nav-global">N</nav><nav class="nav-mobile">M</nav><div class="page-layout"><aside class="sidebar-nav">S</aside><main>BODY</main></div><footer class="footer">F</footer></body></html>';
  const once = swapHubChrome(old);
  assert.match(once, /id="site-header"/);
  assert.match(once, /class="sidebar-nav"/);     // body kept
  assert.doesNotMatch(once, /nav-global/);        // old top nav gone
  assert.equal(swapHubChrome(once), once);        // idempotent
});

test('swapHubChrome does not double-escape head metadata', () => {
  const html = '<head><title>A &amp; B</title><meta name="description" content="S&amp;P"></head><body><nav class="nav-global">N</nav><nav class="nav-mobile">M</nav><footer class="footer">F</footer></body>';
  const out = swapHubChrome(html);
  assert.match(out, /<title>A &amp; B<\/title>/);          // single-escaped
  assert.doesNotMatch(out, /&amp;amp;/);                     // never double
  assert.match(out, /content="S&amp;P"/);
});
