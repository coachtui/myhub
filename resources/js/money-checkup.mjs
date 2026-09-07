// Two-minute investing-runway checkup. Five questions, one recommendation.
// Pure logic is exported for tests; the DOM wiring runs only in a browser.
// Nothing entered here is stored or sent anywhere.

export const QUESTIONS = [
  { id: 'bills', prompt: 'Are your required bills and minimum payments current?', options: [
    ['yes', 'Yes'], ['sometimes', 'Usually, but it gets tight'], ['no', 'No, some are behind'],
  ] },
  { id: 'buffer', prompt: 'How much could you cover from savings today?', options: [
    ['none', 'Less than $250'], ['starter', '$250 to $999'], ['strong', '$1,000 or more, or a month of expenses'],
  ] },
  { id: 'debt', prompt: 'Do you carry credit-card or other high-interest debt?', options: [
    ['no', 'No'], ['manageable', 'Yes, and I have a payoff plan'], ['high', 'Yes, and it is hard to make progress'],
  ] },
  { id: 'match', prompt: 'Does your workplace offer a retirement match?', options: [
    ['using', 'Yes, and I receive the full match'], ['available', 'Yes, but I am not receiving all of it'], ['none', 'No, or I am not sure'],
  ] },
  { id: 'horizon', prompt: 'Could you leave invested money alone for at least five years?', options: [
    ['yes', 'Yes'], ['maybe', 'I am not sure'], ['no', 'No, I may need it sooner'],
  ] },
];

const TOOLS = '/moneyhub/tools/';
const LEARN = { href: '/moneyhub/investing/', label: 'Keep learning about investing' };

// answers: { bills, buffer, debt, match, horizon }. Returns the single most
// useful next move plus a secondary link. Investing always stays reachable.
export function recommend(a = {}) {
  const matchNote = a.match === 'available'
    ? ' Also check what your workplace match requires: it is part of your pay, and a small contribution often captures it.'
    : '';
  if (a.bills !== 'yes') return {
    stage: 'Survive',
    title: 'Make the month reliable first.',
    body: 'Investing can stay on your horizon. Your most useful next move is to see exactly what each paycheck must cover, so a bill never forces you to borrow or sell an investment.' + matchNote,
    primary: { href: TOOLS + 'money-reset.html', label: 'Do the ten-minute Money Reset' },
    secondary: { href: '/moneyhub/start-here/why-invest.html', label: 'Meanwhile: why invest at all?' },
  };
  if (a.buffer === 'none') return {
    stage: 'Stabilize',
    title: 'Build the first layer of breathing room.',
    body: 'A starter cushion keeps an ordinary surprise from turning into new debt or a forced sale. The first milestone is small on purpose.' + matchNote,
    primary: { href: '/moneyhub/step3-emergency-fund.html', label: 'Build your first cash cushion' },
    secondary: { href: '/moneyhub/investing/account-types.html', label: 'Meanwhile: how investing accounts work' },
  };
  if (a.debt === 'high') return {
    stage: 'Stabilize',
    title: 'Make expensive debt compete for your next dollar.',
    body: 'High interest is a certain cost; market returns are uncertain. A written payoff plan usually beats both worry and guesswork. Keep learning about investing while you work it down.' + matchNote,
    primary: { href: '/moneyhub/step2-high-interest-debt.html', label: 'Make a debt payoff plan' },
    secondary: LEARN,
  };
  if (a.horizon === 'no') return {
    stage: 'Stabilize',
    title: 'Give near-term money a safer job.',
    body: 'Money you may need within a few years should not depend on market timing. Separate that goal from money meant for decades, then invest the second kind.' + matchNote,
    primary: { href: '/moneyhub/step3-emergency-fund.html', label: 'Plan the near-term cushion' },
    secondary: { href: '/moneyhub/investing/staying-invested.html', label: 'Why the long horizon matters' },
  };
  if (a.horizon === 'maybe') return {
    stage: 'Grow',
    title: 'You are ready to start small while you learn.',
    body: 'Your foundation is in place. Begin with an amount you would not miss, in a simple diversified fund, and decide the horizon as you go. Consistency matters more than size.' + matchNote,
    primary: { href: '/moneyhub/investing/', label: 'Start investing, step by step' },
    secondary: { href: '/moneyhub/investing/staying-invested.html', label: 'What staying invested looks like' },
  };
  return {
    stage: 'Grow',
    title: 'Your runway is ready. Invest, then automate it.',
    body: (a.match === 'available'
      ? 'Start by capturing your full workplace match, then choose a simple diversified fund and a contribution you can repeat.'
      : 'Choose the right account, a simple diversified fund, and a contribution you can repeat.') + ' Your foundation is what lets you keep going when markets or life get uncomfortable.',
    primary: { href: '/moneyhub/investing/', label: 'Build your investing plan' },
    secondary: { href: '/moneyhub/step5-automation.html', label: 'Automate the habit' },
  };
}

