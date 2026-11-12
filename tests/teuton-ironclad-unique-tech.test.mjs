import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

// Teuton Castle Age Ironclad: 400 wood, 350 gold, 60s; +4 melee armour
// for siege weapons. Reference: https://liquipedia.net/ageofempires/Ironclad
function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 const run=sandbox.evaluate;
 run('kingdoms=2;startAge=3;startRes=3;start();S.civ=[5,1];S.age=[2,2];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.bs=[];S.us=[];S.pj=[]');
 return run;
}

test('Ironclad appears only in Teuton Castle research and is correctly costed',()=>{
 const run=game();
 const tech=JSON.parse(run('JSON.stringify(TE.ut5p)'));
 assert.equal(tech.n,'Ironclad');
 assert.equal(tech.age,2);
 assert.equal(tech.t,60);
 assert.deepEqual(tech.cost,{w:400,g:350});
 assert.equal(run("rsOf({k:'castle',t:0}).includes('ut5p')"),true);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut5p')"),false);
 assert.equal(run("rsOf({k:'siege',t:0}).includes('ut5p')"),false);
 const tree=JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))'));
 const option=tree.buildings.find(b=>b.id==='castle').research.find(t=>t.id==='ut5p');
 assert.equal(option.state,'available');
 assert.deepEqual(option.cost,{w:400,g:350});
 run('S.age[0]=1');
 assert.equal(JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))')).buildings.find(b=>b.id==='castle').research.find(t=>t.id==='ut5p').state,'locked');
});

test('actual Castle research charges resources, completes on timer and upgrades existing and future siege',()=>{
 const run=game();
 run("globalThis.castle={k:'castle',t:0,x:8,y:8,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 const keys=['ram','mang','scor','bomb','treb'];
 const before=JSON.parse(run("JSON.stringify(Object.fromEntries(['ram','mang','scor','bomb','treb'].map(k=>[k,combatArmor({k,t:0},'m')])))"));
 assert.equal(run("research(castle,'ut5p')"),true);
 assert.equal(run('S.res[0].w'),9600);
 assert.equal(run('S.res[0].g'),9650);
 assert.equal(run('S.tech[0].ut5p'),undefined,'research does not apply before completion');
 assert.equal(run('castle.rs.t'),60);
 run('upB(castle,60.1)');
 assert.equal(run('S.tech[0].ut5p'),1);
 assert.equal(run('S.tech[0].ironclad'),1);
 for(const k of keys){
  assert.equal(run("combatArmor({k:'"+k+"',t:0},'m')"),before[k]+4,k+' gets the melee bonus');
  assert.equal(run("combatArmor({k:'"+k+"',t:0},'s')"),before[k]+4,k+' resists siege hits in the current damage model');
  assert.equal(run("combatArmor({k:'"+k+"',t:0},'p')"),run("combatArmor({k:'"+k+"',t:1},'p')"),'no pierce bonus for '+k);
 }
 assert.equal(run("combatArmor({k:'cgal',t:0},'m')"),run("combatArmor({k:'cgal',t:1},'m')"),'cannon ships are not land siege');
 assert.equal(run("combatArmor({k:'knight',t:0},'m')"),run("combatArmor({k:'knight',t:1},'m')"),'ordinary cavalry receive no Ironclad');
 assert.equal(run("research(castle,'ut5p')"),false,'completed technology is not charged twice');
});

test('Ironclad changes actual melee damage while resisting spoofed foreign research flags',()=>{
 const run=game();
 run("globalThis.attacker={k:'tk',t:1,x:20,y:20};globalThis.target={k:'ram',t:0,x:21,y:20,hp:150}");
 const normal=run('(()=>{target.hp=150;dmgT(attacker,target);return 150-target.hp})()');
 run('S.tech[0].ut5p=1;S.tech[0].ironclad=1');
 const armoured=run('(()=>{target.hp=150;dmgT(attacker,target);return 150-target.hp})()');
 assert.equal(normal-armoured,4,'same live attack loses exactly four damage');
 assert.equal(run("combatArmor({k:'ram',t:1},'m')"),run("combatArmor({k:'ram',t:0},'m')")-4);
 run('S.tech[1].ut5p=1;S.tech[1].ironclad=1');
 assert.equal(run("combatArmor({k:'ram',t:1},'m')"),run("combatArmor({k:'ram',t:0},'m')")-4,'another civilization cannot forge Ironclad');
 run('S.civ[0]=1');
 assert.equal(run("combatArmor({k:'ram',t:0},'m')"),run("combatArmor({k:'ram',t:1},'m')"),'changing civilization invalidates the old bonus');
});

test('other factions and under-age Teutons cannot order Ironclad',()=>{
 const run=game();
 run("globalThis.castle={k:'castle',t:0,x:8,y:8,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 const initial=run('JSON.stringify(S.res[0])');
 run('S.age[0]=1');
 assert.equal(run("research(castle,'ut5p')"),false);
 run('S.age[0]=2;S.civ[0]=1');
 assert.equal(run("research(castle,'ut5p')"),false);
 assert.equal(run('JSON.stringify(S.res[0])'),initial);
 assert.equal(run('castle.rs'),null);
});

test('current-build save/load retains the researched melee armour without changing the opposing team',()=>{
 const run=game();
 run('S.tech[0].ut5p=1;S.tech[0].ironclad=1');
 const before=run("combatArmor({k:'mang',t:0},'m')");
 assert.equal(run("saveG(false,'ck_teuton_ironclad_test')"),true);
 run('S.tech[0]={};S.civ[0]=1');
 assert.equal(run("loadG(false,'ck_teuton_ironclad_test')"),true);
 assert.equal(run('S.tech[0].ut5p'),1);
 assert.equal(run('S.tech[0].ironclad'),1);
 assert.equal(run("combatArmor({k:'mang',t:0},'m')"),before);
 assert.equal(run("combatArmor({k:'mang',t:1},'m')"),before-4);
});
