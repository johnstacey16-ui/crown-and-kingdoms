import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// Sources: Age of Empires II DE update 185872 (Logistica no longer adds
// infantry bonus damage; Cataphracts and Varangian Guards trample), and the
// Logistica/Elite Cataphract technology tables for price, age and timers.
// Current Crown & Kingdoms has no Varangian Guard; other Byzantine bonuses
// and original Elite sprites remain separate, explicitly partial content.
function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 const run=sandbox.evaluate;
 run('kingdoms=2;startAge=3;startRes=3;start();S.civ=[3,1];S.age=[3,3];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};');
 return run;
}
function castle(run){
 run("globalThis.testCastle={k:'castle',t:0,x:6,y:6,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:9999};S.bs.push(testCastle)");
}
const inventory=JSON.parse(readFileSync(new URL('../data/civilizations.json',import.meta.url),'utf8'));

test('Byzantine Imperial Castle research and Elite are canonical and exclusive',()=>{
 const run=game(),civ=inventory.civilizations[3];
 assert.equal(civ.name,'Byzantines');
 assert.equal(civ.secondUniqueTechnology,'ut3p');
 assert.equal(civ.eliteUpgrade,'eliteCataphract');
 const logistica=JSON.parse(run('JSON.stringify(TE.ut3p)'));
 assert.equal(logistica.n,'Logistica');
 assert.equal(logistica.age,3);assert.equal(logistica.t,50);
 assert.deepEqual(logistica.cost,{f:800,g:600});
 const elite=JSON.parse(run('JSON.stringify(TE.eliteCataphract)'));
 assert.equal(elite.n,'Elite Cataphract');
 assert.equal(elite.age,3);assert.equal(elite.t,50);
 assert.deepEqual(elite.cost,{f:1200,g:800});
 for(const key of ['ut3p','eliteCataphract']){
  assert.equal(run("rsOf({k:'castle',t:0}).includes('"+key+"')"),true);
  assert.equal(run("rsOf({k:'castle',t:1}).includes('"+key+"')"),false);
  assert.equal(run("rsOf({k:'stable',t:0}).includes('"+key+"')"),false);
  const model=JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))'));
  assert.equal(model.buildings.find(x=>x.id==='castle').research.find(x=>x.id===key).state,'available');
 }
 run('S.age[0]=2');
 for(const key of ['ut3p','eliteCataphract']){
  const model=JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))'));
  assert.equal(model.buildings.find(x=>x.id==='castle').research.find(x=>x.id===key).state,'locked');
 }
});

test('Logistica research pays once, completes normally and does not permit foreign research',()=>{
 const run=game();castle(run);
 assert.equal(run("research(testCastle,'ut3p')"),true);
 assert.equal(run('testCastle.rs.k'),'ut3p');
 assert.equal(run('S.res[0].f'),9200);assert.equal(run('S.res[0].g'),9400);
 assert.equal(run('S.tech[0].logistica'),undefined,'no effect before research finishes');
 run('upB(testCastle,51)');
 assert.equal(run('S.tech[0].ut3p'),1);
 assert.equal(run('S.tech[0].logistica'),1);
 assert.equal(run("research(testCastle,'ut3p')"),false,'completed research is unique');
 run('S.civ[0]=1;S.tech[0]={};testCastle.rs=null');
 const before=run('JSON.stringify(S.res[0])');
 assert.equal(run("research(testCastle,'ut3p')"),false);
 assert.equal(run('JSON.stringify(S.res[0])'),before);
});

test('Elite Cataphract adds real hit points, attack and class-counter resistance',()=>{
 const run=game();castle(run);
 run("globalThis.cata={k:'cata',t:0,x:18,y:18,hp:U.cata.hp,p:[],o:'i',cd:0};S.us.push(cata)");
 const beforeHealth=run('mhp(cata)');
 const beforeMelee=run("S.tech[0].atkb?.cata||0");
 const beforeCounter=run("factionCounterBonus({k:'spear',t:1},cata,spearLineBonus({k:'spear',t:1},cata))");
 assert.equal(beforeCounter,3);
 assert.equal(run("research(testCastle,'eliteCataphract')"),true);
 assert.equal(run('S.res[0].f'),8800);assert.equal(run('S.res[0].g'),9200);
 assert.equal(run('mhp(cata)'),beforeHealth,'still non-Elite during research');
 run('upB(testCastle,51)');
 assert.equal(run('S.tech[0].eliteCataphract'),1);
 assert.equal(run('mhp(cata)'),beforeHealth+40);
 assert.equal(run('cata.hp'),beforeHealth+40,'existing units receive Elite health');
 assert.equal(run('S.tech[0].atkb.cata'),beforeMelee+3);
 assert.equal(run("spearLineBonus({k:'spear',t:1},cata)"),15,'line helpers now return raw counters');
 assert.equal(run("factionCounterBonus({k:'spear',t:1},cata,spearLineBonus({k:'spear',t:1},cata))"),0);
 assert.equal(run("factionCounterBonus({k:'camel',t:1},cata,camelLineBonus({k:'camel',t:1},cata))"),0);
 assert.equal(run("eliteUniqueUnitUpgrade('cata',1)"),null);
});

