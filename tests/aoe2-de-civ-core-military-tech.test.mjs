import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// Canonical DE unit-line availability from SiegeEngineers/aoe2techtree
// data/data.json, inspected 24 October 2026. This pinning covers only
// C&K's implemented generic military lines, not every regional replacement.
// India is currently the older C&K name for Hindustanis. Incas deliberately
// retain the game's existing militia line until the regional replacement
// (Champi Warriors in the current data) has been implemented and tested.
// Paladin d adds unit 569 / upgrade 265 from e56728e76b7d08301fba7b18d5f16bc8554c109a.
const EXPECTED=Object.freeze({
 Franks:'mltcphvaeskd',Britons:'mltcphvaesk',Mongols:'mltcpvaesk',
 Byzantines:'mltcphvaeskd',Persians:'mlphvaesk',Teutons:'mltcphaeskd',
 Celts:'mltcphvaeskd',Vikings:'mltcpvaesk',Saracens:'mltcpvesk',
 Turks:'mltcvask',Chinese:'mltcphvaesk',Japanese:'mltcphvaesk',
 Khmer:'mltphvaesk',Indians:'mltcpves',Spanish:'mltcphvaeskd',
 Italians:'mltcpvaesk',Slavs:'mltcphvaesk',Huns:'mltphvaeskd',
 Goths:'mltcphvaesk',Aztecs:'mltcpe',Mayans:'mltphe',
 Incas:'mltcphe',Ethiopians:'mltphvaesk',Malians:'mltcpvaesk',
 Koreans:'mltcphvaesk',Magyars:'mltcphvaeskd'
});
const TECHS=Object.freeze({
 man:['m','bar'],longs:['l','bar'],twohand:['t','bar'],champ:['c','bar'],
 pike:['p','bar'],halb:['h','bar'],lcav:['v','stable'],
 cavl:['a','stable'],pala:['d','stable'],elsk:['e','rng']
});
const UNITS=Object.freeze({scout:'s',knight:'k'});

