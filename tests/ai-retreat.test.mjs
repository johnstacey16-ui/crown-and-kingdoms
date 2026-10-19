import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const sim=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const start=ai.indexOf('function aiRetreat(');
const end=ai.indexOf('\nfunction ai(',start);
assert.ok(start>=0&&end>start,'AI retreat policy must exist');
const retreatSource=ai.slice(start,end);

function setup(){
 const shelter={k:'tc',done:true,hp:500,x:5,y:5,s:3,t:1};
 const S={t:100,us:[]};
 const U={knight:{dmg:10,sh:false},mil:{dmg:5,sh:false}};
 let pathCalls=0;
 const context={
  S,U,W:96,H:96,
  mhp:()=>100,
  path:()=>{pathCalls++;return [[6.5,6.5]]},
  goalNear:b=>b,
  isHostile:(a,b)=>a!==b,
  d2:(x,y,b)=>Math.hypot(Math.max(b.x-x,0,x-b.x-b.s),Math.max(b.y-y,0,y-b.y-b.s))
 };
 const retreat=vm.runInNewContext(retreatSource+'\n;aiRetreat;',context);
 return {S,U,shelter,retreat,get pathCalls(){return pathCalls}};
}
const soldier=(hp=18)=>({t:1,k:'knight',hp,x:23,y:23,o:'i',p:[],rp:0});

test('critically injured military unit retreats to a reachable completed shelter',()=>{
 const h=setup(),u=soldier();
 h.retreat(1,[u],h.shelter,[h.shelter]);
 assert.equal(u.retreating,true);
 assert.equal(u.retreatTarget,h.shelter);
 assert.equal(u.o,'m');
 assert.equal(u.p.length,1);
 assert.equal(u.retreatCooldownUntil,130);
 assert.equal(h.pathCalls,1);
});

test('healthy units, civilian and loaded units do not retreat',()=>{
 const h=setup(),healthy=soldier(80),villager={...soldier(),k:'vil'},loaded={...soldier(),ld:{k:'trn'}};
 h.retreat(1,[healthy,villager,loaded],h.shelter,[h.shelter]);
 assert.equal(!!healthy.retreating,false);
 assert.equal(!!villager.retreating,false);
 assert.equal(!!loaded.retreating,false);
 assert.equal(h.pathCalls,0);
});

test('retreat ends after recovery to 65 percent HP or after shelter destruction',()=>{
 const h=setup(),u={...soldier(65),retreating:true,retreatTarget:h.shelter,tg:h.shelter,o:'m',p:[[6.5,6.5]]};
 h.retreat(1,[u],h.shelter,[h.shelter]);
 assert.equal(u.retreating,false);
 assert.equal(u.retreatTarget,null);
 assert.equal(u.tg,null);
 assert.equal(u.o,'i');
 const next={...soldier(35),retreating:true,retreatTarget:h.shelter,tg:h.shelter,o:'m',p:[[6.5,6.5]]};
 h.shelter.hp=0;
 h.retreat(1,[next],h.shelter,[h.shelter]);
 assert.equal(next.retreating,false,'destroyed shelter cannot hold units in perpetual retreat');
});

test('shelter proximity no longer grants free hit-point healing',()=>{
 assert.match(sim,/Shelter proximity alone does not heal military units/);
 assert.match(sim,/u\.hp>=mhp\(u\)\*\.65\|\|S\.t>=\(u\.retreatRestUntil\|\|\(u\.retreatRestUntil=S\.t\+8\)\)/,
  'retreat rest ends through recovered health or an eight-second timeout');
 assert.doesNotMatch(sim,/u\.hp=Math\.min\(mhp\(u\),u\.hp\+Math\.max\(1\.5,mhp\(u\)\*\.035\)\*dt\)/,
  'obsolete automatic healing must not silently return');
});

test('retreating units are excluded from coordinated AI attack waves',()=>{
 assert.match(ai,/else if\(!u\.ld&&!U\[u\.k\]\.sh&&u\.k!=='scout'&&u\.k!=='king'&&u\.k!=='cart'&&!u\.retreating\)arm\.push\(u\)/);
 assert.match(ai,/\(A\.wu\|\|\[\]\)\.filter\(u=>u\.hp>0&&!u\.ld&&u\.k!=='mon'&&!u\.retreating/);
});
