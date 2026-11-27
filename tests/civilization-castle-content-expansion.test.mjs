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
function tiguiGame(){
 const run=game(23);
 run("S.g.fill(0);S.wt.fill(0);S.el.fill(0);S.nd.fill(null);S.ex.fill(1);S.vs.fill(1);globalThis.tc=addB(0,'tc',30,30,true);globalThis.enemy=addU(1,'mil',tc.x+tc.s/2+3,tc.y+tc.s/2);enemy.hp=1000;globalThis.gbeto=addU(0,'gbeto',26,32)");
 return run;
}
test('paid Castle-age Tigui adds eight real Town Centre arrows without the old Gbeto stat bonuses',()=>{
 const run=tiguiGame(),tech=JSON.parse(run('JSON.stringify(TE.ut23)'));
 const shoot=()=>run('S.pj=[];tc.cd=0;upB(tc,.1);S.pj.length');
 const baseline=shoot();assert.equal(baseline,1,'the current game has one ungarrisoned base arrow');
 run('S.age[0]=1');assert.equal(run("research(castle,'ut23')"),false);
 run('S.age[0]=2;S.res[0]={f:0,w:0,g:0,s:0}');assert.equal(run("research(castle,'ut23')"),false);
 run('S.res[0]={f:10000,w:10000,g:10000,s:10000}');
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut23')"),false);
 assert.equal(run("research(castle,'ut23')"),true);
 assert.equal(run('S.res[0].f'),10000-(tech.cost.f||0));assert.equal(run('S.res[0].g'),10000-(tech.cost.g||0));
 assert.equal(shoot(),baseline,'no extra arrows before research completion');
 run('upB(castle,TE.ut23.t+.1)');assert.equal(shoot(),baseline+8);
 assert.equal(run('new Set(S.pj.map(p=>p.x+"/"+p.y)).size'),9,'real separated firing origins make the extra arrows visible');
 assert.equal(run('S.tech[0].atkb?.gbeto||0'),0);assert.equal(run('S.tech[0].hpb?.gbeto||0'),0);
 assert.equal(run('gbeto.hp'),run('U.gbeto.hp'));
 assert.equal(run("research(castle,'ut23')"),false);assert.equal(shoot(),baseline+8,'the effect cannot stack through duplicate research');
});
test('Tigui stacks with garrison fire and cooldown while remaining Town-Centre and civilization specific',()=>{
 const run=tiguiGame();run("globalThis.guard=addU(0,'arc',32,32);guard.ld=tc;tc.cg=[guard]");
 const shoot=()=>run('S.pj=[];tc.cd=0;upB(tc,.1);S.pj.length'),base=shoot();
 run('S.tech[0].ut23=1');assert.equal(shoot(),base+8);
 run('upB(tc,.1)');assert.equal(run('S.pj.length'),base+8,'a positive cooldown prevents a second volley');
 run('upB(tc,U.tca.cd+.1)');assert.equal(run('S.pj.length'),2*(base+8));
 run('S.civ[0]=0');assert.equal(shoot(),base,'foreign civ cannot forge Tigui');
 run("S.civ[0]=23;globalThis.tower=addB(0,'tower',30,29,true);S.pj=[];tower.cd=0;upB(tower,.1)");
 assert.equal(run('S.pj.length'),1,'Towers do not receive the Town Centre bonus');
 for(const setup of['tc.done=false','tc.hp=0']){
  run('tc.done=true;tc.hp=tc.mh;S.pj=[];tc.cd=0;'+setup+';upB(tc,.1)');assert.equal(run('S.pj.length'),0);
 }
});
test('Tigui arrows use normal damage, live target legality, fixed impact and current-build projectile saves',()=>{
 const run=tiguiGame();run('S.pj=[];tc.cd=0;upB(tc,.1);pjs(1);globalThis.hitDamage=1000-enemy.hp;enemy.hp=1000;S.tech[0].ut23=1;tc.cd=0;upB(tc,.1)');
 assert.equal(run('S.pj.length'),9);
 assert.equal(run("saveG(false,'tigui-volley')"),true);assert.equal(run("loadG(false,'tigui-volley')"),true);
 assert.equal(run('S.pj.length'),9);run('globalThis.restored=S.pj[0].t;pjs(1)');
 assert.equal(run('restored.hp'),1000-9*run('hitDamage'));
 run("globalThis.loadedTC=S.bs.find(b=>b.k==='tc');globalThis.futureTC=addB(0,'tc',42,42,true);globalThis.nextEnemy=addU(1,'mil',46,44);nextEnemy.hp=1000;futureTC.cd=0;S.pj=[];upB(futureTC,.1)");
 assert.equal(run('S.pj.length'),9,'new Town Centres retain the ability after reload');
 run('nextEnemy.t=0;pjs(1)');assert.equal(run('nextEnemy.hp'),1000,'a converted friendly target cannot be hit');
 run('nextEnemy.t=1;futureTC.cd=0;S.pj=[];upB(futureTC,.1);nextEnemy.x+=3;pjs(1)');
 assert.equal(run('nextEnemy.hp'),1000,'moving out of the fixed impact point avoids the volley');
});

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

