import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPost } from '../scripts/lib/extract-post.mjs';

test('decodes numeric decimal entities in summary', () => {
  const html = `<h1 class="article__title">T</h1><meta name="description" content="Don&#8217;t fight the tape &#8212; it&#39;s 4.1%.">`;
  const p = extractPost(html, '/gojo/stocks/x-2026-01-01.html');
  assert.equal(p.summary, `Don${String.fromCodePoint(8217)}t fight the tape ${String.fromCodePoint(8212)} it${String.fromCodePoint(39)}s 4.1%.`);
});

test('decodes hex numeric entities', () => {
  const html = `<h1 class="article__title">A &#x2192; B</h1>`;
  const p = extractPost(html, '/gojo/stocks/x-2026-01-01.html');
  assert.equal(p.title, 'A → B');
});

test('decodes extended named entities', () => {
  const html = `<h1 class="article__title">Up 3&deg; &times; 2 &rarr; done</h1>`;
  const p = extractPost(html, '/gojo/notes/2026-01-01-notes.html');
  assert.equal(p.title, 'Up 3° × 2 → done');
});
