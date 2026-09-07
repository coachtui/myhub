import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPost } from './lib/extract-post.mjs';
import { walkPages, REDIRECT_STUBS } from './lib/pages.mjs';
import { canonicalUrl } from './lib/page-head.mjs';
import { CONTENT_DIRS, SITE_ORIGIN } from '../resources/js/sections.mjs';

const SKIP = /index\.html$/;
export const INDEX_PATH = 'resources/data/search-index.json';
export const SITEMAP_PATH = 'sitemap.xml';
export const ROBOTS_PATH = 'robots.txt';

export function buildIndex(root) {
  const posts = [];
  for (const d of CONTENT_DIRS) {
    const abs = join(root, d);
    try { statSync(abs); } catch { continue; }
    for (const { file, url } of walkPages(root)) {
      if (!url.startsWith('/' + d + '/') || SKIP.test(url)) continue;
      posts.push(extractPost(readFileSync(file, 'utf8'), url));
    }
  }
  // Total order → identical output on any filesystem: date desc, then url asc.
  const cmp = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
  posts.sort((a, b) => cmp(b.date || '', a.date || '') || cmp(a.url, b.url));
  return posts;
}

export function serializeIndex(posts) {
  return JSON.stringify(posts, null, 0) + '\n';
}

// Every page except redirect stubs; lastmod from the index where a page is indexed.
export function buildSitemap(root, posts = buildIndex(root)) {
  const dates = new Map(posts.map(p => [p.url, p.date]));
  const rows = walkPages(root)
    .filter(({ url }) => !REDIRECT_STUBS.has(url))
    .map(({ url }) => {
      const lastmod = dates.get(url);
      return `  <url><loc>${canonicalUrl(url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

export function buildRobots() {
  return `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

const isMain = process.argv[1] && process.argv[1].endsWith('build-index.mjs');
if (isMain) {
  const ROOT = fileURLToPath(new URL('..', import.meta.url));
  const posts = buildIndex(ROOT);
  writeFileSync(join(ROOT, INDEX_PATH), serializeIndex(posts));
  writeFileSync(join(ROOT, SITEMAP_PATH), buildSitemap(ROOT, posts));
  writeFileSync(join(ROOT, ROBOTS_PATH), buildRobots());
  console.log(`Indexed ${posts.length} posts → ${INDEX_PATH}; wrote ${SITEMAP_PATH} and ${ROBOTS_PATH}`);
}
