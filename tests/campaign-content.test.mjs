import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';
import {campaignConstruction} from './helpers/campaign-construction.mjs';

// Assert against the same HTML-ordered browser module graph used by production.
const html=loadCoreGameSource({includeUI:true});

test('campaign arcs reference every defined mission exactly once', () => {
  const campaign = html.match(/const CAMP=\[([\s\S]*?)\n\];/);
  assert.ok(campaign, 'Campaign mission definitions must be present');
  const missionCount = (campaign[1].match(/\{t:/g) || []).length;
  assert.ok(missionCount > 0, 'Campaign must define missions');
  const arcs = html.match(/const CAMP_ARCS=\[([\s\S]*?)\];/);
  assert.ok(arcs, 'Campaign arc definitions must be present');
  const ids = [...arcs[1].matchAll(/ids:\[([^\]]*)\]/g)]
    .flatMap((match) => match[1].split(',').map((value) => Number(value.trim())));
  assert.equal(ids.length, missionCount, 'Every mission must appear in exactly one campaign arc');
  assert.equal(new Set(ids).size, ids.length, 'Campaign arcs must not duplicate mission IDs');
  assert.deepEqual([...ids].sort((a, b) => a - b), Array.from({ length: missionCount }, (_, index) => index),
    'Campaign arcs must reference valid contiguous mission IDs with no missing or out-of-range entries');
});

test('campaign HUD can display every active objective in five-goal tutorial missions', () => {
  assert.match(html, /function cmpHud\(\)[\s\S]*?sc\.goals\.filter\(q=>!cmp\.d\[q\.id\]\)\.slice\(0,5\)/);
  assert.match(html, /g\.forEach\(\(q,i\)=>tx\('- '\+q\.t,24,104\+i\*26,16,'#fff'\)\)/);
});

