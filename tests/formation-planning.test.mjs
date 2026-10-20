import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../js/formations.js',import.meta.url),'utf8');
const ctx=vm.createContext({fm:1});
const plan=vm.runInContext(code+';formationSlots',ctx);
const units=[{x:0,y:0},{x:0,y:0},{x:0,y:0}];
const close=(actual,expected)=>actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-10,`${actual} != ${expected}`));
test('all formation shapes retain expected slot geometry',()=>{
 close(plan(units,10,0,0)(0),[-.55,-.55]);
 close(plan(units,10,0,1)(0),[0,-1.2]);
 close(plan(units,10,0,1)(2),[0,1.2]);
 close(plan(units,10,0,2)(0),[-1.1,0]);
 close(plan(units,10,0,3)(1),[.9,-.65]);
 close(plan(units,10,0,4)(0),[.6,0]);
 close(plan(units,10,0,4)(1),[-.25,-.75]);
 close(plan(units,10,0,4)(2),[-.25,.75]);
 close(plan([],10,0,1)(0),[0,0]);
});
test('a 500-unit order reads positions once and each order captures its own facing and shape',()=>{
 let reads=0;
 const army=Array.from({length:500},()=>({get x(){reads++;return 0},get y(){reads++;return 0}}));
 const slots=plan(army,10,0,1);
 for(let i=0;i<500;i++)slots(i);
 assert.equal(reads,1000,'centroid work is linear, not 500 full-army scans');
 const before=slots(0);
 ctx.fm=4;
 const north=plan(units,0,10,1);
 close(slots(0),before);
 close(north(0),[1.2,0]);
 const shifted=plan(units.map(u=>({x:u.x+7,y:u.y+3})),17,3,1);
 close(shifted(0),plan(units,10,0,1)(0));
});

test('Split creates balanced separate wings with finite unique slots and rotates with facing',()=>{
 for(const n of [1,2,3,4,5,12,51,500]){
  const army=Array.from({length:n},()=>({x:0,y:0}));
  const east=plan(army,10,0,5),north=plan(army,0,10,5);
  const slots=army.map((_,i)=>east(i));
  assert.equal(new Set(slots.map(p=>p.join(','))).size,n);
  for(let i=0;i<n;i++){
   assert.ok(slots[i].every(Number.isFinite));
   close(north(i),[-slots[i][1],slots[i][0]]);
  }
  if(n===1)close(slots[0],[0,0]);
  else{
   assert.equal(slots.filter(p=>p[1]<0).length,Math.ceil(n/2));
   assert.equal(slots.filter(p=>p[1]>0).length,Math.floor(n/2));
   assert.ok(slots.every(p=>Math.abs(p[1])>=1.8));
  }
 }
});

test('ordering exactly at the group centre keeps finite separated formation slots',()=>{
 for(const kind of [1,2,3,4,5]){
  const army=Array.from({length:12},()=>({x:10,y:8}));
  const centred=plan(army,10,8,kind),east=plan(army,20,8,kind);
  for(let i=0;i<army.length;i++)close(centred(i),east(i));
  assert.equal(new Set(army.map((_,i)=>centred(i).join(','))).size,army.length);
 }
});
