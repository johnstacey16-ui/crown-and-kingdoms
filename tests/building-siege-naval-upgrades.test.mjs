import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

// Building and unit upgrades reuse existing production, save, AI and
// authenticated research paths; no new sprite kinds are implied by a tier.
function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 const run=sandbox.evaluate;
 run('kingdoms=2;startAge=3;startRes=3;start();S.civ=[5,1];S.age=[3,3];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.bs=[];S.us=[];S.pj=[]');
 run("globalThis.castle={k:'castle',t:0,x:18,y:18,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 run("globalThis.university={k:'univ',t:0,x:26,y:18,s:3,hp:550,mh:550,done:true,pr:35,q:[],rs:null,cd:999};S.bs.push(university)");
 run("globalThis.workshop={k:'siege',t:0,x:27,y:27,s:3,hp:500,mh:500,done:true,pr:30,q:[],rs:null,cd:999};S.bs.push(workshop)");
 run("globalThis.dock={k:'dock',t:0,x:10,y:18,s:2,hp:600,mh:600,done:true,pr:25,q:[],rs:null,cd:999};S.bs.push(dock)");
 return run;
}
test('Architecture is Imperial, requires paid Masonry, and affects old and new building armour/HP',()=>{
 const run=game();
 const arch=JSON.parse(run('JSON.stringify(TE.arch)'));
 assert.deepEqual(arch.cost,{f:300,w:200});
 assert.equal(arch.age,3);
 assert.equal(arch.pre,'mas');
 assert.equal(run("rsOf(university).includes('arch')"),true);
 const initial=run('castle.mh');
 assert.equal(run("research(university,'arch')"),false);
 assert.equal(run("research(university,'mas')"),true);
 run('upB(university,50.1)');
 const afterMasonry=run('castle.mh'),oldArmor=run("combatArmor(castle,'m')");
 assert.equal(afterMasonry,Math.round(initial*1.4));
 assert.equal(run("research(university,'arch')"),true);
 assert.equal(run('S.res[0].f'),9700-150,'Masonry costs 150 food; Architecture another 300');
 run('upB(university,70.1)');
 assert.equal(run('castle.mh'),Math.round(afterMasonry*1.1));
 assert.equal(run("combatArmor(castle,'m')"),oldArmor+1);
 assert.equal(run("combatArmor(castle,'p')"),9);
 assert.equal(run("combatArmor(castle,'s')"),5);
 const future=run("(()=>{const b=addB(0,'house',42,42,true);return b.mh})()");
 assert.equal(future,Math.round(200*1.4*1.1),'later buildings get the research too');
 assert.equal(run("combatArmor({k:'house',t:1,s:2},'m')"),2,'no foreign building bonus');
});

test('Architecture cannot be ordered by civilizations without the Masonry prerequisite',()=>{
 const run=game();
 for(const civ of [3,19]){
  run('S.civ[0]='+civ+';S.tech[0]={};university.rs=null');
  assert.equal(run("rsOf(university).includes('mas')"),false);
  assert.equal(run("rsOf(university).includes('arch')"),false);
  assert.equal(run("research(university,'arch')"),false);
  assert.equal(run('university.rs'),null);
 }
 run('S.civ[0]=5;S.tech[0]={}');
 assert.equal(run("rsOf(university).includes('mas')"),true);
 assert.equal(run("rsOf(university).includes('arch')"),true);
});

test('Hoardings grants Castle HP to existing and later Castles, not towers, for the paying team',()=>{
 const run=game();
 const tech=JSON.parse(run('JSON.stringify(TE.hoardings)'));
 assert.deepEqual(tech.cost,{f:400,w:400});
 assert.equal(tech.t,75);
 run('S.age[0]=2');
 assert.equal(run("research(castle,'hoardings')"),false);
 run('S.age[0]=3');
 const before=run('castle.mh'),univHP=run('university.mh');
 assert.equal(run("research(castle,'hoardings')"),true);
 assert.equal(run('S.res[0].w'),9600);
 run('upB(castle,75.1)');
 assert.equal(run('castle.mh'),before+1000);
 assert.equal(run('castle.hp'),before+1000);
 assert.equal(run('university.mh'),univHP);
 assert.equal(run("(()=>{const b=addB(0,'castle',40,40,true);return b.mh})()"),1400+1000);
 assert.equal(run("(()=>{const b=addB(1,'castle',48,48,true);return b.mh})()"),1400);
});

test('Heavy Scorpion research changes actual damage and present/future unit HP',()=>{
 const run=game();
 run("globalThis.hero={k:'scor',t:0,hp:U.scor.hp,x:8,y:8};globalThis.enemy={k:'mil',t:1,hp:500,x:9,y:8,p:[]};S.us=[hero,enemy]");
 const hit=()=>run('(()=>{enemy.hp=500;dmgT(hero,enemy);return 500-enemy.hp})()');
 const old=hit(),base=run('mhp(hero)');
 const tech=JSON.parse(run('JSON.stringify(TE.heavyScorp)'));
 assert.deepEqual(tech.cost,{f:800,w:900});
 assert.equal(tech.age,3);
 assert.equal(run("research(workshop,'heavyScorp')"),true);
 assert.equal(run('hero.hp'),base);
 run('upB(workshop,50.1)');
 assert.equal(run('hero.hp'),base+10);
 assert.equal(run("mhp({k:'scor',t:0})"),base+10);
 assert.equal(hit(),old+4);
 assert.equal(run("mhp({k:'scor',t:1})"),base,'foreign siege stays base');
});