test('coastal campaign sequel has relic, monastery and siege objectives', () => {
  assert.match(html, /t:'The Strait\\'s Last Relic'/);
  assert.match(html, /t:'Build a Monastery'/);
  assert.match(html, /t:'Hold 2 relics in your Monasteries'/);
  assert.match(html, /t:'Destroy the enemy Castle'/);
  assert.match(html, /t:'Destroy the enemy Town Centre'/);
});

test('sequel includes timed mixed naval and land attacks and campaign progression', () => {
  assert.match(html, /at:150,do:\(\)=>raid\(5,\['gal','gal','scout','spear','arc'\]/);
  assert.match(html, /at:300,do:\(\)=>raid\(7,\['ram','knight','arc','spear','gal','gal','arc'\]/);
  assert.match(html, /at:480,do:\(\)=>raid\(8,\['ram','ram','knight','knight','arc','spear','gal','gal'\]/);
  assert.match(html, /n:'Coastal War',ids:\[12,13,14\]/);
});

test('Causeway campaign uses the navigable strait layout and a staged land-and-sea objective set', () => {
  const start = html.indexOf("{t:'The Causeway Muster'");
  assert.notEqual(start, -1, 'The Causeway Muster must exist as a playable mission');
  const nextMission = html.indexOf("\n{t:", start + 1);
  const end = nextMission === -1 ? html.indexOf("\n \n]}", start) : nextMission;
  const mission = html.slice(start, end === -1 ? undefined : end);
  assert.ok(mission.includes('layout:12'), 'The mission must use map layout 12');
  assert.ok(html.includes('mapLayout=Number.isInteger(sc.layout)?sc.layout:0;if(mapLayout)applyMapLayout()'),
    'Starting a mission must apply its specific map layout');
  assert.ok(mission.includes("t:'Build a Dock'"), 'The mission must require a coastal dock');
  assert.ok(mission.includes("t:'Have 3 War Galleys alive'"), 'The mission must require a functioning fleet');
  assert.ok(mission.includes("t:'Build 2 completed Towers'"), 'The mission must require defended land approaches');
  assert.ok(mission.includes("for(const gy of [.34,.42,.66])"), 'The rival must start with a galley patrol positioned along the strait');
  assert.ok(html.includes("n:'The Causeway Campaign',ids:[16,17]"), 'The mission must be included in natural campaign progression');
});

test('Iron Pass requires an actual delivered royal wagon in addition to all original defences',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+';startScenario(18)',sandbox);
 const goals=vm.runInContext("CAMP[18].goals.map(g=>({id:g.id,optional:!!g.optional,sustained:!!g.sustained}))",sandbox);
 assert.deepEqual(JSON.parse(JSON.stringify(goals)),[
  {id:'towers',optional:false,sustained:true},
  {id:'army',optional:false,sustained:true},
  {id:'hold',optional:false,sustained:false},
  {id:'convoy',optional:false,sustained:false}
 ],'the delivery is a fourth mandatory goal and the towers must remain standing');
 assert.equal(vm.runInContext("CAMP[18].ev.filter(e=>e.at<=440).length",sandbox),5,
  'the four original raids and introductory event remain untouched');
 assert.equal(vm.runInContext("CAMP[18].ev.filter(e=>e.at>=475).length",sandbox),2,
  'the dispatched wagons and enemy pursuit add real late-campaign encounters');
 assert.equal(vm.runInContext("CAMP[18].goals.find(g=>g.id==='convoy').ok()",sandbox),false,
  'no invented delivery can be recorded at mission start');
});

test('Iron Pass is reachable in the Northern March and campaign arcs contain valid mission IDs', () => {
  assert.ok(html.includes("n:'Northern March',ids:[15,18]"),
    'Iron Pass must be reachable in the Northern March arc');
});

test('final Causeway campaign mission requires forward Castles and a decisive Town Centre assault', () => {
  const start = html.indexOf("{t:'The Crown Holds the Crossing'");
  assert.notEqual(start, -1, 'The final Causeway mission must exist');
  const nextMission = html.indexOf("{t:", start + 1);
  const end = nextMission === -1 ? html.indexOf("const campDone=()", start) : nextMission;
  const mission = html.slice(start, end === -1 ? undefined : end);
  assert.ok(mission.includes('layout:12'), 'The mission must use the Causeway layout');
  assert.ok(mission.includes("t:'Build 2 completed Castles'"), 'The mission must require forward fortifications');
  assert.ok(mission.includes("t:'Destroy the enemy Town Centre'"), 'The mission must require a decisive assault');
  assert.ok(mission.includes("at:260,do:()=>raid(7,['ram','ram','bomb'"), 'The mission must include a timed heavy-siege counterattack');
  assert.ok(html.includes("n:'The Causeway Campaign',ids:[16,17]"), 'The final mission must be reachable in campaign progression');
});

test('First Hearth live tutorial A/RT instructions agree with controller release semantics',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source,sandbox);
 const guidance=Array.from(vm.runInContext(
  "CAMP[0].ev.slice(0,3).map(event=>{notes.length=0;event.do();return notes.at(-1)?.s})",
  sandbox));
 assert.match(guidance[0],/left stick.*reticle.*press A to select/i,'first tutorial describes camera panning and centre-reticle selection');
 assert.doesNotMatch(guidance[0],/move the cursor with the left stick/i,'ordinary gameplay must not describe the overview cursor');
 assert.match(guidance[1],/aim at a tree and press A to send them chopping/);
 assert.match(guidance[2],/Hold RT for the command menu/);
 assert.doesNotMatch(guidance.join(' '),/press X to (chop|gather)/i);
 vm.runInContext(`
   mode='play';S={us:[],bs:[],sel:[],vp:createVillagerPriority()};
   pad={axes:[0,0,0,0],buttons:[]};clampCam=()=>{};
   cur={x:100,y:100};globalThis.tapCount=0;tapA=()=>{globalThis.tapCount++};
   E=[];P=[];RE=[];E[0]=P[0]=true;playCtl(0);
   E=[];P=[];RE=[];RE[0]=true;playCtl(0);
 `,sandbox);
 assert.equal(sandbox.tapCount,1,'the world A press and release invokes the contextual action');
 vm.runInContext(`
   E=[];P=[];RE=[];E[2]=P[2]=true;playCtl(0);
   E=[];P=[];RE=[];RE[2]=true;playCtl(0);
 `,sandbox);
 assert.equal(sandbox.tapCount,1,'X alone does not substitute for the A gathering gesture');
});

test('Iron Pass starts with enough legal housing and retains all four genuine victory goals',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+"\nstartScenario(18);",sandbox);
 const verify=()=>vm.runInContext('({houses:S.bs.filter(b=>b&&b.t===0&&b.k==="house"&&b.done&&b.hp>0).length,population:popOf(0),capacity:capOf(0),soldiers:cmil(0),goals:CAMP[18].goals.map(g=>g.id),raids:CAMP[18].ev.length,aiWaveAt:S.ai[1].nx,aiRaidAt:S.ai[1].rn})',sandbox);
 const first=verify();
 assert.equal(first.houses,2,'campaign has two completed support Houses at its starting camp');
 assert.ok(first.capacity>=first.population,'starting defenders must not be blocked by housing shortage');
 assert.equal(first.soldiers,14,'opening garrison remains six spears, six archers and two scouts');
 assert.deepEqual(Array.from(first.goals),['towers','army','hold','convoy'],'the original three victory conditions and the physical supply convoy are required');
 assert.equal(first.raids,7,'the original four enemy assaults and introduction remain, alongside convoy dispatch and pursuit');
 assert.ok(first.aiWaveAt>540&&first.aiRaidAt>540,
  'scripted siege waves must not be doubled by the normal AI before the hold goal');
 vm.runInContext('startScenario(18)',sandbox);
 const repeat=verify();
 assert.equal(repeat.houses,2,'mission retry must build the same starting camp, not stack free Houses');
 assert.equal(repeat.soldiers,14,'retry must restore every supplied opening defender');
});

