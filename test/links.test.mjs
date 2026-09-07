import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from '../resources/js/site-config.mjs';

// Link integrity across every published page. Guards the one thing a static
// site can silently break: a moved or renamed file that something still links to.

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP_DIRS = new Set(['.git', 'node_modules', 'docs', 'test', 'scripts', '.cto', 'resources']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const toUrl = file => '/' + relative(ROOT, file).split(sep).join('/');
const pages = walk(ROOT).map(f => ({ url: toUrl(f), html: readFileSync(f, 'utf8') }));

// Resolve an href/src to a repo path, or null for external / fragment / mailto links.
function resolveRef(ref, fromUrl) {
  if (/^(https?:|mailto:|tel:|javascript:|#|data:)/i.test(ref)) return null;
  const bare = ref.split('#')[0].split('?')[0];
  if (!bare) return null;
  let abs = bare.startsWith('/')
    ? bare
    : '/' + relative(ROOT, resolve(dirname(join(ROOT, fromUrl)), bare)).split(sep).join('/');
  if (abs.endsWith('/')) abs += 'index.html';
  return abs;
}

const refs = [];
for (const page of pages) {
  for (const m of page.html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = resolveRef(m[1], page.url);
    if (target) refs.push({ from: page.url, ref: m[1], target });
  }
}

test('every internal href and src resolves to a file', () => {
  const broken = refs.filter(r => !existsSync(join(ROOT, r.target)));
  assert.deepEqual(broken.map(b => `${b.from} -> ${b.ref}`), []);
});

test('primary nav links resolve to real pages, not fragments', () => {
  for (const item of SITE.nav) {
    assert.ok(!item.href.includes('#'), `${item.label} links to a fragment (${item.href})`);
    const target = item.href.endsWith('/') ? item.href + 'index.html' : item.href;
    assert.ok(existsSync(join(ROOT, target)), `${item.label} -> ${item.href} does not exist`);
  }
});

test('every page is reachable: linked from a page, listed from the index, or in the nav', () => {
  const index = JSON.parse(readFileSync(join(ROOT, 'resources/data/search-index.json'), 'utf8'));
  const indexed = new Set(index.map(p => p.url));
  const navTargets = new Set(SITE.nav.map(n => (n.href.endsWith('/') ? n.href + 'index.html' : n.href)));
  const inbound = new Set(refs.map(r => r.target));
  // Soft-redirect stubs are intentionally unlinked; remove entries here as they gain real redirects.
  const allowed = new Set(['/gojo/research/index.html']);
  const orphans = pages
    .map(p => p.url)
    .filter(u => u !== '/index.html' && !allowed.has(u) && !inbound.has(u) && !indexed.has(u) && !navTargets.has(u));
  assert.deepEqual(orphans, []);
});
