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
  assert.equal(a.readTime, 1);
  assert.equal(a.section, 'Gojo');
  assert.equal(a.ticker, 'SPY');
  assert.equal(a.date, '2026-06-28');
});

test('non-gojo pages get Tui as author', () => {
  const w = extractArticle('<article class="article"><header class="article__header"><h1 class="article__title">Money</h1></header><div class="article__content"><p>hi</p></div></article>', '/moneyhub/step1-know-your-money.html');
  assert.equal(w.author, 'Tui Alailima');
});

test('captures full content even with nested divs and post-content elements inside article', () => {
  const html = '<article class="article"><header class="article__header"><h1 class="article__title">T</h1></header><div class="article__content"><p>A</p><div class="box">B</div><p>C</p></div><nav class="step-nav-footer"><a>next</a></nav></article>';
  const a = extractArticle(html, '/moneyhub/step1-know-your-money.html');
  assert.match(a.contentHtml, /<div class="box">B<\/div>/);
  assert.match(a.contentHtml, /<p>C<\/p>/);            // would be DROPPED by the old fallback
  assert.doesNotMatch(a.contentHtml, /step-nav-footer/); // must not over-capture past content div
  assert.match(a.stepNavHtml, /step-nav-footer/);        // step-nav captured separately
});

test('reads description regardless of attribute order or self-closing slash', () => {
  const a1 = extractArticle('<meta content="ORDER" name="description"><article class="article"><div class="article__content"><p>x</p></div></article>', '/moneyhub/a.html');
  assert.equal(a1.description, 'ORDER');
  const a2 = extractArticle('<meta name="description" content="SELFCLOSE" /><article class="article"><div class="article__content"><p>x</p></div></article>', '/moneyhub/b.html');
  assert.equal(a2.description, 'SELFCLOSE');
});

test('preserves raw entities in headerTitle (not decoded)', () => {
  const a = extractArticle('<article class="article"><header class="article__header"><h1 class="article__title">A &mdash; B</h1></header><div class="article__content"><p>x</p></div></article>', '/gojo/stocks/x.html');
  assert.match(a.headerTitle, /&mdash;/);
});

test('description is decoded (no double-encoding of entities)', () => {
  const a = extractArticle('<meta name="description" content="S&amp;P and Fear &amp; Greed"><article class="article"><div class="article__content"><p>x</p></div></article>', '/gojo/stocks/x.html');
  assert.equal(a.description, 'S&P and Fear & Greed');
});