test('King’s Road starts with a genuine stone shortfall, not two free Towers',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nstartScenario(10)',sandbox);
 const actual=vm.runInContext('({stone:S.res[0].s,towerStone:B.tower.cost.s,market:!!B.market,goals:CAMP[10].goals.map(x=>x.id),towers:S.bs.filter(b=>b.t===0&&b.k==="tower"&&b.hp>0).length,raids:CAMP[10].ev.length})',sandbox);
 assert.equal(actual.stone,150,'mission must start with its defined 150 stone');
 assert.equal(actual.towerStone,100,'real tower price is charged per building');
 assert.ok(actual.stone<2*actual.towerStone,'the second tower must be funded by mining/trading');
 assert.equal(actual.towers,0,'the mission does not grant pre-built towers');
 assert.deepEqual(Array.from(actual.goals),['roadmarket','roadtowers','roadtime','roadsupply']);
 assert.equal(actual.raids,4,'three original raids remain alongside the paid roadworks contract');
});

test('Northern Watch retains three real raids and requires living ranged defenders',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nstartScenario(6)',sandbox);
 const state=vm.runInContext('({age:S.age[0],resources:{...S.res[0]},goals:CAMP[6].goals.map(g=>g.id),timedRaids:CAMP[6].ev.filter(e=>e.at!==undefined).length,events:CAMP[6].ev.length,sustained:CAMP[6].goals.filter(g=>g.sustained).map(g=>g.id),optional:CAMP[6].goals.filter(g=>g.optional).map(g=>g.id),towers:S.bs.filter(b=>b.t===0&&b.k==="tower"&&b.hp>0).length,rangeRequires:B.rng.req,skirmisherRange:U.skirm.rng,spearBonus:U.spear.bn.scout})',sandbox);
 assert.equal(state.age,1,'Feudal Age is the playable starting age');
 assert.deepEqual({...state.resources},{f:600,w:600,g:250,s:150},
  'the campaign starts with its original resources, not gifted troops or extra gold');
 assert.deepEqual(Array.from(state.goals),['t','a','s','beacon'],'all original victory objectives remain alongside the optional forward beacon');
 assert.equal(state.timedRaids,3,'all three original attack waves remain scheduled');
 assert.equal(state.events,4,'the only extra event is conditional one-time royal beacon relief');
 assert.deepEqual(Array.from(state.sustained),['t','a'],'the Watch Tower and ranged garrison must survive to the final relief signal');
 assert.deepEqual(Array.from(state.optional),['beacon'],'the forward beacon cannot hold victory hostage');
 assert.equal(state.towers,0,'players must pay and build their own Watch Tower');
 assert.equal(state.rangeRequires,'bar','a Barracks precedes a legal Archery Range');
 assert.ok(state.skirmisherRange>=4,'paid Skirmishers fulfil the real ranged-unit goal');
 assert.ok(state.spearBonus>0,'Spearmen counter the attacking Scout Cavalry');
});

test('Kronburg places its declared rams and escort on reachable, unoccupied starting tiles',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nstartScenario(4)',sandbox);
 const state=vm.runInContext('({player:Object.fromEntries(["ram","spear","arc","knight"].map(k=>[k,S.us.filter(u=>u&&u.t===0&&u.k===k&&u.hp>0).length])),enemyArmy:S.us.filter(u=>u&&u.t===1&&u.k!=="vil"&&u.hp>0).length,objectives:CAMP[4].goals.map(g=>g.id),enemyCastle:S.bs.filter(b=>b&&b.t===1&&b.k==="castle"&&b.hp>0).length,enemyTown:S.bs.filter(b=>b&&b.t===1&&b.k==="tc"&&b.hp>0).length,positions:S.us.filter(u=>u&&u.t===0&&["ram","spear","arc","knight"].includes(u.k)&&u.hp>0).map(u=>[Math.floor(u.x),Math.floor(u.y)])})',sandbox);
 assert.deepEqual({...state.player},{ram:3,spear:8,arc:8,knight:4},
  'normal scenario start must not silently drop the archer and cavalry escort');
 assert.equal(new Set(Array.from(state.positions,p=>p.join(','))).size,23,
  'all 23 supplied soldiers occupy distinct starting tiles');
 assert.deepEqual(Array.from(state.objectives),['c','t','flanks'],
  'the Castle and Town Centre remain required and flank sabotage is an optional pre-breach tactical objective');
 assert.equal(vm.runInContext("CAMP[4].goals.find(g=>g.id==='flanks').optional",sandbox),true,
  'the optional enemy Tower objective cannot hold a real victory hostage');
 assert.equal(state.enemyCastle,1,'the original enemy Castle stays intact at start');
 assert.equal(state.enemyTown,1,'the original enemy Town Centre stays intact at start');
 assert.ok(state.enemyArmy>=10,'the original garrison is preserved');
});

