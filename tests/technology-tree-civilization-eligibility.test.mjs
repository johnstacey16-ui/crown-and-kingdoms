import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

function fixture(){
 const {sandbox}=headlessGame();
 // Technology tree lives in the UI owner; retain the canonical browser order.
 const source=loadCoreGameSource({includeUI:true});
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

test('technology tree displays both Gothic unique techs only for Goths',()=>{
 const run=fixture();
 run('S.civ[0]=18');
 const gothic=row(run,'Castle');
 assert.match(gothic,/Anarchy/);
 assert.match(gothic,/Perfusion/);
 run('S.civ[0]=1');
 assert.doesNotMatch(row(run,'Castle'),/Anarchy|Perfusion/);
});

test('Goth technology tree shows the Imperial Elite Huskarl upgrade without exposing it to Britons',()=>{
 const run=fixture();
 run('S.civ[0]=18');
 assert.match(row(run,'Castle'),/Elite Huskarl/);
 run('S.civ[0]=1');
 assert.doesNotMatch(row(run,'Castle'),/Elite Huskarl/);
});

test('Archery Range tech state is taken from the supplied world, not a stale global match',()=>{
 const run=fixture();
 run('S.civ=[0,1];S.tech=[{},{}]');
 const other='[{xbow:1},{}]';
 assert.ok(JSON.parse(run("JSON.stringify(trOf({k:'rng',t:0},S.civ,"+other+"))")).includes('xbow'));
 assert.ok(!JSON.parse(run("JSON.stringify(trOf({k:'rng',t:0},S.civ,"+other+"))")).includes('arc'));
 assert.ok(JSON.parse(run("JSON.stringify(trOf({k:'rng',t:0},S.civ,S.tech))")).includes('arc'));
 run('S.tech[0].xbow=1');
 assert.ok(JSON.parse(run("JSON.stringify(trOf({k:'rng',t:0},S.civ,[{},{}]))")).includes('arc'),
  'provided unresearched world must not inherit Crossbowman from global S');
});

test('a single read-only tree model describes each existing civilization unique and Elite line',()=>{
 const run=fixture();
 const before=run('JSON.stringify({tech:S.tech,res:S.res,civ:S.civ,age:S.age})');
 for(let id=0;id<26;id++){
  const model=JSON.parse(run('JSON.stringify(technologyTreeModel(0,{civ:['+id+'],age:[1],tech:[{}]}))'));
  assert.equal(model.civilizationId,id);
  assert.equal(model.buildings.length,Object.keys(JSON.parse(run('JSON.stringify(B)'))).length-6,'foreign civilizations cannot access Feitoria, Krepost, Donjon, Folwark, Fortified Church or Mule Cart');
  const castle=model.buildings.find(b=>b.id==='castle');
  const unique=JSON.parse(run('JSON.stringify(CIV['+id+'])'));
  assert.ok(castle.units.some(u=>u.id===unique.uu));
  assert.ok(castle.research.some(t=>t.id===unique.ut.k));
  if(unique.ut2)assert.ok(castle.research.some(t=>t.id===unique.ut2.k));
  if(unique.elite){
   const line=castle.research.find(t=>t.id===unique.elite.k);
   assert.ok(line,'own Elite line appears for '+unique.n);
   assert.equal(line.state,'locked','Imperial research is gated in Feudal Age');
  }
 }
 assert.equal(run('JSON.stringify({tech:S.tech,res:S.res,civ:S.civ,age:S.age})'),before,
  'technology-model reads never spend resources or alter the live match');
});

test('tree details reflect prerequisites, completed research and Spanish no-gold blacksmith costs',()=>{
 const run=fixture();
 run('S.age[0]=3;S.civ[0]=1;S.tech[0]={}'); // Britons: Crossbowman → Arbalester
 const read=k=>JSON.parse(run("JSON.stringify(technologyTreeModel(0,S))")).buildings.find(b=>b.id===k);
 const archery=read('rng');
 const arb=archery.research.find(t=>t.id==='arb');
 assert.ok(arb);
 assert.equal(arb.state,'locked');
 assert.match(arb.reason,/Needs Crossbowman/);
 run('S.tech[0].xbow=1');
 assert.equal(read('rng').research.find(t=>t.id==='arb').state,'available');
 run('S.tech[0].arb=1');
 assert.equal(read('rng').research.find(t=>t.id==='arb').state,'researched');
 run('S.civ[0]=14;S.tech[0]={};S.age[0]=3');
 const smith=read('smith'),goldTech=smith.research.find(t=>t.id==='ironCasting');
 assert.ok(goldTech,'Spanish must have Iron Casting in the shared research tree');
 assert.equal(goldTech.cost.g,0,'Spanish Iron Casting has no gold charge');
 const otherTech=JSON.parse(run("JSON.stringify(technologyTreeModel(0,{civ:[0],tech:[{}],age:[3]}))"))
  .buildings.find(b=>b.id==='smith').research.find(t=>t.id===goldTech.id);
 assert.ok(otherTech.cost.g>0);
});

test('Xbox technology-tree browsing selects every building and fits its details in compact viewports',()=>{
 const run=fixture();
 const count=run('treeLines().length');
 assert.equal(run('treePageRows(720)'),9);
 assert.equal(run('treePageRows(480)'),4);
 assert.ok(count>12);
 run('tsc=treeLines().length-1');
 assert.equal(run('treeLines()[tsc][0].length>0'),true);
 assert.ok(run('treeCostLabel({f:100,w:200,g:0})').includes('100F'));
 assert.match(run('treeFit("A very long technology name",88,16)'),/…$/);
});

test('technology tree model returns detached cost snapshots, not mutable game cost objects',()=>{
 const run=fixture();
 run('S.civ[0]=1;S.age[0]=3;S.tech[0]={xbow:1}');
 const original=run('JSON.stringify({units:U,tech:TE})');
 run("globalThis.modelSnapshot=technologyTreeModel(0,S)");
 run("const r=modelSnapshot.buildings.find(b=>b.id==='rng'); r.units[0].cost.w=-999; r.research[0].cost.f=-999");
 assert.equal(run('JSON.stringify({units:U,tech:TE})'),original,
  'a menu consumer cannot rewrite canonical unit or research costs');
});
