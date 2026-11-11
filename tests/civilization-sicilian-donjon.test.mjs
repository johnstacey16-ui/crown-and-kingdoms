import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 const network=['network-sync','network-commands']
  .map(name=>readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8')).join('\n');
 vm.runInContext(source+'\n'+network+'\nglobalThis.runSicilian=code=>eval(code);',sandbox);
 const run=sandbox.runSicilian;
 run("seedOv=341126;kingdoms=2;msz=0;startAge=3;startRes=3;startArmy=0;start();S.civ=[34,0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.tc=addB(0,'tc',10,12,true);globalThis.bar=addB(0,'bar',18,12,true);globalThis.castle=addB(0,'castle',30,12,true);globalThis.serj=addU(0,'serjeant',23.5,21.5);globalThis.vill=addU(0,'vil',26.5,21.5);");
 return run;
}
const asObject=(run,expression)=>JSON.parse(run('JSON.stringify('+expression+')'));

test('Sicilians append stable civilization ID 34 with Serjeant, Donjon, and three Castle upgrades',()=>{
 const run=fixture();
 assert.equal(run('CIV.length'),41);
 assert.equal(run('CIV[34].n'),'Sicilians');
 assert.equal(run('CIV[33].n'),'Burgundians');
 assert.equal(run("civilizationBuildingAllowed('donjon',0)"),true);
 assert.equal(run("civilizationBuildingAllowed('donjon',1)"),false);
 assert.equal(run("trOf({k:'donjon',t:0}).includes('serjeant')"),true);
 assert.equal(run("trOf({k:'donjon',t:1}).includes('serjeant')"),false);
 assert.equal(run("trOf(castle).includes('serjeant')"),true);
 assert.equal(run("rsOf(castle).includes('ut34')"),true);
 assert.equal(run("rsOf(castle).includes('ut34p')"),true);
 assert.equal(run("rsOf(castle).includes('eliteSerjeant')"),true);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut34p')"),false);
 const tree=asObject(run,'technologyTreeModel(0,S)');
 assert.equal(tree.buildings.find(b=>b.id==='donjon').units.find(u=>u.id==='serjeant').state,'available');
 assert.equal(asObject(run,'technologyTreeModel(1,S)').buildings.some(b=>b.id==='donjon'),false);
});

test('Donjon training obeys Feudal age, paid queue, completion and foreign-civilization restrictions',()=>{
 const run=fixture();
 run("globalThis.don=addB(0,'donjon',46,28,true)");
 run('S.age[0]=0');
 assert.equal(run("train(don,'serjeant')"),false);
 run('S.age[0]=1');
 const before=run('JSON.stringify(S.res[0])');
 assert.equal(run("train(don,'serjeant')"),true);
 assert.equal(run('S.res[0].f'),9940);
 assert.equal(run('S.res[0].g'),9965);
 assert.equal(run("cancelQ(don)"),true);
 assert.equal(run('JSON.stringify(S.res[0])'),before);
 assert.equal(run("train(don,'serjeant')"),true);
 const prior=run('S.us.length');
 run('upB(don,U.serjeant.t+0.1)');
 assert.equal(run('S.us.length'),prior+1);
 assert.equal(run('S.us.at(-1).k'),'serjeant');
 run("S.civ[0]=0;don.q=[]");
 assert.equal(run("train(don,'serjeant')"),false);
});

test('Serjeant build wheel allows Donjons only; villagers retain the complete build menu',()=>{
 const run=fixture();
 run('S.sel=[serj];openMenu()');
 assert.deepEqual(asObject(run,'menu.items.map(i=>i.l)'),['Donjon','Stop (go idle)']);
 assert.equal(run("selectedBuilders('donjon').length"),1);
 assert.equal(run('selectedBuilders().length'),0);
 assert.equal(run("bLock('donjon')"),'');
 run('S.sel=[vill];openMenu()');
 const names=asObject(run,'menu.items.map(i=>i.l)');
 assert.ok(names.includes('Donjon'));
 assert.ok(names.includes('House'));
 run('S.civ[0]=0');
 assert.equal(run("bLock('donjon')"),'Only Sicilians can construct a Donjon');
});

test('multiplayer unit menu exposes only the faction-safe Donjon builder and repair actions',()=>{
 const run=fixture();
 const options=asObject(run,'CK_GAME_COMMANDS.unitOptions(S,0,serj)');
 assert.ok(options.some(o=>o.type==='build'&&o.value==='donjon'&&o.targeted),'Serjeant is offered a real Donjon build command');
 assert.ok(options.some(o=>o.type==='repair'&&o.label.includes('Donjon')),'Serjeant can repair owned Donjons');
 assert.equal(options.some(o=>o.type==='build'&&o.value==='house'),false,'Serjeant cannot build houses');
 run('S.civ[0]=0');
 const foreign=asObject(run,'CK_GAME_COMMANDS.unitOptions(S,0,serj)');
 assert.equal(foreign.some(o=>o.type==='build'||o.type==='repair'),false,'non-Sicilian Serjeant cannot act as a builder');
});

