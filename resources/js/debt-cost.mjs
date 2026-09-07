// Debt Cost Visualizer. Balance, interest rate and monthly payment in; how
// long it takes, what the interest costs, and what a little more each month
// changes. Pure logic exported for tests; DOM wiring runs only in a browser.
// Nothing entered here is stored or sent anywhere.

import { parseMoney, parsePercent, formatMoney, formatMonths, escHtml } from './lib/money.mjs';

const MAX_MONTHS = 600;

// Amortise a balance at a monthly payment. Returns months and total interest,
// or { neverPaysOff: true } when the payment does not cover the interest.
export function amortise(balance, aprPercent, payment) {
  const r = aprPercent / 100 / 12;
  if (balance <= 0) return { months: 0, interest: 0, neverPaysOff: false };
  if (payment <= 0) return { months: Infinity, interest: Infinity, neverPaysOff: true };
  if (r === 0) return { months: Math.ceil(balance / payment), interest: 0, neverPaysOff: false };
  if (payment <= balance * r) return { months: Infinity, interest: Infinity, neverPaysOff: true, interestOnly: balance * r };
  let b = balance, months = 0, interest = 0;
  while (b > 0.005 && months < MAX_MONTHS) {
    const i = b * r;
    interest += i;
    b = b + i - payment;
    months++;
  }
  if (b > 0.005) return { months: Infinity, interest: Infinity, neverPaysOff: true };
  return { months, interest: Math.round(interest * 100) / 100, neverPaysOff: false };
}

export function computeDebt(raw = {}) {
  const balance = parseMoney(raw.balance), apr = parsePercent(raw.apr), payment = parseMoney(raw.payment);
  const notes = [];
  if (balance.note === 'negative') notes.push('Balance');
  if (apr.note === 'negative') notes.push('Interest rate');
  if (payment.note === 'negative') notes.push('Monthly payment');
  const B = balance.value, A = apr.value, P = payment.value;

  if (B === 0) return { status: 'empty', notes, title: 'Start with the balance.', meaning: 'The amount you currently owe on this one debt. If you have several, run the tool once for each, starting with the highest interest rate.', action: { href: '/moneyhub/step2-high-interest-debt.html', label: 'How to line up your debts' } };
  if (P === 0) return { status: 'no-payment', notes, balance: B, apr: A, title: 'Add a monthly payment to see the cost.', meaning: 'Use what you actually pay now, or the minimum on your statement. You can compare a higher amount afterwards.', action: { href: '/moneyhub/step2-high-interest-debt.html', label: 'Finding the numbers on a statement' } };

  const base = amortise(B, A, P);
  const monthlyInterest = B * (A / 100 / 12);
  if (base.neverPaysOff) {
    const smallest = Math.ceil(monthlyInterest + Math.max(10, B * 0.01));
    return { status: 'stuck', notes, balance: B, apr: A, payment: P, monthlyInterest,
      title: 'At this payment the balance does not go down.',
      meaning: `Interest alone is about ${formatMoney(monthlyInterest)} a month at ${A}%, so ${formatMoney(P)} never gets ahead of it. That is how the maths works, not a verdict on you. Roughly ${formatMoney(smallest)} a month is the smallest payment that makes real progress; the comparison below shows what each level costs.`,
      scenarios: scenarios(B, A, [smallest, smallest + 50, smallest + 100]),
      action: { href: '/moneyhub/step2-high-interest-debt.html', label: 'Options when the minimum is not enough' } };
  }
  const rows = scenarios(B, A, [P, P + 50, P + 100, P + 250]);
  const expensive = A >= 10;
  return { status: 'ok', notes, balance: B, apr: A, payment: P, monthlyInterest, months: base.months, interest: base.interest, total: B + base.interest, scenarios: rows, expensive,
    title: `${formatMonths(base.months)} to pay off, ${formatMoney(base.interest)} in interest.`,
    meaning: `At ${formatMoney(P)} a month on ${formatMoney(B)} at ${A}%, you pay ${formatMoney(B + base.interest)} in total.` + (rows[1] ? ` Adding $50 a month saves ${formatMoney(base.interest - rows[1].interest)} in interest and finishes ${formatMonths(base.months - rows[1].months)} sooner.` : '') + (expensive ? ' Interest this high is a certain cost, which is why it usually competes well against uncertain investment returns for the next dollar.' : ' At this rate, paying steadily while you build a cushion and invest is a reasonable balance.'),
    action: expensive ? { href: '/moneyhub/step2-high-interest-debt.html', label: 'Make a payoff plan' } : { href: '/moneyhub/tools/savings-ladder.html', label: 'Build your cushion alongside it' } };
}

function scenarios(B, A, payments) {
  return payments.map(p => { const a = amortise(B, A, p); return { payment: p, months: a.months, interest: a.interest, neverPaysOff: a.neverPaysOff }; }).filter(s => !s.neverPaysOff);
}

/* ---------- browser wiring ---------- */

export function renderScenarios(rows) {
  if (!rows || !rows.length) return '';
  const max = Math.max(...rows.map(r => r.interest), 1);
  return `<table class="debt-table"><caption class="sr-only">Interest and time at different monthly payments</caption>
    <thead><tr><th scope="col">Per month</th><th scope="col">Paid off in</th><th scope="col">Total interest</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${escHtml(formatMoney(r.payment))}</td><td>${escHtml(formatMonths(r.months))}</td><td><span class="debt-bar" aria-hidden="true"><span style="width:${Math.round((r.interest / max) * 100)}%"></span></span>${escHtml(formatMoney(r.interest))}</td></tr>`).join('')}</tbody></table>`;
}

export function mountDebt(root) {
  const form = root.querySelector('form');
  const out = root.querySelector('[data-result]');
  if (!form || !out) return;
  const empty = out.innerHTML;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const r = computeDebt(Object.fromEntries(new FormData(form)));
    const head = r.status === 'ok' ? `<p class="tool__label">Total interest at ${escHtml(formatMoney(r.payment))} a month</p><p class="tool__number">${escHtml(formatMoney(r.interest))}</p><p class="tool__sub">${escHtml(formatMonths(r.months))} · ${escHtml(formatMoney(r.total))} paid in total</p>` : '';
    const notes = r.notes.length ? `<p class="tool__note">Negative numbers were treated as zero for: ${escHtml(r.notes.join(', '))}.</p>` : '';
    out.innerHTML = `${head}
      <h2 class="tool__headline">${escHtml(r.title)}</h2>
      <p class="tool__meaning">${escHtml(r.meaning)}</p>
      ${renderScenarios(r.scenarios)}
      <p class="tool__action"><a class="btn btn--primary" href="${escHtml(r.action.href)}">${escHtml(r.action.label)}</a></p>
      ${notes}
      <p class="tool__note">Educational estimate, not personalised financial advice. Assumes a fixed rate and no new charges. Your numbers were not saved or sent anywhere.</p>
      <button type="button" class="tool__clear" data-clear>Clear my numbers</button>`;
    out.focus();
    out.querySelector('[data-clear]').addEventListener('click', () => { form.reset(); out.innerHTML = empty; form.querySelector('input')?.focus(); });
  });
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('debt-cost');
  if (root) mountDebt(root);
}
