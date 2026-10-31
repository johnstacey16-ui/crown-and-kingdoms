import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const engine=source('engine.js'),benchmark=source('js/engine-graphics-benchmark.js');
const browser=browserScriptPaths(source('index.html'));
const core=coreGameScriptPaths(source('index.html'));
const sw=source('sw.js');

test('Xbox graphics benchmark functions have one owner, without changing their bodies',()=>{
 for(const fn of ['setupCanvasBenchmarkStage','canvasBenchmarkMedian','stopCanvasBenchmark',
  'beginCanvasBenchmark','sampleCanvasBenchmark']){
  assert.match(benchmark,new RegExp('function '+fn+'\\('));
  assert.doesNotMatch(engine,new RegExp('function '+fn+'\\('));
 }
 assert.match(benchmark,/let canvasBenchmark=null,canvasBenchSummary=null;/);
 assert.match(engine,/if\(canvasBenchmark\)sampleCanvasBenchmark\(now,rafMs\)/);
 assert.match(engine,/function outsideGameLoopMs\(/);
 assert.doesNotThrow(()=>new vm.Script(benchmark));
 assert.doesNotThrow(()=>new vm.Script(engine));
});
test('benchmark is loaded exactly once after assets, before engine, and precached offline',()=>{
 for(const paths of [browser,core,coreGameScriptPaths(source('index.html'),{includeUI:false,includeAssets:false})]){
  assert.equal(paths.indexOf('./js/engine-graphics-benchmark.js'),
    paths.indexOf('./engine.js')-1);
  assert.equal(paths.filter(p=>p==='./js/engine-graphics-benchmark.js').length,1);
 }
 assert.match(sw,/['"]\.\/js\/engine-graphics-benchmark\.js['"]/);
 assert.equal(browser.length,38);assert.equal(core.length,25);
});
test('median diagnostic is pure and startup does not begin a benchmark',()=>{
 const ctx={};vm.createContext(ctx);
 vm.runInContext(benchmark+'\n;globalThis.testMedian=canvasBenchmarkMedian;globalThis.active=()=>canvasBenchmark;',ctx);
 assert.equal(ctx.testMedian([60,20,40]),40);
 assert.equal(ctx.testMedian([10,30,20,50]),25);
 assert.equal(ctx.testMedian([]),null);
 assert.equal(ctx.active(),null);
});
