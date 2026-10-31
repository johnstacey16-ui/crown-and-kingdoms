import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
import {readBrowserSubset} from '../scripts/runtime-sources.mjs';

const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const {U,TE,B}=vm.runInNewContext(config+'\n;({U,TE,B})');
const clean=x=>JSON.parse(JSON.stringify(x));
// Data source: SiegeEngineers/aoe2techtree data/data.json
// at c4f7da961e82a8231b1ba49459949c4d6e479bc8; base Camel 329,
// Heavy Camel 330, upgrade 236. Hindustanis = game's historical "Indians".
const CAMEL_CIVS=['Mongols','Byzantines','Persians','Saracens','Turks','Indians','Ethiopians','Malians'];
const CIV_NAMES=['Franks','Britons','Mongols','Byzantines','Persians','Teutons','Celts',
 'Vikings','Saracens','Turks','Chinese','Japanese','Khmer','Indians','Spanish',
 'Italians','Slavs','Huns','Goths','Aztecs','Mayans','Incas','Ethiopians','Malians',
 'Koreans','Magyars'];

function game(){
 const {source,sandbox}=headlessGame();
 const network=readBrowserSubset(['./js/network-sync.js','./js/network-commands.js'])
  .map(({source})=>source).join('\n');
 vm.runInNewContext(source+'\n'+network+`
 seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;startArmy=0;start();snd=0;
 S.civ=[2,0];S.us=[];S.bs=[];S.nodes=[];S.rel=[];
 S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.vs.fill(1);
 S.age=[3,3];S.tech=[{},{}];
 S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));
 globalThis.our=addB(0,'stable',13,13,true);
 globalThis.enemyStable=addB(1,'stable',33,13,true);
 globalThis.evalCamel=code=>eval(code);
 `,sandbox,{timeout:15000});
 return code=>sandbox.evalCamel(code);
}

test('Camel Rider and Heavy Camel source values are reflected in real unit and tech tables',()=>{
 for(const [key,value] of Object.entries({
  hp:100,sp:1.45,dmg:6,rng:.9,cd:2,arm:0,t:22,age:2,cost:{f:55,g:60}
 }))assert.deepEqual(clean(U.camel[key]),value,'camel '+key);
 assert.deepEqual(clean(TE.hcamel.cost),{f:325,g:360});
 assert.equal(TE.hcamel.t,105);
 assert.equal(TE.hcamel.age,3);
 assert.deepEqual(clean(TE.hcamel.hpb),{camel:20});
 assert.deepEqual(clean(TE.hcamel.atkb),{camel:1});
 assert.ok(B.stable.tr.includes('camel'));
 assert.ok(B.stable.rs.includes('hcamel'));
});

test('all 26 factions source-gate Camel production and Imperial Heavy Camel research',()=>{
 const c=game();
 assert.deepEqual(JSON.parse(c('JSON.stringify(CIV.map(x=>x.n))')),CIV_NAMES);
 assert.deepEqual(JSON.parse(c('JSON.stringify(REGIONAL_UNIT_ACCESS.find(r=>r.unit==="camel").civilizations.map(i=>CIV[i].n))')),CAMEL_CIVS,
  'Stable Camel and Heavy Camel research share the one regional availability catalogue');
 for(const [i,name] of CIV_NAMES.entries()){
  const yes=CAMEL_CIVS.includes(name);
  c(`S.civ[0]=${i};S.tech[0]={};our.q=[];our.rs=null;S.res[0]={f:10000,w:10000,g:10000,s:10000}`);
  assert.equal(c("trOf(our).includes('camel')"),yes,name+' trainable');
  assert.equal(c("rsOf(our).includes('hcamel')"),yes,name+' research');
  const items=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,0,our))'));
  assert.equal(items.some(x=>x.type==='train'&&x.value==='camel'),yes,name+' multiplayer training menu');
  assert.equal(items.some(x=>x.type==='research'&&x.value==='hcamel'),yes,name+' multiplayer research menu');
  const resources=c('JSON.stringify(S.res[0])');
  assert.equal(c("train(our,'camel')"),yes,name+' direct training');
  if(yes){assert.notEqual(c('JSON.stringify(S.res[0])'),resources);c('our.q=[]')}
  else{assert.equal(c('JSON.stringify(S.res[0])'),resources);assert.equal(c('our.q.length'),0)}
  const budget=c('JSON.stringify(S.res[0])');
  assert.equal(c("research(our,'hcamel')"),yes,name+' direct research');
  if(yes){assert.equal(c('our.rs.k'),'hcamel');assert.notEqual(c('JSON.stringify(S.res[0])'),budget)}
  else{assert.equal(c('our.rs===null'),true);assert.equal(c('JSON.stringify(S.res[0])'),budget)}
 }
});

