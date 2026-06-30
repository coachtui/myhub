import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCounts } from '../resources/js/counts.mjs';

const index = [
  { url: '/gojo/stocks/a.html', section: 'Gojo', type: 'market-take', ticker: 'SPY', date: '2026-06-01' },
  { url: '/gojo/research/b.html', section: 'Gojo', type: 'deep-dive', ticker: 'NVDA', date: '2026-05-01' },
  { url: '/gojo/notes/c.html', section: 'Gojo', type: 'journal', ticker: '', date: '2026-06-02' },
  { url: '/moneyhub/investing/d.html', section: 'Wealth', type: 'wealth', ticker: '', date: '2026-04-01' },
  { url: '/moneyhub/step1.html', section: 'Wealth', type: 'wealth', ticker: '', date: '2026-03-01' },
  { url: '/healthhub/training.html', section: 'Health', type: 'health', ticker: '', date: '2026-02-01' },
];

test('computeCounts tallies the listing filters', () => {
  const c = computeCounts(index);
  assert.equal(c['market-takes'], 2); // market-take + deep-dive
  assert.equal(c['journal'], 1);
  assert.equal(c['investing'], 1);   // url under /moneyhub/investing/
  assert.equal(c['wealth'], 2);
  assert.equal(c['health'], 1);
});
