import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPost } from './lib/extract-post.mjs';

const CONTENT_DIRS = ['gojo/stocks', 'gojo/research', 'gojo/notes', 'moneyhub', 'healthhub'];
const SKIP = /index\.html$/;
export const INDEX_PATH = 'resources/data/search-index.json';

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.html') && !SKIP.test(name)) out.push(full);
  }
  return out;
}

export function buildIndex(root) {
  const posts = [];
  for (const d of CONTENT_DIRS) {
    const abs = join(root, d);
    try { statSync(abs); } catch { continue; }
    for (const file of walk(abs)) {
      const url = '/' + relative(root, file).split(sep).join('/');
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

const isMain = process.argv[1] && process.argv[1].endsWith('build-index.mjs');
if (isMain) {
  const ROOT = fileURLToPath(new URL('..', import.meta.url));
  const posts = buildIndex(ROOT);
  writeFileSync(join(ROOT, INDEX_PATH), serializeIndex(posts));
  console.log(`Indexed ${posts.length} posts → ${INDEX_PATH}`);
}
