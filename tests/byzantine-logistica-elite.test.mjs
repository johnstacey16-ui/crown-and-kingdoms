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
 const beforeCounter=run("spearLineBonus({k:'spear',t:1},cata)");
 assert.equal(run("research(testCastle,'eliteCataphract')"),true);
 assert.equal(run('S.res[0].f'),8800);assert.equal(run('S.res[0].g'),9200);
 assert.equal(run('mhp(cata)'),beforeHealth,'still non-Elite during research');
 run('upB(testCastle,51)');
 assert.equal(run('S.tech[0].eliteCataphract'),1);
 assert.equal(run('mhp(cata)'),beforeHealth+40);
 assert.equal(run('cata.hp'),beforeHealth+40,'existing units receive Elite health');
 assert.equal(run('S.tech[0].atkb.cata'),beforeMelee+3);
 assert.equal(run("spearLineBonus({k:'spear',t:1},cata)"),beforeCounter-4);
 assert.equal(run("camelLineBonus({k:'camel',t:1},cata)"),5);
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
