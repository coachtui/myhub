import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS } from '../resources/js/sections.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = p => readFileSync(join(ROOT, p), 'utf8');

test('every nav section has a real hub page', () => {
  for (const s of SECTIONS.filter(x => x.nav)) {
    const html = read(s.href.slice(1) + 'index.html');
    assert.match(html, /<h1[\s>]/, `${s.href} has an h1`);
    assert.match(html, /id="site-header"/, `${s.href} mounts chrome`);
  }
});

test('Research & Notes introduces both desks by role and keeps beginners pointed at Market Basics', () => {
  const html = read('research/index.html');
  assert.match(html, /Lelouch — Operating and Investment Analyst/);
  assert.match(html, /Gojo — Market Research Agent/);
  assert.match(html, /href="\/research\/lelouch\/stocks\/"/);
  assert.match(html, /href="\/research\/gojo\/stocks\/"/);
  assert.match(html, /href="\/research\/gojo\/notes\/"/);
  assert.match(html, /class="callout callout--ai"/, 'AI disclosure on the hub');
  assert.match(html, /data-listing-types="lelouch-take,market-take,deep-dive" data-listing-limit="6"/);
  assert.match(html, /href="\/moneyhub\/start-here\/"/);
});

test('Work & Projects names the construction background and the AIGA products', () => {
  const html = read('projects/index.html');
  for (const name of ['BedrockOS', 'CRU', 'DVRG', 'Operator', 'aigaai.com']) assert.ok(html.includes(name), `mentions ${name}`);
  assert.match(html, /civil construction/);
});

test('hub cards never nest a link inside a link', () => {
  for (const p of ['research/index.html', 'projects/index.html', 'moneyhub/index.html', 'healthhub/index.html']) {
    const html = read(p);
    for (const card of html.matchAll(/<a class="hub-card"[^>]*>([\s\S]*?)<\/a>/g)) {
      assert.ok(!/<a\s/.test(card[1]), `${p}: nested <a> inside a hub card`);
    }
  }
});
