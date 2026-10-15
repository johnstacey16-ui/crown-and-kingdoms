import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

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
