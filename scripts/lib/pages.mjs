import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Every publishable HTML page in the repo, sorted, as { file, url }.
// Shared by the index builder, the metadata stamper, and the sitemap.
const SKIP_DIRS = new Set(['.git', 'node_modules', 'docs', 'test', 'scripts', 'resources', '.cto']);

// Soft-redirect stubs: not stamped, not in the sitemap.
export const REDIRECT_STUBS = new Set(['/gojo/research/index.html']);

export function walkPages(root) {
  const out = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.html')) out.push({ file: full, url: '/' + relative(root, full).split(sep).join('/') });
    }
  })(root);
  return out.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
}
