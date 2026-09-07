import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderHead, parseSiteMeta, canonicalUrl } from '../scripts/lib/page-head.mjs';
import { decode } from '../scripts/lib/extract-post.mjs';
import { walkPages, REDIRECT_STUBS } from '../scripts/lib/pages.mjs';

// Drift guard: every page's <head> must be what renderHead() would produce for
// that page's own title, description, URL and site:* metadata. Pages are static
// HTML, so this is the only thing keeping 226 heads identical (fonts, icon,
// CSS, theme, canonical, Open Graph). Comparison is entity-insensitive:
// "&mdash;" in a page and "—" in the renderer are the same head.

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const normalize = s => decode(s).replace(/>\s+</g, '><');

test('every page head matches renderHead() for its own title, description, url and metadata', () => {
  const drift = [];
  for (const { file, url } of walkPages(ROOT)) {
    if (REDIRECT_STUBS.has(url)) continue;
    const html = readFileSync(file, 'utf8');
    const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [, ''])[1];
    const title = decode((head.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]);
    const description = decode((head.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [, ''])[1]);
    const expected = renderHead({ title, description, url, meta: parseSiteMeta(html) });
    if (normalize(head) !== normalize(expected)) drift.push(url);
  }
  assert.deepEqual(drift, [], 'heads that differ from renderHead() output');
});

test('every page declares a canonical URL in the public www form', () => {
  const missing = [];
  for (const { file, url } of walkPages(ROOT)) {
    if (REDIRECT_STUBS.has(url)) continue;
    const html = readFileSync(file, 'utf8');
    if (!html.includes(`<link rel="canonical" href="${canonicalUrl(url)}">`)) missing.push(url);
  }
  assert.deepEqual(missing, []);
});

test('canonicalUrl addresses directory indexes by folder', () => {
  assert.equal(canonicalUrl('/moneyhub/index.html'), 'https://www.tuialailima.com/moneyhub/');
  assert.equal(canonicalUrl('/moneyhub/qa.html'), 'https://www.tuialailima.com/moneyhub/qa.html');
  assert.equal(canonicalUrl('/index.html'), 'https://www.tuialailima.com/');
});

test('renderHead emits site:* tags in a fixed order and lists as comma text', () => {
  const h = renderHead({ title: 'T', description: 'D', url: '/moneyhub/qa.html', meta: { topics: ['a', 'b'], kind: 'reference', section: 'money', order: '2' } });
  const names = [...h.matchAll(/name="site:([a-z]+)"/g)].map(m => m[1]);
  assert.deepEqual(names, ['section', 'kind', 'order', 'topics']);
  assert.match(h, /name="site:topics" content="a, b"/);
  assert.match(h, /property="og:type" content="article"/);
  assert.deepEqual(parseSiteMeta(`<head>${h}</head>`), { section: 'money', kind: 'reference', order: '2', topics: ['a', 'b'] });
});
