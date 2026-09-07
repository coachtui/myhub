import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS, TYPES, NAV, CONTENT_DIRS, classifyUrl, sectionForUrl, typeLabel, feedBadge, kickerFor } from '../resources/js/sections.mjs';

test('every content type belongs to a declared section', () => {
  const ids = new Set(SECTIONS.map(s => s.id));
  for (const [type, t] of Object.entries(TYPES)) assert.ok(ids.has(t.section), `${type} → unknown section ${t.section}`);
});

test('content directories are unambiguous (no directory is a prefix of another)', () => {
  for (const a of CONTENT_DIRS) for (const b of CONTENT_DIRS) {
    if (a !== b) assert.ok(!(b + '/').startsWith(a + '/'), `${a} is a prefix of ${b}`);
  }
});

test('classifyUrl maps each directory to its type and section', () => {
  assert.deepEqual(classifyUrl('/research/gojo/stocks/spy-x.html'), { type: 'market-take', section: 'Gojo', ticker: true });
  assert.deepEqual(classifyUrl('/research/gojo/research/nvda.html'), { type: 'deep-dive', section: 'Gojo', ticker: true });
  assert.deepEqual(classifyUrl('/research/gojo/notes/2026-05-01-notes.html'), { type: 'journal', section: 'Gojo', ticker: false });
  assert.deepEqual(classifyUrl('/research/lelouch/stocks/vst.html'), { type: 'lelouch-take', section: 'Lelouch', ticker: true });
  assert.deepEqual(classifyUrl('/moneyhub/investing/account-types.html'), { type: 'wealth', section: 'Wealth', ticker: false });
  assert.deepEqual(classifyUrl('/healthhub/training.html'), { type: 'health', section: 'Health', ticker: false });
  assert.deepEqual(classifyUrl('/about/index.html'), { type: 'page', section: 'Site', ticker: false });
});

test('sectionForUrl resolves author defaults by URL prefix', () => {
  assert.equal(sectionForUrl('/research/gojo/stocks/a.html').author, 'Gojo (AI analyst)');
  assert.equal(sectionForUrl('/research/lelouch/stocks/a.html').author, 'Lelouch (AI analyst)');
  assert.equal(sectionForUrl('/moneyhub/qa.html').author, 'Tui Alailima');
  assert.equal(sectionForUrl('/nowhere.html'), null);
  assert.equal(sectionForUrl('/research/index.html').id, 'research');
  assert.equal(sectionForUrl('/research/gojo/notes/x.html').id, 'gojo');
});

test('nav is derived from sections in order', () => {
  assert.deepEqual(NAV.map(n => n.label), ['Money', 'Health', 'Work & Projects', 'Research & Notes', 'About']);
  for (const s of SECTIONS.filter(x => !x.nav)) assert.ok(SECTIONS.some(p => p.id === s.parent && p.nav), `${s.id} has a nav parent`);
  assert.ok(NAV.every(n => n.href.startsWith('/') && n.href.endsWith('/')));
});

test('labels fall back to the section name for unknown types', () => {
  const p = { type: 'mystery', section: 'Gojo' };
  assert.equal(typeLabel(p), 'GOJO');
  assert.equal(feedBadge(p), 'GOJO');
  assert.equal(kickerFor(p), 'GOJO');
  assert.equal(feedBadge({ type: 'wealth', section: 'Wealth' }), 'WEALTH');
  assert.equal(feedBadge({ type: 'journal', section: 'Gojo' }), 'JOURNAL');
  assert.equal(typeLabel({ type: 'deep-dive', section: 'Gojo' }), 'DEEP DIVE');
  assert.equal(kickerFor({ type: 'journal', section: 'Gojo' }), 'GOJO');
});
