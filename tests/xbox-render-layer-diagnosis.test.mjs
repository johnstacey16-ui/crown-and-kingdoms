import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const renderSrc=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const uiSrc=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const engineSrc=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
function scene(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+[
  'globalThis.evaluate=code=>eval(code);',
  'globalThis.ASSET={n:0};',
  'globalThis.layerCounts={chunks:0,units:0,buildings:0};',
  'drawChunks=function(){layerCounts.chunks++};',
  'drawUnit=function(){layerCounts.units++};',
  'drawBld=function(){layerCounts.buildings++};',
  'drawNode=function(){};',
 ].join('\n'),sandbox);
 const run=sandbox.evaluate;
 run('start();S.ex.fill(1);S.vs.fill(1);perfHud=1');
 return run;
}
test('terrain-only test skips objects while preserving the live world path',()=>{
 const run=scene();
 run('perfLayerMode=1;drawWorld()');
 const result=JSON.parse(run('JSON.stringify(layerCounts)'));
 assert.equal(result.units,0);assert.equal(result.buildings,0);
 assert.ok(result.chunks>=1,'terrain chunks still render in terrain-only mode');
 assert.equal(run('perfObjectsMs'),0);
 assert.equal(run('perfEffectsMs'),0);
});
test('objects-only test skips canvas terrain chunks while leaving world object loop intact',()=>{
 const run=scene();
 run('perfLayerMode=2;drawWorld()');
 const result=JSON.parse(run('JSON.stringify(layerCounts)'));
 assert.equal(result.chunks,0);
 assert.ok(result.units+result.buildings>0,'soldiers/buildings still draw without terrain');
});
test('normal mode restores terrain and world objects, and test is unsaved',()=>{
 const run=scene();
 run('perfLayerMode=0;drawWorld()');
 const result=JSON.parse(run('JSON.stringify(layerCounts)'));
 assert.ok(result.chunks>0);
 assert.ok(result.units+result.buildings>0);
 assert.match(engineSrc,/if\(mode!=='play'&&mode!=='pause'\)perfLayerMode=0/);
 const settings=engineSrc.match(/function sset\(\)\{[\s\S]{0,450}JSON\.stringify\(\{([\s\S]*?)\}\)\)/);
 assert.ok(settings);assert.ok(!settings[1].includes('perfLayerMode'));
});
test('Xbox menu exposes layer test and displays which graphics are hidden',()=>{
 assert.match(uiSrc,/n:'Render layer diagnosis'/);
 assert.match(uiSrc,/\['Normal','Terrain only','Objects only'\]\[perfLayerMode\]/);
 assert.match(uiSrc,/TEST: TERRAIN ONLY/);
 assert.match(uiSrc,/TEST: OBJECTS ONLY/);
 assert.match(uiSrc,/perfFlatField=0;perfHud=1;perfFps=0/);
 assert.match(renderSrc,/if\(CHK&&perfLayerMode!==2\)drawChunks/);
});
