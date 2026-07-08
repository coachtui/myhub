import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'moneyhub', 'start-here');
const BASE = '/moneyhub/start-here';

const ORDER = [
  ['what-is-a-stock', 'What Is a Stock?'],
  ['what-is-the-stock-market', 'What Is the Stock Market?'],
  ['why-invest', 'Why Invest at All?'],
  ['tickers-and-indices', 'Tickers and Indices'],
  ['funds-and-etfs', 'Funds and ETFs'],
  ['how-to-read-a-chart', 'How to Read a Chart'],
  ['bulls-bears-and-crashes', 'Bulls, Bears, and Crashes'],
  ['volatility-and-the-vix', 'Volatility and the VIX'],
  ['earnings-sectors-analyst-talk', 'Earnings, Sectors, and Analyst Talk'],
  ['read-a-market-take', 'How to Read a Market Take'],
];

// Pages built so far. Each lesson task appends its slug here.
const CREATED = [];

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('start-here index links every lesson, in order', () => {
  const html = readFileSync(join(DIR, 'index.html'), 'utf8');
  let pos = -1;
  for (const [slug] of ORDER) {
    const i = html.indexOf(`href="${BASE}/${slug}.html"`);
    assert.ok(i > pos, `index links ${slug} after the previous lesson`);
    pos = i;
  }
  assert.match(html, /class="breadcrumb"/);
});

for (const slug of CREATED) {
  const idx = ORDER.findIndex(([s]) => s === slug);
  const [, title] = ORDER[idx];
  test(`lesson page: ${slug}`, () => {
    const html = readFileSync(join(DIR, `${slug}.html`), 'utf8');
    assert.match(html, new RegExp(`<h1 class="article__title">${esc(title)}</h1>`));
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /class="callout callout--ai"/);
    assert.match(html, /class="lesson-tldr"/);
    assert.ok((html.match(/<li>/g) || []).length >= 3, 'terms recap has >= 3 items');
    assert.match(html, /class="lesson-terms"/);
    assert.ok(
      (html.match(/<details class="quiz__item">/g) || []).length >= 2,
      'has >= 2 self-check questions'
    );
    // Word cap: prose between article__content start and the terms recap,
    // with widget figures stripped, must be <= 450 words.
    const body = html.match(
      /<div class="article__content">([\s\S]*?)<section class="lesson-terms">/
    );
    assert.ok(body, 'content ends with a lesson-terms section');
    const words = body[1]
      .replace(/<figure class="widget"[\s\S]*?<\/figure>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .trim()
      .split(/\s+/).length;
    assert.ok(words <= 450, `body prose is ${words} words (cap 450)`);
    // Prev/next chain integrity.
    const prev = idx === 0 ? null : `${BASE}/${ORDER[idx - 1][0]}.html`;
    const next = idx === ORDER.length - 1
      ? '/moneyhub/investing/'
      : `${BASE}/${ORDER[idx + 1][0]}.html`;
    if (prev) {
      assert.ok(html.includes(`href="${prev}" class="step-nav-footer__prev"`), 'prev link');
    } else {
      assert.ok(!html.includes('step-nav-footer__prev'), 'lesson 1 has no prev');
    }
    assert.ok(html.includes(`href="${next}" class="step-nav-footer__next"`), 'next link');
    assert.ok(html.includes(`href="${BASE}/" class="step-nav-footer__home"`), 'home link');
  });
}
