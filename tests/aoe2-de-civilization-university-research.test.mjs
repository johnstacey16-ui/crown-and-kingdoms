import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// DE Update 185872, SiegeEngineers/aoe2techtree data/data.json,
// blob c4f7da961e82a8231b1ba49459949c4d6e479bc8.
// Golden source tech IDs: Masonry 50, Arrowslits 608, Guard Tower 140,
// Keep 63, Fortified Wall 194, Chemistry 47, Ballistics 93, Murder Holes 322.
// Older game label Indians uses source Hindustanis.
const EXPECTED=Object.freeze({
  "Franks": "msgfcbh",
  "Britons": "msgkfcbh",
  "Mongols": "mgfcbh",
  "Byzantines": "sgkfcbh",
  "Persians": "mgcbh",
  "Teutons": "msgkfcbh",
  "Celts": "msgkfcbh",
  "Vikings": "msgfcbh",
  "Saracens": "msgkfcbh",
  "Turks": "msgkfcbh",
  "Chinese": "msgkfcbh",
  "Japanese": "msgkfcbh",
  "Khmer": "mgkfcbh",
  "Indians": "mgfcbh",
  "Spanish": "msgkfcbh",
  "Italians": "msgkfcbh",
  "Slavs": "mgfcbh",
  "Huns": "mcbh",
  "Goths": "mcbh",
  "Aztecs": "sgfcbh",
  "Mayans": "mgkfcbh",
  "Incas": "msgkfcbh",
  "Ethiopians": "mgkfcbh",
  "Malians": "mgkfcbh",
  "Koreans": "msgkfcbh",
  "Magyars": "mgcbh"
});
const TECHS=Object.freeze({"mas":"m","slit":"s","gtow":"g","keep":"k","fw":"f","chem":"c","ballistics":"b","murderHoles":"h"});
const SOURCE=Object.freeze({
 mas:{f:150,w:175,t:50,age:2},
 slit:{f:250,w:250,t:25,age:3},
 gtow:{f:100,w:250,t:30,age:2},
 keep:{f:500,w:350,t:75,age:3,pre:'gtow'},
 fw:{f:200,w:100,t:50,age:2},
 chem:{f:300,g:200,t:100,age:3},
 ballistics:{w:300,g:175,t:60,age:2},
 murderHoles:{f:200,s:100,t:35,age:2}
});
function fixture(){
 const {source,sandbox}=headlessGame();
 const modules=['network-sync','network-commands']
  .map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 const script=[
 'seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;',
 'startAge=3;startRes=3;startArmy=0;start();snd=0;',
 'S.civ=[8,17];S.us=[];S.bs=[];S.nodes=[];S.rel=[];',
 'S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);',
 'S.ex.fill(1);S.vs.fill(1);S.age=[3,3];S.tech=[{},{}];',
 'S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));',
 "globalThis.universities=[addB(0,'univ',12,12,true),addB(1,'univ',32,12,true)];",
 'globalThis.evalResearch=code=>eval(code);'
 ].join('\n');
 vm.runInNewContext(source+'\n'+modules+'\n'+script,sandbox,{timeout:15000});
 return code=>sandbox.evalResearch(code);
}
test('source-pinned University mask covers eight technologies for all 26 civilizations',()=>{
 const c=fixture(),actual=JSON.parse(c('JSON.stringify(CIV.map(x=>[x.n,CIV_UNIVERSITY_RESEARCH[x.n]]))'));
 assert.deepEqual(actual,Object.entries(EXPECTED));
 assert.equal(Object.keys(EXPECTED).length,26);
 assert.equal(new Set(Object.values(TECHS)).size,8);
 for(const [name,mask] of Object.entries(EXPECTED)){
  assert.match(mask,/^[msgkfcbh]*$/);
  assert.equal(new Set(mask).size,mask.length,name+' must not duplicate capabilities');
  assert.ok(mask.includes('c')&&mask.includes('b')&&mask.includes('h'),name+' retains shared university essentials');
 }
 assert.equal(EXPECTED.Huns,'mcbh','Huns cannot research tower or wall upgrades');
 assert.ok(!EXPECTED.Byzantines.includes('m'),'Byzantines lack Masonry');
 assert.ok(!EXPECTED.Franks.includes('k'),'Franks lack Keep');
 assert.ok(EXPECTED.Saracens.includes('k')&&EXPECTED.Saracens.includes('s'),'Saracens retain Keep and Arrowslits');
});
test('each University research menu and direct payment respects source civilization access',()=>{
 const c=fixture();
 for(const [i,[name,mask]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3');
  assert.equal(c('CIV[S.civ[0]].n'),name);
  const catalogue=JSON.parse(c('JSON.stringify(rsOf(universities[0]))'));
  const menu=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,universities[0]))'));
  for(const [key,flag] of Object.entries(TECHS)){
   const allowed=mask.includes(flag);
   assert.equal(catalogue.includes(key),allowed,name+' '+key+' catalogue');
   assert.equal(menu.some(o=>o.type==='research'&&o.value===key),allowed,name+' '+key+' authoritative menu');
   c('S.tech[0]='+(key==='keep'?'{gtow:1}':'{}')+
     ';universities[0].rs=null;universities[0].q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000}');
   const balance=c('JSON.stringify(S.res[0])');
   assert.equal(c("research(universities[0],'"+key+"')"),allowed,name+' '+key+' research');
   assert.equal(c('universities[0].rs?.k||null'),allowed?key:null,name+' queue');
   assert.equal(c('JSON.stringify(S.res[0])')===balance,!allowed,name+' forbidden purchases must not charge');
  }
  // A previous, separately validated Treadmill Crane key is not silently removed.
  assert.equal(c("rsOf(universities[0]).includes('crane')"),true,name+' legacy crane remains available pending its separate verification');
 }
});
test('correct University costs, research times and age/prerequisite rules',()=>{
 const c=fixture();
 for(const [key,record] of Object.entries(SOURCE)){
  const spec=JSON.parse(c("JSON.stringify(TE['"+key+"'])"));
  assert.deepEqual(spec.cost,Object.fromEntries(Object.entries(record).filter(([k])=>'fwgs'.includes(k))),key+' source cost');
  assert.equal(spec.t,record.t,key+' research time');
  assert.equal(spec.age,record.age,key+' minimum age');
  assert.equal(spec.pre||null,record.pre||null,key+' source prerequisite');
 }
 c("S.civ[0]=8;S.tech[0]={};S.age[0]=2;universities[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}");
 assert.equal(c("research(universities[0],'gtow')"),true,'Guard Tower does not need Arrowslits');
 c("universities[0].rs=null;S.tech[0]={}");
 assert.equal(c("research(universities[0],'fw')"),true,'Fortified Wall does not require Masonry');
 c("universities[0].rs=null;S.tech[0]={}");
 assert.equal(c("research(universities[0],'slit')"),false,'Arrowslits requires Imperial Age');
 assert.equal(c("research(universities[0],'keep')"),false,'Keep requires Imperial Age and Guard Tower');
 c("S.age[0]=3");
 assert.equal(c("research(universities[0],'slit')"),true,'Imperial Arrowslits need no Guard Tower');
 c("universities[0].rs=null;S.tech[0]={}");
 assert.equal(c("research(universities[0],'keep')"),false,'Keep needs Guard Tower first');
 c("S.tech[0].gtow=1");
 assert.equal(c("research(universities[0],'keep')"),true,'Keep follows Guard Tower');
});
test('explicit civ arrays remain team-specific across solo and authenticated production menus',()=>{
 const c=fixture();c('S.civ=[17,8];S.age=[3,3];S.tech=[{},{}]');
 assert.equal(c("rsOf(universities[0]).includes('gtow')"),false);
 assert.equal(c("rsOf(universities[1]).includes('gtow')"),true);
 assert.equal(c("rsOf(universities[0],[8,17]).includes('gtow')"),true);
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,0,universities[0]).some(o=>o.value==='gtow')"),false);
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,1,universities[1]).some(o=>o.value==='gtow')"),true);
});
test('network host refuses Huns Guard Tower while allowing Saracen Guard Tower without budget leak',()=>{
 const c=fixture();c("S.civ=[17,8];S.age=[3,3];S.tech=[{},{}]");
 c("globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 c("globalThis.packet=(sid,team,seq,id)=>({v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{type:'research',entities:[id],value:'gtow'}})");
 const before=JSON.parse(c('JSON.stringify(S.res)'));
 assert.equal(c("host.receive(packet('host',0,1,universities[0].netId),'host',2).ok"),true);
 assert.equal(c("host.receive(packet('guest',1,1,universities[1].netId),'guest',2).ok"),true);
 const applied=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(applied.some(x=>x.ok===false),'host must reject source-forbidden research');
 assert.ok(applied.some(x=>x.ok===true),'host accepts eligible research');
 assert.deepEqual(JSON.parse(c('JSON.stringify(S.res[0])')),before[0]);
 assert.notDeepEqual(JSON.parse(c('JSON.stringify(S.res[1])')),before[1]);
 assert.equal(c('universities[0].rs??null'),null);
 assert.equal(c('universities[1].rs.k'),'gtow');
});
test('old saves retain in-progress forbidden University research; new purchases remain denied',()=>{
 const c=fixture();c("S.civ=[17,8];universities[0].rs={k:'gtow',t:10};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c("S.bs.find(b=>b.k==='univ'&&b.t===0).rs.k"),'gtow');
 assert.equal(c("rsOf(S.bs.find(b=>b.k==='univ'&&b.t===0)).includes('gtow')"),false);
 c("upB(S.bs.find(b=>b.k==='univ'&&b.t===0),10)");
 assert.equal(c('S.tech[0].gtow'),1);
 const after=c('JSON.stringify(S.res[0])');
 assert.equal(c("research(S.bs.find(b=>b.k==='univ'&&b.t===0),'fw')"),false);
 assert.equal(c('JSON.stringify(S.res[0])'),after);
});
