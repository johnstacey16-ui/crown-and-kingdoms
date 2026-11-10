import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation-logistics.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function patrol(wx,wy,once){');
const end = simulation.indexOf('\nfunction subg(', start);
assert.ok(start >= 0 && end > start, 'Patrol command must remain isolated');
const patrol = simulation.slice(start, end);

assert.match(patrol, /u\.hp>0&&!u\.ld/, 'Patrol must ignore defeated and garrisoned units');
assert.match(patrol, /!\['vil','fish','cart','cog','trn','mon','king'\]\.includes\(u\.k\)/,
  'Patrol must exclude worker, trade, transport, monk and King orders');
assert.match(patrol, /u\.t===0&&S\.us\.includes\(u\)/,
  'Solo patrol must only control living owned military entities in the current world');
assert.match(patrol, /!Number\.isFinite\(wx\)/,
  'Patrol must reject invalid map destinations before issuing unit orders');
assert.match(patrol, /u\.tg=null;u\.p=\[\];u\.rp=0/,
  'A patrol order must clear stale target/path state');
assert.match(patrol, /return n>0/,
  'Patrol must report whether any eligible units received the order');
assert.match(patrol, /Select living, ungarrisoned military units or warships to patrol/,
  'Empty/ineligible selections must get a useful controller message');

console.log('patrol-order-validation: only eligible active units receive patrol orders');

import test from 'node:test';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function battlefield(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+`
  seedOv=123456;msz=0;kingdoms=2;startAge=1;startArmy=0;startRes=3;start();
  S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.wt.fill(0);S.g.fill(0);S.gt.fill(0);S.ex.fill(1);
  globalThis.soldier=addU(0,'mil',23.5,24.5);
  globalThis.invader=addU(1,'mil',25.5,24.5);
  globalThis.protected=addU(0,'vil',22.5,24.5);
  S.sel=[soldier];foeGridDirty=true;
  globalThis.run=code=>eval(code);`,sandbox);
 return sandbox.run;
}
test('Passive and No Attack patrols move past opponents without automatic retaliation',()=>{
 const run=battlefield();
 for(const stance of [3,4]){
  run(`soldier.st=${stance};soldier.x=23.5;soldier.y=24.5;soldier.o='i';soldier.p=[];soldier.pt=null;S.sel=[soldier];foeGridDirty=true`);
  assert.equal(run('patrol(32.5,25.5,false)'),true);
  run('upU(soldier,DT)');
  assert.equal(run('soldier.o'),'p','stance '+stance+' keeps patrolling');
  assert.equal(run('soldier.tg'),null,'stance '+stance+' does not acquire a hostile target');
  assert.ok(run('soldier.p.length>0'),'stance '+stance+' has a genuine A* march path');
 }
 run("soldier.st=0;soldier.x=23.5;soldier.y=24.5;soldier.o='i';soldier.p=[];soldier.pt=null;S.sel=[soldier];foeGridDirty=true");
 assert.equal(run('patrol(32.5,25.5,false)'),true);
 run('upU(soldier,DT)');
 assert.equal(run('soldier.o'),'a','aggressive patrol intercepts nearby hostile troops');
 assert.equal(run('soldier.tg===invader'),true);
 assert.equal(run('applyUnitStance(soldier,3)'),true);
 assert.equal(run('soldier.o'),'p','switching to Passive immediately resumes the patrol');
 assert.equal(run('soldier.tg'),null);
 assert.equal(run('soldier.pt!==null'),true,'original patrol destination is retained');
});
test('Passive Guard tracks the friendly target without auto-interception and can resume combat',()=>{
 const run=battlefield();
 run("soldier.o='G';soldier.tg=protected;soldier.st=3;foeGridDirty=true");
 run('upU(soldier,DT)');
 assert.equal(run('soldier.o'),'G');
 assert.equal(run('soldier.guardTarget==null'),true,'Passive guard does not seek a raider');
 run("soldier.st=0;foeGridDirty=true;upU(soldier,DT)");
 assert.equal(run('soldier.o'),'a');
 assert.equal(run('soldier.guardTarget===protected'),true);
 assert.equal(run('applyUnitStance(soldier,3)'),true);
 assert.equal(run('soldier.o'),'G','Passive stops automatic pursuit');
 assert.equal(run('soldier.tg===protected'),true);
});
test('local solo patrol ignores foreign, dead, stale, duplicate and worker selections',()=>{
 const run=battlefield();
 run("globalThis.stale={k:'mil',t:0,hp:50,x:16,y:16,o:'i',p:[]};globalThis.dead=addU(0,'mil',24,28);dead.hp=0;S.sel=[invader,stale,dead,protected,soldier,soldier]");
 assert.equal(run('patrol(30.5,26.5,true)'),true);
 assert.equal(run('soldier.o'),'p');
 assert.equal(run('soldier.pt.once'),true);
 assert.equal(run('invader.o'),'i','enemy units cannot be commandeered by stale selections');
 assert.equal(run('stale.o'),'i');
 assert.equal(run('dead.o'),'i');
 assert.equal(run('protected.o'),'i');
 assert.equal(run('patrol(-1,20,false)'),false);
 assert.equal(run('patrol(Infinity,20,false)'),false);
 assert.equal(run('patrol(10000,20,false)'),false);
 run("soldier.o='G';soldier.tg=protected;soldier.guardTarget=invader;soldier.wind=1;soldier.windTarget=invader.netId;S.sel=[soldier]");
 assert.equal(run('patrol(29.5,27.5,false)'),true);
 assert.equal(run('soldier.guardTarget'),null);
 assert.equal(run('soldier.wind'),0);
 assert.equal(run('soldier.windTarget'),null);
 assert.equal(run('soldier.tg'),null);
 assert.equal(run('soldier.pt.once'),false);
});
