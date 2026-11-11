import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.dravEval=code=>eval(code);',sandbox);
 const run=sandbox.dravEval;
 run("seedOv=371126;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=[37,0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.tc=addB(0,'tc',10,12,true);globalThis.bar=addB(0,'bar',18,12,true);globalThis.range=addB(0,'rng',27,12,true);globalThis.castle=addB(0,'castle',35,12,true);globalThis.dock=addB(0,'dock',45,12,true);globalThis.siege=addB(0,'siege',52,12,true)");
 return run;
}
const copy=(run,expr)=>JSON.parse(run('JSON.stringify('+expr+')'));

test('Dravidian stable ID, Castle Urumi line and distinct Dock Elite Thirisadai technology',()=>{
 const run=game();
 assert.equal(run('CIV.length'),41);
 assert.equal(run('CIV[36].n'),'Bohemians');
 assert.equal(run('CIV[37].n'),'Dravidians');
 assert.equal(run("trOf(castle).includes('urumi')"),true);
 assert.equal(run("trOf({k:'castle',t:1}).includes('urumi')"),false);
 for(const key of ['ut37','ut37p','eliteUrumi'])
  assert.equal(run("rsOf(castle).includes('"+key+"')"),true);
 assert.equal(run("trOf(dock).includes('thirisadai')"),true);
 assert.equal(run("trOf({k:'dock',t:1}).includes('thirisadai')"),false);
 assert.equal(run("rsOf(dock).includes('eliteThirisadai')"),true);
 assert.equal(run("rsOf({k:'dock',t:1}).includes('eliteThirisadai')"),false);
});

test('regional Elephant Archer is Castle-age Dravidian production, not global cavalry access',()=>{
 const run=game();
 assert.equal(run("trOf(range).includes('eled')"),true);
 assert.equal(run("trOf(range).includes('cavarch')"),false);
 assert.equal(run("trOf({k:'rng',t:1}).includes('eled')"),false);
 assert.equal(run("unitEffectiveAge(0,'eled')"),2);
 assert.equal(run("unitEffectiveAge(1,'eled')"),3);
 run('S.age[0]=1');
 assert.equal(run("train(range,'eled')"),false);
 run('S.age[0]=2');
 assert.equal(run("train(range,'eled')"),true);
 assert.equal(run('range.q[0].k'),'eled');
});

test('Dravidian Castle research offers paid Medical Corps, Wootz Steel and Elite Urumi',()=>{
 const run=game();
 run('S.age[0]=2');
 assert.equal(run("research(castle,'ut37p')"),false);
 assert.equal(run("research(castle,'ut37')"),true);
 assert.equal(run('S.res[0].f'),9700);
 assert.equal(run('S.res[0].g'),9800);
 run('upB(castle,TE.ut37.t+1)');
 assert.equal(run('S.tech[0].ut37'),1);
 assert.equal(run("research(castle,'ut37')"),false);
 run('S.age[0]=3');
 assert.equal(run("research(castle,'ut37p')"),true);
 run('upB(castle,TE.ut37p.t+1)');
 assert.equal(run('S.tech[0].ut37p'),1);
});

test('Dravidian Barracks technology and siege wood discounts flow into real paid queues',()=>{
 const run=game();
 const before=copy(run,"TE.man.cost");
 const reduced=copy(run,"researchCost(bar,'man')");
 assert.equal(reduced.f,Math.ceil(before.f/2));
 assert.equal(reduced.g,Math.ceil(before.g/2));
 assert.equal(copy(run,"researchCost({k:'bar',t:1},'man')").f,before.f);
 const siegeBase=copy(run,'U.ram.cost');
 const siegeCost=copy(run,"unitTrainingCost(0,'ram')");
 assert.equal(siegeCost.w,Math.ceil(siegeBase.w*2/3));
 assert.equal(copy(run,"unitTrainingCost(1,'ram')").w,siegeBase.w);
 const gold=run('S.res[0].g'),wood=run('S.res[0].w');
 assert.equal(run("train(siege,'ram')"),true);
 assert.equal(run('S.res[0].w'),wood-siegeCost.w);
 assert.equal(run('cancelQ(siege)'),true);
 assert.equal(run('S.res[0].w'),wood);
 assert.equal(run('S.res[0].g'),gold);
});

test('fishing workers carry extra resources but ordinary Dravidian farms do not',()=>{
 const run=game();
 assert.equal(run("gatherCapacity({k:'fish',t:0})"),25);
 assert.equal(run("gatherCapacity({k:'fish',t:1})"),10);
 assert.equal(run("gatherCapacity({k:'vil',t:0,tg:{k:'f',fm:0}})"),25);
 assert.equal(run("gatherCapacity({k:'vil',t:0,tg:{k:'f',fm:1}})"),10);
});

test('a real completed age advancement grants 200 wood exactly once and not to other teams',()=>{
 const run=game();
 run("S.age[0]=0;S.age[1]=0;globalThis.lumber=addB(0,'lumber',59,20,true);globalThis.mill=addB(0,'mill',64,20,true)");
 const wood=run('S.res[0].w');
 assert.equal(run("research(tc,'age')"),true);
 run('upB(tc,AG[1].t+1)');
 assert.equal(run('S.age[0]'),1);
 assert.equal(run('S.res[0].w'),wood+200);
 run('upB(tc,AG[1].t+1)');
 assert.equal(run('S.res[0].w'),wood+200);
});

