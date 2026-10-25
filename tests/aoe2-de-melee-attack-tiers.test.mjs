import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// Source: AoE2 DE 185872; SiegeEngineers/aoe2techtree
// data/data.json blob c4f7da961e82a8231b1ba49459949c4d6e479bc8.
// IDs Forging 67, Iron Casting 68, Blast Furnace 75.
// The game retains old +2/+5 atkM/atkM2 ledger flags ONLY for saved games.
const EXPECTED=Object.freeze({
  "Franks": "fib",
  "Britons": "fib",
  "Mongols": "fib",
  "Byzantines": "fi",
  "Persians": "fib",
  "Teutons": "fib",
  "Celts": "fib",
  "Vikings": "fib",
  "Saracens": "fib",
  "Turks": "fib",
  "Chinese": "fib",
  "Japanese": "fib",
  "Khmer": "fib",
  "Indians": "fib",
  "Spanish": "fib",
  "Italians": "fib",
  "Slavs": "fib",
  "Huns": "fib",
  "Goths": "fib",
  "Aztecs": "fib",
  "Mayans": "fib",
  "Incas": "fib",
  "Ethiopians": "fib",
  "Malians": "fi",
  "Koreans": "fi",
  "Magyars": "fib"
});
const KEYS=Object.freeze({forging:'f',ironCasting:'i',blastFurnace:'b'});
function fixture(){
 const {source,sandbox}=headlessGame();
 const network=['network-sync','network-commands']
  .map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 const script=[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;',
  'startAge=3;startRes=3;startArmy=0;start();snd=0;',
  'S.civ=[8,3];S.us=[];S.bs=[];S.nodes=[];S.rel=[];',
  'S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);',
  'S.ex.fill(1);S.vs.fill(1);S.age=[3,3];S.tech=[{},{}];',
  'S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));',
  "globalThis.smiths=[addB(0,'smith',12,12,true),addB(1,'smith',32,12,true)];",
  'globalThis.runTech=code=>eval(code);'
 ].join('\n');
 vm.runInNewContext(source+'\n'+network+'\n'+script,sandbox,{timeout:15000});
 return code=>sandbox.runTech(code);
}
test('all 26 DE civs use explicit three-tier melee attack availability',()=>{
 const c=fixture();
 assert.deepEqual(JSON.parse(c('JSON.stringify(CIV.map(x=>[x.n,CIV_MELEE_RESEARCH[x.n]]))')),
  Object.entries(EXPECTED));
 assert.equal(Object.keys(EXPECTED).length,26);
 assert.deepEqual(Object.keys(EXPECTED).filter(n=>!EXPECTED[n].includes('b')),
  ['Byzantines','Malians','Koreans']);
 for(const [i,[name,mask]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={}');
  assert.equal(c('CIV[S.civ[0]].n'),name);
  const list=JSON.parse(c('JSON.stringify(rsOf(smiths[0]))'));
  const menu=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,smiths[0]))'));
  for(const [k,flag] of Object.entries(KEYS)){
   const expected=mask.includes(flag);
   assert.equal(list.includes(k),expected,name+' '+k+' catalogue');
   assert.equal(menu.some(x=>x.type==='research'&&x.value===k),expected,name+' '+k+' command menu');
  }
  for(const legacy of ['atkM','atkM2']){
   assert.equal(list.includes(legacy),false,name+' retired shortcut hidden');
   assert.equal(menu.some(x=>x.value===legacy),false,name+' legacy shortcut hidden in network');
  }
 }
});
test('Forging, Iron Casting, Blast Furnace have actual costs, age, prerequisites and timings',()=>{
 const c=fixture();
 for(const [key,age,cost,duration,pre] of [
  ['forging',1,{f:150},50,null],
  ['ironCasting',2,{f:220,g:120},75,'forging'],
  ['blastFurnace',3,{f:275,g:225},100,'ironCasting']
 ]){
  const t=JSON.parse(c("JSON.stringify(TE."+key+")"));
  assert.deepEqual(t.cost,cost,key+' exact resources');
  assert.equal(t.t,duration,key+' research seconds');
  assert.equal(t.age,age,key+' minimum age');
  assert.equal(t.pre??null,pre,key+' prerequisite');
 }
});
test('new melee research cannot skip prerequisite or age; purchases use exact resources and countdown',()=>{
 const c=fixture();
 for(const [k,age,tech,ok] of [
  ['forging',0,{},false],
  ['forging',1,{},true],
  ['ironCasting',1,{forging:1},false],
  ['ironCasting',2,{},false],
  ['ironCasting',2,{forging:1},true],
  ['blastFurnace',2,{forging:1,ironCasting:1},false],
  ['blastFurnace',3,{forging:1},false],
  ['blastFurnace',3,{forging:1,ironCasting:1},true]
 ]){
  c('S.civ[0]=8;S.age[0]='+age+';S.tech[0]='+JSON.stringify(tech)+
   ';smiths[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const before=JSON.parse(c('JSON.stringify(S.res[0])'));
  assert.equal(c("research(smiths[0],'"+k+"')"),ok,k+' '+age+' '+JSON.stringify(tech));
  const after=JSON.parse(c('JSON.stringify(S.res[0])'));
  for(const res of ['f','w','g','s'])assert.equal(before[res]-after[res],
   ok?c('TE.'+k+'.cost.'+res+'||0'):0,k+' '+res+' payment');
  assert.equal(c('smiths[0].rs?.k||null'),ok?k:null,'queue state');
  if(ok){
   c('upB(smiths[0],TE.'+k+'.t-1)');
   assert.equal(c('S.tech[0].'+k+'||0'),0,k+' not complete early');
   c('upB(smiths[0],1)');
   assert.equal(c('S.tech[0].'+k),1,k+' completes on time');
  }
 }
});
test('actual melee combat uses +1, +1, +2 and does not buff ranged strikes',()=>{
 const c=fixture();
 c("S.civ=[8,0];S.tech=[{},{}];globalThis.foe=addU(1,'mil',18.5,18.5);"+
  "globalThis.melee=addU(0,'knight',25.5,18.5);globalThis.arrow=addU(0,'arc',25.5,20.5)");
 const stages=[{}, {forging:1}, {forging:1,ironCasting:1},
  {forging:1,ironCasting:1,blastFurnace:1}];
 const impact=(attacker,tech)=>{
  c('S.tech[0]='+JSON.stringify(tech)+';foe.hp=1000;dmgT('+attacker+',foe)');
  return 1000-c('foe.hp');
 };
 const melee=stages.map(t=>impact('melee',t)),range=stages.map(t=>impact('arrow',t));
 assert.deepEqual(melee.slice(1).map((v,i)=>v-melee[i]),[1,1,2],
  'Blast Furnace adds two additional damage, unlike ordinary +1 tier');
 assert.deepEqual(range,[range[0],range[0],range[0],range[0]],
  'new melee techs must not buff arrow attack');
 assert.equal(c('meleeResearchAttackBonus({forging:1,ironCasting:1,blastFurnace:1})'),4);
 assert.equal(c('meleeResearchAttackBonus({atkM:1})'),2,'legacy +2 unchanged');
 assert.equal(c('meleeResearchAttackBonus({atkM2:1,atkM:1})'),5,'legacy +5 unchanged');
 assert.equal(c('meleeResearchAttackBonus({atkM:1,forging:1,ironCasting:1,blastFurnace:1})'),5,
  'historic +2 can progress through remaining authentic research without losing attack');
});
test('old research shortcuts cannot be purchased on any civilization',()=>{
 const c=fixture();
 for(const i of [0,3,19,23,24]){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={};smiths[0].rs=null;'+
   'S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const prior=c('JSON.stringify(S.res[0])');
  for(const key of ['atkM','atkM2']){
   assert.equal(c("research(smiths[0],'"+key+"')"),false,'retired '+key+' unavailable');
   assert.equal(c('smiths[0].rs??null'),null);
   assert.equal(c('JSON.stringify(S.res[0])'),prior);
  }
 }
});
test('host enforces Blast Furnace civ availability and per-team resources',()=>{
 const c=fixture();
 c("S.civ=[3,0];S.age=[3,3];S.tech=[{forging:1,ironCasting:1},{forging:1,ironCasting:1}]");
 c("globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 c("globalThis.packet=(sid,team,seq,id)=>({v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{type:'research',entities:[id],value:'blastFurnace'}})");
 assert.equal(c("rsOf(smiths[0]).includes('blastFurnace')"),false);
 assert.equal(c("rsOf(smiths[1]).includes('blastFurnace')"),true);
 assert.equal(c("rsOf(smiths[0],[0,3]).includes('blastFurnace')"),true);
 const before=JSON.parse(c('JSON.stringify(S.res)'));
 assert.equal(c("host.receive(packet('host',0,1,smiths[0].netId),'host',2).ok"),true);
 assert.equal(c("host.receive(packet('guest',1,1,smiths[1].netId),'guest',2).ok"),true);
 const result=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(result.some(x=>x.ok===false),'Byzantines cannot source Blast Furnace');
 assert.ok(result.some(x=>x.ok===true),'Franks can source Blast Furnace');
 assert.deepEqual(JSON.parse(c('JSON.stringify(S.res[0])')),before[0]);
 assert.notDeepEqual(JSON.parse(c('JSON.stringify(S.res[1])')),before[1]);
 assert.equal(c('smiths[0].rs??null'),null);
 assert.equal(c('smiths[1].rs.k'),'blastFurnace');
});
test('save migration preserves historical +2 completed research and enables later DE tiers',()=>{
 const c=fixture();
 c("S.civ=[8,3];S.tech[0]={atkM:1};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('S.tech[0].atkM'),1);
 assert.equal(c('S.tech[0].forging'),1,'old +2 implies Forging prerequisite without repurchase');
 assert.equal(c('meleeResearchAttackBonus(S.tech[0])'),2,'unchanged legacy damage');
 assert.equal(c('rsOf(S.bs.find(b=>b.k===\'smith\'&&b.t===0)).includes(\'ironCasting\')'),true);
 const smith="S.bs.find(b=>b.k==='smith'&&b.t===0)";
 assert.equal(c("research("+smith+",'ironCasting')"),true);
 c('upB('+smith+',75)');
 assert.equal(c('meleeResearchAttackBonus(S.tech[0])'),3,'new Iron Casting adds +1');
 assert.equal(c("research("+smith+",'blastFurnace')"),true);
 c('upB('+smith+',100)');
 assert.equal(c('meleeResearchAttackBonus(S.tech[0])'),5,'Blast adds +2 while keeping old +2');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('meleeResearchAttackBonus(S.tech[0])'),5,'migrated save roundtrip remains stable');
});
test('paid historical +5 melee upgrade completes and remains +5 with entire new chain marked',()=>{
 const c=fixture();
 c("S.civ=[0,3];S.tech[0]={atkM:1};smiths[0].rs={k:'atkM2',t:9};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 const smith="S.bs.find(b=>b.k==='smith'&&b.t===0)";
 assert.equal(c(smith+'.rs.k'),'atkM2','old paid in-flight queue still valid');
 c('upB('+smith+',9)');
 for(const flag of ['forging','ironCasting','blastFurnace'])
  assert.equal(c('S.tech[0].'+flag),1,'old +5 paid upgrade completes full tier chain');
 assert.equal(c('S.tech[0].atkM2'),1,'historic +5 ledger preserved');
 assert.equal(c('meleeResearchAttackBonus(S.tech[0])'),5,'old damage unchanged');
 for(const key of ['forging','ironCasting','blastFurnace','atkM','atkM2'])
  assert.equal(c("research("+smith+",'"+key+"')"),false,'cannot repurchase old or normalized tiers');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('meleeResearchAttackBonus(S.tech[0])'),5,'old +5 saved again');
});
