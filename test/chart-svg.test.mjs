import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extent, scale, linePath, candleGeometry } from '../resources/js/lib/chart-svg.mjs';

test('extent finds min/max and pads a flat series', () => {
  assert.deepEqual(extent([3, 9, 5]), [3, 9]);
  assert.deepEqual(extent([7, 7]), [6, 8]);
});

test('scale maps domain endpoints to range endpoints', () => {
  assert.equal(scale(0, 0, 10, 100, 200), 100);
  assert.equal(scale(10, 0, 10, 100, 200), 200);
  assert.equal(scale(5, 0, 10, 200, 100), 150); // inverted range (SVG y-axis)
});

test('linePath emits one command per value, M first, within bounds', () => {
  const path = linePath([1, 2, 3, 2], 100, 50, 10);
  const cmds = path.split(' ');
  assert.equal(cmds.length, 4);
  assert.ok(cmds[0].startsWith('M'));
  assert.ok(cmds.slice(1).every(c => c.startsWith('L')));
  for (const c of cmds) {
    const [x, y] = c.slice(1).split(',').map(Number);
    assert.ok(x >= 10 && x <= 90, `x ${x} within pad`);
    assert.ok(y >= 10 && y <= 40, `y ${y} within pad`);
  }
});

test('candleGeometry: up candle when close >= open, wicks span high/low', () => {
  const geo = candleGeometry(
    [{ o: 10, h: 14, l: 9, c: 13 }, { o: 13, h: 13.5, l: 10, c: 11 }],
    200, 100, 10
  );
  assert.equal(geo.length, 2);
  assert.equal(geo[0].up, true);
  assert.equal(geo[1].up, false);
  // wick top (high) is above body top; wick bottom (low) is below body bottom
  assert.ok(geo[0].wickY1 <= geo[0].bodyY);
  assert.ok(geo[0].wickY2 >= geo[0].bodyY + geo[0].bodyH);
  assert.ok(geo[0].bodyH >= 1);
});
