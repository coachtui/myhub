import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tickerCounts, renderChips } from '../resources/js/market-takes.mjs';

const posts = [
  { ticker: 'SPY', type: 'market-take' }, { ticker: 'SPY', type: 'market-take' },
  { ticker: 'NVDA', type: 'deep-dive' }, { ticker: '', type: 'market-take' },
];

test('tickerCounts sorts by count desc then ticker', () => {
  assert.deepEqual(tickerCounts(posts), [{ ticker: 'SPY', count: 2 }, { ticker: 'NVDA', count: 1 }]);
});

test('renderChips marks the active chip and always includes All', () => {
  const html = renderChips([{ ticker: 'SPY', count: 2 }], 'SPY');
  assert.match(html, /data-ticker=""[^>]*>All/);
  assert.match(html, /data-ticker="SPY"[^>]*aria-pressed="true"/);
  assert.match(html, /SPY/);
});

test('renderChips with no active ticker marks All active', () => {
  const html = renderChips([{ ticker: 'SPY', count: 2 }], '');
  assert.match(html, /data-ticker=""[^>]*aria-pressed="true"/);
});
