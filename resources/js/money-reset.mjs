// Ten-minute Money Reset. Four monthly estimates in, one starting point out.
// Pure logic is exported for tests; the DOM wiring runs only in a browser.
// Nothing entered here is stored or sent anywhere.

// Accepts "1,250", "$1250.50", "", "abc", -5, 1e12. Missing or invalid → 0;
// negatives are clamped to 0 and reported so the result can say so.
export function parseMoney(raw) {
  const str = String(raw ?? '').replace(/[$,\s]/g, '');
  const n = Number(str);
  if (str === '' || !Number.isFinite(n)) return { value: 0, note: 'blank' };
  if (n < 0) return { value: 0, note: 'negative' };
  return { value: Math.round(n * 100) / 100, note: '' };
}

export const FIELDS = [
  { id: 'income',     label: 'Monthly take-home pay',   hint: 'What actually reaches your accounts after tax and deductions' },
  { id: 'required',   label: 'Required',                hint: 'Housing, utilities, insurance, minimum debt payments, groceries, transport' },
  { id: 'worthIt',    label: 'Worth it',                hint: 'Spending you would choose again: the things that make the month good' },
  { id: 'notWorthIt', label: 'Not worth it',            hint: 'Spending you would happily cut, or forgot you were paying for' },
];

const money = n => '$' + Math.round(n).toLocaleString('en-US');

export function computeReset(raw = {}) {
  const parsed = Object.fromEntries(FIELDS.map(f => [f.id, parseMoney(raw[f.id])]));
  const v = Object.fromEntries(FIELDS.map(f => [f.id, parsed[f.id].value]));
  const notes = FIELDS.filter(f => parsed[f.id].note === 'negative').map(f => f.label);
  const afterRequired = v.income - v.required;
  const afterAll = afterRequired - v.worthIt - v.notWorthIt;
  const ratio = v.income > 0 ? v.required / v.income : null;

  let status, title, meaning, action;
  if (v.income === 0) {
    status = 'empty';
    title = 'Start with take-home pay.';
    meaning = 'An estimate is fine. Without an income figure the rest cannot say much.';
    action = { href: '/moneyhub/step1-know-your-money.html', label: 'How to find your real take-home number' };
  } else if (afterRequired < 0) {
    status = 'short';
    title = 'Required costs are larger than income this month.';
    meaning = `Your estimate is short by ${money(-afterRequired)} before any flexible spending. That is a signal about timing and fixed costs, not a judgement about you. The usual moves are checking which required items can change, when they fall due, and whether any minimum payment can be renegotiated.`;
    action = { href: '/moneyhub/step1-know-your-money.html', label: 'Work through the month with Step 1' };
  } else if (afterAll < 0) {
    status = 'overspent';
    title = `Required costs are covered; the rest overshoots by ${money(-afterAll)}.`;
    meaning = `After required costs you have ${money(afterRequired)}. Flexible spending as estimated is ${money(v.worthIt + v.notWorthIt)}, which is more than that. The easiest place to look first is the ${money(v.notWorthIt)} you already marked as not worth it.`;
    action = { href: '/moneyhub/step1-know-your-money.html', label: 'Sort spending into required, worth it, not worth it' };
  } else if (ratio >= 0.9) {
    status = 'thin';
    title = 'The margin is thin, and that is worth knowing.';
    meaning = `About ${money(afterRequired)} remains after required costs and ${money(afterAll)} after everything. Protecting even a small part of that each month starts a cushion; the ${money(v.notWorthIt)} marked not worth it is the first place to find it.`;
    action = { href: '/moneyhub/step3-emergency-fund.html', label: 'Choose a first savings target' };
  } else {
    status = 'room';
    title = 'You have room to assign on purpose.';
    meaning = `About ${money(afterRequired)} remains after required costs and ${money(afterAll)} after everything. It does not all need one job: a cushion, expensive debt, investing, and things worth it can each get a share.`;
    action = { href: '/moneyhub/#checkup', label: 'Check your investing runway' };
  }
  return { ...v, afterRequired, afterAll, ratio, status, title, meaning, action, notes };
}

/* ---------- browser wiring ---------- */

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

export function mountReset(root) {
  const form = root.querySelector('form');
  const out = root.querySelector('[data-result]');
  if (!form || !out) return;
  const empty = out.innerHTML;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const raw = Object.fromEntries(new FormData(form));
    const r = computeReset(raw);
    const headline = r.status === 'empty' ? '' : `
      <p class="tool__label">Left after required costs</p>
      <p class="tool__number">${esc(money(r.afterRequired))}</p>
      <p class="tool__sub">${esc(money(r.afterAll))} after everything · required costs are ${r.ratio == null ? '—' : Math.round(r.ratio * 100) + '%'} of take-home pay</p>`;
    const notes = r.notes.length ? `<p class="tool__note">Negative numbers were treated as zero for: ${esc(r.notes.join(', '))}.</p>` : '';
    out.innerHTML = `${headline}
      <h2 class="tool__headline">${esc(r.title)}</h2>
      <p class="tool__meaning">${esc(r.meaning)}</p>
      <p class="tool__action"><a class="btn btn--primary" href="${esc(r.action.href)}">${esc(r.action.label)}</a></p>
      ${notes}
      <p class="tool__note">Educational estimate, not personalised financial advice. Your numbers were not saved or sent anywhere.</p>
      <button type="button" class="tool__clear" data-clear>Clear my numbers</button>`;
    out.focus();
    out.querySelector('[data-clear]').addEventListener('click', () => {
      form.reset(); out.innerHTML = empty; const first = form.querySelector('input'); if (first) first.focus();
    });
  });
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('money-reset');
  if (root) mountReset(root);
}
