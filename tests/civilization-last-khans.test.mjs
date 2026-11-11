import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(civ=29){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.lastKhansEval=code=>eval(code)',sandbox);
 const run=sandbox.lastKhansEval;
 run("seedOv=311126;kingdoms=2;startAge=3;startRes=3;start();S.civ=["+civ+",0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.pj=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.nd.fill(null);S.res[0]={f:10000,w:10000,g:10000,s:10000};S.res[1]={f:10000,w:10000,g:10000,s:10000};globalThis.castle=addB(0,'castle',10,12,true);globalThis.stable=addB(0,'stable',20,12,true);globalThis.bar=addB(0,'bar',29,12,true);globalThis.range=addB(0,'rng',38,12,true);globalThis.krepost=addB(0,'krepost',46,12,true);globalThis.allyCastle=addB(1,'castle',10,30,true)");
 return run;
}
const json=(run,expr)=>JSON.parse(run('JSON.stringify('+expr+')'));

test('32 appended factions preserve old IDs, have independent paid Castle lines and Elite upgrades',()=>{
 const run=fixture();
 assert.equal(run('CIV.length'),34);
 assert.equal(run('CIV[28].n'),'Vietnamese');
 for(const [id,name,kind] of [[29,'Bulgarians','konnik'],[30,'Tatars','keshik'],[31,'Cumans','kipchak']]){
  assert.equal(run('CIV['+id+'].n'),name);
  assert.equal(run('CIV['+id+'].uu'),kind);
  for(const k of ['ut'+id,'ut'+id+'p', 'elite'+({29:'Konnik',30:'Keshik',31:'Kipchak'}[id])]){
   assert.ok(run('TE['+JSON.stringify(k)+'].t')>0);
   assert.ok(Object.values(json(run,'TE['+JSON.stringify(k)+'].cost')).some(v=>v>0));
  }
  run('S.civ[0]='+id);
  assert.equal(run("trOf(castle).includes("+JSON.stringify(kind)+")"),true);
  assert.equal(run("rsOf(castle).includes('ut"+id+"p')"),true);
 }
 run('S.civ[0]=0');
 assert.equal(run("trOf(castle).includes('konnik')"),false);
 assert.equal(run("rsOf(castle).includes('ut29')"),false);
});

test('Steppe Lancers and Castle Flaming Camels obey faction access, age and research gates',()=>{
 const run=fixture(29);
 for(const id of [0,2,29,30,31]){
  run('S.civ[0]='+id);
  assert.equal(run("trOf(stable).includes('steppe')"),[2,30,31].includes(id));
 }
 run('S.civ[0]=30');
 assert.equal(run("trOf(castle).includes('flamecamel')"),false);
 assert.equal(run("train(castle,'flamecamel')"),false);
 run('S.age[0]=2');
 assert.equal(run("research(castle,'ut30p')"),false);
 run('S.age[0]=3');
 assert.equal(run("research(castle,'ut30p')"),true);
 assert.equal(run("trOf(castle).includes('flamecamel')"),false,'not unlocked until researched');
 run('upB(castle,60.1)');
 assert.equal(run("trOf(castle).includes('flamecamel')"),true);
 assert.equal(run("train(castle,'flamecamel')"),true);
 assert.equal(run("trOf(allyCastle).includes('flamecamel')"),false);
});

test('Krepost authorization, paid construction and Konnik production use same civilization boundary',()=>{
 const run=fixture(29);
 assert.equal(run("civilizationBuildingAllowed('krepost',0)"),true);
 assert.equal(run("civilizationBuildingAllowed('krepost',1)"),false);
 assert.equal(run("trOf(krepost).includes('konnik')"),true);
 assert.equal(run("train(krepost,'konnik')"),true);
 assert.equal(run('krepost.q[0].k'),'konnik');
 assert.equal(run("technologyTreeModel(0,S).buildings.some(b=>b.id==='krepost')"),true);
 run('S.civ[0]=30');
 assert.equal(run("civilizationBuildingAllowed('krepost',0)"),false);
 assert.equal(run("trOf(krepost).includes('konnik')"),false);
 assert.equal(run("train(krepost,'konnik')"),false);
 assert.equal(run("technologyTreeModel(0,S).buildings.some(b=>b.id==='krepost')"),false);
});

