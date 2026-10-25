import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// Source: AoE2 DE 185872, SiegeEngineers/aoe2techtree data/data.json
// blob c4f7da961e82a8231b1ba49459949c4d6e479bc8.
// DE technology IDs: Scale Barding 81; Chain Barding 82; Plate Barding 80.
// Historical local 'Indians' means the Hindustanis technology tree.
const EXPECTED=Object.freeze({
  "Franks": "cp",
  "Britons": "cp",
  "Mongols": "c",
  "Byzantines": "cp",
  "Persians": "cp",
  "Teutons": "cp",
  "Celts": "c",
  "Vikings": "c",
  "Saracens": "cp",
  "Turks": "cp",
  "Chinese": "cp",
  "Japanese": "c",
  "Khmer": "cp",
  "Indians": "cp",
  "Spanish": "cp",
  "Italians": "cp",
  "Slavs": "cp",
  "Huns": "cp",
  "Goths": "c",
  "Aztecs": "",
  "Mayans": "",
  "Incas": "",
  "Ethiopians": "c",
  "Malians": "cp",
  "Koreans": "c",
  "Magyars": "cp"
});
const BADGE_KEYS=Object.freeze({armC:'s',armC2:'c',armC3:'p'});
function fixture(){
 const {source,sandbox}=headlessGame();
 const network=['network-sync','network-commands']
  .map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 const init=[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;',
  'startAge=3;startRes=3;startArmy=0;start();snd=0;',
  'S.civ=[8,2];S.us=[];S.bs=[];S.nodes=[];S.rel=[];',
  'S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);',
  'S.ex.fill(1);S.vs.fill(1);S.age=[3,3];S.tech=[{},{}];',
  'S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));',
  "globalThis.smiths=[addB(0,'smith',12,12,true),addB(1,'smith',32,12,true)];",
  'globalThis.evalBarding=code=>eval(code);'
 ].join('\n');
 vm.runInNewContext(source+'\n'+network+'\n'+init,sandbox,{timeout:15000});
 return code=>sandbox.evalBarding(code);
}
test('26 DE civilization technology trees expose only their source-supported Scale, Chain and Plate Barding',()=>{
 const c=fixture();
 assert.deepEqual(JSON.parse(c('JSON.stringify(CIV.map(x=>[x.n,CIV_CAVALRY_ARMOR_RESEARCH[x.n]]))')),
  Object.entries(EXPECTED),'complete 26-civ source access');
 assert.equal(Object.keys(EXPECTED).length,26);
 assert.deepEqual(Object.keys(EXPECTED).filter(n=>!EXPECTED[n]),
  ['Aztecs','Mayans','Incas'],'American civs cannot research any cavalry barding');
 assert.deepEqual(Object.keys(EXPECTED).filter(n=>EXPECTED[n]==='c'),
  ['Mongols','Celts','Vikings','Japanese','Goths','Ethiopians','Koreans'],
  'exact seven non-American civilizations lose Plate Barding');
 for(const [i,[civ,mask]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={}');
  assert.equal(c('CIV[S.civ[0]].n'),civ);
  const list=JSON.parse(c('JSON.stringify(rsOf(smiths[0]))'));
  const menu=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,smiths[0]))'));
  for(const [key,flag] of Object.entries(BADGE_KEYS)){
   const available=flag==='s'?mask!=='':mask.includes(flag);
   assert.equal(list.includes(key),available,civ+' '+key+' catalogue');
   assert.equal(menu.some(x=>x.type==='research'&&x.value===key),available,
    civ+' '+key+' multiplayer menu');
  }
 }
});
test('Scale, Chain and Plate Barding have exact independent ages, costs, times and dependencies',()=>{
 const c=fixture();
 for(const [key,age,cost,time,pre] of [
  ['armC',1,{f:150},45,null],
  ['armC2',2,{f:250,g:150},60,'armC'],
  ['armC3',3,{f:350,g:200},75,'armC2']
 ]){
  const tech=JSON.parse(c("JSON.stringify(TE['"+key+"'])"));
  assert.equal(tech.age,age,key+' source age');
  assert.deepEqual(tech.cost,cost,key+' source cost');
  assert.equal(tech.t,time,key+' research time');
  assert.equal(tech.pre??null,pre,key+' prerequisite');
 }
});
test('normal research respects prerequisite, age, exact spend and completion timer',()=>{
 const c=fixture();
 const cases=[
  ['armC2',1,{armC:1},false],
  ['armC2',2,{},false],
  ['armC2',2,{armC:1},true],
  ['armC3',2,{armC:1,armC2:1},false],
  ['armC3',3,{armC:1},false],
  ['armC3',3,{armC:1,armC2:1},true]
 ];
 for(const [key,age,tech,success] of cases){
  c('S.civ[0]=8;S.age[0]='+age+';S.tech[0]='+JSON.stringify(tech)+
   ';smiths[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const prior=JSON.parse(c('JSON.stringify(S.res[0])'));
  assert.equal(c("research(smiths[0],'"+key+"')"),success,key+' at age '+age);
  const after=JSON.parse(c('JSON.stringify(S.res[0])'));
  for(const res of ['f','w','g','s'])assert.equal(prior[res]-after[res],
   success?c("TE."+key+".cost."+res+"||0"):0,key+' '+res+' cost');
  assert.equal(c('smiths[0].rs?.k||null'),success?key:null,key+' queue');
  if(success){
   const duration=c('TE.'+key+'.t');
   c('upB(smiths[0],'+(duration-1)+')');
   assert.equal(c("S.tech[0]."+key+"||0"),0,key+' not early');
   c('upB(smiths[0],1)');
   assert.equal(c('S.tech[0].'+key),1,key+' finished on schedule');
   assert.equal(c('smiths[0].rs??null'),null);
  }
 }
});
test('Plate Barding is rejected without charging for all restricted civs',()=>{
 const c=fixture();
 for(const [i,[name,mask]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={armC:1,armC2:1};'+
   'smiths[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const before=c('JSON.stringify(S.res[0])'),ok=mask.includes('p');
  assert.equal(c("research(smiths[0],'armC3')"),ok,name+' can buy Plate');
  assert.equal(c('smiths[0].rs?.k||null'),ok?'armC3':null,name+' queue');
  assert.equal(c('JSON.stringify(S.res[0])')===before,!ok,name+' budget');
 }
 // Forbidden civilizations cannot buy even Scale or Chain with forged prerequisites.
 for(const i of [19,20,21]){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={armC:1};'+
   'smiths[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const before=c('JSON.stringify(S.res[0])');
  assert.equal(c("research(smiths[0],'armC2')"),false,'American civ Chain unavailable');
  assert.equal(c('JSON.stringify(S.res[0])'),before,'no cost on forbidden Chain');
  c('S.tech[0]={}');
  assert.equal(c("research(smiths[0],'armC')"),false,'American civ Scale unavailable');
  assert.equal(c('JSON.stringify(S.res[0])'),before,'no cost on forbidden Scale');
 }
});
test('live cavalry combat stacks +1/+1, +1/+1, +1/+2 and leaves infantry/archers unchanged',()=>{
 const c=fixture();
 c("S.civ=[8,0];S.tech=[{},{}];globalThis.horse=addU(0,'knight',18.5,18.5);"+
   "globalThis.melee=addU(1,'knight',25.5,18.5);globalThis.pierce=addU(1,'hcan',25.5,20.5)");
 const stages=[{},{armC:1},{armC:1,armC2:1},{armC:1,armC2:1,armC3:1}];
 const impact=(attacker,target,tech)=>{
  c('S.tech[0]='+JSON.stringify(tech)+';'+target+'.hp=1000;dmgT('+attacker+','+target+')');
  return 1000-c(target+'.hp');
 };
 const melee=stages.map(t=>impact('melee','horse',t));
 const pierce=stages.map(t=>impact('pierce','horse',t));
 assert.deepEqual(melee.slice(1).map((damage,i)=>melee[i]-damage),[1,1,1],
  'all three tiers give cavalry +1 melee armor each');
 assert.deepEqual(pierce.slice(1).map((damage,i)=>pierce[i]-damage),[1,1,2],
  'Plate Barding gives cavalry +2 pierce armor, not +1');
 c("globalThis.infantry=addU(0,'mil',18.5,28.5);globalThis.archer=addU(0,'arc',19.5,28.5)");
 for(const target of ['infantry','archer']){
  assert.equal(impact('melee',target,{}),impact('melee',target,{armC:1,armC2:1,armC3:1}),
   target+' must not receive cavalry armor');
 }
 assert.equal(impact('melee','horse',{armC:1}),melee[1],
  'existing first-tier-only saves preserve old armor effect');
});
test('host enforces each team tree and cannot charge a forbidden Plate request',()=>{
 const c=fixture();
 c('S.civ=[2,0];S.age=[3,3];S.tech=[{armC:1,armC2:1},{armC:1,armC2:1}]');
 assert.equal(c("rsOf(smiths[0]).includes('armC3')"),false,'Mongols lack Plate');
 assert.equal(c("rsOf(smiths[1]).includes('armC3')"),true,'Franks have Plate');
 assert.equal(c("rsOf(smiths[0],[0,2]).includes('armC3')"),true,
  'explicit replacement civ array affects only this inquiry');
 c("globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 c("globalThis.packet=(sid,team,seq,id)=>({v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{type:'research',entities:[id],value:'armC3'}})");
 const before=JSON.parse(c('JSON.stringify(S.res)'));
 assert.equal(c("host.receive(packet('host',0,1,smiths[0].netId),'host',2).ok"),true);
 assert.equal(c("host.receive(packet('guest',1,1,smiths[1].netId),'guest',2).ok"),true);
 const result=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(result.some(x=>x.ok===false),'invalid Mongol Plate command rejected');
 assert.ok(result.some(x=>x.ok===true),'valid Frank Plate command accepted');
 assert.deepEqual(JSON.parse(c('JSON.stringify(S.res[0])')),before[0]);
 assert.notDeepEqual(JSON.parse(c('JSON.stringify(S.res[1])')),before[1]);
 assert.equal(c('smiths[0].rs??null'),null);
 assert.equal(c('smiths[1].rs.k'),'armC3');
});
test('legacy paid forbidden cavalry upgrade and completed research survive save/load',()=>{
 const c=fixture();
 c("S.civ=[2,0];S.tech[0]={armC:1,armC2:1};smiths[0].rs={k:'armC3',t:10};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 const smith="S.bs.find(b=>b.k==='smith'&&b.t===0)";
 assert.equal(c('S.tech[0].armC'),1);
 assert.equal(c('S.tech[0].armC2'),1);
 assert.equal(c(smith+'.rs.k'),'armC3','paid in-flight Plate not discarded');
 assert.equal(c('rsOf('+smith+").includes('armC3')"),false,'no new Mongol Plate purchases');
 c('upB('+smith+',10)');
 assert.equal(c('S.tech[0].armC3'),1,'paid upgrade finishes');
 assert.equal(c("research("+smith+",'armC3')"),false,'no duplicate or forbidden spending');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('S.tech[0].armC3'),1,'finished researched tier persists');
});
