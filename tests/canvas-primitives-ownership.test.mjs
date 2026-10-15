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
  assert.match(ui, /tx\(pat===2/);
});

test('shared primitives are declared exactly once across the loaded rendering scripts', () => {
  const sources = [render, ui, engine, minimap];
  for (const [name, owner] of [['tx', ui], ['bar', render], ['dia', render], ['poly', render]]) {
    const declaration = new RegExp('function ' + name + '\\(', 'g');
    const total = sources.reduce((n, source) => n + (source.match(declaration) || []).length, 0);
    assert.equal(total, 1, name + ' should have a single shared declaration');
    assert.equal((owner.match(declaration) || []).length, 1, name + ' must remain with its chosen owner');
  }
});
