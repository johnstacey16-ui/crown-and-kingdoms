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
