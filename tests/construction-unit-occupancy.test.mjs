import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 const network=['network-sync','network-commands'].map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 vm.runInContext(source+'\n'+network+'\nglobalThis.run=code=>eval(code);',sandbox);
 sandbox.run(`start();S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.humanTeams=[0,1];S.age=[1,1];S.res[0]={f:2000,w:2000,g:2000,s:2000};S.res[1]={f:2000,w:2000,g:2000,s:2000};globalThis.builder=addU(0,'vil',8.5,10.5);globalThis.blocker=addU(0,'vil',10.5,10.5);`);
 return sandbox.run;
}
test('solid foundations and farms cannot immobilize a living unit on their footprint',()=>{
 const run=fixture();
 assert.equal(run("okPlace(0,'house',10,10)"),false);
 assert.equal(run("okPlace(0,'farm',10,10)"),false);
 assert.equal(run('!!path(blocker,gp(15.5,15.5,.6))'),true,'worker retains a real exit route');
 run('blocker.x=12;blocker.y=10.5');
 assert.equal(run("okPlace(0,'house',10,10)"),true,'the right footprint edge is outside the occupied tiles');
 run('blocker.x=10.5;blocker.y=12');
 assert.equal(run("okPlace(0,'house',10,10)"),true,'the bottom edge is outside');
});
test('ownership, death and garrison state are treated consistently for occupancy',()=>{
 const run=fixture();
 for(const team of [0,1]){
  run('blocker.t='+team);
  assert.equal(run("okPlace(0,'house',10,10)"),false,'a foreign unit must not be trapped either');
 }
 run('blocker.hp=0');assert.equal(run("okPlace(0,'house',10,10)"),true);
 run('blocker.hp=25;blocker.ld={}');assert.equal(run("okPlace(0,'house',10,10)"),true,'garrisoned passengers do not occupy a world tile');
});
test('solo A confirmation rejects occupied ground without spending, then builds after it clears',()=>{
 const run=fixture();
 run("mode='play';S.sel=[builder];place={k:'house'};const p=w2s(11,11);cur.x=p[0];cur.y=p[1];P=[];E=[];E[0]=true;playCtl(1/30)");
 assert.equal(run('S.bs.length'),0);assert.equal(run('S.res[0].w'),2000);
 assert.equal(run('place.ok'),false);
 run('blocker.x=14.5;E[0]=true;playCtl(1/30)');
 assert.equal(run('S.bs.length'),1);assert.equal(run('S.res[0].w'),1975);
 assert.equal(run("builder.o==='b'&&builder.tg===S.bs[0]"),true);
});
test('authenticated construction rejects occupied tiles atomically for either owner',()=>{
 for(const team of [0,1]){
  const run=fixture();run('builder.t='+team);
  const before=run('CK_SIM_SYNC.worldCheckpoint(S,1).hash');
  assert.equal(run(`CK_GAME_COMMANDS.execute({type:'build',entities:[builder.netId],value:'house',point:{x:10,y:10}},${team},1)`),false);
  assert.equal(run('CK_SIM_SYNC.worldCheckpoint(S,1).hash'),before,'rejection changes no orders, resources, IDs or entities');
  run('blocker.x=14.5');
  assert.equal(run(`CK_GAME_COMMANDS.execute({type:'build',entities:[builder.netId],value:'house',point:{x:10,y:10}},${team},1)`),true);
  assert.equal(run(`S.res[${team}].w`),1975);
  assert.equal(run('S.bs.length'),1);
 }
});
