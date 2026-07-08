// Investing-guide widgets: order-ticket, ops-stepper, roth-toggle,
// allocation, paycheck-flow, best-days.
// Static illustrative data only. Coexists with start-here.mjs: each module's
// mount loop claims only its own data-widget names.

import { extent, scale } from './lib/chart-svg.mjs';
import { W, H, PAD, svgOpen, axes, makeButtons } from './lib/widget-ui.mjs';

/* ---------- datasets (exported for tests) ---------- */

export const ALLOCATIONS = {
  '1 fund': [
    { label: 'Target-date fund — the whole plan in one ticket', pct: 100, color: 'var(--color-accent-primary)' },
  ],
  '2 funds': [
    { label: 'World stocks — the engine', pct: 90, color: 'var(--color-accent-primary)' },
    { label: 'Bonds — the shock absorber', pct: 10, color: 'var(--color-info)' },
  ],
  '3 funds': [
    { label: 'US stocks — the engine', pct: 60, color: 'var(--color-accent-primary)' },
    { label: 'International stocks — the diversifier', pct: 30, color: 'var(--color-info)' },
    { label: 'Bonds — the shock absorber', pct: 10, color: 'var(--color-success)' },
  ],
};

// Growth of $10,000 over ~30 years, sampled every 2 years. Shapes echo the
// well-documented "miss the best days" studies; values are illustrative.
export const BEST_DAYS = {
  full:   [10, 13, 17, 23, 20, 26, 34, 30, 22, 30, 41, 55, 72, 95, 128, 172, 224],
  miss10: [10, 12, 14, 18, 15, 19, 24, 21, 15, 19, 25, 32, 41, 52, 66, 83, 102],
  miss20: [10, 11, 12, 15, 12, 15, 18, 15, 11, 13, 17, 21, 26, 32, 40, 49, 61],
};

export const OPS_STEPS = [
  { title: '1. Grab the 401(k) match', why: 'If your employer matches contributions, that is an instant 50–100% return. Nothing else in investing comes close. Contribute at least enough to get every matching dollar.' },
  { title: '2. Max the Roth IRA', why: 'Up to $7,500 a year (2026). You fund it with taxed money, then it grows and comes out tax-free — and you can withdraw your contributions in a pinch without penalty.' },
  { title: '3. Back to the 401(k)', why: 'Still have room in the budget? Raise your 401(k) contribution toward its $24,500 limit (2026). Tax-advantaged space is use-it-or-lose-it each year.' },
  { title: '4. Taxable brokerage', why: 'Everything above the limits goes here. No caps, no age rules, full flexibility — you just pay taxes as you go. Great for goals before retirement age.' },
];

export const TICKET_PARTS = {
  'Ticker': { text: 'The fund you are buying, by its nickname — for a starter index fund that might be VTI or VT. Type it exactly; the screen will show the full fund name so you can double-check.' },
  'Amount': { text: 'Most brokerages let you enter dollars instead of shares. Dollars is easier: $100 buys $100 worth, including a fraction of a share if needed.' },
  'Order type': { text: 'Market means buy now at the going price — that is all a long-term investor needs. Limit means only buy at or below a price I set. Skip it; you are not day trading.' },
  'Review': { text: 'One last look: right ticker, right amount, right account. Then submit. Congratulations — you own a slice of thousands of companies.' },
};

export const FLOW_ROUTES = {
  'Paycheck → 401(k)': { text: 'Set once in your employer payroll portal: a percentage comes out of every paycheck before it touches your bank, and buys your chosen fund automatically. The money you never see is the easiest money to invest.' },
  'Bank → IRA': { text: 'A recurring transfer at your brokerage: for example $300 on the 5th of every month, checking → Roth IRA. Schedule it a few days after payday so it never bounces.' },
  'Cash → funds': { text: 'The step people forget: cash sitting at the brokerage is not invested. Set an automatic investment so every transfer buys your fund the next day. Transfer on the 5th, invest on the 6th.' },
};