function fixture(){
 const {source,sandbox}=headlessGame();
 const network=['network-sync','network-commands']
  .map(k=>readFileSync(new URL('../js/'+k+'.js',import.meta.url),'utf8')).join('\n');
 vm.runInNewContext(source+'\n'+network+`
  seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;
  startAge=3;startRes=3;startArmy=0;start();snd=0;
  S.civ=[0,1];S.us=[];S.bs=[];S.nodes=[];S.rel=[];
  S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);
  S.ex.fill(1);S.vs.fill(1);S.age=[3,3];S.tech=[{},{}];
  S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));
  globalThis.structures={
   bar:addB(0,'bar',12,12,true),
   rng:addB(0,'rng',22,12,true),
   stable:addB(0,'stable',32,12,true),
   castle:addB(0,'castle',42,12,true),
   enemyStable:addB(1,'stable',52,12,true),
   enemyBarracks:addB(1,'bar',52,22,true)
  };
  globalThis.runMilitary=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.runMilitary(code);
}

test('all 26 civilizations have source-pinned infantry, skirmisher and cavalry tier restrictions',()=>{
 const c=fixture();
 const entries=JSON.parse(c('JSON.stringify(CIV.map(x=>[x.n,CIV_CORE_MILITARY[x.n]]))'));
 assert.deepEqual(entries,Object.entries(EXPECTED),'no civilization silently defaults to all units');
 const flags=Object.values(TECHS).map(([flag])=>flag).concat(Object.values(UNITS));
 assert.equal(new Set(flags).size,flags.length,'unit-line capability flags must be unique');
 for(const [name,tier] of Object.entries(EXPECTED)){
  assert.match(tier,/^[mltcphvaeskd]*$/,name+' has an undocumented capability flag');
  assert.equal(new Set(tier).size,tier.length,name+' has no duplicate capability');
 }
 assert.ok(!EXPECTED.Aztecs.includes('k')&&!EXPECTED.Mayans.includes('s')&&!EXPECTED.Incas.includes('k'),
  'American civilizations cannot recruit ordinary cavalry');
 assert.ok(!EXPECTED.Indians.includes('k'),'the C&K legacy Indians faction follows Hindustani no-Knight rule');
 assert.ok(!EXPECTED.Teutons.includes('v'),'Teutons have no Light Cavalry upgrade');
 assert.ok(!EXPECTED.Turks.includes('p')&&!EXPECTED.Turks.includes('e'),
  'Turks lack Pikeman and Elite Skirmisher');
 assert.ok(!EXPECTED.Mongols.includes('h'),'Mongols do not research Halberdier');
 assert.ok(EXPECTED.Franks.includes('a'),'Franks retain Cavalier upgrade');
});

test('barracks, archery range and stable technology lists hide forbidden upgrades for each civilization',()=>{
 const c=fixture();
 for(const [i,[civName,flags]] of Object.entries(EXPECTED).entries()){
  c(`S.civ[0]=${i};S.tech[0]={}`);
  assert.equal(c('CIV[S.civ[0]].n'),civName);
  for(const [key,[flag,building]] of Object.entries(TECHS)){
   const ok=flags.includes(flag);
   const listed=c(`rsOf(structures.${building}).includes('${key}')`);
   assert.equal(listed,ok,civName+' '+key+' catalog eligibility');
   const menu=JSON.parse(c(`JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,structures.${building}))`));
   assert.equal(menu.some(x=>x.type==='research'&&x.value===key),ok,civName+' '+key+' authenticated UI');
  }
  assert.equal(c('rsOf(structures.rng).includes("xbow")'),EXPLICIT_ARCHERY(civName).includes('x') /* dynamic shared research unaffected */);
 }
});

function EXPLICIT_ARCHERY(name){
 return {Franks:'x',Britons:'xa',Mongols:'xat',Byzantines:'xat',Persians:'xt',Teutons:'x',Celts:'x',
 Vikings:'xa',Saracens:'xat',Turks:'xt',Chinese:'xat',Japanese:'xat',Khmer:'xa',Indians:'xt',
 Spanish:'t',Italians:'xat',Slavs:'x',Huns:'xt',Goths:'x',Aztecs:'xa',Mayans:'xat',
 Incas:'xat',Ethiopians:'xat',Malians:'xat',Koreans:'xat',Magyars:'xat'}[name];
}

test('research() never charges for forbidden tier; allowed tiers still cost and queue correctly',()=>{
 const c=fixture();
 for(const [i,[civ,flags]] of Object.entries(EXPECTED).entries()){
  c(`S.civ[0]=${i};S.age[0]=3;S.tech[0]={};S.res[0]={f:10000,w:10000,g:10000,s:10000}`);
  for(const [key,[flag,building]] of Object.entries(TECHS)){
   c(`S.tech[0]={};S.bs.forEach(b=>{if(b.t===0){b.rs=null;b.q=[]}});S.res[0]={f:10000,w:10000,g:10000,s:10000}`);
   if(key==='pala')c('S.tech[0].cavl=1');
   if(key==='longs')c('S.tech[0].man=1');
   if(key==='twohand')c('S.tech[0].longs=1');
   if(key==='champ')c('S.tech[0].twohand=1');
   if(key==='halb')c('S.tech[0].pike=1');
   const balance=c('JSON.stringify(S.res[0])'),ok=flags.includes(flag);
   assert.equal(c(`research(structures.${building},'${key}')`),ok,civ+' '+key+' research');
   if(ok){
    assert.equal(c(`structures.${building}.rs.k`),key,civ+' research queue');
    assert.notEqual(c('JSON.stringify(S.res[0])'),balance,civ+' spends resources');
   }else{
    assert.equal(c(`structures.${building}.rs===null`),true,'research remains unqueued');
    assert.equal(c('JSON.stringify(S.res[0])'),balance,civ+' forbidden research is free of side effects');
   }
  }
 }
});

test('Scout and Knight training respects faction, plus old castle recruit lists and direct calls',()=>{
 const c=fixture();
 for(const [i,[name,flags]] of Object.entries(EXPECTED).entries()){
  c(`S.civ[0]=${i};S.tech[0]={};S.res[0]={f:10000,w:10000,g:10000,s:10000};structures.stable.q=[];structures.castle.q=[]`);
  for(const [key,flag] of Object.entries(UNITS)){
   const allowed=flags.includes(flag);
   const menu=c(`trOf(structures.stable).includes('${key}')`);
   assert.equal(menu,allowed,name+' '+key+' in Stable');
   const castle=c(`trOf(structures.castle).includes('${key}')`);
   if(key==='knight')assert.equal(castle,allowed,name+' must not recruit hidden Knight at Castle');
   const budget=c('JSON.stringify(S.res[0])');
   assert.equal(c(`train(structures.stable,'${key}')`),allowed,name+' '+key+' direct training');
   if(allowed){assert.notEqual(c('JSON.stringify(S.res[0])'),budget);c('structures.stable.q=[]')}
   else{assert.equal(c('JSON.stringify(S.res[0])'),budget);assert.equal(c('structures.stable.q.length'),0)}
  }
 }
});

test('authenticated commands reject prohibited unit training and research without charging either kingdom',()=>{
 const c=fixture();
 c("S.civ=[19,0];S.age=[3,3];S.tech=[{},{}];globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 const packet=(sid,team,seq,entity,type,key)=>({sid,team,seq,frame:6,order:{type,entities:[entity],value:key}});
 const hostStable=c('structures.stable.netId'),guestStable=c('structures.enemyStable.netId');
 const p1=packet('host',0,1,hostStable,'train','knight');
 const p2=packet('host',0,2,hostStable,'research','cavl');
 const p3=packet('guest',1,1,guestStable,'train','knight');
 c(`host.receive({...(${JSON.stringify(p1)}),v:CK_SIM_SYNC.VERSION},'host',2)`);
 c(`host.receive({...(${JSON.stringify(p2)}),v:CK_SIM_SYNC.VERSION},'host',2)`);
 c(`host.receive({...(${JSON.stringify(p3)}),v:CK_SIM_SYNC.VERSION},'guest',2)`);
 const before=c('JSON.stringify(S.res)');
 const applied=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(applied.filter(x=>!x.ok).length>=2,'host rejects unaffordable-to-faction commands');
 assert.ok(applied.some(x=>x.ok),'guest Franks have allowed Knight recruitment');
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(JSON.parse(before)[0]));
 assert.notEqual(c('JSON.stringify(S.res[1])'),JSON.stringify(JSON.parse(before)[1]));
});

test('pre-restriction army and research in old save remain loadable but cannot be newly queued',()=>{
 const c=fixture();
 c("S.civ=[19,0];globalThis.knight=addU(0,'knight',10.5,30.5);structures.stable.q=[{k:'knight',t:10}];structures.bar.rs={k:'halb',t:11}");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c("S.us.some(u=>u.t===0&&u.k==='knight')"),true,'existing historical soldiers survive');
 assert.equal(c("S.bs.some(b=>b.t===0&&b.k==='stable'&&b.q.some(q=>q.k==='knight'))"),true,'old queue is not silently lost');
 assert.equal(c("S.bs.some(b=>b.t===0&&b.k==='bar'&&b.rs?.k==='halb')"),true,'old research remains in progress');
 assert.equal(c("rsOf(S.bs.find(b=>b.t===0&&b.k==='bar')).includes('halb')"),false);
 assert.equal(c("trOf(S.bs.find(b=>b.t===0&&b.k==='stable')).includes('knight')"),false);
});

test('paid Cavalier to Paladin upgrades existing and newly trained units without affecting other teams',()=>{
 const c=fixture();c("globalThis.rider=addU(0,'knight',16.5,30.5);rider.hp=80;globalThis.dead=addU(0,'knight',18.5,30.5);dead.hp=0;globalThis.foreign=addU(1,'knight',20.5,30.5)");
 assert.equal(c("research(structures.stable,'pala')"),false,'Cavalier is required');
 assert.equal(c("research(structures.stable,'cavl')"),true);c('upB(structures.stable,80)');
 assert.equal(c('rider.hp'),100);assert.equal(c('mhp(rider)'),120);
 assert.equal(c("research(structures.stable,'pala')"),true);c('upB(structures.stable,169)');
 assert.equal(c("unitName('knight',0)"),'Cavalier');c('upB(structures.stable,1)');
 assert.equal(c("unitName('knight',0)"),'Paladin');assert.equal(c('rider.hp'),140);assert.equal(c('mhp(rider)'),160);
 assert.equal(c('dead.hp'),0);assert.equal(c('foreign.hp'),100);assert.equal(c('attackReload(rider)'),1.9);assert.equal(c('unitSpeed(rider)'),1.35);
 c("globalThis.newRider=addU(0,'knight',22.5,30.5)");assert.equal(c('newRider.hp'),160);
 assert.equal(c('S.res[0].f'),8400);assert.equal(c('S.res[0].g'),8950);
 c("globalThis.victim=addU(1,'vil',24.5,30.5);victim.hp=1000;dmgT(rider,victim)");assert.equal(c('1000-victim.hp'),14);
 c("globalThis.bow=addU(1,'arc',26.5,30.5);rider.hp=1000;dmgT(bow,rider)");assert.equal(c('1000-rider.hp'),1,'Paladin has three base pierce armor');
 c('foreign.t=0;S.tech[0].pala=0;foreign.hp=1000;dmgT(bow,foreign)');assert.equal(c('1000-foreign.hp'),2,'Cavalier retains two base pierce armor');
});

test('Paladin research keeps its age, affordability and duplicate-research gates',()=>{
 const c=fixture();c('S.tech[0].cavl=1;S.age[0]=2');const before=c('JSON.stringify(S.res)');
 assert.equal(c("research(structures.stable,'pala')"),false);assert.equal(c('JSON.stringify(S.res)'),before);
 c('S.age[0]=3;S.res[0].f=1299');assert.equal(c("research(structures.stable,'pala')"),false);
 c('S.res[0].f=1300;S.res[0].g=750');assert.equal(c("research(structures.stable,'pala')"),true);
 const paid=c('JSON.stringify(S.res)');assert.equal(c("research(structures.stable,'pala')"),false);assert.equal(c('JSON.stringify(S.res)'),paid);
 c('upB(structures.stable,170)');assert.equal(c("research(structures.stable,'pala')"),false);
});

test('in-progress Paladin research and completed unit stats survive current-build save/load',()=>{
 const c=fixture();c("S.tech[0].cavl=1;S.tech[0].hpb={knight:20};S.tech[0].atkb={knight:2};globalThis.rider=addU(0,'knight',16.5,30.5);globalThis.stableId=structures.stable.netId;globalThis.riderId=rider.netId;research(structures.stable,'pala');upB(structures.stable,60)");
 assert.equal(c('saveG()'),true);assert.equal(c('loadG()'),true);
 c('structures.stable=S.bs.find(b=>b.netId===stableId);rider=S.us.find(u=>u.netId===riderId)');assert.equal(c('structures.stable.rs.t'),110);
 c('upB(structures.stable,110)');assert.equal(c('mhp(rider)'),160);assert.equal(c("unitName('knight',0)"),'Paladin');
 assert.equal(c('saveG()'),true);assert.equal(c('loadG()'),true);assert.equal(c('S.tech[0].hpb.knight'),60);assert.equal(c('S.tech[0].atkb.knight'),4);
});

test('AI waits for four Knights before buying the expensive Paladin upgrade',()=>{
 const c=fixture();c("S.civ[1]=0;S.tech[1]={cavl:1,blood:1,husb:1,lcav:1};S.age[1]=3;globalThis.army=[0,1,2].map(i=>addU(1,'knight',60.5+i,30.5));globalThis.plan=()=>aiPlanResearch(1,{my:army,vil:[],arm:army,bl:[structures.enemyStable],tc:structures.enemyStable,R:S.res[1],humanShips:[],composition:{humanCav:0,humanInf:0,humanRanged:0,humanSiege:0}});plan()");
 assert.equal(c('structures.enemyStable.rs==null'),true);
 c("army.push(addU(1,'knight',63.5,30.5));plan()");assert.equal(c('structures.enemyStable.rs.k'),'pala');
});
