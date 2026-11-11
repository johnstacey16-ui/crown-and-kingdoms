import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

// Byzantine Greek Fire, Castle Age: 250 food, 300 gold, 40 seconds.
// Fire Ship +1 range; other naval blast effects wait for the missing Dromon
// and Bombard Tower. 2026 Byzantine naval bonus: Fire Ships attack 25% faster.
// See https://ageofempires.fandom.com/wiki/Greek_Fire
// and https://age2hub.com/en/civs/byzantines.
function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 const run=sandbox.evaluate;
 run('kingdoms=2;startAge=3;startRes=3;start();S.us=[];S.bs=[];S.pj=[];S.civ=[3,1];S.age=[2,2];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};');
 return run;
}

test('Byzantine Greek Fire has its real Castle Age cost, time, availability and no foreign research',()=>{
 const run=game();
 const te=JSON.parse(run('JSON.stringify(TE.ut3)'));
 assert.equal(te.n,'Greek Fire');
 assert.equal(te.t,40);
 assert.equal(te.age,2);
 assert.deepEqual(te.cost,{f:250,g:300});
 assert.equal(run("rsOf({k:'castle',t:0}).includes('ut3')"),true);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut3')"),false);
 assert.equal(run("rsOf({k:'dock',t:0}).includes('ut3')"),false);
 const tree=JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))'));
 assert.equal(tree.buildings.find(x=>x.id==='castle').research.find(x=>x.id==='ut3').state,'available');
 run('S.age[0]=1');
 assert.equal(JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))')).buildings.find(x=>x.id==='castle').research.find(x=>x.id==='ut3').state,'locked');
});

test('paid Castle research unlocks Fire Ship range only after completion',()=>{
 const run=game();
 run("globalThis.castle={k:'castle',t:0,x:9,y:9,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle);");
 run("globalThis.fire={k:'fire',t:0,x:27,y:27,hp:110,p:[],o:'i',cd:0};S.us.push(fire);");
 const before=run('attackRange(fire)');
 assert.equal(before,1.75);
 assert.equal(run("research(castle,'ut3')"),true);
 assert.equal(run('S.res[0].f'),9750);
 assert.equal(run('S.res[0].g'),9700);
 assert.equal(run('attackRange(fire)'),before,'no early technology effect');
 assert.equal(run('castle.rs.t'),40);
 run('upB(castle,40.01)');
 assert.equal(run('S.tech[0].gf'),1);
 assert.equal(run('S.tech[0].ut3'),1);
 assert.equal(run('attackRange(fire)'),before+1);
 assert.equal(run("attackRange({k:'fire',t:1})"),1.75);
 assert.equal(run("attackRange({k:'gal',t:0})"),6);
 assert.equal(run("research(castle,'ut3')"),false);
});

test('Greek Fire permits actual direct flames from the new range without creating a projectile',()=>{
 const run=game();
 run("globalThis.fire={k:'fire',t:0,x:30,y:30,hp:110,p:[],o:'a',cd:0,st:0,rp:1};"+
     "globalThis.galley={k:'gal',t:1,x:32.25,y:30,hp:400,p:[]};"+
     "S.us.push(fire,galley);fire.tg=galley;");
 assert.ok(run('Math.hypot(fire.x-galley.x,fire.y-galley.y)')>1.75);
 run("S.tech[0].gf=1;S.tech[0].ut3=1;");
 assert.equal(run('attackRange(fire)'),2.75);
 run('upU(fire,.1)');
 assert.ok(run('galley.hp')<400,'real attack order damages a distant enemy');
 assert.equal(run('S.pj.length'),0,'a Fire Ship remains direct flame, not artillery');
 assert.equal(run("attackRange({k:'fire',t:1})"),1.75);
 run('S.tech[0].gf=0');
 assert.equal(run('attackRange(fire)'),1.75,'range immediately derives from actual research state');
});

test('Byzantine Fire Ship rate bonus is faction-specific and independent from Greek Fire',()=>{
 const run=game();
 assert.equal(run("attackReload({k:'fire',t:1})"),.42);
 assert.ok(Math.abs(run("attackReload({k:'fire',t:0})")-.336)<1e-9);
 assert.equal(run("attackReload({k:'gal',t:0})"),1.8);
 run('S.tech[0].gf=1');
 assert.ok(Math.abs(run("attackReload({k:'fire',t:0})")-.336)<1e-9,'research affects range, not reload again');
 run('S.civ[0]=1');
 assert.equal(run("attackReload({k:'fire',t:0})"),.42);
 assert.equal(run("attackRange({k:'fire',t:0})"),1.75,'foreign team cannot spoof Greek Fire from a saved tech flag');
});

test('Greek Fire no longer grants unrelated arrow towers or castles extra damage',()=>{
 const run=game();
 run("globalThis.tower={k:'tw',t:0,x:15,y:15,hp:1};"+
     "globalThis.victim={k:'mil',t:1,x:15,y:15,hp:1000,p:[]};");
 run('dmgT(tower,victim)');
 const normal=run('1000-victim.hp');
 run('S.tech[0].gf=1;victim.hp=1000');
 run('dmgT(tower,victim)');
 assert.equal(run('1000-victim.hp'),normal);
});

test('new-save recovery preserves Fire Ship range and Byzantine faster reload',()=>{
 const run=game();
 run('S.tech[0].gf=1;S.tech[0].ut3=1');
 const range=run("attackRange({k:'fire',t:0})");
 const cooldown=run("attackReload({k:'fire',t:0})");
 assert.equal(run("saveG(false,'ck_byzantine_fire_test')"),true);
 run('S.tech[0]={};S.civ[0]=1');
 assert.equal(run("loadG(false,'ck_byzantine_fire_test')"),true);
 assert.equal(run("attackRange({k:'fire',t:0})"),range);
 assert.equal(run("attackReload({k:'fire',t:0})"),cooldown);
 assert.equal(run('S.tech[0].ut3'),1);
});
