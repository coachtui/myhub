import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FREQUENCIES, planPaycheck, renderSplit } from '../resources/js/paycheck-planner.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = p => readFileSync(join(ROOT, p), 'utf8');

test('frequencies carry paychecks per year and the extra-paycheck months', () => {
  assert.equal(FREQUENCIES.biweekly.perYear, 26);
  assert.equal(FREQUENCIES.biweekly.extraMonths, 2);
  assert.equal(FREQUENCIES.weekly.extraMonths, 4);
  assert.equal(FREQUENCIES.semimonthly.extraMonths, 0);
});

test('empty asks for a paycheck; unknown frequency falls back to biweekly', () => {
  assert.equal(planPaycheck({}).status, 'empty');
  assert.equal(planPaycheck({ pay: '1000', frequency: 'nonsense' }).frequency, 'biweekly');
});

test('biweekly: budgets on two paychecks, names the two extra months, splits correctly', () => {
  const r = planPaycheck({ pay: '1,500', frequency: 'biweekly', required: '2,000', savings: '300' });
  assert.equal(r.status, 'room');
  assert.equal(r.budgetChecks, 2);
  assert.equal(r.requiredPer, 1000);
  assert.equal(r.savingsPer, 150);
  assert.equal(r.left, 350);
  assert.ok(Math.abs(r.monthlyIncome - 3250) < 1e-9);
  assert.match(r.meaning, /2 extra-paycheck months a year add a full \$1,500 each/);
  assert.match(r.title, /\$1,000 for required costs, \$150 to savings, \$350 left/);
});

test('short, overcommitted, and thin cases each explain without blame and point somewhere useful', () => {
  const short = planPaycheck({ pay: '900', frequency: 'biweekly', required: '2,000' });
  assert.equal(short.status, 'short');
  assert.match(short.meaning, /not a character one/);
  assert.match(short.action.href, /money-reset/);
  const over = planPaycheck({ pay: '1200', frequency: 'monthly', required: '900', savings: '400' });
  assert.equal(over.status, 'overcommitted');
  assert.equal(over.left, -100);
  assert.match(over.action.href, /savings-ladder/);
  const thin = planPaycheck({ pay: '1000', frequency: 'semimonthly', required: '1700', savings: '200' });
  assert.equal(thin.status, 'thin');
  assert.ok(thin.leftPct < 0.1);
  assert.doesNotMatch(thin.meaning, /extra-paycheck/, 'twice a month has no extra paychecks');
  assert.doesNotMatch(short.meaning + over.meaning + thin.meaning, /fail|irresponsible|shame/i);
});

test('negatives clamp with a note; huge values do not break; split renders bars and values', () => {
  const r = planPaycheck({ pay: '1e9', frequency: 'weekly', required: '-5', savings: '10' });
  assert.deepEqual(r.notes, ['Monthly required costs']);
  assert.ok(Number.isFinite(r.left));
  const html = renderSplit(r);
  assert.match(html, /Left for everything else/);
  assert.doesNotMatch(html, /NaN|Infinity/);
  assert.equal(renderSplit(planPaycheck({})), '');
});

test('page: labelled inputs and select, live result, privacy, personal note, script', () => {
  const html = read('moneyhub/tools/paycheck-planner.html');
  for (const id of ['pp-pay', 'pp-required', 'pp-savings']) assert.match(html, new RegExp(`<label class="field" for="${id}">[\\s\\S]*?<input id="${id}"`));
  assert.match(html, /for="pp-frequency"[\s\S]*?<select id="pp-frequency"/);
  assert.match(html, /data-result tabindex="-1" aria-live="polite"/);
  assert.match(html, /never leave this page/);
  assert.match(html, /callout--personal/);
  assert.match(html, /<noscript>/);
  assert.doesNotMatch(read('resources/js/paycheck-planner.mjs'), /fetch\(|localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|document\.cookie/);
});
