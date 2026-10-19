import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/state.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/audio.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/save.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/input.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/render.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/kingdom.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

assert.match(html, /for\(let t=1;t<S\.teamN;t\+\+\)if\(diplomacyRelation\(0,t\)==='ally'&&\(S\.bs\.some\(b=>b\.t===t&&b\.hp>0\)\|\|S\.us\.some\(u=>u\.t===t&&u\.hp>0\)\)\)allies\.push\(t\)/,
  'Tribute recipients must include surviving allied kingdoms without a Town Centre');
assert.match(html, /const DIPLOMACY_STATES=\['enemy','neutral','ally'\]/,
  'Diplomacy must use explicit enemy, neutral and ally states');
assert.match(html, /function createDiplomacy\(n,source=null\)\{[\s\S]{0,650}d\[a\]\[b\]=d\[b\]\[a\]=rel/,
  'New games and restored saves must use a symmetric relationship matrix');
assert.match(html, /tech:Array\.from\(\{length:teamN\},\(\)=>\(\{\}\)\),dip:createDiplomacy\(teamN\),vp:createVillagerPriority\(\),scoreCache:Array\(teamN\)\.fill\(0\),kh:Array\(teamN\)\.fill\(0\),rel:\[\]/,
  'New matches must default to every rival being hostile');
assert.match(html, /function diplomacyRelation\(a,b\)\{if\(a===b\)return 'self';return S&&S\.dip&&S\.dip\[a\]&&S\.dip\[a\]\[b\]\|\|'enemy'\}/,
  'Missing relationship data must default safely to enemy');
assert.match(html, /function isHostile\(a,b\)\{return a!==b&&diplomacyRelation\(a,b\)==='enemy'\}/,
  'Hostility must come from the shared relationship helper');
assert.match(html, /function setDiplomacy\(a,b,rel\)\{[\s\S]{0,450}S\.dip\[a\]\[b\]=S\.dip\[b\]\[a\]=rel/,
  'Changing diplomacy must update both kingdoms symmetrically');
assert.match(html, /if\(rel!=='enemy'\)for\(const u of S\.us\)if\(\(u\.o==='a'\|\|u\.o==='v'\)/,
  'Changing a relationship away from enemy must cancel active attacks and conversions against that kingdom');
assert.match(html, /for\(let t=1;t<S\.teamN;t\+\+\)if\(S\.bs\.some\(b=>b\.t===t&&b\.hp>0\)\|\|S\.us\.some\(u=>u\.t===t&&u\.hp>0\)\)/,
  'Diplomacy must remain available when a kingdom loses its Town Centre but still has surviving forces or buildings');
assert.match(html, /function diplomacyMenuItems\(\)\{[\s\S]{0,500}l:\(\)=>rotateDiplomacy\(0,t,-1\),r:\(\)=>rotateDiplomacy\(0,t,1\),a:\(\)=>rotateDiplomacy\(0,t,1\)/,
  'Enemy, neutral and ally states must be changeable with the pause-menu controller');
assert.match(html, /function dmgT\(a,t\)\{if\(!a\|\|!t\|\|!U\[a\.k\]\|\|\(!t\.s&&!U\[t\.k\]\)\|\|!Number\.isFinite\(t\.hp\)\|\|t\.hp<=0\|\|t\.ld\|\|!S\.tech\[a\.t\]\|\|!isHostile\(a\.t,t\.t\)\)return;/,
  'Damage must guard missing, dead and non-hostile targets before applying any combat effects');
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');
const begin=simulation.indexOf('function dmgT(');
const finish=simulation.indexOf('\nconst hit=',begin);
assert.ok(begin>=0&&finish>begin,'direct damage simulation must remain available');
const context={U:{mil:{rng:1,sp:1,dmg:5},spear:{rng:1,sp:1,dmg:4}},S:{tech:[{},{}]},isHostile:()=>false};
const dmgT=vm.runInNewContext(simulation.slice(begin,finish)+'\n;dmgT;',context);
const attacker={k:'mil',t:0,x:1,y:1,hp:100},target={k:'spear',t:1,x:2,y:2,hp:100};
assert.doesNotThrow(()=>dmgT(attacker,target),'combat must reject allied/neutral damage before reading other combat dependencies');
assert.equal(target.hp,100,'allied or neutral targets take no damage');
assert.match(html, /if\(tg&&tg\.t>0&&\(tg\.q\|\|U\[tg\.k\]\)&&!isHostile\(0,tg\.t\)&&!tradeOnly\)\{/,
  'Manual hostile-target checks must distinguish valid foreign trade orders from attacks');
assert.match(html, /if\(!canRepairBuilding&&!canRepairShip\)\{note\('That kingdom is not hostile;/,
  'The game must reject attacks on friendly targets except explicitly permitted repairs and trade');
assert.match(html, /function foe\(u,r\)\{[\s\S]{0,500}isHostile\(u\.t,q\.t\)[\s\S]{0,280}b=nearestFoeUnit\(u,r\);if\(b\)return b/,
  'Siege building priority must remain intact before indexed unit targeting');
assert.match(html, /function nearestFoeUnit\(u,r\)\{[\s\S]{0,700}!isHostile\(u\.t,e\.t\)[\s\S]{0,180}e\.hp<=0\|\|e\.ld/,
  'Indexed automatic target acquisition must ignore neutral/allied, dead and garrisoned units');
assert.match(html, /const enemyBs=S\.bs\.filter\(b=>isHostile\(t,b\.t\)&&b\.hp>0\)/,
  'AI attack waves must choose targets only from hostile kingdoms');
assert.ok(html.includes("const hostileFleet=[],hostileShips=[],humanArmy=[],humanShips=[];let navalThreatCount=0;for(const e of S.us){if(!e||!Number.isInteger(e.t)||!isHostile(t,e.t)||e.hp<=0||!U[e.k])continue;"),
  'Naval AI must build enemy-only ship and land-counter rosters in the shared guarded scan');
assert.ok(html.includes("if(!e.ld&&e.k!=='fish'&&e.k!=='trn'&&e.k!=='cog'&&U[e.k].dmg>=4)humanShips.push(e)"),
  'Naval counter roster must exclude allied, neutral, economic and garrisoned ships');
assert.match(html, /for\(const e of S\.us\)\{if\(!e\|\|e\.hp<=0\|\|e\.ld\|\|!isHostile\(t,e\.t\)\|\|!\(U\[e\.k\]\?\.dmg>3\)\)continue;/,
  'AI defensive threat detection must ignore non-hostile units');
assert.match(html, /vc:S\.vc,px:S\.px,civ:S\.civ,dip:S\.dip,vp:S\.vp,diff/,
  'Save data must preserve diplomacy relationships');
assert.match(html, /dip:createDiplomacy\(\(j\.res\|\|\[\]\)\.length\|\|2,j\.dip\)/,
  'Load data must restore diplomacy and default legacy saves to enemies');
assert.match(html, /if\(!S\.bs\.some\(b=>b\.k==='tc'&&isHostile\(0,b\.t\)&&b\.hp>0\)\)endGame\('win','All hostile Town Centres have fallen'\)/,
  'Town Centre victory must consider current hostile relationships');

assert.ok(html.includes("for(let ally=0;ally<S.teamN;ally++)if(ally!==t&&diplomacyRelation(t,ally)==='ally'&&(S.bs.some(b=>b.t===ally&&b.hp>0)||S.us.some(u=>u.t===ally&&u.hp>0)))allies.push(ally)"),
  'AI tribute must remain available to allied kingdoms with surviving units or buildings even after Town Centre loss');

console.log('diplomacy: all source regression assertions passed');
