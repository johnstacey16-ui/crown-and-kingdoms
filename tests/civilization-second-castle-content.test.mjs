import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

function game(civ){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.evaluate=code=>eval(code);',sandbox);
 const run=sandbox.evaluate;
 run('kingdoms=2;startAge=3;startRes=3;start();S.civ=['+civ+',1];S.age=[3,3];S.tech=[{},{}];S.res[0]={f:10000,w:10000,g:10000,s:10000};S.us=[];S.bs=[];S.pj=[]');
 run("globalThis.castle={k:'castle',t:0,x:20,y:20,s:4,hp:1400,mh:1400,done:true,pr:60,q:[],rs:null,cd:999};S.bs.push(castle)");
 return run;
}

test('Celtic Stronghold has paid Castle research, tower fire bonus and nearby infantry healing',()=>{
 const run=game(6),entry=JSON.parse(run('JSON.stringify(TE.ut6p)'));
 assert.deepEqual(entry.cost,{f:250,g:200});
 assert.equal(entry.age,2);
 assert.equal(entry.t,30);
 assert.equal(run("rsOf(castle).includes('ut6p')"),true);
 assert.equal(run("rsOf({k:'castle',t:1}).includes('ut6p')"),false);
 run("globalThis.ally={k:'mil',t:0,x:22,y:22,hp:20,p:[]};globalThis.far={k:'mil',t:0,x:50,y:50,hp:20,p:[]};S.us.push(ally,far)");
 assert.equal(run("research(castle,'ut6p')"),true);
 assert.equal(run('S.res[0].f'),9750);
 assert.equal(run('S.res[0].g'),9800);
 run('upB(castle,30.1)');
 assert.equal(run('S.tech[0].ut6p'),1);
 assert.equal(run('ally.hp'),20,'no premature healing during research');
 run('upB(castle,.1)');
 assert.equal(run('ally.hp'),20.5);
 assert.equal(run('far.hp'),20);
 run("globalThis.tower={k:'tower',t:0,x:25,y:20,s:2,hp:400,mh:400,done:true,cd:0,q:[],rs:null};S.bs.push(tower)");
 run("globalThis.enemy={k:'mil',t:1,x:25,y:25,hp:500,p:[]};S.us.push(enemy)");
 run('upB(tower,.1)');
 assert.ok(Math.abs(run('tower.cd')-run('U.tw.cd')/1.33)<1e-9,'Stronghold reduces actual defensive fire cooldown');
 run('S.civ[0]=1;tower.cd=0;upB(tower,.1)');
 assert.equal(run('tower.cd'),run('U.tw.cd'),'only Celts benefit');
});

test('Imperial Furor Celtica grants +40% base hitpoints to siege including Trebuchets',()=>{
 const run=game(6);
 const before=JSON.parse(run("JSON.stringify(Object.fromEntries(['ram','mang','scor','bomb','treb'].map(k=>[k,mhp({k,t:0})])))"));
 run('S.age[0]=2');
 assert.equal(run("research(castle,'ut6')"),false);
 run('S.age[0]=3');
 assert.equal(run("research(castle,'ut6')"),true);
 assert.equal(run('S.res[0].f'),9250);
 run('upB(castle,50.1)');
 for(const kind of ['ram','mang','scor','bomb','treb']){
  const after=run("mhp({k:'"+kind+"',t:0})");
  assert.equal(after,before[kind]+Math.round(run("U['"+kind+"'].hp")*.4),kind+' receives 40%');
 }
 assert.equal(run("mhp({k:'knight',t:0})"),run("U.knight.hp"),'unrelated cavalry is outside this upgrade');
});

