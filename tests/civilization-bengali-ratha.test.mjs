import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const protocol=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');
const commands=readFileSync(new URL('../js/network-commands.js',import.meta.url),'utf8');
function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\n'+protocol+'\n'+commands+'\nglobalThis.bengaliEval=code=>eval(code);',sandbox);
 const run=sandbox.bengaliEval;
 run("seedOv=381126;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=[38,0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.tc=addB(0,'tc',10,12,true);globalThis.bar=addB(0,'bar',18,12,true);globalThis.stable=addB(0,'stable',27,12,true);globalThis.castle=addB(0,'castle',35,12,true);globalThis.range=addB(0,'rng',45,12,true)");
 return run;
}
const copy=(run,expr)=>JSON.parse(run('JSON.stringify('+expr+')'));

test('Bengalis append ID 38 without moving earlier civilizations; their unique research stays faction locked',()=>{
 const run=game();
 assert.equal(run('CIV.length'),43);
 assert.equal(run('CIV[37].n'),'Dravidians');
 assert.equal(run('CIV[38].uu'),'ratha');
 assert.equal(run('CIV[39].n'),'Gurjaras');
 assert.equal(run("trOf(castle).includes('ratha')"),true);
 assert.equal(run("trOf(castle).includes('rathaM')"),false,'melee stance must never be free to train');
 assert.equal(run("trOf({k:'castle',t:1}).includes('ratha')"),false);
 for(const tech of ['ut38','ut38p','eliteRatha']){
  assert.equal(run("rsOf(castle).includes('"+tech+"')"),true);
  assert.equal(run("rsOf({k:'castle',t:1}).includes('"+tech+"')"),false);
 }
 assert.equal(run("trOf(stable).includes('batele')"),true);
 assert.equal(run("trOf(range).includes('eled')"),true);
 assert.equal(run("unitEffectiveAge(0,'eled')"),2);
 assert.equal(run("trOf(stable).includes('knight')"),false);
});

test('Paiks gives researched Ratha and elephant attacks 20% more frequency without affecting other teams',()=>{
 const run=game();
 for(const kind of ['ratha','rathaM','batele','eled']){
  const base=run("attackReload({k:'"+kind+"',t:0})");
  run('S.tech[0].ut38=1');
  assert.ok(Math.abs(run("attackReload({k:'"+kind+"',t:0})")-base/1.2)<1e-8,kind);
  assert.equal(run("attackReload({k:'"+kind+"',t:1})"),run('U.'+kind+'.cd'));
  run('S.tech[0].ut38=0');
 }
});

test('Mahayana changes living and queued Villager/Monk population but not foreign military',()=>{
 const run=game();
 run("globalThis.v=addU(0,'vil',21,25);globalThis.m=addU(0,'mon',23,25);globalThis.enemy=addU(1,'vil',26,25);");
 assert.equal(run('livePopulation(0)'),2);
 assert.equal(run('popOf(0)'),2);
 run("S.tech[0].ut38p=1");
 assert.ok(Math.abs(run('livePopulation(0)')-1.8)<1e-9);
 assert.ok(Math.abs(run('popOf(0)')-1.8)<1e-9);
 assert.equal(run('livePopulation(1)'),1);
 run("tc.q.push({k:'vil',t:25})");
 assert.ok(Math.abs(run('popOf(0)')-2.7)<1e-9,'training slots are discounted too');
 run("globalThis.fighter=addU(0,'ratha',25,25)");
 assert.ok(Math.abs(run('popOf(0)')-3.7)<1e-9);
});