test('Logistica deals five armour-piercing splash damage to adjacent hostiles only',()=>{
 const run=game();
 // Real existing roster entities, not merely a data-only combat preview.
 run("S.us=[];globalThis.cata={k:'cata',t:0,x:30,y:30,hp:130,p:[],o:'a',cd:0};"+
 "globalThis.primary={k:'mil',t:1,x:30.4,y:30,hp:200,p:[]};"+
 "globalThis.near={k:'mil',t:1,x:30.6,y:30.1,hp:100,p:[]};"+
 "globalThis.ally={k:'mil',t:0,x:30.5,y:30.1,hp:100,p:[]};"+
 "globalThis.distant={k:'mil',t:1,x:31.6,y:30,hp:100,p:[]};"+
 "S.us.push(cata,primary,near,ally,distant);"+
 "S.tech[1]={armI:1,armI2:1,armI3:1};");
 run('hit(cata,primary)');
 assert.equal(run('near.hp'),100,'no splash before the research');
 run('S.tech[0].ut3p=1;S.tech[0].logistica=1');
 const prior=run('primary.hp');
 run('hit(cata,primary)');
 assert.ok(run('primary.hp')<prior,'primary suffers the actual melee hit');
 assert.equal(run('near.hp'),95,'nearby enemy loses exactly five regardless of armour');
 assert.equal(run('ally.hp'),100,'friendly fire is excluded');
 assert.equal(run('distant.hp'),100,'beyond half a tile is not hit');
 run('S.civ[0]=1');
 run('hit(cata,primary)');
 assert.equal(run('near.hp'),95,'foreign kingdom with an injected tech flag gets no splash');
});

test('splash victims die through the normal combat accounting without chaining further splash',()=>{
 const run=game();
 run("S.us=[];globalThis.cata={k:'cata',t:0,x:30,y:30,hp:130,p:[],o:'a',cd:0};"+
 "globalThis.primary={k:'mil',t:1,x:30.4,y:30,hp:100,p:[]};"+
 "globalThis.near={k:'mil',t:1,x:30.6,y:30.1,hp:3,p:[]};"+
 "globalThis.third={k:'mil',t:1,x:31.05,y:30.1,hp:100,p:[]};"+
 "S.us.push(cata,primary,near,third);S.tech[0].ut3p=1;S.tech[0].logistica=1;");
 const initial=run('S.pl.kills');
 run('hit(cata,primary)');
 assert.equal(run('near.hp'),-2);
 assert.equal(run('near.dead'),1);
 assert.equal(run('S.pl.kills'),initial+1);
 assert.equal(run('third.hp'),100,'no recursive splash from the secondary victim');
 run('hit(cata,primary)');
 assert.equal(run('S.pl.kills'),initial+1,'dead victims are skipped on later attacks');
});

test('current-build save/load persists Byzantine research and its real effects',()=>{
 const run=game();
 run('S.tech[0].ut3p=1;S.tech[0].logistica=1;S.tech[0].eliteCataphract=1;'+
     'S.tech[0].hpb={cata:40};S.tech[0].atkb={cata:3}');
 const before=run("mhp({k:'cata',t:0})");
 assert.equal(run("saveG(false,'ck_byzantine_elite_test')"),true);
 run('S.tech[0]={}');
 assert.equal(run("loadG(false,'ck_byzantine_elite_test')"),true);
 assert.equal(run('S.tech[0].logistica'),1);
 assert.equal(run('S.tech[0].eliteCataphract'),1);
 assert.equal(run("mhp({k:'cata',t:0})"),before);
 assert.equal(run("eliteUniqueUnitUpgrade('cata',0).k"),'eliteCataphract');
});

function counterGame(){
 const run=game();
 run("S.us=[];S.bs=[];S.pj=[];S.el.fill(0);S.g.fill(0);S.wt.fill(0);S.nd.fill(null);S.ex.fill(1);S.vs.fill(1);globalThis.defender=addU(0,'cata',31,30);globalThis.attacker=addU(1,'spear',30,30)");
 return run;
}
function rawCounter(run){return run('attacker.k==="spear"?spearLineBonus(attacker,defender):camelLineBonus(attacker,defender)');}
function resolvedCounter(run){return run('factionCounterBonus(attacker,defender,attacker.k==="spear"?spearLineBonus(attacker,defender):camelLineBonus(attacker,defender))');}
function counterHit(run){return run('(()=>{defender.hp=1000;dmgT(attacker,defender);return 1000-defender.hp})()');}

