import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
function game(civ=1){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.execTest=code=>eval(code);',sandbox);
 const run=sandbox.execTest;
 run("kingdoms=2;startAge=3;startRes=3;start();S.age=[3,3];S.civ=["+civ+",0];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.us=[];S.bs=[];S.pj=[];globalThis.castle={k:'castle',t:0,x:20,y:20,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 return run;
}
const cases=[[1,'ut1p','Warwolf',3],[4,'ut4p','Citadels',3],[8,'ut8p','Counterweights',3],[9,'ut9p','Artillery',3],[12,'ut12p','Double Crossbow',3],[14,'ut14p','Inquisition',2],[16,'ut16p','Druzhina',3],[21,'ut21p','Fabric Shields',3],[22,'ut22p','Torsion Engines',3],[23,'ut23p','Farimba',3]];
test('ten unique technologies have live Castle selectors, research payments, age gates and no foreign authorization',()=>{
 const run=game();
 for(const [id,key,label,requiredAge] of cases){
  run('S.civ[0]='+id+';S.tech[0]={};S.age[0]=1;castle.rs=null;castle.q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const d=JSON.parse(run('JSON.stringify(TE['+JSON.stringify(key)+'])'));
  assert.equal(d.n,label);
  assert.equal(d.age,requiredAge);
  assert.ok(d.t>0&&Object.keys(d.cost).length>0);
  assert.equal(run('rsOf(castle).includes('+JSON.stringify(key)+')'),true);
  assert.equal(run("rsOf({k:'castle',t:1}).includes("+JSON.stringify(key)+")"),false);
  const model=JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))')).buildings.find(b=>b.id==='castle');
  assert.equal(model.research.find(t=>t.id===key)?.state,'locked');
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),false);
  run('S.age[0]='+requiredAge);
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),true);
  for(const [k,n] of Object.entries(d.cost))assert.equal(run('S.res[0]['+JSON.stringify(k)+']'),10000-n);
  assert.equal(run('S.tech[0]['+JSON.stringify(key)+']'),undefined,'tech applies at completion');
  run('upB(castle,'+(d.t+.1)+')');
  assert.equal(run('S.tech[0]['+JSON.stringify(key)+']'),1);
  assert.equal(run('research(castle,'+JSON.stringify(key)+')'),false);
 }
});
test('Persian Citadels modifies actual Castle arrow damage vs infantry and only that faction',()=>{
 const run=game(4);
 run("globalThis.enemy={k:'mil',t:1,x:10,y:10,hp:500,p:[]}");
 const fire=()=>run("(()=>{enemy.hp=500;dmgT({k:'cs',t:0},enemy);return 500-enemy.hp})()");
 const old=fire();
 run('S.tech[0].ut4p=1');
 assert.equal(fire(),old+7);
 run('S.civ[0]=1');
 assert.equal(fire(),old);
 run('S.civ[0]=4;enemy.k="knight"');
 assert.equal(fire(),run("U.cs.dmg")+4-run("combatArmor(enemy,'p')"));
});
test('Saracen Counterweights and Malian Farimba change deterministic siege and Stable attacks',()=>{
 const run=game(8);
 run("globalThis.enemy={k:'mil',t:1,x:10,y:10,hp:500,p:[]};globalThis.attacker={k:'mang',t:0,x:11,y:10}");
 const hit=()=>run("(()=>{enemy.hp=500;dmgT(attacker,enemy);return 500-enemy.hp})()");
 const original=hit();
 run('S.tech[0].ut8p=1');
 assert.equal(hit(),original+Math.round(run('U.mang.dmg')*.15));
 run("attacker.k='treb'");
 const siege=hit();
 run('S.tech[0].ut8p=0');
 assert.equal(siege-hit(),Math.round(run('U.treb.dmg')*.15)*run('U.treb.du'));
 run('S.civ[0]=23;S.tech[0]={};attacker.k="knight"');
 const knight=hit();
 run('S.tech[0].ut23p=1');
 assert.equal(hit(),knight+5);
 run('S.civ[0]=0');
 assert.equal(hit(),knight);
});
test('Turkish Artillery boosts live cannon ranges but not normal bows or foreign cannons',()=>{
 const run=game(9);
 const bomb=run("attackRange({k:'bomb',t:0})"),naval=run("attackRange({k:'cgal',t:0})");
 run('S.tech[0].ut9p=1');
 assert.equal(run("attackRange({k:'bomb',t:0})"),bomb+2);
 assert.equal(run("attackRange({k:'cgal',t:0})"),naval+2);
 assert.equal(run("attackRange({k:'bomb',t:1})"),bomb);
 assert.equal(run("attackRange({k:'arc',t:0})"),run("attackRange({k:'arc',t:1})"));
 run('S.civ[0]=1');
 assert.equal(run("attackRange({k:'bomb',t:0})"),bomb);
});
test('Khmer Double Crossbow emits two real Scorpion projectiles and resolves both hits',()=>{
 const run=game(12);
 run("globalThis.enemy={k:'mil',t:1,x:15,y:15,hp:500,p:[]};S.us.push(enemy)");
 const shooter="{k:'scor',t:0,x:12,y:15}";
 run('launchProjectile('+shooter+',enemy)');
 assert.equal(run('S.pj.length'),1);
 run('S.pj=[];S.tech[0].ut12p=1');
 run('launchProjectile('+shooter+',enemy)');
 assert.equal(run('S.pj.length'),2);
 run('pjs(1)');
 assert.equal(run('S.pj.length'),0);
 const two=run('500-enemy.hp');
 assert.ok(two>0,'two projectiles actually inflict damage');
 run('S.tech[0].ut12p=0;S.pj=[];enemy.hp=500;launchProjectile('+shooter+',enemy);pjs(1)');
 assert.equal(two,2*(500-run('enemy.hp')),'two normal bolt impacts');
});
test('Spanish Inquisition speeds actual monk conversion progress for its owner only',()=>{
 const run=game(14);
 run("globalThis.monk={k:'mon',t:0,x:10,y:10,hp:30,faith:100,cd:0,o:'v',cv:0,p:[]};globalThis.enemy={k:'mil',t:1,x:11,y:10,hp:100,p:[],netId:'enemy-1'};monk.tg=enemy;monk.cvTargetId='enemy-1';monk.cvTeam=1;S.us=[monk,enemy]");
 run('S.tech[0].ut14p=1;tickConversion(monk,1)');
 assert.equal(run('monk.cv'),1.3);
 run('S.civ[0]=0;monk.cv=0;tickConversion(monk,1)');
 assert.equal(run('monk.cv'),1);
});
test('Slavic Druzhina triggers a bounded hostile-only melee splash through live hit()',()=>{
 const run=game(16);
 run("globalThis.attacker={k:'mil',t:0,x:10,y:10,hp:40,ld:null};globalThis.primary={k:'mil',t:1,x:11,y:10,hp:200,p:[]};globalThis.near={k:'mil',t:1,x:11.5,y:10,hp:200,p:[]};globalThis.ally={k:'mil',t:0,x:11.5,y:10.1,hp:200,p:[]};globalThis.far={k:'mil',t:1,x:15,y:10,hp:200,p:[]};S.us=[attacker,primary,near,ally,far]");
 run('hit(attacker,primary)');
 assert.equal(run('near.hp'),200,'Druzhina needs completed research');
 run('primary.hp=200;S.tech[0].ut16p=1;hit(attacker,primary)');
 assert.equal(run('near.hp'),195,'secondary victim takes exactly five splash');
 assert.equal(run('ally.hp'),200);
 assert.equal(run('far.hp'),200);
 run('S.civ[0]=0;near.hp=200;primary.hp=200;hit(attacker,primary)');
 assert.equal(run('near.hp'),200,'foreign team cannot fake technology');
});
test('Inca Fabric Shields adds melee/pierce armour exclusively to Kamayuks',()=>{
 const run=game(21);
 const beforeM=run("combatArmor({k:'kamayuk',t:0},'m')"),beforeP=run("combatArmor({k:'kamayuk',t:0},'p')");
 run('S.tech[0].ut21p=1');
 assert.equal(run("combatArmor({k:'kamayuk',t:0},'m')"),beforeM+1);
 assert.equal(run("combatArmor({k:'kamayuk',t:0},'p')"),beforeP+2);
 assert.equal(run("combatArmor({k:'kamayuk',t:1},'p')"),beforeP);
 assert.equal(run("combatArmor({k:'mil',t:0},'p')"),run("combatArmor({k:'mil',t:1},'p')"));
});
test('Warwolf and Torsion Engines extend live splash radii with strict faction checks',()=>{
 const run=game(1);
 const exercise=(kind,id,key,spread)=>{
  run('S.civ[0]='+id+';S.tech[0]={};S.pj=[];S.us=[]');
  run("globalThis.target={k:'mil',t:1,x:30,y:30,hp:500,p:[]};globalThis.extra={k:'mil',t:1,x:"+(30+spread)+",y:30,hp:500,p:[]};S.us.push(target,extra)");
  const shot=()=>run("(()=>{S.pj=[];extra.hp=500;target.hp=500;launchProjectile({k:'"+kind+"',t:0,x:25,y:30},target);pjs(1);return 500-extra.hp})()");
  assert.equal(shot(),0,'default radius excludes secondary '+kind);
  run('S.tech[0].'+key+'=1');
  assert.ok(shot()>0,'unique technology expands blast for '+kind);
  run('S.civ[0]=0');
  assert.equal(shot(),0,'wrong civ must not keep blast');
 };
 exercise('treb',1,'ut1p',1.7);
 exercise('mang',22,'ut22p',1.95);
});
test('new siege and infantry research flags survive save/reload in the current build',()=>{
 const run=game(21);
 run("S.tech[0].ut21p=1;S.tech[0].fabricShields=1;S.tech[0].eliteKamayuk=1;S.tech[0].hpb={kamayuk:15};S.tech[0].atkb={kamayuk:2}");
 const pierce=run("combatArmor({k:'kamayuk',t:0},'p')");
 assert.equal(run("saveG(false,'ck_second_unique_batch_test')"),true);
 run('S.civ[0]=0;S.tech[0]={}');
 assert.equal(run("loadG(false,'ck_second_unique_batch_test')"),true);
 assert.equal(run("combatArmor({k:'kamayuk',t:0},'p')"),pierce);
 assert.equal(run('S.tech[0].ut21p'),1);
});


