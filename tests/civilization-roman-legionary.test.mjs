import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.romanEval=code=>eval(code);',sandbox);
 const run=sandbox.romanEval;
 run("seedOv=401126;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=[40,0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.tc=addB(0,'tc',10,12,true);globalThis.bar=addB(0,'bar',18,12,true);globalThis.castle=addB(0,'castle',30,12,true);globalThis.siege=addB(0,'siege',42,12,true)");
 return run;
}
const copy=(run,code)=>JSON.parse(run('JSON.stringify('+code+')'));

test('Romans append stable ID 40 with unique technologies and faction-locked Legionary access',()=>{
 const run=game();
 assert.equal(run('CIV.length'),43);
 assert.equal(run('CIV[39].n'),'Gurjaras');
 assert.equal(run('CIV[40].uu'),'centurion');
 assert.equal(run("trOf(castle).includes('centurion')"),true);
 assert.equal(run("trOf({k:'castle',t:1}).includes('centurion')"),false);
 for(const tech of ['ut40','ut40p','eliteCenturion'])
  assert.equal(run("rsOf(castle).includes('"+tech+"')"),true);
 assert.equal(run("rsOf(bar).includes('legionaryUpgrade')"),true);
 assert.equal(run("rsOf({k:'bar',t:1}).includes('legionaryUpgrade')"),false);
 assert.equal(run("rsOf(bar).includes('champ')"),false);
 assert.equal(run("trOf(bar).includes('legionary')"),false);
 assert.equal(run("trOf({k:'bar',t:1}).includes('legionary')"),false);
});

test('researching Roman Legionary upgrades living Militia and queued units but not foreign teams',()=>{
 const run=game();
 run("S.tech[0].longs=1;globalThis.old=addU(0,'mil',21,27);globalThis.foreign=addU(1,'mil',25,27);globalThis.secondBar=addB(0,'bar',52,20,true);secondBar.q=[{k:'mil',t:100,paidCost:{f:50,g:20}}]");
 assert.equal(run("research(bar,'legionaryUpgrade')"),true);
 run('upB(bar,TE.legionaryUpgrade.t+1)');
 assert.equal(run('S.tech[0].legionaryUpgrade'),1);
 assert.equal(run('old.k'),'legionary');
 assert.equal(run('foreign.k'),'mil');
 assert.equal(run('secondBar.q[0].k'),'legionary');
 assert.equal(run("trOf(bar).includes('legionary')"),true);
 assert.equal(run("trOf(bar).includes('mil')"),false);
 assert.equal(run("train(bar,'legionary')"),true);
});

test('Romans train Scorpions with real half-gold cost and properly refunded queue',()=>{
 const run=game();
 const base=copy(run,'U.scor.cost');
 const discounted=copy(run,"unitTrainingCost(0,'scor')");
 assert.equal(discounted.g,Math.ceil(base.g/2));
 assert.equal(copy(run,"unitTrainingCost(1,'scor')").g,base.g);
 const gold=run('S.res[0].g');
 assert.equal(run("train(siege,'scor')"),true);
 assert.equal(run('S.res[0].g'),gold-discounted.g);
 assert.equal(run('cancelQ(siege)'),true);
 assert.equal(run('S.res[0].g'),gold);
});

test('Romans get exactly double infantry Blacksmith armour and one Galley armour bonus',()=>{
 const run=game();
 run("S.tech[0].armI=1;S.tech[0].armI2=1;S.tech[0].armI3=1");
 const target="{k:'mil',t:0}",foreign="{k:'mil',t:1}";
 const roman=run("combatArmor("+target+",'m')");
 const ordinary=run("combatArmor("+foreign+",'m')");
 assert.equal(roman-ordinary,6,'three researched infantry upgrades double their own effect');
 assert.equal(run("combatArmor({k:'gal',t:0},'p')")-run("combatArmor({k:'gal',t:1},'p')"),1);
 assert.equal(run("combatArmor({k:'knight',t:0},'m')"),run("combatArmor({k:'knight',t:1},'m')"));
});

