import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// Independent golden matrix from SiegeEngineers/aoe2techtree data/data.json,
// blob c4f7da961e82a8231b1ba49459949c4d6e479bc8 (DE update 185872).
// d=Devotion 46, f=Faith 45, h=Heresy 439, r=Redemption 316,
// a=Atonement 319, s=Sanctity 231, v=Fervor 252, b=Block Printing 230,
// i=Illumination 233, t=Theocracy 438, m=Herbal Medicine 441.
// Indians is the legacy C&K name for the source's Hindustanis.
const EXPECTED=Object.freeze({
  "Franks": "dfhsvbitm",
  "Britons": "dfsvbitm",
  "Mongols": "dfhavm",
  "Byzantines": "dfhrasvbit",
  "Persians": "dfvbtm",
  "Teutons": "dfhrasvbitm",
  "Celts": "dfhsvm",
  "Vikings": "dfhavb",
  "Saracens": "dfhrasvbitm",
  "Turks": "dfhrasvt",
  "Chinese": "dfasvbitm",
  "Japanese": "dfrasvbitm",
  "Khmer": "dfrsvitm",
  "Indians": "dfrsvbitm",
  "Spanish": "dfhrasvbitm",
  "Italians": "dfrasvbitm",
  "Slavs": "dfrasbitm",
  "Huns": "dfhasvi",
  "Goths": "dfsvitm",
  "Aztecs": "dfhrasvbitm",
  "Mayans": "dfhasvbtm",
  "Incas": "dfhrsbitm",
  "Ethiopians": "dfhasvitm",
  "Malians": "dfhrasvbtm",
  "Koreans": "dfsvbtm",
  "Magyars": "dhsvbitm"
});
const TECHS=Object.freeze({"devotion":"d","faith":"f","heresy":"h","redemption":"r","atonement":"a","sanctity":"s","fervor":"v","blockPrinting":"b","illumination":"i","theocracy":"t","herbalMedicine":"m"});

function fixture(){
 const {source,sandbox}=headlessGame();
 const network=['network-sync','network-commands']
   .map(k=>readFileSync(new URL('../js/'+k+'.js',import.meta.url),'utf8')).join('\n');
 const script=[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;',
  'startAge=3;startRes=3;startArmy=0;start();snd=0;',
  'S.civ=[8,0];S.us=[];S.bs=[];S.nodes=[];S.rel=[];',
  'S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);',
  'S.ex.fill(1);S.vs.fill(1);S.age=[3,3];S.tech=[{},{}];',
  'S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));',
  "globalThis.monasteries=[addB(0,'monastery',12,12,true),addB(1,'monastery',32,12,true)];",
  'globalThis.evaluate=code=>eval(code);'
 ].join('\n');
 vm.runInNewContext(source+'\n'+network+'\n'+script,sandbox,{timeout:15000});
 return code=>sandbox.evaluate(code);
}

test('all 26 civilizations use the pinned 11-technology Monastery matrix',()=>{
 const c=fixture();
 const actual=JSON.parse(c('JSON.stringify(CIV.map(x=>[x.n,CIV_MONASTERY_RESEARCH[x.n]]))'));
 assert.equal(actual.length,26);
 assert.deepEqual(actual,Object.entries(EXPECTED));
 const allFlags=Object.values(TECHS);
 assert.equal(new Set(allFlags).size,11,'every research has an unambiguous source flag');
 for(const [name,available] of Object.entries(EXPECTED)){
  assert.match(available,/^[dfhrasvbitm]*$/,name+' only verified flags');
  assert.equal(new Set(available).size,available.length,name+' no duplicate technology');
  assert.ok(available.includes('d'),'Devotion is universal in the represented base roster');
  assert.ok(!available.includes('f')||available.includes('d'),'Faith never lacks its prerequisite');
 }
 assert.equal(EXPECTED.Franks.includes('r'),false,'Franks lack Redemption');
 assert.equal(EXPECTED.Saracens,'dfhrasvbitm','Saracens have all eleven monastery technologies');
 assert.equal(EXPECTED.Magyars.includes('f'),false,'Magyars lack Faith in source data');
});

