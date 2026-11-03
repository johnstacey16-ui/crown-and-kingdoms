import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../js/ai-offence.js',import.meta.url),'utf8');
const start=source.indexOf('function aiResumeIdleWave(t,A){');
const end=source.indexOf('function aiAdvanceStagedWave(',start);
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

const recoveryStart=source.indexOf('function aiRecoverStalledWave(');
const recoveryEnd=source.indexOf('/* Remember only directly observed',recoveryStart);
assert.ok(recoveryStart>=0&&recoveryEnd>recoveryStart,
 'active-wave no-progress watchdog is present in the production policy');

function stalledWave({routes='alternate',progress=0,recoveries=0}={}){
 const enemyTC={t:0,k:'tc',hp:900,x:38,y:30,s:3,netId:'b1',done:true};
 const alternative={t:0,k:'house',hp:250,x:20,y:21,s:2,netId:'b2',done:true};
 const soldier=()=>({k:'mil',hp:40,x:12,y:12,o:'a',p:[],rp:0,
  tg:enemyTC,t:1,ld:null,retreating:false});
 const units=[soldier(),soldier(),soldier()];
 const S={t:100,bs:[enemyTC,alternative],age:[2,2]};
 const A={on:1,stg:null,wu:units,ws:3,nx:0,targetRetryAt:0,
  waveProbeAt:0,waveProgressAt:progress,waveBestDistance:32,
  waveTargetHP:900,waveTargetKey:'b1',waveRecoveries:recoveries};
 let probes=0;
 const fn=vm.runInNewContext(source.slice(recoveryStart,recoveryEnd)+'\n;aiRecoverStalledWave',{
  S,U:{mil:{dmg:5}},isHostile:(a,b)=>a!==b,
  goalNear:(b)=>b,path:(_u,b)=>{
   probes++;
   return routes==='none'||routes==='alternate'&&b!==alternative?null:[[b.x,b.y]];
  }
 });
 return {S,A,units,enemyTC,alternative,run:()=>fn(1,A),get probes(){return probes}};
}
test('a 48-second stalled assault retargets to a reachable alternative with bounded routing work',()=>{
 const h=stalledWave();
 assert.equal(h.run(),1);
 assert.equal(h.A.on,1);
 assert.equal(h.A.waveRecoveries,1);
 assert.equal(h.probes,1,'reachable alternative requires one candidate path probe');
 assert.equal(h.units.every(u=>u.o==='a'&&u.tg===h.alternative),true);
 assert.equal(h.units.every(u=>u.p.length===0&&u.rp===0),true);
 h.S.t=105;assert.equal(h.run(),0,'retask retry is rate-limited');
 assert.equal(h.probes,1);
});
test('fully unreachable enemy structures disband a stuck wave instead of creating fake paths',()=>{
 const h=stalledWave({routes:'none'});
 assert.equal(h.run(),-1);
 assert.equal(h.probes,2,'both live buildings probed, no unbounded path search');
 assert.equal(h.A.on,0);
 assert.equal(h.A.stg,null);
 assert.equal(h.A.nx,190);
 assert.equal(h.A.targetRetryAt,130);
 assert.equal(h.units.every(u=>u.o==='i'&&!u.tg&&u.p.length===0),true);
 assert.equal(h.S.bs[0].hp,900,'no target damage is invented');
});
test('real damage or motion resets stalled-wave watchdog without interrupting combat',()=>{
 const damaged=stalledWave({routes:'none'});damaged.enemyTC.hp=850;
 assert.equal(damaged.run(),0);
 assert.equal(damaged.A.on,1);assert.equal(damaged.probes,0);
 assert.equal(damaged.A.waveProgressAt,100);
 const moved=stalledWave({routes:'none'});moved.A.waveBestDistance=60;
 assert.equal(moved.run(),0);
 assert.equal(moved.A.on,1);assert.equal(moved.probes,0);
});
test('repeated retargeting cannot spin indefinitely without measurable progress',()=>{
 const h=stalledWave({routes:'alternate',recoveries:3});
 assert.equal(h.run(),-1,'last exhausted no-progress retry releases the wave');
 assert.equal(h.A.on,0);
});

test('switching targets without real progress cannot erase the stalled-wave retry budget',()=>{
 const h=stalledWave({routes:'alternate',recoveries:2});
 for(const unit of h.units)unit.tg=h.alternative;
 assert.equal(h.run(),1,'the existing retry budget allows one reachable retarget');
 assert.equal(h.A.waveRecoveries,3,'a mere target switch is not combat or marching progress');
 assert.equal(h.A.waveProgressAt,100);
 h.S.t=112;
 assert.equal(h.run(),0,'a new objective is sampled without resetting the budget');
 assert.equal(h.A.waveRecoveries,3);
 for(const unit of h.units)unit.tg=h.enemyTC;
 h.S.t=175;
 assert.equal(h.run(),-1,'the exhausted wave must be cancelled even after another target change');
 assert.equal(h.A.on,0);
 assert.equal(h.units.every(u=>u.o==='i'&&!u.tg),true);
 assert.equal(h.enemyTC.hp,900,'no damage is manufactured to satisfy the watchdog');
});

test('new building selection does not postpone the no-progress deadline',()=>{
 const h=stalledWave({routes:'none',recoveries:3,progress:30});
 for(const unit of h.units)unit.tg=h.alternative;
 h.S.t=100;
 assert.equal(h.run(),-1,'a stale assault is released despite changing target at the deadline');
 assert.equal(h.A.targetRetryAt,130,'the ordinary retry cooldown remains in force');
 assert.equal(h.probes,2,'recovery only probes the two live hostile structures');
});
