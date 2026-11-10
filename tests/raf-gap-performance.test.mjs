import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
import {readFileSync} from 'node:fs';

const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const picture=readFileSync(new URL('../js/engine-picture.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const state=readFileSync(new URL('../js/state.js',import.meta.url),'utf8');
const start=picture.indexOf('function outsideGameLoopMs('),end=picture.indexOf('function resetAdaptivePictureSampling(',start);
assert.ok(start>=0&&end>start,'the exact production frame budget helper exists');
const outsideGameLoopMs=vm.runInNewContext(picture.slice(start,end)+'\noutsideGameLoopMs');

test('normal 60 Hz draw time is subtracted from RAF interval, never counted twice',()=>{
 assert.equal(outsideGameLoopMs(16.7,3.3),13.399999999999999);
 assert.equal(outsideGameLoopMs(100,3),97,'the slow 100ms screenshot has 97ms unattributed');
 assert.equal(outsideGameLoopMs(100,72),28,'a slow game frame contributes to its own interval');
 assert.equal(outsideGameLoopMs(16,30),0,'negative residual must clamp to zero');
 assert.equal(outsideGameLoopMs(Infinity,1),0);
 assert.equal(outsideGameLoopMs(100,NaN),0);
});
test('frame sampling wraps input, controls, fixed sim and draw without changing 30 Hz tick or RAF schedule',()=>{
 assert.match(engine,/function frame\(now\)\{requestAnimationFrame\(frame\)/);
 assert.match(engine,/const dt=Math\.min\(\.25,\(now-last\)\/1000\);last=now/);
 assert.match(engine,/perfFrameIntervalMs=rafMs;perfGapMs=outsideGameLoopMs\(rafMs,perfLoopMs\)/);
 assert.match(engine,/if\(timing\)perfPadMs=performance\.now\(\)-padStart/);
 assert.match(engine,/if\(timing\)perfControlMs=performance\.now\(\)-controlStart/);
 assert.match(engine,/finally\{if\(timing\)perfLoopMs=performance\.now\(\)-loopStart\}/);
 assert.match(engine,/while\(acc>=DT&&mode==='play'\)/);
 assert.match(engine,/perfDrawMs=performance\.now\(\)-drawStart/);
 assert.match(state,/perfLoopMs=0,perfGapMs=0,perfFrameIntervalMs=0/);
});
test('performance overlay distinguishes input/control CPU work from the non-game RAF gap and browser focus',()=>{
 assert.match(ui,/LOOP '\+perfLoopMs\.toFixed/);
 assert.match(ui,/PAD '\+perfPadMs\.toFixed/);
 assert.match(ui,/CTL '\+perfControlMs\.toFixed/);
 assert.match(ui,/GAP '\+perfGapMs\.toFixed/);
 assert.match(ui,/RAF '\+perfFrameIntervalMs\.toFixed/);
 assert.match(ui,/document\.visibilityState/);
 assert.match(ui,/document\.hasFocus/);
 assert.match(ui,/CHUNK '\+perfChunksMs/);
 assert.match(ui,/WORLD '\+perfObjectsMs/);
});

test('save cost appears separately from simulation and RAF gap in performance diagnostics',()=>{
 assert.ok(state.includes("perfSaveMetrics={kind:'NONE',ok:null"));
 assert.ok(ui.includes('const saveStat=perfSaveMetrics'));
 for(const key of ['saveStat.serialize.toFixed','saveStat.storage.toFixed','saveStat.peak.toFixed'])
  assert.ok(ui.includes(key),key+' appears in the FPS overlay');
});

test('RAF telemetry counts actual completed fixed ticks, including catch-up, without dropping simulation work',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.run=code=>eval(code);',sandbox);const run=sandbox.run;
 run('start();perfHud=1;perfTestMatch=1;readPad=()=>{};ctl=()=>{};draw=()=>{};globalThis.actualTicks=0;step=()=>actualTicks++;last=1000;acc=0;gs=1;');
 run('frame2(1016.7)');assert.equal(run('perfStepCount'),0);assert.equal(run('actualTicks'),0);
 run('frame2(1033.4)');assert.equal(run('perfStepCount'),1);assert.equal(run('actualTicks'),1);
 run('frame2(1166.8)');assert.equal(run('perfStepCount'),4);assert.equal(run('actualTicks'),5);
 run('mode="pause";frame2(1266.8)');assert.equal(run('perfStepCount'),0);assert.equal(run('actualTicks'),5);
});
test('save telemetry resets between matches and after successful save restores',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.run=code=>eval(code);',sandbox);
 const run=sandbox.run;
 run('start();perfHud=1;saveG(true)');
 assert.equal(run('perfSaveMetrics.kind'),'AUTO');
 assert.equal(run('perfSaveMetrics.count'),1);
 run('start()');
 assert.equal(run('perfSaveMetrics.kind'),'NONE','new games must not inherit previous save timings');
 assert.equal(run('perfSaveMetrics.peak'),0);
 assert.equal(run('perfSaveMetrics.count'),0);
 assert.equal(run('saveG(true)'),true);
 assert.equal(run('loadG(true)'),true,'checkpoint should remain valid and load normally');
 assert.equal(run('perfSaveMetrics.kind'),'NONE','loaded games must begin with fresh timing data');
 assert.equal(run('perfSaveMetrics.count'),0);
});

test('performance HUD keeps both save timing rows within the narrow Xbox overlay',()=>{
 const start=ui.indexOf('function drawPerfOverlay(dt){'),end=ui.indexOf('\nconst ovr=',start);
 assert.ok(start>=0&&end>start);
 const rows=[],rects=[];
 const zeroes=Object.fromEntries([...ui.slice(start,end).matchAll(/\bperf[A-Z]\w*/g)].map(m=>[m[0],0]));
 const context=vm.createContext({
  ...zeroes,perfHud:1,mode:'play',CW:1280,CH:720,
  S:{teamN:2,us:[],bs:[]},cv:{width:1280,height:720},
  DPR:1,zm:1,canvasBenchmark:null,canvasBenchSummary:null,
  GRAPHICS_RECOVERY:{losses:0},TEAM_FRAME_CACHE:{hits:0,creations:0,evictions:0,pixels:0},
  TROOP_TEXTURE_LRU:{size:0},document:{visibilityState:'visible',hasFocus:()=>true},
  X:{fillRect:(...a)=>rects.push(a),strokeRect(){}},
  teamColor:()=>'#eee',tx:(v,x,y,size)=>rows.push({text:String(v),x,y,size}),
  perfSaveMetrics:{kind:'AUTO',ok:true,total:78.9,peak:182.3,serialize:43.2,
    storage:30.6,bytes:486400,count:7,failures:1}
 });
 vm.runInContext(ui.slice(start,end),context);
 context.drawPerfOverlay(1/60);
 const saveRows=rows.filter(r=>r.text.startsWith('SAVE ')||r.text.startsWith('JSON '));
 assert.equal(saveRows.length,2,'summary and breakdown each get a row');
 assert.ok(saveRows[0].text.includes('PEAK 182.3ms'));
 assert.ok(saveRows[1].text.includes('WRITE 30.6ms'));
 assert.ok(saveRows[1].text.includes('SIZE 475KiB'));
 const panel=rects[0],right=panel[0]+panel[2]-8;
 assert.ok(saveRows.every(r=>r.x+r.text.length*r.size*.62<right),
   'both save labels must fit the narrower two-team HUD at ordinary text widths');
 assert.ok(saveRows.every(r=>r.y<panel[1]+panel[3]-8),'both labels remain inside the background');
 rows.length=0;rects.length=0;
 context.canvasBenchSummary={kind:'pacing',results:Array.from({length:5},()=>({ms:30}))};
 context.drawPerfOverlay(1/60);
 const benchmark=rows.filter(r=>r.text.startsWith('MEDIAN FPS')||r.text.startsWith('FROZEN FLAT'));
 assert.equal(benchmark.length,2,'benchmark remains readable below two save rows');
 assert.ok(benchmark.every(r=>r.y<rects[0][1]+rects[0][3]-8),'benchmark stays within its panel');
 context.perfSaveMetrics={kind:'NONE',ok:null,total:0,peak:0,serialize:0,storage:0,bytes:0,count:0,failures:0};
 rows.length=0;rects.length=0;context.canvasBenchSummary=null;context.drawPerfOverlay(1/60);
 assert.equal(rows.filter(r=>r.text.startsWith('JSON ')).length,0,'no stale breakdown before first save');
 assert.ok(rows.some(r=>r.text.includes('waiting for next checkpoint')));
});