test('shared catalogue and authenticated menu omit unavailable Monastery technologies for each kingdom',()=>{
 const c=fixture();
 for(const [i,[name,permitted]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.tech[0]={};S.age[0]=3;monasteries[0].rs=null;monasteries[0].q=[]');
  assert.equal(c('CIV[S.civ[0]].n'),name);
  const catalogue=JSON.parse(c('JSON.stringify(rsOf(monasteries[0]))'));
  const menu=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,monasteries[0]))'));
  for(const [tech,flag] of Object.entries(TECHS)){
   assert.equal(catalogue.includes(tech),permitted.includes(flag),name+' '+tech+' catalogue');
   assert.equal(menu.some(x=>x.type==='research'&&x.value===tech),permitted.includes(flag),name+' '+tech+' multiplayer menu');
  }
 }
});

test('new forbidden research cannot spend resources; allowed research remains payable and queued',()=>{
 const c=fixture();
 for(const [i,[name,available]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3');
  for(const [tech,flag] of Object.entries(TECHS)){
   c('S.tech[0]='+ (tech==='faith'?'{devotion:1}':'{}')+
     ';monasteries[0].rs=null;monasteries[0].q=[];S.res[0]={f:10000,w:10000,g:10000,s:10000}');
   const before=c('JSON.stringify(S.res[0])'),allowed=available.includes(flag);
   assert.equal(c("research(monasteries[0],'"+tech+"')"),allowed,name+' '+tech);
   assert.equal(c('monasteries[0].rs?.k||null'),allowed?tech:null,name+' queue');
   assert.equal(c('JSON.stringify(S.res[0])')===before,!allowed,name+' budget');
  }
 }
});

test('explicit network civilization arrays cannot borrow a different team Monastery tree',()=>{
 const c=fixture();
 c('S.civ=[0,8];S.tech=[{},{}];S.age=[3,3]');
 assert.equal(c("rsOf(monasteries[0]).includes('redemption')"),false);
 assert.equal(c("rsOf(monasteries[1]).includes('redemption')"),true);
 assert.equal(c("rsOf(monasteries[0],[8,0]).includes('redemption')"),true);
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,0,monasteries[0]).some(x=>x.value==='redemption')"),false);
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,1,monasteries[1]).some(x=>x.value==='redemption')"),true);
});

test('multiplayer host rejects Franks Redemption and accepts Saracen Redemption without resource leak',()=>{
 const c=fixture();
 c("S.civ=[0,8];S.tech=[{},{}];S.age=[3,3];globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 c("globalThis.packet=(sid,team,seq,id)=>({v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{type:'research',entities:[id],value:'redemption'}})");
 const before=JSON.parse(c('JSON.stringify(S.res)'));
 assert.equal(c("host.receive(packet('host',0,1,monasteries[0].netId),'host',2).ok"),true);
 assert.equal(c("host.receive(packet('guest',1,1,monasteries[1].netId),'guest',2).ok"),true);
 const applied=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(applied.some(x=>x.ok===false),'forbidden packet rejected during application');
 assert.ok(applied.some(x=>x.ok===true),'allowed packet applied');
 assert.deepEqual(JSON.parse(c('JSON.stringify(S.res[0])')),before[0]);
 assert.notDeepEqual(JSON.parse(c('JSON.stringify(S.res[1])')),before[1]);
 assert.equal(c('monasteries[0].rs'),null);
 assert.equal(c('monasteries[1].rs.k'),'redemption');
});

test('old saves retain paid, now-forbidden Monastery research already in progress',()=>{
 const c=fixture();
 c("S.civ=[0,8];monasteries[0].rs={k:'redemption',t:10};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true,'historical paid research should not invalidate a save');
 assert.equal(c("S.bs.find(b=>b.k==='monastery'&&b.t===0).rs.k"),'redemption');
 assert.equal(c("rsOf(S.bs.find(b=>b.k==='monastery'&&b.t===0)).includes('redemption')"),false);
 c("upB(S.bs.find(b=>b.k==='monastery'&&b.t===0),10)");
 assert.equal(c('S.tech[0].redemption'),1,'preexisting paid research may finish');
 assert.equal(c("research(S.bs.find(b=>b.k==='monastery'&&b.t===0),'atonement')"),false,'newly forbidden research remains forbidden');
});
