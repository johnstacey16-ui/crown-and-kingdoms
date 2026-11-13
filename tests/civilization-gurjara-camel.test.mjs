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
 vm.runInContext(source+'\n'+protocol+'\n'+commands+'\nglobalThis.gurjaraEval=code=>eval(code);',sandbox);
 const run=sandbox.gurjaraEval;
 run("seedOv=391126;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=[39,0];S.age=[3,3];S.tech=[{},{}];S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));globalThis.tc=addB(0,'tc',10,12,true);globalThis.bar=addB(0,'bar',18,12,true);globalThis.stable=addB(0,'stable',27,12,true);globalThis.castle=addB(0,'castle',35,12,true);globalThis.mill=addB(0,'mill',45,12,true);globalThis.range=addB(0,'rng',53,12,true)");
 return run;
}
const copy=(run,expr)=>JSON.parse(run('JSON.stringify('+expr+')'));

test('Gurjaras are stable ID 39 with exclusive unique-unit and Castle technologies',()=>{
 const run=game();
 assert.equal(run('CIV.length'),43);
 assert.equal(run('CIV[38].n'),'Bengalis');
 assert.equal(run('CIV[39].uu'),'chakram');
 assert.equal(run("trOf(castle).includes('chakram')"),true);
 assert.equal(run("trOf({k:'castle',t:1}).includes('chakram')"),false);
 for(const key of ['ut39','ut39p','eliteChakram']){
  assert.equal(run("rsOf(castle).includes('"+key+"')"),true);
  assert.equal(run("rsOf({k:'castle',t:1}).includes('"+key+"')"),false);
 }
 assert.equal(run("trOf(range).includes('eled')"),true);
 assert.equal(run("unitEffectiveAge(0,'eled')"),2);
});

test('Camel Scouts are trained in Feudal and replaced by Camel and Shrivamsha in Castle',()=>{
 const run=game();
 run('S.age[0]=1');
 assert.equal(run("trOf(stable).includes('camelscout')"),true);
 assert.equal(run("trOf(stable).includes('camel')"),false);
 assert.equal(run("trOf(stable).includes('shrivamsha')"),false);
 assert.equal(run("train(stable,'camelscout')"),true);
 assert.equal(run('stable.q[0].k'),'camelscout');
 run("stable.q=[];S.age[0]=2");
 assert.equal(run("trOf(stable).includes('camelscout')"),false);
 assert.equal(run("trOf(stable).includes('camel')"),true);
 assert.equal(run("trOf(stable).includes('shrivamsha')"),true);
 assert.equal(run("trOf(stable).includes('knight')"),false);
 assert.equal(run("train(stable,'shrivamsha')"),true);
 assert.equal(run('stable.q[0].k'),'shrivamsha');
 assert.equal(run("trOf({k:'stable',t:1}).includes('shrivamsha')"),false);
});

test('Kshatriyas discounts military food, preserves villagers and refunds actual paid prices',()=>{
 const run=game();
 const base=copy(run,"unitTrainingCost(0,'camel')");
 assert.ok(base.f>0);
 const oldFood=run('S.res[0].f');
 assert.equal(run("train(stable,'camel')"),true);
 assert.equal(run('S.res[0].f'),oldFood-base.f);
 run('S.tech[0].ut39=1');
 const discounted=copy(run,"unitTrainingCost(0,'camel')");
 assert.equal(discounted.f,Math.ceil(base.f*.75));
 assert.equal(run("unitTrainingCost(0,'vil').f"),run('U.vil.cost.f'));
 assert.equal(run("unitTrainingCost(0,'fish').w"),run('U.fish.cost.w'));
 assert.equal(run("cancelQ(stable)"),true);
 assert.equal(run('S.res[0].f'),oldFood,'research cannot change old paid refund');
 assert.equal(run("train(stable,'camel')"),true);
 assert.equal(run('S.res[0].f'),oldFood-discounted.f);
 assert.equal(run("cancelQ(stable)"),true);
 assert.equal(run('S.res[0].f'),oldFood);
 assert.equal(copy(run,"unitTrainingCost(1,'camel')").f,base.f);
});

