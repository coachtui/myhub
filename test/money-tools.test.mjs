import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUESTIONS, recommend } from '../resources/js/money-checkup.mjs';
import { FIELDS, parseMoney, computeReset } from '../resources/js/money-reset.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = p => readFileSync(join(ROOT, p), 'utf8');

/* ---------- checkup ---------- */

test('checkup asks five questions with three options each', () => {
  assert.equal(QUESTIONS.length, 5);
  for (const q of QUESTIONS) assert.equal(q.options.length, 3, q.id);
});

test('recommend: bills behind → Survive and the Money Reset, investing still linked', () => {
  const r = recommend({ bills: 'no', buffer: 'strong', debt: 'no', match: 'using', horizon: 'yes' });
  assert.equal(r.stage, 'Survive');
  assert.equal(r.primary.href, '/moneyhub/tools/money-reset.html');
  assert.match(r.secondary.href, /why-invest/);
});

test('recommend: no buffer → Stabilize with the cushion first', () => {
  const r = recommend({ bills: 'yes', buffer: 'none', debt: 'no', match: 'none', horizon: 'yes' });
  assert.equal(r.stage, 'Stabilize');
  assert.match(r.primary.href, /emergency-fund/);
});

test('recommend: hard debt → Stabilize with a payoff plan; match note added when unused match exists', () => {
  const r = recommend({ bills: 'yes', buffer: 'starter', debt: 'high', match: 'available', horizon: 'yes' });
  assert.equal(r.stage, 'Stabilize');
  assert.match(r.primary.href, /high-interest-debt/);
  assert.match(r.body, /workplace match/);
  assert.equal(r.secondary.href, '/moneyhub/investing/');
});

test('recommend: short horizon → Stabilize; unsure horizon → Grow small; long horizon → Grow', () => {
  assert.equal(recommend({ bills: 'yes', buffer: 'strong', debt: 'no', match: 'using', horizon: 'no' }).stage, 'Stabilize');
  const maybe = recommend({ bills: 'yes', buffer: 'strong', debt: 'no', match: 'using', horizon: 'maybe' });
  assert.equal(maybe.stage, 'Grow');
  const grow = recommend({ bills: 'yes', buffer: 'strong', debt: 'manageable', match: 'available', horizon: 'yes' });
  assert.equal(grow.stage, 'Grow');
  assert.match(grow.body, /workplace match/);
  assert.equal(grow.primary.href, '/moneyhub/investing/');
});

test('recommend never promises returns and always includes two destinations', () => {
  const combos = [];
  for (const b of ['yes', 'sometimes', 'no']) for (const f of ['none', 'starter', 'strong']) for (const d of ['no', 'manageable', 'high'])
    for (const m of ['using', 'available', 'none']) for (const h of ['yes', 'maybe', 'no']) combos.push({ bills: b, buffer: f, debt: d, match: m, horizon: h });
  for (const c of combos) {
    const r = recommend(c);
    assert.ok(['Survive', 'Stabilize', 'Grow'].includes(r.stage));
    assert.ok(r.primary.href.startsWith('/moneyhub/') && r.secondary.href.startsWith('/moneyhub/'));
    assert.doesNotMatch(r.body + r.title, /guarantee|will return|\d+%/i);
  }
  assert.equal(combos.length, 243);
});

/* ---------- money reset ---------- */

test('parseMoney accepts messy input and clamps negatives', () => {
  assert.deepEqual(parseMoney('$1,250.50'), { value: 1250.5, note: '' });
  assert.deepEqual(parseMoney(''), { value: 0, note: 'blank' });
  assert.deepEqual(parseMoney('abc'), { value: 0, note: 'blank' });
  assert.deepEqual(parseMoney(-40), { value: 0, note: 'negative' });
  assert.equal(parseMoney('1e12').value, 1e12);
  assert.equal(parseMoney(undefined).value, 0);
});