export const ROTH_MODES = {
  'Roth': { taxOn: 'work', text: 'Roth: you pay tax on the money now, while you are working. Decades of growth and every withdrawal in retirement are tax-free. Best when your tax rate is modest today.' },
  'Traditional': { taxOn: 'retire', text: 'Traditional: contributions skip tax now, lowering this year’s bill. You pay income tax when you withdraw in retirement. Best when your tax rate is high today.' },
};

/* ---------- pure helpers (exported for tests) ---------- */

export function donutSegments(slices) {
  const total = slices.reduce((s, x) => s + x.pct, 0);
  let cum = 0;
  return slices.map(s => {
    const frac = s.pct / total;
    const seg = { frac, offset: cum };
    cum += frac;
    return seg;
  });
}

/* ---------- mounts (browser only) ---------- */

const fmt = n => '$' + Math.round(n * 1000).toLocaleString('en-US');

function noteEl() {
  const p = document.createElement('p');
  p.className = 'widget__note';
  p.setAttribute('aria-live', 'polite');
  return p;
}

function mountAllocation(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const R = 90, CX = W / 2, CY = H / 2, CIRC = 2 * Math.PI * R;
  const draw = name => {
    const slices = ALLOCATIONS[name];
    const segs = donutSegments(slices);
    const rings = segs.map((g, i) =>
      `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${slices[i].color}" stroke-width="42" ` +
      `stroke-dasharray="${(g.frac * CIRC).toFixed(1)} ${(CIRC - g.frac * CIRC).toFixed(1)}" ` +
      `stroke-dashoffset="${(-g.offset * CIRC + CIRC / 4).toFixed(1)}"/>`
    ).join('');
    const legend = slices.map((s, i) =>
      `<rect x="${W - 250}" y="${30 + i * 26 - 11}" width="12" height="12" fill="${s.color}"/>` +
      `<text x="${W - 232}" y="${30 + i * 26}" font-size="13" fill="var(--color-text-secondary)">${s.pct}% ${s.label}</text>`
    ).join('');
    chart.innerHTML = svgOpen(`${name} portfolio allocation`) +
      `<g transform="translate(-120,0)">${rings}</g>` + legend + '</svg>';
    note.textContent = name === '1 fund'
      ? 'One target-date fund. It rebalances itself and gets more conservative as you age. Genuinely fine forever.'
      : name === '2 funds'
        ? 'One world stock fund plus a bond fund. Global diversification with two tickets.'
        : 'The classic three-fund portfolio. A common starting mix for someone in their 30s; shift toward bonds as you age.';
  };
  makeButtons(body, Object.keys(ALLOCATIONS), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('1 fund');
}

function mountBestDays(body) {
  body.textContent = '';
  const { full, miss10, miss20 } = BEST_DAYS;
  const [, hi] = extent(full);
  const path = v => v.map((n, i) =>
    `${i === 0 ? 'M' : 'L'}${scale(i, 0, v.length - 1, PAD, W - PAD).toFixed(1)},${scale(n, 0, hi, H - PAD, PAD).toFixed(1)}`
  ).join(' ');
  const legend = [
    ['Fully invested', 'var(--color-accent-primary)', full],
    ['Missed the 10 best days', 'var(--color-info)', miss10],
    ['Missed the 20 best days', 'var(--color-warning)', miss20],
  ].map(([label, color, v], i) =>
    `<rect x="${PAD + 12}" y="${24 + i * 22 - 10}" width="12" height="4" fill="${color}"/>` +
    `<text x="${PAD + 32}" y="${24 + i * 22}" font-size="13" fill="var(--color-text-secondary)">${label} — ${fmt(v[v.length - 1] / 1)}</text>`
  ).join('');
  const chart = document.createElement('div');
  chart.innerHTML = svgOpen('Growth of $10,000 over 30 years: fully invested versus missing the best days') + axes() +
    `<path d="${path(miss20)}" fill="none" stroke="var(--color-warning)" stroke-width="2" stroke-dasharray="4 4"/>` +
    `<path d="${path(miss10)}" fill="none" stroke="var(--color-info)" stroke-width="2" stroke-dasharray="4 4"/>` +
    `<path d="${path(full)}" fill="none" stroke="var(--color-accent-primary)" stroke-width="2.5"/>` +
    legend + '</svg>';
  const note = noteEl();
  note.textContent = 'The catch: the best days cluster right next to the worst ones. Sell during a crash and you are almost guaranteed to miss them. (Illustrative values echoing published studies.)';
  body.appendChild(chart);
  body.appendChild(note);
}

function mountOpsStepper(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const labels = ['Match', 'Roth IRA', '401(k)', 'Taxable'];
  const draw = (_, idx) => {
    const boxes = labels.map((l, i) => {
      const x = PAD + 10 + i * 152;
      const active = i === idx;
      return `<rect x="${x}" y="105" width="130" height="70" rx="10" fill="${active ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)'}" stroke="var(--color-border-strong)"/>` +
        `<text x="${x + 65}" y="133" text-anchor="middle" font-size="14" font-weight="600" fill="${active ? 'var(--color-bg-primary)' : 'var(--color-text-primary)'}">${i + 1}. ${l}</text>` +
        `<text x="${x + 65}" y="155" text-anchor="middle" font-size="11" fill="${active ? 'var(--color-bg-primary)' : 'var(--color-text-tertiary)'}">${['free money', 'tax-free growth', 'more shelter', 'no limits'][i]}</text>` +
        (i < 3 ? `<text x="${x + 141}" y="145" font-size="16" fill="var(--color-text-tertiary)">→</text>` : '');
    }).join('');
    chart.innerHTML = svgOpen('Order of operations: match, Roth IRA, 401(k), taxable') + boxes + '</svg>';
    note.textContent = OPS_STEPS[idx].why;
  };
  makeButtons(body, OPS_STEPS.map(s => s.title), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw(null, 0);
}

function mountRothToggle(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const draw = name => {
    const m = ROTH_MODES[name];
    const phase = (x, label, taxed) =>
      `<rect x="${x}" y="100" width="250" height="80" rx="10" fill="var(--color-bg-secondary)" stroke="var(--color-border-strong)"/>` +
      `<text x="${x + 125}" y="132" text-anchor="middle" font-size="15" font-weight="600" fill="var(--color-text-primary)">${label}</text>` +
      (taxed
        ? `<rect x="${x + 75}" y="145" width="100" height="24" rx="12" fill="var(--color-warning)"/>` +
          `<text x="${x + 125}" y="161" text-anchor="middle" font-size="12" font-weight="600" fill="var(--color-bg-primary)">TAX HERE</text>`
        : `<text x="${x + 125}" y="161" text-anchor="middle" font-size="12" fill="var(--color-success)">tax-free</text>`);
    chart.innerHTML = svgOpen(`${name}: when the tax bite lands`) +
      phase(50, 'Working years', m.taxOn === 'work') +
      `<text x="${W / 2}" y="145" text-anchor="middle" font-size="18" fill="var(--color-text-tertiary)">→</text>` +
      phase(340, 'Retirement', m.taxOn === 'retire') + '</svg>';
    note.textContent = m.text;
  };
  makeButtons(body, Object.keys(ROTH_MODES), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('Roth');
}

function mountOrderTicket(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const rows = [
    ['Ticker', 'VTI — Vanguard Total Stock Market ETF'],
    ['Amount', '$100.00  (dollars)'],
    ['Order type', 'Market'],
    ['Review', 'Review order →'],
  ];
  const draw = name => {
    const inner = rows.map(([key, val], i) => {
      const y = 40 + i * 52;
      const active = key === name;
      return `<g data-row="${key}" opacity="${active ? 1 : 0.45}">` +
        `<rect x="${PAD + 40}" y="${y}" width="${W - PAD * 2 - 80}" height="42" rx="8" fill="${key === 'Review' ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)'}" stroke="${active ? 'var(--color-accent-primary)' : 'var(--color-border-strong)'}" stroke-width="${active ? 2.5 : 1}"/>` +
        (key === 'Review'
          ? `<text x="${W / 2}" y="${y + 27}" text-anchor="middle" font-size="14" font-weight="600" fill="var(--color-bg-primary)">${val}</text>`
          : `<text x="${PAD + 56}" y="${y + 27}" font-size="13" fill="var(--color-text-tertiary)">${key}:</text>` +
            `<text x="${PAD + 150}" y="${y + 27}" font-size="14" font-weight="600" fill="var(--color-text-primary)">${val}</text>`) +
        '</g>';
    }).join('');
    chart.innerHTML = svgOpen('A typical buy screen at a brokerage') + inner + '</svg>';
    note.textContent = TICKET_PARTS[name].text;
  };
  makeButtons(body, Object.keys(TICKET_PARTS), draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw('Ticker');
}

function mountPaycheckFlow(body) {
  body.textContent = '';
  const chart = document.createElement('div');
  const note = noteEl();
  const routes = Object.keys(FLOW_ROUTES);
  const targets = [['401(k)', 90], ['Roth IRA', 270], ['Taxable', 450]];
  const draw = (_, idx) => {
    const src = `<rect x="${W / 2 - 70}" y="24" width="140" height="44" rx="10" fill="var(--color-accent-primary)"/>` +
      `<text x="${W / 2}" y="51" text-anchor="middle" font-size="14" font-weight="600" fill="var(--color-bg-primary)">Paycheck</text>`;
    const nodes = targets.map(([label, x], i) => {
      const active = i === idx || (idx === 2 && i === 1);
      return `<g opacity="${i === idx ? 1 : 0.5}">` +
        `<path d="M${W / 2},68 C${W / 2},110 ${x + 50},130 ${x + 50},168" fill="none" stroke="${i === idx ? 'var(--color-accent-primary)' : 'var(--color-border-strong)'}" stroke-width="${i === idx ? 3 : 1.5}"/>` +
        `<rect x="${x}" y="170" width="100" height="44" rx="10" fill="var(--color-bg-secondary)" stroke="${active ? 'var(--color-accent-primary)' : 'var(--color-border-strong)'}"/>` +
        `<text x="${x + 50}" y="197" text-anchor="middle" font-size="13" font-weight="600" fill="var(--color-text-primary)">${label}</text>` +
        '</g>';
    }).join('');
    const cashNote = idx === 2
      ? `<text x="${W / 2}" y="248" text-anchor="middle" font-size="12" fill="var(--color-text-tertiary)">…and inside each account, cash auto-buys your fund the next day</text>`
      : '';
    chart.innerHTML = svgOpen('Money routing itself from paycheck to investments') + src + nodes + cashNote + '</svg>';
    note.textContent = FLOW_ROUTES[routes[idx]].text;
  };
  makeButtons(body, routes, draw);
  body.appendChild(chart);
  body.appendChild(note);
  draw(null, 0);
}

/* ---------- init ---------- */

const MOUNTS = {
  'order-ticket': mountOrderTicket,
  'ops-stepper': mountOpsStepper,
  'roth-toggle': mountRothToggle,
  'allocation': mountAllocation,
  'paycheck-flow': mountPaycheckFlow,
  'best-days': mountBestDays,
};

if (typeof document !== 'undefined') {
  for (const el of document.querySelectorAll('[data-widget]')) {
    const mount = MOUNTS[el.dataset.widget];
    const body = el.querySelector('.widget__body');
    if (mount && body) mount(body);
  }
}
