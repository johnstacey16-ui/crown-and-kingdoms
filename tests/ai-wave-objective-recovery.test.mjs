import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8');
const start=source.indexOf('function aiResumeIdleWave(t,A){');
const end=source.length;
assert.ok(start>=0&&end>start,'production idle-wave recovery helper is present');

function harness({on=1,stg=null,route=true}={}){
 const tc={t:0,k:'tc',hp:900,x:18,y:18,s:3},house={t:0,k:'house',hp:200,x:14,y:14,s:2};
 const dead={t:0,k:'tc',hp:0,x:12,y:14,s:3};
 const friendly={t:1,k:'tc',hp:900,x:2,y:2,s:3};
 const unit={k:'mil',hp:40,x:11,y:12,o:'i',t:1,p:[],rp:0};
 const S={t:100,bs:[friendly,house,dead,tc]},A={on,stg,wu:[unit]};
 let checks=0;
 const api=vm.runInNewContext(source.slice(start,end)+'\n;aiResumeIdleWave;',{
  S,U:{mil:{dmg:4}},isHostile:(a,b)=>a!==b,
  goalNear:x=>x,path:(_u,objective)=>{checks++;return route?[[16,16],[18,18]]:null}
 });
 return {api,S,A,unit,tc,house,get checks(){return checks}};
}
test('alive idle wave members resume their route to the hostile Town Centre',()=>{
 const h=harness();
 assert.equal(h.api(1,h.A),1);
 assert.equal(h.unit.o,'a');assert.equal(h.unit.tg,h.tc);
 assert.equal(h.unit.p.length,2);assert.equal(h.unit.rp,1);
 assert.equal(h.checks,1);
});
test('retargeting is bounded and respects staging and retry timers',()=>{
 const h=harness();
 assert.equal(h.api(1,h.A),1);
 h.unit.o='i';h.S.t=105;
 assert.equal(h.api(1,h.A),0);
 assert.equal(h.unit.o,'i');
 h.S.t=111;assert.equal(h.api(1,h.A),1);
 assert.equal(h.checks,2);
 assert.equal(harness({on:0}).api(1,{on:0,wu:[]}),0);
 assert.equal(harness({stg:{t:100}}).api(1,{on:1,stg:{t:100},wu:[]}),0);
});
test('unreachable objectives never create fake attacks',()=>{
 const h=harness({route:false});
 assert.equal(h.api(1,h.A),0);
 assert.equal(h.unit.o,'i');assert.equal(h.unit.tg,undefined);
 assert.equal(h.checks,2,'only two live hostile structures are route-tested');
});
