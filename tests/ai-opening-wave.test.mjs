import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const policy=readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8');
const offence=readFileSync(new URL('../js/ai-offence.js',import.meta.url),'utf8');
const start=offence.indexOf('function aiOpeningWaveNeed(base,age,wave){');
const end=offence.indexOf('function aiResumeIdleWave(',start);
assert.ok(start>=0&&end>start,'opening-wave logic must remain executable');
const openingNeed=vm.runInNewContext(offence.slice(start,end)+'\n;aiOpeningWaveNeed;');
test('a first Feudal push may launch with a smaller but viable army',()=>{
 assert.equal(openingNeed(14,1,0),10,'normal 14-soldier wave becomes a ten-soldier first push');
 assert.equal(openingNeed(12,1,0),9,'lower difficulty retains its relative sizing');
 assert.equal(openingNeed(18,1,0),13,'higher difficulty still needs a larger group');
 assert.equal(openingNeed(4,1,0),6,'never launch a tiny trickle');
});
test('later Feudal waves and other ages retain existing wave thresholds',()=>{
 assert.equal(openingNeed(14,1,1),14);
 assert.equal(openingNeed(18,2,0),18);
 assert.equal(openingNeed(22,3,0),22);
 assert.equal(openingNeed(14,0,0),14);
 assert.match(offence,/waveReady\.length>=aiOpeningWaveNeed\(need,S\.age\[t\],A\.wave\)/);
 assert.match(offence,/A\.wave\+\+/,'only actual wave launches increment the wave number');
});

function launchFixture({mode=0,blocked=()=>false,difficulty=0,now=1000}={}){
 const W=64,H=64,PERS=[{n:1,g:1}],U={mil:{dmg:5},mon:{dmg:0},ram:{dmg:10}};
 const S={t:now,age:[0,2],bs:[],r:()=>0.15},routeChecks=[];
 const ctx=vm.createContext({S,W,H,U,PERS,isHostile:(team,enemy)=>enemy===0,
  goalNear:(b,d)=>({x:b.x,y:b.y,building:b,range:d}),
  gp:(x,y,r)=>({x,y,r,formation:true}),
  path:(u,target)=>{routeChecks.push({unit:u,target});return blocked(u,target)?null:[{x:target.x,y:target.y}]},
  formationSlots:()=>i=>[i%4,Math.floor(i/4)]});
 vm.runInContext(policy+'\n'+offence+'\n;globalThis.launch=aiLaunchOffensiveWave;',ctx);
 const tc={k:'tc',t:1,x:6,y:6};
 const objective=(k='tc',x=26,y=26,done=true,hp=100,t=0)=>({k,x,y,hp,t,done,s:3});
 const unit=(k='mil')=>({k,t:1,o:'i',hp:100,ld:0,retreating:false,x:10,y:10,p:[],rp:0,tg:null,sh:false});
 const army=(n=12)=>Array.from({length:n},()=>unit());
 const A={on:0,stg:null,wave:0,nx:0,rd:null,targetRetryAt:0};
 return {S,A,tc,unit,army,objective,routeChecks,mode,run:(units,config=A)=>ctx.launch(1,config,units,tc,difficulty,0,mode)};
}

test('offensive wave launches only after difficulty, army, cooldown and age gates',()=>{
 const f=launchFixture(),target=f.objective(),army=f.army();
 f.S.bs=[target];
 f.S.t=700;f.run(army);assert.equal(f.A.wave,0);
 f.S.t=1000;f.A.nx=1200;f.run(army);assert.equal(f.A.wave,0);
 f.A.nx=0;f.run(army.slice(0,8));assert.equal(f.A.wave,0);
 f.run(army);
 assert.equal(f.A.wave,1);assert.equal(f.A.on,1);
 assert.equal(f.A.ws,12);assert.equal(f.A.stg.tg,target);
 assert.equal(f.A.nx,1420);
 assert.equal(army.every(u=>u.o==='m'),true);
});

test('offensive wave prioritises a completed wonder in wonder victory mode',()=>{
 const f=launchFixture({mode:1}),tc=f.objective('tc',13,13),wonder=f.objective('wonder',42,40);
 f.S.bs=[tc,wonder];f.run(f.army());
 assert.equal(f.A.stg.tg,wonder);
 assert.equal(f.A.wave,1);
});

test('offensive wave retries after a bounded scan of unreachable targets',()=>{
 const f=launchFixture({blocked:()=>true}),targets=Array.from({length:25},(_,i)=>f.objective('tc',10+i,23+i));
 f.S.bs=targets;f.run(f.army());
 assert.equal(f.A.wave,0);
 assert.equal(f.A.stg,null);
 assert.equal(f.A.targetRetryAt,1015);
 assert.equal(f.routeChecks.length,16,'enemy-target pathfinding is bounded to sixteen candidates');
});

test('offensive wave keeps siege priority and issues fallback attacks when formation routes are blocked',()=>{
 const f=launchFixture({blocked:(_u,to)=>!!to.formation}),target=f.objective(),castle=f.objective('castle',31,31);
 f.S.bs=[target,castle];const army=f.army(11),ram=f.unit('ram');army.push(ram);
 f.run(army);
 assert.equal(f.A.wave,1);
 assert.equal(f.A.stg.tg,target);
 assert.equal(f.A.stg.siegeT,castle,'siege targeting prefers reachable castles');
 assert.equal(army.every(u=>u.o==='a'&&u.tg===target),true);
});

test('hill victory launches a centre objective without drafting non-combat monks',()=>{
 const f=launchFixture({mode:5}),army=f.army(12),monk=f.unit('mon');
 army.push(monk);f.run(army);
 assert.equal(f.A.wave,1);
 assert.equal(f.A.stg.tg.k,'hill');
 assert.equal(f.A.stg.tg.x,32);
 assert.equal(monk.o,'i','non-combat monks are not part of an attack wave');
 assert.equal(monk.p.length,0);
 assert.ok(!f.routeChecks.some(c=>c.unit===monk&&c.target.range===7));
});
