import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPost } from './lib/extract-post.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIRS = ['gojo/stocks', 'gojo/research', 'gojo/notes', 'moneyhub', 'healthhub'];
const SKIP = /index\.html$/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.html') && !SKIP.test(name)) out.push(full);
  }
  return out;
}

const posts = [];
for (const d of CONTENT_DIRS) {
  const abs = join(ROOT, d);
  try { statSync(abs); } catch { continue; }
  for (const file of walk(abs)) {
    const url = '/' + relative(ROOT, file).split(sep).join('/');
    posts.push(extractPost(readFileSync(file, 'utf8'), url));
  }
}
posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

const outPath = join(ROOT, 'resources/data/search-index.json');
writeFileSync(outPath, JSON.stringify(posts, null, 0) + '\n');
console.log(`Indexed ${posts.length} posts → resources/data/search-index.json`);
