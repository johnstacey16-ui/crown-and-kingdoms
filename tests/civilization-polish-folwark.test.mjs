import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.polishEval=code=>eval(code);',sandbox);
 const run=sandbox.polishEval;
 run("seedOv=351126;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=[35,0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.tc=addB(0,'tc',10,12,true);globalThis.bar=addB(0,'bar',18,12,true);globalThis.stable=addB(0,'stable',27,12,true);globalThis.castle=addB(0,'castle',35,12,true)");
 return run;
}
const copy=(run,expr)=>JSON.parse(run('JSON.stringify('+expr+')'));

test('Polish ID 35, Obuch, Castle upgrades and Folwark access are faction locked',()=>{
 const run=game();
 assert.equal(run('CIV.length'),37);
 assert.equal(run('CIV[34].n'),'Sicilians');
 assert.equal(run('CIV[35].uu'),'obuch');
 assert.ok(run("trOf(castle).includes('obuch')"));
 for(const key of ['ut35','ut35p','eliteObuch']){
  assert.ok(run("rsOf(castle).includes('"+key+"')"));
  assert.equal(run("rsOf({k:'castle',t:1}).includes('"+key+"')"),false);
 }
 assert.equal(run("civilizationBuildingAllowed('folwark',0)"),true);
 assert.equal(run("civilizationBuildingAllowed('folwark',1)"),false);
 assert.equal(run("civilizationBuildingAllowed('mill',0)"),false);
 const polish=copy(run,'technologyTreeModel(0,S)').buildings;
 assert.ok(polish.some(b=>b.id==='folwark'));
 assert.ok(!polish.some(b=>b.id==='mill'));
});

test('completed Polish Folwarks provide five population, food dropoff and Feudal building progress',()=>{
 const run=game();
 assert.equal(run('capOf(0)'),10);
 run("globalThis.fol=addB(0,'folwark',45,24,true)");
 assert.equal(run('capOf(0)'),15);
 assert.equal(run("dropoffCompatible({t:0,ct:'f',sh:false},fol)"),true);
 run('S.age[0]=0');
 assert.equal(run('ageRequirements(0).count'),1);
 run('fol.hp=0');
 assert.equal(run('capOf(0)'),10);
 assert.equal(run("dropoffCompatible({t:0,ct:'f',sh:false},fol)"),false);
});

test('Folwark food awards exactly once on nearby new owned farms, never on distant or unfinished sites',()=>{
 const run=game();
 run("globalThis.fol=addB(0,'folwark',42,24,true)");
 const before=run('S.res[0].f');
 run("globalThis.farm=addN('f',45,25,175,1);farm.t=0");
 assert.equal(run('grantFolwarkFarmFood(farm,0)'),18);
 assert.equal(run('grantFolwarkFarmFood(farm,0)'),0);
 assert.equal(run('S.res[0].f'),before+18);
 run("globalThis.far=addN('f',62,40,175,1);far.t=0");
 assert.equal(run('grantFolwarkFarmFood(far,0)'),0);
 run('fol.done=false');
 run("globalThis.unbuilt=addN('f',45,28,175,1);unbuilt.t=0");
 assert.equal(run('grantFolwarkFarmFood(unbuilt,0)'),0);
});

test('Szlachta Knight discount uses the correct live price and refunds pre-research payment',()=>{
 const run=game();
 assert.equal(copy(run,"unitTrainingCost(0,'knight')").g,75);
 const initial=run('S.res[0].g');
 assert.equal(run("train(stable,'knight')"),true);
 assert.equal(run('S.res[0].g'),initial-75);
 run('S.tech[0].ut35=1');
 assert.equal(copy(run,"unitTrainingCost(0,'knight')").g,30);
 assert.equal(run('cancelQ(stable)'),true);
 assert.equal(run('S.res[0].g'),initial);
 assert.equal(run("train(stable,'knight')"),true);
 assert.equal(run('stable.q[0].paidCost.g'),30);
 assert.equal(run('S.res[0].g'),initial-30);
 assert.equal(run('cancelQ(stable)'),true);
 assert.equal(run('S.res[0].g'),initial);
 assert.equal(copy(run,"unitTrainingCost(1,'knight')").g,75);
});

