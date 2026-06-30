import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextActive } from '../resources/js/search.mjs';

test('nextActive moves and wraps within bounds', () => {
  assert.equal(nextActive(3, 0, 1), 1);
  assert.equal(nextActive(3, 2, 1), 0);   // wrap forward
  assert.equal(nextActive(3, 0, -1), 2);  // wrap backward
  assert.equal(nextActive(3, -1, 1), 0);  // from none → first
});
test('nextActive returns -1 when there are no results', () => {
  assert.equal(nextActive(0, -1, 1), -1);
});
