import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

function setup(){
 const {source,sandbox,storage}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);globalThis.drawFrontEndScreen=()=>false;globalThis.drawGameOverlays=()=>{};',sandbox);
 return {run:sandbox.evaluate,storage};
}
const details=run=>JSON.parse(run('JSON.stringify({mode,perfTestMatch,perfHud,perfFlatField,perfLayerMode,units:S.us.length,buildings:S.bs.length,seedW:W,seedH:H,civ:S.civ,age:S.age,positions:S.bs.map(b=>[b.t,b.k,b.x,b.y]),unitPositions:S.us.map(u=>[u.t,u.k,u.x,u.y]),camera:cam})'));

test('main menu loads deterministic built-in performance save with completed cities and soldiers',()=>{
 const {run,storage}=setup();
 run('localStorage.setItem("ck_save","my-manual-slot");localStorage.setItem("ck_autosave","my-recovery-save");ti=7;E=[];E[0]=true;titleCtl()');
 const one=details(run);
 assert.equal(one.mode,'play');
 assert.equal(one.perfTestMatch,1);assert.equal(one.perfHud,1);
 assert.equal(one.perfFlatField,0);assert.equal(one.perfLayerMode,0);
 assert.equal(one.units,50,'default Xbox benchmark uses exactly fifty total units');
 assert.ok(one.buildings>=50,JSON.stringify(one));
 assert.equal(one.seedW,96);assert.equal(one.seedH,96);
 assert.equal(storage.get('ck_save'),'my-manual-slot');
 assert.equal(storage.get('ck_autosave'),'my-recovery-save');
 assert.ok(storage.has('ck_series_s_fps_fixture_v1'),'sample uses its own validated save key');
 const snap=JSON.parse(storage.get('ck_series_s_fps_fixture_v1'));
 assert.equal(snap.v,1);assert.equal(snap.us.length,one.units);assert.equal(snap.bs.length,one.buildings);
 assert.equal(storage.get('ck_set'),undefined,'user saved setup remains untouched');
 run('mode="title";ti=7;E=[];E[0]=true;titleCtl()');
 const two=details(run);
 assert.deepEqual(two.positions,one.positions);
 assert.deepEqual(two.unitPositions,one.unitPositions);
 assert.deepEqual(two.camera,one.camera);
});
test('test sample does not overwrite real autosave even after pausing or stepping the frame',()=>{
 const {run,storage}=setup();
 run('localStorage.setItem("ck_autosave","do-not-replace");loadSeriesSPerformanceSave()');
 assert.equal(run('saveG(true)'),false);
 run('autoPause()');
 assert.equal(run('mode'),'pause');
 assert.equal(storage.get('ck_autosave'),'do-not-replace');
 run('mode="play";perfFlatField=1;frame2(performance.now()+100000)');
 assert.equal(storage.get('ck_autosave'),'do-not-replace');
});
test('the built-in sample is inaccessible from another live match or an online session',()=>{
 const {run}=setup();
 run('start()');
 const before=JSON.parse(run('JSON.stringify([S.us.length,S.bs.length,mode])'));
 assert.equal(run('loadSeriesSPerformanceSave()'),false);
 assert.deepEqual(JSON.parse(run('JSON.stringify([S.us.length,S.bs.length,mode])')),before);
});

test('Xbox performance fixture has a single benchmark owner, not a duplicate in engine',()=>{
 const benchmark=readFileSync(new URL('../js/engine-graphics-benchmark.js',import.meta.url),'utf8');
 const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
 assert.match(benchmark,/function loadSeriesSPerformanceSave\(\)/);
 assert.match(benchmark,/const CK_SERIES_S_SAMPLE_KEY='ck_series_s_fps_fixture_v1'/);
 assert.match(benchmark,/saveG\(false,CK_SERIES_S_SAMPLE_KEY\)/);
 assert.match(benchmark,/loadG\(false,CK_SERIES_S_SAMPLE_KEY\)/);
 assert.doesNotMatch(engine,/function loadSeriesSPerformanceSave\(\)/);
 assert.doesNotMatch(engine,/const CK_SERIES_S_SAMPLE_KEY=/);
});

test('title-screen D-pad selects exact 50, 100, 200-unit original-art test saves',()=>{
 const {run,storage}=setup();
 run('localStorage.setItem("ck_save","owned-manual");localStorage.setItem("ck_autosave","owned-auto")');
 for(const [expected,key] of [[50,null],[100,15],[200,15],[50,15]]){
  run('mode="title";ti=7;E=[];E[0]=false');
  if(key!==null)run('E[15]=true;titleCtl();E=[]');
  assert.equal(run('selectedXboxPerformanceLoad'),expected);
  run('E[0]=true;titleCtl();E=[]');
  const state=details(run);
  assert.equal(state.units,expected,'actual total entities in '+expected+'-unit sample');
  assert.equal(run('xboxPerformanceUnitLoad'),expected);
  assert.equal(state.mode,'play');assert.equal(state.perfTestMatch,1);
  assert.equal(state.buildings>=50,true);
  assert.equal(storage.get('ck_save'),'owned-manual');
  assert.equal(storage.get('ck_autosave'),'owned-auto');
  assert.equal(JSON.parse(storage.get('ck_series_s_fps_fixture_v1')).us.length,expected);
  const soldiers=state.unitPositions.filter(u=>u[1]!=='vil');
  assert.equal(new Set(soldiers.map(u=>u.slice(2).join(','))).size,soldiers.length,
   'sample soldiers occupy unique legal locations');
 }
 run('mode="title";ti=7;E=[];E[14]=true;titleCtl()');
 assert.equal(run('selectedXboxPerformanceLoad'),200,'left D-pad cycles backward');
});
test('performance unit selection is session-local and invalid size or live game cannot replace saves',()=>{
 const {run,storage}=setup();
 run('localStorage.setItem("ck_save","manual");localStorage.setItem("ck_autosave","auto")');
 assert.equal(run('loadSeriesSPerformanceSave(60)'),false);
 assert.equal(run('mode'), 'title');
 assert.equal(storage.has('ck_series_s_fps_fixture_v1'),false);
 run('loadSeriesSPerformanceSave(100)');
 const before=JSON.parse(run('JSON.stringify([S.us.length,S.bs.length,mode])'));
 assert.equal(run('loadSeriesSPerformanceSave(200)'),false);
 assert.deepEqual(JSON.parse(run('JSON.stringify([S.us.length,S.bs.length,mode])')),before);
 assert.equal(storage.get('ck_save'),'manual');
 assert.equal(storage.get('ck_autosave'),'auto');
 const benchmark=readFileSync(new URL('../js/engine-graphics-benchmark.js',import.meta.url),'utf8');
 const menus=readFileSync(new URL('../js/menus.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
 assert.match(benchmark,/CK_SERIES_S_UNIT_LOADS=\\[50,100,200\\]/);
 assert.match(menus,/if\\(ti===7\\)\\{if\\(E\\[14\\]\\)cycleXboxPerformanceLoad\\(-1\\)/);
 assert.match(ui,/Xbox FPS Test · '\\+selectedXboxPerformanceLoad\\+' units/);
});
