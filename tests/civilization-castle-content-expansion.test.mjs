import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(id=5){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 const run=sandbox.evaluate;
 run('kingdoms=2;startAge=3;startRes=3;start();S.civ=['+id+',1];S.age=[3,3];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.us=[];S.bs=[];S.pj=[]');
 run("globalThis.castle={k:'castle',t:0,x:20,y:20,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 return run;
}

test('three additional Imperial Elite unit lines are Castle-only, researched and faction-bound',()=>{
 const run=game();
 for(const [id,key] of [[5,'eliteTeutonicKnight'],[10,'eliteChuKoNu'],[19,'eliteJaguarWarrior']]){
  run('S.civ[0]='+id+';S.tech[0]={};castle.rs=null;castle.q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const unit=run('CIV['+id+'].uu'),tech=JSON.parse(run('JSON.stringify(TE.'+key+')'));
  assert.equal(tech.age,3);
  assert.ok(run("rsOf(castle).includes('"+key+"')"));
  assert.ok(!run("rsOf({k:'castle',t:1}).includes('"+key+"')"));
  const tree=JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))'));
  assert.equal(tree.buildings.find(b=>b.id==='castle').research.find(t=>t.id===key).state,'available');
  run("globalThis.hero={k:'"+unit+"',t:0,x:5,y:5,hp:U['"+unit+"'].hp};S.us=[hero]");
  const base=run('mhp(hero)');
  assert.equal(run("research(castle,'"+key+"')"),true);
  assert.equal(run('S.res[0].f'),10000-(tech.cost.f||0));
  assert.equal(run('S.res[0].g'),10000-(tech.cost.g||0));
  assert.equal(run('mhp(hero)'),base,'Elite cannot apply before research completes');
  run('upB(castle,'+(tech.t+.1)+')');
  assert.equal(run('mhp(hero)'),base+tech.hpb[unit]);
  assert.equal(run('hero.hp'),base+tech.hpb[unit]);
  assert.equal(run("mhp({k:'"+unit+"',t:0})"),base+tech.hpb[unit],'new troops inherit Elite research');
  assert.equal(run("eliteUniqueUnitUpgrade('"+unit+"',1)"),null,'foreign team never inherits Elite');
  assert.equal(run("research(castle,'"+key+"')"),false,'duplicate upgrade is rejected');
 }
});

test('Imperial Crenellations changes real Teuton Castle target range, not tower range',()=>{
 const run=game(5),tech=JSON.parse(run('JSON.stringify(TE.ut5)'));
 assert.deepEqual(tech.cost,{f:600,s:400});
 assert.equal(tech.t,60);
 assert.equal(tech.age,3);
 const old=run("attackRange({k:'cs',t:0})");
 run('S.age[0]=2');
 assert.equal(run("research(castle,'ut5')"),false);
 run('S.age[0]=3');
 assert.equal(run("research(castle,'ut5')"),true);
 assert.equal(run('S.res[0].s'),9600);
 assert.equal(run("attackRange({k:'cs',t:0})"),old);
 run('upB(castle,60.1)');
 assert.equal(run("attackRange({k:'cs',t:0})"),old+3);
 assert.equal(run("attackRange({k:'cs',t:1})"),old);
 assert.equal(run("attackRange({k:'tw',t:0})"),run("attackRange({k:'tw',t:1})"));
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut5')"),false);
});

test('Aztec Castle Atlatl increases live Skirmisher reach and damage; Garland Wars remains Imperial',()=>{
 const run=game(19);
 run("globalThis.attacker={k:'skirm',t:0,x:10,y:10};globalThis.victim={k:'mil',t:1,x:11,y:10,hp:500,p:[]}");
 const hit=()=>run('(()=>{victim.hp=500;dmgT(attacker,victim);return 500-victim.hp})()');
 const oldRange=run("attackRange(attacker)"),oldHit=hit();
 run('S.age[0]=2');
 assert.equal(run("research(castle,'ut19')"),false);
 assert.equal(run("research(castle,'ut19p')"),true);
 assert.equal(run('S.res[0].f'),9600);
 assert.equal(run('S.res[0].g'),9650);
 run('upB(castle,40.1)');
 assert.equal(run("attackRange(attacker)"),oldRange+1);
 assert.equal(hit(),oldHit+1);
 assert.equal(run("attackRange({k:'skirm',t:1})"),oldRange);
 run('S.age[0]=3');
 assert.equal(run("research(castle,'ut19')"),true);
 run('upB(castle,60.1)');
 run("attacker.k='mil'");
 const before=hit();
 run('S.tech[0].ut19=0');
 assert.equal(before-hit(),4,'Garland Wars adds four live infantry attack');
 run('S.tech[0].ut19=1;S.civ[0]=1');
 assert.equal(run("attackRange({k:'skirm',t:0})"),oldRange,'foreign civ cannot retain Atlatl');
});

test('Chinese Rocketry adds +2 Chu Ko Nu and +4 Scorpion hit damage only after completion',()=>{
 const run=game(10);
 run("globalThis.attacker={k:'chuko',t:0,x:8,y:8};globalThis.victim={k:'mil',t:1,x:9,y:8,hp:500,p:[]}");
 const hit=()=>run('(()=>{victim.hp=500;dmgT(attacker,victim);return 500-victim.hp})()');
 const chuko=hit();
 assert.equal(run("research(castle,'ut10p')"),true);
 assert.equal(run('S.res[0].w'),9400);
 assert.equal(run('S.res[0].g'),9400);
 assert.equal(hit(),chuko);
 run('upB(castle,60.1)');
 assert.equal(hit(),chuko+2);
 run("attacker.k='scor'");
 const boosted=hit();
 run('S.tech[0].ut10p=0');
 assert.equal(boosted-hit(),4);
 run('S.tech[0].ut10p=1;S.civ[0]=1');
 assert.equal(hit(),boosted-4);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut10p')"),false);
});

test('new Castle technologies and Elite unit effects survive current-build save/load',()=>{
 const run=game(19);
 run("S.tech[0].ut19p=1;S.tech[0].atlatl=1;S.tech[0].eliteJaguarWarrior=1;S.tech[0].hpb={jaguar:15};S.tech[0].atkb={jaguar:2}");
 const range=run("attackRange({k:'skirm',t:0})"),hp=run("mhp({k:'jaguar',t:0})");
 assert.equal(run("saveG(false,'ck_castle_content_test')"),true);
 run('S.civ[0]=1;S.tech[0]={}');
 assert.equal(run("loadG(false,'ck_castle_content_test')"),true);
 assert.equal(run("attackRange({k:'skirm',t:0})"),range);
 assert.equal(run("mhp({k:'jaguar',t:0})"),hp);
});
