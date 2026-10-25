import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const gameSrc=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const uiSrc=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');

function instrumentedGame(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\n'+[
  'globalThis.evaluate=code=>eval(code);',
  'globalThis.probeCount={world:0,ui:0};',
  'globalThis.drawFrontEndScreen=function(){return false};',
  'drawWorld=function(){probeCount.world++};',
  'globalThis.drawGameOverlays=function(){probeCount.ui++};',
 ].join('\n'),sandbox);
 const run=sandbox.evaluate;
 run('start();WQ=[];notes=[];mode="play";perfHud=1');
 return run;
}

test('normal brightness bypasses compositor filter without affecting selected brightness',()=>{
 const run=instrumentedGame();
 assert.equal(run('cv.style.filter'),'none');
 assert.equal(run('br=.8;rs();cv.style.filter'),'brightness(0.8)');
 assert.equal(run('br=1;rs();cv.style.filter'),'none');
 assert.equal(run('br=1.4;rs();cv.style.filter'),'brightness(1.4)');
});
test('reversible flat field avoids world draws while game UI stays active',()=>{
 const run=instrumentedGame();
 run('draw(.033)');
 assert.deepEqual(run('JSON.parse(JSON.stringify(probeCount))'),{world:1,ui:1});
 run('perfChunksMs=9;perfTilesMs=8;perfObjectsMs=7;perfEffectsMs=6;perfFlatField=1;draw(.033)');
 assert.deepEqual(run('JSON.parse(JSON.stringify(probeCount))'),{world:1,ui:2});
 assert.deepEqual(JSON.parse(run('JSON.stringify([perfChunksMs,perfTilesMs,perfObjectsMs,perfEffectsMs])')),[0,0,0,0]);
 assert.equal(run('mode'),'play','test must not pause simulation');
 run('perfFlatField=0;draw(.033)');
 assert.deepEqual(run('JSON.parse(JSON.stringify(probeCount))'),{world:2,ui:3});
});
test('test mode clears when no match is in progress and cannot persist into a new match',()=>{
 const run=instrumentedGame();
 run('perfFlatField=1;mode="title";draw(.033)');
 assert.equal(run('perfFlatField'),0);
});
test('Xbox pause menu exposes an explicit controller-toggle and the test is never saved',()=>{
 assert.match(uiSrc,/n:'Render isolation test'/);
 assert.match(uiSrc,/perfFlatField\^=1;perfHud=1;perfFps=0/);
 assert.match(uiSrc,/TEST: FLAT FIELD/);
 assert.match(gameSrc,/else drawWorld\(\)/);
 assert.match(gameSrc,/if\(mode!=='play'&&mode!=='pause'\)perfFlatField=0/);
 const settings=gameSrc.match(/function sset\(\)\{[\s\S]{0,450}JSON\.stringify\(\{([\s\S]*?)\}\)\)/);
 assert.ok(settings,'game settings must remain serialized through sset()');
 assert.ok(!settings[1].includes('perfFlatField'),'flat test must never persist to localStorage');
});
