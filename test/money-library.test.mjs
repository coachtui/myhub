import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PURPOSES, filterLibrary, groupLibrary, renderLibrary, stageOf, isLibraryItem } from '../resources/js/money-library.mjs';
import { buildIndex } from '../scripts/build-index.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const index = buildIndex(ROOT);
const read = p => readFileSync(join(ROOT, p), 'utf8');

test('every Moneyhub guide, tool and reference page is a library item, and nothing else is', () => {
  const items = index.filter(isLibraryItem);
  const money = index.filter(p => p.section === 'Wealth');
  assert.equal(items.length, money.length, 'all Money pages are library items');
  assert.ok(items.every(p => !p.url.includes('/research/')));
  assert.ok(items.length >= 23);
});

test('every library item lands in exactly one purpose group, and all topics are known purposes', () => {
  const items = index.filter(isLibraryItem);
  const grouped = groupLibrary(items).flatMap(g => g.items.map(i => i.url));
  assert.deepEqual([...grouped].sort(), items.map(i => i.url).sort());
  const known = new Set(PURPOSES.map(p => p.id));
  for (const i of items) for (const t of i.topics) assert.ok(known.has(t), `${i.url}: topic ${t}`);
});

test('stage follows the first purpose topic', () => {
  assert.equal(stageOf({ topics: ['manage-the-month'] }), 'Survive');
  assert.equal(stageOf({ topics: ['handle-debt'] }), 'Stabilize');
  assert.equal(stageOf({ topics: ['start-investing', 'manage-the-month'] }), 'Grow');
  assert.equal(stageOf({ topics: [] }), '');
});

test('filters narrow by stage, topic, level and reading time; "all" is a no-op', () => {
  const all = filterLibrary(index, { stage: 'all', topic: 'all', level: 'all', read: 'all' });
  assert.equal(all.length, index.filter(isLibraryItem).length);
  const grow = filterLibrary(index, { stage: 'Grow' });
  assert.ok(grow.length > 0 && grow.every(p => stageOf(p) === 'Grow'));
  const debt = filterLibrary(index, { topic: 'handle-debt' });
  assert.ok(debt.some(p => /step2/.test(p.url)));
  const short = filterLibrary(index, { read: 'short' });
  assert.ok(short.every(p => p.readTime <= 5 && p.kind !== 'tool'));
  assert.equal(filterLibrary(index, { level: 'advanced' }).length, 0, 'no advanced material in the library');
});

test('series items are ordered by their step within a group', () => {
  const g = groupLibrary(filterLibrary(index, { topic: 'understand-markets' })).find(x => x.id === 'understand-markets');
  const lessons = g.items.filter(i => i.series === 'market-basics').map(i => i.order);
  assert.deepEqual(lessons, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('renderLibrary shows kind, stage, level and reading time on every card, and an empty state', () => {
  const html = renderLibrary(index, {});
  assert.match(html, /library-group/);
  assert.match(html, /post-card__badge">Tool</);
  assert.match(html, /Guide · Survive · beginner · \d+ min read/);
  assert.match(html, /Tool · Survive · beginner · about 10 min/);
  assert.match(renderLibrary(index, { level: 'advanced' }), /listing-empty/);
});

test('library page has labelled filters, a live status, a noscript fallback, and the personal note', () => {
  const html = read('moneyhub/library/index.html');
  assert.match(html, /<legend>Stage<\/legend>/);
  for (const name of ['topic', 'level', 'read']) assert.match(html, new RegExp(`<select name="${name}">`));
  assert.match(html, /id="library-status" aria-live="polite"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /callout--personal/);
  assert.match(html, /href="\/moneyhub\/market-lab\/"/);
});

test('Market Lab is visibly distinct from beginner material', () => {
  const html = read('moneyhub/market-lab/index.html');
  assert.match(html, /callout--ai/);
  assert.match(html, /do not need to understand candlesticks/);
  assert.match(html, /data-listing-types="lelouch-take,market-take,deep-dive"/);
  assert.match(html, /href="\/moneyhub\/start-here\/"/);
});

test('Your Foundation lists the three stages with the steps and the live tool', () => {
  const html = read('moneyhub/foundation/index.html');
  for (const s of ['Survive', 'Stabilize', 'Grow']) assert.ok(html.includes(s));
  assert.match(html, /href="\/moneyhub\/tools\/money-reset\.html"/);
  for (let i = 1; i <= 5; i++) assert.match(html, new RegExp(`href="/moneyhub/step${i}-`));
});
