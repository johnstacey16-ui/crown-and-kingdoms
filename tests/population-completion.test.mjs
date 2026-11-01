import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const engine=read('engine.js'),sim=read('js/simulation-building-updates.js'),queueSource=read('js/simulation-production-queues.js');
const pop=engine.split('\n').filter(l=>/^const (capOf|popOf|livePopulation)=/.test(l)).join('\n');
const queued=queueSource.slice(queueSource.indexOf('function queuedPopulation('),queueSource.indexOf('function train('));
const production=sim.slice(sim.indexOf('function upB('));
function fixture(count,queues){
 const S={us:Array.from({length:count},()=>({t:0,k:'vil',hp:25})),bs:queues.map(n=>({k:'tc',t:0,hp:100,done:true,q:Array.from({length:n},()=>({k:'vil',t:0}))})),tech:[{},{}],res:[{},{}],pl:{tr:0}};
 const ctx=vm.createContext({S,popLimit:200,U:{vil:{hp:25}},B:{tc:{}},trainRate:()=>1,spawnPos:()=>[1,1],sfx(){},note(){},unitName:k=>k,addU:(t,k)=>{const u={t,k,hp:25};S.us.push(u);return u}});
 vm.runInContext(queued+pop+production,ctx);
 return {S,run:code=>vm.runInContext(code,ctx)};
}
test('both buildings can complete their reserved slots at the population limit',()=>{
 const f=fixture(8,[1,1]);
 assert.equal(f.run('popOf(0)'),10);
 f.run('upB(S.bs[0],1);upB(S.bs[1],1)');
 assert.equal(f.run('livePopulation(0)'),10);
 assert.equal(f.run('queuedPopulation(0)'),0);
 assert.equal(f.S.pl.tr,2);
});
test('destroyed housing pauses finished queues until actual living capacity returns',()=>{
 const f=fixture(14,[1]);
 f.S.bs.push({t:0,k:'house',hp:0,done:true,q:[]});
 f.run('upB(S.bs[0],1)');
 assert.equal(f.run('capOf(0)'),10);
 assert.equal(f.S.bs[0].q.length,1);
 f.S.bs[1].hp=100;
 f.run('upB(S.bs[0],1)');
 assert.equal(f.run('livePopulation(0)'),15);
 assert.equal(f.S.bs[0].q.length,0);
});
test('dead units and destroyed production stop occupying slots; garrisoned units still count',()=>{
 const f=fixture(8,[1,2]);
 f.S.us[0].hp=0;
 f.S.us[1].ld={};
 f.S.bs[1].hp=0;
 f.S.bs.push({t:1,hp:100,q:[{k:'vil'}]});
 assert.equal(f.run('livePopulation(0)'),7);
 assert.equal(f.run('popOf(0)'),8);
 assert.equal(f.run('popOf(1)'),1);
 f.run('upB(S.bs[1],1)');
 assert.equal(f.S.pl.tr,0,'destroyed building cannot finish training');
});