test('Cataphracts have 12 intrinsic class armour and researched Elite totals 16 without changing normal armour',()=>{
 const run=counterGame();
 const melee=run("combatArmor(defender,'m')"),pierce=run("combatArmor(defender,'p')");
 assert.equal(run('cavalryCounterArmor(defender)'),12);
 run('S.tech[0].eliteCataphract=1');assert.equal(run('cavalryCounterArmor(defender)'),16);
 assert.equal(run("combatArmor(defender,'m')"),melee);assert.equal(run("combatArmor(defender,'p')"),pierce);
 run('defender.obuchArmorShred=10');assert.equal(run('cavalryCounterArmor(defender)'),16,'normal armour shredding cannot remove class resistance');
 run('S.civ[0]=1');assert.equal(run('cavalryCounterArmor(defender)'),12,'converted base units retain intrinsic armour; foreign Elite flags do not apply');
 for(const kind of ['knight','camel','mil','arc','ram'])assert.equal(run(`cavalryCounterArmor({k:'${kind}',t:0})`),0);
 assert.equal(run("cavalryCounterArmor({k:'cata',t:0,s:3})"),0);
 assert.equal(run('U.cata.cavalryArmor'),12,'research does not mutate the global base');
});
test('spear and camel class bonuses are reduced once, clamped to zero and leave normal hit damage intact',()=>{
 const run=counterGame();
 for(const elite of [false,true]){
  run('S.tech[0]={'+(elite?'eliteCataphract:1':'')+'}');
  const armour=elite?16:12;
  for(const [flag,raw] of [['',15],['pike',22],['halb',32]]){
   run('attacker.k="spear";S.tech[1]={'+(flag?flag+':1':'')+'}');
   assert.equal(rawCounter(run),raw);assert.equal(resolvedCounter(run),Math.max(0,raw-armour));
   assert.equal(counterHit(run),Math.max(1,run('U.spear.dmg')+Math.max(0,raw-armour)-run("combatArmor(defender,'m')")));
  }
  for(const heavy of [false,true]){
   run('attacker.k="camel";S.tech[1]={'+(heavy?'hcamel:1':'')+'}');
   const raw=heavy?18:9;assert.equal(rawCounter(run),raw);assert.equal(resolvedCounter(run),Math.max(0,raw-armour));
   assert.equal(counterHit(run),Math.max(1,run('U.camel.dmg')+Math.max(0,raw-armour)-run("combatArmor(defender,'m')")));
  }
  run('attacker.k="mil";S.tech[1]={}');const foot=counterHit(run);
  run('S.tech[1].forging=1');assert.equal(counterHit(run),foot+1,'ordinary research damage bypasses class resistance');
 }
});
test('Chieftains combines with the spear counter before class armour; source boosts also precede resistance',()=>{
 const run=counterGame();run('S.civ[1]=7;S.tech[1].ut7=1');
 assert.equal(resolvedCounter(run),8,'15 spear + 5 Chieftains - 12 base armour');
 run('S.tech[0].eliteCataphract=1');assert.equal(resolvedCounter(run),4,'20 combined attack - 16 Elite armour');
 run('attacker.k="bers"');assert.equal(run('factionCounterBonus(attacker,defender,0)'),0,'five alone is absorbed');
 run('S.tech[1].ut7=0');const base=counterHit(run);run('S.tech[1].ut7=1');assert.equal(counterHit(run),base);
 run('attacker.k="camel";S.civ[1]=39;S.age[1]=3;S.tech[1]={hcamel:1}');
 assert.equal(resolvedCounter(run),9,'rounded 18 × 1.4 raw bonus - 16 armour');
 run('attacker.k="spear";S.civ[1]=36;S.tech[1]={pike:1}');
 assert.equal(resolvedCounter(run),12,'rounded 22 × 1.25 raw bonus - 16 armour');
});
test('class armour follows current-build research after reload and protects against detached infantry shots',()=>{
 const run=counterGame();run('S.civ[1]=7;S.tech[1].ut7=1;S.tech[0].eliteCataphract=1;attacker.k="gbeto";attacker.x=28;defender.hp=mhp(defender);globalThis.before=defender.hp;launchProjectile(attacker,defender)');
 assert.equal(run('S.pj.length'),1);run('attacker.hp=0;S.us=S.us.filter(u=>u!==attacker)');
 assert.equal(run("saveG(false,'cataphract-class-armour')"),true);assert.equal(run("loadG(false,'cataphract-class-armour')"),true);
 run('defender=S.pj[0].t;pjs(1)');
 assert.equal(run('before-defender.hp'),run("Math.max(1,U.gbeto.dmg-combatArmor(defender,'p'))"));
 assert.equal(run("cavalryCounterArmor(addU(0,'cata',32,30))"),16,'future units inherit researched resistance without a unit flag');
});
