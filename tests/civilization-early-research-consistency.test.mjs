import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const hostCommands=readFileSync(new URL('../js/network-commands.js',import.meta.url),'utf8');

function game(){
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\n'+hostCommands+'\nglobalThis.earlyEval=code=>eval(code);',sandbox);
 const run=sandbox.earlyEval;
 run("seedOv=261112;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=[0,0];S.age=[2,2];S.tech=[{},{}];S.us=[];S.bs=[];S.pj=[];S.rel=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.nd.fill(null);S.res[0]={f:10000,w:10000,g:10000,s:10000};S.res[1]={f:10000,w:10000,g:10000,s:10000};globalThis.tc=addB(0,'tc',9,9,true);globalThis.bar=addB(0,'bar',18,9,true);globalThis.univ=addB(0,'univ',27,9,true);globalThis.stable=addB(0,'stable',36,9,true)");
 return run;
}
const snapshot=(run,expression)=>JSON.parse(run('JSON.stringify('+expression+')'));
const commandOption=(run,building,key)=>snapshot(run,"CK_GAME_COMMANDS.buildingOptions(S,0,"+building+").find(o=>o.type==='research'&&o.value==='"+key+"')");

test('per-civilization early research metadata drives actual research and multiplayer menu unlocks',()=>{
 const run=game();
 const scenarios=[
  {id:36,building:'univ',key:'chem',age:2,regular:3},
  {id:41,building:'bar',key:'longs',age:1,regular:2,pre:'man'},
  {id:33,building:'tc',key:'wheel',age:0,regular:1},
  {id:33,building:'stable',key:'cavl',age:2,regular:3}
 ];
 for(const {id,building,key,age,regular,pre} of scenarios){
  run("S.civ[0]="+id+";S.age[0]="+age+";S.tech[0]={"+(pre?pre+":1":"")+"};for(const b of S.bs)b.rs=null");
  assert.equal(run("researchEffectiveAge("+building+",'"+key+"')"),age);
  assert.equal(commandOption(run,building,key).locked,'',CIVLabel(id)+' early '+key+' must be offered');
  assert.equal(run("research("+building+",'"+key+"')"),true,CIVLabel(id)+' must pay and queue '+key);
  assert.equal(run(building+".rs.k"),key);
  run("for(const b of S.bs)b.rs=null;S.civ[0]=0;S.tech[0]={"+(pre?pre+":1":"")+"}");
  assert.equal(run("researchEffectiveAge("+building+",'"+key+"')"),regular);
  const foreign=commandOption(run,building,key);
  if(foreign)assert.match(foreign.locked,/Requires /,'foreign research must stay age-locked');
  assert.equal(run("research("+building+",'"+key+"')"),false,'foreign civ must not receive early '+key);
 }
});
function CIVLabel(id){return {33:'Burgundians',36:'Bohemians',41:'Armenians'}[id]}

test('host command menu respects prerequisite and copied-world research state',()=>{
 const run=game();
 run("S.civ[0]=41;S.age[0]=1;S.tech[0]={}");
 assert.match(commandOption(run,'bar','longs').locked,/Requires Man-at-Arms/);
 assert.equal(run("research(bar,'longs')"),false);
 run("S.tech[0].man=1");
 assert.equal(commandOption(run,'bar','longs').locked,'');
 const hypothetical= snapshot(run,"CK_GAME_COMMANDS.buildingOptions({...S,civ:[0,0]},0,bar).find(o=>o.value==='longs')");
 assert.match(hypothetical.locked,/Requires Castle Age/);
 assert.equal(run('S.civ[0]'),41,'read-only menu must not change the authoritative civilization');
});

