// Editorial metadata that cannot be inferred from a page's HTML: series
// membership and order, purpose topics, level, and the few multi-ticker posts.
// Used once by scripts/stamp-metadata.mjs to write <meta name="site:*"> tags;
// after that the page itself is the source of truth and these maps are only
// consulted for pages that have no tag yet.

// Reading chains. Order is 1-based.
export const SERIES = {
  'five-steps': [
    '/moneyhub/step1-know-your-money.html',
    '/moneyhub/step2-high-interest-debt.html',
    '/moneyhub/step3-emergency-fund.html',
    '/moneyhub/step4-investing-basics.html',
    '/moneyhub/step5-automation.html',
  ],
  'market-basics': [
    '/moneyhub/start-here/what-is-a-stock.html',
    '/moneyhub/start-here/what-is-the-stock-market.html',
    '/moneyhub/start-here/why-invest.html',
    '/moneyhub/start-here/tickers-and-indices.html',
    '/moneyhub/start-here/funds-and-etfs.html',
    '/moneyhub/start-here/how-to-read-a-chart.html',
    '/moneyhub/start-here/bulls-bears-and-crashes.html',
    '/moneyhub/start-here/volatility-and-the-vix.html',
    '/moneyhub/start-here/earnings-sectors-analyst-talk.html',
    '/moneyhub/start-here/read-a-market-take.html',
  ],
  'investing-guides': [
    '/moneyhub/investing/brokerage-basics.html',
    '/moneyhub/investing/account-types.html',
    '/moneyhub/investing/starter-portfolios.html',
    '/moneyhub/investing/automating-contributions.html',
    '/moneyhub/investing/staying-invested.html',
  ],
};

// Money Library purpose groups (the visitor-facing categories), by page.
export const MONEY_TOPICS = {
  '/moneyhub/step1-know-your-money.html': ['manage-the-month'],
  '/moneyhub/step2-high-interest-debt.html': ['handle-debt'],
  '/moneyhub/step3-emergency-fund.html': ['prepare-for-emergencies'],
  '/moneyhub/step4-investing-basics.html': ['start-investing'],
  '/moneyhub/step5-automation.html': ['manage-the-month', 'start-investing'],
  '/moneyhub/qa.html': ['manage-the-month', 'handle-debt', 'prepare-for-emergencies', 'start-investing'],
  '/moneyhub/topics.html': ['manage-the-month', 'prepare-for-emergencies', 'start-investing'],
};

// Interactive tools and the purpose group each serves.
export const TOOL_TOPICS = {
  '/moneyhub/tools/money-reset.html': ['manage-the-month'],
  '/moneyhub/tools/savings-ladder.html': ['prepare-for-emergencies'],
  '/moneyhub/tools/debt-cost.html': ['handle-debt'],
  '/moneyhub/tools/compound-growth.html': ['start-investing'],
  '/moneyhub/tools/account-vs-investment.html': ['start-investing'],
};

// Pages that are reference material rather than a guided read.
export const REFERENCE_PAGES = new Set([
  '/moneyhub/qa.html', '/moneyhub/topics.html',
]);

// Posts whose slug names several tickers. The first is still `ticker`.
export const TICKER_OVERRIDES = {
  '/research/lelouch/stocks/axti-cohr-indium-phosphide-bottleneck-august-2026.html': ['AXTI', 'COHR'],
  '/research/lelouch/stocks/cohr-lite-nvidia-cpo-laser-august-2026.html': ['COHR', 'LITE'],
  '/research/lelouch/stocks/eqix-dlr-datacenter-reits-august-2026.html': ['EQIX', 'DLR'],
  '/research/lelouch/stocks/etn-gev-vrt-fps-datacenter-equipment-august-2026.html': ['ETN', 'GEV', 'VRT', 'FPS'],
  '/research/lelouch/stocks/mtz-myrg-acm-prim-flr-agx-august-2026.html': ['MTZ', 'MYRG', 'ACM', 'PRIM', 'FLR', 'AGX'],
  '/research/lelouch/stocks/strl-fix-eme-pwr-datacenter-build-august-2026.html': ['STRL', 'FIX', 'EME', 'PWR'],
  '/research/gojo/stocks/ktos-vs-rklb-april-2026.html': ['KTOS', 'RKLB'],
  '/research/gojo/stocks/lly-vs-amgn-april-2026.html': ['LLY', 'AMGN'],
};

export function seriesFor(url) {
  for (const [series, pages] of Object.entries(SERIES)) {
    const i = pages.indexOf(url);
    if (i >= 0) return { series, order: i + 1 };
  }
  return null;
}

// Derive the editorial fields for a page from its URL and index classification.
// `post` is the extractPost() result (type, section, ticker, url).
export function rulesFor(post) {
  const { url, type } = post;
  const isIndex = /\/index\.html$/.test(url);
  const isSectionHub = isIndex && url !== '/index.html' && !url.startsWith('/about/');
  const meta = {};

  if (isSectionHub) meta.kind = 'hub';
  else if (isIndex) meta.kind = 'page';
  else if (type === 'market-take' || type === 'deep-dive' || type === 'lelouch-take') meta.kind = 'research';
  else if (type === 'journal') meta.kind = 'journal';
  else if (type === 'wealth' && url.startsWith('/moneyhub/tools/')) meta.kind = 'tool';
  else if (type === 'wealth') meta.kind = REFERENCE_PAGES.has(url) ? 'reference' : 'guide';
  else if (type === 'health') meta.kind = 'guide';
  else meta.kind = 'page';

  if (meta.kind === 'research') meta.level = 'advanced';
  else if (meta.kind === 'guide' || meta.kind === 'reference' || meta.kind === 'tool') meta.level = 'beginner';

  const s = seriesFor(url);
  if (s) { meta.series = s.series; meta.order = String(s.order); }

  if (type === 'wealth') {
    if (url.startsWith('/moneyhub/tools/')) meta.topics = TOOL_TOPICS[url] || ['manage-the-month'];
    else if (url.startsWith('/moneyhub/start-here/')) meta.topics = ['understand-markets'];
    else if (url.startsWith('/moneyhub/investing/')) meta.topics = ['start-investing'];
    else if (MONEY_TOPICS[url]) meta.topics = MONEY_TOPICS[url];
  } else if (type === 'health') {
    const slug = url.replace(/^\/healthhub\//, '').replace(/\.html$/, '');
    if (!isIndex) meta.topics = [slug];
  } else if (meta.kind === 'research') {
    if (/spy-market-review/.test(url)) meta.topics = ['market-review'];
    else if (/earnings/.test(url)) meta.topics = ['earnings'];
    else meta.topics = ['stock-analysis'];
  } else if (type === 'journal') {
    meta.topics = ['build-log'];
  }

  if (TICKER_OVERRIDES[url]) meta.tickers = TICKER_OVERRIDES[url];
  else if (post.ticker) meta.tickers = [post.ticker];

  if (meta.kind === 'research') meta.disclaimer = 'ai-market';
  else if (type === 'journal') meta.disclaimer = 'ai-journal';
  else if (type === 'wealth') meta.disclaimer = 'personal-finance';
  else if (type === 'health') meta.disclaimer = 'health';

  return meta;
}
