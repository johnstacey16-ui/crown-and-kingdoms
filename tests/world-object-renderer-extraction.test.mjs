import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const input = readFileSync(new URL('../js/input.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const procedural = readFileSync(new URL('../js/render-procedural-units.js', import.meta.url), 'utf8');
const troops = readFileSync(new URL('../js/render-troops.js', import.meta.url), 'utf8');
const effects = readFileSync(new URL('../js/render-effects.js', import.meta.url), 'utf8');
const resource = readFileSync(new URL('../js/render-resources.js', import.meta.url), 'utf8');
const buildings = readFileSync(new URL('../js/render-buildings.js', import.meta.url), 'utf8');

test('world rendering and procedural fallback unit art have distinct owners',()=>{
 assert.ok(html.indexOf('./js/render.js')<html.indexOf('./js/render-procedural-units.js'));
 assert.ok(html.indexOf('./js/render-procedural-units.js')<html.indexOf('./js/ui.js'));
 for(const marker of ['const SPC=','function spr(']){
  assert.ok(render.includes(marker),marker+' remains in world renderer');
  assert.ok(!procedural.includes(marker),marker+' not duplicated into procedural art');
  assert.ok(!engine.includes(marker),marker+' not duplicated in engine');
 }
 for(const marker of ['const BG=','const CK_TEX=','function loadCKTexture(','const BP=',
  'function paintBld(','function drawBld(']){
  assert.ok(buildings.includes(marker),marker+' belongs to building artwork');
  assert.ok(!render.includes(marker),marker+' not duplicated into world renderer');
  assert.ok(!procedural.includes(marker),marker+' not duplicated in unit fallback');
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
  assert.match(troops, /function drawUnit\(u,selectedUnits(?:,screenPosition)?\)[\s\S]*?paintUnit\(/);
  assert.match(effects, /function emit\(k,x,y,n,o\)\{/);
  assert.match(effects, /function updP\(dt\)\{/);
  assert.doesNotMatch(engine, /function emit\(k,x,y,n,o\)\{/);
  assert.doesNotMatch(engine, /function updP\(dt\)\{/);
  assert.match(input, /function setZoom\(z\)\{/);
  assert.doesNotMatch(engine, /function setZoom\(z\)\{/);
  assert.match(render, /function draw\(dt\)[\s\S]*?drawWorld\(\)/);
  assert.doesNotMatch(engine, /function draw\(dt\)/);
});

test('resource art is an offline-owned, nonduplicated stage of the original painter',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.ok(html.indexOf('./js/render-terrain.js')<html.indexOf('./js/render-resources.js'));
 assert.ok(html.indexOf('./js/render-resources.js')<html.indexOf('./js/render-procedural-units.js'));
 assert.ok(sw.includes("'./js/render-resources.js'"));
 for(const name of ['paintNode','paintedNodeTexture','resourceVisualAmount','paintedResourceFrame',
  'paintedEnvironmentFrame','paintedResourceWidth','drawPaintedRelic','drawNode']){
  assert.ok(resource.includes('function '+name+'('),name+' belongs to resource art');
  assert.ok(!render.includes('function '+name+'('),name+' is not duplicated in world renderer');
 }
 assert.ok(resource.includes('const NODE_TEXTURE_CACHE=new WeakMap()'));
 assert.ok(!render.includes('const NODE_TEXTURE_CACHE='));
 assert.match(render,/function drawWorld\(\)[\s\S]*?drawNode\(/);
});

test('building sprite/age/construction/damage ownership is offline and preserves the world draw order',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.ok(html.indexOf('./js/render-resources.js')<html.indexOf('./js/render-buildings.js'));
 assert.ok(html.indexOf('./js/render-buildings.js')<html.indexOf('./js/render-procedural-units.js'));
 assert.ok(sw.includes("'./js/render-buildings.js'"));
 for(const name of ['buildingVisualAge','buildingVisualConstruction','buildingVisualDamage',
  'drawBuildingAgeDetails','drawBuildingArtwork','drawBuildingDamageEffects','damagedBuildingArtwork']){
  assert.ok(buildings.includes('function '+name+'('),name+' lives with building art');
  assert.ok(!render.includes('function '+name+'('),name+' has a single production owner');
 }
 assert.ok(buildings.includes('const BUILDING_DAMAGE_CACHE='));
 assert.ok(!render.includes('const BUILDING_DAMAGE_CACHE='));
 assert.match(render,/function drawWorld\(\)[\s\S]*?drawBld\(/);
});
