import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';

const hostCommands=['network-sync','network-commands'].map(name=>
 readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8')).join('\n');

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

test('Khmer Farms and Feudal military buildings skip prerequisite structures in every build entry point',()=>{
 const run=uiGame();
 run(`S.bs=[tc];S.nodes=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);S.nd.fill(null);
  S.el.fill(0);S.civ[0]=12;S.age[0]=0;S.sel=[worker];mode='play';
  globalThis.sendBuild=(value,x,y)=>CK_GAME_COMMANDS.execute(
   {type:'build',value,entities:[worker.netId],point:{x,y}},0,2)`);
 const hostLock=kind=>run(`CK_GAME_COMMANDS.buildOptions(S,0).flat().find(o=>o.value==='${kind}').locked`);
 for(const kind of ['stable','rng','smith']){
  assert.equal(run(`bLock('${kind}')`),'Needs Feudal Age');
  assert.equal(hostLock(kind),'Requires Feudal Age');
 }
 assert.equal(run("sendBuild('stable',16,24)"),false);
 assert.equal(run("sendBuild('farm',16,24)"),true,'a live host build can place a farm with no Mill');
 assert.equal(run("worker.tg.fm&&worker.tg.t===0"),true);
 assert.equal(run('S.res[0].w'),9940);
 run('S.age[0]=1');
 for(const kind of ['stable','rng','smith']){
  assert.equal(run(`bLock('${kind}')`),'');
  assert.equal(hostLock(kind),'');
 }
 const tree=world=>snapshot(run,`technologyTreeModel(0,${world}).buildings.find(b=>b.id==='stable')`);
 assert.equal(tree('S').pre,null);
 assert.equal(tree('S').state,'available');
 assert.equal(tree('{...S,civ:[0,0]}').reason,'Requires Barracks');
 run('worker.x=18.5;worker.y=22.5');
 assert.equal(run("sendBuild('stable',17,23)"),true);
 assert.equal(run('S.res[0].w'),9790);
 assert.equal(run("S.bs.some(b=>b.k==='stable'&&b.t===0&&!b.done)"),true);
 assert.equal(run("buildingUnlock('donjon',0,S).state"),'locked','regional ownership still applies');
 assert.equal(run("sendBuild('rng',17,23)"),false,'an occupied site is rejected');
});

test('Khmer can advance all three ages without extra buildings through the live host',()=>{
 const run=game();
 run(`S.bs=[tc];S.civ[0]=12;S.age[0]=0;mode='play';
  globalThis.sendAge=()=>CK_GAME_COMMANDS.execute(
   {type:'research',value:'age',entities:[tc.netId]},0,2)`);
 for(let age=0;age<3;age++){
  const next=snapshot(run,`AG[${age+1}]`);
  assert.deepEqual(snapshot(run,'ageRequirements(0)'),{ready:true,count:0});
  assert.equal(snapshot(run,'ageRequirements(0,{...S,civ:[0,0]})').ready,false);
  assert.equal(commandOption(run,'tc','age').locked,'');
  run(`S.res[0]={f:${next.cost.f-1},g:${next.cost.g||0},w:0,s:0}`);
  assert.equal(run('sendAge()'),false);
  run('S.res[0].f++');
  assert.equal(run('sendAge()'),true);
  assert.equal(run('S.res[0].f+S.res[0].g'),0);
  assert.equal(run('sendAge()'),false,'an advance cannot queue twice');
  run(`upB(tc,${next.t}+1)`);
  assert.equal(run('S.age[0]'),age+1);
  assert.equal(run('S.bs.length'),1);
 }
 assert.equal(run('sendAge()'),false,'Imperial Age remains the cap');
});

test('Khmer AI starts a paid age advance before any prerequisite building finishes',()=>{
 const run=game();
 run(`S.civ[1]=12;S.age[1]=0;diff=2;S.ai[1].cd=0;S.el.fill(0);
  globalThis.aiCentre=addB(1,'tc',32,32,true);
  for(let i=0;i<12;i++)addU(1,'vil',29+i%4,36+Math.floor(i/4));
  S.res[1]={f:500,w:0,g:0,s:0};
  aiTeam(1,1)`);
 assert.equal(run('aiCentre.rs?.k'),'age');
 assert.equal(run('S.res[1].f'),0);
 assert.equal(run('S.bs.filter(b=>b.t===1&&b.done).length'),1);
});

test('Khmer Houses shelter five owned Villagers and Kings through Xbox, host and Town Bell orders',()=>{
 const run=uiGame();
 run(`S.civ=[12,0];S.bs=[];S.us=[];S.nodes=[];S.g.fill(0);S.gt.fill(0);S.wt.fill(0);
  S.el.fill(0);S.nd.fill(null);mode='play';
  globalThis.house=addB(0,'house',25,25,true);
  globalThis.worker=addU(0,'vil',24.25,25.5);
  globalThis.king=addU(0,'king',24.25,26);
  globalThis.soldier=addU(0,'mil',24.25,26.5);
  globalThis.board=(unit,team=0)=>CK_GAME_COMMANDS.execute(
   {type:'garrison',target:house.netId,entities:[unit.netId]},team,2);
  S.sel=[worker];orderSel(house,25.5,25.5);upU(worker,DT)`);
 assert.equal(run('worker.ld===house'),true,'Xbox context action enters the House');
 assert.equal(run('board(soldier)'),false,'infantry cannot shelter in Houses');
 run("globalThis.ally=addU(1,'vil',24.25,25.75);setDiplomacy(0,1,'ally')");
 assert.equal(run('board(ally,1)'),false,'only the owning Khmer kingdom can use a House');
 assert.equal(run('board(king)'),true);
 run('upU(king,DT)');
 assert.equal(run('king.ld===house'),true);
 run("globalThis.workers=Array.from({length:4},()=>addU(0,'vil',24.25,25.5))");
 assert.equal(run('townBell(0)'),3,'the Town Bell reserves each available space once');
 run('for(const unit of workers)upU(unit,DT)');
 assert.equal(run('house.cg.length'),5);
 assert.equal(run('board(workers[3])'),false);
 run('worker.hp=20;S.tech[0].herbalMedicine=1;upB(house,10)');
 assert.equal(run('worker.hp'),20,'sheltered villagers do not heal in Houses');
 assert.equal(run('S.pj.length'),0,'houses remain unarmed');
 assert.equal(run("saveG(false,'khmer-house-garrison')"),true);
 assert.equal(run("loadG(false,'khmer-house-garrison')"),true);
 run("house=S.bs.find(b=>b.k==='house');S.sel=[house];openMenu()");
 assert.equal(run('house.cg.length'),5);
 assert.equal(run('house.cg.every(u=>u.ld===house)'),true);
 assert.equal(run("menu.items.some(i=>i.l==='Unload garrison (5)')"),true);
 assert.equal(run("CK_GAME_COMMANDS.buildingOptions(S,0,house).some(o=>o.type==='unload')"),true);
 assert.equal(run("CK_GAME_COMMANDS.execute({type:'unload',entities:[house.netId]},0,2)"),true);
 assert.equal(run('house.cg.length'),0);
 assert.equal(run('S.us.some(u=>u.ld===house)'),false);
 run(`king=S.us.find(u=>u.k==='king');king.x=24.25;king.y=25.5;
  setDiplomacy(0,1,'enemy');board(king);upU(king,DT)`);
 assert.equal(run('king.ld===house'),true);
 run("house.hp=1;dmgT(addU(1,'mil',24,24),house)");
 assert.equal(run('house.dead&&king.ld===null&&king.hp>0'),true,'a destroyed House releases living occupants');
 run("S.civ[0]=0");
 assert.equal(run('civilizationGarrisonCapacity(house)'),0);
});
