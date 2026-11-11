import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(civ=26){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evalExpansion=code=>eval(code)',sandbox);
 const run=sandbox.evalExpansion;
 run("seedOv=260401;kingdoms=2;startAge=3;startRes=3;start();S.civ=["+civ+",0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.pj=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.nd.fill(null);S.res[0]={f:10000,w:10000,g:10000,s:10000};S.res[1]={f:10000,w:10000,g:10000,s:10000};globalThis.castle=addB(0,'castle',10,12,true);globalThis.stable=addB(0,'stable',20,12,true);globalThis.dock=addB(0,'dock',29,12,true);globalThis.market=addB(0,'market',38,12,true)");
 return run;
}
const json=(run,code)=>JSON.parse(run('JSON.stringify('+code+')'));

test('29 ordered civilizations retain earlier IDs and expose three priced Castle lines',()=>{
 const run=game();
 assert.equal(run('CIV.length'),29);
 assert.equal(run('CIV[25].n'),'Magyars');
 for(const [id,name,kind,first,second,elite] of [
  [26,'Portuguese','orgun','ut26','ut26p','eliteOrganGun'],
  [27,'Burmese','arambai','ut27','ut27p','eliteArambai'],
  [28,'Vietnamese','rattan','ut28','ut28p','eliteRattanArcher']
 ]){
  assert.equal(run('CIV['+id+'].n'),name);
  assert.equal(run('CIV['+id+'].uu'),kind);
  assert.ok(run('U['+JSON.stringify(kind)+'].hp')>0);
  for(const key of [first,second,elite]){
   assert.ok(run('TE['+JSON.stringify(key)+'].t')>0);
   assert.ok(Object.values(json(run,'TE['+JSON.stringify(key)+'].cost')).some(x=>x>0));
  }
  run('S.civ[0]='+id);
  assert.equal(run("trOf(castle).includes("+JSON.stringify(kind)+")"),true,name+' Castle unit');
  assert.equal(run('rsOf(castle).includes('+JSON.stringify(first)+')'),true);
  assert.equal(run('rsOf(castle).includes('+JSON.stringify(second)+')'),true);
  assert.equal(run('rsOf(castle).includes('+JSON.stringify(elite)+')'),true);
 }
 run('S.civ[0]=0');
 assert.equal(run("rsOf(castle).includes('ut26')"),false,'legacy faction cannot research new Castle technologies');
 assert.equal(run("trOf(castle).includes('orgun')"),false,'legacy faction cannot train Organ Guns');
});

test('Caravels and Battle Elephants have restricted host-shared production and upgrade rules',()=>{
 const run=game();
 for(const id of [0,12,26,27,28]){
  run('S.civ[0]='+id);
  assert.equal(run("trOf(dock).includes('caravel')"),id===26);
  assert.equal(run("rsOf(dock).includes('eliteCaravel')"),id===26);
  assert.equal(run("trOf(stable).includes('batele')"),[12,27,28].includes(id));
  assert.equal(run("rsOf(stable).includes('heavyBatele')"),[12,27,28].includes(id));
 }
 run('S.civ[0]=26');
 assert.equal(run("research(stable,'heavyBatele')"),false);
 run('S.civ[0]=27');
 assert.equal(run("research(dock,'eliteCaravel')"),false);
 assert.equal(run("trOf({k:'dock',t:1}).includes('caravel')"),false);
 const tree=json(run,'technologyTreeModel(0,S)');
 assert.ok(tree.buildings.find(b=>b.id==='stable').units.some(u=>u.id==='batele'));
 assert.ok(!tree.buildings.find(b=>b.id==='dock').units.some(u=>u.id==='caravel'));
});

