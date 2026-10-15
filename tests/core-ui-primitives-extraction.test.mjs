import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('shared panel, match-result and runtime-error drawing live in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /function panel\(x,y,w,h\)\{/);
  assert.match(ui, /function shade\(t,l1,l2,c\)\{/);
  assert.match(ui, /function drawError\(\)\{/);
  assert.doesNotMatch(engine, /function panel\(x,y,w,h\)\{/);
  assert.doesNotMatch(engine, /function shade\(t,l1,l2,c\)\{/);
  assert.doesNotMatch(engine, /function drawError\(\)\{/);
});

test('game-end presentation is UI-owned while the runtime exception boundary stays in engine.js', () => {
  assert.match(ui, /if\(mode==='end'\)\{const p=S\.pl;shade\(/);
  assert.doesNotMatch(engine, /if\(mode==='end'\)\{const p=S\.pl;shade\(/);
  assert.match(engine, /let CK_ERR=null;/);
  assert.match(engine, /function frame\(now\)\{requestAnimationFrame\(frame\);try\{frame2\(now\)\}catch\(e\)/);
  assert.match(engine, /if\(mode!=='error'\)\{CK_ERR=\{/);
  assert.match(engine, /try\{drawError\(\)\}catch\(_\)/);
});
