import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS } from '../resources/js/sections.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

test('home introduces the purpose and author before the learning paths', () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /Build a life<br>with more<br><em>possibility\.<\/em>/);
  assert.ok(html.indexOf('By Tui Alailima') < html.indexOf('class="starting-point"'));
  assert.match(html, /href="#your-start"/);
  assert.match(html, /id="your-start"/);
});

test('home keeps all sections reachable and marks health as developing', () => {
  for (const s of SECTIONS.filter(x => x.nav && x.id !== 'about')) {
    assert.ok(html.includes(`href="${s.href}"`), `path to ${s.href}`);
  }
  assert.match(html, /Taking shape/);
  assert.ok(html.indexOf('money-path') < html.indexOf('beyond-basics'));
});

test('home explains both AI desks by role before linking them', () => {
  assert.match(html, /Lelouch<\/a>, an operating and investment analyst/);
  assert.match(html, /Gojo<\/a>, a market research agent/);
  assert.match(html, /labelled AI-generated/);
});

test('AI market content is confined to a small labelled feed', () => {
  assert.match(html, /id="latest-feed" data-feed-types="lelouch-take,market-take,deep-dive" data-feed-limit="3"/);
  assert.ok(html.indexOf('latest-feed') > html.indexOf('class="first-reads"'), 'feed sits below the evergreen entry points');
});

test('home is not a site index: a bounded number of links', () => {
  const links = (html.match(/<a\s/g) || []).length;
  assert.ok(links <= 24, `home has ${links} links (cap 24)`);
});