test('Portuguese paid gold discount and cancellation refund share actual unit costs',()=>{
 const run=game(26);
 const base=run('U.orgun.cost.g'),discount=run("unitTrainingCost(0,'orgun').g");
 assert.equal(base,70);
 assert.equal(discount,60);
 assert.equal(run("train(castle,'orgun')"),true);
 assert.equal(run('S.res[0].g'),10000-discount);
 assert.equal(run('S.res[0].w'),9920);
 assert.equal(run('castle.q[0].k'),'orgun');
 assert.equal(run('cancelQ(castle)'),true);
 assert.equal(run('S.res[0].g'),10000);
 assert.equal(run('S.res[0].w'),10000);
 run('S.civ[0]=0');
 assert.equal(run("unitTrainingCost(0,'orgun').g"),70);
 assert.equal(run("train(castle,'orgun')"),false);
});

test('Feitoria needs Portuguese ownership and free population; its income uses actual building ticks',()=>{
 const run=game(26);
 assert.equal(run("civilizationBuildingAllowed('feitoria',0)"),true);
 assert.equal(run("civilizationBuildingAllowed('feitoria',1)"),false);
 assert.equal(run("okPlace(0,'feitoria',47,24)"),false,'cannot evade Feitoria population footprint');
 run("for(let i=0;i<6;i++)addB(0,'house',4+i*3,39,true)");
 assert.equal(run("capOf(0)"),40);
 assert.equal(run("okPlace(0,'feitoria',47,24)"),true);
 run("globalThis.feitoria=addB(0,'feitoria',47,24,true)");
 assert.equal(run("popOf(0)"),20);
 const before=json(run,'S.res[0]');
 run('upB(feitoria,10)');
 const after=json(run,'S.res[0]');
 assert.equal(after.f-before.f,3);
 assert.equal(after.w-before.w,3);
 assert.equal(after.g-before.g,2);
 assert.equal(after.s-before.s,1);
 run('S.civ[0]=1');
 assert.equal(run("okPlace(0,'feitoria',53,24)"),false,'foreign civilisation cannot place Portuguese building');
 const own=run('popOf(0)');
 run('feitoria.hp=0');
 assert.equal(run('popOf(0)'),own-20,'destroyed Feitoria releases population');
});

test('Portuguese Carrack armors ships and Arquebus predicts moving gunpowder targets',()=>{
 const run=game(26);
 run('CIV[26].fx(0)');
 assert.equal(run("mhp({k:'caravel',t:0})"),121);
 assert.equal(run("mhp({k:'caravel',t:1})"),110);
 const before=run("combatArmor({k:'caravel',t:0},'p')");
 assert.equal(run("research(castle,'ut26')"),true);
 run('upB(castle,50.1)');
 assert.equal(run("combatArmor({k:'caravel',t:0},'p')"),before+1);
 assert.equal(run("combatArmor({k:'caravel',t:1},'p')"),run("PRA.caravel"));
 run("globalThis.shooter={k:'orgun',t:0,x:24,y:30};globalThis.target={k:'mil',t:1,x:28,y:30,hp:500,p:[[32,30]]}");
 const baseline=json(run,'projectileAim(shooter,target)');
 assert.equal(run("research(castle,'ut26p')"),true);
 run('upB(castle,60.1)');
 const predicted=json(run,'projectileAim(shooter,target)');
 assert.ok(predicted.tx>baseline.tx,'Arquebus predicts movement without changing the base firing range');
 run('launchProjectile(shooter,target)');
 assert.equal(run('S.pj.length'),3,'Organ Gun fires three simulated pellets');
 run('S.civ[0]=0');
 assert.equal(json(run,'projectileAim(shooter,target)').tx,baseline.tx,'foreign factions cannot keep Arquebus');
});

