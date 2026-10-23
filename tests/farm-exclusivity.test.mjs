import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const kingdom=readFileSync(new URL('../js/kingdom.js',import.meta.url),'utf8');
const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const network=readFileSync(new URL('../js/network-commands.js',import.meta.url),'utf8');
const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const from=simulation.indexOf('function farmAvailableTo(u,n){');
const end=simulation.indexOf('function dropoffKey(',from);
assert.ok(from>=0&&end>from,'production farm occupancy and node selection functions present');
const farmCode=simulation.slice(from,end);

function harness(){
 const W=50,H=50;
 const farm={k:'f',x:10,y:10,amt:175,fm:1,t:0};
 const farFarm={k:'f',x:17,y:10,amt:175,fm:1,t:0};
 const berry={k:'f',x:12,y:10,amt:100};
 const tree={k:'w',x:9,y:10,amt:100};
 const u1={k:'vil',t:0,hp:25,x:9,y:10,o:'g',tg:farm,ct:'f',ret:1};
 const u2={k:'vil',t:0,hp:25,x:9,y:11,o:'g',tg:farm,ct:'f'};
 const u3={k:'vil',t:0,hp:25,x:11,y:10,o:'i',tg:null};
 const S={t:100,nodes:[farm,farFarm,berry,tree],us:[u1,u2,u3],
  wt:new Uint8Array(W*H),vp:{enabled:true,f:2,w:1,g:0,s:0}};
 const context={S,W,H,WORKER_TARGETS:[{k:'f'},{k:'w'},{k:'g'},{k:'s'}],
  path:(_u,goal)=>[[goal.x+.5,goal.y+.5]],goalNear:n=>n};
 vm.createContext(context);
 vm.runInContext(farmCode,context);
 const farmAvailableTo=vm.runInContext('farmAvailableTo',context),findNode=vm.runInContext('findNode',context);
 return {S,farm,farFarm,berry,tree,u1,u2,u3,context,farmAvailableTo,findNode};
}

test('only the first assigned living farmer owns a farm, including while carrying food home',()=>{
 const h=harness();
 assert.equal(h.farmAvailableTo(h.u1,h.farm),true);
 assert.equal(h.farmAvailableTo(h.u2,h.farm),false);
 assert.equal(h.farmAvailableTo(h.u3,h.farm),false);
 assert.equal(h.farmAvailableTo(h.u3,h.farFarm),true);
 h.u1.hp=0;
 assert.equal(h.farmAvailableTo(h.u2,h.farm),true,'dying releases the claim');
 h.u1.hp=25;h.u1.o='i';
 assert.equal(h.farmAvailableTo(h.u2,h.farm),true,'retasking releases the claim');
 h.u1.o='g';h.u1.ld={k:'tc'};
 assert.equal(h.farmAvailableTo(h.u2,h.farm),true,'garrisoning releases the claim');
});

test('nearest food selector skips occupied farms and finds a free adjacent food source',()=>{
 const h=harness();
 assert.equal(h.findNode(h.u3,'f',30),h.berry);
 h.berry.amt=0;
 assert.equal(h.findNode(h.u3,'f',30),h.farFarm);
 h.u1.hp=0;h.u2.o='i';
 assert.equal(h.findNode(h.u3,'f',30),h.farm);
});

test('farm ownership is enforced; other resources do not receive invented universal worker caps',()=>{
 const h=harness();
 const invader={k:'vil',t:1,hp:25,x:10,y:10,o:'i'};
 assert.equal(h.farmAvailableTo(invader,h.farm),false);
 h.u3.o='g';h.u3.tg=h.tree;
 assert.equal(h.farmAvailableTo(invader,h.tree),true);
 assert.equal(h.findNode(h.u3,'w',30),h.tree);
});

test('Xbox-style automatic worker assignment chooses a reachable unclaimed food node',()=>{
 const h=harness(),k=kingdom;
 const start=k.indexOf('function autoNodeKey('),end=k.indexOf('function applyVillagerPriorities(',start);
 assert.ok(start>=0&&end>start);
 h.context.villagerAssignedCount=()=>0;
 h.context.createVillagerPriority=()=>h.S.vp;
 vm.runInContext(k.slice(start,end),h.context);
 const pick=vm.runInContext('findReachableAutoNode',h.context);
 assert.equal(pick(h.u3,'f',18).n,h.berry);
 h.berry.amt=0;
 assert.equal(pick(h.u3,'f',18).n,h.farFarm);
});

test('all command surfaces preserve the one-farmer rule',()=>{
 assert.match(input,/tg\.fm&&!farmAvailableTo\(u,tg\)/);
 assert.match(engine,/farmAvailableTo\(u,n\)/);
 assert.match(network,/farmAvailableTo\(u,entity\)/);
 assert.match(network,/node\.fm&&!farmAvailableTo\(u,node\)/);
 assert.match(ai,/farmAvailableTo\(w,n\)/);
 assert.match(simulation,/tg\.fm&&!farmAvailableTo\(u,tg\)/);
});