test('Bulgarians research Stirrups and Bagains for actual cavalry speed and infantry protection',()=>{
 const run=fixture(29);
 const before=run("attackReload({k:'konnik',t:0})");
 const enemy=run("attackReload({k:'konnik',t:1})");
 assert.equal(before,enemy);
 assert.equal(run("research(castle,'ut29')"),true);
 run('upB(castle,40.1)');
 assert.ok(run("attackReload({k:'konnik',t:0})")<before);
 assert.equal(run("attackReload({k:'konnik',t:1})"),enemy);
 const armor=run("combatArmor({k:'mil',t:0},'m')");
 assert.equal(run("research(castle,'ut29p')"),true);
 run('upB(castle,60.1)');
 assert.equal(run("combatArmor({k:'mil',t:0},'m')"),armor+3);
 assert.equal(run("combatArmor({k:'mil',t:1},'m')"),armor);
 assert.equal(run("combatArmor({k:'mil',t:0},'p')"),run("combatArmor({k:'mil',t:1},'p')"));
});

test('Konnik death spawns one dismounted hostile-targeting infantry, not infinite free troops',()=>{
 const run=fixture(29);
 run("globalThis.mounted=addU(0,'konnik',22,28);globalThis.foeUnit=addU(1,'mil',23,28);globalThis.enemy=addU(1,'knight',22.5,28);mounted.tg=foeUnit;mounted.o='a';mounted.hp=1");
 const length=run('S.us.length');
 run('dmgT(enemy,mounted)');
 assert.equal(run('mounted.dead'),1);
 assert.equal(run('S.us.length'),length+1);
 assert.equal(run("S.us[S.us.length-1].k"),'footkonnik');
 assert.equal(run("S.us[S.us.length-1].t"),0);
 assert.equal(run('S.us[S.us.length-1].hp'),45);
 run('dmgT(enemy,mounted)');
 assert.equal(run('S.us.length'),length+1,'corpse cannot dismount twice');
});

test('Tatar Keshiks generate gold only on actual surviving enemy combat hits',()=>{
 const run=fixture(30);
 run("globalThis.keshik=addU(0,'keshik',22,28);globalThis.target=addU(1,'knight',23,28);target.hp=500;globalThis.other={k:'keshik',t:0,x:22,y:28}");
 const gold=run('S.res[0].g');
 run('dmgT(keshik,target)');
 assert.equal(run('S.res[0].g'),gold+1);
 run('dmgT(other,target)');
 assert.equal(run('S.res[0].g'),gold+1,'forged attacker does not generate income');
 run('S.civ[0]=0;dmgT(keshik,target)');
 assert.equal(run('S.res[0].g'),gold+1,'research identity does not transfer');
});

test('Tatar Silk Armor protects cavalry, Timurid Siegecraft extends Trebuchets',()=>{
 const run=fixture(30);
 const armor=run("combatArmor({k:'steppe',t:0},'p')"),range=run("attackRange({k:'treb',t:0})");
 assert.equal(run("research(castle,'ut30')"),true);
 run('upB(castle,40.1)');
 assert.equal(run("combatArmor({k:'steppe',t:0},'p')"),armor+1);
 assert.equal(run("combatArmor({k:'steppe',t:1},'p')"),armor);
 assert.equal(run("combatArmor({k:'cavarch',t:0},'m')"),1);
 assert.equal(run("research(castle,'ut30p')"),true);
 run('upB(castle,60.1)');
 assert.equal(run("attackRange({k:'treb',t:0})"),range+2);
 assert.equal(run("attackRange({k:'treb',t:1})"),range);
});

