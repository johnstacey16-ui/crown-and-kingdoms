import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const kingdom=readFileSync(new URL('../js/kingdom.js',import.meta.url),'utf8');
const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
const start=kingdom.indexOf('function autoNodeKey(');
const finish=kingdom.indexOf('function applyVillagerPriorities(',start);
assert.ok(start>=0&&finish>start,'automatic villager route helpers must remain accessible');
const logic=kingdom.slice(start,finish);

function harness(nodes,route){
 const S={t:100,nodes,wt:new Uint8Array(100*100),vp:{enabled:true,w:1}};
 let attempts=0;
 const context={S,W:100,H:100,WORKER_TARGETS:[{k:'w'}],
  path:(u,n)=>{attempts++;return route(u,n)},
  goalNear:n=>n,
  villagerAssignedCount:()=>0,farmAvailableTo:()=>true,
  createVillagerPriority:()=>({enabled:true,w:1})};
 const api=vm.runInNewContext(logic+'\n;({autoNodeKey,skipAutoNode,findReachableAutoNode,assignAutoVillager})',context);
 return {S,api,get attempts(){return attempts}};
}
const node=(x,y)=>({k:'w',x,y,amt:100});
const worker=()=>({k:'vil',t:0,hp:40,x:10,y:10,o:'i',p:[],rp:0,autoWorker:0});

test('unreachable resource nodes get a serializable timed retry, then become eligible again',()=>{
 const near=node(12,10),far=node(14,10),blocked=new Set([near]);
 const h=harness([near,far],(_u,n)=>blocked.has(n)?null:[[n.x+.5,n.y+.5]]);
 const u=worker();
 const first=h.api.findReachableAutoNode(u,'w',18);
 assert.equal(first.n,far,'an unreachable nearest resource must not block a reachable next choice');
 assert.equal(u.autoSkipNodes.length,1);
 assert.equal(u.autoSkipNodes[0].key,'w:12:10');
 assert.equal(u.autoSkipNodes[0].until,130,'blocked resources retry after thirty simulated seconds');
 blocked.clear();h.S.t=131;
 const retried=h.api.findReachableAutoNode(u,'w',18);
 assert.equal(retried.n,near,'the expired blocked resource must be retried');
 assert.equal(u.autoSkipNodes.length,0,'successful routes remove their stale skip records');
});

test('automatic villagers limit path attempts instead of scanning an unlimited resource field',()=>{
 const sources=Array.from({length:20},(_,i)=>node(12+i,10));
 const h=harness(sources,()=>null);
 const u=worker();
 assert.equal(h.api.findReachableAutoNode(u,'w',36),null);
 assert.equal(h.attempts,12,'only the first twelve unreachable nodes should be path-tested per retry');
 assert.equal(u.autoSkipNodes.length,12);
 assert.ok(u.autoSkipNodes.every(e=>typeof e.key==='string'&&e.until===130));
});

test('automatically assigned villagers retain the route that was already checked',()=>{
 const destination=node(14,10),route=[[12.5,10.5],[14.5,10.5]];
 const h=harness([destination],()=>route),u=worker();
 assert.equal(h.api.assignAutoVillager(u),true);
 assert.equal(u.o,'g');
 assert.equal(u.ct,'w');
 assert.equal(u.tg,destination);
 assert.equal(u.p,route);
 assert.equal(u.autoWorker,1);
 assert.equal(h.attempts,1,'do not repeat a successful path search on assignment');
});

test('manual player movement still clears the automated worker override',()=>{
 assert.match(input,/u\.autoWorker=0/,
  'explicit player orders must be able to disable automated villager assignment');
});
