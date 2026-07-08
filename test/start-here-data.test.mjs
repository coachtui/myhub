import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERIES, CRASHES, CANDLES, compoundSeries } from '../resources/js/start-here.mjs';

test('SERIES has all four timeframes with enough points to draw', () => {
  for (const key of ['1D', '1M', '1Y', '20Y']) {
    assert.ok(SERIES[key], `missing ${key}`);
    assert.ok(SERIES[key].values.length >= 10, `${key} has >= 10 points`);
    assert.ok(SERIES[key].label.length > 0);
    assert.ok(SERIES[key].note.length > 0);
  }
});

test('20Y series ends higher than it starts (the whole point of the lesson)', () => {
  const v = SERIES['20Y'].values;
  assert.ok(v[v.length - 1] > v[0] * 3);
});

test('CRASHES markers all fall inside the year range', () => {
  const { years, values, markers } = CRASHES;
  assert.equal(years.length, values.length);
  for (const m of markers) {
    assert.ok(years.includes(m.year), `marker year ${m.year} in series`);
    assert.ok(m.label.length > 0);
  }
  assert.ok(values[values.length - 1] > values[0]);
});

test('CANDLES are internally consistent OHLC', () => {
  assert.ok(CANDLES.length >= 5);
  for (const c of CANDLES) {
    assert.ok(c.h >= Math.max(c.o, c.c), 'high >= body top');
    assert.ok(c.l <= Math.min(c.o, c.c), 'low <= body bottom');
  }
});

test('compoundSeries grows and beats the cash pile', () => {
  const years = 30, monthly = 200;
  const invested = compoundSeries(monthly, 0.08, years);
  const cash = compoundSeries(monthly, 0.005, years);
  assert.equal(invested.length, years + 1);
  assert.equal(invested[0], 0);
  for (let i = 1; i < invested.length; i++) assert.ok(invested[i] > invested[i - 1]);
  assert.ok(invested[years] > cash[years] * 2);
});
