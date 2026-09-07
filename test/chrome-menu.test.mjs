import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wireMenu } from '../resources/js/chrome.mjs';

// Minimal element stub: enough DOM for wireMenu's contract (classList,
// attributes, textContent, listeners, focus, containment).
function el(attrs = {}) {
  const listeners = {};
  const classes = new Set();
  const node = {
    attrs: { ...attrs }, textContent: '', focused: false, children: [],
    classList: {
      contains: c => classes.has(c),
      toggle: (c, force) => { if (force) classes.add(c); else classes.delete(c); },
    },
    setAttribute: (k, v) => { node.attrs[k] = v; },
    getAttribute: k => node.attrs[k],
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
    fire: (type, event = {}) => { for (const fn of listeners[type] || []) fn(event); },
    focus: () => { node.focused = true; },
    contains: other => node === other || node.children.includes(other),
  };
  return node;
}

function setup() {
  const button = el({ 'data-menu-toggle': '', 'aria-expanded': 'false' });
  button.textContent = 'Menu';
  const nav = el({ id: 'chrome-nav' });
  const header = el();
  header.children = [button, nav];
  header.querySelector = sel => (sel === '[data-menu-toggle]' ? button : sel === '#chrome-nav' ? nav : null);
  const doc = el();
  wireMenu(header, doc);
  return { button, nav, header, doc };
}

test('menu toggle opens and closes the nav and mirrors aria-expanded', () => {
  const { button, nav } = setup();
  button.fire('click');
  assert.equal(nav.classList.contains('is-open'), true);
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(button.textContent, 'Close');
  button.fire('click');
  assert.equal(nav.classList.contains('is-open'), false);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(button.textContent, 'Menu');
});

test('Escape closes an open menu and returns focus to the toggle', () => {
  const { button, nav, doc } = setup();
  button.fire('click');
  doc.fire('keydown', { key: 'Escape' });
  assert.equal(nav.classList.contains('is-open'), false);
  assert.equal(button.focused, true);
});

test('a click outside the header closes the menu; a click inside does not', () => {
  const { button, nav, doc } = setup();
  button.fire('click');
  doc.fire('click', { target: nav });
  assert.equal(nav.classList.contains('is-open'), true);
  doc.fire('click', { target: el() });
  assert.equal(nav.classList.contains('is-open'), false);
});

test('choosing a nav link closes the menu', () => {
  const { button, nav } = setup();
  button.fire('click');
  nav.fire('click', { target: { closest: sel => (sel === 'a' ? {} : null) } });
  assert.equal(nav.classList.contains('is-open'), false);
});

test('wireMenu is a no-op on a header without the toggle', () => {
  const header = el();
  header.querySelector = () => null;
  assert.doesNotThrow(() => wireMenu(header, el()));
});