test('Castle completion applies each faction attack upgrade exactly once through live combat',()=>{
 const run=game();
 for(const [id,tech,unit,expected] of [
  [19,'ut19','mil',4],        // Aztec Garland Wars
  [23,'ut23p','knight',5],    // Malian Farimba
  [25,'ut25p','cavarch',1]    // Magyar Recurve Bow
 ]){
  run('S.civ[0]='+id+';S.tech[0]={};S.age[0]=3;S.res[0]={f:10000,w:10000,g:10000,s:10000};castle.rs=null;castle.q=[]');
  run("globalThis.attacker={k:'"+unit+"',t:0,x:10,y:10,hp:100,p:[]};globalThis.victim={k:'mil',t:1,x:11,y:10,hp:1000,p:[]}");
  const strike=()=>run('(()=>{victim.hp=1000;dmgT(attacker,victim);return 1000-victim.hp})()');
  const baseline=strike();
  assert.equal(run('research(castle,'+JSON.stringify(tech)+')'),true,tech+' is Castle-researchable');
  assert.equal(strike(),baseline,'queued research changes no stats');
  run('upB(castle,TE['+JSON.stringify(tech)+'].t+0.1)');
  assert.equal(run('S.tech[0]['+JSON.stringify(tech)+']'),1,tech+' completes');
  assert.equal(strike(),baseline+expected,tech+' applies the intended bonus once');
  run('S.civ[0]=0');
  assert.equal(strike(),baseline,'foreign civilization cannot inherit '+tech);
 }
});
