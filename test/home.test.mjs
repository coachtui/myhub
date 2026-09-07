import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS } from '../resources/js/sections.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

test('home introduces Tui and the positioning line first', () => {
  assert.match(html, /<h1 class="identity__name"[^>]*>Tui Alailima<\/h1>/);
  assert.match(html, /I build systems for stronger work, health, and financial lives\./);
  assert.ok(html.indexOf('identity__bio') < html.indexOf('home-paths'), 'identity comes before the paths');
});

test('home offers the four paths, one per nav section other than About', () => {
  for (const s of SECTIONS.filter(x => x.nav && x.id !== 'about')) {
    assert.match(html, new RegExp(`<a class="hub-card" href="${s.href}"`), `path card to ${s.href}`);
  }
  assert.match(html, /Build financial stability/);
  assert.match(html, /Build a healthier life/);
  assert.match(html, /Explore work and projects/);
  assert.match(html, /Read research and notes/);
});

test('home explains both AI desks by role before linking them', () => {
  assert.match(html, /Lelouch<\/a>, an operating and investment analyst/);
  assert.match(html, /Gojo<\/a>, a market research agent/);
  assert.match(html, /labelled AI-generated/);
});

test('AI market content is confined to a small labelled feed', () => {
  assert.match(html, /id="latest-feed" data-feed-types="lelouch-take,market-take,deep-dive" data-feed-limit="5"/);
  assert.ok(html.indexOf('latest-feed') > html.indexOf('Good places to start'), 'feed sits below the evergreen entry points');
});

test('home is not a site index: a bounded number of links', () => {
  const links = (html.match(/<a\s/g) || []).length;
  assert.ok(links <= 24, `home has ${links} links (cap 24)`);
});
