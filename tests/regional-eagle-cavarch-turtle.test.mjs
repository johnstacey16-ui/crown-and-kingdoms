import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(civ=20){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.regionalEval=code=>eval(code);',sandbox);
 const run=sandbox.regionalEval;
 run("kingdoms=2;startAge=3;startRes=3;start();S.civ=["+civ+",0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.pj=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.nd.fill(null);S.res[0]={f:10000,w:10000,g:10000,s:10000};S.res[1]={f:10000,w:10000,g:10000,s:10000};globalThis.tc=addB(0,'tc',10,12,true);globalThis.bar=addB(0,'bar',18,12,true);globalThis.range=addB(0,'rng',25,12,true);globalThis.dock=addB(0,'dock',32,12,true);globalThis.castle=addB(0,'castle',39,12,true)");
 return run;
}
const read=run=>JSON.parse(run("JSON.stringify({civ:S.civ,tech:S.tech[0],resources:S.res[0]})"));

test('three regional units are real roster kinds with team-locked Barracks, Range and Dock access',()=>{
 const run=game();
 const sample=(civ,building,unit)=>{
  run('S.civ[0]='+civ);
  return run("trOf({k:"+JSON.stringify(building)+",t:0}).includes("+JSON.stringify(unit)+")");
 };
 for(const id of [19,20,21])assert.equal(sample(id,'bar','eagle'),true,'Meso Eagle '+id);
 for(const id of [0,1,24,25])assert.equal(sample(id,'bar','eagle'),false,'non-Meso Eagle '+id);
 for(const id of [20,19,21])assert.equal(sample(id,'rng','cavarch'),false,'Meso cannot field mounted archer');
 for(const id of [0,2,24,25])assert.equal(sample(id,'rng','cavarch'),true,'mounted archer '+id);
 assert.equal(sample(24,'dock','turtle'),true);
 assert.equal(sample(25,'dock','turtle'),false);
 for(const [kind,key,age] of [['eagle','eliteEagle',2],['cavarch','heavyCavArch',2],['turtle','eliteTurtle',2]]){
  assert.equal(run('U['+JSON.stringify(kind)+'].age'),age);
  assert.equal(run('TE['+JSON.stringify(key)+'].age'),3);
  assert.ok(run('U['+JSON.stringify(kind)+'].cost.g')>0);
 }
 const foreign=run("trOf({k:'dock',t:1}).includes('turtle')");
 assert.equal(foreign,false);
});

test('regional research is filtered by the same selector that validates player and enemy orders',()=>{
 const run=game(20);
 assert.equal(run("rsOf(bar).includes('eliteEagle')"),true);
 assert.equal(run("rsOf(range).includes('heavyCavArch')"),false);
 assert.equal(run("rsOf(dock).includes('eliteTurtle')"),false);
 assert.equal(run("research(dock,'eliteTurtle')"),false);
 assert.equal(run("research(range,'heavyCavArch')"),false);
 run('S.civ[0]=24');
 assert.equal(run("rsOf(dock).includes('eliteTurtle')"),true);
 assert.equal(run("rsOf(range).includes('heavyCavArch')"),true);
 assert.equal(run("rsOf(bar).includes('eliteEagle')"),false);
 assert.equal(run("research(bar,'eliteEagle')"),false);
 assert.equal(run("rsOf({k:'dock',t:1}).includes('eliteTurtle')"),false);
 const menu=JSON.parse(run('JSON.stringify(technologyTreeModel(0,S))'));
 assert.ok(menu.buildings.find(b=>b.id==='dock').research.some(t=>t.id==='eliteTurtle'));
 assert.ok(menu.buildings.find(b=>b.id==='dock').units.some(t=>t.id==='turtle'));
 assert.ok(!menu.buildings.find(b=>b.id==='bar').units.some(t=>t.id==='eagle'));
});

test('paid standard regional upgrades change existing troops and future troop statistics',()=>{
 const run=game();
 for(const [id,building,key,kind] of [
  [20,'bar','eliteEagle','eagle'],
  [25,'range','heavyCavArch','cavarch'],
  [24,'dock','eliteTurtle','turtle']
 ]){
  run('S.civ[0]='+id+';S.age[0]=2;S.tech[0]={};S.res[0]={f:10000,w:10000,g:10000,s:10000};S.us=[];bar.rs=null;range.rs=null;dock.rs=null');
  const tech=JSON.parse(run('JSON.stringify(TE['+JSON.stringify(key)+'])'));
  run("globalThis.hero=addU(0,"+JSON.stringify(kind)+",22,26)");
  const prior=run('mhp(hero)');
  assert.equal(run('research('+building+','+JSON.stringify(key)+')'),false,'needs Imperial '+key);
  run('S.age[0]=3');
  assert.equal(run('research('+building+','+JSON.stringify(key)+')'),true,key+' paid');
  for(const [resource,amount] of Object.entries(tech.cost))assert.equal(run('S.res[0]['+JSON.stringify(resource)+']'),10000-amount,key+' payment');
  assert.equal(run('mhp(hero)'),prior,'research not applied early');
  run('upB('+building+','+(tech.t+.1)+')');
  assert.equal(run('hero.hp'),prior+tech.hpb[kind],key+' existing unit heals');
  assert.equal(run('mhp({k:'+JSON.stringify(kind)+',t:0})'),prior+tech.hpb[kind],key+' future unit');
  assert.equal(run('mhp({k:'+JSON.stringify(kind)+',t:1})'),run('U['+JSON.stringify(kind)+'].hp'),key+' foreign HP');
  assert.equal(run('research('+building+','+JSON.stringify(key)+')'),false,key+' no duplicate research');
 }
});

