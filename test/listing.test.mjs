import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterPosts, renderListing, prettyDate } from '../resources/js/listing.mjs';

const index = [
  { url: '/a', title: 'SPY Weekly', summary: 'index melt-up', section: 'Gojo', type: 'market-take', ticker: 'SPY', date: '2026-06-28' },
  { url: '/b', title: 'NVDA Deep Dive', summary: 'DVRG framework', section: 'Gojo', type: 'deep-dive', ticker: 'NVDA', date: '2026-06-20' },
  { url: '/c', title: 'What the cron saw', summary: 'build log', section: 'Gojo', type: 'journal', ticker: '', date: '2026-06-25' },
];

test('filterPosts by types, sorted desc', () => {
  const r = filterPosts(index, { types: ['market-take', 'deep-dive'] });
  assert.deepEqual(r.map(p => p.url), ['/a', '/b']);
});

test('filterPosts by ticker (exact) and query (substring)', () => {
  assert.deepEqual(filterPosts(index, { types: ['market-take', 'deep-dive'], ticker: 'NVDA' }).map(p => p.url), ['/b']);
  assert.deepEqual(filterPosts(index, { types: ['journal'], query: 'cron' }).map(p => p.url), ['/c']);
  assert.deepEqual(filterPosts(index, { types: ['market-take', 'deep-dive'], query: 'melt' }).map(p => p.url), ['/a']);
});

test('renderListing renders a card per post and escapes', () => {
  const html = renderListing([{ url: '/x', title: '<b>Hi</b> & "q"', summary: 'S&P', section: 'Gojo', type: 'market-take', ticker: 'SPY', date: '2026-06-28' }]);
  assert.match(html, /href="\/x"/);
  assert.match(html, /&lt;b&gt;Hi&lt;\/b&gt; &amp; &quot;q&quot;/);
  assert.match(html, /June 28, 2026/);
  assert.match(html, /SPY/);
});

test('renderListing empty → message', () => {
  assert.match(renderListing([]), /listing-empty/);
});

test('prettyDate formats ISO, blanks on bad input', () => {
  assert.equal(prettyDate('2026-06-28'), 'June 28, 2026');
  assert.equal(prettyDate(''), '');
});
