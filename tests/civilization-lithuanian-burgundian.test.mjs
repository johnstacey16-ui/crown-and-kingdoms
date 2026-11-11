import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(civ=32){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evalWest=code=>eval(code)',sandbox);
 const run=sandbox.evalWest;
 run("seedOv=321126;kingdoms=2;startAge=3;startRes=3;start();S.civ=["+civ+",0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.pj=[];S.rel=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.nd.fill(null);S.res[0]={f:10000,w:10000,g:10000,s:10000};S.res[1]={f:10000,w:10000,g:10000,s:10000};globalThis.tc=addB(0,'tc',10,12,true);globalThis.castle=addB(0,'castle',19,12,true);globalThis.bar=addB(0,'bar',28,12,true);globalThis.stable=addB(0,'stable',37,12,true);globalThis.mill=addB(0,'mill',46,12,true);globalThis.mon=addB(0,'monastery',55,12,true)");
 return run;
}
const obj=(run,expr)=>JSON.parse(run('JSON.stringify('+expr+')'));

test('Lithuanians and Burgundians append 32/33 without renumbering earlier civilizations',()=>{
 const run=game();
 assert.equal(run('CIV.length'),37);
 assert.equal(run('CIV[31].n'),'Cumans');
 for(const [id,name,unique] of [[32,'Lithuanians','leitis'],[33,'Burgundians','coust']]){
  assert.equal(run('CIV['+id+'].n'),name);
  assert.equal(run('CIV['+id+'].uu'),unique);
  run('S.civ[0]='+id);
  assert.equal(run("trOf(castle).includes("+JSON.stringify(unique)+")"),true);
  for(const key of ['ut'+id,'ut'+id+'p',id===32?'eliteLeitis':'eliteCoustillier']){
   assert.equal(run('rsOf(castle).includes('+JSON.stringify(key)+')'),true);
   assert.ok(run('TE['+JSON.stringify(key)+'].t')>0);
   assert.ok(Object.values(obj(run,'TE['+JSON.stringify(key)+'].cost')).some(v=>v>0));
  }
 }
 run('S.civ[0]=0');
 assert.equal(run("trOf(castle).includes('leitis')"),false);
 assert.equal(run("trOf(castle).includes('coust')"),false);
 assert.equal(run("rsOf(castle).includes('ut33p')"),false);
});

test('Leitis ignores armour on living enemy troops but other civilizations cannot inherit it',()=>{
 const run=game(32);
 run("globalThis.attacker={k:'leitis',t:0,x:20,y:25};globalThis.victim={k:'knight',t:1,x:22,y:25,hp:500,p:[]}");
 const hit=()=>run("(()=>{victim.hp=500;dmgT(attacker,victim);return 500-victim.hp})()");
 const normal=hit();
 run('S.tech[1].armC=1;S.tech[1].armC2=1;S.tech[1].armC3=1');
 assert.ok(run("combatArmor(victim,'m')")>2);
 assert.equal(hit(),normal,'Leitis ignores increased melee armour on enemy units');
 run('S.civ[0]=0');
 assert.ok(hit()<normal,'foreign Leitis attacker never gains Lithuanian armour bypass');
});

test('Relic attack applies live monastery deposits to Lithuanian Knights and Leitis only',()=>{
 const run=game(32);
 run("globalThis.leitis={k:'leitis',t:0,x:20,y:25};globalThis.enemy={k:'knight',t:1,x:22,y:25,hp:600,p:[]}");
 const hit=unit=>run("(()=>{enemy.hp=600;dmgT("+unit+",enemy);return 600-enemy.hp})()");
 const base=hit('leitis');
 run("S.rel=[{m:mon},{m:mon}]");
 assert.equal(hit('leitis'),base+2);
 assert.equal(hit("{k:'knight',t:0,x:20,y:25}"),run("U.knight.dmg")+2-run("MA.knight"));
 run('S.rel=[{m:mon},{m:mon},{m:mon},{m:mon},{m:mon}]');
 assert.equal(hit('leitis'),base+4,'maximum relic bonus is bounded');
 run('mon.hp=0');
 assert.equal(hit('leitis'),base,'destroyed monastery loses its relic bonus');
 run('mon.hp=mon.mh;S.civ[0]=0');
 assert.equal(hit('leitis'),base-run("combatArmor(enemy,'m')"),'foreign civ never inherits Lithuanian bonus or bypass');
});

test('Lithuanian Town Centres grant food exactly once, including later completed centres',()=>{
 const run=game(32);
 assert.equal(run('S.res[0].f'),10100,'starting completed Town Centre grants 100 food');
 run("globalThis.second=addB(0,'tc',12,30,false)");
 assert.equal(run('S.res[0].f'),10100,'unfinished Town Centre grants nothing');
 run('second.done=true;second.hp=second.mh;upB(second,.1)');
 assert.equal(run('S.res[0].f'),10200);
 run('upB(second,20)');
 assert.equal(run('S.res[0].f'),10200,'saved completion marker prevents repeat grants');
 run('S.civ[0]=33;addB(0,"tc",20,30,true)');
 assert.equal(run('S.res[0].f'),10200);
});

