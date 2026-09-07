// Emergency Savings Ladder. Essential monthly costs in, a ladder of realistic
// savings rungs out, with the next rung and how long it takes at your pace.
// Pure logic exported for tests; DOM wiring runs only in a browser.
// Nothing entered here is stored or sent anywhere.

import { parseMoney, formatMoney, formatMonths, escHtml } from './lib/money.mjs';

export const RUNGS = [
  { id: 'starter', label: 'Starter cushion', months: 0, fixed: 500, why: 'Turns a small surprise into an inconvenience instead of new debt.' },
  { id: 'one',     label: 'One month of essentials',   months: 1,  why: 'Covers most minor emergencies. The first goal that changes how a bad week feels.' },
  { id: 'three',   label: 'Three months',  months: 3,  why: 'The classic target. Covers most job-loss scenarios and bigger repairs.' },
  { id: 'six',     label: 'Six months',    months: 6,  why: 'For variable income, layoff-prone industries, or a household with dependants.' },
  { id: 'twelve',  label: 'Twelve months', months: 12, why: 'The conservative end: unpredictable income, sole earner, or approaching retirement.' },
];

export function buildLadder(raw = {}) {
  const essentials = parseMoney(raw.essentials);
  const saved = parseMoney(raw.saved);
  const monthly = parseMoney(raw.monthly);
  const notes = [['Essential monthly costs', essentials], ['Current savings', saved], ['Monthly amount', monthly]].filter(([, p]) => p.note === 'negative').map(([l]) => l);
  const e = essentials.value, s = saved.value, m = monthly.value;

  if (e === 0) {
    return { status: 'empty', essentials: e, saved: s, monthly: m, rungs: [], next: null, notes,
      title: 'Start with your essential monthly costs.',
      meaning: 'Rent or mortgage, utilities, insurance, minimum payments, groceries, transport: what it takes to keep the lights on for one month. An estimate is fine.',
      action: { href: '/moneyhub/tools/money-reset.html', label: 'Find that number with the Money Reset' } };
  }

  const rungs = RUNGS.map(r => {
    const target = r.fixed ? Math.min(r.fixed, e) : Math.round(e * r.months);
    const remaining = Math.max(0, target - s);
    const pct = Math.min(100, Math.round((s / target) * 100));
    const monthsAway = remaining === 0 ? 0 : (m > 0 ? remaining / m : null);
    return { ...r, target, remaining, pct, reached: remaining === 0, monthsAway };
  });
  const next = rungs.find(r => !r.reached) || null;
  let title, meaning, action;
  if (!next) {
    title = 'You are past the top rung.';
    meaning = `Your ${formatMoney(s)} covers twelve months of essentials. That is the conservative end of the ladder; anything above it can have a different job, such as investing.`;
    action = { href: '/moneyhub/#checkup', label: 'Check your investing runway' };
  } else {
    const eta = next.monthsAway == null ? '' : ` At ${formatMoney(m)} a month that is about ${formatMonths(next.monthsAway)} away.`;
    title = `Your next rung: ${next.label.toLowerCase()}, ${formatMoney(next.target)}.`;
    meaning = `${formatMoney(next.remaining)} to go.${eta} ${next.why}` + (m === 0 ? ' Add a monthly amount above to see how long each rung takes.' : '');
    action = next.id === 'starter' || next.id === 'one'
      ? { href: '/moneyhub/step3-emergency-fund.html', label: 'Where to keep it and how to automate it' }
      : { href: '/moneyhub/step5-automation.html', label: 'Automate the transfer' };
  }
  return { status: 'ok', essentials: e, saved: s, monthly: m, rungs, next, notes, title, meaning, action };
}

/* ---------- browser wiring ---------- */

export function renderLadder(r) {
  if (r.status === 'empty') return '';
  return `<ol class="ladder" aria-label="Savings rungs">${r.rungs.map(g => `
    <li class="ladder__rung${g.reached ? ' is-reached' : ''}${r.next && g.id === r.next.id ? ' is-next' : ''}">
      <div class="ladder__row"><span class="ladder__label">${escHtml(g.label)}</span><span class="ladder__target">${escHtml(formatMoney(g.target))}</span></div>
      <div class="ladder__bar" role="img" aria-label="${g.pct}% of ${escHtml(formatMoney(g.target))} saved"><span style="width:${g.pct}%"></span></div>
      <div class="ladder__note">${g.reached ? 'Reached' : `${escHtml(formatMoney(g.remaining))} to go${g.monthsAway == null ? '' : ` · about ${escHtml(formatMonths(g.monthsAway))}`}`}</div>
    </li>`).join('')}</ol>`;
}

export function mountLadder(root) {
  const form = root.querySelector('form');
  const out = root.querySelector('[data-result]');
  if (!form || !out) return;
  const empty = out.innerHTML;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const r = buildLadder(Object.fromEntries(new FormData(form)));
    const head = r.next ? `<p class="tool__label">Next rung</p><p class="tool__number">${escHtml(formatMoney(r.next.target))}</p>` : '';
    const notes = r.notes.length ? `<p class="tool__note">Negative numbers were treated as zero for: ${escHtml(r.notes.join(', '))}.</p>` : '';
    out.innerHTML = `${head}
      <h2 class="tool__headline">${escHtml(r.title)}</h2>
      <p class="tool__meaning">${escHtml(r.meaning)}</p>
      ${renderLadder(r)}
      <p class="tool__action"><a class="btn btn--primary" href="${escHtml(r.action.href)}">${escHtml(r.action.label)}</a></p>
      ${notes}
      <p class="tool__note">Educational estimate, not personalised financial advice. Your numbers were not saved or sent anywhere.</p>
      <button type="button" class="tool__clear" data-clear>Clear my numbers</button>`;
    out.focus();
    out.querySelector('[data-clear]').addEventListener('click', () => { form.reset(); out.innerHTML = empty; form.querySelector('input')?.focus(); });
  });
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('savings-ladder');
  if (root) mountLadder(root);
}
