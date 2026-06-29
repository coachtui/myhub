import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SITE } from '../resources/js/site-config.mjs';

test('site config exposes nav, bio, social', () => {
  assert.equal(SITE.bio, 'Builder, investor, construction professional.');
  assert.deepEqual(SITE.nav.map(n => n.label), ['Wealth', 'Health', 'Gojo', 'About']);
  assert.ok(SITE.social.length >= 3);
});
