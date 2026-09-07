// Compound Growth and Cost-of-Waiting tool. Contribution, horizon and a
// delay in; projected value under evidence-based assumptions, the same plan
// started later, and the historical record the assumptions come from.
// Pure logic exported for tests; DOM wiring runs only in a browser.
// Nothing entered here is stored or sent anywhere. The only network request
// is for the public market-history dataset.

import { parseMoney, formatMoney, escHtml } from './lib/money.mjs';
import { scale } from './lib/chart-svg.mjs';

export const HORIZONS = [10, 20, 30, 40];
export const DELAYS = [0, 1, 3, 5, 10];

// Yearly balances, contributions made monthly, growth compounded monthly.
export function project({ monthly = 0, start = 0, years = 30, rate = 0, startYear = 0 }) {
  const r = Math.pow(1 + rate, 1 / 12) - 1;
  const out = [start];
  let bal = start;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + r);
      if (y > startYear) bal += monthly;
    }
    out.push(Math.round(bal * 100) / 100);
  }
  return out;
}

export function contributed({ monthly = 0, start = 0, years = 30, startYear = 0 }) {
  return start + monthly * 12 * Math.max(0, years - startYear);
}

// Assumption bands from the historical record for a horizon (40 uses 30).
export function assumptions(history, years) {
  const h = history.horizons[String(Math.min(30, Math.max(10, Math.round(years / 10) * 10)))];
  return {
    horizonUsed: h.months / 12,
    cautious: h.real.p10,
    middle: h.real.median,
    strong: h.real.p90,
    worst: h.real.min,
    negativeShare: h.real.negativeShare,
    count: h.real.count,
    nominalMedian: h.nominal.median,
  };
}

export function computeCompound(raw = {}, history) {
  const monthly = parseMoney(raw.monthly), start = parseMoney(raw.start);
  const years = HORIZONS.includes(+raw.years) ? +raw.years : 30;
  const delay = DELAYS.includes(+raw.delay) ? +raw.delay : 0;
  const notes = [];
  if (monthly.note === 'negative') notes.push('Monthly contribution');
  if (start.note === 'negative') notes.push('Starting amount');
  const M = monthly.value, S = start.value;
  if (M === 0 && S === 0) {
    return { status: 'empty', notes, title: 'Start with a monthly amount.', meaning: 'Any amount works; the tool scales. Even $50 a month shows the shape of compounding and what waiting costs.', action: { href: '/moneyhub/tools/money-reset.html', label: 'Not sure what you can spare? Money Reset' } };
  }
  const a = assumptions(history, years);
  const paths = {
    cash: project({ monthly: M, start: S, years, rate: 0 }),
    cautious: project({ monthly: M, start: S, years, rate: a.cautious }),
    middle: project({ monthly: M, start: S, years, rate: a.middle }),
  };
  const put = contributed({ monthly: M, start: S, years });
  const end = { cash: paths.cash[years], cautious: paths.cautious[years], middle: paths.middle[years] };
  let waiting = null;
  if (delay > 0 && delay < years) {
    const later = project({ monthly: M, start: S, years, rate: a.middle, startYear: delay })[years];
    const laterPut = contributed({ monthly: M, start: S, years, startYear: delay });
    waiting = { delay, later, gap: end.middle - later, contributedGap: put - laterPut };
  }
  const pctText = r => `${(r * 100).toFixed(1)}%`;
  const title = `About ${formatMoney(end.middle)} in today's dollars after ${years} years, if the future resembles the historical middle.`;
  const meaning = `You would have put in ${formatMoney(put)}. At the cautious assumption (${pctText(a.cautious)} a year after inflation, the level one in ten historical ${a.horizonUsed}-year periods fell below) it is about ${formatMoney(end.cautious)}; with no growth at all it is ${formatMoney(end.cash)}. These are assumptions drawn from ${a.count.toLocaleString('en-US')} rolling ${a.horizonUsed}-year periods since ${history.source.coverage.from.slice(0, 4)}, not predictions: real outcomes have ranged from ${pctText(a.worst)} to ${pctText(history.horizons[String(a.horizonUsed)].real.max)} a year.`
    + (waiting ? ` Starting ${waiting.delay} year${waiting.delay === 1 ? '' : 's'} later, with the same monthly amount, ends around ${formatMoney(waiting.later)}: about ${formatMoney(waiting.gap)} less, of which only ${formatMoney(waiting.contributedGap)} is money you did not put in. The rest is time.` : '');
  return { status: 'ok', notes, monthly: M, start: S, years, delay, assumptions: a, paths, put, end, waiting, title, meaning,
    action: { href: '/moneyhub/investing/', label: 'How to actually start: the five guides' } };
}

