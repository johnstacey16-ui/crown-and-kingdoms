import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const EXPECTED=Object.freeze({
 Franks:'x',Britons:'xa',Mongols:'xat',Byzantines:'xat',Persians:'xt',
 Teutons:'x',Celts:'x',Vikings:'xa',Saracens:'xat',Turks:'xt',
 Chinese:'xat',Japanese:'xat',Khmer:'xa',Indians:'xt',Spanish:'t',
 Italians:'xat',Slavs:'x',Huns:'xt',Goths:'x',Aztecs:'xa',
 Mayans:'xat',Incas:'xat',Ethiopians:'xat',Malians:'xat',
 Koreans:'xat',Magyars:'xat'
});
// Verified from SiegeEngineers/aoe2techtree data/data.json at
// 3bb43b1439eef88dfe7fe892d7f7dc41ac9dd76f (22 Sep 2026).
// Source keys: Crossbowman unit 24, Arbalester unit 492, Thumb Ring tech 437.
// Our legacy game name "Indians" corresponds to source "Hindustanis".
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
  globalThis.ranges=[addB(0,'rng',20,20,true),addB(1,'rng',30,20,true)];
  globalThis.runArcher=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.runArcher(code);
}

test('all 26 civilization archery tech-tree entries match sourced availability',()=>{
 const c=fixture();
 const actual=JSON.parse(c('JSON.stringify(CIV.map((c,i)=>[c.n,CIV_ARCHERY_RESEARCH[c.n],i]))'));
 assert.equal(actual.length,26,'no implemented civilization is omitted');
 assert.deepEqual(actual.map(([name,key])=>[name,key]),
  Object.entries(EXPECTED),'data must stay aligned with the existing civilization ordering');
 for(const [name,flags] of Object.entries(EXPECTED)){
  assert.match(flags,/^[xat]*$/);
  assert.equal(new Set(flags).size,flags.length,name+' cannot duplicate a tech');
  assert.ok(!flags.includes('a')||flags.includes('x'),name+' cannot upgrade an unavailable Crossbowman');
 }
 assert.equal(EXPECTED.Britons,'xa','Britons lack Thumb Ring but obtain Arbalester');
 assert.equal(EXPECTED.Spanish,'t','Spanish get Thumb Ring but no Crossbow/Arbalester');
 assert.equal(EXPECTED.Franks,'x','Franks stop at Crossbowman');
 assert.equal(EXPECTED.Indians,'xt','legacy Indians uses contemporary Hindustanis availability');
});

test('research catalog, production menu and direct research enforce all 26 civ restrictions without charging forbidden research',()=>{
 const c=fixture();
 const keys=[['xbow','x'],['arb','a'],['thumb','t']];
 for(let i=0;i<26;i++){
  const [name,flags]=Object.entries(EXPECTED)[i];
  c(`S.civ[0]=${i};S.tech[0]={};S.age[0]=3;ranges[0].rs=null;ranges[0].q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000}`);
  assert.equal(c('CIV[S.civ[0]].n'),name);
  const options=JSON.parse(c('JSON.stringify(rsOf(ranges[0],S.civ))'));
  const menu=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,ranges[0]))'));
  for(const [tech,flag] of keys){
   const allowed=flags.includes(flag);
   assert.equal(options.includes(tech),allowed,name+' '+tech+' catalog');
   assert.equal(menu.some(o=>o.type==='research'&&o.value===tech),allowed,name+' '+tech+' authenticated menu');
   c(tech==='arb'?'S.tech[0].xbow=1':'S.tech[0]={}');
   const before=c('JSON.stringify(S.res[0])');
   const success=c(`research(ranges[0],'${tech}')`);
   assert.equal(success,allowed,name+' '+tech+' direct research');
   assert.equal(c('ranges[0].rs?.k||null'),allowed?tech:null);
   if(allowed)assert.notEqual(c('JSON.stringify(S.res[0])'),before,name+' research costs money');
   else assert.equal(c('JSON.stringify(S.res[0])'),before,name+' denied research costs nothing');
   c('ranges[0].rs=null');
  }
  assert.equal(c("rsOf(ranges[0]).includes('elsk')"),true,
   name+' must keep other research unchanged');
 }
});

test('team-specific research restrictions cannot be bypassed by supplying another civilization array',()=>{
 const c=fixture();
 c('S.civ=[1,2];S.tech=[{},{}];S.age=[3,3]');
 assert.equal(c("rsOf(ranges[0]).includes('thumb')"),false,'Britons cannot access Thumb Ring');
 assert.equal(c("rsOf(ranges[1]).includes('thumb')"),true,'Mongols can access Thumb Ring');
 assert.equal(c("rsOf(ranges[0],[2,1]).includes('thumb')"),true,
  'catalog accepts explicit network-world civilization mapping rather than global singleton');
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,0,ranges[0]).some(o=>o.value==='thumb')"),false);
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,1,ranges[1]).some(o=>o.value==='thumb')"),true);
 const budget=c('JSON.stringify(S.res[0])');
 assert.equal(c("research(ranges[0],'thumb')"),false);
 assert.equal(c('JSON.stringify(S.res[0])'),budget);
 assert.equal(c("research(ranges[1],'thumb')"),true);
 assert.equal(c('ranges[1].rs.k'),'thumb');
});

test('authenticated host cannot accept forbidden Briton Thumb Ring research orders',()=>{
 const c=fixture();
 c(`S.civ=[1,2];S.tech=[{},{}];S.age=[3,3];
 globalThis.host=CK_SIM_SYNC.createCommandHost({
  roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,
  lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute
 });
 globalThis.packet=(sid,team,seq,id)=>({
  v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{
    type:'research',entities:[id],value:'thumb'
  }
 });`);
 const before=c('JSON.stringify(S.res)');
 const deny=c("host.receive(packet('host',0,1,ranges[0].netId),'host',2).ok");
 assert.equal(deny,true,'protocol accepts syntactically valid requests for later gameplay verification');
 assert.equal(c('JSON.stringify(S.res)'),before,'rejection has no resource side effects');
 const accept=c("host.receive(packet('guest',1,1,ranges[1].netId),'guest',2).ok");
 assert.equal(accept,true,'other kingdom is allowed to queue researched tech');
 const applied=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(applied.some(r=>r.ok===false),'unavailable tech must fail host application');
 assert.ok(applied.some(r=>r.ok===true),'the other kingdom can research the tech');
 assert.equal(c('JSON.stringify(S.res[0])'),JSON.stringify(JSON.parse(before)[0]),'forbidden tech must leave host budget unchanged');
 assert.notEqual(c('JSON.stringify(S.res[1])'),JSON.stringify(JSON.parse(before)[1]),'legal guest research pays normally');
 assert.equal(c('ranges[1].rs.k'),'thumb');
 assert.equal(c('ranges[0].rs??null'),null,'forbidden research must leave the host range without an active research queue');
});

test('pre-restriction save with pending research loads without dropping the player game',()=>{
 const c=fixture();
 c("S.civ=[1,2];ranges[0].rs={k:'thumb',t:10};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true,'legacy in-progress Briton tech does not corrupt saved game');
 assert.equal(c("S.bs.find(b=>b.k==='rng'&&b.t===0).rs.k"),'thumb');
 assert.equal(c("rsOf(S.bs.find(b=>b.k==='rng'&&b.t===0)).includes('thumb')"),false,
  'the technology is not offered again in a new research queue');
 assert.equal(c("research(S.bs.find(b=>b.k==='rng'&&b.t===1),'thumb')"),true,
  'the opposing kingdom still has its independent tech tree');
});
