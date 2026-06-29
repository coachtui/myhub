import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFeedRows } from '../resources/js/feed.mjs';

const index = [
  { url: '/a', title: 'SPY Weekly Review', section: 'Gojo', type: 'market-take', ticker: 'SPY', date: '2026-06-28' },
  { url: '/b', title: 'Emergency Fund', section: 'Wealth', type: 'wealth', ticker: '', date: '2026-06-10' },
];

test('renders one row per post with title, link, badge, date', () => {
  const html = renderFeedRows(index);
  assert.ok(html.includes('href="/a"'));
  assert.ok(html.includes('SPY'));
  assert.ok(html.includes('Emergency Fund'));
  assert.ok(html.includes('2026-06-28'));
});

test('respects the limit', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({ url: '/' + i, title: 't' + i, section: 'Gojo', ticker: '', date: '2026-01-' + String(i + 1).padStart(2, '0') }));
  const html = renderFeedRows(many, 5);
  assert.equal((html.match(/<a class="feed-row"/g) || []).length, 5);
});
