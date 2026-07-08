// Start Here beginner-series widgets.
// Mounts interactive SVG charts into [data-widget] placeholders.
// Data is synthetic/simplified — shapes echo real history, values are illustrative.

import { linePath, candleGeometry, extent, scale } from './lib/chart-svg.mjs';

const W = 640, H = 280, PAD = 16;

export const SERIES = {
  '1D': {
    label: '1 day',
    note: 'One trading day, half-hour steps. Down 0.1%. Feels like it matters. It doesn\'t.',
    values: [745.7, 745.2, 744.1, 743.5, 744.4, 745.9, 745.1, 743.8, 742.9, 743.6, 744.5, 745.3, 744.9, 744.78],
  },
  '1M': {
    label: '1 month',
    note: 'A month of daily closes. Some scary red days in the middle. Still noise.',
    values: [721, 724, 719, 715, 722, 726, 730, 727, 733, 738, 735, 729, 725, 731, 737, 741, 739, 744, 742, 746, 743, 744.78],
  },
  '1Y': {
    label: '1 year',
    note: 'Twelve months. A real dip, a real recovery. The trend starts to show.',
    values: [640, 655, 671, 662, 648, 668, 684, 701, 693, 712, 728, 741, 744.78],
  },
  '20Y': {
    label: '20 years',
    note: 'Same fund, twenty years — including two brutal crashes you can barely see. Zoom out.',
    values: [127, 132, 90, 102, 114, 114, 130, 168, 187, 186, 205, 245, 240, 300, 340, 430, 380, 455, 540, 620, 744.78],
  },
};

export const CRASHES = {
  years: [1990, 1992, 1994, 1996, 1998, 2000, 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024, 2026],
  values: [330, 435, 459, 740, 1229, 1320, 880, 1212, 1418, 903, 1258, 1426, 2059, 2239, 2507, 3756, 3840, 5882, 7450],
  markers: [
    { year: 2000, label: 'Dot-com bust -49%' },
    { year: 2008, label: 'Financial crisis -57%' },
    { year: 2020, label: 'COVID crash -34%' },
    { year: 2022, label: 'Rate-hike bear -25%' },
  ],
};

export const CANDLES = [
  { o: 738, h: 743, l: 736, c: 741 },
  { o: 741, h: 745, l: 739, c: 744 },
  { o: 744, h: 746, l: 737, c: 739 },
  { o: 739, h: 741, l: 733, c: 735 },
  { o: 735, h: 742, l: 734, c: 741 },
  { o: 741, h: 748, l: 740, c: 747 },
  { o: 747, h: 749, l: 743, c: 745 },
];

export function compoundSeries(monthly, annualRate, years) {
  const out = [0];
  let bal = 0;
  for (let y = 1; y <= years; y++) {
    bal = bal * (1 + annualRate) + monthly * 12;
    out.push(Math.round(bal));
  }
  return out;
}

/* ---------- rendering helpers (browser only) ---------- */

const fmt = n => '$' + Math.round(n).toLocaleString('en-US');

function svgOpen(label) {
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">`;
}

function axes() {
  return `<line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/>` +
         `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/>`;
}

function lineSvg(values, label, extra = '') {
  return svgOpen(label) + axes() +
    `<path d="${linePath(values, W, H, PAD)}" fill="none" stroke="var(--color-accent-primary)" stroke-width="2.5"/>` +
    extra + '</svg>';
}

function makeButtons(container, items, onPick) {
  const wrap = document.createElement('div');
  wrap.className = 'widget__controls';
  items.forEach((item, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'widget__btn' + (i === 0 ? ' is-active' : '');
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.textContent = item;
    b.addEventListener('click', () => {
      wrap.querySelectorAll('.widget__btn').forEach(x => {
        x.classList.remove('is-active');
        x.setAttribute('aria-pressed', 'false');
      });
      b.classList.add('is-active');
      b.setAttribute('aria-pressed', 'true');
      onPick(item, i);
    });
    wrap.appendChild(b);
  });
  container.appendChild(wrap);
  return wrap;
}