test('Polish Bloodlines and Scout-line research halve food while ordinary teams retain full prices',()=>{
 const run=game();
 for(const key of ['blood','lcav','huss']){
  const normal=run('TE.'+key+'.cost.f');
  assert.equal(copy(run,"researchCost({k:'stable',t:0},'"+key+"')").f,Math.ceil(normal/2));
  assert.equal(copy(run,"researchCost({k:'stable',t:1},'"+key+"')").f,normal);
 }
});

test('Winged Hussar is legal for Poles and Lithuanians only after Hussar, with normal paid queues',()=>{
 const run=game();
 assert.equal(run("trOf(stable).includes('winged')"),false);
 assert.equal(run("train(stable,'winged')"),false);
 run('S.tech[0].huss=1');
 assert.equal(run("trOf(stable).includes('winged')"),true);
 assert.equal(run("trOf(stable).includes('scout')"),false);
 assert.equal(run("train(stable,'winged')"),true);
 assert.equal(run('stable.q[0].k'),'winged');
 run('S.civ[1]=32;S.tech[1].huss=1');
 assert.equal(run("trOf({k:'stable',t:1}).includes('winged')"),true);
 run('S.civ[1]=0');
 assert.equal(run("trOf({k:'stable',t:1}).includes('winged')"),false);
});

test('real Obuch attacks strip persistent defence without foreign or off-roster effects',()=>{
 const run=game();
 run("globalThis.att=addU(0,'obuch',21,26);globalThis.target=addU(1,'knight',22,26);target.hp=700");
 const first=run("combatArmor(target,'m')");
 assert.ok(first>0);
 run('dmgT(att,target)');
 assert.equal(run('target.obuchArmorShred'),1);
 assert.equal(run("combatArmor(target,'m')"),first-1);
 run('dmgT(att,target)');
 assert.equal(run('target.obuchArmorShred'),2);
 assert.equal(run("combatArmor(target,'m')"),0);
 run('S.civ[0]=0;dmgT(att,target)');
 assert.equal(run('target.obuchArmorShred'),2);
 run('S.civ[0]=35;dmgT({k:"obuch",t:0},target)');
 assert.equal(run('target.obuchArmorShred'),2);
});

test('Lechitic Legacy strikes nearby enemies only after actual researched Scout combat',()=>{
 const run=game();
 run("globalThis.att=addU(0,'scout',24,28);globalThis.primary=addU(1,'mil',25,28);globalThis.close=addU(1,'mil',25.45,28);globalThis.ally=addU(0,'mil',25.25,28);globalThis.far=addU(1,'mil',28,28);for(const u of [primary,close,ally,far])u.hp=700");
 run('S.tech[0].ut35p=1;dmgT(att,primary)');
 assert.ok(run('close.hp')<700);
 assert.equal(run('ally.hp'),700);
 assert.equal(run('far.hp'),700);
 run('S.tech[0].ut35p=0;close.hp=700;primary.hp=700;dmgT(att,primary)');
 assert.equal(run('close.hp'),700);
});

test('Polish team bonus improves Scout attacks on archers but not unrelated targets',()=>{
 const run=game();
 run("globalThis.att=addU(0,'scout',22,28);globalThis.enemy=addU(1,'arc',23,28);enemy.hp=700");
 const hit=()=>run("(()=>{enemy.hp=700;dmgT(att,enemy);return 700-enemy.hp})()");
 const polish=hit();
 run('S.civ[0]=0');
 assert.equal(polish-hit(),1);
});

test('current-build saves retain Polish Folwark, farm food claim, Obuch armour loss and research',()=>{
 const run=game();
 run("globalThis.fol=addB(0,'folwark',42,24,true);globalThis.farm=addN('f',45,25,175,1);farm.t=0;grantFolwarkFarmFood(farm,0);globalThis.ob=addU(0,'obuch',20,28);ob.obuchArmorShred=2;S.tech[0].ut35=1");
 assert.equal(run("saveG(false,'polish_current_build')"),true);
 run('S.civ[0]=0;S.us=[];S.bs=[];S.nodes=[];S.tech[0]={}');
 assert.equal(run("loadG(false,'polish_current_build')"),true);
 assert.equal(run('S.civ[0]'),35);
 assert.equal(run("S.bs.some(b=>b.k==='folwark'&&b.t===0)"),true);
 assert.equal(run("S.nodes.some(n=>n.fm&&n.folwarkClaimed===1)"),true);
 assert.equal(run("S.us.some(u=>u.k==='obuch'&&u.obuchArmorShred===2)"),true);
 assert.equal(run('S.tech[0].ut35'),1);
});
