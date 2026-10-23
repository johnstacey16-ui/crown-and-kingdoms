import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const start=ai.indexOf('function aiRebal(vil,R,t=1){');
const end=ai.indexOf('function aiNear(',start);
assert.ok(start>=0&&end>start,'production AI rebalancing can be evaluated');

function scenario({age=0,ready=true,food=100,wood=400,foragers=6,workers=16}={}){
 const S={age:[age,age],nodes:[{k:'f',x:12,y:12,amt:200,an:0,fi:0},{k:'w',x:12,y:13,amt:100,an:0,fi:0}],
  wt:new Uint8Array(40*40)};
 const villagers=Array.from({length:workers},(_,i)=>({
  k:'vil',hp:25,t:1,x:10+i*.12,y:10,o:'g',ct:i<foragers?'f':i<11?'g':'w',
  car:0,ret:0,ld:false,aiEvac:false,retreating:false
 }));
 let attempted=0;
 const h=vm.runInNewContext(ai.slice(start,end)+'\n;aiRebal;',{
  S,AG:[{}, {cost:{f:500}},{cost:{f:800,g:200}}],W:40,H:40,
  PERS:[{tw:0,wl:0}],aip:0,
  ageRequirements:()=>({ready}),
  farmAvailableTo:()=>true,
  goalNear:n=>n,
  path:()=>{attempted++;return [[11.5,11.5],[12.5,12.5]]}
 });
 h(villagers,{f:food,w:wood,g:200,s:0},1);
 return {villagers,attempted};
}

test('AI redirects miners to food when Dark Age prerequisites are ready',()=>{
 const {villagers,attempted}=scenario();
 assert.equal(villagers.filter(u=>u.ct==='f').length,7);
 assert.equal(villagers.filter(u=>u.ct==='g').length,4);
 assert.equal(attempted,1,'a single verifiable route is chosen per rebalancing tick');
});

test('AI does not steal economy workers without prerequisites or when aging is affordable',()=>{
 for(const inputs of [{ready:false},{food:500},{age:1}]){
  const {villagers}=scenario(inputs);
  assert.equal(villagers.filter(u=>u.ct==='f').length,6);
 }
});

test('Feudal-age AI rebuilds missing wood economy after spending on advancement',()=>{
 const h=scenario({age:1,wood:10,food:65});
 assert.equal(h.villagers.filter(u=>u.ct==='w').length,6);
 assert.equal(h.villagers.filter(u=>u.ct==='g').length,4);
 assert.equal(h.attempted,1);
});

test('Feudal AI relocates spare miners to food when prepared to save for Castle Age',()=>{
 const h=scenario({age:1,workers:24,foragers:6,food:250,wood:400});
 assert.equal(h.villagers.filter(u=>u.ct==='f').length,7);
 assert.equal(h.villagers.filter(u=>u.ct==='g').length,4);
 assert.equal(h.attempted,1,'save phase routes one reachable worker at a time');
});