test('authenticated commands allow Serjeant Donjons but reject other construction and foreign faction',()=>{
 const run=fixture();
 run("globalThis.sendBuild=(value,x,y,unit=serj,team=0)=>CK_GAME_COMMANDS.execute({type:'build',entities:[unit.netId],point:{x,y},value},team,2)");
 const funds=run('JSON.stringify(S.res[0])');
 assert.equal(run("sendBuild('house',24,24)"),false,'Serjeant cannot make ordinary houses');
 assert.equal(run('JSON.stringify(S.res[0])'),funds,'failed build does not spend resources');
 assert.equal(run("sendBuild('donjon',24,24)"),true,'Sicilian Serjeant may build a Donjon');
 assert.equal(run("S.bs.some(b=>b.k==='donjon'&&b.t===0&&!b.done)"),true);
 assert.equal(run('S.res[0].s'),9825);
 assert.equal(run("sendBuild('donjon',24,24)"),false,'blocked footprint rejects duplicates');
 run("S.civ[0]=0;serj.o='i';serj.tg=null");
 assert.equal(run("sendBuild('donjon',35,25)"),false,'foreign faction cannot use Serjeant build ability');
});

test('unit simulation advances legal Donjon construction but rejects other Serjeant building work',()=>{
 const run=fixture();
 run("globalThis.don=addB(0,'donjon',24,24,false);serj.x=23.5;serj.y=24.5;serj.o='b';serj.tg=don;serj.p=[]");
 const before=run('don.pr');
 run('upU(serj,2)');
 assert.ok(run('don.pr')>before,'living Serjeant performs actual construction work');
 run("globalThis.house=addB(0,'house',34,24,false);serj.o='b';serj.tg=house;serj.p=[]");
 run('upU(serj,0.5)');
 assert.equal(run('serj.o'),'i','Serjeant cannot use a forged order to construct a House');
 assert.equal(run('house.pr'),0);
});

test('First Crusade spawns real population-limited Serjeants only after Castle research',()=>{
 const run=fixture();
 run('S.age[0]=1');
 assert.equal(run("research(castle,'ut34')"),false);
 run('S.age[0]=2');
 const before=run("S.us.filter(u=>u.k==='serjeant'&&u.t===0).length");
 assert.equal(run("research(castle,'ut34')"),true);
 assert.equal(run("S.us.filter(u=>u.k==='serjeant'&&u.t===0).length"),before);
 run('upB(castle,TE.ut34.t+0.1)');
 assert.equal(run('S.tech[0].ut34'),1);
 assert.equal(run("S.us.filter(u=>u.k==='serjeant'&&u.t===0).length"),before+5);
 assert.equal(run("research(castle,'ut34')"),false);
});

test('Hauberk improves Knights only after research, Elite upgrade buffs Serjeants',()=>{
 const run=fixture();
 const melee=run("combatArmor({k:'knight',t:0},'m')");
 const pierce=run("combatArmor({k:'knight',t:0},'p')");
 run('S.age[0]=2');
 assert.equal(run("research(castle,'ut34p')"),false);
 run('S.age[0]=3');
 assert.equal(run("research(castle,'ut34p')"),true);
 assert.equal(run("combatArmor({k:'knight',t:0},'p')"),pierce);
 run('upB(castle,TE.ut34p.t+0.1)');
 assert.equal(run("combatArmor({k:'knight',t:0},'m')"),melee+1);
 assert.equal(run("combatArmor({k:'knight',t:0},'p')"),pierce+2);
 assert.equal(run("combatArmor({k:'serjeant',t:0},'p')"),run("combatArmor({k:'serjeant',t:1},'p')"));
 run('S.civ[0]=0');
 assert.equal(run("combatArmor({k:'knight',t:0},'m')"),melee);
 run("S.civ[0]=34;castle.rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}");
 const hp=run('mhp(serj)');
 assert.equal(run("research(castle,'eliteSerjeant')"),true);
 run('upB(castle,TE.eliteSerjeant.t+0.1)');
 assert.equal(run('serj.hp'),hp+15);
 assert.equal(run('mhp(serj)'),hp+15);
 assert.equal(run("S.tech[0].atkb.serjeant"),2);
});

test('same-build save reload retains Sicilian Donjons, Serjeants and research',()=>{
 const run=fixture();
 run("globalThis.don=addB(0,'donjon',44,28,true);S.tech[0].ut34p=1;S.tech[0].hauberk=1");
 assert.equal(run("saveG(false,'sicilian_current_build')"),true);
 run('S.civ[0]=0;S.tech[0]={};S.us=[];S.bs=[]');
 assert.equal(run("loadG(false,'sicilian_current_build')"),true);
 assert.equal(run('S.civ[0]'),34);
 assert.equal(run("S.us.some(u=>u.k==='serjeant'&&u.t===0)"),true);
 assert.equal(run("S.bs.some(b=>b.k==='donjon'&&b.t===0)"),true);
 assert.equal(run("combatArmor({k:'knight',t:0},'p')"),run("combatArmor({k:'knight',t:1},'p')")+2);
});