function royalHeirsGame(){
 const run=game(22);
 run("S.el.fill(0);S.g.fill(0);S.wt.fill(0);S.nd.fill(null);S.ex.fill(1);S.vs.fill(1);globalThis.attacker=addU(1,'knight',30,30);globalThis.defender=addU(0,'shotel',31,30)");
 return run;
}
function royalHit(run){return run('(()=>{defender.hp=1000;dmgT(attacker,defender);return 1000-defender.hp})()');}

test('Royal Heirs requires paid completed Castle-age research and removes Shotel stat placeholders',()=>{
 const run=royalHeirsGame(),base=royalHit(run),hp=run('mhp(defender)');
 run('S.age[0]=1');assert.equal(run("research(castle,'ut22')"),false);
 run('S.age[0]=2;S.res[0].g=0');assert.equal(run("research(castle,'ut22')"),false);
 run('S.res[0].g=10000');assert.equal(run("research(castle,'ut22')"),true);
 assert.equal(run('S.res[0].f'),9700);assert.equal(run('S.res[0].g'),9800);
 assert.equal(royalHit(run),base,'queued research cannot protect units');
 run('upB(castle,TE.ut22.t+.1)');assert.equal(royalHit(run),base-3);
 assert.equal(run('mhp(defender)'),hp);assert.equal(run('S.tech[0].atkb?.shotel||0'),0);
 assert.equal(run("research(castle,'ut22')"),false);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut22')"),false);
});

test('Royal Heirs protects Shotel and camel kinds from mounted melee and ranged sources only',()=>{
 const run=royalHeirsGame();
 for(const target of ['shotel','camel','mamel','camelscout','flamecamel','mil','knight','ele','eled']){
  for(const source of ['knight','camel','ele','cavarch','wagon','conq','mil','arc','spear','orgun','gal']){
   run('defender.k='+JSON.stringify(target)+';attacker.k='+JSON.stringify(source)+';S.tech[0]={}');
   const base=royalHit(run);run('S.tech[0].ut22=1');
   const eligible=['shotel','camel','mamel','camelscout','flamecamel'].includes(target)&&
    run('!!(U[attacker.k].mt||CAVARM.has(attacker.k))');
   assert.equal(royalHit(run),eligible?Math.max(1,base-3):base,source+' → '+target);
  }
 }
 run("attacker.k='knight';defender.k='shotel';S.civ[0]=0");
 assert.equal(royalHit(run),run('U.knight.dmg'),'foreign research flags grant no protection');
 run("S.civ[0]=22;attacker.k='cavarch';defender.k='camel';S.tech[0]={ut22:1,armC:1,armC2:1,armC3:1}");
 assert.equal(royalHit(run),1,'normal armour and protection retain minimum one damage');
 assert.equal(run("uniqueTechnologyUnitBonus('mountedDamageReduction','camel',0,{civ:[22],tech:[{ut22:1}]})"),3);
 assert.equal(run("uniqueTechnologyUnitBonus('mountedDamageReduction','camel',0,{civ:['22'],tech:[{ut22:1}]})"),0);
 assert.equal(run("uniqueTechnologyUnitBonus('mountedDamageReduction','camel',0,{civ:[22],tech:[{}]})"),0);
});

test('Royal Heirs applies to real mounted arrows after shooter death and survives current-build reload',()=>{
 const run=royalHeirsGame();
 run("attacker.k='cavarch';attacker.x=28;attacker.hp=50;defender.hp=1000;S.tech[1].thumb=1;launchProjectile(attacker,defender);pjs(1);globalThis.base=1000-defender.hp;defender.hp=1000;S.tech[0].ut22=1;launchProjectile(attacker,defender)");
 assert.equal(run('S.pj.length'),1);
 run('attacker.hp=0;S.us=S.us.filter(u=>u!==attacker)');
 assert.equal(run("saveG(false,'royal-heirs-arrow')"),true);
 assert.equal(run("loadG(false,'royal-heirs-arrow')"),true);
 run('globalThis.restored=S.pj[0].t;pjs(1)');assert.equal(run('1000-restored.hp'),run('Math.max(1,base-3)'));
 run("globalThis.future=addU(0,'camel',31,30);globalThis.raider=addU(1,'knight',30,30);future.hp=1000;dmgT(raider,future)");
 assert.equal(run('1000-future.hp'),run('U.knight.dmg-3'));
});

test('Royal Heirs reduces mounted secondary damage while leaving buildings and unrelated fractional hits unchanged',()=>{
 const run=royalHeirsGame();
 run('attacker[CK_TRAMPLE_DAMAGE]=4');assert.equal(royalHit(run),4);
 run('S.tech[0].ut22=1');assert.equal(royalHit(run),1);
 run("defender.k='mil';attacker[CK_TRAMPLE_DAMAGE]=.5");assert.equal(royalHit(run),.5);
 run("attacker.k='knight';delete attacker[CK_TRAMPLE_DAMAGE];globalThis.target=addB(0,'tc',35,35,true);target.hp=1000;dmgT(attacker,target);globalThis.protectedBuildingHit=1000-target.hp;S.tech[0].ut22=0;target.hp=1000;dmgT(attacker,target)");
 assert.equal(run('1000-target.hp'),run('protectedBuildingHit'));
});
