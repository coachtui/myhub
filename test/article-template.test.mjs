import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeriesNav, buildRelatedList } from '../resources/js/article.mjs';
import { buildIndex } from '../scripts/build-index.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = p => readFileSync(join(ROOT, p), 'utf8');
const index = buildIndex(ROOT);

// The shared article template, piloted on one Money guide and one Lelouch take.
const PILOTS = {
  'moneyhub/step3-emergency-fund.html': { author: 'Tui Alailima', tag: 'Guide · Beginner · Stabilize', example: true, series: true },
  'research/lelouch/stocks/vst-ai-power-selloff-august-2026.html': { author: 'Lelouch (AI analyst)', tag: 'Market research · Advanced · AI-generated', sources: true },
};

for (const [page, want] of Object.entries(PILOTS)) {
  test(`pilot ${page} carries the template slots in order`, () => {
    const html = read(page);
    const order = ['class="article__title"', 'class="byline"', 'class="article__lead"', 'class="article__summary"', 'class="lesson-terms"', 'class="next-action"', 'data-related', 'class="step-nav-footer"'];
    let pos = -1;
    for (const marker of order) { const i = html.indexOf(marker); assert.ok(i > pos, `${marker} present and in order`); pos = i; }
    assert.match(html, new RegExp(`By <b>${want.author.replace(/[()]/g, '\\$&')}</b> · [^<]*<span class="byline__tag">${want.tag}</span>`));
    assert.match(html, /article__summary[\s\S]*?<h2[^>]*>What you need to know<\/h2>[\s\S]*?(<li>[\s\S]*?){3,}/, 'summary has at least three points');
    assert.match(html, /next-action[\s\S]*?class="btn/, 'next action has a button');
    if (want.example) assert.match(html, /class="article__example"/);
    if (want.sources) assert.match(html, /class="article__sources"[\s\S]*?<ol>[\s\S]*?<li>/);
    if (want.series) assert.match(html, /step-nav-footer" aria-label="Previous and next" data-series-nav/);
    assert.doesNotMatch(html, /slush fund|impulse|discipline/i, 'no shaming language');
    for (const m of html.matchAll(/<h([1-6])[\s>]/g)) assert.ok(+m[1] <= 3, 'headings stay within h1–h3');
  });
}

test('step 3 explains acronyms on first use', () => {
  const html = read('moneyhub/step3-emergency-fund.html');
  const first = html.indexOf('high-yield savings account (HYSA)'); const terms = html.indexOf('(HYSA)</strong>'); assert.ok(first > -1 && terms > first, 'HYSA expanded in prose before the terms box');
});

test('buildSeriesNav renders previous, section home and next from the index', () => {
  const html = buildSeriesNav(index, '/moneyhub/step3-emergency-fund.html');
  assert.match(html, /href="\/moneyhub\/step2-high-interest-debt\.html" class="step-nav-footer__prev"/);
  assert.match(html, /href="\/moneyhub\/foundation\/" class="step-nav-footer__home">Your Foundation</);
  assert.match(html, /href="\/moneyhub\/step4-investing-basics\.html" class="step-nav-footer__next"/);
  const first = buildSeriesNav(index, '/moneyhub/step1-know-your-money.html');
  assert.doesNotMatch(first, /step-nav-footer__prev/);
  assert.equal(buildSeriesNav(index, '/moneyhub/qa.html'), '', 'no chain, no nav');
});

test('buildRelatedList favours topic and series, and keeps advanced research off beginner pages', () => {
  const me = index.find(p => p.url === '/moneyhub/step3-emergency-fund.html');
  const html = buildRelatedList(index, me, 4);
  assert.match(html, /post-card/);
  assert.doesNotMatch(html, /\/research\//, 'no market research recommended from a beginner guide');
  const vst = index.find(p => /vst-ai-power/.test(p.url));
  const r = buildRelatedList(index, vst, 4);
  assert.match(r, /\/research\//);
});

test('buttons inside prose keep their own colours (the prose link rule must not win)', () => {
  const css = readFileSync(join(ROOT, 'resources/css/components/article.css'), 'utf8');
  assert.match(css, /\.article__content \.btn--primary,\s*\.article__content \.btn--primary:hover \{\s*color: #ffffff;/);
  assert.match(css, /\.article__content \.btn--secondary \{\s*color: var\(--color-text-primary\);/);
  assert.match(css, /\.article__content \.btn,\s*\.article__content \.btn:hover \{\s*text-decoration: none;/);
});

test('every page container shares the header width; prose keeps its reading measure', () => {
  const read = f => readFileSync(join(ROOT, 'resources/css', f), 'utf8');
  assert.match(read('components/hub.css'), /\.hub-page \{\s*max-width: var\(--width-content-xl\)/);
  assert.match(read('components/listing.css'), /\.listing-page \{ max-width: var\(--width-content-xl\)/);
  assert.match(read('components/article.css'), /\.article-page \{\s*max-width: var\(--width-content-xl\)/);
  assert.match(read('components/article.css'), /\.article \{\s*min-width: 0;\s*max-width: var\(--width-content-md\)/);
  assert.match(read('sections/home.css'), /\.home-section \{\s*max-width: var\(--width-content-xl\)/);
  assert.match(read('components/chrome.css'), /\.chrome-header__inner \{\s*max-width: var\(--width-content-xl\)/);
});
