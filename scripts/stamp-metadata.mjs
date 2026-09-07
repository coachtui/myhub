// Stamp every page's <head> with the shared head (canonical, Open Graph) and
// its site:* metadata. Idempotent: values already present in a page's tags are
// kept, then the editorial rules fill gaps, then inference from the HTML and
// git history fills the rest. Run after adding pages or editing rules:
//
//   node scripts/stamp-metadata.mjs            # dry run: reports what would change
//   node scripts/stamp-metadata.mjs --apply    # rewrite heads in place
//
// Then `npm run build:index` so the index and sitemap reflect the tags.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderHead, parseSiteMeta } from './lib/page-head.mjs';
import { extractPost, decode } from './lib/extract-post.mjs';
import { rulesFor } from './lib/page-metadata-rules.mjs';
import { walkPages, REDIRECT_STUBS } from './lib/pages.mjs';
import { sectionForUrl, META_KEYS } from '../resources/js/sections.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function firstCommitDate(file) {
  try {
    const out = execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%as', '--', file], { cwd: ROOT, encoding: 'utf8' });
    const dates = out.trim().split('\n').filter(Boolean);
    return dates[dates.length - 1] || '';
  } catch { return ''; }
}

const authorIdFor = url => {
  const s = sectionForUrl(url);
  if (!s) return 'tui';
  return s.id === 'gojo' || s.id === 'lelouch' ? s.id : 'tui';
};

// Compute the complete metadata for one page.
export function computeMeta(html, url, file) {
  const existing = parseSiteMeta(html);
  const post = extractPost(html, url);
  const rules = rulesFor(post);
  // Articles date themselves (filename or byline); hubs and plain pages take
  // the date the file first entered the repository. A page with no history yet
  // is being published today.
  const isArticle = !['hub', 'page'].includes(existing.kind ?? rules.kind);
  const inferred = {
    section: sectionForUrl(url)?.id || '',
    author: authorIdFor(url),
    published: (isArticle && post.date) || (file ? firstCommitDate(file) : '') || post.date || new Date().toISOString().slice(0, 10),
  };
  const meta = {};
  for (const k of META_KEYS) {
    const v = existing[k] ?? rules[k] ?? inferred[k];
    if (v !== undefined && v !== null && v !== '') meta[k] = v;
  }
  return meta;
}

export function stampHead(html, url, meta) {
  const head = (html.match(/<head>([\s\S]*?)<\/head>/) || [, ''])[1];
  const title = decode((head.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1]);
  const description = decode((head.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [, ''])[1]);
  return html.replace(/<head>[\s\S]*?<\/head>/, `<head>${renderHead({ title, description, url, meta })}\n</head>`);
}

function run({ apply }) {
  let changed = 0, total = 0;
  for (const { file, url } of walkPages(ROOT)) {
    if (REDIRECT_STUBS.has(url)) continue;
    total++;
    const html = readFileSync(file, 'utf8');
    const meta = computeMeta(html, url, file);
    const next = stampHead(html, url, meta);
    if (next !== html) {
      changed++;
      if (apply) writeFileSync(file, next);
      else console.log(`${url}  ${META_KEYS.filter(k => meta[k] !== undefined).map(k => `${k}=${Array.isArray(meta[k]) ? meta[k].join('|') : meta[k]}`).join(' ')}`);
    }
  }
  console.log(`${apply ? 'STAMPED' : 'DRY-RUN'}: ${changed} of ${total} pages ${apply ? 'rewritten' : 'would change'}`);
}

const isMain = process.argv[1] && process.argv[1].endsWith('stamp-metadata.mjs');
if (isMain) run({ apply: process.argv.includes('--apply') });