test('AI researches real early Armenian and Bohemian upgrades but not the same unqualified foreign upgrades',()=>{
 const run=game();
 run("globalThis.plan=b=>aiPlanResearch(0,{my:[],vil:[],arm:[],bl:[b],tc:{rs:null},R:S.res[0],humanShips:0,composition:{humanCav:0,humanRanged:0,humanSiege:0,humanInf:0}})");
 for(const {id,building,key,age,pre} of [
  {id:41,building:'bar',key:'longs',age:1,pre:'man'},
  {id:36,building:'univ',key:'chem',age:2}
 ]){
  run("S.age[0]="+age+";S.civ[0]="+id+";S.tech[0]={"+(pre?pre+":1":"")+"};"+building+".rs=null");
  const prior=run("B."+building+".rs");
  run("B."+building+".rs=['"+key+"'];plan("+building+");B."+building+".rs="+JSON.stringify(prior));
  assert.equal(run(building+'.rs?.k'),key,'AI must queue eligible early research');
  run(building+".rs=null;S.civ[0]=0;S.tech[0]={"+(pre?pre+":1":"")+"}");
  run("B."+building+".rs=['"+key+"'];plan("+building+");B."+building+".rs="+JSON.stringify(prior));
  assert.equal(run(building+'.rs'),null,'foreign AI must keep normal age requirement');
 }
});

