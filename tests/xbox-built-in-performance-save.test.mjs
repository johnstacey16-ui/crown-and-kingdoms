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
 assert.match(benchmark,/function loadSeriesSPerformanceSave\(unitLoad=selectedXboxPerformanceLoad\)/);
 assert.match(benchmark,/const CK_SERIES_S_SAMPLE_KEY='ck_series_s_fps_fixture_v1'/);
 assert.match(benchmark,/saveG\(false,CK_SERIES_S_SAMPLE_KEY\)/);
 assert.match(benchmark,/loadG\(false,CK_SERIES_S_SAMPLE_KEY\)/);
 assert.doesNotMatch(engine,/function loadSeriesSPerformanceSave\(/);
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
 const ui=readFileSync(new URL('../js/ui-screens.js',import.meta.url),'utf8');
 assert.match(benchmark,/CK_SERIES_S_UNIT_LOADS=\[50,100,200\]/);
 assert.match(menus,/if\(ti===7\)\{if\(E\[14\]\)cycleXboxPerformanceLoad\(-1\)/);
 assert.match(ui,/Xbox FPS Test · '\+selectedXboxPerformanceLoad\+' units/);
});

test('Large Battle Test Save stages 372 real units and 238 buildings before combat begins',()=>{
 const {run,storage}=setup();
 run('localStorage.setItem("ck_save","owned-manual");localStorage.setItem("ck_autosave","owned-auto");ti=8;E=[];E[0]=true;titleCtl()');
 const state=details(run);
 assert.equal(state.mode,'pause','the owner controls when the battle resumes');
 assert.equal(state.perfTestMatch,1);
 assert.equal(state.perfHud,1);
 assert.equal(state.units,372);
 assert.equal(state.buildings,238);
 assert.equal(state.seedW,128);
 assert.equal(state.seedH,128);
 assert.equal(run('S.teamN'),4);
 assert.deepEqual(JSON.parse(run('JSON.stringify(S.us.reduce((a,u)=>(a[u.t]++,a),[0,0,0,0]))')),[93,93,93,93]);
 assert.deepEqual(JSON.parse(run('JSON.stringify(S.bs.reduce((a,b)=>(a[b.t]++,a),[0,0,0,0]))')),[60,60,59,59]);
 assert.equal(storage.get('ck_save'),'owned-manual');
 assert.equal(storage.get('ck_autosave'),'owned-auto');
 assert.equal(storage.has('ck_series_s_fps_fixture_v1'),false,'small benchmark slot remains untouched');
 const saved=JSON.parse(storage.get('ck_series_s_prebattle_fixture_v1'));
 assert.equal(saved.us.length,372);assert.equal(saved.bs.length,238);
 const army=JSON.parse(run('JSON.stringify(S.us.filter(u=>u.k!=="vil").map(u=>({t:u.t,o:u.o,target:u.tg?.t,x:u.x,y:u.y})))'));
 assert.ok(army.length>=300,'all four kingdoms have substantial combat troops');
 assert.ok(army.every(u=>u.o==='a'&&u.target!==u.t),'pre-staged opponents have hostile attack orders');
 assert.equal(new Set(army.map(u=>u.x+','+u.y)).size,army.length,'combat units have distinct staging cells');
 assert.ok(army.every(u=>u.x>2&&u.y>2&&u.x<126&&u.y<126));
 assert.equal(run('mode="play";mode'), 'play','Resume is possible without reloading');
});
test('large battle stays out of ordinary saves and cannot replace a running match',()=>{
 const {run,storage}=setup();
 run('localStorage.setItem("ck_autosave","my-autosave");localStorage.setItem("ck_save","my-manual")');
 assert.equal(run('loadSeriesSLargeBattleSave()'),true);
 assert.equal(run('saveG(true)'),false,'large battle does not overwrite real autosaves');
 assert.equal(storage.get('ck_autosave'),'my-autosave');
 assert.equal(storage.get('ck_save'),'my-manual');
 const before=run('JSON.stringify([S.us.length,S.bs.length,mode])');
 assert.equal(run('loadSeriesSLargeBattleSave()'),false);
 assert.equal(run('JSON.stringify([S.us.length,S.bs.length,mode])'),before);
 const benchmark=readFileSync(new URL('../js/engine-graphics-benchmark.js',import.meta.url),'utf8');
 const menus=readFileSync(new URL('../js/menus.js',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../js/ui-screens.js',import.meta.url),'utf8');
 assert.match(benchmark,/const CK_SERIES_S_BATTLE_KEY='ck_series_s_prebattle_fixture_v1'/);
 assert.match(menus,/const n=9/);
 assert.match(menus,/ti===8\)loadSeriesSLargeBattleSave\(\)/);
 assert.match(ui,/Large Battle Test Save/);
});

test('nine title options stay above controller help text at Xbox screen heights',()=>{
 const ui=readFileSync(new URL('../js/ui-screens.js',import.meta.url),'utf8');
 assert.match(ui,/rh=Math.max\(30,Math.min\(48,Math.floor\(\(CH-385\)\/it.length\)\)\)/);
 const items=9;
 for(const height of [600,720,900,1080]){
  const row=Math.max(30,Math.min(48,Math.floor((height-385)/items)));
  const top=Math.max(48,Math.min(height*.35,height-145-items*row));
  assert.ok(top+items*row<height-111,
   'last title entry is above the gamepad-status bar at '+height+'px');
 }
});

test('King starting mode skips missing Town Centres and still spawns at valid centres',()=>{
 const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
 const begin=engine.indexOf('if(vm===3)for(let t=0;t<S.teamN;t++){');
 const end=engine.indexOf("mode='play'",begin);
 assert.ok(begin>=0&&end>begin,'starting kings are assigned during live match creation');
 const spawns=[],kings=[];
 const ctx={vm:3,S:{teamN:3,bs:[{t:1,k:'tc'}]},spawnPos:b=>{
  spawns.push(b);return [7,8]
 },addU:(...args)=>kings.push(args)};
 vm.runInNewContext(engine.slice(begin,end),ctx);
 assert.equal(spawns.length,1,'no undefined centre reaches spawnPos');
 assert.equal(kings.length,1,'only valid centres create a king');
 assert.deepEqual(kings[0],[1,'king',7,8]);
 ctx.S.bs=[];spawns.length=0;kings.length=0;
 assert.doesNotThrow(()=>vm.runInNewContext(engine.slice(begin,end),ctx));
 assert.equal(spawns.length,0,'no centres is a safe exceptional state');
});
