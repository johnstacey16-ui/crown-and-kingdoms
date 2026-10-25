import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// AoE2:DE 185872, SiegeEngineers/aoe2techtree data/data.json
// blob c4f7da961e82a8231b1ba49459949c4d6e479bc8.
// Tech IDs: Padded 211, Leather 212, Ring 219.
// Old game faction key 'Indians' is modern Hindustanis.
const EXPECTED=Object.freeze({
  "Franks": "l",
  "Britons": "lr",
  "Mongols": "l",
  "Byzantines": "lr",
  "Persians": "lr",
  "Teutons": "lr",
  "Celts": "lr",
  "Vikings": "lr",
  "Saracens": "lr",
  "Turks": "lr",
  "Chinese": "lr",
  "Japanese": "lr",
  "Khmer": "lr",
  "Indians": "lr",
  "Spanish": "lr",
  "Italians": "lr",
  "Slavs": "lr",
  "Huns": "l",
  "Goths": "lr",
  "Aztecs": "l",
  "Mayans": "lr",
  "Incas": "lr",
  "Ethiopians": "lr",
  "Malians": "lr",
  "Koreans": "lr",
  "Magyars": "lr"
});
const TECHS=Object.freeze({armR:'p',armR2:'l',armR3:'r'});
function fixture(){
 const {source,sandbox}=headlessGame();
 const network=['network-sync','network-commands']
  .map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 const script=[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;',
  'startAge=3;startRes=3;startArmy=0;start();snd=0;',
  'S.civ=[8,17];S.us=[];S.bs=[];S.nodes=[];S.rel=[];',
  'S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);',
  'S.ex.fill(1);S.vs.fill(1);S.age=[3,3];S.tech=[{},{}];',
  'S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));',
  "globalThis.smiths=[addB(0,'smith',12,12,true),addB(1,'smith',32,12,true)];",
  'globalThis.tryTech=code=>eval(code);'
 ].join('\n');
 vm.runInNewContext(source+'\n'+network+'\n'+script,sandbox,{timeout:15000});
 return code=>sandbox.tryTech(code);
}
test('pinned 26-civilization ranged armour tree gates Ring while retaining Padded and Leather',()=>{
 const c=fixture(),actual=JSON.parse(c('JSON.stringify(CIV.map(x=>[x.n,CIV_ARCHER_ARMOR_RESEARCH[x.n]]))'));
 assert.deepEqual(actual,Object.entries(EXPECTED),'no omitted civilizations or silent eligibility default');
 assert.equal(Object.keys(EXPECTED).length,26);
 assert.deepEqual(Object.keys(EXPECTED).filter(n=>!EXPECTED[n].includes('r')),
  ['Franks','Mongols','Huns','Aztecs']);
 for(const [i,[civ,mask]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={}');
  assert.equal(c('CIV[S.civ[0]].n'),civ);
  const listed=JSON.parse(c('JSON.stringify(rsOf(smiths[0]))'));
  const options=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,smiths[0]))'));
  for(const [key,flag] of Object.entries(TECHS)){
   const allowed=flag==='p'||mask.includes(flag);
   assert.equal(listed.includes(key),allowed,civ+' '+key+' catalogue');
   assert.equal(options.some(x=>x.type==='research'&&x.value===key),allowed,
    civ+' '+key+' authenticated options');
  }
 }
});
test('the ranged tiers have verified DE costs, ages, durations and prerequisite chain',()=>{
 const c=fixture();
 for(const [key,age,cost,time,pre] of [
  ['armR',1,{f:100},40,null],
  ['armR2',2,{f:150,g:150},55,'armR'],
  ['armR3',3,{f:250,g:250},70,'armR2']
 ]){
  const d=JSON.parse(c("JSON.stringify(TE['"+key+"'])"));
  assert.equal(d.age,age,key+' age');
  assert.deepEqual(d.cost,cost,key+' exact resources');
  assert.equal(d.t,time,key+' timer');
  assert.equal(d.pre??null,pre,key+' predecessor');
 }
});
test('research cannot skip an age or predecessor, and only charges for valid orders',()=>{
 const c=fixture();
 const scenarios=[
  ['armR2',1,{armR:1},false],
  ['armR2',2,{},false],
  ['armR2',2,{armR:1},true],
  ['armR3',2,{armR:1,armR2:1},false],
  ['armR3',3,{armR:1},false],
  ['armR3',3,{armR:1,armR2:1},true]
 ];
 for(const [key,age,tech,ok] of scenarios){
  c('S.civ[0]=8;S.age[0]='+age+';S.tech[0]='+JSON.stringify(tech)+
   ';smiths[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const prior=JSON.parse(c('JSON.stringify(S.res[0])'));
  assert.equal(c("research(smiths[0],'"+key+"')"),ok,key+' at age '+age);
  const later=JSON.parse(c('JSON.stringify(S.res[0])'));
  for(const res of ['f','w','g','s']){
   const spent=prior[res]-later[res];
   assert.equal(spent,ok?c("TE."+key+".cost."+res+"||0"):0,key+' '+res+' charge');
  }
  if(ok){
   const timer=c("TE."+key+".t");
   c('upB(smiths[0],'+(timer-1)+')');
   assert.equal(c('S.tech[0].'+key+'||0'),0,key+' does not finish early');
   c('upB(smiths[0],1)');
   assert.equal(c('S.tech[0].'+key),1,key+' completed at pinned time');
   assert.equal(c('smiths[0].rs??null'),null);
  }else assert.equal(c('smiths[0].rs??null'),null,'blocked research not queued');
 }
});
test('all 26 civilizations are charged exactly once for allowed Ring, never for denied Ring',()=>{
 const c=fixture();
 for(const [i,[civ,mask]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={armR:1,armR2:1};'+
   'smiths[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const previous=c('JSON.stringify(S.res[0])'),permitted=mask.includes('r');
  assert.equal(c("research(smiths[0],'armR3')"),permitted,civ+' Ring');
  assert.equal(c('smiths[0].rs?.k||null'),permitted?'armR3':null,civ+' queue');
  assert.equal(c('JSON.stringify(S.res[0])')===previous,!permitted,civ+' budget');
 }
});
test('real combat applies each ranged tier and the final extra pierce armor only to ranged class',()=>{
 const c=fixture();
 c("S.civ=[8,0];S.tech=[{},{}];globalThis.archer=addU(0,'arc',18.5,18.5);"+
   "globalThis.melee=addU(1,'knight',25.5,18.5);globalThis.pierce=addU(1,'hcan',25.5,20.5)");
 const stages=[{}, {armR:1}, {armR:1,armR2:1}, {armR:1,armR2:1,armR3:1}];
 const impact=(attacker,target,tech)=>{
  c('S.tech[0]='+JSON.stringify(tech)+';'+target+'.hp=1000;dmgT('+attacker+','+target+')');
  return 1000-c(target+'.hp');
 };
 const physical=stages.map(t=>impact('melee','archer',t));
 const arrows=stages.map(t=>impact('pierce','archer',t));
 assert.deepEqual(physical.slice(1).map((damage,i)=>physical[i]-damage),[1,1,1],
  'each tier adds one melee resistance point');
 assert.deepEqual(arrows.slice(1).map((damage,i)=>arrows[i]-damage),[1,1,2],
  'Ring Archer Armour gives two extra pierce resistance points');
 c("globalThis.infantry=addU(0,'mil',18.5,28.5);globalThis.horse=addU(0,'scout',19.5,28.5)");
 for(const target of ['infantry','horse']){
  assert.equal(impact('melee',target,{}),impact('melee',target,{armR:1,armR2:1,armR3:1}),
   'ranged armour does not protect '+target);
 }
 assert.equal(impact('melee','archer',{armR:1}),physical[1],
  'old save containing only armR keeps its original protection');
});
test('host applies Ring only for a permitted researching kingdom',()=>{
 const c=fixture();
 c("S.civ=[17,8];S.age=[3,3];S.tech=[{armR:1,armR2:1},{armR:1,armR2:1}];");
 assert.equal(c("rsOf(smiths[0]).includes('armR3')"),false);
 assert.equal(c("rsOf(smiths[1]).includes('armR3')"),true);
 assert.equal(c("rsOf(smiths[0],[8,17]).includes('armR3')"),true);
 c("globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 c("globalThis.packet=(sid,team,seq,id)=>({v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{type:'research',entities:[id],value:'armR3'}})");
 const budget=JSON.parse(c('JSON.stringify(S.res)'));
 assert.equal(c("host.receive(packet('host',0,1,smiths[0].netId),'host',2).ok"),true);
 assert.equal(c("host.receive(packet('guest',1,1,smiths[1].netId),'guest',2).ok"),true);
 const applied=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(applied.some(x=>x.ok===false),'Huns Ring blocked');
 assert.ok(applied.some(x=>x.ok===true),'Saracens Ring accepted');
 assert.deepEqual(JSON.parse(c('JSON.stringify(S.res[0])')),budget[0]);
 assert.notDeepEqual(JSON.parse(c('JSON.stringify(S.res[1])')),budget[1]);
 assert.equal(c('smiths[0].rs??null'),null);
 assert.equal(c('smiths[1].rs.k'),'armR3');
});
test('legacy paid forbidden Ring survives save/load and completed tiers remain persistent',()=>{
 const c=fixture();
 c("S.civ=[17,8];S.tech[0]={armR:1,armR2:1};smiths[0].rs={k:'armR3',t:10};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 const smith="S.bs.find(b=>b.k==='smith'&&b.t===0)";
 assert.equal(c(smith+'.rs.k'),'armR3','previously paid Ring was preserved');
 assert.equal(c('S.tech[0].armR2'),1);
 assert.equal(c('rsOf('+smith+").includes('armR3')"),false);
 c('upB('+smith+',10)');
 assert.equal(c('S.tech[0].armR3'),1,'paid upgrade completes');
 assert.equal(c("research("+smith+",'armR3')"),false,'no new forbidden purchase');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('S.tech[0].armR3'),1,'completed upgrades persist');
});
