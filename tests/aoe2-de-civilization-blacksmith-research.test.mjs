import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// Source-pinned AoE2 DE build 185872, SiegeEngineers/aoe2techtree
// data/data.json blob c4f7da961e82a8231b1ba49459949c4d6e479bc8.
// IDs: Scale Mail 74, Padded Archer Armor 211, Scale Barding Armor 81.
// Forging/Iron Casting/Blast Furnace are tested in the separate melee tier suite.
// Legacy "Indians" resolves the source's Hindustanis tree.
const EXPECTED=Object.freeze({
  "Franks": "irc",
  "Britons": "irc",
  "Mongols": "irc",
  "Byzantines": "irc",
  "Persians": "irc",
  "Teutons": "irc",
  "Celts": "irc",
  "Vikings": "irc",
  "Saracens": "irc",
  "Turks": "irc",
  "Chinese": "irc",
  "Japanese": "irc",
  "Khmer": "irc",
  "Indians": "irc",
  "Spanish": "irc",
  "Italians": "irc",
  "Slavs": "irc",
  "Huns": "irc",
  "Goths": "irc",
  "Aztecs": "ir",
  "Mayans": "ir",
  "Incas": "ir",
  "Ethiopians": "irc",
  "Malians": "irc",
  "Koreans": "irc",
  "Magyars": "irc"
});
const TECHS=Object.freeze({armI:'i',armR:'r',armC:'c'});
const COSTS=Object.freeze({armI:{f:100},armR:{f:100},armC:{f:150}});
const TIMES=Object.freeze({armI:40,armR:40,armC:45});
function fixture(){
 const {source,sandbox}=headlessGame();
 const networking=['network-sync','network-commands']
  .map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 const setup=[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;',
  'startAge=3;startRes=3;startArmy=0;start();snd=0;',
  'S.civ=[8,19];S.us=[];S.bs=[];S.nodes=[];S.rel=[];',
  'S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);',
  'S.ex.fill(1);S.vs.fill(1);S.age=[3,3];S.tech=[{},{}];',
  'S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));',
  "globalThis.smiths=[addB(0,'smith',12,12,true),addB(1,'smith',32,12,true)];",
  'globalThis.runBlacksmith=code=>eval(code);'
 ].join('\n');
 vm.runInNewContext(source+'\n'+networking+'\n'+setup,sandbox,{timeout:15000});
 return code=>sandbox.runBlacksmith(code);
}
test('all 26 civilizations have pinned three-key first-tier armor availability',()=>{
 const c=fixture(),actual=JSON.parse(c('JSON.stringify(CIV.map(x=>[x.n,CIV_BLACKSMITH_RESEARCH[x.n]]))'));
 assert.deepEqual(actual,Object.entries(EXPECTED));
 assert.equal(Object.keys(EXPECTED).length,26);
 assert.equal(new Set(Object.values(TECHS)).size,3);
 for(const [civ,mask] of Object.entries(EXPECTED)){
  assert.match(mask,/^[irc]*$/,civ+' only known source technology keys');
  assert.equal(new Set(mask).size,mask.length,civ+' no duplicate flags');
  assert.ok(mask.includes('i')&&mask.includes('r'),
   civ+' retains universal Scale Mail and Padded Archer Armor');
 }
 assert.ok(['Aztecs','Mayans','Incas'].every(k=>!EXPECTED[k].includes('c')),
  'three American factions lack Scale Barding Armor');
 assert.equal(EXPECTED.Saracens,'irc','Saracens retain both special capabilities');
});
test('Blacksmith catalogue and authenticated research menus source-gate all three armor keys',()=>{
 const c=fixture();
 for(const [i,[name,mask]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={}');
  assert.equal(c('CIV[S.civ[0]].n'),name);
  const list=JSON.parse(c('JSON.stringify(rsOf(smiths[0]))'));
  const menu=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,smiths[0]))'));
  for(const [k,flag] of Object.entries(TECHS)){
   const permitted=mask.includes(flag);
   assert.equal(list.includes(k),permitted,name+' '+k+' catalogue');
   assert.equal(menu.some(o=>o.type==='research'&&o.value===k),permitted,name+' '+k+' command menu');
  }
  for(const key of ['atkR','bodkin'])assert.equal(list.includes(key),true,
   name+' retains universally available lower archery attack research');
  assert.equal(list.includes('atkR2'),c("CIV_FIELD_RESEARCH['"+name+"'].includes('r')"),
   name+' Bracer remains independently civilization-gated');
 }
});
test('allowed Blacksmith purchases queue and spend; forbidden purchases do neither for any civ',()=>{
 const c=fixture();
 for(const [i,[name,mask]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3');
  for(const [key,flag] of Object.entries(TECHS)){
   c('S.tech[0]={}'+
    ';smiths[0].rs=null;smiths[0].q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000}');
   const before=c('JSON.stringify(S.res[0])'),permitted=mask.includes(flag);
   assert.equal(c("research(smiths[0],'"+key+"')"),permitted,name+' '+key);
   assert.equal(c('smiths[0].rs?.k||null'),permitted?key:null,name+' research queue');
   assert.equal(c('JSON.stringify(S.res[0])')===before,!permitted,
    name+' '+key+' forbidden resources');
  }
 }
});
test('first armor tier research uses verified DE cost and 40/45-second timers',()=>{
 const c=fixture();
 for(const key of Object.keys(COSTS)){
  const tech=JSON.parse(c("JSON.stringify(TE."+key+")"));
  assert.deepEqual(tech.cost,COSTS[key],key+' DE first-tier cost');
  assert.equal(tech.t,TIMES[key],key+' first-tier time');
  assert.equal(tech.age,1,key+' Feudal Age');
  c('S.civ[0]=8;S.age[0]=1;S.tech[0]={};smiths[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const before=JSON.parse(c('JSON.stringify(S.res[0])'));
  assert.equal(c("research(smiths[0],'"+key+"')"),true);
  const after=JSON.parse(c('JSON.stringify(S.res[0])'));
  assert.equal(before.f-after.f,COSTS[key].f,key+' exact food charge');
  assert.equal(before.g-after.g,0,key+' no invented first-tier gold charge');
  c('upB(smiths[0],TE.'+key+'.t-1)');
  assert.equal(c('S.tech[0].'+key+'||0'),0,key+' does not finish early');
  c('upB(smiths[0],1)');
  assert.equal(c('S.tech[0].'+key+''),1,key+' finishes on source timer');
 }
});
test('team isolation and explicit civilization arrays are respected for Blacksmith research',()=>{
 const c=fixture();
 c('S.civ=[3,0];S.age=[3,3];S.tech=[{},{}]');
 assert.equal(c("rsOf(smiths[0]).includes('blastFurnace')"),false);
 assert.equal(c("rsOf(smiths[1]).includes('blastFurnace')"),true);
 assert.equal(c("rsOf(smiths[0],[0,3]).includes('blastFurnace')"),true);
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,0,smiths[0]).some(x=>x.value==='blastFurnace')"),false);
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,1,smiths[1]).some(x=>x.value==='blastFurnace')"),true);
});
test('authenticated host rejects unavailable Blacksmith research without budget leaks',()=>{
 const c=fixture();
 c("S.civ=[3,0];S.age=[3,3];S.tech=[{forging:1,ironCasting:1},{forging:1,ironCasting:1}];globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 c("globalThis.packet=(sid,team,seq,id)=>({v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{type:'research',entities:[id],value:'blastFurnace'}})");
 const before=JSON.parse(c('JSON.stringify(S.res)'));
 assert.equal(c("host.receive(packet('host',0,1,smiths[0].netId),'host',2).ok"),true);
 assert.equal(c("host.receive(packet('guest',1,1,smiths[1].netId),'guest',2).ok"),true);
 const result=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(result.some(x=>x.ok===false),'unavailable Blast Furnace rejected');
 assert.ok(result.some(x=>x.ok===true),'permitted final-tier upgrade accepted');
 assert.deepEqual(JSON.parse(c('JSON.stringify(S.res[0])')),before[0]);
 assert.notDeepEqual(JSON.parse(c('JSON.stringify(S.res[1])')),before[1]);
 assert.equal(c('smiths[0].rs??null'),null);
 assert.equal(c('smiths[1].rs.k'),'blastFurnace');
});
test('pre-restriction save retains paid forbidden research and forbids subsequent purchases',()=>{
 const c=fixture();
 c("S.civ=[19,0];smiths[0].rs={k:'armC',t:10};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c("S.bs.find(b=>b.k==='smith'&&b.t===0).rs.k"),'armC');
 assert.equal(c("rsOf(S.bs.find(b=>b.k==='smith'&&b.t===0)).includes('armC')"),false);
 c("upB(S.bs.find(b=>b.k==='smith'&&b.t===0),10)");
 assert.equal(c('S.tech[0].armC'),1,'previously paid upgrade completes');
 const before=c('JSON.stringify(S.res[0])');
 c('S.tech[0].forging=1;S.tech[0].ironCasting=1');
 assert.equal(c("research(S.bs.find(b=>b.k==='smith'&&b.t===0),'blastFurnace')"),true,
  'Aztecs can still buy their allowed actual Blast Furnace tier');
 c("S.bs.find(b=>b.k==='smith'&&b.t===0).rs=null");
 assert.equal(c("research(S.bs.find(b=>b.k==='smith'&&b.t===0),'armC')"),false,
  'American civ cannot purchase forbidden cavalry armor again');
 assert.notEqual(c('JSON.stringify(S.res[0])'),before,'allowed new upgrade still charged');
});
