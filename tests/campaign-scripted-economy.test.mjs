import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('./simulation-smoke.test.mjs',import.meta.url),'utf8');
const start=source.indexOf('    const assignResource =');
const end=source.indexOf('    const placeBuilding =',start);
assert.ok(start>=0&&end>start);
function bot(nodes){
 const context={S:{nodes}};vm.createContext(context);
 return vm.runInContext(source.slice(start,end)+'\n({assignFood,assignWood,assignGold,assignStone})',context);
}
for(const [kind,name] of [['f','assignFood'],['w','assignWood'],['g','assignGold'],['s','assignStone']]){
 test('repeated '+kind+' decisions preserve carried resources, return trips and routes',()=>{
  const node={k:kind,x:5,y:5,amt:100},f=bot([node])[name];
  const route=[[2.5,2.5]],unit={x:1,y:1,o:'g',ct:kind,tg:node,car:10,ret:1,p:route,rp:.5};
  for(let i=0;i<60;i++)assert.equal(f(unit),true);
  assert.equal(unit.car,10);assert.equal(unit.ret,1);assert.equal(unit.p,route);assert.equal(unit.rp,.5);
  node.amt=0;
  assert.equal(f(unit),false,'a depleted resource cannot silently remain a new assignment');
  assert.equal(unit.car,10,'failed assignment does not destroy the existing cargo');
 });
}
test('a fresh stone order uses the normal gather action and the nearest live deposit',()=>{
 const near={k:'s',x:4,y:4,amt:50},far={k:'s',x:9,y:9,amt:50};
 const unit={x:3,y:3,o:'i',ct:null,car:0,ret:0,p:[],rp:0};
 assert.equal(bot([far,near]).assignStone(unit),true);
 assert.equal(unit.o,'g');assert.equal(unit.ct,'s');assert.equal(unit.tg,near);
});
