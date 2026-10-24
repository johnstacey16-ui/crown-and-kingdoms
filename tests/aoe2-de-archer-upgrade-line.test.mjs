import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const {U,TE,B}=vm.runInNewContext(
 readFileSync(new URL('../js/config.js',import.meta.url),'utf8')+'\n;({U,TE,B})'
);
const asJSON=x=>JSON.parse(JSON.stringify(x));
const references={
 crossbow:'https://ageofempires.fandom.com/wiki/Crossbowman_(Age_of_Empires_II)',
 arbalester:'https://ageofempires.fandom.com/wiki/Arbalester',
 upgrade:'https://ageofempires.fandom.com/wiki/Upgrade_(Age_of_Empires_II)',
 official:'https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-preview-125283/'
};

test('patch-pinned DE Archer -> Crossbowman -> Arbalester unit and research values',()=>{
 assert.equal(Object.keys(references).length,4);
 for(const [k,stats] of [
  ['arc',{hp:30,dmg:4,rng:4,sp:.96,cd:2,t:35,cost:{w:25,g:45}}],
  ['xbow',{hp:35,dmg:5,rng:5,sp:.96,cd:2,t:27,cost:{w:25,g:45}}]
 ]){
  for(const [field,value] of Object.entries(stats))
   assert.deepEqual(asJSON(U[k][field]),value,k+' '+field);
  assert.equal(U[k].bn.spear,3,k+' counter to Spearman');
 }
 for(const [name,cost,duration,age,pre] of [
  ['xbow',{f:175,g:100},35,2,undefined],
  ['arb',{f:450,g:350},50,3,'xbow']
 ]){
  assert.deepEqual(asJSON(TE[name].cost),cost);
  assert.equal(TE[name].t,duration);
  assert.equal(TE[name].age,age);
  assert.equal(TE[name].pre,pre);
 }
 assert.deepEqual(asJSON(TE.arb.hpb),{xbow:5});
 assert.deepEqual(asJSON(TE.arb.atkb),{xbow:1});
 assert.equal(B.rng.rs.includes('xbow'),true);
 assert.equal(B.rng.rs.includes('arb'),true);
});

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.runInNewContext(source+`
  seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;start();
  snd=0;S.us=[];S.bs=[];S.pj=[];S.g.fill(0);S.gt.fill(0);
  S.tech[0]={};S.tech[1]={};S.age[0]=1;S.age[1]=1;
  for(const r of S.res){r.f=r.w=r.g=r.s=10000;}
  globalThis.testEval=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.testEval(code);
}

test('range trains Archers before researching Crossbowman, not instant free Crossbowmen',()=>{
 const c=fixture();
 c("globalThis.range=addB(0,'rng',12,12,true);globalThis.castle=addB(0,'castle',22,22,true)");
 assert.equal(c("JSON.stringify(trOf(range))").includes('xbow'),false);
 assert.equal(c("trOf(range).includes('arc')"),true);
 assert.equal(c("train(range,'xbow')"),false);
 assert.equal(c("trOf(castle).includes('xbow')"),false);
 assert.equal(c("research(range,'xbow')"),false,'Castle Age is necessary');
 c('S.age[0]=2');
 assert.equal(c("train(range,'arc')"),true);
 assert.equal(c("range.q[0].t"),35,'Archer trains in 35 seconds');
});

test('Crossbowman research transforms existing fielded and queued Archers without changing IDs or owner',()=>{
 const c=fixture();
 c("globalThis.range=addB(0,'rng',12,12,true);globalThis.otherRange=addB(0,'rng',22,22,true);globalThis.enemyRange=addB(1,'rng',32,32,true)");
 c("globalThis.archer=addU(0,'arc',20.5,20.5);globalThis.enemy=addU(1,'arc',25.5,25.5);archer.hp=24;archer.o='a';archer.tg=enemy;otherRange.q.push({k:'arc',t:32})");
 const id=c('archer.netId'),archerRef=c('archer'),beforeCost=c('S.res[0].f'),beforeGold=c('S.res[0].g');
 c('S.age[0]=2');
 assert.equal(c("research(range,'xbow')"),true);
 assert.equal(c('S.res[0].f'),beforeCost-175);
 assert.equal(c('S.res[0].g'),beforeGold-100);
 assert.equal(c('range.rs.t'),35);
 assert.equal(c("research(otherRange,'xbow')"),false,'same technology cannot research twice');
 c('upB(range,35)');
 assert.equal(c('S.tech[0].xbow'),1);
 assert.equal(c('archer.k'),'xbow');
 assert.equal(c('archer.netId'),id);
 assert.equal(c('archer===S.us.find(u=>u.netId===archer.netId)'),true);
 assert.equal(c('archer.hp'),29,'damage deficit remains constant on +5 HP upgrade');
 assert.equal(c('archer.tg===enemy'),true,'existing target/order survives promotion');
 assert.equal(c('enemy.k'),'arc','opposing team not affected');
 assert.equal(c('otherRange.q[0].k'),'xbow','queued archers transform');
 assert.equal(c('otherRange.q[0].t'),27,'queued training time shortens on upgrade');
 assert.equal(c("trOf(range).includes('arc')"),false);
 assert.equal(c("trOf(range).includes('xbow')"),true);
 assert.equal(c("train(range,'arc')"),false);
 assert.equal(c("train(range,'xbow')"),true);
 assert.equal(c('range.q[0].t'),27);
 assert.equal(c('U.xbow.cost.w'),25);
 assert.equal(c('U.xbow.cost.g'),45);
 assert.equal(archerRef.k,'xbow','same unit object is upgraded in place');
});

test('Arbalester requires researched Crossbowman + Imperial Age and upgrades existing Crossbowmen',()=>{
 const c=fixture();
 c("globalThis.range=addB(0,'rng',12,12,true);globalThis.archer=addU(0,'arc',18.5,18.5);globalThis.spear=addU(1,'spear',21.5,18.5)");
 c('S.age[0]=3');
 assert.equal(c("research(range,'arb')"),false,'cannot skip Crossbowman research');
 c("research(range,'xbow');upB(range,35)");
 const dmg=()=>{c('spear.hp=1000;dmgT(archer,spear)');return 1000-c('spear.hp')};
 assert.equal(c('archer.k'),'xbow');
 assert.equal(c('mhp(archer)'),35);
 assert.equal(dmg(),8,'Crossbowman has 5 attack and +3 vs Spearmen');
 assert.equal(c('attackRange(archer)'),5);
 const food=c('S.res[0].f'),gold=c('S.res[0].g');
 assert.equal(c("research(range,'arb')"),true);
 assert.equal(c('S.res[0].f'),food-450);
 assert.equal(c('S.res[0].g'),gold-350);
 c('upB(range,50)');
 assert.equal(c('S.tech[0].arb'),1);
 assert.equal(c('unitName("xbow",0)'),'Arbalester');
 assert.equal(c('mhp(archer)'),40);
 assert.equal(c('archer.hp'),40,'existing healthy Crossbowman gains five HP');
 assert.equal(dmg(),9,'Arbalester has 6 attack and +3 vs Spearmen');
 assert.equal(c('attackRange(archer)'),5,'Arbalester does not gain another base range');
 assert.equal(c('unitSpeed(archer)'),.96);
 assert.equal(c('U.xbow.t'),27);
});

test('Fletching, Bodkin Arrow and Bracer extend upgraded archer-line attack and range',()=>{
 const c=fixture();
 c("globalThis.archer=addU(0,'arc',18.5,18.5);globalThis.enemy=addU(1,'mil',24.5,18.5)");
 c('S.age[0]=2;globalThis.range=addB(0,"rng",12,12,true);research(range,"xbow");upB(range,35)');
 for(const [flags,value] of [
  [{},0],
  [{atkR:1},1],
  [{atkR:1,bodkin:1},2],
  [{atkR:1,bodkin:1,atkR2:1},3]
 ]){
  c('S.tech[0].atkR=0;S.tech[0].bodkin=0;S.tech[0].atkR2=0');
  for(const [k,v] of Object.entries(flags))c('S.tech[0].'+k+'='+v);
  assert.equal(c('arrowBonus(archer)'),value);
  assert.equal(c('attackRange(archer)'),5+value);
  c('enemy.hp=1000;dmgT(archer,enemy)');
  assert.equal(1000-c('enemy.hp'),4+value,'1 base pierce armor on Militia');
 }
});