test('Frontier Guards modifies Gurjara camel and Elephant Archer melee armour only',()=>{
 const run=game();
 for(const kind of ['camel','camelscout','eled']){
  const unit={k:kind,t:0},before=run("combatArmor("+JSON.stringify(unit)+",'m')"),
    pierce=run("combatArmor("+JSON.stringify(unit)+",'p')");
  run('S.tech[0].ut39p=1');
  assert.equal(run("combatArmor("+JSON.stringify(unit)+",'m')")-before,4,kind);
  assert.equal(run("combatArmor("+JSON.stringify(unit)+",'p')"),pierce,kind);
  run('S.tech[0].ut39p=0');
 }
});

test('Gurjara mounted counter damage scales with actual current age without affecting foreign teams',()=>{
 const run=game();
 for(const [age,expected] of [[1,12],[2,13],[3,14]]){
  run('S.age[0]='+age);
  assert.equal(run("factionCounterBonus({k:'camel',t:0},{k:'knight',t:1},10)"),expected);
 }
 assert.equal(run("factionCounterBonus({k:'camel',t:1},{k:'knight',t:0},10)"),10);
 run('S.civ[1]=38');
 assert.equal(run("factionCounterBonus({k:'camel',t:0},{k:'batele',t:1},20)"),21,
  'Bengali defenders retain bonus-damage resistance');
});

test('a real Shrivamsha blocks five projectiles, then takes damage and recharges over time',()=>{
 const run=game();
 run("globalThis.shriv=addU(0,'shrivamsha',22,28);globalThis.arch=addU(1,'arc',24,28);shriv.hp=U.shrivamsha.hp");
 assert.equal(run('shriv.dodgeCharges'),5);
 for(let i=0;i<5;i++)run('dmgT(arch,shriv)');
 assert.equal(run('shriv.dodgeCharges'),0);
 assert.equal(run('shriv.hp'),run('U.shrivamsha.hp'));
 run('dmgT(arch,shriv)');
 assert.ok(run('shriv.hp')<run('U.shrivamsha.hp'));
 run('S.t=15;upU(shriv,0.1)');
 assert.equal(run('shriv.dodgeCharges'),1);
 run('S.civ[0]=0;shriv.dodgeCharges=5;shriv.hp=U.shrivamsha.hp;dmgT(arch,shriv)');
 assert.ok(run('shriv.hp')<run('U.shrivamsha.hp'),'other civilizations cannot gain a dodge shield');
});

test('Gurjara allied team bonus accelerates real camel and elephant queues but not infantry',()=>{
 const run=game();
 const camel=run("trainRate(stable,'camel')"),soldier=run("trainRate(bar,'mil')");
 assert.ok(camel>soldier);
 assert.ok(Math.abs(camel-1.25)<1e-9);
 assert.equal(soldier,1);
 run('S.civ[0]=0;S.civ[1]=39');
 assert.equal(run("trainRate(stable,'camel')"),1);
 run("setDiplomacy(0,1,'ally')");
 assert.ok(Math.abs(run("trainRate(stable,'camel')")-1.25)<1e-9);
 assert.equal(run("trainRate(bar,'mil')"),1);
});

test('Mill sheep enclosure removes a real sheep and makes passive food only while the Mill survives',()=>{
 const run=game();
 run("globalThis.sheep=addN('f',47,15,100);sheep.an=1;sheep.herdable=1");
 assert.equal(run('garrisonLivestockMill(mill)'),true);
 assert.equal(run('mill.livestockCount'),1);
 assert.equal(run('S.nodes.includes(sheep)'),false);
 assert.equal(run('S.nd[15*W+47]'),null);
 assert.equal(run('garrisonLivestockMill(mill)'),false);
 const before=run('S.res[0].f');
 run('upB(mill,10)');
 assert.ok(Math.abs(run('S.res[0].f')-before-.8)<1e-8);
 run('mill.hp=0;upB(mill,10)');
 assert.ok(Math.abs(run('S.res[0].f')-before-.8)<1e-8);
 run("mill.hp=100;S.civ[0]=0;globalThis.another=addN('f',48,15,100);another.an=1;another.herdable=1");
 assert.equal(run('garrisonLivestockMill(mill)'),false);
});