test('Hill Forts, Tower Shields and speed affect correct Lithuanian target classes',()=>{
 const run=game(32);
 const range=run("attackRange({k:'tca',t:0})");
 const speed=run("unitSpeed({k:'spear',t:0})");
 assert.equal(run("unitSpeed({k:'spear',t:1})"),speed/1.1);
 assert.equal(run("unitSpeed({k:'skirm',t:0})"),run("unitSpeed({k:'skirm',t:1})")*1.1);
 assert.equal(run("research(castle,'ut32')"),true);
 run('upB(castle,40.1)');
 assert.equal(run("attackRange({k:'tca',t:0})"),range+3);
 assert.equal(run("attackRange({k:'tca',t:1})"),range);
 const pierce=run("combatArmor({k:'spear',t:0},'p')");
 assert.equal(run("research(castle,'ut32p')"),true);
 run('upB(castle,40.1)');
 assert.equal(run("combatArmor({k:'spear',t:0},'p')"),pierce+2);
 assert.equal(run("combatArmor({k:'skirm',t:0},'p')"),run("combatArmor({k:'skirm',t:1},'p')")+2);
 assert.equal(run("combatArmor({k:'spear',t:0},'m')"),run("combatArmor({k:'spear',t:1},'m')"));
});

test('Burgundian early and discounted economic research is displayed and charged consistently',()=>{
 const run=game(33);
 const wheel=run('TE.wheel.age');
 assert.ok(wheel>=1);
 assert.equal(run("researchEffectiveAge(tc,'wheel')"),wheel-1);
 const base=run('TE.wheel.cost.f'),effective=run("researchCost(tc,'wheel').f");
 assert.equal(effective,Math.ceil(base*.6));
 const tree=obj(run,'technologyTreeModel(0,S)').buildings.find(b=>b.id==='tc');
 const shown=tree.research.find(t=>t.id==='wheel');
 assert.equal(shown.cost.f,effective);
 assert.equal(shown.age,wheel-1);
 run('S.age[0]='+String(wheel-1));
 assert.equal(run("research(tc,'wheel')"),true);
 assert.equal(run('S.res[0].f'),10000-effective);
 run('S.civ[0]=0');
 assert.equal(run("researchCost(tc,'wheel').f"),base);
 assert.equal(run("researchEffectiveAge(tc,'wheel')"),wheel);
});

test('Burgundian Stable technologies cost half and Cavalier is available in Castle Age',()=>{
 const run=game(33);
 const price=obj(run,"researchCost(stable,'husb')");
 const original=obj(run,'TE.husb.cost');
 for(const [res,value] of Object.entries(original))assert.equal(price[res],Math.ceil(value/2));
 assert.equal(run("researchEffectiveAge(stable,'cavl')"),Math.max(0,run('TE.cavl.age')-1));
 run('S.civ[0]=32');
 assert.deepEqual(obj(run,"researchCost(stable,'husb')"),original);
 assert.equal(run("researchEffectiveAge(stable,'cavl')"),run('TE.cavl.age'));
});

test('Burgundian Coustillier recharge is simulation-time based and faction gated',()=>{
 const run=game(33);
 run("globalThis.charger=addU(0,'coust',22,28);globalThis.target={k:'mil',t:1,x:23,y:28,hp:500,p:[]}");
 const hit=()=>run("(()=>{target.hp=500;dmgT(charger,target);return 500-target.hp})()");
 const base=hit();
 run('S.t=36');
 assert.equal(hit(),base+25,'charge takes effect after downtime');
 run('S.t=37');
 assert.equal(hit(),base,'charge resets after a hit');
 run('S.t=80;S.civ[0]=32');
 assert.equal(hit(),base,'foreign faction cannot use Burgundian charge');
 run('S.civ[0]=33');
 assert.equal(run("research(castle,'eliteCoustillier')"),true);
 run('upB(castle,60.1);S.t=120');
 assert.equal(hit(),base+30+2,'Elite Coustillier upgrades charge and base attack');
});

