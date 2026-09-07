import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');

test('Moneyhub leads with action and preserves the library', () => {
  const html = read('moneyhub/index.html');
  assert.match(html, /What would help most right now/);
  assert.match(html, /id="money-checkup"/);
  assert.match(html, /Survive/);
  assert.match(html, /Stabilize/);
  assert.match(html, /Grow/);
  assert.match(html, /Money Library/);
  assert.match(html, /href="\/moneyhub\/start-here\/"/);
  assert.match(html, /src="\/resources\/js\/money-checkup\.mjs"/);
});

test('Money Reset is private, actionable, and wired to its calculator', () => {
  const html = read('moneyhub/money-reset.html');
  assert.match(html, /Your numbers never leave this page/);
  for (const field of ['income', 'bills', 'essentials', 'flexible']) {
    assert.match(html, new RegExp(`name="${field}"`));
  }
  assert.match(html, /src="\/resources\/js\/money-reset\.mjs"/);
});
