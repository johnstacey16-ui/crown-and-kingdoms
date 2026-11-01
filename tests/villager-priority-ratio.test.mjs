import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const kingdom=readFileSync(new URL('../js/kingdom.js',import.meta.url),'utf8');
const routing=readFileSync(new URL('../js/simulation-resource-routing.js',import.meta.url),'utf8');
const start=kingdom.indexOf('const WORKER_TARGETS=');
const finish=kingdom.indexOf('function skipAutoNode(',start);
assert.ok(start>=0&&finish>start,'production ratios must remain in the kingdom module');
const ratio=vm.runInNewContext(kingdom.slice(start,finish)+'\n;villagerRatioTargets');
const plain=x=>JSON.parse(JSON.stringify(x));

test('1:1:1:1 and 20:20:20:20 are equivalent at every population',()=>{
 for(const n of [0,1,2,3,4,7,11,23,80,200]){
  const a=plain(ratio({f:1,w:1,g:1,s:1},n)),b=plain(ratio({f:20,w:20,g:20,s:20},n));
  assert.deepEqual(a,b,'population '+n);
  assert.equal(Object.values(a).reduce((x,y)=>x+y,0),n);
 }
});
test('different ratios change the allocation without losing villagers',()=>{
 for(const n of [1,3,8,11,23,64,200]){
  const x=plain(ratio({f:5,w:3,g:1,s:0},n));
  assert.equal(Object.values(x).reduce((a,b)=>a+b,0),n);
  assert.equal(x.s,0);
  assert.ok(x.f>=x.w&&x.w>=x.g);
 }
});
test('zero, malformed and negative ratios do not allocate phantom workers',()=>{
 assert.deepEqual(plain(ratio({f:0,w:0,g:0,s:0},30)),{f:0,w:0,g:0,s:0});
 assert.deepEqual(plain(ratio({f:-5,w:NaN,g:null,s:0},30)),{f:0,w:0,g:0,s:0});
 assert.deepEqual(plain(ratio({f:1,w:0,g:0,s:0},0)),{f:0,w:0,g:0,s:0});
 assert.deepEqual(plain(ratio({f:1,w:0},7)),{f:7,w:0,g:0,s:0});
});
test('current game population converts weights to integer targets',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 const setup=[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;start();snd=0;',
  'S.us=[];S.vp=createVillagerPriority({f:1,w:1,g:1,s:1});',
  "for(let i=0;i<11;i++){const u=addU(0,'vil',12+i,16);u.o='i';u.autoWorker=0}",
  'globalThis.getTargets=()=>villagerPriorityTargets(0);',
  'globalThis.changeWeights=w=>{S.vp={enabled:true,...w}};'
 ].join('\n');
 vm.runInContext(source+'\n'+setup,sandbox,{timeout:15000});
 const a=plain(sandbox.getTargets());
 assert.deepEqual(a,{f:3,w:3,g:3,s:2});
 sandbox.changeWeights({f:20,w:20,g:20,s:20});
 assert.deepEqual(plain(sandbox.getTargets()),a);
 assert.equal(vm.runInContext("S.us.filter(u=>u.k==='vil').length",sandbox),11);
});
test('both worker assignment and rebalance consume scaled targets without moving manual workers',()=>{
 assert.match(kingdom,/const targets=villagerPriorityTargets\(u\.t,p\)/);
 assert.match(kingdom,/const needs=keys\.filter\(k=>counts\[k\]<targets\[k\]\)/);
 assert.match(kingdom,/const targets=villagerPriorityTargets\(t,p\)/);
 assert.match(kingdom,/let excess=villagerAssignedCount\(t,k\)-\(targets\[k\]\|\|0\)/);
 assert.match(kingdom,/for\(const u of auto\)/);
 assert.match(kingdom,/p\[r\.k\]\+' weight/);
});

test('rebalancing real worker orders honors ratios without disturbing manual commands',()=>{
 const workers=Array.from({length:12},(_,i)=>({
  t:0,k:'vil',hp:40,ld:false,retreating:false,o:i<9?'g':'i',
  ct:i===8?'f':i<8?'w':null,autoWorker:i<8?1:0,
  x:10,y:10,p:[],ret:0,rp:0,autoSkipNodes:[]
 }));
 const manual=workers[8];
 const world={vp:{enabled:true,f:1,w:1,g:0,s:0},t:30,us:workers,
  wt:new Uint8Array(32*32),ex:new Uint8Array(32*32).fill(1),nodes:[
   {k:'f',x:12,y:11,amt:100},{k:'w',x:12,y:12,amt:100}
  ]};
 const from=kingdom.indexOf('const WORKER_TARGETS=');
 const to=kingdom.indexOf('function changeVillagerTarget(',from);
 const context={S:world,W:32,H:32,note:()=>{},
  path:(_unit,goal)=>[[goal.x,goal.y]],goalNear:node=>({x:node.x,y:node.y}),
  createVillagerPriority:()=>({enabled:true,f:2,w:2,g:1,s:0})};
 const helpers=routing.slice(routing.indexOf('function farmAvailableTo(u,n){'),routing.indexOf('\nfunction dropoffKey('));
 assert.ok(helpers.includes('function knownResource('),'real resource visibility helper must be loaded');
 const api=vm.runInNewContext(helpers+'\n'+kingdom.slice(from,to)+
  '\n;({rebalanceVillagerPriorities,villagerAssignedCount})',context);
 const counts=()=>[api.villagerAssignedCount(0,'f'),api.villagerAssignedCount(0,'w')];
 api.rebalanceVillagerPriorities(0);
 assert.deepEqual(counts(),[6,6]);
 world.vp={enabled:true,f:20,w:20,g:0,s:0};
 api.rebalanceVillagerPriorities(0);
 assert.deepEqual(counts(),[6,6]);
 world.vp={enabled:true,f:3,w:1,g:0,s:0};
 api.rebalanceVillagerPriorities(0);
 assert.deepEqual(counts(),[9,3]);
 assert.equal(manual.ct,'f');
 assert.equal(manual.autoWorker,0);
});

test('R3 wheel previews scaled headcounts instead of misleading fixed counts',()=>{
 const source=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
 const begin=source.indexOf('function drawVillagerPriorityWheel()');
 const end=source.indexOf('function drawCg()',begin);
 assert.ok(begin>=0&&end>begin,'R3 wheel renderer must be present');
 const workers=Array.from({length:11},()=>({t:0,k:'vil',hp:40,ld:false,retreating:false}));
 const drawn=[];
 const context={
  S:{vp:{enabled:true,f:1,w:1,g:1,s:1},us:workers},
  CW:1280,CH:720,vpWheel:{manual:true,sel:0},
  X:new Proxy({}, {get:()=>()=>{},set:()=>true}),
  tx:(label)=>drawn.push(String(label))
 };
 vm.runInNewContext(kingdom.slice(start,finish)+
  '\n'+source.slice(begin,end)+'\n;drawVillagerPriorityWheel()',context);
 assert.ok(drawn.some(s=>s.includes('Targets: F 3 / W 3 / G 3 / S 2')));
 assert.ok(drawn.some(s=>s.includes('1 weight / 3 target')));
});
