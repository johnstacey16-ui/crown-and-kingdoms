import {updateArtRevisions} from './build-art-revisions.mjs';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {browserScriptPaths,coreGameScriptPaths,readBrowserRuntime} from './runtime-sources.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = readBrowserRuntime({html});
const scriptByPath = new Map(scripts.map(({path,source})=>[path,source]));
const source = coreGameScriptPaths(html).map(path=>scriptByPath.get(path)).join('\n');
const serviceWorker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

// Compile ALL production scripts, including transports formerly omitted by
// a manually maintained checker roster.
for (const {path,source:code} of scripts) new vm.Script(code,{filename:path.slice(2)});
new vm.Script(serviceWorker,{filename:'sw.js'});

// The full list is derived from HTML; pin only critical dependency boundaries.
const scriptPaths=browserScriptPaths(html);
for(const [a,b] of [
 ['./persistence.js','./js/config.js'],
 ['./js/config.js','./js/state.js'],
 ['./js/simulation-victory.js','./js/simulation-logistics.js'],
 ['./js/simulation-logistics.js','./js/simulation.js'],
 ['./js/simulation.js','./js/ai-policy.js'],
 ['./js/ai-policy.js','./js/ai-construction.js'],
 ['./js/ai-construction.js','./js/ai.js'],
 ['./js/ai.js','./js/pathfinding.js'],
 ['./js/pathfinding.js','./js/kingdom.js'],
 ['./js/kingdom.js','./js/entities.js'],
 ['./js/entities.js','./js/campaign.js'],
 ['./js/assets.js','./js/engine-graphics-benchmark.js'],
 ['./js/engine-graphics-benchmark.js','./engine.js'],
 ['./engine.js','./js/network-sync.js'],
 ['./js/network-sync.js','./js/network-commands.js'],
 ['./js/network-commands.js','./js/network-delivery.js'],
 ['./js/network-session.js','./js/network-unit-map.js'],
 ['./js/network-unit-map.js','./js/network-lobby.js'],
 ['./js/network-lobby.js','./multiplayer.js']
]){
 const first=scriptPaths.indexOf(a),second=scriptPaths.indexOf(b);
 if(first<0||second<=first)throw Error('Invalid browser dependency order: '+a+' -> '+b);
}
if(!scriptPaths.includes('./js/network-supabase.js')||!scriptPaths.includes('./js/network-webrtc.js'))
 throw Error('Missing expected multiplayer transport scripts');

const checks = [
  ['age advancement uses reference resource costs and research times', /cost:\{f:500\},t:130/.test(source)&&/cost:\{f:800,g:200\},t:160/.test(source)&&/cost:\{f:1000,g:800\},t:190/.test(source)],
  ['age advancement shares distinct-building and single-Castle eligibility', source.includes('function ageRequirements(t,world=S)')&&source.includes('const gate=ageRequirements(t);if(!gate.ready)')],
  ['farm capacity uses researched technologies', /function farmFood\(t\)[\s\S]{0,180}q\.coll\?75[\s\S]{0,80}q\.plow\?125[\s\S]{0,80}q\.crop\?175/.test(source)],
  ['player-built farms record ownership', /addN\('f',place\.x,place\.y,farmFood\(0\),1\);if\(n\)n\.t=0/.test(source)],
  ['AI-built farms record ownership', /const farm=addN\('f',x,y,farmFood\(t\),1\);if\(!farm\)continue;pay\(t,B\.farm\.cost\);farm\.t=t/.test(source)],
  ['farm technology only affects the researching kingdom', /n\.k==='f'&&n\.fm&&n\.t===b\.t&&S\.nd\[n\.y\*W\+n\.x\]===n/.test(source)],
  ['infantry armour upgrades use explicit unit classes', source.includes("const INFARM=new Set(['mil','spear','tk','woad','bers','saml','huskarl','jaguar','kamayuk','shotel','axe','gbeto'])")],
  ['archer armour upgrades use explicit unit classes', source.includes("const ARCHARM=new Set(['arc','xbow','lbow','skirm','genoa','plumed','chuko','jan','hcan','conq','wagon','eled','mgd'])")],
  ['combat damage applies both armour class upgrades', source.includes("ib=(INFARM.has(t.k)?((ta.armI?1:0)+(ta.armI2?1:0)+(ta.armI3?(cls==='p'?2:1):0)):0)+(ARCHARM.has(t.k)?((ta.armR?1:0)+(ta.armR2?1:0)+(ta.armR3?(cls==='p'?2:1):0)):0)+(CAVARM.has(t.k)?((ta.armC?1:0)+(ta.armC2?1:0)+(ta.armC3?(cls==='p'?2:1):0)):0)")],
  ['siege splash damages hostile units only', source.includes('(e!==p.t||!direct)&&isHostile(p.a.t,e.t)&&e.hp>0&&!e.ld&&(e.x-ix)*(e.x-ix)+(e.y-iy)*(e.y-iy)<splash2')],
  ['siege splash can damage nearby hostile buildings', source.includes('for(const e of S.bs)if((e!==p.t||!direct)&&isHostile(p.a.t,e.t)&&e.hp>0&&(e.x+(e.s||0)/2-ix)**2+(e.y+(e.s||0)/2-iy)**2<splash2)dmgT(p.a,e)')],
  ['siege auto-targeting prioritises hostile buildings in range', (()=>{const start=source.indexOf('function foe(u,r,building){'),siege=source.indexOf('if(U[u.k]?.sg){',start),indexed=source.indexOf('b=nearestFoeUnit(u,r);if(b)return b;',start),fallback=source.indexOf('for(const q of S.bs)',indexed);return start>=0&&siege>start&&source.indexOf('if(b)return b',siege)<indexed&&indexed>siege&&fallback>indexed})()],
  ['farm reseeding charges the owning kingdom and reports accurately', (()=>{
   const sim=scriptByPath.get('./js/simulation.js')||'';
   const start=sim.indexOf('for(const n of S.nodes)if(');
   const end=sim.indexOf('for(const u of S.us)upU(',start);
   const farm=start>=0&&end>start?sim.slice(start,end):'';
   return farm.includes('n.fm&&n.amt<=0&&Number.isInteger(n.t)&&S.res[n.t]&&S.res[n.t].w>=60') &&
    farm.includes('S.res[n.t].w-=60') &&
    farm.includes('n.amt=farmFood(n.t)') &&
    farm.includes("if(n.t===0)note('Farm reseeded (-60 wood)')") &&
    !/tg\\.fm&&S\\.res\\[u\\.t\\]\\.w>=60/.test(source);
  })()],
];

for (const [name, ok] of checks) {
  if (!ok) throw new Error(`FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}
console.log('PASS: syntax parsed '+scripts.length+' production browser scripts and sw.js');




updateArtRevisions({check:true});
console.log('PASS: offline artwork revisions match actual source bytes');
