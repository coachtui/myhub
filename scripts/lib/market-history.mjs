// Pure computations over Robert Shiller's monthly U.S. stock market series
// (S&P composite price, dividends, CPI). Used by scripts/fetch-market-history.mjs
// to produce resources/data/market-history.json for the compound-growth tool.

// CSV columns (datahub.io/core/s-and-p-500 mirror of Shiller's ie_data):
// Date,SP500,Dividend,Earnings,Consumer Price Index,...
export function parseShillerCsv(text) {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',');
  const col = name => header.findIndex(h => h.trim().toLowerCase() === name);
  const iD = col('date'), iP = col('sp500'), iDiv = col('dividend'), iC = col('consumer price index');
  const rows = [];
  for (const line of lines.slice(1)) {
    const c = line.split(',');
    const row = { date: c[iD].slice(0, 7), price: +c[iP], dividend: +c[iDiv], cpi: +c[iC] };
    if (row.price > 0 && row.dividend > 0 && row.cpi > 0) rows.push(row);
    else break; // the series is complete up to the first row with missing data
  }
  return rows;
}

// Total-return indices (dividends reinvested monthly at the annual rate / 12),
// nominal and inflation-adjusted, both starting at 1.
export function buildSeries(rows) {
  const nominal = [1], real = [1];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1], cur = rows[i];
    const growth = (cur.price + cur.dividend / 12) / prev.price;
    nominal.push(nominal[i - 1] * growth);
    real.push(nominal[i] * rows[0].cpi / cur.cpi);
  }
  return { dates: rows.map(r => r.date), nominal, real };
}

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)))];

// Annualised return for every window of `months`, summarised.
export function rollingStats(index, months) {
  const rs = [];
  for (let i = 0; i + months < index.length; i++) rs.push(Math.pow(index[i + months] / index[i], 12 / months) - 1);
  if (!rs.length) return null;
  const s = [...rs].sort((a, b) => a - b);
  const r4 = x => Math.round(x * 10000) / 10000;
  return {
    count: rs.length,
    min: r4(s[0]), p10: r4(pct(s, 0.1)), median: r4(pct(s, 0.5)), p90: r4(pct(s, 0.9)), max: r4(s[s.length - 1]),
    negativeShare: Math.round((rs.filter(r => r < 0).length / rs.length) * 1000) / 1000,
  };
}

export function annualised(index) {
  const years = (index.length - 1) / 12;
  return Math.round((Math.pow(index[index.length - 1] / index[0], 1 / years) - 1) * 10000) / 10000;
}

// Largest peak-to-trough declines, with months to a new high.
export function drawdowns(dates, index, top = 5) {
  const out = [];
  let peakI = 0, troughI = 0;
  for (let i = 1; i < index.length; i++) {
    if (index[i] >= index[peakI]) {
      if (troughI > peakI) out.push({ peak: dates[peakI], trough: dates[troughI], recovered: dates[i], depth: Math.round((index[troughI] / index[peakI] - 1) * 1000) / 1000, monthsToRecover: i - peakI });
      peakI = i; troughI = i;
    } else if (index[i] < index[troughI]) troughI = i;
  }
  if (troughI > peakI) out.push({ peak: dates[peakI], trough: dates[troughI], recovered: null, depth: Math.round((index[troughI] / index[peakI] - 1) * 1000) / 1000, monthsToRecover: null });
  return out.sort((a, b) => a.depth - b.depth).slice(0, top);
}

// Growth of $1 sampled every January, for the chart.
export function yearlySamples(dates, nominal, real) {
  const years = [], n = [], r = [];
  dates.forEach((d, i) => { if (d.endsWith('-01')) { years.push(+d.slice(0, 4)); n.push(Math.round(nominal[i] * 100) / 100); r.push(Math.round(real[i] * 100) / 100); } });
  return { years, nominal: n, real: r };
}

export function buildMarketHistory(csvText, { retrieved, sourceUrl }) {
  const rows = parseShillerCsv(csvText);
  const { dates, nominal, real } = buildSeries(rows);
  const horizons = {};
  for (const y of [10, 20, 30]) horizons[y] = { months: y * 12, real: rollingStats(real, y * 12), nominal: rollingStats(nominal, y * 12) };
  return {
    source: {
      name: 'Robert J. Shiller, U.S. Stock Markets 1871–Present and CAPE Ratio (monthly S&P composite price, dividends, CPI)',
      url: 'http://www.econ.yale.edu/~shiller/data.htm',
      mirror: sourceUrl,
      retrieved,
      coverage: { from: dates[0], to: dates[dates.length - 1] },
      months: dates.length,
    },
    method: 'Total return with dividends reinvested monthly (annual dividend rate divided by 12). Real (inflation-adjusted) series deflated by the CPI. Rolling windows use every month as a start date. Past returns are not a forecast.',
    fullPeriod: { real: annualised(real), nominal: annualised(nominal) },
    horizons,
    drawdowns: drawdowns(dates, real),
    yearly: yearlySamples(dates, nominal, real),
  };
}
