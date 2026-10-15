import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const state = readFileSync(new URL('../js/state.js', import.meta.url), 'utf8');
const mapgen = readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8');
const audio = readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const engineSource = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const input = readFileSync(new URL('../js/input.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const kingdom = readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8');
const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');
const economy = readFileSync(new URL('../js/economy.js', import.meta.url), 'utf8');
const formations = readFileSync(new URL('../js/formations.js', import.meta.url), 'utf8');
const menus = readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8');
const engine = config + '\n' + state + '\n' + mapgen + '\n' + audio + '\n' + save + '\n' + input + '\n' + render + '\n' + ui + '\n' + simulation + '\n' + kingdom + '\n' + campaign + '\n' + economy + '\n' + formations + '\n' + menus + '\n' + engineSource;
const multiplayer = readFileSync(new URL('../multiplayer.js', import.meta.url), 'utf8');
const persistence = readFileSync(new URL('../persistence.js', import.meta.url), 'utf8');

test('the game loads its shared stylesheet from the same-origin root', () => {
  assert.match(html, /<link rel="stylesheet" href="\.\/styles\.css">/);
  assert.doesNotMatch(html, /<style>/);
  assert.match(html, /<canvas id="c" tabindex="0" role="application" aria-label="Crown &amp; Kingdoms real-time strategy game\. Use a connected game controller to play\."><\/canvas>/);
});

test('the presentation foundation preserves full-screen controller-first canvas rendering', () => {
  assert.match(css, /html,\s*body\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.match(css, /overscroll-behavior:\s*none/);
  assert.match(css, /touch-action:\s*none/);
  assert.match(css, /canvas\s*\{[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%/);
  assert.match(css, /canvas:focus-visible/);
});


test('the sprite atlas manifest is external JSON and loaded without blocking startup', () => {
  const manifest = readFileSync(new URL('../assets/atlas-manifest.json', import.meta.url), 'utf8');
  assert.doesNotThrow(() => JSON.parse(manifest));
  assert.match(engine, /fetch\('\.\/assets\/atlas-manifest\.json'/);
  assert.match(engine, /\.then\(pack=>\{if\(pack&&typeof pack==='object'\)loadAssetPack\(pack\)\}\)/);
  assert.doesNotMatch(html, /id="ck-assets"/);
});


test('the core engine is external and loads before multiplayer integration', () => {
  assert.ok(html.includes('<script src="./js/render.js"></script>'));
  assert.ok(html.includes('<script src="./js/ui.js"></script>'));
  assert.ok(html.indexOf('./js/render.js') < html.indexOf('./js/ui.js'));
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./js/simulation.js'));
  assert.ok(ui.includes('function drawPerfOverlay(dt)'));
  assert.ok(ui.includes('const ovr=()=>'));
  assert.ok(ui.includes('function drawOv()'));
  assert.ok(!engineSource.includes('function drawPerfOverlay(dt)'));
  assert.ok(!engineSource.includes('const ovr=()=>'));
  assert.ok(!engineSource.includes('function drawOv()'));
  assert.ok(ui.includes('function treeLines()'));
  assert.ok(ui.includes('function drawTree()'));
  assert.ok(ui.includes('function drawObj()'));
  assert.ok(ui.includes('function drawInfo2()'));
  assert.ok(!engineSource.includes('function treeLines()'));
  assert.ok(html.indexOf('./js/config.js') < html.indexOf('./js/state.js'));
  assert.ok(html.indexOf('./js/state.js') < html.indexOf('./js/mapgen.js'));
  assert.ok(html.indexOf('./js/mapgen.js') < html.indexOf('./js/audio.js'));
  assert.ok(html.indexOf('./js/audio.js') < html.indexOf('./js/save.js'));
  assert.ok(html.indexOf('./js/save.js') < html.indexOf('./js/input.js'));
  assert.ok(html.indexOf('./js/input.js') < html.indexOf('./engine.js'));
  assert.ok(html.indexOf('./engine.js') < html.indexOf('./multiplayer.js'));
  assert.ok(engine.length > 200000);
  assert.ok(render.startsWith('function drawWorld()'));
  assert.ok(render.includes('function drawUnit(u)'));
  assert.ok(render.includes('function drawRelic(q)'));
  assert.ok(render.includes('function paintTile(g,x,y,cx,cy)'));
  assert.ok(render.includes('function paintTileDetail(g,x,y,cx,cy)'));
  assert.ok(render.includes('function drawHill(o)'));
  assert.match(render, /Three overlapping rock planes/);
  assert.match(render, /Math\.sin\(gt\*4\)/);
  assert.ok(render.includes('function chunkOf(cx,cy)'));
  assert.ok(render.includes('function drawChunks(x0,x1,y0,y1)'));
  assert.ok(!engineSource.includes('function drawWorld()'));
  assert.ok(!engineSource.includes('function drawUnit(u)'));
  assert.ok(!engineSource.includes('function drawRelic(q)'));
  assert.ok(!engineSource.includes('function paintTile(g,x,y,cx,cy)'));
  assert.ok(!engineSource.includes('function paintTileDetail(g,x,y,cx,cy)'));
  assert.ok(!engineSource.includes('function drawHill(o)'));
  assert.ok(!engineSource.includes('function chunkOf(cx,cy)'));
  assert.ok(!engineSource.includes('function drawChunks(x0,x1,y0,y1)'));
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.ok(html.indexOf('./js/render.js') < html.indexOf('./js/simulation.js'));
  assert.ok(html.indexOf('./js/simulation.js') < html.indexOf('./js/kingdom.js'));
  assert.ok(html.indexOf('./js/kingdom.js') < html.indexOf('./js/campaign.js'));
  assert.ok(html.indexOf('./js/campaign.js') < html.indexOf('./js/economy.js'));
  assert.ok(html.indexOf('./js/economy.js') < html.indexOf('./js/formations.js'));
  assert.ok(html.indexOf('./js/formations.js') < html.indexOf('./js/menus.js'));
  assert.ok(html.indexOf('./js/menus.js') < html.indexOf('./engine.js'));
  assert.ok(menus.includes('const SCORE_LIMITS=[600,900,1200,1500,1800]'));
  assert.ok(menus.includes('function setupCtl()'));
  assert.ok(!engineSource.includes('const SCORE_LIMITS='));
  assert.ok(html.indexOf('./js/economy.js') < html.indexOf('./engine.js'));
  assert.ok(economy.includes('function mkTrades()'));
  assert.ok(economy.includes('function trade(t,k,md)'));
  assert.ok(!engineSource.includes('function mkTrades()'));
  assert.ok(html.indexOf('./js/campaign.js') < html.indexOf('./engine.js'));
  assert.ok(campaign.includes('function startScenario(i)'));
  assert.ok(campaign.includes('function cmpTick(dt)'));
  assert.ok(!engineSource.includes('const CAMP=['));
  assert.ok(html.indexOf('./js/kingdom.js') < html.indexOf('./engine.js'));
  assert.ok(kingdom.includes('function createDiplomacy(n,source=null)'));
  assert.ok(kingdom.includes('function sendTribute(from,to,resourceIndex,amount=100)'));
  assert.ok(kingdom.includes('function createVillagerPriority(source=null)'));
  assert.ok(kingdom.includes('function assignAutoVillager(u,force=false)'));
  assert.ok(!engineSource.includes('function createVillagerPriority(source=null)'));
  assert.ok(!engineSource.includes('const DIPLOMACY_STATES='));
  assert.ok(html.indexOf('./js/simulation.js') < html.indexOf('./engine.js'));
  assert.ok(simulation.includes('function step(dt)'));
  assert.ok(!engineSource.includes('function step(dt)'));
  assert.ok(multiplayer.length > 0);
  assert.doesNotMatch(html, /<script>\s*['"]use strict['"]/);
});


test('IndexedDB backs up saved slots without replacing the localStorage compatibility path', () => {
  assert.ok(html.indexOf('./persistence.js') < html.indexOf('./js/config.js'));
  assert.match(persistence, /indexedDB\.open\(DB_NAME, 1\)/);
  assert.match(persistence, /mirrorSave, restoreMissing/);
  assert.match(engine, /mirrorSave\(skey\(slot\),payload\)/);
  assert.match(engine, /restoreMissing\(\)\.then\(\(\)=>refreshSlots\(\)\)/);
  assert.match(engine, /localStorage\.setItem\(skey\(slot\),payload\)/);
});


test('audio resume attempts cannot create unhandled autoplay-policy rejections', () => {
  assert.match(engine, /AC\.resume\(\)\.catch\(\(\)=>\{\}\)/);
  assert.doesNotMatch(engine, /AC\.resume\(\)(?!\.catch)/);
});


test('offline shell caching stays same-origin and keeps online code updates fresh', () => {
  const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(engine, /navigator\.serviceWorker\.register\('\.\/sw\.js'/);
  assert.match(serviceWorker, /request\.method !== 'GET'/);
  assert.match(serviceWorker, /url\.origin !== self\.location\.origin/);
  assert.match(serviceWorker, /const networkFirst = request\.mode === 'navigate'/);
  assert.match(serviceWorker, /cache\.addAll\(CORE_ASSETS\)/);
});


test('offline cache can survive temporary hosting errors as well as network loss', () => {
  const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(serviceWorker, /return await cache\.match\(request\) \|\| response/);
  assert.match(serviceWorker, /const cached = await cache\.match\(request\);\s*if \(cached\) return cached/);
});


test('in-game About copy describes the real asset, audio and verification boundaries', () => {
  assert.match(engine, /Original local SVG sprite atlases, team colours, animation metadata and procedural fallbacks/);
  assert.match(engine, /Synthesised Web Audio with spatial effects, ambience and adaptive music/);
  assert.match(engine, /not full authoritative match synchronisation/);
  assert.match(engine, /Browser, live deployment and physical Xbox Series S testing are not yet verified/);
  assert.doesNotMatch(engine, /All art is drawn in code\. No external assets or network calls/);
});

test('unit equipment rendering reads technology state and exposes researched armour visually', () => {
  assert.match(render, /function drawUnit\(u\)\{const k=u\.k,d=U\[k\],T=S\.tech\[u\.t\]\|\|\{\}/);
  assert.match(render, /T\.armI&&INFARM\.has\(k\)/);
  assert.match(render, /T\.armR&&ARCHARM\.has\(k\)/);
  assert.match(render, /Blacksmith armour upgrades receive a small battlefield-visible cue/);
});

test('audio voice classification tolerates entities without unit definitions', () => {
  assert.match(audio, /\(U\[k\]&&U\[k\]\.mt\)\|\|\['scout','knight','camel','mgd','cata','mamel','ele','eled'\]\.includes\(k\)\?'cav'/);
});

test('game balance data is separated from runtime code and resize work is debounced', () => {
  assert.match(config, /const U=\{/);
  assert.match(config, /const B=\{/);
  assert.match(config, /const AG=\[/);
  assert.doesNotMatch(engineSource, /const U=\{|const B=\{|const AG=\[/);
  assert.match(engineSource, /clearTimeout\(resizeTimer\);resizeTimer=setTimeout\(rs,80\)/);
});