test('The Last Crown is a symmetric Castle Age Regicide scenario, not a gifted win',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nstartScenario(5)',sandbox);
 const initial=vm.runInContext('({mode:vm,ages:S.age.slice(0,2),resources:S.res.slice(0,2).map(r=>({...r})),goals:CAMP[5].goals.map(g=>g.id),kings:[0,1].map(t=>S.us.filter(u=>u&&u.t===t&&u.k==="king"&&u.hp>0).length),towns:[0,1].map(t=>S.bs.filter(b=>b&&b.t===t&&b.k==="tc"&&b.hp>0).length),progress:campDone()[5]||0})',sandbox);
 assert.equal(initial.mode,3,'Regicide mode remains enabled for the finale');
 assert.deepEqual(Array.from(initial.ages),[2,2],'both claimants start in Castle Age');
 assert.deepEqual({...initial.resources[0]},{...initial.resources[1]},
  'both claimants receive identical starting resources');
 assert.deepEqual({...initial.resources[0]},{f:800,w:1200,g:500,s:150},
  'the opening budget is fixed and does not grow by hidden cheats');
 assert.deepEqual(Array.from(initial.goals),['k'],'the real enemy-King objective is unchanged');
 assert.deepEqual(Array.from(initial.kings),[1,1],'both Kings begin alive');
 assert.deepEqual(Array.from(initial.towns),[1,1],'both Town Centres begin intact');
 assert.equal(initial.progress,0,'starting the scenario cannot award a campaign completion');
 assert.match(source,/if\(vm&&!\(cmp&&cmp\.i===5\)\)vict\(dt\)/,
  'mission objective tracking must not be pre-empted by the generic Regicide result');
});

test('Ashford fields all declared initial soldiers without weakening enemy fortifications',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nstartScenario(8)',sandbox);
 const state=vm.runInContext('({player:Object.fromEntries(["knight","arc","ram"].map(k=>[k,S.us.filter(u=>u&&u.t===0&&u.k===k&&u.hp>0).length])),positions:S.us.filter(u=>u&&u.t===0&&["knight","arc","ram"].includes(u.k)&&u.hp>0).map(u=>[Math.floor(u.x),Math.floor(u.y)]),goal:CAMP[8].goals.map(g=>g.id),town:S.bs.filter(b=>b&&b.t===1&&b.k==="tc"&&b.hp>0).length,castle:S.bs.filter(b=>b&&b.t===1&&b.k==="castle"&&b.hp>0).length,towers:S.bs.filter(b=>b&&b.t===1&&b.k==="tower"&&b.hp>0).length,resources:{...S.res[0]},workshop:S.bs.filter(b=>b&&b.t===0&&b.k==="siege"&&b.hp>0).length})',sandbox);
 assert.deepEqual({...state.player},{knight:6,arc:10,ram:3},
  'all 19 troops named in the mission setup must actually appear on the map');
 assert.equal(new Set(Array.from(state.positions,p=>p.join(','))).size,19,
  'starting army must occupy distinct, usable cells');
 assert.deepEqual(Array.from(state.goal),['castle','tc','signals'],
  'Ashford now requires breaching the real Castle and Town Centre; the signal towers remain an optional tactical objective');
 assert.equal(state.town,1,'the hostile Town Centre must be alive initially');
 assert.equal(state.castle,1,'the hostile Castle must not be removed or weakened');
 assert.equal(state.towers,2,'both defensive Towers remain intact');
 assert.deepEqual({...state.resources},{f:900,w:900,g:700,s:500},
  'all additional reinforcements must use the real starting budget or gathering');
 assert.equal(state.workshop,0,'the player must construct and pay for the Siege Workshop');
});

test('Greywatch spawns its full declared army and keeps the enemy stronghold intact',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nstartScenario(9)',sandbox);
 const state=vm.runInContext('({army:Object.fromEntries(["knight","arc","ram"].map(k=>[k,S.us.filter(u=>u&&u.t===0&&u.k===k&&u.hp>0).length])),positions:S.us.filter(u=>u&&u.t===0&&["knight","arc","ram"].includes(u.k)&&u.hp>0).map(u=>[Math.floor(u.x),Math.floor(u.y)]),town:S.bs.filter(b=>b&&b.t===1&&b.k==="tc"&&b.hp>0).length,castle:S.bs.filter(b=>b&&b.t===1&&b.k==="castle"&&b.hp>0).length,towers:S.bs.filter(b=>b&&b.t===1&&b.k==="tower"&&b.hp>0).length,defenders:{spear:S.us.filter(u=>u&&u.t===1&&u.k==="spear"&&u.hp>0).length,arc:S.us.filter(u=>u&&u.t===1&&u.k==="arc"&&u.hp>0).length},goal:CAMP[9].goals.map(g=>g.id)})',sandbox);
 assert.deepEqual({...state.army},{knight:5,arc:8,ram:2},'all fifteen declared starting troops must spawn');
 assert.equal(new Set(Array.from(state.positions,p=>p.join(','))).size,15,'starting troops must occupy separate cells');
 assert.equal(state.town,1,'enemy Town Centre must remain intact at mission start');
 assert.equal(state.castle,1,'the Castle remains a real defensive obstacle');
 assert.equal(state.towers,1,'the defending Tower must remain intact');
 assert.ok(state.defenders.spear>0&&state.defenders.arc>0,'enemy pikes and archers must remain real battlefield threats');
 assert.deepEqual(Array.from(state.goal),['castle','greywatch','relay'],
  'the Castle and Town Centre are mandatory, and early relay sabotage remains optional');
 assert.equal(vm.runInContext("CAMP[9].goals.find(g=>g.id==='relay').optional",sandbox),true);
});