test('Bengali age advancement creates two real Villagers at every living Town Centre exactly once',()=>{
 const run=game();
 run("globalThis.second=addB(0,'tc',42,35,true);globalThis.lumber=addB(0,'lumber',57,30,true);globalThis.mill=addB(0,'mill',63,30,true);S.age[0]=0");
 assert.equal(run("research(tc,'age')"),true);
 run('upB(tc,AG[1].t+1)');
 assert.equal(run('S.age[0]'),1);
 assert.equal(run("S.us.filter(u=>u.k==='vil'&&u.t===0&&u.hp>0).length"),4);
 run('upB(tc,AG[1].t+1)');
 assert.equal(run("S.us.filter(u=>u.k==='vil'&&u.t===0).length"),4);
 run('second.hp=0');
 run("S.age[0]=1;globalThis.rng=addB(0,'rng',24,40,true);globalThis.smith=addB(0,'smith',30,40,true)");
 assert.equal(run("research(tc,'age')"),true);
 run('upB(tc,AG[2].t+1)');
 assert.equal(run("S.us.filter(u=>u.k==='vil'&&u.t===0).length"),6);
});

test('Bengali elephants receive reduced counter damage and their Monks have additional armour',()=>{
 const run=game();
 assert.equal(run("factionCounterBonus({k:'spear',t:1},{k:'batele',t:0},20)"),15);
 assert.equal(run("factionCounterBonus({k:'spear',t:1},{k:'knight',t:0},20)"),20);
 const monk=run("combatArmor({k:'mon',t:0},'m')");
 assert.equal(monk-run("combatArmor({k:'mon',t:1},'m')"),3);
 run("S.civ[0]=0");
 assert.equal(run("factionCounterBonus({k:'spear',t:1},{k:'batele',t:0},20)"),20);
});

test('Bengali Elephant and Monk conversion resistances apply only to the actual defending faction',()=>{
 const run=game();
 for(const k of ['batele','eled','mon']){
  const bengali=copy(run,"conversionWindow({k:'"+k+"',t:0})");
  const other=copy(run,"conversionWindow({k:'"+k+"',t:1})");
  assert.equal(bengali.min-other.min,3);
  assert.equal(bengali.max-other.max,3);
 }
 assert.deepEqual(copy(run,"conversionWindow({k:'vil',t:0})"),copy(run,"conversionWindow({k:'vil',t:1})"));
});

test('Bengali team bonus grants 10% food on actual Cart trade delivery and cannot repeat without a new trip',()=>{
 const run=game();
 run("globalThis.home=addB(0,'market',36,35,true);globalThis.destination=addB(1,'market',53,35,true);globalThis.cart=addU(0,'cart',37.5,36.5);setDiplomacy(0,1,'neutral');cart.tradeFromKey='0:market:36:35';cart.tradeDestKey='1:market:53:35';cart.tradeReturning=true;cart.tradeCargo=50");
 assert.ok(Math.abs(run("civilizationTeamBonusAdd(0,'tradeFood')")-.1)<1e-10);
 const gold=run('S.res[0].g'),food=run('S.res[0].f');
 run('tickTrader(cart,1/30)');
 assert.equal(run('S.res[0].g'),gold+50);
 assert.equal(run('S.res[0].f'),food+5);
 assert.equal(run('cart.tradeCargo'),0);
 run('tickTrader(cart,1/30)');
 assert.equal(run('S.res[0].f'),food+5);
 run('S.civ[0]=0;S.civ[1]=38;setDiplomacy(0,1,"ally")');
 assert.ok(Math.abs(run("civilizationTeamBonusAdd(0,'tradeFood')")-.1)<1e-10);
 run('setDiplomacy(0,1,"enemy")');
 assert.equal(run("civilizationTeamBonusAdd(0,'tradeFood')"),0);
});

test('Ratha switches true mounted melee/ranged combat profiles without allowing a foreign or phantom unit',()=>{
 const run=game();
 run("globalThis.r=addU(0,'ratha',22,29);globalThis.foe=addU(1,'mil',24,29)");
 assert.equal(run('U[r.k].rng'),5);
 assert.equal(run("setRathaMode(r,'melee')"),true);
 assert.equal(run('r.k'),'rathaM');
 assert.equal(run('U[r.k].rng'),.9);
 assert.equal(run('r.netId!==undefined'),true);
 assert.equal(run("setRathaMode(r,'ranged')"),true);
 assert.equal(run('r.k'),'ratha');
 assert.equal(run("setRathaMode(r,'ranged')"),false);
 assert.equal(run("setRathaMode({k:'ratha',t:0},'melee')"),false);
 run('S.civ[0]=0');
 assert.equal(run("setRathaMode(r,'melee')"),false);
});