test('living Docks add five population with Dravidian self or ally, never enemies',()=>{
 const run=game();
 assert.equal(run('capOf(0)'),15);
 run('S.civ[0]=0');
 assert.equal(run('capOf(0)'),10);
 run('S.civ[1]=37');
 assert.equal(run('capOf(0)'),10);
 run("setDiplomacy(0,1,'ally')");
 assert.equal(run('capOf(0)'),15);
 run('dock.hp=0');
 assert.equal(run('capOf(0)'),10);
});

test('Skirmishers and Elephant Archers fire 25% more frequently only for Dravidians',()=>{
 const run=game();
 for(const kind of ['skirm','eled']){
  const drav=run("attackReload({k:'"+kind+"',t:0})");
  const foreign=run("attackReload({k:'"+kind+"',t:1})");
  assert.ok(Math.abs(drav-foreign/1.25)<1e-8,kind);
 }
 assert.equal(run("attackReload({k:'scout',t:0})"),run("attackReload({k:'scout',t:1})"));
});

test('Medical Corps heals only researched living elephants and respects maximum HP',()=>{
 const run=game();
 run("globalThis.ele=addU(0,'eled',21,29);globalThis.foreign=addU(1,'eled',24,29);ele.hp=100;foreign.hp=100");
 const base=run('ele.hp');
 run('upU(ele,2)');
 assert.equal(run('ele.hp'),base);
 run('S.tech[0].ut37=1;upU(ele,2);upU(foreign,2)');
 assert.ok(Math.abs(run('ele.hp')-(base+1))<1e-8);
 assert.equal(run('foreign.hp'),100);
 run('ele.hp=mhp(ele)-.2;upU(ele,10)');
 assert.equal(run('ele.hp'),run('mhp(ele)'));
});

test('Wootz Steel melee hits ignore unit armour after Imperial research only',()=>{
 const run=game();
 run("globalThis.attacker=addU(0,'urumi',21,29);globalThis.enemy=addU(1,'knight',22,29);enemy.hp=600");
 const hit=()=>run("(()=>{enemy.hp=600;dmgT(attacker,enemy);return 600-enemy.hp})()");
 const ordinary=hit();
 run('S.tech[0].ut37p=1');
 const steel=hit();
 assert.equal(steel-ordinary,run("combatArmor(enemy,'m')"));
 run('S.civ[0]=0');
 assert.equal(hit(),ordinary);
});

test('Urumi charged attack hits nearby hostile units once, with no fake-attacker exploit',()=>{
 const run=game();
 run("globalThis.att=addU(0,'urumi',20,29);globalThis.primary=addU(1,'mil',21,29);globalThis.close=addU(1,'mil',21.5,29);globalThis.friend=addU(0,'mil',21.25,29);for(const v of [primary,close,friend])v.hp=600;S.t=30;att.urumiReadyAt=29");
 run('dmgT(att,primary)');
 assert.ok(run('close.hp')<600);
 assert.equal(run('friend.hp'),600);
 const afterFirst=run('att.urumiReadyAt');
 assert.ok(afterFirst>run('S.t'));
 run('close.hp=600;primary.hp=600;dmgT(att,primary)');
 assert.equal(run('close.hp'),600);
 run("dmgT({k:'urumi',t:0,x:20,y:29,urumiReadyAt:0},primary)");
 assert.equal(run('close.hp'),600);
});

test('Thirisadai projectiles use three actual ballistic paths and Elite is a paid Dock upgrade',()=>{
 const run=game();
 run("globalThis.ship=addU(0,'thirisadai',21,30);globalThis.foeShip=addU(1,'gal',26,30);S.pj=[]");
 run('launchProjectile(ship,foeShip)');
 assert.equal(run('S.pj.length'),3);
 assert.equal(run("S.pj.every(p=>p.a.k==='thirisadai'&&p.t===foeShip)"),true);
 const previous=run('ship.hp');
 assert.equal(run("research(dock,'eliteThirisadai')"),true);
 run('upB(dock,TE.eliteThirisadai.t+1)');
 assert.equal(run('S.tech[0].eliteThirisadai'),1);
 assert.equal(run('ship.hp'),previous+65);
 assert.equal(run('S.tech[0].atkb.thirisadai'),3);
 run('S.civ[0]=0');
 assert.equal(run("rsOf(dock).includes('eliteThirisadai')"),false);
});

test('current-build saves retain Dravidian ships, charged Urumi state and research',()=>{
 const run=game();
 run("globalThis.ship=addU(0,'thirisadai',21,30);globalThis.sword=addU(0,'urumi',24,30);sword.urumiReadyAt=35;S.tech[0].ut37=1;S.tech[0].ut37p=1");
 assert.equal(run("saveG(false,'dravidians_current_build')"),true);
 run('S.civ[0]=0;S.us=[];S.bs=[];S.tech[0]={}');
 assert.equal(run("loadG(false,'dravidians_current_build')"),true);
 assert.equal(run('S.civ[0]'),37);
 assert.equal(run("S.us.some(u=>u.k==='thirisadai'&&u.t===0)"),true);
 assert.equal(run("S.us.some(u=>u.k==='urumi'&&u.urumiReadyAt===35)"),true);
 assert.equal(run('S.tech[0].ut37p'),1);
});
