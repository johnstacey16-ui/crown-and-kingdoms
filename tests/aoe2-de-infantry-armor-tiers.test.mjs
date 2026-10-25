import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// AoE2: DE 185872, SiegeEngineers/aoe2techtree data/data.json
// c4f7da961e82a8231b1ba49459949c4d6e479bc8:
// Scale Mail 74 (universal), Chain Mail 76, Plate Mail 77.
// Legacy C&K "Indians" is modern Hindustanis.
const EXPECTED=Object.freeze({
  "Franks": "cp",
  "Britons": "cp",
  "Mongols": "cp",
  "Byzantines": "cp",
  "Persians": "cp",
  "Teutons": "cp",
  "Celts": "cp",
  "Vikings": "cp",
  "Saracens": "cp",
  "Turks": "cp",
  "Chinese": "cp",
  "Japanese": "cp",
  "Khmer": "c",
  "Indians": "c",
  "Spanish": "cp",
  "Italians": "cp",
  "Slavs": "cp",
  "Huns": "c",
  "Goths": "c",
  "Aztecs": "cp",
  "Mayans": "cp",
  "Incas": "cp",
  "Ethiopians": "cp",
  "Malians": "cp",
  "Koreans": "cp",
  "Magyars": "c"
});
function fixture(){
 const {source,sandbox}=headlessGame();
 const network=['network-sync','network-commands']
   .map(n=>readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 const script=[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;',
  'startAge=3;startRes=3;startArmy=0;start();snd=0;',
  'S.civ=[8,17];S.us=[];S.bs=[];S.rel=[];S.nodes=[];',
  'S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);',
  'S.ex.fill(1);S.vs.fill(1);S.age=[3,3];S.tech=[{},{}];',
  'S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));',
  "globalThis.smiths=[addB(0,'smith',12,12,true),addB(1,'smith',32,12,true)];",
  'globalThis.tryTech=code=>eval(code);'
 ].join('\n');
 vm.runInNewContext(source+'\n'+network+'\n'+script,sandbox,{timeout:15000});
 return code=>sandbox.tryTech(code);
}
test('all 26 source-pinned infantry armour trees preserve Scale and Chain, gate Plate Mail',()=>{
 const c=fixture();
 assert.deepEqual(JSON.parse(c('JSON.stringify(CIV.map(v=>[v.n,CIV_INFANTRY_ARMOR_RESEARCH[v.n]]))')),
  Object.entries(EXPECTED),'exactly the pinned per-civilization tech matrix');
 assert.equal(Object.keys(EXPECTED).length,26);
 assert.equal(Object.entries(EXPECTED).filter(([,flags])=>!flags.includes('p')).length,5);
 for(const [i,[name,flags]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={}');
  assert.equal(c('CIV[S.civ[0]].n'),name);
  const catalogue=JSON.parse(c('JSON.stringify(rsOf(smiths[0]))'));
  const menu=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,smiths[0]))'));
  for(const [key,allow] of [['armI',true],['armI2',flags.includes('c')],['armI3',flags.includes('p')]]){
   assert.equal(catalogue.includes(key),allow,name+' '+key+' research catalogue');
   assert.equal(menu.some(o=>o.type==='research'&&o.value===key),allow,name+' '+key+' network menu');
  }
 }
});
test('new tiers have independent correct research ages, exact costs, times and chain',()=>{
 const c=fixture();
 const expected=[
  ['armI',1,{f:100},40,null],
  ['armI2',2,{f:200,g:100},55,'armI'],
  ['armI3',3,{f:300,g:150},70,'armI2']
 ];
 for(const [k,age,cost,time,pre] of expected){
  const def=JSON.parse(c("JSON.stringify(TE['"+k+"'])"));
  assert.equal(def.age,age,k+' minimum age');
  assert.deepEqual(def.cost,cost,k+' resource cost');
  assert.equal(def.t,time,k+' research duration');
  assert.equal(def.pre??null,pre,k+' prerequisite');
 }
 const tryOne=(k,age,tech,success)=>{
  c('S.age[0]='+age+';S.tech[0]='+JSON.stringify(tech)+
   ';smiths[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const before=JSON.parse(c('JSON.stringify(S.res[0])'));
  assert.equal(c("research(smiths[0],'"+k+"')"),success,k+' age '+age+' prerequisites '+JSON.stringify(tech));
  const after=JSON.parse(c('JSON.stringify(S.res[0])'));
  for(const res of ['f','g','w','s'])assert.equal(before[res]-after[res],success?(c("TE."+k+".cost."+res+"||0")):0,k+' '+res);
  if(success){
   const time=c("TE."+k+".t");
   c('upB(smiths[0],'+(time-1)+')');
   assert.equal(c("S.tech[0]."+k+"||0"),0,k+' does not complete early');
   c('upB(smiths[0],1)');
   assert.equal(c("S.tech[0]."+k),1,k+' applies at source time');
   assert.equal(c("smiths[0].rs??null"),null,'queue cleared');
  }
 };
 tryOne('armI2',1,{armI:1},false);
 tryOne('armI2',2,{},false);
 tryOne('armI2',2,{armI:1},true);
 tryOne('armI3',2,{armI:1,armI2:1},false);
 tryOne('armI3',3,{armI:1},false);
 tryOne('armI3',3,{armI:1,armI2:1},true);
});
test('non-Plate civilizations may buy Chain but cannot spend resources on Plate',()=>{
 const c=fixture();
 for(const [i,[name,flags]] of Object.entries(EXPECTED).entries()){
  c('S.civ[0]='+i+';S.age[0]=3;S.tech[0]={armI:1,armI2:1};smiths[0].rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}');
  const balance=c('JSON.stringify(S.res[0])');
  const eligible=flags.includes('p');
  assert.equal(c("research(smiths[0],'armI3')"),eligible,name+' final infantry armour');
  assert.equal(c('smiths[0].rs?.k||null'),eligible?'armI3':null,name+' research queue');
  assert.equal(c('JSON.stringify(S.res[0])')===balance,!eligible,name+' blocked plate must not charge');
 }
});
test('the live combat engine stacks the three tiers and gives Plate +1 melee, +2 pierce',()=>{
 const c=fixture();
 c("S.civ=[8,0];S.tech=[{},{}];globalThis.infantry=addU(0,'mil',18.5,18.5);globalThis.knight=addU(1,'knight',25.5,18.5);globalThis.gunner=addU(1,'hcan',25.5,20.5);");
 const dmg=(attacker,mods)=>{
  c("S.tech[0]="+JSON.stringify(mods)+";infantry.hp=1000;dmgT("+attacker+",infantry)");
  return 1000-c('infantry.hp');
 };
 const stages=[{}, {armI:1}, {armI:1,armI2:1}, {armI:1,armI2:1,armI3:1}];
 const melee=stages.map(t=>dmg('knight',t)),pierce=stages.map(t=>dmg('gunner',t));
 assert.deepEqual(melee.slice(1).map((v,i)=>melee[i]-v),[1,1,1],
  'each tier reduces melee damage by 1 on a live infantry unit');
 assert.deepEqual(pierce.slice(1).map((v,i)=>pierce[i]-v),[1,1,2],
  'Plate Mail protects against two additional pierce damage, not one');
 c("globalThis.mounted=addU(0,'scout',18.5,28.5);globalThis.ranged=addU(0,'arc',19.5,28.5)");
 const crossCheck=(kind,stage)=>{
  c("S.tech[0]="+JSON.stringify(stage)+";"+kind+".hp=1000;dmgT(knight,"+kind+")");
  return 1000-c(kind+'.hp');
 };
 for(const kind of ['mounted','ranged']){
  assert.equal(crossCheck(kind,{}),crossCheck(kind,{armI:1,armI2:1,armI3:1}),
   'infantry armor cannot buff '+kind);
 }
 assert.equal(dmg('knight',{armI:1}),melee[1],
  'historical save with just first armour retains identical current effect');
});
test('teams and authenticated host never borrow another civilization Plate Mail access',()=>{
 const c=fixture();
 c("S.civ=[17,0];S.age=[3,3];S.tech=[{armI:1,armI2:1},{armI:1,armI2:1}];");
 assert.equal(c("rsOf(smiths[0]).includes('armI3')"),false);
 assert.equal(c("rsOf(smiths[1]).includes('armI3')"),true);
 assert.equal(c("rsOf(smiths[0],[0,17]).includes('armI3')"),true);
 c("globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 c("globalThis.packet=(sid,team,seq,id)=>({v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{type:'research',entities:[id],value:'armI3'}})");
 const before=JSON.parse(c('JSON.stringify(S.res)'));
 assert.equal(c("host.receive(packet('host',0,1,smiths[0].netId),'host',2).ok"),true);
 assert.equal(c("host.receive(packet('guest',1,1,smiths[1].netId),'guest',2).ok"),true);
 const applied=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(applied.some(x=>x.ok===false),'Huns Plate Mail command is rejected');
 assert.ok(applied.some(x=>x.ok===true),'Franks Plate Mail command is accepted');
 assert.deepEqual(JSON.parse(c('JSON.stringify(S.res[0])')),before[0]);
 assert.notDeepEqual(JSON.parse(c('JSON.stringify(S.res[1])')),before[1]);
 assert.equal(c('smiths[0].rs??null'),null);
 assert.equal(c('smiths[1].rs.k'),'armI3');
});
test('save/load retains all completed tiers and previously paid forbidden research in flight',()=>{
 const c=fixture();
 c("S.civ=[17,0];S.tech[0]={armI:1,armI2:1};smiths[0].rs={k:'armI3',t:10};slot=0");
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c("S.tech[0].armI"),1);
 assert.equal(c("S.tech[0].armI2"),1);
 const smith="S.bs.find(b=>b.k==='smith'&&b.t===0)";
 assert.equal(c(smith+'.rs.k'),'armI3','paid research was not discarded');
 assert.equal(c('rsOf('+smith+").includes('armI3')"),false,'new Plate attempts still forbidden');
 c('upB('+smith+',10)');
 assert.equal(c('S.tech[0].armI3'),1,'legacy paid research may finish');
 assert.equal(c("research("+smith+",'armI3')"),false,'cannot charge for forbidden second attempt');
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('S.tech[0].armI3'),1,'completed historical tier persists');
});
