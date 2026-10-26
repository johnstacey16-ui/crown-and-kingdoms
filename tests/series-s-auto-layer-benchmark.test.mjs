import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const source=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');

function game(){
 const {source:gameSource,sandbox,storage}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(gameSource+'\nglobalThis.run=code=>eval(code);',sandbox);
 return {run:sandbox.run,storage};
}
test('layer comparison measures all five modes on an unchanged frozen sample scene',()=>{
 const {run,storage}=game();
 run('start();perfTestMatch=1;mode="pause";gs=1.5;perfRenderScale=.5;perfFlatField=1');
 assert.equal(run("beginCanvasBenchmark('layers')"),true);
 assert.equal(run('perfFlatField+perfLayerMode'),0);
 assert.equal(run('perfRenderScale'),1);
 assert.equal(run('gs'),0);
 const before=run('JSON.stringify([S.us.map(u=>[u.id,u.x,u.y]),S.bs.map(b=>[b.id,b.x,b.y])])');
 const expected=[[0,0],[1,0],[2,0],[0,1],[0,0]],values=[200,125,145,16.7,210];
 let now=50000;
 for(let p=0;p<5;p++){
  assert.deepEqual(JSON.parse(run('JSON.stringify([perfLayerMode,perfFlatField])')),expected[p]);
  run('sampleCanvasBenchmark('+now+',250)');
  for(let i=1;i<7;i++)run('sampleCanvasBenchmark('+(now+i*1000)+','+values[p]+')');
  run('sampleCanvasBenchmark('+(now+7000)+',260)');
  now+=7000;
 }
 assert.equal(run('canvasBenchmark'),null);
 assert.equal(run('perfRenderScale'),1);
 assert.equal(run('perfLayerMode+perfFlatField'),0);
 assert.equal(run('gs'),1.5);
 assert.equal(run('mode'),'play');
 const result=JSON.parse(run('JSON.stringify(canvasBenchSummary)'));
 assert.equal(result.kind,'layers');
 assert.deepEqual(result.results.map(x=>x.label),['Normal','Terrain only','Objects only','Flat field','Normal repeat']);
 assert.deepEqual(result.results.map(x=>x.ms),values);
 assert.equal(run('JSON.stringify([S.us.map(u=>[u.id,u.x,u.y]),S.bs.map(b=>[b.id,b.x,b.y])])'),before);
 assert.equal(storage.has('ck_set'),false);
});
test('aborted graphics benchmark restores world, game speed and pixel density',()=>{
 const {run}=game();
 run('start();perfTestMatch=1;mode="pause";gs=2');
 run("beginCanvasBenchmark('layers');sampleCanvasBenchmark(1000,200);sampleCanvasBenchmark(9000,200)");
 assert.equal(run('perfLayerMode'),1);
 run('mode="pause";sampleCanvasBenchmark(10000,200)');
 assert.equal(run('canvasBenchmark'),null);
 assert.equal(run('canvasBenchSummary'),null);
 assert.equal(run('perfRenderScale'),1);
 assert.equal(run('perfLayerMode+perfFlatField'),0);
 assert.equal(run('gs'),2);
});
test('only sample game exposes an Xbox graphics comparison with screenshot-ready results',()=>{
 assert.match(ui,/perfTestMatch\?\[/);
 assert.match(ui,/n:'Run Xbox graphics comparison'/);
 assert.match(ui,/beginCanvasBenchmark\('layers'\)/);
 assert.match(ui,/MEDIAN FPS: FULL /);
 assert.match(ui,/FLAT '\+f\(3\)/);
 assert.match(source,/CK_LAYER_BENCH_STAGES=\[/);
 assert.match(source,/if\(mode!=='play'&&mode!=='pause'&&canvasBenchmark\)stopCanvasBenchmark\(true\)/);
 const {run}=game();
 run('start();mode="pause"');
 assert.equal(run("beginCanvasBenchmark('layers')"),false);
 assert.equal(run('canvasBenchmark'),null);
});
