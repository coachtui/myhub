import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'moneyhub', 'investing');
const BASE = '/moneyhub/investing';

const ORDER = [
  ['brokerage-basics', 'Brokerage Basics'],
  ['account-types', 'Account Types'],
  ['starter-portfolios', 'Simple Starter Portfolios'],
  ['automating-contributions', 'Automating Contributions'],
  ['staying-invested', 'Staying Invested Through Volatility'],
];

// Pages rebuilt so far. Each page task appends its slug here.
const REBUILT = [];

test('investing hub lists the five guides in reading-chain order', () => {
  const html = readFileSync(join(DIR, 'index.html'), 'utf8');
  let pos = -1;
  for (const [slug] of ORDER) {
    const i = html.indexOf(`href="${BASE}/${slug}.html"`);
    assert.ok(i > pos, `hub lists ${slug} after the previous guide`);
    pos = i;
  }
});

for (const slug of REBUILT) {
  const idx = ORDER.findIndex(([s]) => s === slug);
  const [, title] = ORDER[idx];
  test(`guide page: ${slug}`, () => {
    const html = readFileSync(join(DIR, `${slug}.html`), 'utf8');
    assert.match(html, new RegExp(`<h1 class="article__title">${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /class="callout callout--ai"/);
    assert.match(html, /class="lesson-tldr"/);
    assert.ok((html.match(/<details class="lesson-details">/g) || []).length >= 1, 'has >= 1 collapsible');
    const terms = html.match(/<section class="lesson-terms">([\s\S]*?)<\/section>/);
    assert.ok(terms, 'has a lesson-terms section');
    assert.ok((terms[1].match(/<li>/g) || []).length >= 3, 'terms recap has >= 3 items');
    assert.ok((html.match(/<details class="quiz__item">/g) || []).length >= 2, 'has >= 2 self-check questions');
    // Visible-word cap: strip widget figures, ALL details elements, terms, quiz.
    const body = html.match(/<div class="article__content">([\s\S]*?)<nav class="step-nav-footer">/);
    assert.ok(body, 'article content present');
    const visible = body[1]
      .replace(/<figure class="widget"[\s\S]*?<\/figure>/g, ' ')
      .replace(/<details[\s\S]*?<\/details>/g, ' ')
      .replace(/<section class="lesson-terms">[\s\S]*?<\/section>/g, ' ')
      .replace(/<section class="quiz"[\s\S]*?<\/section>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .trim()
      .split(/\s+/).length;
    assert.ok(visible <= 500, `visible prose is ${visible} words (cap 500)`);
    // Chain integrity.
    const prev = idx === 0 ? `${BASE}/` : `${BASE}/${ORDER[idx - 1][0]}.html`;
    const next = idx === ORDER.length - 1 ? `${BASE}/` : `${BASE}/${ORDER[idx + 1][0]}.html`;
    assert.ok(html.includes(`href="${prev}" class="step-nav-footer__prev"`), 'prev link');
    assert.ok(html.includes(`href="${next}" class="step-nav-footer__next"`), 'next link');
    assert.ok(html.includes(`href="${BASE}/" class="step-nav-footer__home"`), 'home link');
    assert.ok(html.includes('src="/resources/js/invest-widgets.mjs"'), 'loads invest-widgets');
  });
}
