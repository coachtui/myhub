import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractPost } from '../scripts/lib/extract-post.mjs';

const html = readFileSync(new URL('./fixtures/sample-take.html', import.meta.url), 'utf8');

test('extracts title, summary, section, type, ticker, date from a stock take', () => {
  const p = extractPost(html, '/gojo/stocks/spy-market-review-2026-06-28.html');
  assert.equal(p.title, 'SPY Market Review — June 28, 2026: The AI Tax Arrives');
  assert.match(p.summary, /Apple & Microsoft hiked/);
  assert.equal(p.section, 'Gojo');
  assert.equal(p.type, 'market-take');
  assert.equal(p.ticker, 'SPY');
  assert.equal(p.date, '2026-06-28');
  assert.equal(p.url, '/gojo/stocks/spy-market-review-2026-06-28.html');
});

test('classifies a journal note and falls back to prose date', () => {
  const note = '<h1 class="article__title">Daily Note</h1><p>Logged June 24, 2026 here.</p>';
  const p = extractPost(note, '/gojo/notes/2026-05-21-notes.html');
  assert.equal(p.type, 'journal');
  assert.equal(p.section, 'Gojo');
  assert.equal(p.ticker, '');
  assert.equal(p.date, '2026-05-21');
});

test('classifies a lelouch stock take with ticker from filename', () => {
  const p = extractPost(html, '/lelouch/stocks/myrg-august-2026-analysis.html');
  assert.equal(p.section, 'Lelouch');
  assert.equal(p.type, 'lelouch-take');
  assert.equal(p.ticker, 'MYRG');
});

test('classifies wealth and health by directory', () => {
  assert.equal(extractPost('<h1 class="article__title">X</h1>', '/moneyhub/step4-investing-basics.html').section, 'Wealth');
  assert.equal(extractPost('<h1 class="article__title">X</h1>', '/healthhub/training.html').type, 'health');
});

test('prose-date fallback converts "Month DD, YYYY" when filename has no date', () => {
  const note = '<h1 class="article__title">Daily Note</h1><p>Logged June 24, 2026 here.</p>';
  const p = extractPost(note, '/gojo/notes/daily-note.html');
  assert.equal(p.date, '2026-06-24');
});
