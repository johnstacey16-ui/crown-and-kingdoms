import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const minimap = readFileSync(new URL('../js/minimap.js', import.meta.url), 'utf8');

test('canvas primitives have a single stable owner outside engine.js', () => {
  assert.ok(html.indexOf('./js/render.js') < html.indexOf('./js/ui.js'));
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /function tx\(s,x,y,sz=20,c='#fff',al='left'\)\{/);
  for (const marker of ['function bar(x,y,w,f,c){','function dia(cx,cy,hw,hh){','function poly(a){']) {
    assert.ok(render.includes(marker), marker+' must live in js/render.js');
    assert.ok(!engine.includes(marker), marker+' must not be duplicated in engine.js');
  }
  assert.doesNotMatch(engine, /function tx\(/);
});

test('renderer, UI and minimap can still resolve shared primitives', () => {
  assert.match(render, /poly\(/);
  assert.match(ui, /poly\(/);
  assert.match(minimap, /dia\(/);
  assert.match(engine, /tx\(pat===2/);
});
