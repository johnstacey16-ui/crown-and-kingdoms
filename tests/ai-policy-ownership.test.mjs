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
  'aiOpeningWaveNeed','aiResumeIdleWave','aiRetreat','aiShareResources','aiTradeEscorts','aiManageFishingShips','aiManageFleetRepairs','aiDisengageDamagedWarships','aiScoutIdleUnits','aiAssignWarshipTargets','aiClassifyHostileForces','aiTechnologyPriority','aiRepairImportantBuildings','aiAssignIdleVillagers','aiEvacuateVillagers']){
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
 assert.match(ai,/aiDisengageDamagedWarships\(my,hostileFleet\)/);
 assert.match(ai,/aiScoutIdleUnits\(scouts\)/);
 assert.match(ai,/aiAssignWarshipTargets\(t,tc,galleys,hostileShips\)/);
 assert.match(ai,/aiClassifyHostileForces\(t\)/);
 assert.match(ai,/aiTechnologyPriority\(k,techContext\)/);
 assert.match(ai,/aiRepairImportantBuildings\(t,A,bl,vil\)/);
 assert.match(ai,/aiAssignIdleVillagers\(t,vil,bl,arm,tc,R,cnt\)/);
 assert.match(ai,/aiEvacuateVillagers\(vil,bl,nearbyRaiders\)/);
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

function damagedWarshipFixture({water=true,canPath=true}={}){
 const W=48,H=48,S={t:100,wt:new Uint8Array(W*H).fill(water?1:0),nd:new Uint8Array(W*H)};
 const U={gal:{sh:1,dmg:8},bomb:{sh:1,dmg:6},fish:{sh:1,dmg:0},
  trn:{sh:1,dmg:0},cog:{sh:1,dmg:0},vil:{dmg:0}};
 let attempts=0;
 const ctx=vm.createContext({S,U,W,H,mhp:()=>100,gp:(x,y)=>({x,y}),
  path:()=>{attempts++;return canPath?[{x:33,y:34}]:null}});
 vm.runInContext(policy+'\n;globalThis.disengage=aiDisengageDamagedWarships;',ctx);
 const ship=(k,hp=25,o='a')=>({k,t:1,x:24,y:24,hp,o,ld:0,tg:{k:'gal'},p:[],rp:0});
 const enemy={k:'gal',t:0,x:25,y:24,hp:100};
 return {S,U,ship,enemy,run:(my,hostile=[enemy])=>ctx.disengage(my,hostile),attempts:()=>attempts};
}

test('damaged combat warships disengage to reachable open water with original twenty-second cooldown',()=>{
 const f=damagedWarshipFixture(),gal=f.ship('gal');
 f.run([gal]);
 assert.equal(gal.o,'m');
 assert.equal(gal.tg,null);
 assert.equal(gal.rp,1);
 assert.deepEqual(Array.from(gal.p),[{x:33,y:34}]);
 assert.equal(gal.navalFallbackUntil,120);
 const first=f.attempts();
 gal.o='a';f.S.t=119;f.run([gal]);
 assert.equal(gal.o,'a','cooldown prevents a repeated emergency order');
 assert.equal(f.attempts(),first);
 f.S.t=120;f.run([gal]);
 assert.equal(gal.o,'m','after cooldown a still-threatened low-health ship may disengage again');
});

test('damaged naval escape skips utility, healthy, loaded and unthreatened ships',()=>{
 const f=damagedWarshipFixture();
 const healthy=f.ship('gal',45),fish=f.ship('fish',10),trade=f.ship('cog',10),
  transport=f.ship('trn',10),loaded=f.ship('gal',10),other=f.ship('bomb',25);
 loaded.ld=1;
 f.run([healthy,fish,trade,transport,loaded,other],[]);
 assert.equal(f.attempts(),0,'no hostile fleet means no attempted escape routes');
 f.run([healthy,fish,trade,transport,loaded]);
 assert.equal(f.attempts(),0,'only damaged, active combat ships can flee');
 assert.equal(fish.o,'a');
 assert.equal(trade.o,'a');
 assert.equal(transport.o,'a');
 f.run([other]);
 assert.equal(other.o,'m','all damage-dealing ship classes, not just galleys, may flee');
});

test('blocked water and unreachable routes leave damaged combat ship orders unchanged',()=>{
 const blocked=damagedWarshipFixture({water:false}),gal=blocked.ship('gal');
 blocked.run([gal]);
 assert.equal(gal.o,'a');
 assert.equal(blocked.attempts(),0,'impassable water rejects all destinations before pathfinding');
 const unreachable=damagedWarshipFixture({canPath:false}),ship=unreachable.ship('gal');
 unreachable.run([ship]);
 assert.equal(ship.o,'a');
 assert.equal(ship.tg!==null,true,'failed retreat must keep original target');
 assert.ok(unreachable.attempts()>0,'reachable candidates are actually tested');
 assert.equal(ship.navalFallbackUntil,undefined,'failed retreat should not start cooldown');
});

function scoutRouteFixture({draws=[.8,.8],reachable=true}={}){
 const W=48,H=48;
 let index=0,calls=0;
 const S={t:100,r:()=>draws[Math.min(index++,draws.length-1)]};
 const ctx=vm.createContext({S,W,H,gp:(x,y)=>({x,y}),path:()=>{calls++;return reachable?[{x:32,y:32}]:null}});
 vm.runInContext(policy+'\n;globalThis.scout=aiScoutIdleUnits;',ctx);
 const unit=(o='i')=>({k:'scout',x:10,y:10,o,p:[],rp:0});
 return {S,unit,run:scouts=>ctx.scout(scouts),calls:()=>calls,draws:()=>index};
}

test('idle scout policy assigns a reachable random route and preserves eight-second cooldown',()=>{
 const f=scoutRouteFixture(),scout=f.unit();
 f.run([scout]);
 assert.equal(scout.o,'m');
 assert.equal(scout.rp,1);
 assert.equal(scout.nextScoutRoute,108);
 assert.deepEqual(Array.from(scout.p),[{x:32,y:32}]);
 assert.ok(scout.lastScoutX>30&&scout.lastScoutY>30);
 scout.o='i';f.S.t=107;
 f.run([scout]);
 assert.equal(f.calls(),1,'scout cooldown prevents immediate replanning');
 f.S.t=108;f.run([scout]);
 assert.equal(scout.nextScoutRoute,116);
 assert.equal(f.calls(),1,'the previously visited destination is not picked again');
 assert.equal(scout.o,'i','without a new waypoint the scout stays idle');
});

test('scout routing skips nearby destinations and tries another candidate',()=>{
 const f=scoutRouteFixture({draws:[.2,.2,.9,.9]}),scout=f.unit();
 f.run([scout]);
 assert.equal(scout.o,'m');
 assert.equal(f.calls(),1,'only the far waypoint reaches pathfinding');
 assert.equal(f.draws(),4,'a rejected close point consumes one random attempt');
});

test('scouts remain idle if every route is blocked; busy units do not receive scout orders',()=>{
 const f=scoutRouteFixture({reachable:false}),idle=f.unit(),busy=f.unit('g');
 f.run([idle,busy]);
 assert.equal(f.calls(),4,'scouting keeps its four route-attempt budget');
 assert.equal(idle.o,'i');
 assert.equal(busy.o,'g');
 assert.equal(idle.nextScoutRoute,108,'even unsuccessful scouting attempts have a cooldown');
 assert.equal(busy.nextScoutRoute,undefined);
 f.S.t=101;f.run([idle,busy]);
 assert.equal(f.calls(),4,'blocked destinations are not retried every AI tick');
});

function navalTargetFixture({shipsReachable=true,patrolReachable=true}={}){
 const S={t:100,bs:[]},U={gal:{dmg:8},cog:{dmg:0},fish:{dmg:0}};
 let shipChecks=0,patrolChecks=0;
 const ctx=vm.createContext({S,U,mhp:()=>100,
  isHostile:(a,b)=>a!==b,attackRange:()=>4,
  goalNear:target=>({kind:'ship',target}),gp:(x,y,r)=>({kind:'patrol',x,y,r}),
  path:(_ship,goal)=>{
   if(goal.kind==='ship'){shipChecks++;return shipsReachable?[{x:1,y:1}]:null}
   patrolChecks++;return patrolReachable?[{x:1,y:1},{x:2,y:2}]:null;
  }});
 vm.runInContext(policy+'\n;globalThis.assignWarships=aiAssignWarshipTargets;',ctx);
 const ship=(o='i',x=12,y=10,hp=100)=>({k:'gal',t:1,x,y,hp,o,tg:null,ld:0,p:[{x:0,y:0}],rp:0});
 const enemy=(k='gal',x=17,y=10)=>({k,t:0,x,y,hp:100,ld:0});
 const base={k:'tc',t:0,x:34,y:34,s:4,hp:500};
 S.bs.push(base);
 return {S,ship,enemy,base,run:(fleet,hostiles)=>ctx.assignWarships(1,base,fleet,hostiles),
  shipChecks:()=>shipChecks,patrolChecks:()=>patrolChecks};
}

test('warship target selection coordinates focus fire and prioritizes hostile combat ships',()=>{
 const f=navalTargetFixture(),target=f.enemy('gal'),merchant=f.enemy('cog',13,10);
 const first=f.ship('a'),second=f.ship('i',13,10);
 first.tg=target;
 f.run([first,second],[merchant,target]);
 assert.equal(second.o,'a');
 assert.equal(second.tg,target,'galley priority and existing focus outweigh a nearby merchant');
 assert.equal(second.p.length,0,'new attack target clears the old patrol route');
 assert.equal(first.tg,target,'existing valid attack orders remain untouched');
 assert.equal(f.shipChecks(),1,'only the highest ranked reachable target is probed');
});

test('warships retarget obsolete enemies, while retreat cooldown protects injured vessels',()=>{
 const f=navalTargetFixture(),target=f.enemy('gal'),former=f.enemy('gal',12,11);
 former.hp=0;
 const ship=f.ship('a');ship.tg=former;
 const recovering=f.ship('i',13,10,20);recovering.navalFallbackUntil=125;
 f.run([ship,recovering],[target]);
 assert.equal(ship.tg,target,'expired attack target is replaced');
 assert.equal(recovering.o,'i','recovering ship waits for escape cooldown');
 f.S.t=125;f.run([ship,recovering],[target]);
 assert.equal(recovering.o,'a','damaged ship can reacquire targets after escape cooldown');
 assert.equal(recovering.tg,target);
});

test('unreachable naval opponents back off and patrol only when the cooldown expires',()=>{
 const f=navalTargetFixture({shipsReachable:false}),ship=f.ship(),target=f.enemy();
 f.run([ship],[target]);
 assert.equal(ship.o,'m','fleet patrols toward an enemy Town Centre when naval targets are unreachable');
 assert.equal(ship.nextNavalTargetAt,108);
 assert.equal(ship.nextNavalPatrol,112);
 assert.equal(f.shipChecks(),1);
 assert.equal(f.patrolChecks(),1);
 ship.o='i';f.S.t=104;f.run([ship],[target]);
 assert.equal(ship.o,'i','both target and patrol cooldowns prevent duplicate orders');
 assert.equal(f.shipChecks(),1);
 assert.equal(f.patrolChecks(),1);
 f.S.t=108;f.run([ship],[target]);
 assert.equal(f.shipChecks(),2,'target retry resumes after eight seconds');
 assert.equal(f.patrolChecks(),1,'patrol remains throttled to twelve seconds');
});

test('warships without reachable hostiles or an enemy Town Centre preserve idle orders',()=>{
 const f=navalTargetFixture(),ship=f.ship();
 f.S.bs.length=0;
 f.run([ship],[]);
 assert.equal(ship.o,'i');
 assert.equal(f.shipChecks(),0);
 assert.equal(f.patrolChecks(),0);
});

function hostileRosterFixture(){
 const S={us:[]};
 const U={mil:{dmg:6,sh:0},gal:{dmg:7,sh:1},bomb:{dmg:5,sh:1},
  fish:{dmg:0,sh:1},trn:{dmg:0,sh:1},cog:{dmg:0,sh:1}};
 const ctx=vm.createContext({S,U,isHostile:(_team,enemyTeam)=>enemyTeam===0});
 vm.runInContext(policy+'\n;globalThis.classify=aiClassifyHostileForces;',ctx);
 const unit=(k,t=0,hp=100,ld=false)=>({k,t,hp,ld,x:10,y:10});
 return {S,unit,run:()=>ctx.classify(1)};
}
test('hostile roster policy counts active military, excludes loaded ships, and preserves trade target distinctions',()=>{
 const f=hostileRosterFixture();
 const infantry=f.unit('mil'),galley=f.unit('gal'),bombard=f.unit('bomb'),
  merchant=f.unit('cog'),transport=f.unit('trn'),fish=f.unit('fish');
 f.S.us=[infantry,galley,bombard,merchant,transport,fish,
  f.unit('gal',0,100,true),f.unit('mil',0,100,true)];
 const found=f.run();
 assert.deepEqual(Array.from(found.humanArmy),[infantry]);
 assert.deepEqual(Array.from(found.humanShips),[galley,bombard]);
 assert.deepEqual(Array.from(found.hostileFleet),[galley,bombard]);
 assert.deepEqual(Array.from(found.hostileShips),[galley,bombard,merchant,transport]);
 assert.equal(found.navalThreatCount,2);
});
test('hostile roster policy ignores dead, allied, malformed and unknown records',()=>{
 const f=hostileRosterFixture(),enemy=f.unit('gal');
 f.S.us=[null,undefined,{k:'gal',t:NaN,hp:100},
  f.unit('gal',0,0),f.unit('gal',1),f.unit('gal',2),
  f.unit('ghost'),enemy];
 const found=f.run();
 assert.deepEqual(Array.from(found.hostileFleet),[enemy]);
 assert.deepEqual(Array.from(found.hostileShips),[enemy]);
 assert.equal(found.navalThreatCount,1);
 assert.equal(found.humanArmy.length,0);
});

function researchScoreFixture(){
 const ctx=vm.createContext({INFARM:new Set(['mil','spear']),ARCHARM:new Set(['arc','xbow']),
  CAVARM:new Set(['knight','camel'])});
 vm.runInContext(policy+'\n;globalThis.scoreTech=aiTechnologyPriority;',ctx);
 const rosters=()=>({arm:[],vil:[],bl:[],my:[],humanCav:0,humanRanged:0,humanSiege:0,humanInf:0,humanShips:[]});
 return {score:(k,r)=>ctx.scoreTech(k,r),rosters};
}

test('technology scoring preserves naval research urgency only against real hostile combat ships',()=>{
 const f=researchScoreFixture(),r=f.rosters();
 assert.equal(f.score('navalHull',r),57);
 assert.equal(f.score('navalAtk',r),55);
 r.humanShips.push({k:'gal'});
 assert.equal(f.score('navalHull',r),152);
 assert.equal(f.score('navalAtk',r),160);
 assert.equal(f.score('unknownTech',r),20,'unknown research keys keep the original fallback');
});

test('technology scoring preserves infantry, cavalry and archery armour investment thresholds',()=>{
 const f=researchScoreFixture(),r=f.rosters();
 assert.equal(f.score('armI',r),32,'unfielded infantry takes the original armour penalty');
 assert.equal(f.score('armR',r),32,'unfielded archers take the original armour penalty');
 assert.equal(f.score('armC',r),32,'unfielded cavalry takes the original armour penalty');
 r.arm.push({k:'mil'},{k:'spear'},{k:'mil'},{k:'arc'},{k:'xbow'},{k:'arc'},{k:'knight'},{k:'knight'},{k:'camel'});
 assert.equal(f.score('armI',r),90);
 assert.equal(f.score('armR',r),92);
 assert.equal(f.score('armC',r),92);
 r.humanCav=2;
 assert.equal(f.score('pike',r),153);
 assert.equal(f.score('halb',r),151);
});

test('technology scoring retains villager, monk and damaged town-centre priorities',()=>{
 const f=researchScoreFixture(),r=f.rosters();
 assert.equal(f.score('loom',r),76);
 assert.equal(f.score('wheel',r),79);
 assert.equal(f.score('sanctity',r),20,'monk research is deprioritised without monks');
 r.vil.push(...Array.from({length:12},()=>({k:'vil'})));
 assert.equal(f.score('loom',r),92);
 assert.equal(f.score('wheel',r),97);
 assert.equal(f.score('handcart',r),95);
 r.my.push({k:'mon'},{k:'mon'});
 assert.equal(f.score('sanctity',r),55);
 r.bl.push({k:'tc',hp:60,mh:100});
 assert.equal(f.score('mas',r),67,'masonry gets the original damaged town-centre boost');
});

function buildingRepairFixture({reachable=()=>true}={}){
 const W=64,H=64,U={mil:{dmg:6},spear:{dmg:3}},S={t:100,bs:[],us:[]};
 let attempts=0;
 const ctx=vm.createContext({W,H,U,S,
  diplomacyRelation:(a,b)=>b===2?'ally':'enemy',
  isHostile:(a,b)=>a!==b&&b===0,
  goalNear:b=>b,
  path:(v,b)=>{attempts++;return reachable(v,b)?[{x:b.x,y:b.y}]:null}});
 vm.runInContext(policy+'\n;globalThis.buildingRepair=aiRepairImportantBuildings;',ctx);
 const site=(k='tc',t=1,hp=30,mh=100,x=20,y=20,s=4)=>({k,t,hp,mh,x,y,s,done:true});
 const worker=(x=20,y=20,o='i')=>({k:'vil',t:1,x,y,hp:100,ld:0,o,tg:null,p:[],rp:0});
 const A={lastBuildingRepair:0};
 return {S,A,site,worker,attempts:()=>attempts,run:(bl,vil)=>ctx.buildingRepair(1,A,bl,vil)};
}
test('building repair chooses high-priority Town Centre and assigns at most two idle workers',()=>{
 const f=buildingRepairFixture(),tc=f.site('tc'),house=f.site('house',1,1,100,21,21,2);
 const v1=f.worker(19,20),v2=f.worker(21,20),v3=f.worker(10,10);
 f.run([house,tc],[v1,v2,v3]);
 assert.equal(v1.o,'b');assert.equal(v2.o,'b');assert.equal(v3.o,'i');
 assert.equal(v1.tg,tc);assert.equal(v2.tg,tc);assert.equal(v1.rp,1);
 assert.equal(f.A.lastBuildingRepair,100);
 f.S.t=103;f.run([house,tc],[v1,v2,v3]);
 assert.equal(v3.o,'i','four-second cooldown prevents repeated assignments');
 f.S.t=104;f.run([house,tc],[v1,v2,v3]);
 assert.equal(v3.tg,house,'new repair site is chosen when another site has builders');
});
test('building repairs wait for construction and allow qualifying allied buildings',()=>{
 const f=buildingRepairFixture(),unfinished=f.site('house'),own=f.site('tc'),ally=f.site('castle',2);
 unfinished.done=false;
 const v=f.worker();f.S.bs=[ally];
 f.run([unfinished,own],[v]);assert.equal(v.o,'i');
 unfinished.hp=0;f.run([unfinished],[v]);
 assert.equal(v.o,'b');assert.equal(v.tg,ally);
});
test('hostile raiders block repair and unreachable paths do not start a cooldown',()=>{
 const f=buildingRepairFixture({reachable:()=>false}),tc=f.site('tc'),v=f.worker();
 f.S.us=[null,{k:'mil',t:0,hp:100,x:21,y:21,ld:0}];
 f.run([tc],[v]);
 assert.equal(v.o,'i');assert.equal(f.attempts(),0);
 f.S.us[1].ld=1;f.run([tc],[v]);
 assert.ok(f.attempts()>0);assert.equal(v.o,'i');
 assert.equal(f.A.lastBuildingRepair,0);
});
test('building repairs reject invalid or distant workers and completed healthy buildings',()=>{
 const f=buildingRepairFixture(),tc=f.site('tc'),far=f.worker(60,60),
  invalid=f.worker(NaN,20),healthy=f.site('castle',1,100,100,24,24);
 f.run([tc,healthy],[far,invalid]);
 assert.equal(f.attempts(),0);
 assert.equal(far.o,'i');assert.equal(invalid.o,'i');
 assert.equal(f.A.lastBuildingRepair,0);
});

function idleVillagerFixture({canFarm=false,route=()=>true,nodes=[]}={}){
 const W=48,H=48,paid=[],built=[],checked=[];
 const S={age:[0,1],nodes,wt:new Uint8Array(W*H),r:()=>.75};
 const B={farm:{cost:{w:60}}};
 const ctx=vm.createContext({S,B,W,H,findNode:(v,k)=>nodes.find(n=>n.k===k&&n.amt>0)||null,
  can:()=>canFarm,cor:()=>false,okPlace:()=>true,
  gp:(x,y,r)=>({x,y,r,kind:'place'}),goalNear:(target,r)=>target,
  path:(v,target)=>{checked.push(target);return route(v,target)?[{x:target.x,y:target.y}]:null},
  farmFood:()=>175,addN:(k,x,y,amt)=>{const n={k,x,y,amt,fm:true};built.push(n);return n},
  pay:(team,cost)=>paid.push({team,cost})});
 vm.runInContext(policy+'\n;globalThis.assignIdle=aiAssignIdleVillagers;',ctx);
 const villager=(o='i',x=10,y=10)=>({k:'vil',t:1,o,x,y,hp:100,ld:0,aiEvac:false,
  ct:null,tg:null,p:[],rp:0,ret:5});
 const site=(k='house',done=false)=>({k,done,hp:100,x:11,y:10,s:2});
 return {S,B,villager,site,paid,built,checked,
  run:(vil,bl=[],arm=[],R={w:0},tc={x:20,y:20})=>
   ctx.assignIdle(1,vil,bl,arm,tc,R,()=>0)};
}

test('idle economy workers complete reachable unfinished construction before gathering',()=>{
 const f=idleVillagerFixture({nodes:[{k:'f',x:13,y:10,amt:20}]}),v=f.villager(),
  house=f.site(),other=f.site('bar');
 f.run([v],[house,other]);
 assert.equal(v.o,'b');assert.equal(v.tg,house);assert.equal(v.rp,1);
 assert.equal(v.ct,null,'construction does not also queue gathering');
 const assigned=f.villager('b'),idle=f.villager();
 assigned.tg=house;
 f.run([assigned,idle],[house,other]);
 assert.equal(idle.tg,other,'sites already being built are skipped');
});

test('idle economy workers gather food first, then rebalance to wood with enough food workers',()=>{
 const food={k:'f',x:13,y:10,amt:50},wood={k:'w',x:15,y:10,amt:50};
 const f=idleVillagerFixture({nodes:[food,wood]}),v=f.villager();
 f.run([v]);
 assert.equal(v.o,'g');assert.equal(v.ct,'f');assert.equal(v.tg,food);
 assert.equal(v.ret,0);
 const foodWorkers=Array.from({length:8},()=>({...f.villager('g'),ct:'f'}));
 const extra=f.villager();
 f.run([...foodWorkers,extra]);
 assert.equal(extra.o,'g');assert.equal(extra.ct,'w');
 assert.equal(extra.tg,wood);
});

test('idle economy worker falls back to reachable alternative resource nodes',()=>{
 const food={k:'f',x:12,y:10,amt:50},wood={k:'w',x:16,y:11,amt:50};
 const f=idleVillagerFixture({nodes:[food,wood],route:(_v,n)=>n===wood});
 const v=f.villager();
 f.run([v]);
 assert.equal(v.o,'g');assert.equal(v.tg,wood);
 assert.equal(v.ct,'w');
 assert.equal(f.checked[0],food,'first preferred resource was tested before fallback');
});

test('idle villagers can place and pay for an accessible farm when food sites are absent',()=>{
 const f=idleVillagerFixture({canFarm:true}),v=f.villager();
 f.run([v],[],[],{w:150});
 assert.equal(f.built.length,1);
 assert.equal(f.paid.length,1,'new farm construction charges resources once');
 assert.equal(f.paid[0].team,1);
 assert.equal(f.paid[0].cost.w,60);
 assert.equal(f.built[0].t,1);
 assert.equal(v.o,'g');assert.equal(v.tg,f.built[0]);
});

test('idle economy selection ignores garrisoned, evacuating and out-of-bounds villagers',()=>{
 const f=idleVillagerFixture({nodes:[{k:'f',x:15,y:12,amt:20}]}),
  garrison=f.villager(),evac=f.villager(),outside=f.villager('i',NaN,10);
 garrison.ld=1;evac.aiEvac=true;
 f.run([garrison,evac,outside]);
 assert.equal(f.checked.length,0);
 assert.ok([garrison,evac,outside].every(v=>v.o==='i'));
});

function evacuationFixture({canPath=()=>true}={}){
 const W=48,H=48,S={t:100},attempts=[];
 const ctx=vm.createContext({S,W,H,
  goalNear:(target)=>target,gp:(x,y,r)=>({x,y,r,k:'escape'}),
  path:(unit,target)=>{attempts.push(target);return canPath(unit,target)?[{x:target.x,y:target.y}]:null}});
 vm.runInContext(policy+'\n;globalThis.evac=aiEvacuateVillagers;',ctx);
 const worker=(o='g')=>({k:'vil',x:11,y:10,hp:100,ld:0,o,
  tg:{k:'f',x:5,y:5,amt:50},ct:'f',p:[],rp:0,aiEvac:null});
 const shelter=(k='tc',x=20,y=20)=>({k,x,y,s:4,hp:400,done:true});
 const raider=(x=12,y=10)=>({k:'mil',x,y,hp:100});
 return {S,worker,shelter,raider,attempts,run:(villagers,buildings=[],raiders=[])=>ctx.evac(villagers,buildings,raiders)};
}

test('villagers evacuate to reachable Town Centre and resume prior gathering on safety',()=>{
 const f=evacuationFixture(),v=f.worker(),tc=f.shelter(),enemy=f.raider();
 const food=v.tg;
 f.run([v],[tc],[enemy]);
 assert.equal(v.o,'m');assert.equal(v.tg,tc);
 assert.equal(v.aiEvac.o,'g');assert.equal(v.aiEvac.tg,food);
 assert.equal(v.aiEvac.until,118);
 v.x=22;v.y=22;
 f.run([v],[tc],[]);
 assert.equal(v.o,'g');assert.equal(v.tg,food);
 assert.equal(v.aiEvac,null);assert.equal(v.rp,1);
});

test('villagers fall back to open-field retreat and become idle if prior work expires',()=>{
 const f=evacuationFixture(),v=f.worker();
 f.run([v],[],[f.raider()]);
 assert.equal(v.o,'m');assert.equal(v.tg,null);
 assert.equal(v.aiEvac.shelter,null);assert.equal(v.aiEvac.until,108);
 v.aiEvac.tg.amt=0;
 f.S.t=108;f.run([v],[],[]);
 assert.equal(v.o,'i');assert.equal(v.tg,null);
 assert.equal(v.aiEvac,null);
});

test('evacuation tries reachable shelters in order and ignores invalid or garrisoned workers',()=>{
 const f=evacuationFixture({canPath:(_v,goal)=>goal.k==='castle'}),v=f.worker(),
  tc=f.shelter(),castle=f.shelter('castle',24,24);
 const loaded=f.worker(),outside=f.worker(),dead=f.worker();
 loaded.ld=1;outside.x=NaN;dead.hp=0;
 f.run([v,loaded,outside,dead],[tc,castle],[f.raider()]);
 assert.equal(v.tg,castle);
 assert.equal(f.attempts[0],tc);assert.equal(f.attempts[1],castle);
 assert.equal(loaded.aiEvac,null);assert.equal(outside.aiEvac,null);assert.equal(dead.aiEvac,null);
});

test('villagers already fleeing can repath toward shelter while threat persists',()=>{
 const f=evacuationFixture(),v=f.worker(),tc=f.shelter();
 v.aiEvac={o:'g',tg:v.tg,ct:'f',shelter:tc,until:118};
 v.o='m';v.p=[];
 f.run([v],[tc],[f.raider()]);
 assert.equal(v.o,'m');assert.equal(v.tg,tc);
 assert.equal(v.p.length,1);
 assert.equal(v.rp,1);
 assert.ok(v.aiEvac,'escape state stays active while hostile units remain nearby');
});