test('Mayan El Dorado improves living Eagle Warriors and recruits, not other infantry',()=>{
 const run=game(20);
 run("globalThis.hero=addU(0,'eagle',11,25);globalThis.other=addU(0,'mil',13,25)");
 const old=run('mhp(hero)'),other=run('mhp(other)'),tech=JSON.parse(run('JSON.stringify(TE.ut20p)'));
 assert.equal(tech.age,3);
 assert.equal(tech.t,70);
 assert.deepEqual(tech.cost,{f:750,g:450});
 assert.equal(run("research(castle,'ut20p')"),true);
 assert.equal(run('S.res[0].f'),9250);
 run('upB(castle,70.1)');
 assert.equal(run('hero.hp'),old+40);
 assert.equal(run('mhp(hero)'),old+40);
 assert.equal(run("mhp({k:'eagle',t:0})"),old+40);
 assert.equal(run("mhp({k:'eagle',t:1})"),old);
 assert.equal(run('mhp(other)'),other);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut20p')"),false);
});

test('Magyar Recurve Bow adds actual Cavalry Archer range and combat damage without buffing other nations',()=>{
 const run=game(25);
 run("globalThis.shooter={k:'cavarch',t:0,x:20,y:25};globalThis.target={k:'mil',t:1,x:22,y:25,hp:500,p:[]}");
 const attack=()=>run("(()=>{target.hp=500;dmgT(shooter,target);return 500-target.hp})()");
 const range=run('attackRange(shooter)'),before=attack();
 assert.equal(run("research(castle,'ut25p')"),true);
 run('upB(castle,40.1)');
 assert.equal(run('attackRange(shooter)'),range+1);
 assert.equal(attack(),before+1);
 run('S.civ[0]=1');
 assert.equal(run('attackRange(shooter)'),range);
 assert.equal(attack(),before);
});

test('Korean Eupseong changes Tower range, Shinkichon launches a live triple Turtle Ship volley',()=>{
 const run=game(24);
 const towerRange=run("attackRange({k:'tw',t:0})");
 const castleRange=run("attackRange({k:'cs',t:0})");
 assert.equal(run("research(castle,'ut24p')"),true);
 run('upB(castle,40.1)');
 assert.equal(run("attackRange({k:'tw',t:0})"),towerRange+2);
 assert.equal(run("attackRange({k:'cs',t:0})"),castleRange);
 assert.equal(run("attackRange({k:'tw',t:1})"),towerRange);
 const shipRange=run("attackRange({k:'turtle',t:0})");
 run("globalThis.target={k:'gal',t:1,x:35,y:31,hp:500,p:[]};S.us.push(target)");
 const shooter="{k:'turtle',t:0,x:31,y:31}";
 run('launchProjectile('+shooter+',target)');
 assert.equal(run('S.pj.length'),1);
 run('S.pj=[];S.age[0]=2');
 assert.equal(run("research(castle,'ut24')"),false);
 run('S.age[0]=3');
 assert.equal(run("research(castle,'ut24')"),true);
 run('upB(castle,60.1)');
 assert.equal(run("attackRange({k:'turtle',t:0})"),shipRange+1);
 run('launchProjectile('+shooter+',target)');
 assert.equal(run('S.pj.length'),3);
 run('pjs(1)');
 assert.equal(run('S.pj.length'),0);
 assert.ok(run('target.hp')<500);
 run('S.civ[0]=1;target.hp=500;S.pj=[]');
 assert.equal(run("attackRange({k:'turtle',t:0})"),shipRange);
 run('launchProjectile('+shooter+',target)');
 assert.equal(run('S.pj.length'),1);
});

test('new unit armor classes, counter damage, Bloodlines and hull upgrades are active',()=>{
 const run=game(24);
 run('S.tech[0].armI=1;S.tech[0].armR=1;S.tech[0].blood=1;S.tech[0].hpb={cavarch:20};S.tech[0].navalHull=1;S.tech[0].atkb={turtle:3};S.tech[0].hpb.turtle=35');
 assert.equal(run("combatArmor({k:'eagle',t:0},'m')"),run("combatArmor({k:'eagle',t:1},'m')")+1);
 assert.equal(run("combatArmor({k:'cavarch',t:0},'p')"),run("combatArmor({k:'cavarch',t:1},'p')")+1);
 assert.equal(run("mhp({k:'cavarch',t:0})"),70);
 assert.equal(run("mhp({k:'turtle',t:0})"),310);
 assert.equal(run("mhp({k:'turtle',t:1})"),275);
 assert.equal(run("combatArmor({k:'turtle',t:0},'p')"),7);
 run('S.tech[0].eliteTurtle=1');
 assert.equal(run("combatArmor({k:'turtle',t:0},'p')"),12);
});

test('regional unit production research and civ state survive same-build save/load',()=>{
 const run=game(24);
 run('S.tech[0].ut24=1;S.tech[0].ut24p=1;S.tech[0].eliteTurtle=1;S.tech[0].hpb={turtle:75};S.tech[0].atkb={turtle:2}');
 const before=run("attackRange({k:'tw',t:0})");
 assert.equal(run("saveG(false,'ck_regional_unit_test')"),true);
 run('S.civ[0]=0;S.tech[0]={}');
 assert.equal(run("loadG(false,'ck_regional_unit_test')"),true);
 assert.equal(run("attackRange({k:'tw',t:0})"),before);
 assert.equal(run("mhp({k:'turtle',t:0})"),350);
 assert.equal(run("trOf({k:'dock',t:0}).includes('turtle')"),true);
});
