import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(civ){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.inspect=code=>eval(code);',sandbox);
 const run=sandbox.inspect;
 run("seedOv=441126;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=["+civ+",0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.rel=[];S.nodes=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.bar=addB(0,'bar',12,12,true);globalThis.church=addB(0,'fchurch',23,12,true);globalThis.smith=addB(0,'smith',34,12,true)");
 return run;
}
test('Fortified Church has its own cost, age and restricted construction access',()=>{
 const a=game(41),g=game(42),foreign=game(0);
 assert.equal(a("B.fchurch.cost.w"),200);
 assert.equal(a("B.fchurch.bt"),50);
 assert.equal(a("B.fchurch.hp"),2400);
 assert.equal(a("B.fchurch.age"),2);
 assert.equal(a("civilizationBuildingAllowed('fchurch',0)"),true);
 assert.equal(g("civilizationBuildingAllowed('fchurch',0)"),true);
 assert.equal(foreign("civilizationBuildingAllowed('fchurch',0)"),false);
 assert.equal(a("civilizationBuildingAllowed('monastery',0)"),false);
 assert.equal(g("civilizationBuildingAllowed('monastery',0)"),false);
 assert.equal(foreign("civilizationBuildingAllowed('monastery',0)"),true);
 assert.equal(a("GAR.fchurch"),10);
});
test('Fortified Church trains and researches like an age-locked Monastery',()=>{
 const run=game(41),g=game(42);
 assert.equal(run("trOf(church).includes('mon')"),true);
 assert.equal(run("trOf(church).includes('warpriest')"),true);
 assert.equal(g("trOf(church).includes('warpriest')"),false);
 assert.equal(run("trOf({k:'monastery',t:1}).includes('warpriest')"),false);
 assert.equal(run("rsOf(church).includes('sanctity')"),true);
 assert.equal(run("train(church,'warpriest')"),true);
 assert.equal(run("church.q.at(-1).k"),'warpriest');
 assert.equal(g("train(church,'warpriest')"),false);
});
test('Real church qualifies for Imperial advancement and resource dropoff stays excluded',()=>{
 const run=game(41);
 run("S.age[0]=2;S.bs=S.bs.filter(b=>b===bar||b===church)");
 assert.equal(run("ageRequirements(0).count"),1);
 run("globalThis.siege=addB(0,'siege',40,12,true)");
 assert.equal(run("ageRequirements(0).ready"),true);
 assert.equal(run("dropoffCompatible({t:0,ct:'w',sh:false},church)"),false);
});
test('Relic return orders can target the Church and relic income uses shared building ticks',()=>{
 const run=game(41);
 run("globalThis.monk=addU(0,'mon',22,14);globalThis.relic={rl:1,x:22,y:14,c:monk,m:null};S.rel=[relic];monk.rel=relic;monk.o='r';monk.tg=church");
 run("upU(monk,0.1)");
 assert.equal(run("relic.m===church"),true);
 assert.equal(run("monk.rel===null"),true);
 const before=run('S.res[0].g');
 run("upB(church,2)");
 assert.equal(run('S.res[0].g'),before+1);
});
test('Empty Churches cannot fire; villagers and relics produce defensive volleys',()=>{
 const run=game(42);
 run("globalThis.target=addU(1,'mil',27,14);globalThis.shots=0;launchProjectile=()=>shots++;foe=()=>target;church.cd=0");
 run("upB(church,1)");
 assert.equal(run('shots'),0);
 run("globalThis.villager=addU(0,'vil',22,13);villager.ld=church;church.cg=[villager];church.cd=0;upB(church,1)");
 assert.equal(run('shots'),1);
 run("S.rel=[{rl:1,c:null,m:church},{rl:1,c:null,m:church}];church.cd=0;upB(church,1)");
 assert.equal(run('shots'),4);
});
test('Only completed friendly Georgian churches boost nearby villagers',()=>{
 const run=game(42);
 run("globalThis.villager=addU(0,'vil',24,14);globalThis.far=addU(0,'vil',70,65);globalThis.foreign=addU(1,'vil',24,14)");
 assert.equal(run('georgianChurchWorkRate(villager)'),1.1);
 assert.equal(run('georgianChurchWorkRate(far)'),1);
 assert.equal(run('georgianChurchWorkRate(foreign)'),1);
 run("globalThis.node={k:'w'};globalThis.fast=gm(villager,node);church.hp=0");
 assert.equal(run('georgianChurchWorkRate(villager)'),1);
 assert.ok(run('fast')>run('gm(villager,node)'));
});
