import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');

test('building, node and unit artwork is owned by js/render.js', () => {
  assert.ok(html.indexOf('./js/render.js') < html.indexOf('./engine.js'));
  for (const marker of [
    'const BG=', 'const CK_TEX=', 'function loadCKTexture(', 'const BP=',
    'function paintBld(', 'function drawBld(', 'function paintNode(',
    'function drawNode(', 'const SPC=', 'function spr(', 'const MP=',
    'function man(', 'function mnt(', 'function sgp(', 'function shp(',
    'function paintUnit(', 'const USZ='
  ]) {
    assert.ok(render.includes(marker), marker+' must exist in the renderer');
    assert.ok(!engine.includes(marker), marker+' must not be duplicated in engine.js');
  }
});

test('world rendering still invokes extracted object painters while simulation remains in engine.js', () => {
  assert.match(render, /function drawWorld\(\)[\s\S]*?drawBld\(/);
  assert.match(render, /function drawWorld\(\)[\s\S]*?drawNode\(/);
  assert.match(render, /function drawUnit\(u,selectedUnits\)[\s\S]*?paintUnit\(/);
  assert.match(engine, /function emit\(k,x,y,n,o\)\{/);
  assert.match(engine, /function updP\(dt\)\{/);
  assert.match(engine, /function setZoom\(z\)\{/);
  assert.match(engine, /drawWorld\(\)/);
});
