import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

// AoE II: DE Mongol Drill, verified 11 November 2026 against the civilization
// technology tree: Imperial Castle research, 500 wood, 450 gold, 60 seconds.
// https://liquipedia.net/ageofempires/Drill
function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 const run=sandbox.evaluate;
 run('kingdoms=2;startAge=3;startRes=3;start();S.civ=[2,1];S.age=[3,3];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000}');
 return run;
}

test('Mongol Drill is an Imperial Castle-only technology with the documented resources and duration',()=>{
 const run=game();
 const tech=JSON.parse(run('JSON.stringify(TE.ut2p)'));
 assert.equal(tech.n,'Drill');
 assert.equal(tech.age,3);
 assert.deepEqual(tech.cost,{w:500,g:450});
 assert.equal(tech.t,60);
 assert.equal(run("rsOf({k:'castle',t:0}).includes('ut2p')"),true);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut2p')"),false);
 assert.equal(run("rsOf({k:'siege',t:0}).includes('ut2p')"),false);
 const tree=JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))'));
 const option=tree.buildings.find(x=>x.id==='castle').research.find(x=>x.id==='ut2p');
 assert.equal(option.name,'Drill');
 assert.equal(option.state,'available');
 assert.deepEqual(option.cost,{w:500,g:450});
 run('S.age[0]=2');
 assert.equal(JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))')).buildings.find(x=>x.id==='castle').research.find(x=>x.id==='ut2p').state,'locked');
});

test('real Castle research unlocks 50% faster Siege Workshop movement, only for the owning Mongols',()=>{
 const run=game();
 run("globalThis.testCastle={k:'castle',t:0,x:6,y:6,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:9999};S.bs.push(testCastle)");
 const base=JSON.parse(run("JSON.stringify(Object.fromEntries(['ram','mang','scor','bomb','treb','knight'].map(k=>[k,unitSpeed({k,t:0})])))"));
 assert.equal(run("research(testCastle,'ut2p')"),true,'Castle must accept the legal Mongol research');
 assert.equal(run("testCastle.rs.k"),'ut2p');
 assert.equal(run('S.res[0].w'),9500);
 assert.equal(run('S.res[0].g'),9550);
 assert.equal(run('S.tech[0].drill'),undefined,'the boost is not applied while the timer is running');
 run('upB(testCastle,61)');
 assert.equal(run('S.tech[0].ut2p'),1);
 assert.equal(run('S.tech[0].drill'),1);
 for(const k of ['ram','mang','scor','bomb']){
  assert.ok(Math.abs(run("unitSpeed({k:'"+k+"',t:0})")-base[k]*1.5)<1e-9,k+' is 50% faster');
 }
 assert.equal(run("unitSpeed({k:'treb',t:0})"),base.treb,'Castle trebuchets are not Siege Workshop units');
 assert.equal(run("unitSpeed({k:'knight',t:0})"),base.knight,'Drill never changes cavalry');
 assert.equal(run("unitSpeed({k:'ram',t:1})"),base.ram,'other civilizations keep their own speed');
 assert.equal(run("research(testCastle,'ut2p')"),false,'completed research cannot be purchased twice');
});

test('non-Mongols and pre-Imperial Mongols cannot spend resources on Drill',()=>{
 const run=game();
 run("globalThis.testCastle={k:'castle',t:0,x:6,y:6,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:9999};S.bs.push(testCastle)");
 const initial=run('JSON.stringify(S.res[0])');
 run('S.age[0]=2');
 assert.equal(run("research(testCastle,'ut2p')"),false);
 run('S.age[0]=3;S.civ[0]=1');
 assert.equal(run("research(testCastle,'ut2p')"),false);
 assert.equal(run('JSON.stringify(S.res[0])'),initial);
 assert.equal(run('testCastle.rs'),null);
});

test('new-build save/load preserves the researched team bonus and actual siege speed',()=>{
 const run=game();
 run('S.tech[0].ut2p=1;S.tech[0].drill=1');
 const before=run("unitSpeed({k:'ram',t:0})");
 assert.equal(run("saveG(false,'ck_mongol_drill_test')"),true);
 run('S.tech[0].drill=0;S.tech[0].ut2p=0');
 assert.equal(run("loadG(false,'ck_mongol_drill_test')"),true);
 assert.equal(run('S.tech[0].ut2p'),1);
 assert.equal(run('S.tech[0].drill'),1);
 assert.equal(run("unitSpeed({k:'ram',t:0})"),before);
});
