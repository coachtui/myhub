import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractArticle } from '../scripts/lib/extract-article.mjs';

const html = readFileSync(new URL('./fixtures/full-article.html', import.meta.url), 'utf8');
const a = extractArticle(html, '/gojo/stocks/spy-market-review-2026-06-28.html');

test('extracts header, subtitle, and verbatim content', () => {
  assert.match(a.headerTitle, /SPY Market Review/);
  assert.match(a.subtitle, /\$728\.99/);
  assert.match(a.contentHtml, /<h2>What moved<\/h2>/);
  assert.match(a.contentHtml, /First paragraph/);
});

test('parses the breadcrumb trail', () => {
  assert.deepEqual(a.breadcrumb, [
    { label: 'Home', href: '/' },
    { label: 'Gojo', href: '/gojo/' },
    { label: 'SPY Market Review', href: null },
  ]);
});

test('detects disclaimer and sets Gojo author', () => {
  assert.equal(a.hasDisclaimer, true);
  assert.match(a.disclaimerText, /Not advice/);
  assert.equal(a.author, 'Gojo (AI analyst)');
});

test('computes a positive read time and carries section/ticker/date', () => {
  assert.ok(a.readTime >= 1);
  assert.equal(a.section, 'Gojo');
  assert.equal(a.ticker, 'SPY');
  assert.equal(a.date, '2026-06-28');
});

test('non-gojo pages get Tui as author', () => {
  const w = extractArticle('<article class="article"><header class="article__header"><h1 class="article__title">Money</h1></header><div class="article__content"><p>hi</p></div></article>', '/moneyhub/step1-know-your-money.html');
  assert.equal(w.author, 'Tui Alailima');
});
