import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const state = readFileSync(new URL('../js/state.js', import.meta.url), 'utf8');
const mapgen = readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8');
const audio = readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const input = readFileSync(new URL('../js/input.js', import.meta.url), 'utf8');
const render = readFileSync(new URL('../js/render.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const pathfinding = readFileSync(new URL('../js/pathfinding.js', import.meta.url), 'utf8');
const kingdom = readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8');
const entities = readFileSync(new URL('../js/entities.js', import.meta.url), 'utf8');
const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');
const economy = readFileSync(new URL('../js/economy.js', import.meta.url), 'utf8');
const formations = readFileSync(new URL('../js/formations.js', import.meta.url), 'utf8');
const menus = readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8');
const minimap = readFileSync(new URL('../js/minimap.js', import.meta.url), 'utf8');
const assets = readFileSync(new URL('../js/assets.js', import.meta.url), 'utf8');
const game = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const source = config + '\n' + state + '\n' + mapgen + '\n' + audio + '\n' + save + '\n' + input + '\n' + render + '\n' + ui + '\n' + simulation + '\n' + ai + '\n' + kingdom + '\n' + entities + '\n' + campaign + '\n' + economy + '\n' + formations + '\n' + menus + '\n' + minimap + '\n' + assets + '\n' + game;
const netSync = readFileSync(new URL('../js/network-sync.js', import.meta.url), 'utf8');
const netCommands = readFileSync(new URL('../js/network-commands.js', import.meta.url), 'utf8');
const netDelivery = readFileSync(new URL('../js/network-delivery.js', import.meta.url), 'utf8');
const netUplink = readFileSync(new URL('../js/network-uplink.js', import.meta.url), 'utf8');
const netTransport = readFileSync(new URL('../js/network-transport.js', import.meta.url), 'utf8');
const netStartup = readFileSync(new URL('../js/network-startup.js', import.meta.url), 'utf8');
const netSession = readFileSync(new URL('../js/network-session.js', import.meta.url), 'utf8');
const unitMap = readFileSync(new URL('../js/network-unit-map.js', import.meta.url), 'utf8');
const netLobby = readFileSync(new URL('../js/network-lobby.js', import.meta.url), 'utf8');
const multiplayer = readFileSync(new URL('../multiplayer.js', import.meta.url), 'utf8');
const persistence = readFileSync(new URL('../persistence.js', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
new vm.Script(config, { filename: 'js/config.js' });
new vm.Script(state, { filename: 'js/state.js' });
new vm.Script(mapgen, { filename: 'js/mapgen.js' });
new vm.Script(audio, { filename: 'js/audio.js' });
new vm.Script(save, { filename: 'js/save.js' });
new vm.Script(input, { filename: 'js/input.js' });
new vm.Script(render, { filename: 'js/render.js' });
new vm.Script(ui, { filename: 'js/ui.js' });
new vm.Script(simulation, { filename: 'js/simulation.js' });
new vm.Script(ai, { filename: 'js/ai.js' });
new vm.Script(pathfinding, { filename: 'js/pathfinding.js' });
new vm.Script(kingdom, { filename: 'js/kingdom.js' });
new vm.Script(entities, { filename: 'js/entities.js' });
new vm.Script(campaign, { filename: 'js/campaign.js' });
new vm.Script(economy, { filename: 'js/economy.js' });
new vm.Script(formations, { filename: 'js/formations.js' });
new vm.Script(menus, { filename: 'js/menus.js' });
new vm.Script(minimap, { filename: 'js/minimap.js' });
new vm.Script(assets, { filename: 'js/assets.js' });
new vm.Script(game, { filename: 'engine.js' });
new vm.Script(netSync, { filename: 'js/network-sync.js' });
new vm.Script(netCommands, { filename: 'js/network-commands.js' });
new vm.Script(netDelivery, { filename: 'js/network-delivery.js' });
new vm.Script(netUplink, { filename: 'js/network-uplink.js' });
new vm.Script(netTransport, { filename: 'js/network-transport.js' });
new vm.Script(netStartup, { filename: 'js/network-startup.js' });
new vm.Script(netSession, { filename: 'js/network-session.js' });
new vm.Script(unitMap, { filename: 'js/network-unit-map.js' });
new vm.Script(netLobby, { filename: 'js/network-lobby.js' });
new vm.Script(multiplayer, { filename: 'multiplayer.js' });
new vm.Script(persistence, { filename: 'persistence.js' });
new vm.Script(serviceWorker, { filename: 'sw.js' });
if (!html.includes('<script src="./js/config.js"></script><script src="./js/state.js"></script><script src="./js/mapgen.js"></script><script src="./js/audio.js"></script><script src="./js/save.js"></script><script src="./js/input.js"></script><script src="./js/render.js"></script><script src="./js/ui.js"></script><script src="./js/simulation.js"></script><script src="./js/ai.js"></script><script src="./js/pathfinding.js"></script><script src="./js/kingdom.js"></script><script src="./js/entities.js"></script><script src="./js/campaign.js"></script><script src="./js/economy.js"></script><script src="./js/formations.js"></script><script src="./js/menus.js"></script><script src="./js/minimap.js"></script><script src="./js/assets.js"></script><script src="./engine.js"></script>')) throw new Error('index.html does not load the external game engine in dependency order');
if (!html.includes('<script src="./js/network-sync.js"></script><script src="./js/network-commands.js"></script><script src="./js/network-delivery.js"></script><script src="./js/network-uplink.js"></script><script src="./js/network-transport.js"></script><script src="./js/network-supabase.js"></script><script src="./js/network-webrtc.js"></script><script src="./js/network-startup.js"></script><script src="./js/network-session.js"></script><script src="./js/network-unit-map.js"></script><script src="./js/network-lobby.js"></script><script src="./multiplayer.js"></script>')) throw new Error('index.html does not load multiplayer integration');

const checks = [
  ['age advancement uses reference resource costs and research times', /cost:\{f:500\},t:130/.test(source)&&/cost:\{f:800,g:200\},t:160/.test(source)&&/cost:\{f:1000,g:800\},t:190/.test(source)],
  ['age advancement shares distinct-building and single-Castle eligibility', source.includes('function ageRequirements(t,world=S)')&&source.includes('const gate=ageRequirements(t);if(!gate.ready)')],
  ['farm capacity uses researched technologies', /function farmFood\(t\)[\s\S]{0,180}q\.coll\?75[\s\S]{0,80}q\.plow\?125[\s\S]{0,80}q\.crop\?175/.test(source)],
  ['player-built farms record ownership', /addN\('f',place\.x,place\.y,farmFood\(0\),1\);if\(n\)n\.t=0/.test(source)],
  ['AI-built farms record ownership', /const farm=addN\('f',x,y,farmFood\(t\),1\);if\(!farm\)continue;pay\(t,B\.farm\.cost\);farm\.t=t/.test(source)],
  ['farm technology only affects the researching kingdom', /n\.k==='f'&&n\.fm&&n\.t===b\.t&&S\.nd\[n\.y\*W\+n\.x\]===n/.test(source)],
  ['infantry armour upgrades use explicit unit classes', source.includes("const INFARM=new Set(['mil','spear','tk','woad','bers','saml','huskarl','jaguar','kamayuk','shotel','axe','gbeto'])")],
  ['archer armour upgrades use explicit unit classes', source.includes("const ARCHARM=new Set(['arc','xbow','lbow','skirm','genoa','plumed','chuko','jan','hcan','conq','wagon','eled','mgd'])")],
  ['combat damage applies both armour class upgrades', source.includes("ib=(INFARM.has(t.k)?((ta.armI?1:0)+(ta.armI2?1:0)+(ta.armI3?(cls==='p'?2:1):0)):0)+(ARCHARM.has(t.k)&&ta.armR?1:0)+(CAVARM.has(t.k)&&ta.armC?1:0)")],
  ['siege splash damages hostile units only', source.includes('(e!==p.t||!direct)&&isHostile(p.a.t,e.t)&&e.hp>0&&!e.ld&&(e.x-ix)*(e.x-ix)+(e.y-iy)*(e.y-iy)<splash2')],
  ['siege splash can damage nearby hostile buildings', source.includes('for(const e of S.bs)if((e!==p.t||!direct)&&isHostile(p.a.t,e.t)&&e.hp>0&&(e.x+(e.s||0)/2-ix)**2+(e.y+(e.s||0)/2-iy)**2<splash2)dmgT(p.a,e)')],
  ['siege auto-targeting prioritises hostile buildings in range', (()=>{const start=source.indexOf('function foe(u,r,building){'),siege=source.indexOf('if(U[u.k]?.sg){',start),indexed=source.indexOf('b=nearestFoeUnit(u,r);if(b)return b;',start),fallback=source.indexOf('for(const q of S.bs)',indexed);return start>=0&&siege>start&&source.indexOf('if(b)return b',siege)<indexed&&indexed>siege&&fallback>indexed})()],
  ['farm reseeding charges the owning kingdom and reports accurately', /for\(const n of S\.nodes\)if\(n&&n\.fm&&n\.amt<=0&&Number\.isInteger\(n\.t\)&&S\.res\[n\.t\]&&S\.res\[n\.t\]\.w>=60\)\{S\.res\[n\.t\]\.w-=60;n\.amt=farmFood\(n\.t\);if\(n\.t===0\)note\('Farm reseeded \(-60 wood\)'\)\}/.test(source) && !/tg\.fm&&S\.res\[u\.t\]\.w>=60/.test(source)],
];

for (const [name, ok] of checks) {
  if (!ok) throw new Error(`FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}
console.log('PASS: parsed external config.js, state.js, mapgen.js, audio.js, save.js, input.js, render.js, ui.js, simulation.js, engine.js, persistence.js, sw.js, network-commands.js, network-delivery.js, network-uplink.js and multiplayer.js');


