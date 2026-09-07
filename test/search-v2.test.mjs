import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { rankResults, resultLabel, queryTerms, SCOPES } from '../resources/js/search.mjs';
import { buildIndex } from '../scripts/build-index.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const index = buildIndex(ROOT);

test('question-style queries drop scaffolding and keep the subject', () => {
  assert.deepEqual(queryTerms('How do I start investing?'.replace('?', '')), ['investing']);
  assert.deepEqual(queryTerms('what is a stock'), ['stock']);
  assert.deepEqual(queryTerms('the'), ['the'], 'all-stop-word query falls back to the words');
});

test('a plain-language question finds the beginner guide, not market research', () => {
  const r = rankResults(index, 'how do i start investing', 5);
  assert.ok(r.length > 0);
  assert.ok(['guide', 'tool', 'reference'].includes(r[0].kind), `top result is ${r[0].kind}: ${r[0].title}`);
  assert.match(r[0].url, /moneyhub/);
});

test('a ticker finds research first, and every ticker in a multi-ticker post counts', () => {
  assert.match(rankResults(index, 'SPY', 3)[0].url, /spy-market-review/);
  const gev = rankResults(index, 'gev', 3);
  assert.ok(gev.some(p => /etn-gev-vrt-fps/.test(p.url)), 'secondary ticker matches');
});

test('scopes narrow results to guides, research or journal', () => {
  assert.ok(SCOPES.map(s => s.id).includes('learn'));
  const learn = rankResults(index, 'money', 8, 'learn');
  assert.ok(learn.length && learn.every(p => ['guide', 'tool', 'reference'].includes(p.kind)));
  const research = rankResults(index, 'earnings', 8, 'research');
  assert.ok(research.length && research.every(p => p.kind === 'research'));
  const journal = rankResults(index, 'bedrockos', 8, 'journal');
  assert.ok(journal.length && journal.every(p => p.kind === 'journal'));
});

test('result labels say what a thing is and who wrote it', () => {
  const guide = index.find(p => p.kind === 'guide');
  assert.deepEqual(resultLabel(guide), { label: 'Beginner guide', author: 'Tui Alailima', ai: false });
  const tool = index.find(p => p.kind === 'tool');
  assert.equal(resultLabel(tool).label, 'Tool');
  const take = index.find(p => p.author === 'lelouch');
  assert.deepEqual(resultLabel(take), { label: 'Market research', author: 'Lelouch', ai: true });
  const note = index.find(p => p.kind === 'journal');
  assert.deepEqual(resultLabel(note), { label: 'Journal', author: 'Gojo', ai: true });
});

test('topic and heading terms are searchable', () => {
  const r = rankResults(index, 'emergencies', 5, 'learn');
  assert.ok(r.some(p => /emergency-fund/.test(p.url)), 'topic prepare-for-emergencies matches');
  const h = rankResults(index, 'trade plan', 5, 'research');
  assert.ok(h.length > 0, 'heading text matches');
});
