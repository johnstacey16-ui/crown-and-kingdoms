import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const source=readFileSync(new URL('../engine.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/engine-graphics-benchmark.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');

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
 assert.match(ui,/if\(!canvasBenchmark\)\{[\s\S]*?if\(perfFlatField\)tx\('TEST: FLAT FIELD/,'separate in-progress bench row from manual isolation captions');
 assert.match(ui,/FLAT '\+f\(3\)/);
 assert.match(source,/CK_LAYER_BENCH_STAGES=\[/);
 assert.match(render,/if\(mode!=='play'&&mode!=='pause'&&canvasBenchmark\)stopCanvasBenchmark\(true\)/);
 const {run}=game();
 run('start();mode="pause"');
 assert.equal(run("beginCanvasBenchmark('layers')"),false);
 assert.equal(run('canvasBenchmark'),null);
});

test('frame-pacing benchmark freezes the same world and returns all five measured stages',()=>{
 const {run,storage}=game();
 run('start();perfTestMatch=1;mode="pause";gs=1.5;perfSharpHud=1;perfRenderScale=.75;rs()');
 const original=run('JSON.stringify([S.us.map(u=>[u.id,u.x,u.y]),S.bs.map(b=>[b.id,b.x,b.y])])');
 assert.equal(run("beginCanvasBenchmark('pacing')"),true);
 assert.equal(run('gs'),0);
 assert.equal(run('perfSharpHud'),0);
 const expected=[
  ['Full',false,0],['Frozen full',true,0],['Flat field',false,1],
  ['Frozen flat',true,1],['Full repeat',false,0]
 ],values=[100,16.7,83.3,20,110];
 let now=20000;
 for(let p=0;p<expected.length;p++){
  const state=JSON.parse(run('JSON.stringify([CK_PACING_BENCH_STAGES[canvasBenchmark.phase].label,CK_PACING_BENCH_STAGES[canvasBenchmark.phase].skip,perfFlatField])'));
  assert.deepEqual(state,expected[p]);
  assert.equal(run('perfRenderScale'),1,'pacing comparison never changes resolution');
  run('sampleCanvasBenchmark('+now+',250)');
  for(let i=1;i<7;i++)run('sampleCanvasBenchmark('+(now+i*1000)+','+values[p]+')');
  run('sampleCanvasBenchmark('+(now+7000)+',260)');
  now+=7000;
 }
 assert.equal(run('canvasBenchmark'),null);
 assert.equal(run('perfRenderScale'),1);
 assert.equal(run('perfSharpHud'),1);
 assert.equal(run('perfFlatField+perfLayerMode'),0);
 assert.equal(run('gs'),1.5);
 const result=JSON.parse(run('JSON.stringify(canvasBenchSummary)'));
 assert.equal(result.kind,'pacing');
 assert.deepEqual(result.results.map(x=>x.label),expected.map(x=>x[0]));
 assert.deepEqual(result.results.map(x=>x.skip),expected.map(x=>x[1]));
 assert.deepEqual(result.results.map(x=>x.ms),values);
 assert.equal(run('JSON.stringify([S.us.map(u=>[u.id,u.x,u.y]),S.bs.map(b=>[b.id,b.x,b.y])])'),original);
 assert.equal(storage.has('ck_set'),false);
});
test('the frozen pacing phase skips every canvas draw but leaves normal frame2 draws untouched',()=>{
 const {run}=game();
 run('start();mode="pause";perfTestMatch=1;pad={connected:true,buttons:[],axes:[0,0,0,0]};E=[];P=[];readPad=()=>{};beginCanvasBenchmark("pacing");globalThis.drawCount=0;draw=()=>{drawCount++};');
 run('canvasBenchmark.phase=1;setupCanvasBenchmarkStage(canvasBenchmark)');
 run('frame2(1000)');
 assert.equal(run('drawCount'),0,'no Canvas2D operation via the game draw dispatch');
 assert.equal(run('perfDrawMs'),0);
 run('canvasBenchmark.phase=2;setupCanvasBenchmarkStage(canvasBenchmark);canvasBenchmark.start=null');
 run('frame2(1016)');
 assert.equal(run('drawCount'),1,'flat-field stage draws normally');
 run('stopCanvasBenchmark(true);frame2(1032)');
 assert.equal(run('drawCount'),2,'all ordinary frames continue drawing after the diagnostic');
 assert.equal(run('perfFlatField+perfLayerMode'),0);
 assert.equal(run('canvasBenchSummary'),null);
});
test('new pacing diagnostic is opt-in, labelled and never persists or intercepts regular match rendering',()=>{
 assert.match(ui,/n:'Run Xbox frame pacing comparison'/);
 assert.match(ui,/beginCanvasBenchmark\('pacing'\)/);
 assert.match(ui,/FROZEN FULL /);
 assert.match(ui,/FROZEN FLAT /);
 assert.match(source,/CK_PACING_BENCH_STAGES=\[/);
 assert.match(source,/if\(frozenCanvas\|\|GRAPHICS_RECOVERY.lost.size\)perfDrawMs=0/);
 assert.match(source,/else\{draw\(dt\);perfDrawMs=performance\.now\(\)-drawStart/);
 const {run}=game();
 run('start();mode="pause"');
 assert.equal(run("beginCanvasBenchmark('pacing')"),false);
 assert.equal(run('canvasBenchmark'),null);
 run('perfTestMatch=1;beginCanvasBenchmark("pacing");mode="pause";sampleCanvasBenchmark(1000,50)');
 assert.equal(run('canvasBenchmark'),null,'pause interruption restores the canvas');
 assert.equal(run('perfRenderScale'),1);
});

test('object breakdown times all categories at original scale with the same frozen units',()=>{
 const {run,storage}=game();
 run('start();perfTestMatch=1;mode="pause";gs=1.5;perfRenderScale=.75;perfSharpHud=1');
 assert.equal(run("beginCanvasBenchmark('objects')"),true);
 const before=run('JSON.stringify(S.us.map(u=>[u.id,u.x,u.y]))');
 const passes=[0,1,2,3,0],values=[125,60,80,70,130];
 let now=60000;
 for(let i=0;i<5;i++){
  assert.deepEqual(JSON.parse(run('JSON.stringify([perfLayerMode,perfObjectPass,perfRenderScale,gs])')),[2,passes[i],1,0]);
  run('sampleCanvasBenchmark('+now+',250)');
  for(let j=1;j<7;j++)run('sampleCanvasBenchmark('+(now+j*1000)+','+values[i]+')');
  run('sampleCanvasBenchmark('+(now+7000)+',260)');
  now+=7000;
 }
 assert.equal(run('canvasBenchmark'),null);
 assert.deepEqual(JSON.parse(run('JSON.stringify([perfLayerMode,perfObjectPass,perfFlatField,perfRenderScale,perfSharpHud,gs])')),[0,0,0,1,1,1.5]);
 const result=JSON.parse(run('JSON.stringify(canvasBenchSummary)'));
 assert.deepEqual(result.results.map(x=>x.label),['Objects full','Units only','Buildings only','Resources only','Objects repeat']);
 assert.deepEqual(result.results.map(x=>x.objectPass),passes);
 assert.deepEqual(result.results.map(x=>x.ms),values);
 assert.equal(run('JSON.stringify(S.us.map(u=>[u.id,u.x,u.y]))'),before);
 assert.equal(storage.has('ck_set'),false);
 assert.match(ui,/n:'Run Xbox object breakdown'/);
 assert.match(ui,/ALL REPEAT/);
});
test('canceling object breakdown restores every painter without saving',()=>{
 const {run}=game();
 run('start();perfTestMatch=1;mode="pause";gs=2;beginCanvasBenchmark("objects");canvasBenchmark.phase=2;setupCanvasBenchmarkStage(canvasBenchmark)');
 assert.equal(run('perfObjectPass'),2);
 run('mode="pause";sampleCanvasBenchmark(9000,100)');
 assert.equal(run('canvasBenchmark'),null);
 assert.equal(run('perfLayerMode+perfObjectPass+perfFlatField'),0);
 assert.equal(run('gs'),2);
});

test('unit sprite benchmark freezes AI and runs five original-scale stages without saving',()=>{
 const {run,storage}=game();
 run('start();perfTestMatch=1;mode="pause";gs=1.5;perfSharpHud=1;perfRenderScale=.75');
 assert.equal(run("beginCanvasBenchmark('units')"),true);
 const prior=run('JSON.stringify(S.us.map(u=>[u.id,u.x,u.y,u.hp]))');
 const passes=[0,1,2,3,0],timings=[160,130,100,25,170],nowStart=90000;
 for(let i=0;i<passes.length;i++){
  assert.deepEqual(JSON.parse(run('JSON.stringify([perfLayerMode,perfObjectPass,perfUnitPass,perfRenderScale,gs])')),[2,1,passes[i],1,0]);
  const now=nowStart+7000*i;run('sampleCanvasBenchmark('+now+',250)');
  for(let j=1;j<7;j++)run('sampleCanvasBenchmark('+(now+j*1000)+','+timings[i]+')');
  run('sampleCanvasBenchmark('+(now+7000)+',260)');
 }
 assert.equal(run('canvasBenchmark'),null);
 assert.deepEqual(JSON.parse(run('JSON.stringify([perfLayerMode,perfObjectPass,perfUnitPass,perfFlatField,perfRenderScale,perfSharpHud,gs])')),[0,0,0,0,1,1,1.5]);
 const summary=JSON.parse(run('JSON.stringify(canvasBenchSummary)'));
 assert.equal(summary.kind,'units');
 assert.deepEqual(summary.results.map(x=>x.label),['Units full','Sprites only','Ground only','No unit paint','Units repeat']);
 assert.deepEqual(summary.results.map(x=>x.unitPass),passes);
 assert.deepEqual(summary.results.map(x=>x.ms),timings);
 assert.equal(run('JSON.stringify(S.us.map(u=>[u.id,u.x,u.y,u.hp]))'),prior);
 assert.equal(storage.has('ck_set'),false);
 assert.match(ui,/Run Xbox unit sprite breakdown/);
 assert.match(ui,/UNITS REPEAT/);
});
test('unit paint diagnostic refuses ordinary matches and cancellation restores default painter',()=>{
 const {run}=game();
 run('start();mode="pause";perfTestMatch=0');
 assert.equal(run("beginCanvasBenchmark('units')"),false);
 run('perfTestMatch=1;gs=2;beginCanvasBenchmark("units");canvasBenchmark.phase=3;setupCanvasBenchmarkStage(canvasBenchmark)');
 assert.equal(run('perfUnitPass'),3);
 run('mode="pause";sampleCanvasBenchmark(9000,100)');
 assert.equal(run('canvasBenchmark'),null);
 assert.equal(run('canvasBenchSummary'),null);
 assert.equal(run('perfLayerMode+perfObjectPass+perfUnitPass+perfFlatField'),0);
 assert.equal(run('gs'),2);
});
