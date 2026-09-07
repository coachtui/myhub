// Refresh resources/data/market-history.json from Shiller's monthly series.
//
//   node scripts/fetch-market-history.mjs                 # download the datahub mirror
//   node scripts/fetch-market-history.mjs --from file.csv # use a local CSV in the same layout
//
// The mirror (datahub.io/core/s-and-p-500) republishes Shiller's ie_data as
// CSV. Rows are used only while price, dividend and CPI are all present, so
// the coverage end in the JSON is the last complete month, not today.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { buildMarketHistory } from './lib/market-history.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const OUT_PATH = 'resources/data/market-history.json';
const MIRROR = 'https://datahub.io/core/s-and-p-500/r/data.csv';

async function main() {
  const i = process.argv.indexOf('--from');
  const text = i > -1 ? readFileSync(process.argv[i + 1], 'utf8') : await (await fetch(MIRROR)).text();
  const data = buildMarketHistory(text, { retrieved: new Date().toISOString().slice(0, 10), sourceUrl: MIRROR });
  writeFileSync(join(ROOT, OUT_PATH), JSON.stringify(data) + '\n');
  console.log(`market-history.json: ${data.source.coverage.from} → ${data.source.coverage.to} (${data.source.months} months), 30-year real median ${(data.horizons[30].real.median * 100).toFixed(1)}%`);
}

if (process.argv[1] && process.argv[1].endsWith('fetch-market-history.mjs')) main();
