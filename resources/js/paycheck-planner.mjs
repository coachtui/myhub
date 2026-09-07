// Paycheck Planner. One paycheck, its frequency and your monthly required
// costs in; what each paycheck has to set aside, what is left, and how to
// handle the months with an extra paycheck. Pure logic exported for tests;
// DOM wiring runs only in a browser. Nothing entered is stored or sent.

import { parseMoney, formatMoney, escHtml } from './lib/money.mjs';

export const FREQUENCIES = {
  weekly:      { label: 'Every week',          perYear: 52, extraMonths: 4, usual: 4 },
  biweekly:    { label: 'Every two weeks',     perYear: 26, extraMonths: 2, usual: 2 },
  semimonthly: { label: 'Twice a month',       perYear: 24, extraMonths: 0, usual: 2 },
  monthly:     { label: 'Once a month',        perYear: 12, extraMonths: 0, usual: 1 },
};

export function planPaycheck(raw = {}) {
  const pay = parseMoney(raw.pay), required = parseMoney(raw.required), savings = parseMoney(raw.savings);
  const freq = FREQUENCIES[raw.frequency] ? raw.frequency : 'biweekly';
  const f = FREQUENCIES[freq];
  const notes = [['Paycheck amount', pay], ['Monthly required costs', required], ['Monthly savings goal', savings]].filter(([, p]) => p.note === 'negative').map(([l]) => l);
  const P = pay.value, R = required.value, S = savings.value;
  if (P === 0) return { status: 'empty', notes, title: 'Start with one paycheck.', meaning: 'The take-home amount that lands in your account on a normal payday, after tax and deductions. An estimate is fine.', action: { href: '/moneyhub/step1-know-your-money.html', label: 'Where to find your real take-home number' } };

  const perMonth = f.perYear / 12;                 // average paychecks per month
  const monthlyIncome = P * perMonth;
  // Budget on the usual number of paychecks so the extra ones are genuinely extra.
  const budgetChecks = f.usual;
  const requiredPer = R / budgetChecks;
  const savingsPer = S / budgetChecks;
  const left = P - requiredPer - savingsPer;
  const leftPct = left / P;
  const extraPer = P; // an extra paycheck is a whole free paycheck
  let status, title, meaning, action;
  if (requiredPer > P) {
    status = 'short';
    title = `Required costs need ${formatMoney(requiredPer)} from a ${formatMoney(P)} paycheck.`;
    meaning = `Spread over ${budgetChecks} paycheck${budgetChecks === 1 ? '' : 's'} a month, required costs are larger than each paycheck. That is a timing and fixed-cost problem, not a character one. The usual moves are lining up due dates with paydays, asking whether any required item can change, and, if you are paid weekly or every two weeks, using the extra-paycheck months to get ahead.` + (f.extraMonths ? ` You get ${f.extraMonths} such month${f.extraMonths === 1 ? '' : 's'} a year, each worth a full ${formatMoney(P)}.` : '');
    action = { href: '/moneyhub/tools/money-reset.html', label: 'Sort the month with the Money Reset' };
  } else if (left < 0) {
    status = 'overcommitted';
    title = `Required costs fit; the savings goal pushes it ${formatMoney(-left)} over per paycheck.`;
    meaning = `After ${formatMoney(requiredPer)} for required costs, ${formatMoney(P - requiredPer)} remains per paycheck, and the savings goal asks for ${formatMoney(savingsPer)}. Lower the goal to what fits, or route the extra-paycheck months to savings instead.`;
    action = { href: '/moneyhub/tools/savings-ladder.html', label: 'Pick a savings target that fits' };
  } else if (leftPct < 0.1) {
    status = 'thin';
    title = `Each paycheck: ${formatMoney(requiredPer)} for required costs, ${formatMoney(savingsPer)} to savings, ${formatMoney(left)} left.`;
    meaning = `That leaves about ${Math.round(leftPct * 100)}% of each paycheck for everything else, which is thin. Moving the required share to a separate bills account on payday keeps it from being spent twice.` + (f.extraMonths ? ` The ${f.extraMonths} extra-paycheck month${f.extraMonths === 1 ? '' : 's'} a year are your breathing room: ${formatMoney(extraPer)} each with nothing already assigned to it.` : '');
    action = { href: '/moneyhub/step5-automation.html', label: 'Set the payday transfers up once' };
  } else {
    status = 'room';
    title = `Each paycheck: ${formatMoney(requiredPer)} for required costs, ${formatMoney(savingsPer)} to savings, ${formatMoney(left)} left.`;
    meaning = `About ${Math.round(leftPct * 100)}% of each paycheck is yours to assign after required costs and savings. Move the required share to a bills account on payday and let the rest be spent without guilt.` + (f.extraMonths ? ` The ${f.extraMonths} extra-paycheck month${f.extraMonths === 1 ? '' : 's'} a year add a full ${formatMoney(extraPer)} each: a cushion, expensive debt, or investing can each take one.` : '');
    action = { href: '/moneyhub/step5-automation.html', label: 'Automate the payday split' };
  }
  return { status, notes, frequency: freq, pay: P, required: R, savings: S, perMonth, monthlyIncome, budgetChecks, requiredPer, savingsPer, left, leftPct, extraMonths: f.extraMonths, extraPer, title, meaning, action };
}

/* ---------- browser wiring ---------- */

export function renderSplit(r) {
  if (r.status === 'empty') return '';
  const rows = [['Required costs', r.requiredPer], ['Savings', r.savingsPer], ['Left for everything else', Math.max(0, r.left)]];
  const total = r.pay || 1;
  return `<ul class="split" aria-label="How one paycheck divides">${rows.map(([label, v]) => `<li class="split__row"><span class="split__label">${escHtml(label)}</span><span class="split__bar" aria-hidden="true"><span style="width:${Math.min(100, Math.round((v / total) * 100))}%"></span></span><span class="split__value">${escHtml(formatMoney(v))}</span></li>`).join('')}</ul>
  <p class="tool__sub">${escHtml(formatMoney(r.pay))} per paycheck · ${escHtml(FREQUENCIES[r.frequency].label.toLowerCase())} · about ${escHtml(formatMoney(r.monthlyIncome))} a month on average</p>`;
}

export function mountPlanner(root) {
  const form = root.querySelector('form');
  const out = root.querySelector('[data-result]');
  if (!form || !out) return;
  const empty = out.innerHTML;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const r = planPaycheck(Object.fromEntries(new FormData(form)));
    const head = r.status !== 'empty' ? `<p class="tool__label">Set aside from each paycheck for required costs</p><p class="tool__number">${escHtml(formatMoney(r.requiredPer))}</p>` : '';
    const notes = r.notes.length ? `<p class="tool__note">Negative numbers were treated as zero for: ${escHtml(r.notes.join(', '))}.</p>` : '';
    out.innerHTML = `${head}
      <h2 class="tool__headline">${escHtml(r.title)}</h2>
      <p class="tool__meaning">${escHtml(r.meaning)}</p>
      ${renderSplit(r)}
      <p class="tool__action"><a class="btn btn--primary" href="${escHtml(r.action.href)}">${escHtml(r.action.label)}</a></p>
      ${notes}
      <p class="tool__note">Educational estimate, not personalised financial advice. Your numbers were not saved or sent anywhere.</p>
      <button type="button" class="tool__clear" data-clear>Clear my numbers</button>`;
    out.focus();
    out.querySelector('[data-clear]').addEventListener('click', () => { form.reset(); out.innerHTML = empty; form.querySelector('input')?.focus(); });
  });
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('paycheck-planner');
  if (root) mountPlanner(root);
}
