import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { buildIndex, serializeIndex, INDEX_PATH } from '../scripts/build-index.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('buildIndex returns the shaped, sorted post list', () => {
  const posts = buildIndex(ROOT);
  assert.ok(posts.length > 100, `expected >100 posts, got ${posts.length}`);
  assert.deepEqual(Object.keys(posts[0]).sort(), ['date', 'section', 'summary', 'ticker', 'title', 'type', 'url']);
});

test('sorted by date desc, then url asc within a date (deterministic)', () => {
  const posts = buildIndex(ROOT);
  for (let i = 1; i < posts.length; i++) {
    const a = posts[i - 1], b = posts[i];
    if ((a.date || '') === (b.date || '')) {
      assert.ok(a.url < b.url, `tie not url-ordered: ${a.url} before ${b.url}`);
    } else {
      assert.ok((a.date || '') > (b.date || '') || (a.date && !b.date), `date order broken: ${a.date} before ${b.date}`);
    }
  }
});

test('serializeIndex is single-line JSON with trailing newline', () => {
  const s = serializeIndex([{ url: '/a', title: 't', summary: 's', section: 'Gojo', type: 'journal', ticker: '', date: '2026-01-01' }]);
  assert.ok(s.endsWith('\n'));
  assert.equal(s.indexOf('\n'), s.length - 1, 'should be exactly one line + trailing newline');
});

test('INDEX_PATH points at the committed index', () => {
  assert.equal(INDEX_PATH, 'resources/data/search-index.json');
});
