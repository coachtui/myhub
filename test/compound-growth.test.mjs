import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseShillerCsv, buildSeries, rollingStats, drawdowns, annualised, buildMarketHistory } from '../scripts/lib/market-history.mjs';
import { project, contributed, assumptions, computeCompound, renderChart, renderTable, renderEvidence } from '../resources/js/compound-growth.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = p => readFileSync(join(ROOT, p), 'utf8');
const history = JSON.parse(read('resources/data/market-history.json'));

/* ---------- data pipeline ---------- */

test('parseShillerCsv stops at the first incomplete row', () => {
  const csv = 'Date,SP500,Dividend,Earnings,Consumer Price Index\n1871-01-01,4,0.26,0.4,12\n1871-02-01,5,0.26,0.4,12\n1871-03-01,6,0.0,0.0,0.0\n1871-04-01,7,0.3,0.4,12';
  const rows = parseShillerCsv(csv);
  assert.deepEqual(rows.map(r => r.date), ['1871-01', '1871-02']);
});

test('buildSeries reinvests dividends and deflates by CPI', () => {
  const rows = [{ date: 'a', price: 100, dividend: 12, cpi: 100 }, { date: 'b', price: 110, dividend: 12, cpi: 110 }];
  const s = buildSeries(rows);
  assert.ok(Math.abs(s.nominal[1] - 1.11) < 1e-9, 'price 100→110 plus 1 of dividend = 1.11');
  assert.ok(Math.abs(s.real[1] - 1.11 * 100 / 110) < 1e-9);
});

test('rollingStats, annualised and drawdowns behave on a known series', () => {
  const idx = Array.from({ length: 25 }, (_, i) => Math.pow(1.07, i / 12)); // 7% a year, 2 years
  const st = rollingStats(idx, 12);
  assert.ok(Math.abs(st.median - 0.07) < 1e-6 && st.negativeShare === 0 && st.count === 13);
  assert.ok(Math.abs(annualised(idx) - 0.07) < 1e-6);
  const dd = drawdowns(['1', '2', '3', '4', '5'], [1, 2, 1, 2.5, 2]);
  assert.equal(dd[0].depth, -0.5);
  assert.equal(dd[0].peak, '2');
  assert.equal(dd[0].recovered, '4');
  assert.equal(dd[1].recovered, null, 'open drawdown at the end is reported');
});

