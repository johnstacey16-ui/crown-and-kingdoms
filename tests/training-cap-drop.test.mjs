import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Both population-cap stalls and malformed queue recovery run the same live
// building-production helper. Keep this focused VM fixture separate from saves.
const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const {U,B,TE}=vm.runInNewContext(config+'\n;({U,B,TE})');
const start=simulation.indexOf('function upB(b,dt){');
const end=simulation.indexOf('\nfunction okPlace(',start);
assert.ok(start>=0&&end>start,'live building training helper must exist');
const trainingSource=simulation.slice(start,end);

function trainingFixture({queue=[{k:'vil',t:1}],population=2,capacity=2}={}){
 const tc={k:'tc',t:0,hp:B.tc.hp,done:true,x:4,y:4,s:3,q:queue};
 const S={bs:[tc],tech:[{},{}],res:[{f:0,w:0,g:0,s:0},{}],
  pl:{tr:0},us:[],pj:[]};
 let currentPopulation=population,currentCapacity=capacity,spawned=0;
 const context={
  attackRange:()=>0,U,B,TE,S,note:()=>{},sfx:()=>{},foe:()=>null,
  unitName:k=>k,livePopulation:()=>currentPopulation,capOf:()=>currentCapacity,
  trainRate:()=>1,spawnPos:()=>[5.5,5.5],
  addU:(team,kind,x,y)=>{
   spawned++;currentPopulation++;
   return {t:team,k:kind,x,y};
  }
 };
 vm.createContext(context);
 vm.runInContext(trainingSource,context);
 return {tc,S,upB:vm.runInContext('upB',context),
  setCapacity:value=>{currentCapacity=value;},
  stats:()=>({population:currentPopulation,capacity:currentCapacity,spawned})};
}

test('finished units remain queued at the population cap and spawn after space returns',()=>{
 const h=trainingFixture();
 h.upB(h.tc,5);
 assert.equal(h.stats().spawned,0,'completed training must wait when full');
 assert.equal(h.tc.q.length,1,'waiting unit stays queued');
 assert.equal(h.tc.q[0].t,0,'completed unit remains ready');
 h.setCapacity(3);
 h.upB(h.tc,1);
 assert.equal(h.stats().spawned,1,'the unit spawns after capacity recovers');
 assert.equal(h.tc.q.length,0,'completed unit is removed after spawning');
 assert.equal(h.stats().population,3);
 assert.equal(h.S.pl.tr,1,'successful training updates statistics');
});

test('malformed queue heads and invalid delta never corrupt later valid training',()=>{
 const h=trainingFixture({queue:[null,{k:'vil',t:3}],population:0,capacity:20});
 h.upB(h.tc,1);
 assert.equal(h.tc.q.length,1,'malformed queue head is discarded');
 assert.equal(h.tc.q[0].t,3,'the following valid entry remains intact');
 h.upB(h.tc,NaN);
 assert.equal(h.tc.q[0].t,3,'invalid delta must not corrupt training');
 h.upB(h.tc,-1);
 assert.equal(h.tc.q[0].t,3,'negative delta must not reverse training');
 h.upB(h.tc,3);
 assert.equal(h.stats().spawned,1,'valid queued training still completes');
 assert.equal(h.tc.q.length,0);
});
