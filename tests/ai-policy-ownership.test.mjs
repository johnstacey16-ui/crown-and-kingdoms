import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const policy=read('js/ai-policy.js'),construction=read('js/ai-construction.js'),ai=read('js/ai.js');

test('AI decision helpers have exactly one dedicated owner',()=>{
 for(const fn of ['aiBaseDefenceThreat','aiCanResearchWhileSaving','aiQueuedUnits',
  'aiSiegeTarget','aiAvailableBuilder','aiBuilderCandidates','aiReachableBuilder',
  'aiSavingAgeFood','aiTownTechReady','aiDockWaterReach','aiRebal',
  'aiOpeningWaveNeed','aiResumeIdleWave','aiRetreat','aiShareResources','aiTradeEscorts','aiManageFishingShips','aiManageFleetRepairs']){
  assert.match(policy,new RegExp('function '+fn+'\\('));
  assert.doesNotMatch(ai,new RegExp('function '+fn+'\\('));
 }
 assert.match(construction,/function aiBuild\(/);
 assert.match(ai,/aiCanResearchWhileSaving\(/);
 assert.match(ai,/aiQueuedUnits\(/);
 assert.match(construction,/aiDockWaterReach\(/);
 assert.match(ai,/aiRebal\(/);
 assert.match(ai,/aiOpeningWaveNeed\(/);
 assert.match(ai,/aiResumeIdleWave\(/);
 assert.match(ai,/aiShareResources\(t,A,R\)/);
 assert.match(ai,/aiTradeEscorts\(A,my,arm,galleys,hostileFleet,humanArmy\)/);
 assert.match(ai,/aiManageFishingShips\(fish,hostileFleet,R\)/);
 assert.match(ai,/aiManageFleetRepairs\(t,my\)/);
 assert.doesNotMatch(ai,/function aiResumeIdleWave\(/);
 assert.doesNotThrow(()=>new vm.Script(policy));
 assert.doesNotThrow(()=>new vm.Script(construction));
 for(const fn of ['aiBuild','aiWall','aiDock','aiNear'])assert.doesNotMatch(ai,new RegExp('function '+fn+'\\('));
 assert.doesNotThrow(()=>new vm.Script(ai));
});
test('AI policy precedes AI loop after simulation across production and offline bundles',()=>{
 const html=read('index.html'),sw=read('sw.js');
 for(const scripts of [browserScriptPaths(html),coreGameScriptPaths(html),
  coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  const i=scripts.indexOf('./js/simulation.js');
  assert.deepEqual(scripts.slice(i,i+6),['./js/simulation.js','./js/simulation-unit-behaviour.js','./js/simulation-separation.js','./js/ai-policy.js','./js/ai-construction.js','./js/ai.js']);
 }
 assert.ok(sw.includes("'./js/ai-policy.js'"));
 assert.ok(sw.includes("'./js/ai-construction.js'"));
 const browser=browserScriptPaths(html),core=coreGameScriptPaths(html);
 assert.deepEqual(core,browser.slice(browser.indexOf('./js/config.js'),browser.indexOf('./engine.js')+1),
  'AI must participate in the same ordered browser/core script span');
});
test('AI queue and age-saving helpers execute without game state',()=>{
 const ctx={};vm.createContext(ctx);
 vm.runInContext(policy+'\n;globalThis.units=aiQueuedUnits;globalThis.canSave=aiCanResearchWhileSaving;',ctx);
 assert.equal(ctx.units([{hp:100,q:[{k:'gal'},{k:'fish'},{k:'gal'}]},{hp:0,q:[{k:'gal'}]}],'gal'),2);
 assert.equal(ctx.canSave({f:850,g:250},{f:30,g:20},{f:800,g:200}),true);
 assert.equal(ctx.canSave({f:810,g:250},{f:30,g:20},{f:800,g:200}),false);
});

function escortFixture(){
 const S={t:100};
 const U={mil:{dmg:4},knight:{dmg:9},cart:{dmg:0},cog:{sh:1,dmg:0},gal:{sh:1,dmg:8},fish:{sh:1,dmg:0}};
 let pathAllowed=true;
 const ctx=vm.createContext({
  S,U,
  mhp:()=>100,
  goalNear:(target)=>target,
  path:()=>pathAllowed?[{x:5,y:5}]:null,
 });
 vm.runInContext(policy+"\n;globalThis.assign=aiTradeEscorts;",ctx);
 const merchant=(k,x=10,y=10)=>({k,x,y,t:1,hp:100,o:'m',p:[],rp:0,tradeEscortUntil:0});
 const guard=(k,x=12,y=12)=>({k,x,y,t:1,hp:85,o:'i',p:[],rp:0,tradeEscortUntil:0});
 const enemy=(k,x=13,y=12)=>({k,x,y,t:0,hp:100});
 return {S,assign:(A,my,arm,galleys,naval,land)=>ctx.assign(A,my,arm,galleys,naval,land),
  merchant,guard,enemy,disablePath:()=>{pathAllowed=false}};
}

test('trade-cart escort policy assigns one nearby healthy infantry guard and releases it when safe',()=>{
 const f=escortFixture(),A={wu:[]},cart=f.merchant('cart'),soldier=f.guard('mil');
 const raider=f.enemy('knight');
 f.assign(A,[cart,soldier],[soldier],[],[],[raider]);
 assert.equal(soldier.o,'G');
 assert.equal(soldier.tg,cart);
 assert.equal(soldier.tradeEscortUntil,120);
 assert.equal(soldier.p.length,1);
 assert.equal(soldier.rp,1);
 f.S.t=119;
 f.assign(A,[cart,soldier],[soldier],[],[],[raider]);
 assert.equal(soldier.o,'G','guard stays close when threat is present');
 f.S.t=121;
 f.assign(A,[cart,soldier],[soldier],[],[],[raider]);
 assert.equal(soldier.o,'G','guard stays past timer if raiders remain close');
 f.assign(A,[cart,soldier],[soldier],[],[],[]);
 assert.equal(soldier.o,'i');
 assert.equal(soldier.tg,null);
 assert.equal(soldier.p.length,0,'released guard clears its route');
 assert.equal(soldier.tradeEscortUntil,0);
});

test('merchant protection refuses distant enemies, unavailable paths and reserved or damaged guards',()=>{
 const f=escortFixture(),cart=f.merchant('cart'),soldier=f.guard('mil'),raider=f.enemy('knight',42,42);
 f.assign({},[cart,soldier],[soldier],[],[],[raider]);
 assert.equal(soldier.o,'i');
 raider.x=13;raider.y=12;
 f.disablePath();
 f.assign({},[cart,soldier],[soldier],[],[],[raider]);
 assert.equal(soldier.o,'i','a missing path must not assign a bogus escort');
 const g=escortFixture(),cart2=g.merchant('cart'),reserved=g.guard('mil'),enemy=g.enemy('knight');
 g.assign({wu:[reserved]},[cart2,reserved],[reserved],[],[],[enemy]);
 assert.equal(reserved.o,'i','units reserved for AI attacks stay available to the attack plan');
 reserved.hp=35;
 g.assign({wu:[]},[cart2,reserved],[reserved],[],[],[enemy]);
 assert.equal(reserved.o,'i','damaged troops are not committed to escorting');
});

test('trade cogs use idle war galleys for escort, never land units or fishing ships',()=>{
 const f=escortFixture(),A={wu:[]},cog=f.merchant('cog'),gal=f.guard('gal'),fish=f.guard('fish');
 const enemy=f.enemy('gal');
 f.assign(A,[cog,gal,fish],[],[gal], [enemy],[]);
 assert.equal(gal.o,'G');
 assert.equal(gal.tg,cog);
 assert.equal(gal.tradeEscortUntil,120);
 assert.equal(fish.o,'i');
 f.S.t=125;
 f.assign(A,[cog,gal,fish],[],[gal],[],[]);
 assert.equal(gal.o,'i');
 assert.equal(gal.tg,null);
});

function fishFixture({trap=false}={}){
 const W=48,H=48,S={t:100,wt:new Uint8Array(W*H).fill(1),
  nd:Array(W*H).fill(null),ex:new Uint8Array(W*H),nodes:[]};
 let trapDeployments=0,canPath=true;
 const context=vm.createContext({W,H,S,
  gp:(x,y)=>({x,y}),goalNear:n=>n,
  path:()=>canPath?[{x:18,y:18}]:null,
  deployFishTrap:()=>{
   trapDeployments++;
   if(trap)S.nodes.push({k:'f',fi:1,amt:100,x:23,y:20});
  }});
 vm.runInContext(policy+"\n;globalThis.fishing=aiManageFishingShips;",context);
 const fish={k:'fish',t:1,x:20,y:20,hp:40,o:'i',p:[],rp:0};
 return {S,fish,run:(ships,enemy,resources)=>context.fishing(ships,enemy,resources),
  deployments:()=>trapDeployments,blockPath:()=>{canPath=false}};
}

test('AI fishing ships flee a nearby hostile warship to reachable deep water',()=>{
 const f=fishFixture(),enemy={k:'gal',x:21,y:20,hp:100};
 f.run([f.fish],[enemy],{w:0});
 assert.equal(f.fish.o,'m');
 assert.equal(f.fish.tg,null);
 assert.equal(f.fish.p.length,1);
 assert.equal(f.fish.fleeUntil,110,'flee route has the original ten-second cooldown');
 f.S.t=101;f.run([f.fish],[],{w:0});
 assert.equal(f.fish.fleeUntil,0,'safe fishing ships can resume normal routes');
 const g=fishFixture();g.blockPath();
 g.run([g.fish],[enemy],{w:0});
 assert.equal(g.fish.o,'i','no path must not assign a bogus escape');
});

test('AI fishing ships find living fish nodes without paying for a trap',()=>{
 const f=fishFixture(),node={k:'f',fi:1,amt:80,x:25,y:21};
 f.S.nodes.push(node);
 f.run([f.fish],[],{w:200});
 assert.equal(f.fish.o,'g');
 assert.equal(f.fish.tg,node);
 assert.equal(f.fish.ct,'f');
 assert.equal(f.fish.p.length,1);
 assert.equal(f.fish.rp,1);
 assert.equal(f.fish.nextFishingRoute,108);
 assert.equal(f.deployments(),0);
});

test('fishing trap construction is resource gated and selected only if accessible',()=>{
 const f=fishFixture({trap:true});
 f.run([f.fish],[],{w:99});
 assert.equal(f.deployments(),0,'insufficient wood cannot buy a fish trap');
 f.S.t=110;f.fish.nextFishingRoute=0;
 f.run([f.fish],[],{w:100});
 assert.equal(f.deployments(),1);
 assert.equal(f.fish.nextFishTrapAt,155);
 assert.equal(f.fish.o,'g');
});

function fleetRepairFixture(){
 const S={us:[]},U={gal:{sh:1},fish:{sh:1},cog:{sh:1},trn:{sh:1}};
 const ctx=vm.createContext({S,U,mhp:()=>100,isHostile:(a,b)=>a!==b});
 vm.runInContext(policy+'\n;globalThis.repair=aiManageFleetRepairs;',ctx);
 const ship=(k,hp,o='i',x=10,y=10)=>({k,sh:1,hp,o,x,y,t:1,p:[{x:1,y:1}],tg:null});
 return {S,ship,run:my=>ctx.repair(1,my)};
}

test('fleet repair prioritizes the most damaged warship before utility ships, using one healthy idle escort',()=>{
 const f=fleetRepairFixture(),repairer=f.ship('gal',95),warship=f.ship('gal',20,'a'),
  second=f.ship('gal',45,'a'),fish=f.ship('fish',8,'g');
 f.run([fish,second,repairer,warship]);
 assert.equal(repairer.o,'rep');
 assert.equal(repairer.tg,warship,'combat vessels take priority even when utility ships have less health');
 assert.equal(repairer.p.length,0,'repair orders clear the prior movement path');
 const spare=f.ship('gal',98);
 f.run([fish,second,repairer,warship,spare]);
 assert.equal(spare.o,'i','an existing repair order prevents a duplicate');
});

test('fleet repairs defer under enemy naval fire or when no eligible warship is idle',()=>{
 const f=fleetRepairFixture(),target=f.ship('gal',30,'a'),repairer=f.ship('gal',90);
 f.S.us.push({k:'gal',t:0,hp:100,x:11,y:10});
 f.run([target,repairer]);
 assert.equal(repairer.o,'i','enemy warship nearby prevents exposed repair');
 f.S.us[0].x=50;
 repairer.o='m';f.run([target,repairer]);
 assert.equal(repairer.o,'m','busy warships cannot be diverted into repair');
 repairer.o='i';repairer.hp=70;f.run([target,repairer]);
 assert.equal(repairer.o,'i','only vessels above seventy percent health repair');
 repairer.hp=90;f.run([target,repairer]);
 assert.equal(repairer.o,'rep','repair resumes once the enemy is distant and the escort is ready');
});