/* ---------- rendering ---------- */

const W = 640, H = 280, PAD = 36;

export function renderChart(r) {
  const n = r.years;
  const all = [...r.paths.cash, ...r.paths.cautious, ...r.paths.middle];
  const hi = Math.max(...all, 1);
  const x = i => scale(i, 0, n, PAD, W - PAD / 2);
  const y = v => scale(v, 0, hi, H - PAD, PAD / 2);
  const path = vals => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const line = (vals, stroke, dash = '') => `<path d="${path(vals)}" fill="none" stroke="${stroke}" stroke-width="2.5"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  const label = `Projected value over ${n} years: contributions only, cautious assumption, and middle assumption`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escHtml(label)}" preserveAspectRatio="xMidYMid meet" class="compound-chart">
    <line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD / 2}" y2="${H - PAD}" stroke="var(--color-border-strong)"/>
    <line x1="${PAD}" y1="${PAD / 2}" x2="${PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)"/>
    <text x="${PAD - 6}" y="${PAD / 2 + 4}" text-anchor="end" font-size="11" fill="var(--color-text-tertiary)">${escHtml(formatMoney(hi))}</text>
    <text x="${PAD - 6}" y="${H - PAD + 4}" text-anchor="end" font-size="11" fill="var(--color-text-tertiary)">$0</text>
    <text x="${PAD}" y="${H - PAD + 16}" font-size="11" fill="var(--color-text-tertiary)">now</text>
    <text x="${W - PAD / 2}" y="${H - PAD + 16}" text-anchor="end" font-size="11" fill="var(--color-text-tertiary)">${n} years</text>
    ${line(r.paths.cash, 'var(--color-text-quaternary)', '4 4')}
    ${line(r.paths.cautious, 'var(--color-info)')}
    ${line(r.paths.middle, 'var(--color-accent-primary)')}
  </svg>
  <ul class="compound-legend" aria-hidden="true">
    <li><span class="compound-legend__swatch compound-legend__swatch--cash"></span>Contributions only (0%)</li>
    <li><span class="compound-legend__swatch compound-legend__swatch--cautious"></span>Cautious assumption</li>
    <li><span class="compound-legend__swatch compound-legend__swatch--middle"></span>Middle assumption</li>
  </ul>`;
}

export function renderTable(r) {
  const step = r.years >= 30 ? 10 : 5;
  const rows = [];
  for (let y = step; y <= r.years; y += step) rows.push(`<tr><th scope="row">Year ${y}</th><td>${escHtml(formatMoney(r.paths.cash[y]))}</td><td>${escHtml(formatMoney(r.paths.cautious[y]))}</td><td>${escHtml(formatMoney(r.paths.middle[y]))}</td></tr>`);
  return `<table class="debt-table"><caption class="sr-only">Projected value by year under each assumption, in today's dollars</caption>
    <thead><tr><th scope="col">Year</th><th scope="col">No growth</th><th scope="col">Cautious (${(r.assumptions.cautious * 100).toFixed(1)}%)</th><th scope="col">Middle (${(r.assumptions.middle * 100).toFixed(1)}%)</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table>`;
}

