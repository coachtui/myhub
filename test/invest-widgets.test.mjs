import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOCATIONS, BEST_DAYS, OPS_STEPS, TICKET_PARTS, FLOW_ROUTES, ROTH_MODES,
  donutSegments,
} from '../resources/js/invest-widgets.mjs';

test('every allocation preset sums to 100 and has plain-language labels', () => {
  for (const [name, slices] of Object.entries(ALLOCATIONS)) {
    const total = slices.reduce((s, x) => s + x.pct, 0);
    assert.equal(total, 100, `${name} sums to 100`);
    for (const s of slices) {
      assert.ok(s.label.includes('—'), `${name}: label has a plain-language gloss`);
      assert.ok(s.color.startsWith('var(--'), `${name}: token color`);
    }
  }
  assert.deepEqual(Object.keys(ALLOCATIONS), ['1 fund', '2 funds', '3 funds']);
});

test('donutSegments converts slices to arc geometry covering the full ring', () => {
  const segs = donutSegments([{ pct: 60 }, { pct: 30 }, { pct: 10 }]);
  assert.equal(segs.length, 3);
  let cum = 0;
  for (const [i, g] of segs.entries()) {
    assert.ok(Math.abs(g.offset - cum) < 1e-6, `segment ${i} starts where prior ended`);
    cum += g.frac;
  }
  assert.ok(Math.abs(cum - 1) < 1e-6, 'segments cover the ring');
});

test('best-days series tell the documented story: full >> miss10 >> miss20', () => {
  const { full, miss10, miss20 } = BEST_DAYS;
  assert.equal(full.length, miss10.length);
  assert.equal(full.length, miss20.length);
  assert.ok(full.length >= 12);
  assert.ok(full[full.length - 1] > miss10[miss10.length - 1] * 2, 'missing 10 best days roughly halves it or worse');
  assert.ok(miss10[miss10.length - 1] > miss20[miss20.length - 1], 'missing 20 is worse than 10');
  assert.equal(full[0], miss10[0]);
  assert.equal(full[0], miss20[0]);
});

test('stepper, ticket, flow, and roth datasets all carry non-empty teaching text', () => {
  assert.equal(OPS_STEPS.length, 4);
  for (const s of OPS_STEPS) { assert.ok(s.title.length > 0); assert.ok(s.why.length > 20); }
  assert.ok(Object.keys(TICKET_PARTS).length >= 4);
  for (const p of Object.values(TICKET_PARTS)) assert.ok(p.text.length > 20);
  assert.ok(Object.keys(FLOW_ROUTES).length === 3);
  for (const r of Object.values(FLOW_ROUTES)) assert.ok(r.text.length > 20);
  assert.deepEqual(Object.keys(ROTH_MODES), ['Roth', 'Traditional']);
  for (const m of Object.values(ROTH_MODES)) assert.ok(m.text.length > 20);
});