test('Imperial Dock upgrades increase Galleon hull/range and Fast Fire Ship hull/attack speed',()=>{
 const run=game();
 const range=run("attackRange({k:'gal',t:0})"),shipHP=run("mhp({k:'gal',t:0})");
 const fireHP=run("mhp({k:'fire',t:0})"),reload=run("attackReload({k:'fire',t:0})");
 assert.deepEqual(JSON.parse(run('JSON.stringify(TE.galleon.cost)')),{w:400,g:315});
 assert.deepEqual(JSON.parse(run('JSON.stringify(TE.fastFire.cost)')),{f:280,g:250});
 run('S.age[0]=2');
 assert.equal(run("research(dock,'galleon')"),false);
 run('S.age[0]=3');
 assert.equal(run("research(dock,'galleon')"),true);
 run('upB(dock,65.1)');
 assert.equal(run("attackRange({k:'gal',t:0})"),range+1);
 assert.equal(run("mhp({k:'gal',t:0})"),shipHP+30);
 assert.equal(run("attackRange({k:'gal',t:1})"),range);
 assert.equal(run("research(dock,'fastFire')"),true);
 run('upB(dock,50.1)');
 assert.equal(run("mhp({k:'fire',t:0})"),fireHP+20);
 assert.ok(run("attackReload({k:'fire',t:0})")<reload);
 assert.equal(run("attackReload({k:'fire',t:1})"),reload);
 assert.equal(run("research(dock,'fastFire')"),false);
});

test('new building and naval upgrades survive a same-build save/load',()=>{
 const run=game();
 run("S.tech[0].arch=1;S.tech[0].hoardings=1;S.tech[0].galleon=1;S.tech[0].fastFire=1;S.tech[0].heavyScorp=1;S.tech[0].hpb={gal:30,fire:20,scor:10};S.tech[0].atkb={gal:2,fire:1,scor:4}");
 const armor=run("combatArmor(castle,'m')"),range=run("attackRange({k:'gal',t:0})");
 assert.equal(run("saveG(false,'ck_building_naval_upgrades_test')"),true);
 run('S.tech[0]={}');
 assert.equal(run("loadG(false,'ck_building_naval_upgrades_test')"),true);
 assert.equal(run("combatArmor(castle,'m')"),armor);
 assert.equal(run("attackRange({k:'gal',t:0})"),range);
 assert.equal(run("mhp({k:'scor',t:0})"),60);
});

for(const order of [['hoardings','mas','arch'],['mas','hoardings','arch'],['mas','arch','hoardings']])
 test('Castle HP matches future construction regardless of upgrade order: '+order.join(' → '),()=>{
  const run=game();run('castle.hp=castle.mh/2');
  for(const key of order){
   const b=key==='hoardings'?'castle':'university';
   assert.equal(run(`research(${b},'${key}')`),true);
   run(`upB(${b},TE['${key}'].t+1)`);
  }
  assert.equal(run('castle.mh'),3156,'Hoardings adds 1000 after structural multipliers');
  assert.equal(run("addB(0,'castle',40,40,true).mh"),run('castle.mh'));
  assert.ok(run('castle.hp>0&&castle.hp<castle.mh'),'research retains damage');
 });

test('Great Wall is consistent for existing, unfinished and later walls, gates and towers',()=>{
 const run=game();run(`S.civ[0]=10;
 globalThis.wall=addB(0,'wall',40,40,true);wall.hp=wall.mh/2;
 globalThis.gate=addB(0,'gate',42,40,false);
 globalThis.tower=addB(0,'tower',44,40,true);
 globalThis.enemy=addB(1,'wall',48,40,true);`);
 assert.equal(run("research(castle,'ut10')"),true);run('upB(castle,TE.ut10.t+1)');
 assert.equal(run('wall.mh'),450);assert.equal(run('wall.hp'),225);
 assert.equal(run('gate.mh'),450);assert.equal(run('tower.mh'),600);
 assert.equal(run("addB(0,'wall',40,45,true).mh"),run('wall.mh'));
 assert.equal(run("addB(0,'tower',44,45,true).mh"),run('tower.mh'));
 assert.equal(run('enemy.mh'),300);
 assert.equal(run('S.tech[0].fw'),undefined,'Great Wall must not consume Fortified Wall research');
 assert.equal(run("research(university,'fw')"),true);run('upB(university,TE.fw.t+1)');
 assert.equal(run('wall.mh'),810);assert.equal(run('tower.mh'),600);
 assert.equal(run("addB(0,'wall',50,45,true).mh"),run('wall.mh'));
});

test('research preserves custom campaign structure strength and never resurrects ruins',()=>{
 const run=game();run(`castle.mh=2800;castle.hp=1400;
 globalThis.tower=addB(0,'tower',40,40,true);tower.mh=800;tower.hp=400;
 globalThis.ruin=addB(0,'castle',46,40,true);ruin.hp=0;`);
 assert.equal(run("research(castle,'hoardings')"),true);run('upB(castle,76)');
 assert.equal(run('castle.mh'),3800);assert.equal(run('castle.hp'),2400);
 assert.equal(run('tower.mh'),800);assert.equal(run('tower.hp'),400);
 assert.equal(run("research(university,'mas')"),true);run('upB(university,51)');
 assert.equal(run('castle.mh'),4920);assert.equal(run('tower.mh'),1120);
 assert.equal(run('ruin.hp'),0);assert.equal(run('ruin.mh'),1400);
});