test('Camel anti-cavalry counters, Heavy Camel bonus, HP and display change on research',()=>{
 const c=game();
 c("globalThis.camel=addU(0,'camel',15.5,19.5);globalThis.knight=addU(1,'knight',19.5,19.5);globalThis.enemyCamel=addU(1,'camel',20.5,19.5);globalThis.villager=addU(1,'vil',21.5,19.5)");
 const hit=(t)=>{c(t+'.hp=1000;dmgT(camel,'+t+')');return 1000-c(t+'.hp')};
 assert.equal(c('unitSpeed(camel)'),1.45);
 assert.equal(hit('knight'),13,'6 attack plus 9 cavalry bonus minus 2 Knight melee armor');
 assert.equal(hit('enemyCamel'),11,'6 attack plus 5 against the Camel class');
 assert.equal(hit('villager'),6,'no invented extra damage to villagers');
 c('camel.hp=87');
 const id=c('camel.netId');
 const before=c('JSON.stringify(S.res[0])');
 assert.equal(c("research(our,'hcamel')"),true);
 assert.equal(c('our.rs.t'),105);
 assert.notEqual(c('JSON.stringify(S.res[0])'),before);
 c('upB(our,105)');
 assert.equal(c('S.tech[0].hcamel'),1);
 assert.equal(c('camel.hp'),107,'upgraded unit retains its existing 13 damage');
 assert.equal(c('mhp(camel)'),120);
 assert.equal(c('camel.netId'),id,'upgrade keeps entity/network identity');
 assert.equal(c('unitName("camel",0)'),'Heavy Camel Rider');
 assert.equal(hit('knight'),23,'7 attack plus 18 bonus minus 2 armor');
 assert.equal(hit('enemyCamel'),16,'7 attack plus 9 vs Camel class');
 assert.equal(hit('villager'),7);
 assert.equal(c('unitSpeed(camel)'),1.45,'Heavy Camel does not gain arbitrary movement speed');
 assert.equal(c("train(our,'camel')"),true,'upgraded camels still train from the same Stable');
 assert.equal(c('our.q[0].t'),22,'Heavy Camel shares Camel Rider train time');
});

test('multiplayer host rejects illegal Camel orders without charging Franks while Mongols can train',()=>{
 const c=game();
 c(`S.civ=[0,2];S.tech=[{},{}];
 globalThis.host=CK_SIM_SYNC.createCommandHost({
  roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,
  lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute
 });`);
 const version=c('CK_SIM_SYNC.VERSION');
 const packet=(sid,team,seq,entity,type,value)=>({v:version,sid,team,seq,frame:6,order:{type,entities:[entity],value}});
 const hostStable=c('our.netId'),guestStable=c('enemyStable.netId');
 const before=JSON.parse(c('JSON.stringify(S.res)'));
 const receipts=[];
 for(const p of [
  packet('host',0,1,hostStable,'train','camel'),
  packet('host',0,2,hostStable,'research','hcamel'),
  packet('guest',1,1,guestStable,'train','camel')
 ])receipts.push(JSON.parse(c(`JSON.stringify(host.receive(${JSON.stringify(p)},'${p.sid}',2))`)));
 const result=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 // The current protocol may reject before queueing or during authoritative execution.
 assert.ok(receipts.some(r=>r.ok)||result.some(r=>r.ok),'Mongol command reaches an authenticated host');
 assert.equal(c('our.rs===null'),true,'forbidden Heavy Camel research cannot start');
 assert.deepEqual(JSON.parse(c('JSON.stringify(S.res[0])')),before[0],'Franks pay nothing for forbidden commands');
 assert.notDeepEqual(JSON.parse(c('JSON.stringify(S.res[1])')),before[1],'Mongols pay for legal Camel');
 assert.equal(c('our.q.length'),0);
 assert.equal(c('enemyStable.q[0].k'),'camel');
});

test('current-build Heavy Camel upgrades and training survive the same-version save roundtrip',()=>{
 const c=game();
 c("seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;startAge=3;startRes=3;startArmy=0;start();slot=0;S.civ[0]=2;globalThis.our=addB(0,'stable',13,13,true)");
 assert.equal(c("research(our,'hcamel')"),true);
 c('upB(our,105)');
 assert.equal(c('S.tech[0].hcamel'),1);
 assert.equal(c('saveG()'),true,'fresh current-build match must save');
 assert.equal(c('loadG()'),true,'the same version must load its own save');
 assert.equal(c('S.tech[0].hcamel'),1,'Heavy Camel researched flag survives');
 assert.equal(c("rsOf(S.bs.find(b=>b.k==='stable'&&b.t===0)).includes('hcamel')"),true,
  'research eligibility follows the restored faction');
});