for(const [civ,key,kinds]of [[6,'ut6',['ram','mang','scor','bomb','treb']],[8,'ut8',['camel','mamel']],[14,'ut14',['vil']]]){
 test(`${key} gives existing and future troops the same HP bonus without healing old damage or applying twice`,()=>{
  const run=game(civ),tech=JSON.parse(run(`JSON.stringify(TE.${key})`));
  const expected=kind=>civ===6?Math.round(run(`U.${kind}.hp`)*.4):civ===8?20:40;
  run(`globalThis.kinds=${JSON.stringify(kinds)};S.tech[0].hpb=Object.fromEntries(kinds.map(k=>[k,7]));globalThis.troops=kinds.map((k,i)=>{
   const full=addU(0,k,28+i,28),hurt=addU(0,k,28+i,29),dead=addU(0,k,28+i,30),enemy=addU(1,k,28+i,31);
   hurt.hp-=10;dead.hp=0;return {k,full,hurt,dead,enemy,max:mhp(full)};
  });globalThis.excluded=addU(0,'knight',35,32);globalThis.excludedHp=excluded.hp;`);
  if(civ===14)run("globalThis.workerDamage=()=>{const target={t:1,k:'mil',x:30,y:30,hp:1000,p:[]};dmgT(troops[0].full,target);return 1000-target.hp};globalThis.oldWorkerDamage=workerDamage()");
  run(`S.age[0]=${tech.age-1}`);assert.equal(run(`research(castle,'${key}')`),false);
  assert.equal(run('S.res[0].f'),10000,'age rejection cannot spend resources');
  run('S.age[0]=3;S.res[0]={f:0,w:0,g:0,s:0}');
  assert.equal(run(`research(castle,'${key}')`),false,'no free research');
  run('S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  assert.equal(run(`rsOf({k:'castle',t:1}).includes('${key}')`),false);
  assert.equal(run(`technologyTreeModel(0).buildings.find(b=>b.id==='castle').research.find(r=>r.id==='${key}').state`),'available');
  assert.equal(run(`research(castle,'${key}')`),true);
  assert.equal(run('S.res[0].f'),10000-(tech.cost.f||0));
  assert.equal(run('S.res[0].g'),10000-(tech.cost.g||0));
  assert.equal(run('troops.every(u=>u.full.hp===u.max&&u.hurt.hp===u.max-10)'),true,'effects wait for completion');
  run(`upB(castle,TE.${key}.t+.1)`);
  for(const kind of kinds){
   const state=JSON.parse(run(`JSON.stringify(troops.find(u=>u.k==='${kind}'))`)),bonus=expected(kind);
   assert.equal(state.full.hp,state.max+bonus,kind+' existing full-health HP');
   assert.equal(state.hurt.hp,state.max-10+bonus,kind+' retains its ten points of old damage');
   assert.equal(state.dead.hp,0,'dead troops are never revived');
   assert.equal(state.enemy.hp,run(`U.${kind}.hp`),'enemy troops are unchanged');
   assert.equal(run(`addU(0,'${kind}',30,35).hp`),state.max+bonus,'future troops use the same bonus');
  }
  assert.equal(run('excluded.hp===excludedHp'),true,'unrelated units do not benefit');
  if(civ===14)assert.equal(run('workerDamage()-oldWorkerDamage'),6,'Supremacy retains its real villager attack bonus');
  const after=run('JSON.stringify({tech:S.tech,units:S.us.map(u=>({id:u.netId,hp:u.hp,max:mhp(u)}))})');
  assert.equal(run(`research(castle,'${key}')`),false,'completed research cannot be bought again');
  run('upB(castle,100)');assert.equal(run('JSON.stringify({tech:S.tech,units:S.us.map(u=>({id:u.netId,hp:u.hp,max:mhp(u)}))})'),after);
  assert.equal(run(`saveG(false,'ck_hp_upgrade_${key}')`),true);
  run('S.tech[0]={};S.us=[]');
  assert.equal(run(`loadG(false,'ck_hp_upgrade_${key}')`),true);
  assert.equal(run('JSON.stringify({tech:S.tech,units:S.us.map(u=>({id:u.netId,hp:u.hp,max:mhp(u)}))})'),after,'same-build reload restores bonuses exactly once');
 });
}

test('Viking Bogsveigar adds one damage to Archer and Crossbowman attacks only',()=>{
 const run=game(7);
 run("globalThis.attacker={k:'arc',t:0,x:6,y:6};globalThis.victim={k:'mil',t:1,x:7,y:6,hp:500,p:[]}");
 const hit=()=>run('(()=>{victim.hp=500;dmgT(attacker,victim);return 500-victim.hp})()');
 const before=hit();
 assert.equal(run("research(castle,'ut7p')"),true);
 run('upB(castle,40.1)');
 assert.equal(hit(),before+1);
 run("attacker.k='xbow'");
 const after=hit();
 run('S.tech[0].ut7p=0');
 assert.equal(after-hit(),1);
 run("attacker.k='skirm';S.tech[0].ut7p=1");
 const skirm=hit();
 run('S.tech[0].ut7p=0');
 assert.equal(hit(),skirm);
 run('S.tech[0].ut7p=1;S.civ[0]=1;attacker.k="arc"');
 assert.equal(hit(),before,'foreign civ cannot forge Bogsveigar');
});

test('Japanese Kataparuto speeds up actual Trebuchet attacks without affecting other siege',()=>{
 const run=game(11);
 const base=run("attackReload({k:'treb',t:0})");
 assert.equal(run("research(castle,'ut11p')"),true);
 assert.equal(run('S.res[0].w'),9450);
 assert.equal(run('S.res[0].g'),9700);
 run('upB(castle,60.1)');
 assert.ok(Math.abs(run("attackReload({k:'treb',t:0})")-base/1.33)<1e-9);
 assert.equal(run("attackReload({k:'treb',t:1})"),base);
 assert.equal(run("attackReload({k:'ram',t:0})"),run("attackReload({k:'ram',t:1})"));
 run('S.civ[0]=1');
 assert.equal(run("attackReload({k:'treb',t:0})"),base);
});

test('four new Elite upgrades are properly priced, paid and apply to new and existing units',()=>{
 const run=game(4);
 for(const [id,key] of [[4,'eliteWarElephant'],[6,'eliteWoadRaider'],[7,'eliteBerserk'],[11,'eliteSamurai']]){
  run('S.civ[0]='+id+';S.tech[0]={};S.age[0]=3;castle.rs=null;castle.q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const unit=run('CIV['+id+'].uu'),tech=JSON.parse(run('JSON.stringify(TE.'+key+')'));
  run("globalThis.hero={k:'"+unit+"',t:0,hp:U['"+unit+"'].hp,x:10,y:10};S.us=[hero]");
  assert.equal(tech.age,3);
  assert.ok(run("rsOf(castle).includes('"+key+"')"));
  assert.ok(!run("rsOf({k:'castle',t:1}).includes('"+key+"')"));
  const before=run('mhp(hero)');
  assert.equal(run("research(castle,'"+key+"')"),true);
  assert.equal(run('S.res[0].f'),10000-(tech.cost.f||0));
  assert.equal(run('S.res[0].g'),10000-(tech.cost.g||0));
  run('upB(castle,'+(tech.t+.1)+')');
  assert.equal(run('hero.hp'),before+tech.hpb[unit]);
  assert.equal(run("mhp({k:'"+unit+"',t:0})"),before+tech.hpb[unit]);
  assert.equal(run("eliteUniqueUnitUpgrade('"+unit+"',1)"),null);
 }
});

test('same-build saves restore Stronghold research, healing and Celtic Elite unit state',()=>{
 const run=game(6);
 run("S.tech[0].ut6p=1;S.tech[0].stronghold=1;S.tech[0].eliteWoadRaider=1;S.tech[0].hpb={woad:20};S.tech[0].atkb={woad:4}");
 const hp=run("mhp({k:'woad',t:0})");
 assert.equal(run("saveG(false,'ck_celtic_content_test')"),true);
 run('S.civ[0]=1;S.tech[0]={}');
 assert.equal(run("loadG(false,'ck_celtic_content_test')"),true);
 assert.equal(run('S.tech[0].ut6p'),1);
 assert.equal(run("mhp({k:'woad',t:0})"),hp);
});

function chieftainsGame(){
 const run=game(7);
 run("S.el.fill(0);S.g.fill(0);S.wt.fill(0);S.nd.fill(null);S.ex.fill(1);S.vs.fill(1);globalThis.attacker=addU(0,'bers',30,30);globalThis.victim=addU(1,'knight',30.5,30)");
 return run;
}
function chieftainsHit(run){return run('(()=>{victim.hp=1000;dmgT(attacker,victim);return 1000-victim.hp})()');}
test('Chieftains requires paid completed Castle research at the extracted reference price and time',()=>{
 const run=chieftainsGame(),base=chieftainsHit(run);
 assert.deepEqual(JSON.parse(run('JSON.stringify(TE.ut7.cost)')),{f:600,g:450});assert.equal(run('TE.ut7.t'),40);
 run('S.age[0]=1');assert.equal(run("research(castle,'ut7')"),false);
 run('S.age[0]=2;S.res[0].g=449');assert.equal(run("research(castle,'ut7')"),false);
 run('S.res[0].g=10000');assert.equal(run("research(castle,'ut7')"),true);
 assert.equal(run('S.res[0].f'),9400);assert.equal(run('S.res[0].g'),9550);
 assert.equal(chieftainsHit(run),base);run('upB(castle,TE.ut7.t+.1)');assert.equal(chieftainsHit(run),base+5);
 for(const kind of ['mil','spear','bers'])assert.equal(run(`S.tech[0].atkb?.${kind}||0`),0,'no old flat attack ledger');
 assert.equal(run("research(castle,'ut7')"),false);assert.equal(run("rsOf({k:'castle',t:1}).includes('ut7')"),false);
});
test('Chieftains adds only class-specific infantry damage and stacks with spear-line counters',()=>{
 const run=chieftainsGame();
 const infantry=['mil','spear','bers','axe','gbeto','chakram','footkonnik'];
 const sources=[...infantry,'arc','knight','vil'];
 const cavalry=['knight','cavarch','cata','ele','eled','rathaM','monaspa'];
 const camels=['camel','mamel','camelscout','flamecamel'];
 for(const source of sources)for(const target of [...cavalry,...camels,'mil','arc','ram','gal']){
  run(`attacker.k='${source}';victim.k='${target}';S.tech[0]={atkb:{'${source}':20}}`);
  const base=chieftainsHit(run);run('S.tech[0].ut7=1');
  const extra=infantry.includes(source)?camels.includes(target)?4:cavalry.includes(target)?5:0:0;
  assert.equal(chieftainsHit(run),base+extra,source+' → '+target);
 }
 run("attacker.k='spear';victim.k='knight';S.tech[0]={pike:1}");const pike=chieftainsHit(run);
 run('S.tech[0].ut7=1');assert.equal(chieftainsHit(run),pike+5);
 run('S.civ[0]=0');assert.equal(chieftainsHit(run),pike,'foreign research flags cannot retain the counter bonus');
 run("S.civ[0]=7;attacker.k='bers';victim.k='mil';victim.s=4;S.tech[0]={}");const building=chieftainsHit(run);
 run('S.tech[0].ut7=1');assert.equal(chieftainsHit(run),building,'buildings are not cavalry targets');
});
test('Chieftains uses the normal counter-resistance path and does not restore removed kill-gold rewards',()=>{
 const run=chieftainsGame();
 run("victim.k='batele';S.civ[1]=38;S.tech[0].ut7=1");
 assert.equal(run('factionCounterBonus(attacker,victim,0)'),4,'existing Bengali 25% resistance and rounding apply to the bonus');
 run("S.civ[1]=1;attacker.k='bers'");
 for(const kind of ['vil','cart','cog','mon']){
  run(`victim=addU(1,'${kind}',30.5,30);victim.hp=1;globalThis.gold=S.res[0].g;dmgT(attacker,victim)`);
  assert.equal(run('victim.hp<=0'),true);assert.equal(run('S.res[0].g'),run('gold'),kind+' grants no obsolete Chieftains gold');
 }
});
test('Chieftains follows ranged-infantry projectile snapshots through reload and applies to future troops',()=>{
 const run=chieftainsGame();
 run("attacker.k='gbeto';attacker.x=27;S.tech[0].ut7=1;victim.hp=1000;launchProjectile(attacker,victim)");
 assert.equal(run('S.pj.length'),1);run('attacker.hp=0;S.us=S.us.filter(u=>u!==attacker)');
 assert.equal(run("saveG(false,'chieftains-projectile')"),true);assert.equal(run("loadG(false,'chieftains-projectile')"),true);
 run('victim=S.pj[0].t;pjs(1)');
 assert.equal(run('1000-victim.hp'),run("Math.max(1,U.gbeto.dmg+5-combatArmor(victim,'p'))"));
 run("attacker=addU(0,'bers',30,30);victim=addU(1,'knight',30.5,30)");
 const upgraded=chieftainsHit(run);run('S.tech[0].ut7=0');assert.equal(chieftainsHit(run),upgraded-5);
});
