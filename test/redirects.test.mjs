import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { walkPages } from '../scripts/lib/pages.mjs';

// vercel.json is the only place old URLs are honoured after the Gojo/Lelouch
// move, so it gets the same guard as internal links: every old path must land
// on a file that exists, and no old-path directory may still exist to shadow
// a redirect.

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));

// Minimal matcher for the path-to-regexp subset used here: literal paths and a
// trailing ":name*" wildcard.
function apply(rule, path) {
  const m = rule.source.match(/^(.*?)\/:(\w+)\*$/);
  if (!m) return rule.source === path ? rule.destination : null;
  const [, prefix, name] = m;
  if (path !== prefix && !path.startsWith(prefix + '/')) return null;
  const rest = path.slice(prefix.length + 1);
  return rule.destination.replace(`:${name}*`, rest);
}
const redirect = path => { for (const r of config.redirects) { const d = apply(r, path); if (d !== null) return d; } return null; };
const fileFor = url => join(ROOT, url.endsWith('/') ? url + 'index.html' : url);

test('redirects are permanent and point at pages that exist', () => {
  for (const r of config.redirects) {
    assert.equal(r.permanent, true, `${r.source} must be permanent`);
    if (!r.destination.includes(':')) assert.ok(existsSync(fileFor(r.destination)), `${r.source} -> ${r.destination} does not exist`);
  }
});

test('every moved desk page is reachable from its old URL', () => {
  const moved = walkPages(ROOT).map(p => p.url).filter(u => /^\/research\/(gojo|lelouch)\//.test(u));
  assert.ok(moved.length > 150, 'moved pages found');
  const broken = [];
  for (const url of moved) {
    const oldUrl = url.replace(/^\/research\//, '/').replace(/index\.html$/, '');
    const dest = redirect(oldUrl);
    if (!dest || !existsSync(fileFor(dest))) broken.push(`${oldUrl} -> ${dest}`);
  }
  assert.deepEqual(broken, []);
});

test('old section roots and the retired research stub redirect', () => {
  assert.equal(redirect('/gojo/'), '/research/gojo/');
  assert.equal(redirect('/gojo'), '/research/gojo/');
  assert.equal(redirect('/lelouch/'), '/research/lelouch/');
  assert.equal(redirect('/gojo/research/'), '/research/gojo/stocks/');
  assert.equal(redirect('/gojo/notes/'), '/research/gojo/notes/');
  assert.equal(redirect('/moneyhub/portfolio.html'), '/research/');
});

test('no old-path directory remains to shadow a redirect', () => {
  for (const d of ['gojo', 'lelouch']) assert.ok(!existsSync(join(ROOT, d)), `${d}/ still exists`);
  for (const f of ['moneyhub/analysis.html', 'moneyhub/portfolio.html', 'moneyhub/trading-journal.html']) assert.ok(!existsSync(join(ROOT, f)), `${f} still exists`);
});

test('the fallback rewrite covers new Lelouch posts written to the old folder', () => {
  const rw = config.rewrites.find(r => r.source === '/research/lelouch/:path*');
  assert.ok(rw, 'rewrite present');
  assert.equal(rw.destination, '/lelouch/:path*');
});
