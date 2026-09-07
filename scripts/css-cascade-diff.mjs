// Compare two CSS trees by resolving, per selector, the final declaration map
// after the cascade in @import order. Used to prove a CSS refactor is a no-op.
//   git archive HEAD resources/css | tar -x -C /tmp/css-old
//   node scripts/css-cascade-diff.mjs /tmp/css-old/resources/css resources/css
// Shorthand vs longhand differences are reported and must be judged by hand.
// where each root contains style.css with @import lines.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

function loadTree(root) {
  const seen = [];
  function load(file) {
    let css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    css = css.replace(/@import\s+url\(['"]?([^'")]+)['"]?\);?/g, (_, p) => { load(join(dirname(file), p)); return ''; });
    seen.push({ file, css });
  }
  load(join(root, 'style.css'));
  return seen;
}

// Very small CSS tokenizer: handles top-level rules and one level of @media nesting.
function parseRules(css, ctx = '') {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const prelude = css.slice(i, open).trim();
    if (prelude.startsWith('@media') || prelude.startsWith('@supports')) {
      // find matching close
      let depth = 1, j = open + 1;
      while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      out.push(...parseRules(css.slice(open + 1, j - 1), (ctx ? ctx + ' && ' : '') + prelude.replace(/\s+/g, ' ')));
      i = j;
      continue;
    }
    const close = css.indexOf('}', open);
    const body = css.slice(open + 1, close);
    const decls = body.split(';').map(s => s.trim()).filter(Boolean).map(d => {
      const k = d.indexOf(':'); return [d.slice(0, k).trim(), d.slice(k + 1).trim().replace(/\s+/g, ' ')];
    });
    for (const sel of prelude.split(',').map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean)) {
      out.push({ sel: (ctx ? ctx + ' :: ' : '') + sel, decls });
    }
    i = close + 1;
  }
  return out;
}

function resolve(root) {
  const map = new Map();
  for (const { css } of loadTree(root)) {
    for (const r of parseRules(css)) {
      if (!map.has(r.sel)) map.set(r.sel, new Map());
      const m = map.get(r.sel);
      for (const [k, v] of r.decls) {
        const imp = /!important/.test(v);
        const cur = m.get(k);
        if (cur && cur.imp && !imp) continue; // earlier !important beats later normal
        m.set(k, { v: v.replace(/\s*!important/, ''), imp });
      }
    }
  }
  return map;
}

const [oldRoot, newRoot] = process.argv.slice(2);
const A = resolve(oldRoot), B = resolve(newRoot);
const removed = [], changed = [], added = [];
for (const [sel, ma] of A) {
  const mb = B.get(sel);
  if (!mb) { removed.push(sel); continue; }
  const diffs = [];
  for (const [k, va] of ma) { const vb = mb.get(k); if (!vb || vb.v !== va.v) diffs.push(`${k}: ${va.v} -> ${vb ? vb.v : '(gone)'}`); }
  for (const [k, vb] of mb) if (!ma.has(k)) diffs.push(`${k}: (new) ${vb.v}`);
  if (diffs.length) changed.push({ sel, diffs });
}
for (const sel of B.keys()) if (!A.has(sel)) added.push(sel);
console.log('selectors old/new:', A.size, B.size);
console.log('\nCHANGED (final values differ):'); for (const c of changed) { console.log(' ', c.sel); for (const d of c.diffs) console.log('     ', d); }
console.log('\nREMOVED selectors:'); for (const s of removed) console.log(' ', s);
console.log('\nADDED selectors:'); for (const s of added) console.log(' ', s);
