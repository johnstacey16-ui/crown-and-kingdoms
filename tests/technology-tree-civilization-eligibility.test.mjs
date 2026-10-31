import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+"\n"+
  "seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;start();snd=0;"+
  "S.age=[3,3];S.tech=[{},{}];globalThis.readTree=code=>eval(code);",
  sandbox,{timeout:15000});
 return code=>sandbox.readTree(code);
}
function row(run,name){
 const entry=JSON.parse(run('JSON.stringify(treeLines())')).find(r=>r[0].startsWith(name));
 assert.ok(entry,'Missing tree row '+name);
 return entry[1];
}

test('technology tree reflects regional Camel Rider access for four civilizations',()=>{
 const run=fixture();
 run('S.civ[0]=0');assert.doesNotMatch(row(run,'Stable'),/Camel Rider/);
 run('S.civ[0]=8');assert.match(row(run,'Stable'),/Camel Rider/);
 run('S.civ[0]=19');assert.doesNotMatch(row(run,'Stable'),/Camel Rider/);
 run('S.civ[0]=13');assert.match(row(run,'Stable'),/Camel Rider/);
});

test('technology tree filters forbidden upgrades while retaining unique castle troops',()=>{
 const run=fixture();
 run('S.civ[0]=9');assert.doesNotMatch(row(run,'Barracks'),/Pikeman|Halberdier/);
 run('S.civ[0]=0');assert.match(row(run,'Barracks'),/Pikeman|Halberdier/);
 assert.match(row(run,'Castle'),/Throwing Axeman/);
 run('S.civ[0]=1');assert.match(row(run,'Castle'),/Longbowman/);
});

test('reading the technology tree never changes queues, resources or saved state',()=>{
 const run=fixture();
 const snapshot='JSON.stringify({civ:S.civ,res:S.res,bs:S.bs.map(b=>({k:b.k,q:b.q,rs:b.rs})),tech:S.tech})';
 const before=run(snapshot);
 run('treeLines()');
 assert.equal(run(snapshot),before);
});