test('Burmese military upgrades modify real cavalry-vs-ranged and Battle Elephant armor',()=>{
 const run=game(27);
 run('CIV[27].fx(0)');
 const infantry={k:'mil',t:0,x:25,y:30},enemy={k:'mil',t:1,x:26,y:30,hp:500,p:[]};
 run("globalThis.melee="+JSON.stringify(infantry)+";globalThis.enemy="+JSON.stringify(enemy));
 const hit=()=>run("(()=>{enemy.hp=500;dmgT(melee,enemy);return 500-enemy.hp})()");
 run('S.age[0]=1');
 const feudal=hit();run('S.age[0]=2');assert.equal(hit(),feudal+1);
 run('S.age[0]=3');assert.equal(hit(),feudal+2);
 const p0=run("combatArmor({k:'batele',t:0},'p')");
 assert.equal(p0,run("combatArmor({k:'batele',t:1},'p')")+1);
 run("globalThis.cavalry={k:'knight',t:0,x:20,y:25};globalThis.ranged={k:'rattan',t:1,x:22,y:25,hp:500,p:[]}");
 const anti=()=>run("(()=>{ranged.hp=500;dmgT(cavalry,ranged);return 500-ranged.hp})()");
 const raw=anti();
 assert.equal(run("research(castle,'ut27')"),true);
 run('upB(castle,40.1)');
 assert.equal(anti(),raw+4,'Manipur Cavalry bonus only versus ranged');
 assert.equal(run("research(castle,'ut27p')"),true);
 run('upB(castle,40.1)');
 assert.equal(run("combatArmor({k:'batele',t:0},'p')"),p0+1);
 assert.equal(run("combatArmor({k:'batele',t:0},'m')"),run("combatArmor({k:'batele',t:1},'m')")+2);
 run('S.civ[0]=0');
 assert.equal(anti(),raw-3,'changing faction removes Burmese infantry/Manipur bonuses');
});

test('Vietnamese Chatras changes Battle Elephant HP and Paper Money rewards deposited wood',()=>{
 const run=game(28);
 run("globalThis.elephant=addU(0,'batele',24,28)");
 const old=run('mhp(elephant)');
 assert.equal(old,250);
 assert.equal(run("research(castle,'ut28')"),true);
 run('upB(castle,50.1)');
 assert.equal(run('elephant.hp'),old+100);
 assert.equal(run('mhp(elephant)'),old+100);
 assert.equal(run("mhp({k:'batele',t:1})"),old);
 assert.equal(run("research(castle,'ut28p')"),true);
 run('upB(castle,55.1)');
 run("globalThis.lumber=addB(0,'lumber',48,22,true);globalThis.worker=addU(0,'vil',49,23);worker.o='g';worker.ct='w';worker.car=10;worker.ret=1;worker.dropKey=dropoffKey(lumber)");
 const wood=run('S.res[0].w'),gold=run('S.res[0].g');
 run('upU(worker,.1)');
 assert.equal(run('S.res[0].w'),wood+10);
 assert.equal(run('S.res[0].g'),gold+1);
 run('S.civ[0]=0;worker.car=10;worker.ret=1;worker.o="g";worker.dropKey=dropoffKey(lumber)');
 const second=run('S.res[0].g');
 run('upU(worker,.1)');
 assert.equal(run('S.res[0].g'),second,'Paper Money stops benefiting foreign factions');
});

test('Portuguese unique building, unit rank and paid research survive same-build save/load',()=>{
 const run=game(26);
 run("for(let i=0;i<6;i++)addB(0,'house',4+i*3,39,true);globalThis.feitoria=addB(0,'feitoria',47,24,true)");
 assert.equal(run("research(castle,'eliteOrganGun')"),true);
 run('upB(castle,60.1)');
 const health=run("mhp({k:'orgun',t:0})");
 assert.equal(run("saveG(false,'ck_expansion_29')"),true);
 run('S.civ[0]=0;S.tech[0]={};S.bs=[]');
 assert.equal(run("loadG(false,'ck_expansion_29')"),true);
 assert.equal(run('S.civ[0]'),26);
 assert.equal(run("mhp({k:'orgun',t:0})"),health);
 assert.equal(run("S.bs.filter(b=>b.t===0&&b.k==='feitoria'&&b.hp>0).length"),1);
 assert.equal(run("popOf(0)")>=20,true);
});
