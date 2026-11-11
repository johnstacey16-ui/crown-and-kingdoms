import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(civ){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 const run=sandbox.evaluate;
 run('kingdoms=2;startAge=3;startRes=3;start();S.civ=['+civ+',1];S.age=[3,3];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.us=[];S.bs=[];S.pj=[]');
 run("globalThis.castle={k:'castle',t:0,x:20,y:20,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 return run;
}

test('Celtic Stronghold has paid Castle research, tower fire bonus and nearby infantry healing',()=>{
 const run=game(6),entry=JSON.parse(run('JSON.stringify(TE.ut6p)'));
 assert.deepEqual(entry.cost,{f:250,g:200});
 assert.equal(entry.age,2);
 assert.equal(entry.t,30);
 assert.equal(run("rsOf(castle).includes('ut6p')"),true);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut6p')"),false);
 run("globalThis.ally={k:'mil',t:0,x:22,y:22,hp:20,p:[]};globalThis.far={k:'mil',t:0,x:50,y:50,hp:20,p:[]};S.us.push(ally,far)");
 assert.equal(run("research(castle,'ut6p')"),true);
 assert.equal(run('S.res[0].f'),9750);
 assert.equal(run('S.res[0].g'),9800);
 run('upB(castle,30.1)');
 assert.equal(run('S.tech[0].ut6p'),1);
 assert.equal(run('ally.hp'),20,'no premature healing during research');
 run('upB(castle,.1)');
 assert.equal(run('ally.hp'),20.5);
 assert.equal(run('far.hp'),20);
 run("globalThis.tower={k:'tower',t:0,x:25,y:20,s:2,hp:400,mh:400,done:true,cd:0,q:[],rs:null};S.bs.push(tower)");
 run("globalThis.enemy={k:'mil',t:1,x:25,y:25,hp:500,p:[]};S.us.push(enemy)");
 run('upB(tower,.1)');
 assert.ok(Math.abs(run('tower.cd')-run('U.tw.cd')/1.33)<1e-9,'Stronghold reduces actual defensive fire cooldown');
 run('S.civ[0]=1;tower.cd=0;upB(tower,.1)');
 assert.equal(run('tower.cd'),run('U.tw.cd'),'only Celts benefit');
});

test('Imperial Furor Celtica grants +40% base hitpoints to Siege Workshop units',()=>{
 const run=game(6);
 const before=JSON.parse(run("JSON.stringify(Object.fromEntries(['ram','mang','scor','bomb','treb'].map(k=>[k,mhp({k,t:0})])))"));
 run('S.age[0]=2');
 assert.equal(run("research(castle,'ut6')"),false);
 run('S.age[0]=3');
 assert.equal(run("research(castle,'ut6')"),true);
 assert.equal(run('S.res[0].f'),9250);
 run('upB(castle,50.1)');
 for(const kind of ['ram','mang','scor','bomb']){
  const after=run("mhp({k:'"+kind+"',t:0})");
  assert.equal(after,before[kind]+Math.round(run("U['"+kind+"'].hp")*.4),kind+' receives 40%');
 }
 assert.equal(run("mhp({k:'treb',t:0})"),before.treb,'Castle trebuchets are outside this upgrade');
});

test('Viking Bogsveigar adds one damage to Archer and Crossbowman attacks only',()=>{
 const run=game(7);
 run("globalThis.attacker={k:'arc',t:0,x:6,y:6};globalThis.victim={k:'mil',t:1,x:7,y:6,hp:500,p:[]}");
 const hit=()=>run('(()=>{victim.hp=500;dmgT(attacker,victim);return 500-victim.hp})()');
 const before=hit();
 assert.equal(run("research(castle,'ut7p')"),true);
 run('upB(castle,40.1)');
 assert.equal(hit(),before+1);
 run("attacker.k='xbow'");
 const after=hit();
 run('S.tech[0].ut7p=0');
 assert.equal(after-hit(),1);
 run("attacker.k='skirm';S.tech[0].ut7p=1");
 const skirm=hit();
 run('S.tech[0].ut7p=0');
 assert.equal(hit(),skirm);
 run('S.tech[0].ut7p=1;S.civ[0]=1;attacker.k="arc"');
 assert.equal(hit(),before,'foreign civ cannot forge Bogsveigar');
});

test('Japanese Kataparuto speeds up actual Trebuchet attacks without affecting other siege',()=>{
 const run=game(11);
 const base=run("attackReload({k:'treb',t:0})");
 assert.equal(run("research(castle,'ut11p')"),true);
 assert.equal(run('S.res[0].w'),9450);
 assert.equal(run('S.res[0].g'),9700);
 run('upB(castle,60.1)');
 assert.ok(Math.abs(run("attackReload({k:'treb',t:0})")-base/1.33)<1e-9);
 assert.equal(run("attackReload({k:'treb',t:1})"),base);
 assert.equal(run("attackReload({k:'ram',t:0})"),run("attackReload({k:'ram',t:1})"));
 run('S.civ[0]=1');
 assert.equal(run("attackReload({k:'treb',t:0})"),base);
});

test('four new Elite upgrades are properly priced, paid and apply to new and existing units',()=>{
 const run=game(4);
 for(const [id,key] of [[4,'eliteWarElephant'],[6,'eliteWoadRaider'],[7,'eliteBerserk'],[11,'eliteSamurai']]){
  run('S.civ[0]='+id+';S.tech[0]={};S.age[0]=3;castle.rs=null;castle.q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const unit=run('CIV['+id+'].uu'),tech=JSON.parse(run('JSON.stringify(TE.'+key+')'));
  run("globalThis.hero={k:'"+unit+"',t:0,hp:U['"+unit+"'].hp,x:10,y:10};S.us=[hero]");
  assert.equal(tech.age,3);
  assert.ok(run("rsOf(castle).includes('"+key+"')"));
  assert.ok(!run("rsOf({k:'castle',t:1}).includes('"+key+"')"));
  const before=run('mhp(hero)');
  assert.equal(run("research(castle,'"+key+"')"),true);
  assert.equal(run('S.res[0].f'),10000-(tech.cost.f||0));
  assert.equal(run('S.res[0].g'),10000-(tech.cost.g||0));
  run('upB(castle,'+(tech.t+.1)+')');
  assert.equal(run('hero.hp'),before+tech.hpb[unit]);
  assert.equal(run("mhp({k:'"+unit+"',t:0})"),before+tech.hpb[unit]);
  assert.equal(run("eliteUniqueUnitUpgrade('"+unit+"',1)"),null);
 }
});

test('same-build saves restore Stronghold research, healing and Celtic Elite unit state',()=>{
 const run=game(6);
 run("S.tech[0].ut6p=1;S.tech[0].stronghold=1;S.tech[0].eliteWoadRaider=1;S.tech[0].hpb={woad:20};S.tech[0].atkb={woad:4}");
 const hp=run("mhp({k:'woad',t:0})");
 assert.equal(run("saveG(false,'ck_celtic_content_test')"),true);
 run('S.civ[0]=1;S.tech[0]={}');
 assert.equal(run("loadG(false,'ck_celtic_content_test')"),true);
 assert.equal(run('S.tech[0].ut6p'),1);
 assert.equal(run("mhp({k:'woad',t:0})"),hp);
});