export function renderEvidence(history) {
  const p = v => `${(v * 100).toFixed(1)}%`;
  const rows = [10, 20, 30].map(y => { const h = history.horizons[String(y)].real; return `<tr><th scope="row">${y} years</th><td>${p(h.min)}</td><td>${p(h.p10)}</td><td>${p(h.median)}</td><td>${p(h.p90)}</td><td>${p(h.max)}</td><td>${Math.round(h.negativeShare * 100)}%</td></tr>`; }).join('');
  const dd = history.drawdowns.slice(0, 4).map(d => `<li>${escHtml(d.peak)} to ${escHtml(d.trough)}: ${Math.round(d.depth * 100)}%${d.monthsToRecover ? `, ${Math.round(d.monthsToRecover / 12)} years to a new high` : ''}</li>`).join('');
  return `<div class="tablewrap"><table class="debt-table"><caption class="sr-only">Annualised real total returns of rolling periods</caption>
    <thead><tr><th scope="col">Rolling period</th><th scope="col">Worst</th><th scope="col">1 in 10 below</th><th scope="col">Median</th><th scope="col">1 in 10 above</th><th scope="col">Best</th><th scope="col">Periods with a loss</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <p class="tool__note">Annualised returns after inflation, dividends reinvested, for every start month from ${escHtml(history.source.coverage.from)} to ${escHtml(history.source.coverage.to)} (the last complete month in the dataset; retrieved ${escHtml(history.source.retrieved)}). Before inflation, the median 30-year return was ${p(history.horizons['30'].nominal.median)} a year; over the whole period, ${p(history.fullPeriod.real)} real and ${p(history.fullPeriod.nominal)} nominal.</p>
    <h3 class="tool__subhead">The declines inside those numbers</h3>
    <ul class="compound-drawdowns">${dd}</ul>`;
}

export function mountCompound(root, history) {
  const form = root.querySelector('form');
  const out = root.querySelector('[data-result]');
  const evidence = root.ownerDocument.querySelector('[data-evidence]');
  if (!form || !out) return;
  if (evidence) evidence.innerHTML = renderEvidence(history);
  const empty = out.innerHTML;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const r = computeCompound(Object.fromEntries(new FormData(form)), history);
    const head = r.status === 'ok' ? `<p class="tool__label">Middle assumption, after ${r.years} years, today's dollars</p><p class="tool__number">${escHtml(formatMoney(r.end.middle))}</p><p class="tool__sub">${escHtml(formatMoney(r.end.cautious))} cautious · ${escHtml(formatMoney(r.end.cash))} with no growth · ${escHtml(formatMoney(r.put))} put in</p>` : '';
    const notes = r.notes.length ? `<p class="tool__note">Negative numbers were treated as zero for: ${escHtml(r.notes.join(', '))}.</p>` : '';
    out.innerHTML = `${head}
      <h2 class="tool__headline">${escHtml(r.title)}</h2>
      <p class="tool__meaning">${escHtml(r.meaning)}</p>
      ${r.status === 'ok' ? renderChart(r) + renderTable(r) : ''}
      <p class="tool__action"><a class="btn btn--primary" href="${escHtml(r.action.href)}">${escHtml(r.action.label)}</a></p>
      ${notes}
      <p class="tool__note">Historically, diversified long-term investing has rewarded patience, but outcomes are uncertain and losses can occur. Nothing here promises a return. Educational, not personalised financial advice. Your numbers were not saved or sent anywhere.</p>
      <button type="button" class="tool__clear" data-clear>Clear my numbers</button>`;
    out.focus();
    out.querySelector('[data-clear]').addEventListener('click', () => { form.reset(); out.innerHTML = empty; form.querySelector('input')?.focus(); });
  });
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('compound-growth');
  if (root) {
    fetch('/resources/data/market-history.json').then(r => r.json()).then(history => mountCompound(root, history)).catch(() => {
      const out = root.querySelector('[data-result]');
      if (out) out.innerHTML = '<p class="tool__empty">The historical dataset could not be loaded. Reload the page to try again.</p>';
    });
  }
}
