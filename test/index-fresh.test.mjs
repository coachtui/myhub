import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, serializeIndex, INDEX_PATH } from '../scripts/build-index.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('committed search-index.json is up to date with the articles', () => {
  const committed = readFileSync(join(ROOT, INDEX_PATH), 'utf8');
  const fresh = serializeIndex(buildIndex(ROOT));
  assert.equal(committed, fresh, 'search-index.json is stale — run `npm run build:index` and commit the result');
});