test('authenticated Gurjara Mill commands validate ownership, protocol fields and actual livestock',()=>{
 const run=game();
 run("globalThis.sheep=addN('f',47,15,100);sheep.an=1;sheep.herdable=1");
 assert.equal(run("CK_SIM_SYNC.validOrder({type:'livestock',entities:[mill.netId]},W)"),true);
 assert.equal(run("CK_SIM_SYNC.validOrder({type:'livestock',entities:[mill.netId],value:'fake'},W)"),false);
 assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,0,mill).some(o=>o.type==='livestock')"),true);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'livestock',entities:[mill.netId]},0,0)"),true);
 assert.equal(run('mill.livestockCount'),1);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'livestock',entities:[mill.netId]},0,0)"),false);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'livestock',entities:[mill.netId]},1,0)"),false);
 run("S.civ[0]=0;globalThis.more=addN('f',48,15,100);more.an=1;more.herdable=1");
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'livestock',entities:[mill.netId]},0,0)"),false);
});

test('starting Gurjara matches seed Camel Scout, forage and herdable livestock deterministically',()=>{
 const run=game();
 run('civ=39;aiCiv=38;seedOv=391126;newGame()');
 assert.equal(run('S.civ[0]'),39);
 assert.equal(run("S.us.filter(u=>u.t===0&&u.k==='camelscout').length"),1);
 assert.equal(run("S.nodes.filter(n=>n.gurjaraForage===true).length"),2);
 assert.equal(run("S.nodes.filter(n=>n.herdable===1).length"),3);
 assert.equal(run("S.us.filter(u=>u.t===1&&u.k==='camelscout').length"),0);
});

test('save/load retains Gurjara researched costs, Mill livestock and Shrivamsha dodge charges',()=>{
 const run=game();
 run("globalThis.shriv=addU(0,'shrivamsha',22,28);shriv.dodgeCharges=2;S.tech[0].ut39p=1;S.tech[0].ut39=1;mill.livestockCount=3");
 assert.equal(run("saveG(false,'gurjara_current_build')"),true);
 run("S.civ[0]=0;S.us=[];S.bs=[];S.tech[0]={}");
 assert.equal(run("loadG(false,'gurjara_current_build')"),true);
 assert.equal(run('S.civ[0]'),39);
 assert.equal(run("S.us.some(u=>u.k==='shrivamsha'&&u.dodgeCharges===2)"),true);
 assert.equal(run("S.bs.some(b=>b.k==='mill'&&b.livestockCount===3)"),true);
 assert.equal(run('S.tech[0].ut39p'),1);
});

test('Castle age promotes living and queued Camel Scouts without losing wounds or payments',()=>{
 const run=game();run(`S.age[0]=1;
 globalThis.scout=addU(0,'camelscout',20,25);scout.hp-=7;
 globalThis.enemyScout=addU(1,'camelscout',21,25);
 globalThis.deadScout=addU(0,'camelscout',22,25);deadScout.hp=0;
 addB(0,'smith',40,40,true);`);
 assert.equal(run("train(stable,'camelscout')"),true);
 const paid=run('JSON.stringify(stable.q[0].paidCost)');
 assert.equal(run("research(tc,'age')"),true);
 run('upB(tc,AG[2].t+1)');
 assert.equal(run('S.age[0]'),2);
 assert.equal(run('scout.k'),'camel');
 assert.equal(run('scout.hp'),run('U.camel.hp-7'));
 assert.equal(run('stable.q[0].k'),'camel');
 assert.equal(run('JSON.stringify(stable.q[0].paidCost)'),paid);
 assert.equal(run('enemyScout.k'),'camelscout');assert.equal(run('deadScout.k'),'camelscout');
 assert.equal(run("research(stable,'hcamel')"),false,'queued production still blocks research');
 assert.equal(run('cancelQ(stable)'),true);
 assert.equal(run("research(tc,'age')"),true);run('upB(tc,AG[3].t+1)');
 assert.equal(run("research(stable,'hcamel')"),true);run('upB(stable,TE.hcamel.t+1)');
 assert.equal(run('scout.hp'),run('U.camel.hp+20-7'));
 assert.equal(run("addU(0,'camel',23,25).hp"),run('U.camel.hp+20'));
});
