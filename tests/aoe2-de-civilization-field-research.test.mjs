import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// SiegeEngineers/aoe2techtree data/data.json at
// c4f7da961e82a8231b1ba49459949c4d6e479bc8
// Bracer 201 (r), Bloodlines 435 (b), Husbandry 39 (h).
// All 26 civs also have Fletching 199, Bodkin 200 and Ballistics 93.
const EXPECTED=Object.freeze({
 Franks:'h',Britons:'rh',Mongols:'rbh',Byzantines:'rh',
 Persians:'bh',Teutons:'b',Celts:'h',Vikings:'r',
 Saracens:'rbh',Turks:'rbh',Chinese:'rbh',Japanese:'rbh',
 Khmer:'rbh',Indians:'rbh',Spanish:'rbh',Italians:'rbh',
 Slavs:'bh',Huns:'rbh',Goths:'rbh',Aztecs:'r',
 Mayans:'r',Incas:'r',Ethiopians:'rh',Malians:'bh',
 Koreans:'rh',Magyars:'rbh'
});

function fixture(){
 const {source,sandbox}=headlessGame();
 const network=['network-sync','network-commands']
   .map(k=>readFileSync(new URL('../js/'+k+'.js',import.meta.url),'utf8')).join('\n');
 vm.runInNewContext(source+'\n'+network+`
  seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;
  startAge=3;startRes=3;startArmy=0;start();snd=0;
  S.civ=[2,1];S.us=[];S.bs=[];S.nodes=[];S.rel=[];
  S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);
  S.ex.fill(1);S.vs.fill(1);S.age=[3,3];
  S.tech=[{atkR:1,bodkin:1},{atkR:1,bodkin:1}];
  S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));
  globalThis.smiths=[addB(0,'smith',12,12,true),addB(1,'smith',32,12,true)];
  globalThis.stables=[addB(0,'stable',12,20,true),addB(1,'stable',32,20,true)];
  globalThis.evalCiv=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.evalCiv(code);
}

test('the source-backed Bracer/Bloodlines/Husbandry matrix covers each implemented civilization',()=>{
 const c=fixture();
 const actual=JSON.parse(c('JSON.stringify(CIV.map((c,i)=>[c.n,CIV_FIELD_RESEARCH[c.n],i]))'));
 assert.equal(actual.length,26);
 assert.deepEqual(actual.map(([n,flags])=>[n,flags]),Object.entries(EXPECTED));
 for(const [n,flags] of Object.entries(EXPECTED)){
  assert.match(flags,/^[rbh]*$/);
  assert.equal(new Set(flags).size,flags.length,n+' has no duplicate source flags');
 }
 assert.equal(EXPECTED.Franks,'h','Franks lack both Bracer and Bloodlines');
 assert.equal(EXPECTED.Britons,'rh','Britons lack Bloodlines');
 assert.equal(EXPECTED.Teutons,'b','Teutons lack Bracer and Husbandry');
 assert.equal(EXPECTED.Malians,'bh','Malians lack Bracer');
 assert.equal(EXPECTED.Vikings,'r','Vikings lack both stable technologies');
 assert.equal(EXPECTED.Indians,'rbh','legacy Indians maps to modern Hindustanis');
});

test('Blacksmith and Stable menus, direct research and AI catalog honor all 26 source tech trees',()=>{
 const c=fixture(),techs=[['atkR2','r','smiths'],['blood','b','stables'],['husb','h','stables']];
 for(let i=0;i<26;i++){
  const [name,flags]=Object.entries(EXPECTED)[i];
  c(`S.civ[0]=${i};S.tech[0]={atkR:1,bodkin:1};S.age[0]=3;
       smiths[0].rs=null;smiths[0].q=[];stables[0].rs=null;stables[0].q=[];
       S.res[0]={f:10000,w:10000,g:10000,s:10000}`);
  assert.equal(c('CIV[S.civ[0]].n'),name);
  for(const [tech,flag,bld] of techs){
   const legal=flags.includes(flag);
   const obj=bld+'[0]';
   assert.equal(c(`rsOf(${obj}).includes('${tech}')`),legal,name+' '+tech+' catalog');
   const options=JSON.parse(c(`JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,${obj}))`));
   assert.equal(options.some(o=>o.type==='research'&&o.value===tech),legal,name+' '+tech+' authoritative menu');
   const budget=c('JSON.stringify(S.res[0])');
   assert.equal(c(`research(${obj},'${tech}')`),legal,name+' '+tech+' direct research');
   assert.equal(c(obj+'.rs?.k||null'),legal?tech:null);
   if(legal)assert.notEqual(c('JSON.stringify(S.res[0])'),budget,name+' research paid');
   else assert.equal(c('JSON.stringify(S.res[0])'),budget,name+' denied research free');
   c(obj+'.rs=null');
  }
  for(const key of ['atkR','bodkin'])assert.equal(c(`rsOf(smiths[0]).includes('${key}')`),true,name+' baseline arrow technology still available');
  assert.equal(c("rsOf(stables[0]).includes('cavl')"),EXPECTED[name]?c("CIV_CORE_MILITARY[CIV[S.civ[0]].n].includes('a')"):true,
   name+' preexisting Cavalier availability unchanged');
 }
});

test('team-specific restrictions do not leak between civilization rosters or the multiplayer menu',()=>{
 const c=fixture();
 c('S.civ=[0,2];S.tech=[{atkR:1,bodkin:1},{atkR:1,bodkin:1}];S.age=[3,3]');
 for(const [tech,bld] of [['atkR2','smiths'],['blood','stables']]){
  assert.equal(c(`rsOf(${bld}[0]).includes('${tech}')`),false,'Franks cannot research '+tech);
  assert.equal(c(`rsOf(${bld}[1]).includes('${tech}')`),true,'Mongols can research '+tech);
  assert.equal(c(`rsOf(${bld}[0],[2,0]).includes('${tech}')`),true,'explicit network civ mapping remains honored');
  assert.equal(c(`CK_GAME_COMMANDS.buildingOptions(S,0,${bld}[0]).some(o=>o.value==='${tech}')`),false);
  assert.equal(c(`CK_GAME_COMMANDS.buildingOptions(S,1,${bld}[1]).some(o=>o.value==='${tech}')`),true);
 }
 assert.equal(c("rsOf(stables[0]).includes('husb')"),true,'Franks have Husbandry');
 assert.equal(c("rsOf(stables[1]).includes('husb')"),true);
});

test('host rejects forbidden Franks Bloodlines without spending resources while permitting Mongol Bloodlines',()=>{
 const c=fixture();
 c(`S.civ=[0,2];S.age=[3,3];S.tech=[{},{}];
 globalThis.host=CK_SIM_SYNC.createCommandHost({
  roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,
  lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute
 });
 globalThis.packet=(sid,team,seq,id)=>({
  v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{
   type:'research',entities:[id],value:'blood'
  }
 });`);
 const before=c('JSON.stringify(S.res)');
 assert.equal(c("host.receive(packet('host',0,1,stables[0].netId),'host',2).ok"),true);
 assert.equal(c("host.receive(packet('guest',1,1,stables[1].netId),'guest',2).ok"),true);
 const applied=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(applied.some(r=>r.ok===false),'source-forbidden host order is denied when applied');
 assert.ok(applied.some(r=>r.ok===true),'other civ may independently research');
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(JSON.parse(before)[0]),'Franks spend nothing');
 assert.notEqual(c('JSON.stringify(S.res[1])'),JSON.stringify(JSON.parse(before)[1]),'Mongols pay for Bloodlines');
 assert.equal(c('stables[0].rs??null'),null);
 assert.equal(c('stables[1].rs.k'),'blood');
});

test('allowed Bracer, Bloodlines and Husbandry affect existing soldier damage, HP and movement',()=>{
 const c=fixture();
 c(`S.civ=[2,2];S.age=[3,3];
 globalThis.bow=addU(0,'arc',15.5,25.5);
 globalThis.knight=addU(0,'knight',16.5,25.5);
 globalThis.enemy=addU(1,'mil',20.5,25.5);`);
 const hp=c('mhp(knight)'),speed=c('unitSpeed(knight)'),rng=c('attackRange(bow)');
 assert.equal(c("research(smiths[0],'atkR2')"),true);
 c('upB(smiths[0],40)');
 assert.equal(c('S.tech[0].atkR2'),1);
 assert.equal(c('attackRange(bow)'),rng+1,'Bracer immediately improves previously trained Archer');
 assert.equal(c("research(stables[0],'blood')"),true);
 c('upB(stables[0],40)');
 assert.equal(c('S.tech[0].blood'),1);
 assert.equal(c('mhp(knight)'),hp+20,'Bloodlines works for existing Knight');
 assert.equal(c("research(stables[0],'husb')"),true);
 c('upB(stables[0],40)');
 assert.equal(c('S.tech[0].husb'),1);
 assert.ok(Math.abs(c('unitSpeed(knight)')-speed*1.1)<1e-9,'Husbandry affects existing mounted unit');
});

test('old saved games with already-running now-forbidden tech research remain loadable and completable',()=>{
 const c=fixture();
 c("S.civ=[0,2];stables[0].rs={k:'blood',t:10};smiths[0].rs={k:'atkR2',t:10};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true,'older save is not rejected merely due to revised tech availability');
 assert.equal(c("S.bs.find(b=>b.k==='stable'&&b.t===0).rs.k"),'blood');
 assert.equal(c("S.bs.find(b=>b.k==='smith'&&b.t===0).rs.k"),'atkR2');
 assert.equal(c("rsOf(S.bs.find(b=>b.k==='stable'&&b.t===0)).includes('blood')"),false);
 assert.equal(c("rsOf(S.bs.find(b=>b.k==='smith'&&b.t===0)).includes('atkR2')"),false);
 c("upB(S.bs.find(b=>b.k==='stable'&&b.t===0),10)");
 c("upB(S.bs.find(b=>b.k==='smith'&&b.t===0),10)");
 assert.equal(c('S.tech[0].blood'),1);
 assert.equal(c('S.tech[0].atkR2'),1);
});
