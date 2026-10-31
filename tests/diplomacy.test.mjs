import assert from 'node:assert/strict';
import {loadCoreGameSource} from '../scripts/runtime-sources.mjs';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const simulation=readFileSync(new URL('../js/simulation.js',import.meta.url),'utf8');

const html = loadCoreGameSource({includeUI:true,includeAssets:true});

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
assert.match(html, /function foe\(u,r,building\)\{[\s\S]{0,500}isHostile\(u\.t,q\.t\)[\s\S]{0,280}b=nearestFoeUnit\(u,r\);if\(b\)return b/,
  'Siege building priority must remain intact before indexed unit targeting');
assert.match(html, /if\(!e\|\|!isHostile\(u\.t,e\.t\)\|\|e\.hp<=0\|\|e\.ld\)continue/,
  'Indexed combat target acquisition must exclude non-hostile, dead, and garrisoned targets');

const start=simulation.indexOf('function nearestFoeUnit(u,r){');
const finishFoe=simulation.indexOf('\nfunction foe(',start);
assert.ok(start>=0&&finishFoe>start,'spatial target selection must exist');
const candidates=[
  {t:1,x:2,y:2,hp:100},
  {t:1,x:1,y:1,hp:0},
  {t:1,x:1,y:2,hp:40,ld:{k:'tc'}},
  {t:2,x:3,y:3,hp:90}
];
const BUCKETS=new Map([['0,0',[0,1,2,3]]]);
const foeContext={S:{us:candidates},W:64,H:64,FOE_CELL:16,FOE_BUCKETS:BUCKETS,
  foeGridDirty:false,isHostile:(a,b)=>a!==b&&b===2};
const select=vm.runInNewContext(simulation.slice(start,finishFoe)+'\n;nearestFoeUnit;',foeContext);
assert.equal(select({t:0,x:0,y:0},12),candidates[3],
  'only an actual living ungarrisoned hostile unit may be returned');
assert.match(html, /const enemyBs=S\.bs\.filter\(b=>isHostile\(t,b\.t\)&&b\.hp>0\)/,
  'AI attack waves must choose targets only from hostile kingdoms');
assert.ok(html.includes("const hostileFleet=[],hostileShips=[],humanArmy=[],humanShips=[];let navalThreatCount=0;for(const e of S.us){if(!e||!Number.isInteger(e.t)||!isHostile(t,e.t)||e.hp<=0||!U[e.k])continue;"),
  'Naval AI must build enemy-only ship and land-counter rosters in the shared guarded scan');
assert.ok(html.includes("if(!e.ld&&e.k!=='fish'&&e.k!=='trn'&&e.k!=='cog'&&U[e.k].dmg>=4)humanShips.push(e)"),
  'Naval counter roster must exclude allied, neutral, economic and garrisoned ships');
assert.match(html, /const nearbyRaiders=S\.us\.filter\(e=>e&&e\.hp>0&&!e\.ld&&Number\.isInteger\(e\.t\)&&isHostile\(t,e\.t\)&&U\[e\.k\]\?\.dmg>3/,
  'Shared base-defence and villager-evacuation roster must ignore non-hostile and defeated units');
const sourceAI=readFileSync(new URL('../js/ai.js',import.meta.url),'utf8');
const rosterStart=sourceAI.indexOf('const nearbyRaiders=S.us.filter(');
const rosterEnd=sourceAI.indexOf(';',rosterStart);
assert.ok(rosterStart>=0&&rosterEnd>rosterStart,'single shared enemy-raid roster must exist');
const raiders=[{t:1,k:'mil',hp:25,x:3,y:3},{t:2,k:'mil',hp:30,x:4,y:3},
 {t:1,k:'mil',hp:0,x:3,y:3},{t:1,k:'vil',hp:40,x:2,y:3},
 {t:1,k:'mil',hp:40,x:NaN,y:3}];
const raiderContext={S:{us:raiders},U:{mil:{dmg:5},vil:{dmg:0}},t:0,W:64,H:64,
 isHostile:(_a,b)=>b===1};
const filtered=vm.runInNewContext(sourceAI.slice(rosterStart,rosterEnd)+';nearbyRaiders',raiderContext);
assert.deepEqual(Array.from(filtered),[raiders[0]],'only live, visible, finite hostile military raiders qualify');
assert.match(html, /vc:S\.vc,px:S\.px,civ:S\.civ,dip:S\.dip,vp:S\.vp,diff/,
  'Save data must preserve diplomacy relationships');
assert.match(html, /dip:createDiplomacy\(\(j\.res\|\|\[\]\)\.length\|\|2,j\.dip\)/,
  'Load data must restore diplomacy and default legacy saves to enemies');
assert.match(html, /if\(!S\.bs\.some\(b=>b\.k==='tc'&&isHostile\(0,b\.t\)&&b\.hp>0\)\)endGame\('win','All hostile Town Centres have fallen'\)/,
  'Town Centre victory must consider current hostile relationships');

assert.ok(html.includes("for(let ally=0;ally<S.teamN;ally++)if(ally!==t&&diplomacyRelation(t,ally)==='ally'&&(S.bs.some(b=>b.t===ally&&b.hp>0)||S.us.some(u=>u.t===ally&&u.hp>0)))allies.push(ally)"),
  'AI tribute must remain available to allied kingdoms with surviving units or buildings even after Town Centre loss');

console.log('diplomacy: all source regression assertions passed');

