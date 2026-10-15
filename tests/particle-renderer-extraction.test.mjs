import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');

test('particle drawing belongs to the rendering module and keeps single ownership', () => {
  assert.ok(html.indexOf('./js/render.js') < html.indexOf('./engine.js'));
  assert.match(render, /const PMAX=\[100,260,520\],PT=\[\]/);
  assert.match(render, /function drawP\(\)\{for\(const p of PT\)/);
  assert.doesNotMatch(engine, /function drawP\(\)/);
});

test('particle creation and lifetime updates remain in the engine and draw calls remain active', () => {
  assert.match(engine, /function emit\(k,x,y,n,o\)\{/);
  assert.match(engine, /function updP\(dt\)\{/);
  assert.match(engine, /updP\(dt\)/);
  assert.match(render, /drawP\(\);X\.lineWidth=2;for\(const p of S\.pj\)/);
});
