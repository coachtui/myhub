import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertDocument, generateCss, generateDarkCss, normalise, CSS_PATH, DARK_PATH } from '../scripts/migrate-inline-styles.mjs';
import { walkPages } from '../scripts/lib/pages.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const archive = walkPages(ROOT).filter(p => p.url.startsWith('/research/'));

test('convertDocument swaps style for a class, merges existing classes, and wraps tables once', () => {
  const html = '<p style="color: #166534; padding:4px">a</p><td class="x" style="  color: #166534;   padding:4px; ">b</td><table><tr><td>1</td></tr></table><div class="tablewrap"><table></table></div><br/>';
  const { html: out, styles } = convertDocument(html, s => 'ia-1');
  assert.equal(styles.size, 1, 'whitespace and trailing semicolon differences normalise to one style');
  assert.match(out, /<p class="ia-1">a<\/p>/);
  assert.match(out, /<td class="x ia-1">b<\/td>/);
  assert.equal((out.match(/<div class="tablewrap">/g) || []).length, 2, 'bare table wrapped, wrapped table untouched');
  assert.doesNotMatch(out, /style="/);
  assert.equal(normalise('  a: b;  c:d; '), 'a: b; c:d');
});

test('generated CSS keeps every declaration, marked !important, and dark rules target the right classes', () => {
  const classes = new Map([['background: #fffbeb; color: #92400e', 'ia-1'], ['padding: 4px', 'ia-2'], ['border: 1px solid #f59e0b', 'ia-3']]);
  const css = generateCss(classes);
  assert.match(css, /\.ia-1 \{ background: #fffbeb !important; color: #92400e !important; \}/);
  assert.match(css, /\.ia-2 \{ padding: 4px !important; \}/);
  const dark = generateDarkCss(classes);
  assert.match(dark, /\[data-theme="dark"\] \.ia-1 \{ background-color: rgba\(245, 158, 11, 0\.13\) !important; \}/);
  assert.match(dark, /\[data-theme="dark"\] \.ia-1 \{ color: #fcd34d !important; \}/);
  assert.doesNotMatch(dark, /ia-2/, 'no colour, no override');
  assert.doesNotMatch(dark, /\[style\*=/, 'no attribute-substring selectors');
});

test('the archive carries no inline styles, every table is wrapped, and the generated classes exist', () => {
  assert.ok(existsSync(join(ROOT, CSS_PATH)));
  const css = readFileSync(join(ROOT, CSS_PATH), 'utf8');
  const defined = new Set([...css.matchAll(/^\.(ia-\d+) /gm)].map(m => m[1]));
  const used = new Set();
  for (const { file, url } of archive) {
    const html = readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /\sstyle="/, `${url} still has an inline style`);
    const tables = (html.match(/<table\b/g) || []).length;
    const wrapped = (html.match(/<div class="tablewrap"><table\b/g) || []).length;
    assert.equal(wrapped, tables, `${url}: every table wrapped`);
    for (const m of html.matchAll(/\b(ia-\d+)\b/g)) used.add(m[1]);
  }
  for (const c of used) assert.ok(defined.has(c), `${c} used but not defined`);
  for (const c of defined) assert.ok(used.has(c), `${c} defined but unused`);
  assert.ok(defined.size > 100, `expected many classes, got ${defined.size}`);
  const dark = readFileSync(join(ROOT, DARK_PATH), 'utf8');
  assert.doesNotMatch(dark, /\[style\*=/);
  assert.match(dark, /\[data-theme="dark"\] \.ia-\d+/);
});
