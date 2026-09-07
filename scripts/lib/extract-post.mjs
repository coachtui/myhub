import { basename } from 'node:path';
import { classifyUrl } from '../../resources/js/sections.mjs';
import { parseSiteMeta } from './page-head.mjs';

const ENTITIES = { '&amp;':'&','&mdash;':'—','&ndash;':'–','&rsquo;':'’','&lsquo;':'‘','&ldquo;':'“','&rdquo;':'”','&middot;':'·','&hellip;':'…','&nbsp;':' ','&times;':'×','&deg;':'°','&trade;':'™','&copy;':'©','&rarr;':'→','&larr;':'←' };
const MONTHS = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',
  July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' };

export function decode(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-zA-Z]+;/g, m => ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

function pick(re, html) { const m = html.match(re); return m ? decode(m[1]) : ''; }
function toISO(s) {
  const m = s.match(/([A-Z][a-z]+) (\d{1,2}), (20\d{2})/);
  return m ? `${m[3]}-${MONTHS[m[1]]}-${String(m[2]).padStart(2, '0')}` : '';
}

const WORDS_PER_MINUTE = 220;

function articleBody(html) {
  const inner = (html.match(/<article[^>]*>([\s\S]*?)<\/article>/) || [, html])[1];
  return (inner.match(/<div class="article__content">([\s\S]*)<\/div>/) || [, ''])[1];
}

export function wordCount(fragment) {
  return fragment.replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').split(/\s+/).filter(Boolean).length;
}

// Index record for one page. Editorial fields come from the page's
// <meta name="site:*"> tags (see scripts/stamp-metadata.mjs); classification,
// title, summary, ticker and date fall back to inference from URL and HTML so
// an unstamped page still indexes sensibly.
export function extractPost(html, url) {
  const file = basename(url);
  const klass = classifyUrl(url);
  const meta = parseSiteMeta(html);

  const title = pick(/<h1 class="article__title">([\s\S]*?)<\/h1>/, html)
    || decode((pick(/<title>([\s\S]*?)<\/title>/, html).split('|')[0]) || '');
  const descTag = html.match(/<meta\s[^>]*name="description"[^>]*>/i);
  const metaDesc = descTag ? decode((descTag[0].match(/content="([^"]*)"/) || [, ''])[1]) : '';
  const summary = metaDesc || pick(/<p class="article__subtitle">([\s\S]*?)<\/p>/, html);

  let date = meta.published || (file.match(/(20\d{2}-\d{2}-\d{2})/) || [])[1] || '';
  if (!date) date = toISO((html.match(/([A-Z][a-z]+ \d{1,2}, 20\d{2})/) || [])[1] || '');

  let ticker = '';
  if (klass.ticker) {
    const seg = file.split('-')[0];
    if (/^[a-z]{2,5}$/.test(seg)) ticker = seg.toUpperCase();
  }
  const tickers = meta.tickers || (ticker ? [ticker] : []);

  const body = articleBody(html);
  const words = wordCount(body);
  const headings = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m => decode(m[1].replace(/<[^>]+>/g, ''))).filter(Boolean);

  return {
    url, title, summary,
    section: klass.section, type: klass.type, ticker, date,
    kind: meta.kind || '',
    author: meta.author || '',
    level: meta.level || '',
    series: meta.series || '',
    order: meta.order ? Number(meta.order) : 0,
    topics: meta.topics || [],
    tickers,
    disclaimer: meta.disclaimer || '',
    updated: meta.updated || '',
    words,
    readTime: words ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0,
    headings,
  };
}
