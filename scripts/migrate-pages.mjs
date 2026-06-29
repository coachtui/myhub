import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArticle } from './lib/extract-article.mjs';
import { renderArticle } from './lib/render-article.mjs';
import { renderHead } from './lib/page-head.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIRS = ['gojo', 'moneyhub', 'healthhub'];

export function classifyPage(html, url) {
  if (html.includes('id="site-header"')) return 'migrated';
  if (basename(url) === 'index.html') return 'hub';
  if (html.includes('article__content')) return 'article';
  return 'hub';
}

export function swapHubChrome(html) {
  if (html.includes('id="site-header"')) return html;
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1];
  const description = (html.match(/<meta name="description" content="([\s\S]*?)">/) || [, ''])[1];
  let out = html.replace(/<head>[\s\S]*?<\/head>/, `<head>${renderHead({ title, description })}\n</head>`);
  out = out.replace(/<nav class="nav-global">[\s\S]*?<\/nav>[\s\S]*?<nav class="nav-mobile">[\s\S]*?<\/nav>/,
    '<header class="chrome-header" id="site-header" aria-label="Site header"></header>');
  out = out.replace(/<footer class="footer">[\s\S]*?<\/footer>/,
    '<footer class="chrome-footer" id="site-footer" aria-label="Site footer"></footer>');
  out = out.replace(/<script src="\/resources\/js\/navigation\.js"><\/script>/,
    '<script type="module" src="/resources/js/chrome.mjs"></script>\n<script type="module" src="/resources/js/search.mjs"></script>');
  return out;
}

function walk(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const full = join(dir, n);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (n.endsWith('.html')) out.push(full);
  }
  return out;
}

function run({ apply }) {
  const counts = { article: 0, hub: 0, migrated: 0 };
  for (const d of DIRS) {
    const abs = join(ROOT, d); try { statSync(abs); } catch { continue; }
    for (const file of walk(abs)) {
      const url = '/' + relative(ROOT, file).split(sep).join('/');
      const html = readFileSync(file, 'utf8');
      const kind = classifyPage(html, url);
      counts[kind]++;
      if (!apply) continue;
      if (kind === 'article') writeFileSync(file, renderArticle(extractArticle(html, url)));
      else if (kind === 'hub') writeFileSync(file, swapHubChrome(html));
    }
  }
  console.log(`${apply ? 'APPLIED' : 'DRY-RUN'} ${JSON.stringify(counts)}`);
}

const isMain = process.argv[1] && process.argv[1].endsWith('migrate-pages.mjs');
if (isMain) run({ apply: process.argv.includes('--apply') });
