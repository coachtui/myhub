import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGES = ['training', 'nutrition', 'recovery', 'metrics'];
const BASE = '/healthhub';

const html = readFileSync(join(ROOT, 'healthhub', 'index.html'), 'utf8');

test('health hub links all four sub-pages', () => {
  for (const slug of PAGES) {
    assert.ok(html.includes(`href="${BASE}/${slug}.html"`), `health hub links ${slug}`);
  }
});

test('sub-page links appear in order', () => {
  let pos = -1;
  for (const slug of PAGES) {
    const i = html.indexOf(`href="${BASE}/${slug}.html"`);
    assert.ok(i > pos, `health hub links ${slug} after the previous topic`);
    pos = i;
  }
});

test('every linked sub-page exists', () => {
  for (const slug of PAGES) {
    const page = readFileSync(join(ROOT, 'healthhub', `${slug}.html`), 'utf8');
    assert.ok(page.includes('<h1 class="article__title">'), `${slug}.html has an article title`);
  }
});

test('construction callout and coming-soon markers are gone', () => {
  assert.doesNotMatch(html, /being built out/);
  assert.ok(!html.includes('hub-card--soon'), 'no hub-card--soon modifier');
  assert.ok(!html.includes('Coming soon'), 'no "Coming soon" meta');
});

test('page keeps chrome and breadcrumb', () => {
  assert.match(html, /class="breadcrumb"/);
  assert.match(html, /id="site-header"/);
});
