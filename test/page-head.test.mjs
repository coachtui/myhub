import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHead } from '../scripts/lib/page-head.mjs';
import { decode } from '../scripts/lib/extract-post.mjs';

// Drift guard: every page's <head> must be what renderHead() would produce for
// that page's own title and description. Pages are static HTML, so this is the
// only thing keeping 226 hand-copied heads identical (fonts, icon, CSS, theme).
// Comparison is entity-insensitive: "&mdash;" in a page and "—" in the renderer
// are the same head.

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP_DIRS = new Set(['.git', 'node_modules', 'docs', 'test', 'scripts', 'resources', '.cto']);
// Soft-redirect stubs carry a deliberately minimal head.
const EXEMPT = new Set(['/gojo/research/index.html']);

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

const normalize = s => decode(s).replace(/>\s+</g, '><');

test('every page head matches renderHead() for its own title and description', () => {
  const drift = [];
  for (const file of walk(ROOT)) {
    const url = '/' + relative(ROOT, file).split(sep).join('/');
    if (EXEMPT.has(url)) continue;
    const html = readFileSync(file, 'utf8');
    const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [, ''])[1];
    const title = decode((head.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]);
    const description = decode((head.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [, ''])[1]);
    const expected = renderHead({ title, description });
    if (normalize(head) !== normalize(expected)) drift.push(url);
  }
  assert.deepEqual(drift, [], 'heads that differ from renderHead() output');
});
