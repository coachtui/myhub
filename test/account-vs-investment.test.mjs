import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS, BUCKETS, grade, renderCards } from '../resources/js/account-vs-investment.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = p => readFileSync(join(ROOT, p), 'utf8');

test('twelve cards, four of each bucket, every answer a known bucket with an explanation', () => {
  assert.equal(ITEMS.length, 12);
  for (const b of Object.keys(BUCKETS)) assert.equal(ITEMS.filter(i => i.answer === b).length, 4, b);
  for (const i of ITEMS) assert.ok(i.why.length > 40, `${i.id} explains why`);
  assert.equal(new Set(ITEMS.map(i => i.id)).size, 12, 'ids unique');
});

test('grade: nothing answered, all correct, and a partial with the weakest bucket named', () => {
  const none = grade({});
  assert.equal(none.answered, 0);
  assert.match(none.title, /Pick a bucket/);
  const perfect = grade(Object.fromEntries(ITEMS.map(i => [i.id, i.answer])));
  assert.equal(perfect.correct, 12);
  assert.match(perfect.title, /All twelve/);
  const partial = grade(Object.fromEntries(ITEMS.map(i => [i.id, i.answer === 'ticker' ? 'investment' : i.answer])));
  assert.equal(partial.correct, 8);
  assert.equal(partial.byBucket.ticker, 4);
  assert.match(partial.meaning, /container/);
  assert.doesNotMatch(perfect.title + partial.title + partial.meaning, /wrong|fail|bad/i);
});

test('acronyms are expanded and the three definitions appear on the page', () => {
  const html = read('moneyhub/tools/account-vs-investment.html');
  assert.match(html, /An <strong>account<\/strong> is where money is held/);
  assert.match(html, /An <strong>investment<\/strong> is what the money owns/);
  assert.match(html, /A <strong>ticker<\/strong> is the short label/);
  assert.ok(ITEMS.find(i => i.id === 'roth-ira').why.includes('individual retirement account (IRA)'));
  assert.match(html, /data-result tabindex="-1" aria-live="polite"/);
  assert.match(html, /callout--personal/);
  assert.match(html, /<noscript>/);
});

test('cards render as labelled radio groups with one fieldset per card', () => {
  const html = renderCards();
  assert.equal((html.match(/<fieldset class="sort-card">/g) || []).length, 12);
  assert.equal((html.match(/type="radio"/g) || []).length, 36);
  assert.match(html, /<legend class="sort-card__name">Roth IRA<\/legend>/);
});

test('script never persists or transmits', () => {
  assert.doesNotMatch(read('resources/js/account-vs-investment.mjs'), /fetch\(|localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|document\.cookie/);
});