test('nineteen campaigns have unique playable mission names and deterministic mission seeds',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source,sandbox);
 const missions=Array.from(vm.runInContext('CAMP.map(m=>({title:m.t,seed:m.seed}))',sandbox),
  m=>({title:m.title,seed:m.seed}));
 assert.equal(missions.length,19);
 assert.ok(missions.every(m=>typeof m.title==='string'&&m.title.trim()===m.title&&m.title.length>0),'titles must not be blank or padded');
 assert.equal(new Set(missions.map(m=>m.title)).size,missions.length,'campaign menu must distinguish all missions by name');
 assert.ok(missions.every(m=>Number.isSafeInteger(m.seed)&&m.seed>0),'mission seeds are deterministic positive integers');
 assert.equal(missions[3].title,'The Relic Road','original relic mission keeps its title');
 assert.equal(missions[11].title,'The Reliquary Trail','the second relic mission is distinguishable');
});

test('coastal campaign maps retain legal land-reachable Dock sites after exploration',()=>{
 for(const index of [12,16]){
  const {source,sandbox}=headlessGame();
  vm.createContext(sandbox);
  vm.runInContext(source+'\nstartScenario('+index+')',sandbox);
  const result=vm.runInContext(`(()=>{
   const home=tcOf(0),workers=S.us.filter(u=>u&&u.t===0&&u.k==='vil'&&u.hp>0&&!u.ld);
   const water=campaignWaterRegions(),size=B.dock.s,oldExplored=S.ex;
   if(!home||!workers.length)return {error:'missing home centre or live workers'};
   let visible=0;
   for(let y=1;y<H-size;y++)for(let x=1;x<W-size;x++)
    if(okPlace(0,'dock',x,y)&&campaignDockAccess(x,y,size,water,4))visible++;
   S.ex=new Uint8Array(W*H).fill(1); // Diagnostic only: this does NOT complete any campaign objective.
   const candidates=[];
   for(let y=1;y<H-size;y++)for(let x=1;x<W-size;x++){
    if(!okPlace(0,'dock',x,y)||!campaignDockAccess(x,y,size,water,4))continue;
    candidates.push({x,y,d:Math.hypot(x-home.x,y-home.y)});
   }
   candidates.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x);
   let found=null,routeChecks=0;
   for(const site of candidates.slice(0,120)){
    const building={x:site.x,y:site.y,s:size};
    for(const worker of workers){
     routeChecks++;
     if(path(worker,goalNear(building,1))){found=site;break}
    }
    if(found)break;
   }
   S.ex=oldExplored;
   return {visible,legal:candidates.length,reachable:found&&{x:found.x,y:found.y},
    routeChecks,workers:workers.length};
  })()`,sandbox,{timeout:20000});
  console.log('campaign-dock-feasibility: mission '+(index+1)+' '+JSON.stringify(result));
  assert.ok(result.legal>0,'mission '+(index+1)+' must have a legally buildable explored-water Dock footprint: '+JSON.stringify(result));
  assert.ok(result.reachable,'mission '+(index+1)+' must have a land-worker-accessible Dock near usable water: '+JSON.stringify(result));
 }
});