test('Flaming Camels explode once, hit multiple enemies and cannot hurt allies',()=>{
 const run=fixture(30);
 run("globalThis.bomberCamel=addU(0,'flamecamel',30,30);globalThis.target=addU(1,'knight',30.9,30);globalThis.extra=addU(1,'scout',31.3,30);globalThis.friend=addU(0,'scout',31,31);bomberCamel.o='a';bomberCamel.tg=target;bomberCamel.cd=0");
 const start=run('target.hp'),extra=run('extra.hp'),friendly=run('friend.hp');
 assert.equal(run('detonateFlamingCamel(bomberCamel)'),true,
  JSON.stringify(json(run,"({hp:bomberCamel.hp,o:bomberCamel.o,dead:bomberCamel.dead,cd:bomberCamel.cd,inArmy:S.us.includes(bomberCamel),target:bomberCamel.tg?.k,targetHp:target.hp,hostile:isHostile(bomberCamel.t,target.t),dist:Math.hypot(bomberCamel.x-target.x,bomberCamel.y-target.y),rng:U.flamecamel.rng,dip:S.dip[0][1],civ:S.civ[0]})")));
 assert.equal(run('bomberCamel.dead'),1);
 assert.ok(run('target.hp')<start);
 assert.ok(run('extra.hp')<extra);
 assert.equal(run('friend.hp'),friendly);
 assert.equal(run('detonateFlamingCamel(bomberCamel)'),false);
});

test('Cuman Kipchaks fire real multiple arrows and Steppe Husbandry trains cavalry faster',()=>{
 const run=fixture(31);
 run("globalThis.shooter=addU(0,'kipchak',22,28);globalThis.target=addU(1,'mil',25,28)");
 const rate=run("trainRate(stable,'steppe')");
 run('launchProjectile(shooter,target)');
 assert.equal(run('S.pj.length'),2);
 assert.equal(run("research(castle,'ut31')"),true);
 run('upB(castle,50.1)');
 assert.equal(run("trainRate(stable,'steppe')"),rate*1.5);
 assert.equal(run("trainRate({k:'stable',t:1},'steppe')"),rate);
 run('S.pj=[]');
 assert.equal(run("research(castle,'eliteKipchak')"),true);
 run('upB(castle,55.1)');
 run('launchProjectile(shooter,target)');
 assert.equal(run('S.pj.length'),3);
});

test('Cuman Mercenaries allows each allied team five free Kipchaks with reserve/refund',()=>{
 const run=fixture(31);
 run("S.dip[0][1]='ally';S.dip[1][0]='ally'");
 assert.equal(run("trOf(allyCastle).includes('kipchak')"),false);
 assert.equal(run("research(castle,'ut31p')"),true);
 run('upB(castle,55.1)');
 assert.equal(run("trOf(allyCastle).includes('kipchak')"),true);
 const gold=run('S.res[1].g'),wood=run('S.res[1].w');
 assert.equal(run("train(allyCastle,'kipchak')"),true);
 assert.equal(run('S.tech[1].mercKipchakClaims'),1);
 assert.equal(run('S.res[1].g'),gold);
 assert.equal(run('S.res[1].w'),wood);
 assert.equal(run('cancelQ(allyCastle)'),true);
 assert.equal(run('S.tech[1].mercKipchakClaims'),0);
 for(let i=0;i<5;i++)assert.equal(run("train(allyCastle,'kipchak')"),true);
 assert.equal(run('S.tech[1].mercKipchakClaims'),5);
 assert.equal(run("trOf(allyCastle).includes('kipchak')"),false);
 assert.equal(run("train(allyCastle,'kipchak')"),false);
});

test('foreign technology spoofing cannot unlock Mercenaries, Flaming Camels or Kreposts',()=>{
 const run=fixture(0);
 run('S.tech[0].ut29p=1;S.tech[0].ut30p=1;S.tech[0].ut31p=1');
 assert.equal(run("trOf(castle).includes('flamecamel')"),false);
 assert.equal(run("trOf(krepost).includes('konnik')"),false);
 assert.equal(run("combatArmor({k:'mil',t:0},'m')"),run("combatArmor({k:'mil',t:1},'m')"));
 assert.equal(run("trOf(allyCastle).includes('kipchak')"),false);
});
