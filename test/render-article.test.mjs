import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHead } from '../scripts/lib/page-head.mjs';

test('head includes new fonts, css, theme, and escaped title/description', () => {
  const h = renderHead({ title: 'SPY & the Fed', description: 'A "tight" read <here>' });
  assert.match(h, /Instrument\+Serif/);
  assert.match(h, /Source\+Serif\+4/);
  assert.match(h, /IBM\+Plex\+Mono/);
  assert.match(h, /\/resources\/css\/style\.css/);
  assert.match(h, /\/resources\/js\/theme\.js/);
  assert.match(h, /<title>SPY &amp; the Fed<\/title>/);
  assert.match(h, /content="A &quot;tight&quot; read &lt;here&gt;"/);
  assert.doesNotMatch(h, /Inter|Fraunces|JetBrains/);
});
