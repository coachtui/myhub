import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { walkPages, REDIRECT_STUBS } from '../scripts/lib/pages.mjs';
import { parseSiteMeta } from '../scripts/lib/page-head.mjs';
import { DISCLAIMERS } from '../resources/js/sections.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('every disclaimer kind used in metadata is declared', () => {
  for (const { file, url } of walkPages(ROOT)) {
    if (REDIRECT_STUBS.has(url)) continue;
    const kind = parseSiteMeta(readFileSync(file, 'utf8')).disclaimer;
    if (kind) assert.ok(DISCLAIMERS[kind], `${url}: unknown disclaimer kind "${kind}"`);
  }
});

test('disclosure callouts match the page: AI notice only on AI pages, personal note only on human pages', () => {
  const problems = [];
  for (const { file, url } of walkPages(ROOT)) {
    if (REDIRECT_STUBS.has(url)) continue;
    const html = readFileSync(file, 'utf8');
    const kind = parseSiteMeta(html).disclaimer;
    const variant = DISCLAIMERS[kind]?.variant;
    if (variant === 'personal' && /callout--ai\b/.test(html)) problems.push(`${url}: human-written page carries the AI notice`);
    if (variant === 'ai' && /callout--personal\b/.test(html)) problems.push(`${url}: AI page carries the personal note`);
    if (/callout--personal\b/.test(html) && !html.includes(DISCLAIMERS['personal-finance'].text.replace(/&/g, '&amp;')) && !html.includes(DISCLAIMERS.health.text)) {
      problems.push(`${url}: personal note wording is not the canonical text`);
    }
  }
  assert.deepEqual(problems, []);
});