// Explicit scenario rosters are independent expectations; no injected troops or
// altered setup functions can make a truncated army pass these runtime checks.
test('campaign overflow preserves the declared late-campaign armies for both kingdoms',()=>{
 const rosters=[
  [12,{spear:6,arc:5},{spear:7,arc:5,ram:2}],
  [13,{mon:2,spear:7,arc:6},{spear:7,arc:6}],
  [14,{knight:5,xbow:10,spear:6,ram:2},{knight:6,xbow:8,bomb:2}],
  [15,{mil:6,spear:6,arc:7},{spear:6,arc:5}],
  [16,{knight:4,spear:6,arc:8,ram:2},{knight:5,spear:6,arc:8,ram:2}],
  [17,{knight:6,xbow:10,spear:8,bomb:2},{knight:6,xbow:8,spear:6,ram:2,bomb:1}]
 ];
 for(const [mission,...armies] of rosters){
  const {source,sandbox}=headlessGame();vm.createContext(sandbox);
  vm.runInContext(source+'\nstartScenario('+mission+')',sandbox);
  const result=JSON.parse(vm.runInContext(`JSON.stringify([0,1].map(team=>{
   const troops=S.us.filter(u=>u.t===team&&u.hp>0&&!u.ld&&!U[u.k].sh&&u.k!=='vil');
   const worker=S.us.find(u=>u.t===team&&u.k==='vil'&&u.hp>0);
   return {counts:Object.fromEntries([...new Set(troops.map(u=>u.k))].map(k=>[k,troops.filter(u=>u.k===k).length])),
    distinct:new Set(troops.map(u=>(u.y|0)*W+(u.x|0))).size,
    total:troops.length,valid:troops.every(u=>!S.g[(u.y|0)*W+(u.x|0)]&&S.wt[(u.y|0)*W+(u.x|0)]!==1&&!S.nd[(u.y|0)*W+(u.x|0)]),
    reachable:troops.every(u=>!!path(worker,gp(u.x,u.y,.75)))}
  }))`,sandbox,{timeout:15000}));
  for(const [team,expected] of armies.entries()){
   const state=result[team],label='mission '+(mission+1)+' team '+team;
   assert.deepEqual(state.counts,expected,label+' receives every declared land troop');
   assert.equal(state.distinct,state.total,label+' has no overlapping troop cells');
   assert.equal(state.valid,true,label+' starts on usable land');
   assert.equal(state.reachable,true,label+' remains reachable from its settlement');
  }
  const roundTrip=vm.runInContext(`(()=>{
   const before=JSON.stringify(S.us.map(u=>[u.netId,u.t,u.k,u.x,u.y,u.hp]));
   const saved=saveG(),loaded=loadG();
   return {saved,loaded,same:before===JSON.stringify(S.us.map(u=>[u.netId,u.t,u.k,u.x,u.y,u.hp]))};
  })()`,sandbox);
  assert.equal(roundTrip.saved,true,'expanded army can be saved');
  assert.equal(roundTrip.loaded,true,'current-build expanded army can be restored');
  assert.equal(roundTrip.same,true,'reload preserves every original troop and position');
 }
});

test('overflow is campaign-only and stops when no usable cells remain',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\nglobalThis.run=code=>eval(code);startScenario(18)',sandbox);
 const ordinary=JSON.parse(sandbox.run(`(()=>{
  const home=tcOf(0);cmp=null;
  for(let i=0;i<100;i++){const p=spawnPos(home);if(!p)break;addU(0,'mil',p[0],p[1])}
  const before=S.us.length;grp(0,'mil',3);
  return JSON.stringify({blocked:spawnPos(home)===null,before,after:S.us.length});
 })()`));
 assert.equal(ordinary.blocked,true,'test actually fills the normal production perimeter');
 assert.equal(ordinary.after,ordinary.before,'ordinary skirmish groups cannot use campaign overflow');
 const full=JSON.parse(sandbox.run(`(()=>{
  cmp={i:18};S.g.fill(1);const before=S.us.length;grp(0,'mil',3);
  return JSON.stringify({before,after:S.us.length});
 })()`));
 assert.equal(full.after,full.before,'an exhausted campaign stops instead of stacking troops or clearing terrain');
});

