import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc } from '../resources/js/esc.mjs';

test('escapes &, <, >, "', () => {
  assert.equal(esc('<b>A & "B" > C</b>'), '&lt;b&gt;A &amp; &quot;B&quot; &gt; C&lt;/b&gt;');
});
test('coerces null/undefined/number to safe strings', () => {
  assert.equal(esc(null), '');
  assert.equal(esc(undefined), '');
  assert.equal(esc(42), '42');
});
