import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const procedural = readFileSync(new URL('../js/render-procedural-units.js', import.meta.url), 'utf8');

test('world rendering and procedural fallback unit art have distinct owners',()=>{
 assert.ok(html.indexOf('./js/render.js')<html.indexOf('./js/render-procedural-units.js'));
 assert.ok(html.indexOf('./js/render-procedural-units.js')<html.indexOf('./js/ui.js'));
 for(const marker of ['const BG=','const CK_TEX=','function loadCKTexture(','const BP=',
  'function paintBld(','function drawBld(','function paintNode(','function drawNode(',
  'const SPC=','function spr(']){
  assert.ok(render.includes(marker),marker+' remains in world renderer');
  assert.ok(!procedural.includes(marker),marker+' not duplicated into procedural art');
  assert.ok(!engine.includes(marker),marker+' not duplicated in engine');
 }
 for(const marker of ['const MP=','function man(','function mnt(','function sgp(',
  'function shp(','function paintUnit(','const USZ=']){
  assert.ok(procedural.includes(marker),marker+' moved into procedural art');
  assert.ok(!render.includes(marker),marker+' absent from world renderer');
  assert.ok(!engine.includes(marker),marker+' absent from engine');
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