test('Elite Ratha upgrades both surviving combat forms and future melee switches',()=>{
 const run=game();
 run("globalThis.r=addU(0,'ratha',20,30);globalThis.m=addU(0,'rathaM',23,30);globalThis.foreign=addU(1,'rathaM',26,30)");
 const before=run('m.hp');
 assert.equal(run("research(castle,'eliteRatha')"),true);
 run('upB(castle,TE.eliteRatha.t+1)');
 assert.equal(run('S.tech[0].eliteRatha'),1);
 assert.equal(run('S.tech[0].hpb.rathaM'),20);
 assert.equal(run('S.tech[0].atkb.rathaM'),2);
 assert.equal(run('m.hp'),before+20);
 assert.equal(run('foreign.hp'),before);
 assert.equal(run("eliteUniqueUnitUpgrade('rathaM',0).k"),'eliteRatha');
 assert.equal(run("eliteUniqueUnitUpgrade('rathaM',1)"),null);
 assert.equal(run("setRathaMode(r,'melee')"),true);
 assert.equal(run('mhp(r)'),run('U.rathaM.hp+20'));
});

test('host and network protocol authorize Bengali stance changes but reject foreign and invalid values',()=>{
 const run=game();
 run("globalThis.r=addU(0,'ratha',22,28)");
 assert.equal(run("CK_SIM_SYNC.validOrder({type:'ratha-mode',entities:[r.netId],value:'melee'},W)"),true);
 assert.equal(run("CK_SIM_SYNC.validOrder({type:'ratha-mode',entities:[r.netId],value:'bogus'},W)"),false);
 assert.equal(run("CK_GAME_COMMANDS.unitOptions(S,0,r).some(o=>o.type==='ratha-mode')"),true);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'ratha-mode',entities:[r.netId],value:'melee'},0,0)"),true);
 assert.equal(run('r.k'),'rathaM');
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'ratha-mode',entities:[r.netId],value:'ranged'},1,0)"),false);
 run('S.civ[0]=0');
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'ratha-mode',entities:[r.netId],value:'ranged'},0,0)"),false);
});

test('save and load retain Bengali Mahayana, the Ratha mode and source unit identity',()=>{
 const run=game();
 run("globalThis.r=addU(0,'ratha',20,30);setRathaMode(r,'melee');S.tech[0].ut38p=1");
 assert.equal(run("saveG(false,'bengal_current_build')"),true);
 run("S.civ[0]=0;S.us=[];S.bs=[];S.tech[0]={}");
 assert.equal(run("loadG(false,'bengal_current_build')"),true);
 assert.equal(run('S.civ[0]'),38);
 assert.equal(run("S.us.some(u=>u.k==='rathaM'&&u.t===0)"),true);
 assert.equal(run('S.tech[0].ut38p'),1);
});


test('paid archer armour remains effective when Ratha changes combat stance',()=>{
 const run=game();
 run("globalThis.smith=addB(0,'smith',52,12,true);globalThis.r=addU(0,'ratha',20,30)");
 const base=run("combatArmor(r,'p')");
 assert.equal(run("research(smith,'armR')"),true);
 run('upB(smith,TE.armR.t+1)');
 assert.equal(run("combatArmor(r,'p')"),base+1);
 assert.equal(run("setRathaMode(r,'melee')"),true);
 assert.equal(run("combatArmor(r,'p')"),base+1);
 assert.equal(run("setRathaMode(r,'ranged')"),true);
 assert.equal(run("combatArmor(r,'p')"),base+1);
});