function constructionFixture(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n'+campaignConstruction+`
  startScenario(0);S.age[0]=2;
  globalThis.builder=createCampaignBuilder(tcOf(0));
  globalThis.observed=[];
  const originalAddB=addB;
  addB=(team,kind,x,y,done)=>{
   if(team===0)observed.push({kind,lock:bLock(kind),time:S.t});
   return originalAddB(team,kind,x,y,done);
  };
  globalThis.run=code=>eval(code);
 `,sandbox);
 return sandbox.run;
}

test('scripted construction pays for and completes the full player prerequisite chain',()=>{
 const run=constructionFixture();
 const first=JSON.parse(run(`(()=>{
  const before={...S.res[0]},placed=builder.place('univ');
  const after={...S.res[0]},again=builder.place('univ');
  return JSON.stringify({placed,again,before,after,afterRetry:S.res[0],kinds:builder.orders.map(o=>o.kind)});
 })()`));
 assert.equal(first.placed,true,'University request starts its real Barracks dependency');
 assert.equal(first.again,false,'an unfinished prerequisite blocks further foundations');
 assert.deepEqual(first.kinds,['bar']);
 assert.equal(first.after.w,first.before.w-150,'only the Barracks price is paid first');
 assert.deepEqual(first.afterRetry,first.after,'retry cannot spend again while construction is active');
 const completed=JSON.parse(run(`(()=>{
  let peakFoundations=0;
  for(let tick=0;tick<9000&&!S.bs.some(b=>b.t===0&&b.k==='univ'&&b.hp>0&&b.done);tick++){
   if(tick%30===0)builder.place('univ');
   step(1/30);
   peakFoundations=Math.max(peakFoundations,S.bs.filter(b=>b.t===0&&b.hp>0&&!b.done).length);
  }
  return JSON.stringify({done:S.bs.some(b=>b.t===0&&b.k==='univ'&&b.done&&b.hp>0),
   orders:builder.orders,observed,peakFoundations,resources:S.res[0]});
 })()`));
 assert.equal(completed.done,true,'the real worker finishes University through production simulation');
 assert.deepEqual(completed.orders.map(o=>o.kind),['bar','smith','univ']);
 assert.deepEqual(completed.orders.map(o=>o.prerequisite),[null,'bar','smith']);
 assert.ok(completed.orders.slice(1).every(o=>typeof o.prerequisiteId==='string'),'orders identify completed owned prerequisites');
 assert.ok(completed.observed.every(o=>o.lock===''),'every actual foundation is legal under the production player menu');
 assert.equal(completed.peakFoundations,1,'serial construction remains intact');
 assert.equal(completed.resources.w,100,'Barracks, Blacksmith and University each charge their full wood cost');
 assert.equal(completed.resources.s,50,'University charges its real stone cost');
});

test('scripted construction cannot unlock parents through dead, hostile or unfinished prerequisites',()=>{
 for(const state of ['dead','hostile','unfinished','complete']){
  const run=constructionFixture();
  const result=JSON.parse(run(`(()=>{
   const dependency=addB(${state==='hostile'?1:0},'bar',2,2,${state!=='unfinished'});
   ${state==='dead'?'dependency.hp=0;':''}
   observed.length=0;const before={...S.res[0]},placed=builder.place('monastery');
   return JSON.stringify({placed,before,after:S.res[0],orders:builder.orders,observed});
  })()`));
  if(state==='unfinished'){
   assert.equal(result.placed,false);
   assert.deepEqual(result.after,result.before,'unfinished Barracks cannot spend the Monastery budget');
   assert.equal(result.orders.length,0);
  }else{
   assert.equal(result.placed,true);
   assert.deepEqual(result.orders.map(o=>o.kind),[state==='complete'?'monastery':'bar'],state+' prerequisite policy');
   assert.ok(result.observed.every(o=>o.lock===''),state+' never bypasses the real player gate');
  }
 }
});

test('blocked scripted orders preserve resources and never create unpaid foundations',()=>{
 const cases=[
  ["S.age[0]=0",'siege'],
  ["S.res[0].w=0",'monastery'],
  ["for(const u of S.us)if(u.t===0&&u.k==='vil')u.ld={}",'monastery'],
  ["S.ex.fill(0)",'monastery'],
  ["vm=0",'wonder'],
  ["vm=6",'tc',2],
  ["B.bar.req='siege'",'siege'],
  ['', 'missing']
 ];
 for(const [setup,kind,count=1] of cases){
  const run=constructionFixture();
  const result=JSON.parse(run(`(()=>{
   ${setup};const before={...S.res[0]},count=S.bs.length,placed=builder.place('${kind}',${count});
   return JSON.stringify({placed,before,after:S.res[0],count,afterCount:S.bs.length});
  })()`));
  assert.equal(result.placed,false,setup+' blocks '+kind);
  assert.deepEqual(result.after,result.before,setup+' never spends on a blocked '+kind);
  assert.equal(result.afterCount,result.count,setup+' never places an illegal foundation');
 }
});

test('over-cap campaign armies fund enough real Houses before training reinforcements',()=>{
 const run=constructionFixture();
 run("for(let i=0;i<23;i++)addU(0,'mil',20+i%6,20+Math.floor(i/6))");
 const before=JSON.parse(run('JSON.stringify({population:popOf(0),capacity:capOf(0),wood:S.res[0].w})'));
 assert.equal(before.population,28);assert.equal(before.capacity,10);
 const after=JSON.parse(run(`(()=>{
  for(let tick=0;tick<9000&&capOf(0)<30;tick++){
   if(tick%30===0)builder.houseFor(2);
   step(1/30);
  }
  const wood=S.res[0].w,extra=builder.houseFor(2);
  return JSON.stringify({capacity:capOf(0),wood,afterRetry:S.res[0].w,extra,
    orders:builder.orders.map(o=>o.kind),legal:observed.every(o=>!o.lock)});
 })()`));
 assert.equal(after.capacity,30,'four completed Houses support the army plus two reinforcements');
 assert.equal(after.wood,before.wood-100,'all four Houses consume their real 25-wood cost');
 assert.deepEqual(after.orders,['house','house','house','house']);
 assert.equal(after.legal,true,'every House uses the live player construction gate');
 assert.equal(after.extra,false,'adequate capacity never starts an unnecessary fifth House');
 assert.equal(after.afterRetry,after.wood,'retry cannot spend beyond the actual deficit');
});

test('campaign housing counts queued population and respects the configured maximum',()=>{
 const run=constructionFixture();
 assert.equal(run("train(tcOf(0),'vil')&&train(tcOf(0),'vil')&&train(tcOf(0),'vil')"),true);
 const ready=JSON.parse(run(`JSON.stringify({population:popOf(0),built:builder.houseFor(2),orders:builder.orders.length})`));
 assert.equal(ready.population,8,'three paid queue reservations count alongside five live workers');
 assert.equal(ready.built,false,'two more slots fit in the existing capacity');
 assert.equal(ready.orders,0);
 assert.equal(run('builder.houseFor(3)'),true,'a ninth through eleventh planned population needs a paid House');
 assert.equal(run('S.res[0].w'),575);
 for(const slots of [0,-1,1.5,NaN,Infinity])assert.equal(run('builder.houseFor('+String(slots)+')'),false);
 const capped=constructionFixture();
 assert.equal(capped('popLimit=10;builder.houseFor(20)'),false,'houses cannot grow the configured cap');
 assert.equal(capped('builder.orders.length'),0);
 assert.equal(capped('S.res[0].w'),600,'a hard cap never wastes the starting wood');
});

test('a maintained objective remains live when its display wording changes',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+`;startScenario(0);globalThis.goal=CAMP[0].goals.find(g=>g.id==='v');
 while(cu('vil')<10)addU(0,'vil',tcOf(0).x+5,tcOf(0).y+5);
 for(let i=0;i<15;i++)cmpTick(1/30);`,sandbox);
 assert.equal(vm.runInContext('cmp.d.v',sandbox),1,'ten living villagers complete the real predicate');
 vm.runInContext("goal.t='Maintain the village population';S.us.find(u=>u.t===0&&u.k==='vil').hp=0;for(let i=0;i<15;i++)cmpTick(1/30)",sandbox);
 assert.equal(vm.runInContext('cmp.d.v',sandbox),0,'losing a villager must restore the requirement after a wording edit');
 vm.runInContext("addU(0,'vil',tcOf(0).x+5,tcOf(0).y+5);for(let i=0;i<15;i++)cmpTick(1/30)",sandbox);
 assert.equal(vm.runInContext('cmp.d.v',sandbox),1,'restoring the live count completes it again');
});

test('a completed one-time objective stays recorded when its wording starts with Have',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+`;startScenario(0);globalThis.house=addB(0,'house',tcOf(0).x+8,tcOf(0).y+8,true);
 for(let i=0;i<15;i++)cmpTick(1/30);`,sandbox);
 assert.equal(vm.runInContext('cmp.d.h',sandbox),1);
 vm.runInContext("CAMP[0].goals.find(g=>g.id==='h').t='Have built a House';house.hp=0;for(let i=0;i<15;i++)cmpTick(1/30)",sandbox);
 assert.equal(vm.runInContext('cmp.d.h',sandbox),1,'a completed construction milestone does not turn into a maintained goal');
});
test('campaign milestones stay one-shot except explicit Blackwood living fortifications and existing sustained goals',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+';globalThis.liveGoals=CAMP.flatMap((sc,i)=>sc.goals.filter(g=>g.sustained===true).map(g=>[i,g.id]));',sandbox);
 assert.deepEqual(JSON.parse(JSON.stringify(sandbox.liveGoals)),[[0,'v'],[3,'r'],[6,'t'],[6,'a'],[11,'relics'],[12,'fleet'],[12,'army'],[13,'relics'],[15,'tower'],[15,'wall'],[16,'fleet'],[18,'towers'],[18,'army']]);
});

test('scripted construction resumes the same paid foundation after its builder is lost',()=>{
 const run=constructionFixture();run("builder.place('house');globalThis.foundation=S.bs.find(b=>b.t===0&&b.k==='house'&&!b.done);globalThis.original=S.us.find(u=>u.o==='b'&&u.tg===foundation);original.hp=0;globalThis.paid=JSON.stringify(S.res[0]);globalThis.count=S.bs.length");
 assert.equal(run("builder.place('lumber')"),false,'finish the existing foundation before placing another building');
 assert.equal(run("S.us.some(u=>u.hp>0&&u.o==='b'&&u.tg===foundation)"),true,'another living worker resumes the real foundation');
 run('for(let i=0;i<2400&&!foundation.done;i++)step(1/30)');
 assert.equal(run('foundation.done'),true);assert.equal(run('JSON.stringify(S.res[0])===paid'),true,'resuming never charges the construction cost twice');
 assert.equal(run('S.bs.length'),run('count'));assert.equal(run('builder.orders.length'),1);
});
test('scripted construction respects Town Bell reservations and resumes after unloading',()=>{
 const waiting=constructionFixture();waiting('townBell(0);globalThis.before=JSON.stringify(S.res[0])');
 assert.equal(waiting("builder.place('house')"),false,'new construction cannot steal a reserved worker');
 assert.equal(waiting('JSON.stringify(S.res[0])===before'),true);assert.equal(waiting('builder.orders.length'),0);
 const run=constructionFixture();run("builder.place('house');globalThis.foundation=S.bs.find(b=>b.t===0&&b.k==='house'&&!b.done);globalThis.paid=JSON.stringify(S.res[0]);townBell(0)");
 assert.equal(run("builder.place('house')"),false);
 assert.equal(run("S.us.some(u=>u.o==='b'&&u.tg===foundation)"),false,'do not steal workers en route to shelter');
 run("for(let i=0;i<1200;i++)step(1/30);unload(tcOf(0));builder.place('house')");
 assert.equal(run("S.us.some(u=>u.o==='b'&&u.tg===foundation)"),true);
 run('for(let i=0;i<2400&&!foundation.done;i++)step(1/30)');
 assert.equal(run('foundation.done'),true);assert.equal(run('JSON.stringify(S.res[0])===paid'),true);assert.equal(run('builder.orders.length'),1);
});
