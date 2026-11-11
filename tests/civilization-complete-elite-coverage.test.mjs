import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.testEval=code=>eval(code);',sandbox);
 const run=sandbox.testEval;
 run("kingdoms=2;startAge=3;startRes=3;start();S.age=[3,3];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.bs=[];S.us=[];S.pj=[];globalThis.castle={k:'castle',t:0,x:8,y:8,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 return run;
}
test('all 26 civilizations have distinct priced Imperial Elite Castle research and proper locks',()=>{
 const run=game();
 for(let id=0;id<26;id++){
  run('S.civ[0]='+id+';S.civ[1]='+(id===0?1:0)+';S.tech[0]={};castle.rs=null;castle.q=[];S.age[0]=2');
  const [name,unit,key]=JSON.parse(run('JSON.stringify([CIV['+id+'].n,CIV['+id+'].uu,CIV['+id+'].elite.k])'));
  const tech=JSON.parse(run('JSON.stringify(TE['+JSON.stringify(key)+'])'));
  assert.equal(tech.age,3,name+' Elite age');
  assert.ok(tech.t>0&&Object.keys(tech.cost||{}).length>0,name+' Elite has real price and timer');
  assert.ok(tech.hpb?.[unit]||tech.atkb?.[unit],name+' Elite has actual unit effects');
  const menu=JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))')).buildings.find(b=>b.id==='castle');
  assert.equal(menu.research.find(t=>t.id===key)?.state,'locked',name+' cannot research before Imperial');
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),false,name+' cannot buy before Imperial');
  assert.equal(run("rsOf({k:'castle',t:1}).includes("+JSON.stringify(key)+")"),false,name+' foreign Castle cannot buy its Elite');
 }
});
test('fourteen missing Elite upgrades are paid, completed and applied to existing and future troops',()=>{
 const run=game(),ids=[8,9,12,13,14,15,16,17,20,21,22,23,24,25];
 for(const id of ids){
  run("S.civ[0]="+id+";S.age[0]=3;S.tech[0]={};castle.rs=null;castle.q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.us=[]");
  const [unit,key]=JSON.parse(run('JSON.stringify([CIV['+id+'].uu,CIV['+id+'].elite.k])'));
  const tech=JSON.parse(run('JSON.stringify(TE['+JSON.stringify(key)+'])'));
  run('globalThis.hero={k:'+JSON.stringify(unit)+',t:0,hp:U['+JSON.stringify(unit)+'].hp,x:7,y:7};S.us.push(hero)');
  const hp=run('mhp(hero)'),melee=run("combatArmor(hero,'m')"),pierce=run("combatArmor(hero,'p')");
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),true,key+' started');
  for(const [resource,amount] of Object.entries(tech.cost))assert.equal(run('S.res[0]['+JSON.stringify(resource)+']'),10000-amount,key+' charges '+resource);
  assert.equal(run('mhp(hero)'),hp,key+' not before completion');
  run('upB(castle,'+(tech.t+.1)+')');
  assert.equal(run('S.tech[0]['+JSON.stringify(key)+']'),1,key+' completed');
  assert.equal(run('mhp(hero)'),hp+(tech.hpb?.[unit]||0),key+' HP');
  assert.equal(run('hero.hp'),run('mhp(hero)'),key+' heal active unit');
  assert.equal(run('mhp({k:'+JSON.stringify(unit)+',t:0})'),run('mhp(hero)'),key+' new unit');
  assert.equal(run("combatArmor(hero,'m')"),melee+(tech.armor?.m||0),key+' melee armour');
  assert.equal(run("combatArmor(hero,'p')"),pierce+(tech.armor?.p||0),key+' pierce armour');
  assert.equal(run('eliteUniqueUnitUpgrade('+JSON.stringify(unit)+',1)'),null,key+' no enemy effect');
  const charged=run('JSON.stringify(S.res[0])');
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),false,key+' cannot duplicate');
  assert.equal(run('JSON.stringify(S.res[0])'),charged,key+' no double charge');
 }
});
test('Persian and Khmer independent Elite upgrade flags share elephant unit safely',()=>{
 const run=game();
 run('S.civ=[4,12];S.tech=[{eliteWarElephant:1,hpb:{ele:150}},{eliteBattleElephant:1,hpb:{ele:70}}]');
 assert.equal(run("mhp({k:'ele',t:0})"),450);
 assert.equal(run("mhp({k:'ele',t:1})"),370);
 assert.equal(run("eliteUniqueUnitUpgrade('ele',0).k"),'eliteWarElephant');
 assert.equal(run("eliteUniqueUnitUpgrade('ele',1).k"),'eliteBattleElephant');
});
test('new Elite research remains live after save/reload of the same build',()=>{
 const run=game();
 run("S.civ=[24,1];S.tech[0]={eliteWarWagon:1,hpb:{wagon:30},atkb:{wagon:4}}");
 const hp=run("mhp({k:'wagon',t:0})");
 assert.equal(run("saveG(false,'ck_all_elite_test')"),true);
 run('S.tech[0]={};S.civ[0]=1');
 assert.equal(run("loadG(false,'ck_all_elite_test')"),true);
 assert.equal(run("mhp({k:'wagon',t:0})"),hp);
 assert.equal(run("eliteUniqueUnitUpgrade('wagon',0).k"),'eliteWarWagon');
 assert.equal(run("eliteUniqueUnitUpgrade('wagon',1)"),null);
});
