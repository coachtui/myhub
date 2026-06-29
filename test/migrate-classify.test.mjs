import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyPage, swapHubChrome } from '../scripts/migrate-pages.mjs';

test('classifies article vs hub vs already-migrated', () => {
  assert.equal(classifyPage('<div class="article__content">x</div>', '/gojo/stocks/a.html'), 'article');
  assert.equal(classifyPage('<aside class="sidebar-nav"></aside>', '/gojo/stocks/index.html'), 'hub');
  assert.equal(classifyPage('<header id="site-header"></header>', '/gojo/stocks/a.html'), 'migrated');
});

test('swapHubChrome is idempotent and injects chrome', () => {
  const old = '<html><head><title>T</title><meta name="description" content="d"></head><body><nav class="nav-global">N</nav><nav class="nav-mobile">M</nav><div class="page-layout"><aside class="sidebar-nav">S</aside><main>BODY</main></div><footer class="footer">F</footer></body></html>';
  const once = swapHubChrome(old);
  assert.match(once, /id="site-header"/);
  assert.match(once, /class="sidebar-nav"/);     // body kept
  assert.doesNotMatch(once, /nav-global/);        // old top nav gone
  assert.equal(swapHubChrome(once), once);        // idempotent
});
