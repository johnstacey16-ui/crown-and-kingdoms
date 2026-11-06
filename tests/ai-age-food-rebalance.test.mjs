import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const policy=readFileSync(new URL('../js/ai-economy.js',import.meta.url),'utf8');
const start=policy.indexOf('function aiRebal(vil,R,t=1){');
assert.ok(start>=0,'production AI rebalancing can be evaluated');

function scenario({age=0,ready=true,food=100,wood=400,foragers=6,workers=16}={}){
 const S={age:[age,age],nodes:[{k:'f',x:12,y:12,amt:200,an:0,fi:0},{k:'w',x:12,y:13,amt:100,an:0,fi:0}],
  wt:new Uint8Array(40*40)};
 const villagers=Array.from({length:workers},(_,i)=>({
  k:'vil',hp:25,t:1,x:10+i*.12,y:10,o:'g',ct:i<foragers?'f':i<11?'g':'w',
  car:0,ret:0,ld:false,aiEvac:false,retreating:false
 }));
 let attempted=0;
 const h=vm.runInNewContext(policy.slice(start)+'\n;aiRebal;',{
  S,AG:[{}, {cost:{f:500}},{cost:{f:800,g:200}},{cost:{f:1000,g:800}}],W:40,H:40,
  PERS:[{tw:0,wl:0}],aip:0,
  ageRequirements:()=>({ready}),
  resourceHasWorksite:()=>true,
  goalNear:n=>n,
  path:()=>{attempted++;return [[11.5,11.5],[12.5,12.5]]}
 });
 h(villagers,{f:food,w:wood,g:200,s:0},1);
 return {villagers,attempted};
}

test('AI redirects miners to food when Dark Age prerequisites are ready',()=>{
 const {villagers,attempted}=scenario();
 assert.equal(villagers.filter(u=>u.ct==='f').length,7);
 assert.equal(villagers.filter(u=>u.ct==='g').length,4);
 assert.equal(attempted,1,'a single verifiable route is chosen per rebalancing tick');
});

test('AI does not steal economy workers without prerequisites or when aging is affordable',()=>{
 for(const inputs of [{ready:false},{food:500},{age:1}]){
  const {villagers}=scenario(inputs);
  assert.equal(villagers.filter(u=>u.ct==='f').length,6);
 }
});

test('Feudal-age AI rebuilds missing wood economy after spending on advancement',()=>{
 const h=scenario({age:1,wood:10,food:65});
 assert.equal(h.villagers.filter(u=>u.ct==='w').length,6);
 assert.equal(h.villagers.filter(u=>u.ct==='g').length,4);
 assert.equal(h.attempted,1);
});

test('Feudal AI relocates spare miners to food when prepared to save for Castle Age',()=>{
 const h=scenario({age:1,workers:24,foragers:6,food:250,wood:400});
 assert.equal(h.villagers.filter(u=>u.ct==='f').length,7);
 assert.equal(h.villagers.filter(u=>u.ct==='g').length,4);
 assert.equal(h.attempted,1,'save phase routes one reachable worker at a time');
});

test('Castle Age AI redirects a spare miner to fund Imperial advancement',()=>{
 const h=scenario({age:2,workers:24,foragers:6,food:250,wood:400});
 assert.equal(h.villagers.filter(u=>u.ct==='f').length,7);
 assert.equal(h.villagers.filter(u=>u.ct==='g').length,4);
 assert.equal(h.attempted,1);
});


test('Imperial saving keeps its prerequisites, workforce and food-budget gates',()=>{
 for(const input of [{ready:false},{workers:23},{food:1000},{foragers:14},{age:3}]){
  const args={age:2,workers:24,foragers:6,food:250,wood:400,...input};
  const h=scenario(args);assert.equal(h.villagers.filter(u=>u.ct==='f').length,args.foragers);
  assert.equal(h.attempted,0);
 }
});

test('a Castle economy harvests the Imperial food budget and completes paid advancement',async()=>{
 const {headlessGame}=await import('./helpers/headless-game.mjs');
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+`;globalThis.run=code=>eval(code);
 kingdoms=2;start();S.us=[];S.bs=[];S.nodes=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.age[1]=2;S.res[1]={f:250,w:400,g:800,s:0};
 globalThis.home=addB(1,'tc',20,20,true);addB(1,'castle',25,25,true);
 globalThis.workers=[];globalThis.food=[];
 for(let i=0;i<24;i++){
  const n=addN('f',12+i%6,12+(i/6|0),500);food.push(n);
  const u=addU(1,'vil',18.5+i%3,17.5+(i/3|0)*.1);workers.push(u);
  u.o='g';u.ct=i<6?'f':i<15?'g':'w';u.tg=i<6?n:null;u.car=u.ret=0;
 }
 globalThis.shifted=0;
 for(let i=0;i<30;i++){
  const before=workers.filter(u=>u.ct==='f').length;aiRebal(workers,S.res[1],1);shifted+=workers.filter(u=>u.ct==='f').length-before;
 }
 globalThis.fundingTicks=0;
 for(;fundingTicks<10800&&S.res[1].f<1000;fundingTicks++)for(const u of workers.filter(u=>u.ct==='f'))upU(u,1/30);
 globalThis.funded=S.res[1].f>=1000;globalThis.goldBefore=S.res[1].g;
 globalThis.ordered=research(home,'age');globalThis.foodAfter=S.res[1].f;globalThis.goldAfter=S.res[1].g;
 for(let i=0;i<6000&&S.age[1]===2;i++)upB(home,1/30);
 `,sandbox);
 assert.equal(sandbox.run('shifted'),8,'the food workforce rises from six to fourteen');
 assert.equal(sandbox.run('funded'),true,'real gathering and deliveries supply the food within six simulated minutes');
 assert.equal(sandbox.run('ordered'),true);assert.ok(sandbox.run('foodAfter')<10);
 assert.equal(sandbox.run('goldBefore-goldAfter'),800,'Imperial advancement pays its real gold cost');
 assert.equal(sandbox.run('S.age[1]'),3);
});