test('Burgundian gunpowder bonus and Flemish Militia counter categories are real combat rules',()=>{
 const run=game(33);
 run("globalThis.hand={k:'hcan',t:0};globalThis.enemy={k:'mil',t:1,x:22,y:25,hp:500,p:[]}");
 const hit=()=>run("(()=>{enemy.hp=500;dmgT(hand,enemy);return 500-enemy.hp})()");
 const bonus=hit();
 run('S.civ[0]=0');
 assert.equal(bonus-hit(),Math.round(run('U.hcan.dmg')*.25));
 run('S.civ[0]=33');
 assert.equal(run("trOf(bar).includes('flemish')"),true);
 assert.equal(run("train(bar,'flemish')"),true);
 run('S.civ[0]=0');
 assert.equal(run("trOf(bar).includes('flemish')"),false);
 assert.equal(run("train(bar,'flemish')"),false);
 run("globalThis.pole={k:'flemish',t:1}");
 assert.ok(run("U.flemish.bn.knight")>0);
 assert.ok(run("SPEAR_CAVALRY.has('coust')"));
});

test('Flemish Revolution charges per villager, transforms actual units and preserves other teams',()=>{
 const run=game(33);
 run("globalThis.first=addU(0,'vil',20,28);globalThis.second=addU(0,'vil',21,28);globalThis.foreign=addU(1,'vil',32,28)");
 assert.deepEqual(obj(run,"researchCost(castle,'ut33p')"),{f:220,g:160});
 const tree=obj(run,'technologyTreeModel(0,S)').buildings.find(b=>b.id==='castle');
 assert.deepEqual(tree.research.find(t=>t.id==='ut33p').cost,{f:220,g:160});
 run('S.age[0]=2');
 assert.equal(run("research(castle,'ut33p')"),false);
 run('S.age[0]=3');
 assert.equal(run("research(castle,'ut33p')"),true);
 assert.equal(run('S.res[0].f'),9780);
 assert.equal(run('S.res[0].g'),9840);
 assert.equal(run('first.k'),'vil','conversion happens on completion, not purchase');
 run('upB(castle,10.1)');
 assert.equal(run('first.k'),'flemish');
 assert.equal(run('second.k'),'flemish');
 assert.equal(run('foreign.k'),'vil');
 assert.equal(run('first.hp'),run('U.flemish.hp'));
 assert.equal(run("research(castle,'ut33p')"),false,'no repeat revolution');
});

test('Burgundian Vineyards adds gold only on farm deliveries, not other resource types',()=>{
 const run=game(33);
 assert.equal(run("research(castle,'ut33')"),true);
 run('upB(castle,50.1)');
 run("globalThis.worker=addU(0,'vil',11,13);worker.o='g';worker.tg={k:'f',fm:true};worker.ct='f';worker.car=10;worker.ret=1;worker.dropKey=dropoffKey(tc)");
 const before=run('S.res[0].g'),food=run('S.res[0].f');
 run('upU(worker,.1)');
 assert.equal(run('S.res[0].g'),before+1.5);
 assert.equal(run('S.res[0].f'),food+10);
 run("worker.car=10;worker.ct='w';worker.ret=1;worker.o='g';worker.dropKey=dropoffKey(tc)");
 const second=run('S.res[0].g');
 run('upU(worker,.1)');
 assert.equal(run('S.res[0].g'),second,'wood cannot produce vineyard gold');
});

test('Burgundian relic food is allied-only and does not duplicate hostile income',()=>{
 const run=game(33);
 run('S.rel=[{m:mon}]');
 const first=run('S.res[0].f'),gold=run('S.res[0].g');
 run('upB(mon,4)');
 assert.equal(run('S.res[0].f'),first+2);
 assert.equal(run('S.res[0].g'),gold+2);
 run("globalThis.otherMon=addB(1,'monastery',55,28,true);S.rel=[{m:otherMon}];S.dip[0][1]='ally';S.dip[1][0]='ally'");
 const allyFood=run('S.res[1].f');
 run('upB(otherMon,4)');
 assert.equal(run('S.res[1].f'),allyFood+2);
 run("S.dip[0][1]='enemy';S.dip[1][0]='enemy'");
 const enemyFood=run('S.res[1].f');
 run('upB(otherMon,4)');
 assert.equal(run('S.res[1].f'),enemyFood);
});

test('current-build saves retain charged cavalry, transformed militia and civ research',()=>{
 const run=game(33);
 run("globalThis.charger=addU(0,'coust',22,28);globalThis.worker=addU(0,'vil',28,28)");
 assert.equal(run("research(castle,'ut33p')"),true);
 run('upB(castle,10.1)');
 assert.equal(run('worker.k'),'flemish');
 const before=run('charger.chargeReadyAt');
 assert.equal(run("saveG(false,'ck_burgundian_gameplay')"),true);
 run("S.civ[0]=0;S.tech[0]={};S.us=[]");
 assert.equal(run("loadG(false,'ck_burgundian_gameplay')"),true);
 assert.equal(run('S.civ[0]'),33);
 assert.equal(run("S.us.some(u=>u.k==='flemish'&&u.t===0)"),true);
 assert.equal(run("S.us.find(u=>u.k==='coust').chargeReadyAt"),before);
 assert.equal(run('S.tech[0].ut33p'),1);
});
