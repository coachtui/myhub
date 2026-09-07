import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPost } from '../scripts/lib/extract-post.mjs';
import { computeMeta, stampHead } from '../scripts/stamp-metadata.mjs';
import { rulesFor, SERIES } from '../scripts/lib/page-metadata-rules.mjs';
import { buildIndex, buildSitemap, buildRobots, SITEMAP_PATH, ROBOTS_PATH } from '../scripts/build-index.mjs';
import { walkPages, REDIRECT_STUBS } from '../scripts/lib/pages.mjs';
import { AUTHORS, META_KEYS } from '../resources/js/sections.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const index = buildIndex(ROOT);

test('site:* tags in a page win over inference and rules', () => {
  const html = `<head><title>X</title><meta name="description" content="d">
    <meta name="site:kind" content="tool"><meta name="site:level" content="advanced">
    <meta name="site:topics" content="alpha, beta"><meta name="site:tickers" content="AAA, BBB">
    <meta name="site:published" content="2026-01-02"></head>
    <article><div class="article__content"><h2>One</h2><p>${'word '.repeat(440)}</p></div></article>`;
  const p = extractPost(html, '/moneyhub/step1-know-your-money.html');
  assert.equal(p.kind, 'tool');
  assert.equal(p.level, 'advanced');
  assert.deepEqual(p.topics, ['alpha', 'beta']);
  assert.deepEqual(p.tickers, ['AAA', 'BBB']);
  assert.equal(p.date, '2026-01-02');
  assert.equal(p.readTime, 2);
  assert.deepEqual(p.headings, ['One']);
  const meta = computeMeta(html, '/moneyhub/step1-know-your-money.html');
  assert.equal(meta.kind, 'tool', 'existing tag beats the rule (guide)');
  assert.equal(meta.series, 'five-steps', 'rule fills a missing tag');
  assert.equal(meta.order, '1');
});

test('rules classify each family sensibly', () => {
  const r = (url, type, ticker = '') => rulesFor({ url, type, ticker });
  assert.equal(r('/research/gojo/stocks/spy-market-review-2026-08-30.html', 'market-take', 'SPY').kind, 'research');
  assert.deepEqual(r('/research/gojo/stocks/spy-market-review-2026-08-30.html', 'market-take', 'SPY').topics, ['market-review']);
  assert.equal(r('/research/gojo/notes/2026-08-04-notes.html', 'journal').disclaimer, 'ai-journal');
  assert.equal(r('/moneyhub/qa.html', 'wealth').kind, 'reference');
  assert.equal(r('/moneyhub/start-here/why-invest.html', 'wealth').series, 'market-basics');
  assert.equal(r('/moneyhub/index.html', 'wealth').kind, 'hub');
  assert.equal(r('/index.html', 'page').kind, 'page');
  assert.equal(r('/about/index.html', 'page').kind, 'page');
  assert.deepEqual(r('/research/lelouch/stocks/etn-gev-vrt-fps-datacenter-equipment-august-2026.html', 'lelouch-take', 'ETN').tickers, ['ETN', 'GEV', 'VRT', 'FPS']);
});

test('stampHead rewrites only the head and is idempotent', () => {
  const html = '<!DOCTYPE html>\n<html lang="en" data-theme="light">\n<head>\n  <title>A &amp; B | X</title>\n  <meta name="description" content="S&amp;P">\n</head>\n<body><p>keep</p></body></html>';
  const meta = { section: 'money', kind: 'guide' };
  const once = stampHead(html, '/moneyhub/a.html', meta);
  assert.match(once, /<title>A &amp; B \| X<\/title>/);
  assert.match(once, /content="S&amp;P"/);
  assert.match(once, /<link rel="canonical" href="https:\/\/www\.tuialailima\.com\/moneyhub\/a\.html">/);
  assert.match(once, /<meta name="site:kind" content="guide">/);
  assert.match(once, /<body><p>keep<\/p><\/body>/);
  assert.equal(stampHead(once, '/moneyhub/a.html', meta), once);
});

test('every indexed page carries the core metadata', () => {
  const problems = [];
  for (const p of index) {
    if (!p.kind) problems.push(`${p.url}: no kind`);
    if (!AUTHORS[p.author]) problems.push(`${p.url}: unknown author "${p.author}"`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) problems.push(`${p.url}: no published date`);
    if ((p.kind === 'guide' || p.kind === 'reference' || p.kind === 'research' || p.kind === 'tool') && !p.level) problems.push(`${p.url}: no level`);
    if (!p.topics.length) problems.push(`${p.url}: no topics`);
    if (!p.disclaimer) problems.push(`${p.url}: no disclaimer kind`);
    if (p.readTime < 1) problems.push(`${p.url}: no reading time`);
    if (p.ticker && p.tickers[0] !== p.ticker) problems.push(`${p.url}: tickers[0] != ticker`);
  }
  assert.deepEqual(problems, []);
});

test('series orders are complete and contiguous in the index', () => {
  for (const [series, pages] of Object.entries(SERIES)) {
    const members = index.filter(p => p.series === series).sort((a, b) => a.order - b.order);
    assert.deepEqual(members.map(p => p.url), pages, `${series} members and order`);
    assert.deepEqual(members.map(p => p.order), pages.map((_, i) => i + 1));
  }
});

test('stamped pages carry no meta key outside META_KEYS', () => {
  const allowed = new Set(META_KEYS);
  for (const { file, url } of walkPages(ROOT)) {
    if (REDIRECT_STUBS.has(url)) continue;
    for (const m of readFileSync(file, 'utf8').matchAll(/name="site:([a-z]+)"/g)) {
      assert.ok(allowed.has(m[1]), `${url}: unknown key site:${m[1]}`);
    }
  }
});

test('sitemap lists every page once in canonical form, and robots points at it', () => {
  const xml = buildSitemap(ROOT, index);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const expected = walkPages(ROOT).filter(p => !REDIRECT_STUBS.has(p.url)).length;
  assert.equal(locs.length, expected);
  assert.equal(new Set(locs).size, locs.length, 'no duplicates');
  assert.ok(locs.every(l => l.startsWith('https://www.tuialailima.com/') && !l.endsWith('index.html')));
  assert.ok(locs.includes('https://www.tuialailima.com/'));
  assert.match(buildRobots(), /Sitemap: https:\/\/www\.tuialailima\.com\/sitemap\.xml/);
});

test('committed sitemap.xml and robots.txt are up to date', () => {
  assert.equal(readFileSync(join(ROOT, SITEMAP_PATH), 'utf8'), buildSitemap(ROOT, index), 'sitemap.xml is stale — run `npm run build:index`');
  assert.equal(readFileSync(join(ROOT, ROBOTS_PATH), 'utf8'), buildRobots(), 'robots.txt is stale — run `npm run build:index`');
});
