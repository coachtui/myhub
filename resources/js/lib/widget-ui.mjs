// Shared widget UI scaffolding for start-here.mjs and invest-widgets.mjs.
// DOM helpers live here; importing under Node is safe (no top-level DOM access).

export const W = 640, H = 280, PAD = 16;

export function svgOpen(label) {
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">`;
}

export function axes() {
  return `<line x1="${PAD}" y1="${H - PAD}" x2="${W - PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/>` +
         `<line x1="${PAD}" y1="${PAD}" x2="${PAD}" y2="${H - PAD}" stroke="var(--color-border-strong)" stroke-width="1"/>`;
}

export function makeButtons(container, items, onPick) {
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