/* ---------- browser wiring ---------- */

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

export function mountCheckup(root, doc = document) {
  const form = root.querySelector('form');
  const stepsEl = root.querySelector('[data-steps]');
  const back = root.querySelector('[data-back]');
  const next = root.querySelector('[data-next]');
  const error = root.querySelector('[data-error]');
  const progress = root.querySelector('[data-progress]');
  const result = root.querySelector('[data-result]');
  if (!form || !stepsEl || !next || !result) return;

  stepsEl.innerHTML = QUESTIONS.map((q, i) => `
    <fieldset class="checkup__step" data-step="${i}"${i ? ' hidden' : ''}>
      <legend class="checkup__question">${esc(q.prompt)}</legend>
      ${q.options.map(([v, label]) => `
      <label class="choice"><input type="radio" name="${q.id}" value="${v}"> <span>${esc(label)}</span></label>`).join('')}
    </fieldset>`).join('');
  const steps = [...stepsEl.querySelectorAll('[data-step]')];
  let current = 0;

  const show = i => {
    current = i;
    steps.forEach((s, k) => { s.hidden = k !== i; });
    if (back) back.hidden = i === 0;
    if (error) error.hidden = true;
    next.textContent = i === steps.length - 1 ? 'See my next move' : 'Next';
    if (progress) progress.textContent = `Question ${i + 1} of ${steps.length}`;
    const first = steps[i].querySelector('input');
    if (first) first.focus();
  };

  const finish = () => {
    const answers = Object.fromEntries(new FormData(form));
    const rec = recommend(answers);
    form.hidden = true;
    result.innerHTML = `
      <p class="tool__stage">Your stage: <b>${esc(rec.stage)}</b></p>
      <h3 class="tool__headline">${esc(rec.title)}</h3>
      <p class="tool__meaning">${esc(rec.body)}</p>
      <p class="tool__action"><a class="btn btn--primary" href="${esc(rec.primary.href)}">${esc(rec.primary.label)}</a></p>
      <p class="tool__secondary"><a href="${esc(rec.secondary.href)}">${esc(rec.secondary.label)} →</a></p>
      <p class="tool__note">Educational, not personalised financial advice. Your answers were not saved or sent anywhere.</p>
      <button type="button" class="tool__clear" data-restart>Start over and clear my answers</button>`;
    result.hidden = false;
    result.focus();
    result.querySelector('[data-restart]').addEventListener('click', () => {
      form.reset(); result.hidden = true; result.innerHTML = ''; form.hidden = false; show(0);
    });
  };

  next.addEventListener('click', () => {
    if (!steps[current].querySelector('input:checked')) {
      if (error) { error.hidden = false; }
      return;
    }
    if (current < steps.length - 1) show(current + 1); else finish();
  });
  if (back) back.addEventListener('click', () => show(Math.max(0, current - 1)));
  form.addEventListener('change', () => { if (error) error.hidden = true; });
  form.addEventListener('submit', e => { e.preventDefault(); next.click(); });
  show(0);
}

if (typeof document !== 'undefined') {
  const root = document.getElementById('checkup');
  if (root) mountCheckup(root);
}
