import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankResults } from '../resources/js/search.mjs';

const index = [
  { url: '/a', title: 'SPY Weekly Review', summary: 'index melt-up', section: 'Gojo', ticker: 'SPY', date: '2026-06-28' },
  { url: '/b', title: 'Oracle deep dive', summary: 'SPY mentioned once', section: 'Gojo', ticker: 'ORCL', date: '2026-06-26' },
  { url: '/c', title: 'Emergency fund guide', summary: 'how much to save', section: 'Wealth', ticker: '', date: '2026-06-10' },
];

test('exact ticker ranks first', () => {
  const r = rankResults(index, 'spy');
  assert.equal(r[0].url, '/a');
});

test('keyword search works across sections (not just tickers)', () => {
  const r = rankResults(index, 'emergency fund');
  assert.equal(r[0].url, '/c');
});

test('empty query returns nothing', () => {
  assert.deepEqual(rankResults(index, '   '), []);
});