test('living Centurion aura accelerates only nearby allied Roman militia, never stacks',()=>{
 const run=game();
 run("globalThis.militia=addU(0,'mil',21,27);globalThis.cent=addU(0,'centurion',22,27);globalThis.other=addU(0,'centurion',22.2,27);globalThis.far=addU(0,'mil',45,40);globalThis.foreign=addU(1,'mil',22.5,27)");
 assert.equal(run('romanCenturionAura(militia)'),1.25);
 assert.equal(run('romanCenturionAura(far)'),1);
 assert.equal(run('romanCenturionAura(foreign)'),1);
 assert.ok(run("attackReload(militia)")<run("attackReload(far)"));
 assert.ok(run("unitSpeed(militia)")>run("unitSpeed(far)"));
 run('S.tech[0].eliteCenturion=1');
 assert.equal(run('romanCenturionAura(militia)'),1.33);
 run('cent.hp=0;other.hp=0');
 assert.equal(run('romanCenturionAura(militia)'),1);
});

test('Roman Ballistas research actually quickens Scorpions and boosts Galley combat',()=>{
 const run=game();
 const before=run("attackReload({k:'scor',t:0})");
 const enemy=run("attackReload({k:'scor',t:1})");
 assert.equal(before,enemy);
 run('S.tech[0].ut40=1');
 assert.ok(Math.abs(run("attackReload({k:'scor',t:0})")-before/1.33)<1e-8);
 assert.equal(run("attackReload({k:'scor',t:1})"),enemy);
 run("globalThis.gal=addU(0,'gal',14,30);globalThis.target=addU(1,'gal',20,30);target.hp=600");
 const hit=()=>run("(()=>{target.hp=600;dmgT(gal,target);return 600-target.hp})()");
 const ballista=hit();
 run('S.tech[0].ut40=0');
 assert.equal(ballista-hit(),2,'Ballistas contributes two real attack points beyond Roman baseline');
});

test('Roman Scorpion team range follows live diplomacy, including self and allies',()=>{
 const run=game();
 assert.equal(run("romanScorpionMinimumRange({k:'scor',t:0})"),1);
 assert.equal(run("romanScorpionMinimumRange({k:'scor',t:1})"),2);
 run("setDiplomacy(0,1,'ally')");
 assert.equal(run("romanScorpionMinimumRange({k:'scor',t:1})"),1);
 run("setDiplomacy(0,1,'enemy')");
 assert.equal(run("romanScorpionMinimumRange({k:'scor',t:1})"),2);
});

test('Comitatenses really improves training and unlocks a bounded on-cooldown charge',()=>{
 const run=game();
 run("globalThis.att=addU(0,'centurion',23,29);globalThis.target=addU(1,'mil',24,29);target.hp=500");
 const normalRate=run("trainRate(castle,'centurion')");
 const hit=()=>run("(()=>{target.hp=500;dmgT(att,target);return 500-target.hp})()");
 const normal=hit();
 run('S.tech[0].ut40p=1;S.t=att.romanChargeReadyAt');
 assert.ok(Math.abs(run("trainRate(castle,'centurion')")-normalRate*1.5)<1e-9);
 assert.equal(hit(),normal+5);
 const first=run('att.romanChargeReadyAt');
 assert.ok(first>run('S.t'));
 assert.equal(hit(),normal,'charge cannot repeat before recharge');
 run('S.civ[0]=0;S.t=att.romanChargeReadyAt');
 assert.equal(hit(),normal,'foreign civilization cannot reuse Roman research');
});

test('Roman Villagers gather and construct faster but ordinary Villagers remain unchanged',()=>{
 const run=game();
 assert.ok(Math.abs(run("gm({k:'vil',t:0},{k:'w'})")/run("gm({k:'vil',t:1},{k:'w'})")-1.05)<1e-8);
 assert.equal(run("gm({k:'scout',t:0},{k:'w'})"),run("gm({k:'scout',t:1},{k:'w'})"));
});

test('current-build save keeps Roman Legionaries, Centurions, charged attack and researched effects',()=>{
 const run=game();
 run("globalThis.cent=addU(0,'centurion',23,29);globalThis.leg=addU(0,'legionary',25,29);leg.romanChargeReadyAt=55;S.tech[0].ut40=1;S.tech[0].ut40p=1;S.tech[0].legionaryUpgrade=1");
 assert.equal(run("saveG(false,'roman_current_build')"),true);
 run('S.civ[0]=0;S.us=[];S.bs=[];S.tech[0]={}');
 assert.equal(run("loadG(false,'roman_current_build')"),true);
 assert.equal(run('S.civ[0]'),40);
 assert.equal(run("S.us.some(u=>u.k==='centurion'&&u.t===0)"),true);
 assert.equal(run("S.us.some(u=>u.k==='legionary'&&u.romanChargeReadyAt===55)"),true);
 assert.equal(run('S.tech[0].ut40p'),1);
 assert.equal(run('S.tech[0].legionaryUpgrade'),1);
});
