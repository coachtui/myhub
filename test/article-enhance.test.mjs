import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildToc, buildRelated } from '../resources/js/article.mjs';

test('buildToc returns anchors for h2/h3 and marks subs', () => {
  const html = buildToc([{id:'a',text:'What moved',level:2},{id:'b',text:'Detail',level:3}]);
  assert.match(html, /href="#a"[^>]*>What moved/);
  assert.match(html, /class="is-sub"[^>]*href="#b"/);
});

test('buildToc returns empty for <2 headings', () => {
  assert.equal(buildToc([{id:'a',text:'Only',level:2}]), '');
});

test('buildRelated prefers same ticker, excludes current, respects limit', () => {
  const index = [
    { url:'/cur', ticker:'SPY', section:'Gojo', title:'Current' },
    { url:'/a', ticker:'SPY', section:'Gojo', title:'Another SPY' },
    { url:'/b', ticker:'ORCL', section:'Gojo', title:'Oracle' },
  ];
  const html = buildRelated(index, { url:'/cur', ticker:'SPY', section:'Gojo' }, 5);
  assert.match(html, /href="\/a"/);
  assert.doesNotMatch(html, /href="\/cur"/);
  assert.ok(html.indexOf('/a') < html.indexOf('/b'), 'same-ticker first');
});

test('buildRelated escapes titles', () => {
  const html = buildRelated([{url:'/x',ticker:'',section:'Gojo',title:'<b>Hi</b> & "q"'}], {url:'/cur',ticker:'',section:'Gojo'});
  assert.match(html, /&lt;b&gt;Hi&lt;\/b&gt; &amp; &quot;q&quot;/);
});