test('committed market-history.json is Shiller-shaped, dated, and plausible', () => {
  assert.equal(history.source.coverage.from, '1871-01');
  assert.ok(history.source.coverage.to >= '2023-06', `coverage ends ${history.source.coverage.to}`);
  assert.match(history.source.retrieved, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(history.source.months > 1800);
  const h30 = history.horizons['30'].real, h10 = history.horizons['10'].real;
  assert.ok(h30.median > 0.04 && h30.median < 0.09, `30y real median ${h30.median}`);
  assert.ok(h30.p10 < h30.median && h30.median < h30.p90 && h30.min <= h30.p10 && h30.p90 <= h30.max);
  assert.equal(h30.negativeShare, 0, 'no 30-year real loss in the record');
  assert.ok(h10.negativeShare > 0.02 && h10.negativeShare < 0.35, `10y loss share ${h10.negativeShare}`);
  assert.ok(history.horizons['30'].nominal.median > h30.median, 'nominal exceeds real');
  assert.ok(history.drawdowns[0].depth < -0.5, 'the worst real drawdown is deeper than 50%');
  assert.ok(history.yearly.years[0] === 1871);
});

test('buildMarketHistory is deterministic for a fixed input and date', () => {
  const csv = read('test/fixtures/shiller-sample.csv');
  const a = buildMarketHistory(csv, { retrieved: '2026-01-01', sourceUrl: 'x' });
  const b = buildMarketHistory(csv, { retrieved: '2026-01-01', sourceUrl: 'x' });
  assert.deepEqual(a, b);
  assert.equal(a.source.coverage.from, '1871-01');
  assert.ok(a.horizons['10'].real.count > 0);
});

/* ---------- projection ---------- */

test('project: no growth equals contributions; growth compounds monthly; delay defers contributions', () => {
  assert.deepEqual(project({ monthly: 100, years: 2, rate: 0 }), [0, 1200, 2400]);
  const g = project({ monthly: 100, start: 1000, years: 1, rate: 0.12 });
  assert.ok(g[1] > 1000 * 1.12 + 1200 && g[1] < 1000 * 1.12 + 1200 * 1.06);
  assert.deepEqual(project({ monthly: 100, years: 3, rate: 0, startYear: 1 }), [0, 0, 1200, 2400]);
  assert.equal(contributed({ monthly: 100, years: 3, startYear: 1 }), 2400);
});

test('assumptions come from the record for the nearest horizon, 40 uses 30', () => {
  const a = assumptions(history, 40);
  assert.equal(a.horizonUsed, 30);
  assert.equal(a.middle, history.horizons['30'].real.median);
  assert.equal(assumptions(history, 10).horizonUsed, 10);
});

test('computeCompound: empty asks for an amount; a plan yields ranges, a no-growth baseline and the cost of waiting', () => {
  assert.equal(computeCompound({}, history).status, 'empty');
  const r = computeCompound({ monthly: '200', years: '30', delay: '5' }, history);
  assert.equal(r.status, 'ok');
  assert.equal(r.put, 72000);
  assert.equal(r.end.cash, 72000);
  assert.ok(r.end.cautious > r.end.cash && r.end.middle > r.end.cautious);
  assert.ok(r.waiting.gap > 0 && r.waiting.contributedGap === 12000 && r.waiting.gap > r.waiting.contributedGap);
  assert.match(r.meaning, /assumptions drawn from [\d,]+ rolling 30-year periods since 1871, not predictions/);
  assert.match(r.meaning, /The rest is time\./);
  assert.doesNotMatch(r.title + r.meaning, /guarantee|will return|always/i);
  const none = computeCompound({ monthly: '200', years: '10', delay: '0' }, history);
  assert.equal(none.waiting, null);
});

test('renderers produce labelled SVG, an accessible table, and the evidence with range and dates', () => {
  const r = computeCompound({ monthly: '100', start: '500', years: '20', delay: '3' }, history);
  const svg = renderChart(r);
  assert.match(svg, /<svg[^>]*role="img"[^>]*aria-label="Projected value over 20 years/);
  assert.equal((svg.match(/<path /g) || []).length, 3);
  assert.doesNotMatch(svg, /NaN/);
  const table = renderTable(r);
  assert.match(table, /<th scope="row">Year 5<\/th>/);
  assert.match(table, /Cautious \(\d+\.\d%\)/);
  const ev = renderEvidence(history);
  assert.match(ev, /1871-01 to \d{4}-\d{2}/);
  assert.match(ev, /Periods with a loss/);
  assert.match(ev, /Before inflation, the median 30-year return was/);
  assert.match(ev, /years to a new high/);
});

test('page and script: labelled inputs, live result, evidence mount, sources, privacy, no persistence', () => {
  const html = read('moneyhub/tools/compound-growth.html');
  for (const id of ['cg-monthly', 'cg-start']) assert.match(html, new RegExp(`<label class="field" for="${id}">[\\s\\S]*?<input id="${id}"`));
  for (const id of ['cg-years', 'cg-delay']) assert.match(html, new RegExp(`for="${id}"[\\s\\S]*?<select id="${id}"`));
  assert.match(html, /data-result tabindex="-1" aria-live="polite"/);
  assert.match(html, /data-evidence/);
  assert.match(html, /<section class="tool__detail" data-detail aria-live="polite" hidden>/, 'chart and table render full-width below the tool');
  assert.match(html, /class="article__sources"/);
  assert.match(html, /never leave this page/);
  assert.match(html, /rewarded patience, but outcomes are uncertain and losses can occur/);
  const src = read('resources/js/compound-growth.mjs');
  assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB|sendBeacon|XMLHttpRequest|document\.cookie/);
  assert.equal((src.match(/fetch\(/g) || []).length, 1, 'the only fetch is the public dataset');
  assert.match(src, /fetch\('\/resources\/data\/market-history\.json'\)/);
});