test('computeReset: empty form asks for income first', () => {
  const r = computeReset({});
  assert.equal(r.status, 'empty');
  assert.match(r.action.href, /step1/);
});

test('computeReset: required larger than income → short, no shame, step 1', () => {
  const r = computeReset({ income: '3000', required: '3400', worthIt: '0', notWorthIt: '0' });
  assert.equal(r.status, 'short');
  assert.equal(r.afterRequired, -400);
  assert.match(r.meaning, /not a judgement/);
  assert.doesNotMatch(r.meaning, /fail|blame|irresponsible/i);
});

test('computeReset: flexible spending overshoots → overspent, points at not-worth-it first', () => {
  const r = computeReset({ income: '3000', required: '2000', worthIt: '800', notWorthIt: '400' });
  assert.equal(r.status, 'overspent');
  assert.equal(r.afterAll, -200);
  assert.match(r.meaning, /\$400/);
});

test('computeReset: thin margin → cushion; room → runway checkup', () => {
  const thin = computeReset({ income: '3000', required: '2800', worthIt: '50', notWorthIt: '50' });
  assert.equal(thin.status, 'thin');
  assert.match(thin.action.href, /emergency-fund/);
  const room = computeReset({ income: '5,000', required: '$3,000', worthIt: '600', notWorthIt: '200.25' });
  assert.equal(room.status, 'room');
  assert.equal(room.afterAll, 1199.75);
  assert.equal(room.action.href, '/moneyhub/#checkup');
});

test('computeReset: negatives are clamped and reported; huge values do not break', () => {
  const r = computeReset({ income: '4000', required: '-100', worthIt: '1e9', notWorthIt: '0' });
  assert.deepEqual(r.notes, ['Required']);
  assert.equal(r.status, 'overspent');
  assert.ok(Number.isFinite(r.afterAll));
});

/* ---------- pages ---------- */

test('Moneyhub landing: situation selector and investing hook come before everything else', () => {
  const html = read('moneyhub/index.html');
  const cards = html.match(/class="situation-card"/g) || [];
  assert.equal(cards.length, 6);
  const firstCard = html.indexOf('class="situation-card"');
  for (const later of ['id="checkup"', 'Money Library', 'callout--personal', 'The whole system']) {
    assert.ok(firstCard < html.indexOf(later), `situation cards come before ${later}`);
  }
  assert.match(html, /href="\/moneyhub\/investing\/"[^>]*>Go straight to investing/);
  assert.match(html, /build a life that allows you to hold them for decades/);
  for (const stage of ['Survive', 'Stabilize', 'Grow']) assert.ok(html.includes(`situation-card__stage">${stage}<`), `stage ${stage} is written out as a word`);
  assert.doesNotMatch(html, /situation-card__mark/, 'no single-letter stage marks');
  assert.match(html, /src="\/resources\/js\/money-checkup\.mjs"/);
  assert.match(html, /data-result tabindex="-1" aria-live="polite"/);
  assert.match(html, /role="alert"/);
});

test('Money Reset page: every input labelled, result region live, clear action, privacy stated', () => {
  const html = read('moneyhub/tools/money-reset.html');
  for (const f of FIELDS) {
    assert.match(html, new RegExp(`name="${f.id}"`), `input ${f.id}`);
    assert.ok(html.includes(f.label), `label ${f.label}`);
  }
  for (const id of html.matchAll(/<input id="([^"]+)"/g)) assert.match(html, new RegExp(`<label class="field" for="${id[1]}"`), `label for ${id[1]}`);
  assert.match(html, /data-result tabindex="-1" aria-live="polite"/);
  assert.match(html, /never leave this page/);
  assert.match(html, /callout--personal/);
  assert.match(html, /<noscript>/);
});

test('tool scripts never persist or transmit input', () => {
  for (const f of ['resources/js/money-checkup.mjs', 'resources/js/money-reset.mjs']) {
    const src = read(f);
    assert.doesNotMatch(src, /fetch\(|localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|document\.cookie|navigator\.share/, f);
  }
});
