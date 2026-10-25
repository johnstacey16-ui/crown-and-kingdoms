import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const state=readFileSync(new URL('../js/state.js',import.meta.url),'utf8');
const start=engine.indexOf('function outsideGameLoopMs('),end=engine.indexOf('function frame2(now)',start);
assert.ok(start>=0&&end>start,'the exact production frame budget helper exists');
const outsideGameLoopMs=vm.runInNewContext(engine.slice(start,end)+'\noutsideGameLoopMs');

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
