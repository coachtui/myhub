// Account versus investment: a sorting activity. Each card is an account
// (where money is held), an investment (what the money owns), or a ticker
// (a short market identifier for an investment). Pure logic exported for
// tests; DOM wiring runs only in a browser. Nothing is stored or sent.

import { escHtml } from './lib/money.mjs';

export const BUCKETS = {
  account:    { label: 'Account',    hint: 'Where money is held' },
  investment: { label: 'Investment', hint: 'What the money owns' },
  ticker:     { label: 'Ticker',     hint: 'A short identifier for an investment' },
};

export const ITEMS = [
  { id: 'roth-ira', name: 'Roth IRA', answer: 'account', why: 'An individual retirement account (IRA) is a container with tax rules. It can hold cash, funds, or individual stocks; on its own it owns nothing.' },
  { id: '401k', name: '401(k)', answer: 'account', why: 'A workplace retirement account. Your employer sets it up; you choose what to buy inside it.' },
  { id: 'sp500-fund', name: 'S&P 500 index fund', answer: 'investment', why: 'A fund that owns a slice of about 500 large U.S. companies. You can hold it in a 401(k), an IRA, or a regular brokerage account.' },
  { id: 'vti', name: 'VTI', answer: 'ticker', why: 'A ticker: the four-letter shorthand for one total U.S. stock market fund. The fund is the investment; VTI is its label.' },
  { id: 'brokerage', name: 'Brokerage account', answer: 'account', why: 'A regular investing account with no special tax treatment and no contribution limits. Also a container.' },
  { id: 'target-date', name: 'Target-date fund', answer: 'investment', why: 'A single fund that holds a mix of stock and bond funds and shifts that mix as a chosen year approaches.' },
  { id: 'hysa', name: 'High-yield savings account', answer: 'account', why: 'A bank account that pays interest. It holds cash; it does not own companies or bonds.' },
  { id: 'aapl', name: 'AAPL', answer: 'ticker', why: 'The ticker for Apple\'s stock. The stock (a share of Apple) is the investment; AAPL is how a broker\'s screen refers to it.' },
  { id: 'bond-fund', name: 'Bond fund', answer: 'investment', why: 'A fund that owns many loans to governments or companies. Held inside an account of your choosing.' },
  { id: 'qqq', name: 'QQQ', answer: 'ticker', why: 'The ticker for a fund that tracks the Nasdaq-100. The fund is the investment; QQQ is the label a broker\'s screen uses for it.' },
  { id: 'spy', name: 'SPY', answer: 'ticker', why: 'The ticker for one well-known S&P 500 fund. When a market post says "SPY", it means that fund\'s price.' },
  { id: 'single-stock', name: 'A share of one company', answer: 'investment', why: 'Owning a share means owning a small piece of a real business. That is an investment, whichever account it sits in.' },
];

// answers: { [id]: 'account' | 'investment' | 'ticker' }
export function grade(answers = {}) {
  const results = ITEMS.map(item => {
    const chosen = answers[item.id] || '';
    return { ...item, chosen, correct: chosen === item.answer, answered: !!chosen };
  });
  const answered = results.filter(r => r.answered).length;
  const correct = results.filter(r => r.correct).length;
  const missed = results.filter(r => r.answered && !r.correct);
  const byBucket = {};
  for (const b of Object.keys(BUCKETS)) byBucket[b] = missed.filter(r => r.answer === b).length;
  const weakest = Object.entries(byBucket).sort((a, b) => b[1] - a[1])[0];
  let title, meaning;
  if (answered === 0) { title = 'Pick a bucket for each card first.'; meaning = 'There are twelve cards. Guessing is fine: the explanations are the point.'; }
  else if (correct === ITEMS.length) { title = 'All twelve sorted correctly.'; meaning = 'You can tell a container from what it holds from its label. That is most of what trips people up when they open their first account.'; }
  else if (correct >= 9) { title = `${correct} of ${ITEMS.length}. The distinction is mostly clear.`; meaning = weakest[1] ? `The cards you missed were mostly ${BUCKETS[weakest[0]].label.toLowerCase()}s: ${BUCKETS[weakest[0]].hint.toLowerCase()}. Read the explanations below and try once more.` : 'Read the explanations below and try once more.'; }
  else { title = `${correct} of ${ITEMS.length}. Worth one more pass.`; meaning = 'The one idea to hold on to: an account is a container, an investment is what you put in it, and a ticker is the label on the investment. The explanations below say which is which and why.'; }
  return { results, answered, correct, total: ITEMS.length, byBucket, title, meaning };
}

/* ---------- browser wiring ---------- */

export function renderCards() {
  return ITEMS.map(item => `
    <fieldset class="sort-card">
      <legend class="sort-card__name">${escHtml(item.name)}</legend>
      ${Object.entries(BUCKETS).map(([id, b]) => `<label class="choice choice--compact"><input type="radio" name="${item.id}" value="${id}"> <span>${escHtml(b.label)}</span></label>`).join('')}
    </fieldset>`).join('');
}

export function mountSorter(root) {
  const form = root.querySelector('form');
  const cards = root.querySelector('[data-cards]');
  const out = root.querySelector('[data-result]');
  if (!form || !cards || !out) return;
  cards.innerHTML = renderCards();
  const empty = out.innerHTML;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const g = grade(Object.fromEntries(new FormData(form)));
    const rows = g.results.map(r => `<li class="sort-result${r.answered ? (r.correct ? ' is-correct' : ' is-missed') : ''}"><b>${escHtml(r.name)}</b>: ${escHtml(BUCKETS[r.answer].label)}${r.answered && !r.correct ? ` (you chose ${escHtml(BUCKETS[r.chosen].label)})` : ''}. <span>${escHtml(r.why)}</span></li>`).join('');
    out.innerHTML = `
      <p class="tool__label">Score</p><p class="tool__number">${g.correct} / ${g.total}</p>
      <h2 class="tool__headline">${escHtml(g.title)}</h2>
      <p class="tool__meaning">${escHtml(g.meaning)}</p>
      <ol class="sort-results">${rows}</ol>
      <p class="tool__action"><a class="btn btn--primary" href="/moneyhub/investing/account-types.html">Which account, in what order</a> <a class="btn btn--secondary" href="/moneyhub/start-here/tickers-and-indices.html">What tickers mean</a></p>
      <p class="tool__note">Educational activity, not financial advice. Nothing you chose was saved or sent anywhere.</p>
      <button type="button" class="tool__clear" data-clear>Try again</button>`;
    out.focus();
    out.querySelector('[data-clear]').addEventListener('click', () => { form.reset(); out.innerHTML = empty; form.querySelector('input')?.focus(); });
  });
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('account-vs-investment');
  if (root) mountSorter(root);
}
