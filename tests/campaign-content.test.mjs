import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

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
  assert.ok(mission.includes("at:260,do:()=>raid(9,['ram','ram','bomb'"), 'The mission must include a timed heavy-siege counterattack');
  assert.ok(html.includes("n:'The Causeway Campaign',ids:[16,17]"), 'The final mission must be reachable in campaign progression');
});

test('First Hearth live tutorial A/RT instructions agree with controller release semantics',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source,sandbox);
 const guidance=Array.from(vm.runInContext(
  "CAMP[0].ev.slice(0,3).map(event=>{notes.length=0;event.do();return notes.at(-1)?.s})",
  sandbox));
 assert.match(guidance[0],/press A on a villager to select it/);
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

test('Iron Pass starts with enough legal housing for its supplied garrison, without changing win goals',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+"\nstartScenario(18);",sandbox);
 const verify=()=>vm.runInContext('({houses:S.bs.filter(b=>b&&b.t===0&&b.k==="house"&&b.done&&b.hp>0).length,population:popOf(0),capacity:capOf(0),soldiers:cmil(0),goals:CAMP[18].goals.map(g=>g.id),raids:CAMP[18].ev.length,aiWaveAt:S.ai[1].nx,aiRaidAt:S.ai[1].rn})',sandbox);
 const first=verify();
 assert.equal(first.houses,2,'campaign has two completed support Houses at its starting camp');
 assert.ok(first.capacity>=first.population,'starting defenders must not be blocked by housing shortage');
 assert.equal(first.soldiers,14,'opening garrison remains six spears, six archers and two scouts');
 assert.deepEqual(Array.from(first.goals),['towers','army','hold'],'all three real victory conditions remain');
 assert.equal(first.raids,5,'every original enemy attack wave is retained');
 assert.ok(first.aiWaveAt>540&&first.aiRaidAt>540,
  'scripted siege waves must not be doubled by the normal AI before the hold goal');
 assert.match(html,/cmp\?\.i===18&&t===0\?campaignOverflowSpawn\(tc\):null/,
  'additional campaign troop spawns must be limited to Iron Pass defenders');
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
 assert.deepEqual(Array.from(actual.goals),['roadmarket','roadtowers','roadtime']);
 assert.equal(actual.raids,3,'all three enemy attack events remain unchanged');
});

test('Northern Watch retains three real raids and requires living ranged defenders',()=>{
 const {source,sandbox}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\nstartScenario(6)',sandbox);
 const state=vm.runInContext('({age:S.age[0],resources:{...S.res[0]},goals:CAMP[6].goals.map(g=>g.id),raids:CAMP[6].ev.length,towers:S.bs.filter(b=>b.t===0&&b.k==="tower"&&b.hp>0).length,rangeRequires:B.rng.req,skirmisherRange:U.skirm.rng,spearBonus:U.spear.bn.scout})',sandbox);
 assert.equal(state.age,1,'Feudal Age is the playable starting age');
 assert.deepEqual({...state.resources},{f:600,w:600,g:250,s:150},
  'the campaign starts with its original resources, not gifted troops or extra gold');
 assert.deepEqual(Array.from(state.goals),['t','a','s'],'all actual Tower, live ranged and hold goals remain');
 assert.equal(state.raids,3,'all three original attack waves remain scheduled');
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
 assert.deepEqual(Array.from(state.objectives),['c','t'],
  'destroying the real Castle and Town Centre remains required');
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
 assert.deepEqual(Array.from(state.goal),['tc'],'the sole victory goal stays the enemy Town Centre');
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
 assert.deepEqual(Array.from(state.goal),['greywatch'],'only destroying the enemy Town Centre completes the mission');
});
