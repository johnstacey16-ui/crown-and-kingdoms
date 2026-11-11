import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.bohemEval=code=>eval(code);',sandbox);
 const run=sandbox.bohemEval;
 run("seedOv=361126;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=[36,0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.tc=addB(0,'tc',10,12,true);globalThis.siege=addB(0,'siege',18,12,true);globalThis.castle=addB(0,'castle',27,12,true);globalThis.range=addB(0,'rng',36,12,true);globalThis.univ=addB(0,'univ',45,12,true);globalThis.mine=addB(0,'mine',53,12,true);globalThis.mon=addB(0,'monastery',60,12,true)");
 return run;
}
const copy=(run,expr)=>JSON.parse(run('JSON.stringify('+expr+')'));

test('Bohemian ID 36 preserves the 36 prior civilizations and owns its Castle upgrades',()=>{
 const run=game();
 assert.equal(run('CIV.length'),38);
 assert.equal(run('CIV[35].n'),'Poles');
 assert.equal(run('CIV[36].uu'),'husswagon');
 assert.equal(run("trOf(castle).includes('husswagon')"),true);
 for(const key of ['ut36','ut36p','eliteHussiteWagon']){
  assert.equal(run("rsOf(castle).includes('"+key+"')"),true);
  assert.equal(run("rsOf({k:'castle',t:1}).includes('"+key+"')"),false);
 }
 assert.equal(run("rsOf(siege).includes('houfniceUpgrade')"),true);
 assert.equal(run("rsOf({k:'siege',t:1}).includes('houfniceUpgrade')"),false);
});

test('Bohemian Blacksmith, University and Monastery discounts use shared construction prices',()=>{
 const run=game();
 for(const kind of ['smith','univ','monastery']){
  const full=copy(run,'B.'+kind+'.cost'),discount=copy(run,"civilizationBuildingCost('"+kind+"',0)");
  assert.equal(discount.w,full.w-100);
  assert.equal(copy(run,"civilizationBuildingCost('"+kind+"',1)").w,full.w);
 }
 assert.equal(copy(run,"civilizationBuildingCost('house',0)").w,run('B.house.cost.w'));
});

test('Bohemian Castle Age unlocks Hand Cannoneers and Chemistry with ordinary paid queues',()=>{
 const run=game();
 assert.equal(run("unitEffectiveAge(0,'hcan')"),2);
 assert.equal(run("unitEffectiveAge(1,'hcan')"),3);
 assert.equal(run("researchEffectiveAge(univ,'chem')"),2);
 run('S.age[0]=2;S.age[1]=2');
 assert.equal(run("train(range,'hcan')"),true);
 assert.equal(run('range.q[0].k'),'hcan');
 assert.equal(run("research(univ,'chem')"),true);
 assert.equal(run("researchEffectiveAge({k:'univ',t:1},'chem')"),3);
});

test('Bohemian Mining Camp technologies cost no resources but are researched normally',()=>{
 const run=game();
 assert.deepEqual(copy(run,"researchCost(mine,'gmine')"),{});
 const before=copy(run,'S.res[0]');
 assert.equal(run("research(mine,'gmine')"),true);
 assert.deepEqual(copy(run,'S.res[0]'),before);
 run('upB(mine,TE.gmine.t+1)');
 assert.equal(run('S.tech[0].gmine'),1);
 assert.deepEqual(copy(run,"researchCost({k:'mine',t:1},'gmine')"),copy(run,'TE.gmine.cost'));
});

test('Wagenburg research speeds Bohemian gunpowder but not ordinary cavalry or foreign units',()=>{
 const run=game();
 const wagon=run("unitSpeed({k:'husswagon',t:0})");
 const foreign=run("unitSpeed({k:'husswagon',t:1})");
 assert.equal(wagon,foreign);
 run('S.tech[0].ut36=1');
 assert.ok(Math.abs(run("unitSpeed({k:'husswagon',t:0})")-wagon*1.1)<1e-8);
 assert.equal(run("unitSpeed({k:'scout',t:0})"),run("unitSpeed({k:'scout',t:1})"));
 assert.equal(run("unitSpeed({k:'husswagon',t:1})"),foreign);
});

