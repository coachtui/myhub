import { basename } from 'node:path';

const SECTIONS = [
  { re: /\/gojo\/stocks\//,   section: 'Gojo',   type: 'market-take' },
  { re: /\/gojo\/research\//,  section: 'Gojo',   type: 'deep-dive' },
  { re: /\/gojo\/notes\//,     section: 'Gojo',   type: 'journal' },
  { re: /\/moneyhub\//,        section: 'Wealth', type: 'wealth' },
  { re: /\/healthhub\//,       section: 'Health', type: 'health' },
];

const ENTITIES = { '&amp;':'&','&mdash;':'—','&ndash;':'–','&rsquo;':'’','&lsquo;':'‘',
  '&ldquo;':'“','&rdquo;':'”','&middot;':'·','&hellip;':'…','&nbsp;':' ' };
const MONTHS = { January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',
  July:'07',August:'08',September:'09',October:'10',November:'11',December:'12' };

function decode(s) { return s.replace(/&[a-z]+;/g, m => ENTITIES[m] ?? m).replace(/\s+/g, ' ').trim(); }
function pick(re, html) { const m = html.match(re); return m ? decode(m[1]) : ''; }
function toISO(s) {
  const m = s.match(/([A-Z][a-z]+) (\d{1,2}), (20\d{2})/);
  return m ? `${m[3]}-${MONTHS[m[1]]}-${String(m[2]).padStart(2, '0')}` : '';
}

export function extractPost(html, url) {
  const file = basename(url);
  const klass = SECTIONS.find(s => s.re.test(url)) || { section: 'Site', type: 'page' };

  const title = pick(/<h1 class="article__title">([\s\S]*?)<\/h1>/, html)
    || decode((pick(/<title>([\s\S]*?)<\/title>/, html).split('|')[0]) || '');
  const summary = pick(/<meta name="description" content="([\s\S]*?)">/, html)
    || pick(/<p class="article__subtitle">([\s\S]*?)<\/p>/, html);

  let date = (file.match(/(20\d{2}-\d{2}-\d{2})/) || [])[1] || '';
  if (!date) date = toISO((html.match(/([A-Z][a-z]+ \d{1,2}, 20\d{2})/) || [])[1] || '');

  let ticker = '';
  if (klass.type === 'market-take' || klass.type === 'deep-dive') {
    const seg = file.split('-')[0];
    if (/^[a-z]{2,5}$/.test(seg)) ticker = seg.toUpperCase();
  }

  return { url, title, summary, section: klass.section, type: klass.type, ticker, date };
}