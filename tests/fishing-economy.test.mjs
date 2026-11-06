import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const sim=readFileSync(new URL('../js/simulation-unit-behaviour.js',import.meta.url),'utf8');
const resource=readFileSync(new URL('../js/simulation-resource-routing.js',import.meta.url),'utf8');
const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const maritime=readFileSync(new URL('../js/ai-maritime.js',import.meta.url),'utf8');
const {U,B}=vm.runInNewContext(config+'\n;({U,B})');
const begin=resource.indexOf('function farmAvailableTo(u,n){');
const end=resource.indexOf('\nfunction dropoffKey(',begin);
assert.ok(begin>=0&&end>begin,'resource selection logic must remain executable');

function selector(nodes){
 const S={nodes,wt:new Uint8Array(32*32),g:new Uint8Array(32*32),ex:new Uint8Array(32*32).fill(1),us:[]};
 const fn=vm.runInNewContext(resource.slice(begin,end)+'\n;findNode;',{S,W:32,H:32});
 return {S,findNode:fn};
}
test('fish ships are naval units made at docks, not land villagers',()=>{
 assert.ok(U.fish?.sh,'fishing ships must be marked as watercraft');
 assert.ok(B.dock?.tr?.includes('fish'),'docks must offer fishing ship training');
});

test('land resource gathering and fishing select separate resource habitats',()=>{
 const land={k:'w',x:5,y:5,amt:100,fi:0},
  fish={k:'f',x:5,y:7,amt:100,fi:1},
  trap={k:'f',x:7,y:7,amt:900,fi:1,trap:1,t:0};
 const h=selector([land,fish,trap]);
 const worker={k:'vil',t:0,x:4,y:5,sh:false};
 const boat={k:'fish',t:0,x:5,y:6,sh:true};
 assert.equal(h.findNode(worker,'w',10),land);
 assert.equal(h.findNode(worker,'f',10),null,'land villagers must not try fishing sea nodes');
 assert.equal(h.findNode(boat,'f',10),fish);
 assert.equal(h.findNode(boat,'w',10),null,'boats must not gather tree resources');
});

test('boats cannot collect from other kingdoms fish traps',()=>{
 const theirs={k:'f',x:6,y:6,amt:900,fi:1,trap:1,t:1};
 const ours={k:'f',x:7,y:6,amt:900,fi:1,trap:1,t:0};
 const h=selector([theirs,ours]);
 assert.equal(h.findNode({k:'fish',t:0,x:6,y:5,sh:true},'f',10),ours);
});

test('fishing delivery, carrying upgrades and AI idle orders retain their gameplay paths',()=>{
 assert.match(sim,/u\.car>=gatherCapacity\(u\)/,'resource gathering must use researched carry capacity');
 assert.match(sim,/S\.res\[u\.t\]\[u\.ct\]\+=u\.car/,'delivered resources belong to the correct player');
 assert.match(resource,/u\.sh\?q\.k==='dock':q\.k==='tc'/,'ships use Docks rather than land resource depots');
 assert.match(ai,/queuedUnits\('fish'\)/,'AI fishing cap must account for ships in training');
 assert.match(maritime,/for\(const s of fish\.filter\(u=>u\.o==='i'&&S\.t>=Math\.max\(u\.fleeUntil\|\|0,u\.nextFishingRoute\|\|0\)\)\)/,
  'idle AI fishing ships may retry after flee and routing cooldowns');
 assert.match(ai,/aiManageFishingShips\(fish,hostileFleet,R\)/,'live AI must execute the extracted fishing policy');
});


function rallyFixture(kind='fish',target={}){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const run=code=>vm.runInContext(code,sandbox);
 run(`kingdoms=2;startAge=3;start();S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(${kind==='fish'?1:0});S.ex.fill(1);S.vs.fill(1);
  globalThis.base=addB(0,'${kind==='fish'?'dock':kind==='vil'?'tc':'bar'}',20,20,true);S.res[0]={f:1000,w:1000,g:1000,s:1000};
  globalThis.deposit={netId:nextNetworkEntityId('n'),k:'f',x:30,y:28,s:1,amt:100,fi:${kind==='fish'?1:0},...${JSON.stringify(target)}};
  S.nodes.push(deposit);S.nd[deposit.y*W+deposit.x]=deposit;S.sel=[base];orderSel(deposit,30.5,28.5);
  globalThis.produce=()=>{if(!train(base,'${kind}'))throw Error('Training rejected');upB(base,U['${kind}'].t+1);globalThis.worker=S.us.at(-1);};
 `);
 return {run};
}

test('a paid fishing ship follows its Dock resource rally, harvests and delivers to the Dock',()=>{
 const f=rallyFixture();f.run('produce()');
 assert.equal(f.run("worker.o==='g'&&worker.tg===deposit&&worker.ct==='f'"),true);
 assert.equal(f.run('S.res[0].w'),1000-U.fish.cost.w,'the real training queue pays once');
 f.run('for(let i=0;i<2400;i++)upU(worker,1/30)');
 assert.ok(f.run('deposit.amt')<100);assert.ok(f.run('S.res[0].f')>1000,'fish returns to the real Dock');
 assert.equal(f.run('saveG()&&loadG()'),true);
 assert.equal(f.run("S.us[0].tg===S.nodes[0]&&S.bs[0].rally.t===S.nodes[0]"),true,'worker and rally restore references to the same fish patch');
});

test('owned Fish Trap rallies work and incompatible, depleted or stale targets stay ground rallies',()=>{
 const own=rallyFixture('fish',{trap:1,t:0});own.run('produce()');assert.equal(own.run("worker.o==='g'&&worker.tg===deposit"),true);
 for(const [target,remove]of [[{trap:1,t:1},false],[{fi:0},false],[{amt:0},false],[{},true]]){
  const f=rallyFixture('fish',target);if(remove)f.run('S.nd[deposit.y*W+deposit.x]=null;S.nodes=[]');f.run('produce()');
  assert.equal(f.run("worker.o!=='g'&&worker.tg===null"),true,JSON.stringify({target,remove}));
  f.run('for(let i=0;i<1200;i++)upU(worker,1/30)');assert.equal(f.run('worker.car'),0);
 }
});

test('resource rally dispatch preserves land workers and never makes soldiers gather',()=>{
 const land=rallyFixture('vil',{fm:1,t:0});land.run('produce()');assert.equal(land.run("worker.o==='g'&&worker.tg===deposit&&!worker.autoWorker"),true);
 for(const [kind,target]of [['vil',{fi:1}],['vil',{fm:1,t:1}],['mil',{}]]){
  const f=rallyFixture(kind,target);f.run('produce()');assert.equal(f.run("worker.o!=='g'&&worker.tg===null"),true,kind+' '+JSON.stringify(target));
 }
});
