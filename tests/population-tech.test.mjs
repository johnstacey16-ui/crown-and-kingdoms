import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sim=fs.readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const ai=fs.readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const engine=fs.readFileSync(new URL('../engine.js',import.meta.url),'utf8');

test('queued population is counted once when training',()=>{
 const source=sim.slice(sim.indexOf('function train(b,k)'),sim.indexOf('function cancelQ('));
 const B={tc:{tr:['vil']}},U={vil:{age:0,cost:{f:50},t:10}};
 const b={t:0,k:'tc',hp:900,done:true,q:[{k:'vil',t:5}],rs:null};
 const S={tech:[{}],age:[0],res:[{f:1000}]};
 const popOf=()=>10,capOf=()=>11;
 const train=vm.runInNewContext(source+';train',{S,B,U,AG:[],popOf,capOf,can:()=>true,pay:()=>{},note:()=>{}});
 assert.equal(train(b,'vil'),true,'one remaining population slot should accept a villager');
 assert.equal(b.q.length,2);
});
test('full population prevents new training',()=>{
 const source=sim.slice(sim.indexOf('function train(b,k)'),sim.indexOf('function cancelQ('));
 const B={tc:{tr:['vil']}},U={vil:{age:0,cost:{f:50},t:10}};
 const b={t:0,k:'tc',hp:900,done:true,q:[],rs:null};
 const S={tech:[{}],age:[0],res:[{f:1000}]};
 const train=vm.runInNewContext(source+';train',{S,B,U,AG:[],popOf:()=>11,capOf:()=>11,can:()=>true,pay:()=>{},note:()=>{}});
 assert.equal(train(b,'vil'),false);
 assert.equal(b.q.length,0);
});
test('AI housing forecast uses actual plus queued population only once',()=>{
 assert.match(ai,/if\(popOf\(t\)\+5>capOf\(t\)/);
 assert.doesNotMatch(ai,/popOf\(t\)\+queuedPopulation\(t\)/);
 assert.ok(engine.includes('const popOf=t=>livePopulation(t)+queuedPopulation(t)'));
});
test('Treadmill Crane increases repair rate as well as build rate',()=>{
 assert.match(sim,/tg\.mh\*dt\/\(S\.tech\[u\.t\]\.crane\?32:40\)/);
 assert.match(sim,/const buildRate=S\.tech\[u\.t\]\.crane\?1\.2:1/);
});
