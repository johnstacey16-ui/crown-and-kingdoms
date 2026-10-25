import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function setup(){
 const {source,sandbox,storage}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
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
 assert.ok(one.units>=45,JSON.stringify(one));
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
 run('mode="play";frame2(performance.now()+100000)');
 assert.equal(storage.get('ck_autosave'),'do-not-replace');
});
test('the built-in sample is inaccessible from another live match or an online session',()=>{
 const {run}=setup();
 run('start()');
 const before=JSON.parse(run('JSON.stringify([S.us.length,S.bs.length,mode])'));
 assert.equal(run('loadSeriesSPerformanceSave()'),false);
 assert.deepEqual(JSON.parse(run('JSON.stringify([S.us.length,S.bs.length,mode])')),before);
});
