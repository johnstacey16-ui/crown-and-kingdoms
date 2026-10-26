import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');

function fixture(){
 const {source,sandbox,storage}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evalGame=code=>eval(code);',sandbox);
 return {run:sandbox.evalGame,storage};
}
const get=run=>JSON.parse(run('JSON.stringify({mode,scale:perfRenderScale,gs,acc,active:!!canvasBenchmark,results:canvasBenchSummary&&canvasBenchSummary.results,ui:perfHud,units:S.us.length,buildings:S.bs.length})'));

test('the benchmark rejects regular matches and can only start within paused offline sample',()=>{
 const {run}=fixture();
 run('start();mode="pause"');
 assert.equal(run('beginCanvasBenchmark()'),false);
 assert.equal(run('canvasBenchmark'),null);
 run('perfTestMatch=1;mode="play"');
 assert.equal(run('beginCanvasBenchmark()'),false);
 run('mode="pause";gs=1.5;perfFlatField=1;perfLayerMode=2;perfRenderScale=.5;rs()');
 assert.equal(run('beginCanvasBenchmark()'),true);
 const a=get(run);
 assert.equal(a.mode,'play');assert.equal(a.active,true);assert.equal(a.scale,1);
 assert.equal(a.gs,0);assert.equal(a.ui,1);
 assert.equal(run('perfFlatField+perfLayerMode'),0);
});
test('100/75/50/100 median RAF FPS benchmark freezes the exact scene then restores settings',()=>{
 const {run,storage}=fixture();
 run('start();perfTestMatch=1;mode="pause";gs=1.5;acc=.01');
 const before=run('JSON.stringify([S.us.map(u=>[u.id,u.x,u.y]),S.bs.map(b=>[b.id,b.x,b.y])])');
 assert.equal(run('beginCanvasBenchmark()'),true);
 const values=[250,100,16.7,200];let base=100000;
 for(let phase=0;phase<4;phase++){
  const val=values[phase];
  run('sampleCanvasBenchmark('+base+','+val+')');
  for(let i=1;i<7;i++)run('sampleCanvasBenchmark('+(base+i*1000)+','+val+')');
  run('sampleCanvasBenchmark('+(base+7000)+','+val+')');
  if(phase<3){
   assert.equal(run('canvasBenchmark.phase'),phase+1);
   assert.equal(run('perfRenderScale'),[.75,.5,1][phase]);
  }
  base+=7000;
 }
 const b=get(run);
 assert.equal(b.active,false);assert.equal(b.scale,1);assert.equal(b.gs,1.5);
 assert.equal(b.mode,'play');assert.equal(b.acc,0);
 assert.deepEqual(b.results.map(x=>x.scale),[1,.75,.5,1]);
 assert.deepEqual(b.results.map(x=>x.ms),values);
 assert.ok(b.results.every(x=>x.n>=5));
 assert.equal(run('cv.width'),1280);
 assert.equal(run('JSON.stringify([S.us.map(u=>[u.id,u.x,u.y]),S.bs.map(b=>[b.id,b.x,b.y])])'),before);
 assert.equal(storage.has('ck_set'),false,'diagnostics cannot save settings');
});
test('browser-tab interruption restores resolution and speed without partial result',()=>{
 const {run}=fixture();
 run('start();perfTestMatch=1;mode="pause";gs=2');
 run('beginCanvasBenchmark();sampleCanvasBenchmark(5000,200);sampleCanvasBenchmark(7000,200);perfRenderScale=.5;rs()');
 run('mode="pause";sampleCanvasBenchmark(8000,200)');
 assert.equal(run('canvasBenchmark'),null);
 assert.equal(run('canvasBenchSummary'),null);
 assert.equal(run('perfRenderScale'),1);
 assert.equal(run('gs'),2);
 assert.equal(run('cv.width'),1280);
});
test('benchmark visibility in Xbox menu, continuous overlay, stable median and cleanup',()=>{
 assert.match(ui,/n:'Run Xbox FPS comparison'/);
 assert.match(ui,/perfTestMatch\?\[/);
 assert.match(ui,/AUTO BENCH/);
 assert.match(ui,/MEDIAN FPS/);
 assert.match(engine,/CK_CANVAS_BENCH_STAGES=\[1,\.75,\.5,1\]/);
 assert.match(engine,/if\(canvasBenchmark\)sampleCanvasBenchmark\(now,rafMs\)/);
 assert.match(engine,/if\(canvasBenchmark\)stopCanvasBenchmark\(true\)/);
 assert.match(engine,/if\(mode!=='play'&&mode!=='pause'\)canvasBenchSummary=null/);
 const {run}=fixture();
 assert.equal(run('canvasBenchmarkMedian([250,16,100,50])'),75);
 assert.equal(run('canvasBenchmarkMedian([100,10,500])'),100);
 assert.equal(run('canvasBenchmarkMedian([])'),null);
});