test('Hussite Reforms make Monk training and Monastery research gold-funded costs food-funded',()=>{
 const run=game();
 assert.deepEqual(copy(run,"unitTrainingCost(0,'mon')"),{g:100});
 run('S.tech[0].ut36p=1');
 assert.deepEqual(copy(run,"unitTrainingCost(0,'mon')"),{f:100});
 assert.deepEqual(copy(run,"unitTrainingCost(1,'mon')"),{g:100});
 const base=copy(run,'TE.fervor.cost');
 const shifted=copy(run,"researchCost(mon,'fervor')");
 assert.equal(shifted.g,undefined);
 assert.equal(shifted.f,(base.f||0)+(base.g||0));
 assert.equal(run("train(mon,'mon')"),true);
 assert.equal(run('S.res[0].f'),9900);
 assert.equal(run('S.res[0].g'),10000);
 assert.equal(run('cancelQ(mon)'),true);
});

test('Houfnice upgrade requires Chemistry, upgrades living Bombards and queued cannons once',()=>{
 const run=game();
 assert.equal(run("trOf(siege).includes('houfnice')"),false);
 assert.equal(run("research(siege,'houfniceUpgrade')"),false);
 run('S.tech[0].chem=1');
 run("globalThis.bombard=addU(0,'bomb',20,26);globalThis.second=addB(0,'siege',44,32,true);second.q=[{k:'bomb',t:500}]");
 assert.equal(run("research(siege,'houfniceUpgrade')"),true);
 run('upB(siege,TE.houfniceUpgrade.t+1)');
 assert.equal(run('S.tech[0].houfniceUpgrade'),1);
 assert.equal(run('bombard.k'),'houfnice');
 assert.equal(run('second.q[0].k'),'houfnice');
 assert.equal(run("trOf(siege).includes('houfnice')"),true);
 assert.equal(run("trOf(siege).includes('bomb')"),false);
 assert.equal(run("trOf({k:'siege',t:1}).includes('houfnice')"),false);
});

test('Bohemian spears receive extra cavalry damage and Sanctity improves living Villagers',()=>{
 const run=game();
 const target="{k:'knight',t:1}";
 const bonus=run("spearLineBonus({k:'spear',t:0},"+target+")");
 const foreign=run("spearLineBonus({k:'spear',t:1},{k:'knight',t:0})");
 assert.equal(bonus,Math.round(foreign*1.25));
 run("globalThis.vill=addU(0,'vil',21,30)");
 const oldHp=run('vill.hp');
 assert.equal(run("research(mon,'sanctity')"),true);
 run('upB(mon,TE.sanctity.t+1)');
 assert.equal(run('vill.hp'),oldHp+15);
 assert.equal(run('S.tech[0].hpb.vil'),15);
});

test('a real intervening Hussite Wagon halves ranged damage to its ally only',()=>{
 const run=game();
 run("globalThis.archer=addU(1,'arc',10.5,26.5);globalThis.wagon=addU(0,'husswagon',12.5,26.5);globalThis.protected=addU(0,'mil',14.5,26.5);protected.hp=700");
 assert.equal(run('hussiteWagonCover(archer,protected)'),true);
 const damaged=()=>run('(()=>{protected.hp=700;dmgT(archer,protected);return 700-protected.hp})()');
 const covered=damaged();
 run('wagon.hp=0');
 const normal=damaged();
 assert.ok(covered<normal,'only the standing wagon grants cover');
 run('wagon.hp=U.husswagon.hp;S.civ[0]=0');
 assert.equal(damaged(),normal,'foreign factions do not inherit wagon cover');
});

test('current-build save retains Bohemian research, upgraded Houfnice and the Hussite Wagon',()=>{
 const run=game();
 run("globalThis.wagon=addU(0,'husswagon',20,28);globalThis.cannon=addU(0,'houfnice',23,28);S.tech[0].houfniceUpgrade=1;S.tech[0].ut36p=1");
 assert.equal(run("saveG(false,'bohemian_current_build')"),true);
 run('S.civ[0]=0;S.us=[];S.bs=[];S.tech[0]={}');
 assert.equal(run("loadG(false,'bohemian_current_build')"),true);
 assert.equal(run('S.civ[0]'),36);
 assert.equal(run("S.us.some(u=>u.k==='husswagon'&&u.t===0)"),true);
 assert.equal(run("S.us.some(u=>u.k==='houfnice'&&u.t===0)"),true);
 assert.equal(run('S.tech[0].houfniceUpgrade'),1);
});


test('Monastery preview prices use supplied Hussite Reforms research ledger',()=>{
 const run=game();
 const get=world=>copy(run,"technologyTreeModel(0,"+world+").buildings.find(b=>b.id==='monastery').units.find(u=>u.id==='mon').cost");
 assert.equal(get('S').g,100);
 const shifted=get("{civ:[36,0],tech:[{ut36p:1},{}],age:[3,3]}");
 assert.deepEqual(shifted,{f:100});
 assert.equal(run('S.tech[0].ut36p'),undefined);
});
