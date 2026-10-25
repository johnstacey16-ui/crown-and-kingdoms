import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

// Spanish bonus: Blacksmith technologies cost no gold.
// Primary source: https://www.forgottenempires.net/age-of-empires-ii-definitive-edition/civilizations/spanish
// Game DE reference build 185872; keeps all source technology definitions unchanged.
function fixture(){
 const {source,sandbox}=headlessGame();
 const net=['network-sync','network-commands'].map(n=>
  readFileSync(new URL('../js/'+n+'.js',import.meta.url),'utf8')).join('\n');
 const init=[
  'seedOv=123456;msz=0;kingdoms=2;cmp=null;gameMode=0;',
  'startAge=3;startRes=3;startArmy=0;start();snd=0;',
  'S.civ=[14,0];S.us=[];S.bs=[];S.nodes=[];S.rel=[];',
  'S.nd.fill(null);S.g.fill(0);S.gt.fill(0);S.wt.fill(0);',
  'S.ex.fill(1);S.vs.fill(1);S.age=[3,3];S.tech=[{},{}];',
  'S.res=S.res.map(()=>({f:10000,w:10000,g:10000,s:10000}));',
  "globalThis.smiths=[addB(0,'smith',12,12,true),addB(1,'smith',32,12,true)];",
  'globalThis.evalDiscount=code=>eval(code);'
 ].join('\n');
 vm.runInNewContext(source+'\n'+net+'\n'+init,sandbox,{timeout:15000});
 return code=>sandbox.evalDiscount(code);
}
test('Spanish discount zeros only Blacksmith gold in all 26 civilization variants and leaves TE immutable',()=>{
 const c=fixture();
 const keys=JSON.parse(c('JSON.stringify(B.smith.rs)'));
 assert.ok(keys.includes('ironCasting')&&keys.includes('blastFurnace')&&keys.includes('armC3')&&keys.includes('armR3'));
 const original=c('JSON.stringify(TE)');
 for(let i=0;i<26;i++){
  c('S.civ[0]='+i);
  const spanish=c('CIV[S.civ[0]].n')==='Spanish';
  for(const key of keys){
   const raw=JSON.parse(c("JSON.stringify(TE['"+key+"'].cost)"));
   const displayed=JSON.parse(c("JSON.stringify(researchCost(smiths[0],'"+key+"'))"));
   assert.deepEqual(displayed,{...raw,...(spanish&&raw.g?{g:0}:{})},
    'team '+i+' '+key+' discount only if Spanish');
  }
 }
 assert.equal(c('JSON.stringify(TE)'),original,'no global tech catalogue mutation or cross-team leak');
});
test('shared multiplayer option prices honor per-team Spanish status, never other teams',()=>{
 const c=fixture();
 for(const team of [0,1]){
  const options=JSON.parse(c('JSON.stringify(CK_GAME_COMMANDS.buildingOptions(S,'+team+',smiths['+team+']))'));
  const iron=options.find(x=>x.type==='research'&&x.value==='ironCasting');
  const plate=options.find(x=>x.type==='research'&&x.value==='armC3');
  assert.ok(iron&&plate);
  assert.equal(iron.cost.f,220);
  assert.equal(iron.cost.g,team===0?0:120,'Iron Casting source discount');
  assert.equal(plate.cost.f,350);
  assert.equal(plate.cost.g,team===0?0:200,'Plate Barding source discount');
 }
 c('S.civ=[0,14]');
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,0,smiths[0]).find(x=>x.value==='ironCasting').cost.g"),120);
 assert.equal(c("CK_GAME_COMMANDS.buildingOptions(S,1,smiths[1]).find(x=>x.value==='ironCasting').cost.g"),0);
 assert.equal(c("researchCost(smiths[0],'ironCasting',[14,0]).g"),0,
  'explicit civ array may be used by network menus without modifying global teams');
});
test('real Spanish research succeeds with zero gold, charges only food, and finishes at correct time',()=>{
 const c=fixture();
 c('S.civ=[14,0];S.age=[2,2];S.tech=[{forging:1},{forging:1}];S.res=[{f:400,w:0,g:0,s:0},{f:400,w:0,g:0,s:0}]');
 assert.equal(c("research(smiths[0],'ironCasting')"),true,'Spanish can purchase without gold');
 assert.equal(c('S.res[0].f'),180);
 assert.equal(c('S.res[0].g'),0);
 assert.equal(c('smiths[0].rs.t'),75);
 c('upB(smiths[0],74)');
 assert.equal(c('S.tech[0].ironCasting||0'),0);
 c('upB(smiths[0],1)');
 assert.equal(c('S.tech[0].ironCasting'),1);
 assert.equal(c("research(smiths[1],'ironCasting')"),false,'Franks cannot purchase without gold');
 assert.equal(c('S.res[1].f'),400,'non-Spanish rejected purchase does not charge');
 assert.equal(c('smiths[1].rs??null'),null);
});
test('Spanish other-building research keeps gold price; non-gold Blacksmith costs remain same',()=>{
 const c=fixture();
 c("globalThis.stable=addB(0,'stable',40,42,true)");
 assert.deepEqual(JSON.parse(c("JSON.stringify(researchCost(stable,'blood'))")),{f:150,g:100});
 assert.deepEqual(JSON.parse(c("JSON.stringify(researchCost(smiths[0],'forging'))")),{f:150});
 c('S.age[0]=2;S.res[0]={f:500,w:500,g:0,s:500}');
 assert.equal(c("research(stable,'blood')"),false,'Spanish Stable Bloodlines still requires gold');
 assert.equal(c('S.res[0].f'),500);
 assert.equal(c("research(smiths[0],'forging')"),true);
 assert.equal(c('S.res[0].f'),350);
});
test('authoritative host accepts Spanish gold-free research and rejects unpayable non-Spanish',()=>{
 const c=fixture();
 c('S.civ=[14,0];S.age=[2,2];S.tech=[{forging:1},{forging:1}];S.res=[{f:500,w:0,g:0,s:0},{f:500,w:0,g:0,s:0}]');
 c("globalThis.host=CK_SIM_SYNC.createCommandHost({roster:CK_SIM_SYNC.lockRoster('host','guest',2),mapSize:W,lookupEntity:CK_GAME_COMMANDS.lookup,execute:CK_GAME_COMMANDS.execute})");
 c("globalThis.packet=(sid,team,seq,id)=>({v:CK_SIM_SYNC.VERSION,sid,team,seq,frame:6,order:{type:'research',entities:[id],value:'ironCasting'}})");
 assert.equal(c("host.receive(packet('host',0,1,smiths[0].netId),'host',2).ok"),true);
 assert.equal(c("host.receive(packet('guest',1,1,smiths[1].netId),'guest',2).ok"),true);
 const applied=JSON.parse(c('JSON.stringify(host.applyFrame(6))'));
 assert.ok(applied.some(x=>x.ok===true));
 assert.ok(applied.some(x=>x.ok===false));
 assert.equal(c('S.res[0].f'),280);
 assert.equal(c('S.res[0].g'),0);
 assert.equal(c('S.res[1].f'),500);
 assert.equal(c('S.res[1].g'),0);
 assert.equal(c('smiths[0].rs.k'),'ironCasting');
 assert.equal(c('smiths[1].rs??null'),null);
});
test('discounted completed research and in-flight queues persist in current-version saves',()=>{
 const c=fixture();
 c('S.civ=[14,0];S.age=[2,2];S.tech=[{forging:1},{forging:1}];S.res[0]={f:500,w:500,g:0,s:500};slot=0');
 assert.equal(c("research(smiths[0],'ironCasting')"),true);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 const b="S.bs.find(x=>x.k==='smith'&&x.t===0)";
 assert.equal(c(b+'.rs.k'),'ironCasting');
 assert.equal(c('S.res[0].g'),0);
 c('upB('+b+',75)');
 assert.equal(c('S.tech[0].ironCasting'),1);
 assert.equal(c('saveG()'),true);
 assert.equal(c('loadG()'),true);
 assert.equal(c('S.tech[0].ironCasting'),1);
 assert.equal(c('S.res[0].g'),0);
});
test('controller menu and AI research policy use shared actual research cost',()=>{
 const input=readFileSync(new URL('../js/input.js',import.meta.url),'utf8');
 const ai=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
 const net=readFileSync(new URL('../js/network-commands.js',import.meta.url),'utf8');
 assert.match(input,/it\.push\(\{l:e\.n,c:researchCost\(s,k\),lk/);
 assert.match(ai,/!can\(t,researchCost\(b,k\)\)/);
 assert.match(ai,/aiCanResearchWhileSaving\(R,researchCost\(b,k\),nextAge\.cost\)/);
 assert.match(net,/cost:\{\.\.\.researchCost\(building,key,world\.civ\)\}/);
});
