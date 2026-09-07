import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMoney, parsePercent, formatMonths } from '../resources/js/lib/money.mjs';
import { RUNGS, buildLadder, renderLadder } from '../resources/js/savings-ladder.mjs';
import { amortise, computeDebt, renderScenarios } from '../resources/js/debt-cost.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = p => readFileSync(join(ROOT, p), 'utf8');

/* ---------- shared helpers ---------- */

test('parsePercent and formatMonths handle messy and edge input', () => {
  assert.deepEqual(parsePercent('24%'), { value: 24, note: '' });
  assert.deepEqual(parsePercent(''), { value: 0, note: 'blank' });
  assert.equal(parsePercent('99999').value, 1000);
  assert.equal(formatMonths(0), 'now');
  assert.equal(formatMonths(0.4), 'under a month');
  assert.equal(formatMonths(7), '7 months');
  assert.equal(formatMonths(24), '2 years');
  assert.equal(formatMonths(30.4), '2 years 6 months');
  assert.equal(parseMoney('$2,500').value, 2500);
});

/* ---------- savings ladder ---------- */

test('ladder: empty essentials asks for the number and points at the Money Reset', () => {
  const r = buildLadder({});
  assert.equal(r.status, 'empty');
  assert.match(r.action.href, /money-reset/);
});

test('ladder: rungs scale from essentials, starter is capped, next rung and ETA are right', () => {
  const r = buildLadder({ essentials: '2,800', saved: '600', monthly: '150' });
  assert.equal(r.rungs.length, RUNGS.length);
  assert.deepEqual(r.rungs.map(g => g.target), [500, 2800, 8400, 16800, 33600]);
  assert.equal(r.rungs[0].reached, true);
  assert.equal(r.next.id, 'one');
  assert.equal(r.next.remaining, 2200);
  assert.ok(Math.abs(r.next.monthsAway - 2200 / 150) < 1e-9);
  assert.match(r.title, /one month of essentials, \$2,800/);
  assert.match(r.meaning, /about 1 year 3 months away/);
});

test('ladder: no monthly amount still gives targets; past the top rung points at investing', () => {
  const r = buildLadder({ essentials: '1000' });
  assert.equal(r.next.monthsAway, null);
  assert.match(r.meaning, /Add a monthly amount/);
  const top = buildLadder({ essentials: '1000', saved: '20000' });
  assert.equal(top.next, null);
  assert.equal(top.action.href, '/moneyhub/#checkup');
  assert.equal(renderLadder(top).match(/is-reached/g).length, 5);
});

test('ladder: negatives clamp with a note; huge values do not break', () => {
  const r = buildLadder({ essentials: '3000', saved: '-5', monthly: '1e9' });
  assert.deepEqual(r.notes, ['Current savings']);
  assert.ok(r.rungs.every(g => Number.isFinite(g.monthsAway)));
  assert.doesNotMatch(renderLadder(r), /NaN|Infinity/);
});

/* ---------- debt cost ---------- */

test('amortise matches the closed-form payoff time and handles zero-rate and never-pays-off', () => {
  const r = 0.24 / 12, B = 5000, P = 150;
  const closed = Math.ceil(-Math.log(1 - r * B / P) / Math.log(1 + r));
  const a = amortise(B, 24, P);
  assert.ok(Math.abs(a.months - closed) <= 1, `${a.months} vs ${closed}`);
  assert.ok(a.interest > 3000 && a.interest < 3500, `interest ${a.interest}`);
  assert.deepEqual(amortise(1200, 0, 100), { months: 12, interest: 0, neverPaysOff: false });
  assert.equal(amortise(5000, 24, 100).neverPaysOff, true, 'payment equals monthly interest');
  assert.equal(amortise(0, 24, 100).months, 0);
});

test('computeDebt: empty, no payment, stuck, and normal cases each give one prominent result and a next move', () => {
  assert.equal(computeDebt({}).status, 'empty');
  assert.equal(computeDebt({ balance: '5000', apr: '24' }).status, 'no-payment');
  const stuck = computeDebt({ balance: '5000', apr: '24', payment: '90' });
  assert.equal(stuck.status, 'stuck');
  assert.match(stuck.meaning, /not a verdict on you/);
  assert.ok(stuck.scenarios.length >= 1 && stuck.scenarios.every(s => !s.neverPaysOff));
  const ok = computeDebt({ balance: '5,000', apr: '24%', payment: '$150' });
  assert.equal(ok.status, 'ok');
  assert.equal(ok.scenarios.length, 4);
  assert.ok(ok.scenarios[1].interest < ok.scenarios[0].interest, 'more per month, less interest');
  assert.match(ok.meaning, /Adding \$50 a month saves \$/);
  assert.equal(ok.expensive, true);
  const cheap = computeDebt({ balance: '10000', apr: '5', payment: '300' });
  assert.equal(cheap.expensive, false);
  assert.match(cheap.action.href, /savings-ladder/);
  assert.doesNotMatch(ok.meaning + cheap.meaning + stuck.meaning, /stupid|irresponsible|fail|shame/i);
});

test('renderScenarios is a real table with headers', () => {
  const html = renderScenarios(computeDebt({ balance: '2000', apr: '20', payment: '100' }).scenarios);
  assert.match(html, /<table class="debt-table">/);
  assert.match(html, /<th scope="col">Total interest<\/th>/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

/* ---------- pages ---------- */

for (const [page, script, ids] of [
  ['moneyhub/tools/savings-ladder.html', 'savings-ladder.mjs', ['ladder-essentials', 'ladder-saved', 'ladder-monthly']],
  ['moneyhub/tools/debt-cost.html', 'debt-cost.mjs', ['debt-balance', 'debt-apr', 'debt-payment']],
]) {
  test(`${page}: labelled inputs, live result, privacy statement, personal note, script`, () => {
    const html = read(page);
    for (const id of ids) assert.match(html, new RegExp(`<label class="field" for="${id}">[\\s\\S]*?<input id="${id}"`));
    assert.match(html, /data-result tabindex="-1" aria-live="polite"/);
    assert.match(html, /never leave this page/);
    assert.match(html, /callout--personal/);
    assert.match(html, new RegExp(`src="/resources/js/${script}"`));
    assert.match(html, /<noscript>/);
  });
}

test('tool scripts never persist or transmit input', () => {
  for (const f of ['resources/js/savings-ladder.mjs', 'resources/js/debt-cost.mjs', 'resources/js/lib/money.mjs']) {
    assert.doesNotMatch(read(f), /fetch\(|localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|document\.cookie/, f);
  }
});
