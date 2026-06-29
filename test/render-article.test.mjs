import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHead } from '../scripts/lib/page-head.mjs';
import { renderArticle } from '../scripts/lib/render-article.mjs';

test('head includes new fonts, css, theme, and escaped title/description', () => {
  const h = renderHead({ title: 'SPY & the Fed', description: 'A "tight" read <here>' });
  assert.match(h, /Instrument\+Serif/);
  assert.match(h, /Source\+Serif\+4/);
  assert.match(h, /IBM\+Plex\+Mono/);
  assert.match(h, /\/resources\/css\/style\.css/);
  assert.match(h, /\/resources\/js\/theme\.js/);
  assert.match(h, /<title>SPY &amp; the Fed<\/title>/);
  assert.match(h, /content="A &quot;tight&quot; read &lt;here&gt;"/);
  assert.doesNotMatch(h, /Inter|Fraunces|JetBrains/);
});

const fields = {
  url: '/gojo/stocks/spy-x.html', title: 'SPY Review', description: 'desc',
  headerTitle: 'SPY Review', subtitle: 'A close read.', contentHtml: '<p>Body</p><h2>Section</h2>',
  breadcrumb: [{label:'Home',href:'/'},{label:'Gojo',href:'/gojo/'},{label:'SPY Review',href:null}],
  hasDisclaimer: true, disclaimerText: 'AI-generated. Not advice.', stepNavHtml: '',
  author: 'Gojo (AI analyst)', date: '2026-06-28', section: 'Gojo', type: 'market-take', ticker: 'SPY', readTime: 6,
};

test('renders chrome mounts and drops old structure', () => {
  const h = renderArticle(fields);
  assert.match(h, /id="site-header"/);
  assert.match(h, /id="site-footer"/);
  assert.match(h, /id="article-rail"/);
  assert.doesNotMatch(h, /nav-global|sidebar-nav|page-layout/);
  assert.match(h, /resources\/js\/chrome\.mjs/);
  assert.match(h, /resources\/js\/article\.mjs/);
});

test('renders kicker, title, editorial byline, and verbatim content', () => {
  const h = renderArticle(fields);
  assert.match(h, /class="kicker"[^>]*>[\s\S]*GOJO[\s\S]*SPY/);
  assert.match(h, /<h1 class="article__title">SPY Review<\/h1>/);
  assert.match(h, /By <b>Gojo \(AI analyst\)<\/b>/);
  assert.match(h, /June 28, 2026/);
  assert.match(h, /6 min read/);
  assert.match(h, /<p>Body<\/p><h2>Section<\/h2>/);
});

test('includes disclaimer callout only when hasDisclaimer', () => {
  assert.match(renderArticle(fields), /class="callout callout--ai"/);
  assert.doesNotMatch(renderArticle({ ...fields, hasDisclaimer: false }), /callout--ai/);
});