function uiGame(){
 const {sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(loadCoreGameSource({includeUI:true})+'\n'+hostCommands+
  '\nglobalThis.earlyEval=code=>eval(code);',sandbox);
 const run=sandbox.earlyEval;
 run("seedOv=261113;kingdoms=2;startAge=3;startRes=3;startArmy=0;start();S.civ=[0,0];S.age=[2,2];S.tech=[{},{}];S.us=[];S.bs=[];S.pj=[];S.rel=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.ex.fill(1);S.nd.fill(null);S.res[0]={f:10000,w:10000,g:10000,s:10000};S.res[1]={f:10000,w:10000,g:10000,s:10000};globalThis.tc=addB(0,'tc',9,9,true);globalThis.bar=addB(0,'bar',18,9,true);globalThis.univ=addB(0,'univ',27,9,true);globalThis.stable=addB(0,'stable',36,9,true);globalThis.worker=addU(0,'vil',15.5,23.5);globalThis.range=addB(0,'rng',44,18,true);globalThis.siege=addB(0,'siege',53,18,true);");
 return run;
}

test('solo Xbox building wheel unlocks early research using the exact multiplayer and queue ages',()=>{
 const run=uiGame();
 for(const {id,building,key,age,pre} of [
  {id:41,building:'bar',key:'longs',age:1,pre:'man'},
  {id:36,building:'univ',key:'chem',age:2},
  {id:33,building:'tc',key:'wheel',age:0},
  {id:33,building:'stable',key:'cavl',age:2}
 ]){
  run("S.civ[0]="+id+";S.age[0]="+age+";S.tech[0]={"+(pre?pre+":1":"")+"};S.sel=["+building+"];openMenu()");
  assert.equal(run("menu.items.find(i=>i.l===TE."+key+".n).lk"),'',
   CIVLabel(id)+' Xbox menu must permit its early '+key);
  assert.equal(commandOption(run,building,key).locked,'');
  assert.equal(run("research("+building+",'"+key+"')"),true,
   'Xbox-available tech must also be purchasable');
  run(building+".rs=null;S.civ[0]=0;S.tech[0]={"+(pre?pre+":1":"")+"};openMenu()");
  const locked=run("menu.items.find(i=>i.l===TE."+key+".n)?.lk");
  if(locked!==undefined)assert.match(locked,/Needs /,'foreign Xbox tech should remain age-locked');
  assert.equal(run("research("+building+",'"+key+"')"),false);
 }
});

test('solo build wheel accepts exactly affordable civilization-discounted structures',()=>{
 const run=uiGame();
 run("S.civ[0]=41;S.age[0]=0;S.res[0]={f:15,w:60,g:0,s:0};S.sel=[worker];openMenu()");
 assert.deepEqual(snapshot(run,"menu.items.find(i=>i.l===B.mule.n).c"),{f:15,w:60});
 assert.equal(run("menu.items.find(i=>i.l===B.mule.n).lk"),'');
 run("menu.items.find(i=>i.l===B.mule.n).fn()");
 assert.equal(run("place.k"),'mule','discounted Armenian cart must be placeable without base-cost stockpile');
 run("place=null;S.civ[0]=42;openMenu()");
 assert.deepEqual(snapshot(run,"menu.items.find(i=>i.l===B.mule.n).c"),{f:20,w:80});
 run("menu.items.find(i=>i.l===B.mule.n).fn()");
 assert.equal(run('place'),null,'a different civilization cannot buy its full-priced cart at the discount');

 run("S.civ[0]=36;S.age[0]=1;S.res[0]={f:0,w:50,g:0,s:0};openMenu()");
 assert.deepEqual(snapshot(run,"menu.items.find(i=>i.l===B.smith.n).c"),{w:50});
 run("menu.items.find(i=>i.l===B.smith.n).fn()");
 assert.equal(run('place.k'),'smith','Bohemian discount must use same construction affordability gate');
});

test('projected tech tree uses its own Hussite Reforms ledger for research cost',()=>{
 const run=game();
 run("S.civ[0]=36;S.tech[0]={};S.age[0]=3");
 const research="technologyTreeModel(0,{...S,tech:[{ut36p:1},{}]}).buildings.find(b=>b.id==='monastery').research.find(t=>t.id==='fervor').cost";
 const projected=snapshot(run,research);
 assert.deepEqual(projected,{f:run('TE.fervor.cost.g')},
  'projected upgraded monastery research must convert gold cost to food');
 assert.equal(run('S.tech[0].ut36p'),undefined,
  'viewing a hypothetical research ledger must never grant live technology');
 run("S.tech[0].ut36p=1");
 const unresearched=snapshot(run,"technologyTreeModel(0,{...S,tech:[{},{}]}).buildings.find(b=>b.id==='monastery').research.find(t=>t.id==='fervor').cost");
 assert.deepEqual(unresearched,snapshot(run,'TE.fervor.cost'),
  'unresearched projected tree must not inherit current live effects');
});

test('local and authoritative build menus agree on ages and completed prerequisites',()=>{
 const run=uiGame();
 run("S.civ[0]=0;S.age[0]=1;S.sel=[worker]");
 const option=key=>snapshot(run,"CK_GAME_COMMANDS.buildOptions(S,0).flat().find(o=>o.value==='"+key+"')");
 const compare=(kind,expected)=>{
  const host=option(kind).locked,local=run("bLock('"+kind+"')");
  assert.equal(host,expected,'host building lock for '+kind);
  assert.equal(local,expected.replace(/^Requires /,'Needs '),'Xbox building lock for '+kind);
 };
 compare('rng','');
 compare('univ','Requires Castle Age');
 compare('farm','Requires Mill');
 run("globalThis.mill=addB(0,'mill',44,9,true)");
 compare('farm','');
 run('mill.done=false');
 compare('farm','Requires Mill');
 run("S.civ[0]=35;S.age[0]=0");
 compare('farm','Requires Folwark');
 run("globalThis.folwark=addB(0,'folwark',53,9,true)");
 compare('farm','');
 compare('mill','Poles build Folwarks instead of Mills');
 run("S.civ[0]=41;S.age[0]=2");
 compare('monastery','Build a Fortified Church instead');
 compare('fchurch','');
 compare('lumber','Build a Mule Cart instead');
});

test('Chemistry unlocks paid Hand Cannoneer and Bombard queues across Xbox, host and the tech tree',()=>{
 const run=uiGame();
 run("S.civ[0]=0;S.age[0]=3;S.tech[0]={};S.sel=[range]");
 const host=(building,kind)=>snapshot(run,"CK_GAME_COMMANDS.buildingOptions(S,0,"+building+").find(o=>o.type==='train'&&o.value==='"+kind+"')");
 const tree=(building,kind)=>snapshot(run,"technologyTreeModel(0,S).buildings.find(b=>b.id==='"+building+"').units.find(u=>u.id==='"+kind+"')");
 for(const [building,site,unit] of [['range','rng','hcan'],['siege','siege','bomb']]){
  const before=run('JSON.stringify(S.res[0])');
  assert.equal(run("unitTrainingUnlock("+building+",'"+unit+"').reason"),'Requires Chemistry');
  assert.equal(host(building,unit).locked,'Requires Chemistry');
  assert.equal(tree(site,unit).state,'locked');
  assert.equal(tree(site,unit).pre,'chem');
  assert.equal(tree(site,unit).reason,'Needs Chemistry');
  run('S.sel=['+building+'];openMenu()');
  assert.equal(run("menu.items.find(i=>i.l===U."+unit+".n).lk"),'Needs Chemistry');
  assert.equal(run("train("+building+",'"+unit+"')"),false,'unresearched gunpowder must not queue');
  assert.equal(run('JSON.stringify(S.res[0])'),before,'locked gunpowder costs nothing');
  assert.equal(run(building+'.q.length'),0);
 }
 run("S.sel=[range];S.tech[0]={};globalThis.future={...S,tech:[{chem:1},{}]}");
 assert.equal(snapshot(run,"technologyTreeModel(0,future).buildings.find(b=>b.id==='siege').units.find(u=>u.id==='bomb')").state,'available');
 assert.equal(run("technologyTreeModel(0,S).buildings.find(b=>b.id==='siege').units.find(u=>u.id==='bomb').state"),'locked',
  'a projected peer must not grant Chemistry to the live match');
 assert.equal(run("research(univ,'chem')"),true);
 assert.equal(run("train(range,'hcan')"),false,'in-progress Chemistry is not completed research');
 run("upB(univ,TE.chem.t+1)");
 assert.equal(run('S.tech[0].chem'),1);
 for(const [building,site,unit] of [['range','rng','hcan'],['siege','siege','bomb']]){
  assert.equal(host(building,unit).locked,'');
  assert.equal(tree(site,unit).state,'available');
  assert.equal(run("train("+building+",'"+unit+"')"),true);
  assert.equal(run(building+'.q[0].k'),unit);
 }
});
test('Bohemian Hand Cannoneers remain trainable in Castle Age without Chemistry, not Bombards',()=>{
 const run=uiGame();
 run("S.civ=[36,0];S.age=[2,3];S.tech=[{},{}]");
 assert.equal(run("unitTrainingUnlock(range,'hcan',S).state"),'available');
 assert.equal(run("unitTrainingUnlock(siege,'bomb',S).reason"),'Requires Imperial Age');
 assert.equal(run("train(range,'hcan')"),true,'Bohemian Castle Age unit remains independent of Chemistry');
 run("S.age[0]=3");
 assert.equal(run("unitTrainingUnlock(siege,'bomb',S).reason"),'Requires Chemistry');
 assert.equal(run("train(siege,'bomb')"),false);
 run("S.civ[0]=0;S.tech[0]={};range.q=[]");
 assert.equal(run("unitTrainingUnlock(range,'hcan',S).reason"),'Requires Chemistry');
});
test('authenticated options use projected Gurjara age for Camel Scout replacement, not live age',()=>{
 const run=uiGame();
 run("S.civ[0]=39;S.age[0]=3;S.tech[0]={}");
 const options=age=>snapshot(run,"CK_GAME_COMMANDS.buildingOptions({...S,age:["+age+",3]},0,stable).filter(o=>o.type==='train').map(o=>o.value)");
 assert.ok(options(1).includes('camelscout'));
 assert.ok(!options(1).includes('camel'));
 assert.ok(options(2).includes('camel'));
 assert.ok(!options(2).includes('camelscout'));
 assert.ok(options(3).includes('camel'));
 assert.equal(run('S.age[0]'),3,'projected host age cannot change live game');
});