/* ---------- widget mounts ---------- */

function mountTimeframe(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = document.createElement('p');
  note.className = 'widget__note';
  note.setAttribute('aria-live', 'polite');
  const draw = key => {
    const s = SERIES[key];
    chart.innerHTML = lineSvg(s.values, `Fund price over ${s.label}`);
    note.textContent = s.note;
  };
  makeButtons(body, Object.keys(SERIES), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('1D');
}

function mountCompound(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = document.createElement('p');
  note.className = 'widget__note';
  note.setAttribute('aria-live', 'polite');
  const draw = label => {
    const years = parseInt(label, 10);
    const invested = compoundSeries(200, 0.08, years);
    const cash = compoundSeries(200, 0, years);
    const [, hi] = extent(invested);
    const path = v => v.map((n, i) =>
      `${i === 0 ? 'M' : 'L'}${scale(i, 0, years, PAD, W - PAD).toFixed(1)},${scale(n, 0, hi, H - PAD, PAD).toFixed(1)}`
    ).join(' ');
    chart.innerHTML = svgOpen(`$200 a month for ${years} years: invested versus cash`) + axes() +
      `<path d="${path(cash)}" fill="none" stroke="var(--color-text-tertiary)" stroke-width="2" stroke-dasharray="4 4"/>` +
      `<path d="${path(invested)}" fill="none" stroke="var(--color-accent-primary)" stroke-width="2.5"/>` +
      '</svg>';
    note.textContent = `$200/month for ${years} years — kept as cash: ${fmt(cash[years])} (just your deposits, growing by $0). Invested at 8%/yr: ${fmt(invested[years])}. Same deposits, different machine.`;
  };
  makeButtons(body, ['10 years', '20 years', '30 years'], draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('10 years');
}

function mountAnatomy(body) {
  body.textContent = '';
  const s = SERIES['1M'].values;
  const [lo, hi] = extent(s);
  const vols = s.map((_, i) => 20 + ((i * 37) % 40)); // deterministic pseudo-volume
  const bars = vols.map((v, i) => {
    const x = scale(i, 0, s.length - 1, PAD, W - PAD);
    return `<rect x="${(x - 4).toFixed(1)}" y="${(H - PAD - v).toFixed(1)}" width="8" height="${v}" fill="var(--color-border)"/>`;
  }).join('');
  const parts = {
    'Price line': { sel: 'g[data-part="price"]', text: 'The line is the price over time — each point is what the fund cost that day. Up and to the right is what you want over years, not days.' },
    'Price axis': { sel: 'g[data-part="yaxis"]', text: 'The vertical axis is price in dollars. Careful: it often does not start at zero, which makes small moves look dramatic.' },
    'Time axis': { sel: 'g[data-part="xaxis"]', text: 'The horizontal axis is time. Always check it first — a scary cliff on a 1-day chart is invisible on a 10-year chart.' },
    'Volume': { sel: 'g[data-part="volume"]', text: 'The bars along the bottom are volume — how many shares changed hands. Tall bars mean busy days, usually around news.' },
  };
  const chart = document.createElement('div');
  chart.innerHTML = svgOpen('Anatomy of a price chart') +
    `<g data-part="yaxis"><line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/><text x="${PAD + 6}" y="${PAD + 12}" font-size="12" fill="var(--color-text-tertiary)">$${Math.round(hi)}</text><text x="${PAD + 6}" y="${H - PAD - 6}" font-size="12" fill="var(--color-text-tertiary)">$${Math.round(lo)}</text></g>` +
    `<g data-part="xaxis"><line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/><text x="${W - PAD - 80}" y="${H - 2}" font-size="12" fill="var(--color-text-tertiary)">time →</text></g>` +
    `<g data-part="volume">${bars}</g>` +
    `<g data-part="price"><path d="${linePath(s, W, H, PAD)}" fill="none" stroke="var(--color-accent-primary)" stroke-width="2.5"/></g>` +
    '</svg>';
  const note = document.createElement('p');
  note.className = 'widget__note';
  note.setAttribute('aria-live', 'polite');
  const onPick = name => {
    chart.querySelectorAll('g[data-part]').forEach(g => (g.style.opacity = '0.25'));
    chart.querySelector(parts[name].sel).style.opacity = '1';
    note.textContent = parts[name].text;
  };
  makeButtons(body, Object.keys(parts), onPick);
  body.appendChild(chart);
  body.appendChild(note);
  onPick(Object.keys(parts)[0]);
}

function mountCrash(body) {
  body.textContent = '';
  const { years, values, markers } = CRASHES;
  const [lo, hi] = extent(values);
  const dots = markers.map(m => {
    const i = years.indexOf(m.year);
    const x = scale(i, 0, years.length - 1, PAD, W - PAD);
    const y = scale(values[i], lo, hi, H - PAD, PAD);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="var(--color-warning)"/>` +
           `<text x="${Math.min(x + 8, W - 150).toFixed(1)}" y="${Math.max(y - 8, 14).toFixed(1)}" font-size="12" fill="var(--color-text-secondary)">${m.year} ${m.label}</text>`;
  }).join('');
  const chart = document.createElement('div');
  chart.innerHTML = lineSvg(values, 'US market since 1990 with major crashes marked', dots);
  const note = document.createElement('p');
  note.className = 'widget__note';
  note.textContent = 'Four brutal crashes. Zoomed out, every one of them is a wiggle on the way up. (Simplified index levels.)';
  body.appendChild(chart);
  body.appendChild(note);
}

function mountCandles(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const readout = document.createElement('p');
  readout.className = 'widget__readout';
  readout.setAttribute('aria-live', 'polite');
  readout.textContent = 'Tap or focus a candle to read it.';
  let mode = 'Candles';
  const draw = () => {
    if (mode === 'Line') {
      chart.innerHTML = lineSvg(CANDLES.map(c => c.c), 'The same week as a simple line of closing prices');
      readout.textContent = 'Same seven days, just the closing prices. This is all a long-term investor needs.';
      return;
    }
    const geo = candleGeometry(CANDLES, W, H, PAD);
    const inner = geo.map((g, i) => {
      const c = CANDLES[i];
      const color = g.up ? 'var(--color-success)' : 'var(--color-error)';
      const desc = `Day ${i + 1}: opened $${c.o}, high $${c.h}, low $${c.l}, closed $${c.c} — ${g.up ? 'an up day (green)' : 'a down day (red)'}`;
      return `<g tabindex="0" role="button" data-idx="${i}" aria-label="${desc}">` +
        `<line x1="${g.xMid.toFixed(1)}" y1="${g.wickY1.toFixed(1)}" x2="${g.xMid.toFixed(1)}" y2="${g.wickY2.toFixed(1)}" stroke="${color}" stroke-width="1.5"/>` +
        `<rect x="${g.x.toFixed(1)}" y="${g.bodyY.toFixed(1)}" width="${g.w.toFixed(1)}" height="${g.bodyH.toFixed(1)}" fill="${color}"/>` +
        '</g>';
    }).join('');
    chart.innerHTML = svgOpen('Seven days of candlesticks; each candle is one day') + axes() + inner + '</svg>';
    chart.querySelectorAll('g[data-idx]').forEach(g => {
      const show = () => (readout.textContent = g.getAttribute('aria-label'));
      g.addEventListener('click', show);
      g.addEventListener('focus', show);
      g.addEventListener('mouseenter', show);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
    });
  };
  makeButtons(body, ['Candles', 'Line'], name => { mode = name; draw(); });
  body.appendChild(chart);
  body.appendChild(readout);
  draw();
}

/* ---------- init ---------- */

const MOUNTS = {
  timeframe: mountTimeframe,
  compound: mountCompound,
  anatomy: mountAnatomy,
  crash: mountCrash,
  candles: mountCandles,
};

if (typeof document !== 'undefined') {
  for (const el of document.querySelectorAll('[data-widget]')) {
    const mount = MOUNTS[el.dataset.widget];
    const body = el.querySelector('.widget__body');
    if (mount && body) mount(body);
  }
}
