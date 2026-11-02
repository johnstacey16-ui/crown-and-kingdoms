import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const policy = readFileSync(new URL('../js/ai-policy.js', import.meta.url), 'utf8');
const start = ai.indexOf('function aiTeamRoster(');
const end = ai.indexOf('function aiHostileComposition(', start);
assert.ok(start >= 0 && end > start, 'AI team roster classification must be available');

const roster = ai.slice(start, end);
assert.match(roster, /for\(const u of S\.us\)if\(u&&u\.t===t&&u\.hp>0&&U\[u\.k\]\)\{\s*my\.push\(u\)/,
  'Defeated units must not inflate AI roster, villager, or army counts');
assert.match(roster, /if\(u\.k==='vil'&&!u\.ld\)vil\.push\(u\)/,
  'Garrisoned villagers must not be counted as available workers');
assert.match(roster, /else if\(!u\.ld&&!U\[u\.k\]\.sh&&u\.k!=='scout'/,
  'Garrisoned units must not inflate the active army used for AI strategy');
assert.match(roster, /if\(u\.k==='gal'&&!u\.ld\)galleys\.push\(u\)/,
  'Garrisoned warships must not be treated as available naval units');

console.log('ai-live-active-roster: dead and garrisoned units do not inflate AI planning counts');

const threatScan = policy.slice(policy.indexOf('function aiClassifyHostileForces('));
assert.match(ai, /aiClassifyHostileForces\(t\)/, 'AI orchestration uses the dedicated hostile roster policy');
assert.match(threatScan, /for\(const e of S\.us\)/,
  'AI naval threat rosters should be built in a single pass over the unit list');
assert.match(threatScan, /if\(!e\.ld&&e\.k!=='fish'\)hostileShips\.push\(e\)/,
  'Naval target candidates must exclude garrisoned ships and fishing boats');
assert.match(threatScan, /if\(!e\.ld&&e\.k!=='fish'&&e\.k!=='trn'&&e\.k!=='cog'&&U\[e\.k\]\.dmg>=4\)\{navalThreatCount\+\+;hostileFleet\.push\(e\)\}/,
  'Garrisoned or otherwise loaded ships must not count toward the naval threat or the active fleet');
assert.doesNotMatch(ai, /const hostileFleet=S\.us\.filter|const hostileShips=S\.us\.filter/,
  'Do not re-scan the entire unit list separately for the same naval rosters');
console.log('ai-live-active-roster: naval threat lists are consolidated into one source scan');

assert.match(threatScan, /const hostileFleet=\[\],hostileShips=\[\],humanArmy=\[\],humanShips=\[\];let navalThreatCount=0;for\(const e of S\.us\)/,
  'The hostile scan should also build active land-army and naval-counter rosters in the same pass');
assert.match(threatScan, /if\(!e\.ld&&!U\[e\.k\]\.sh\)humanArmy\.push\(e\)/,
  'Human counter-planning must preserve its active, non-garrisoned land-unit filter');
assert.match(threatScan, /if\(!e\.ld&&e\.k!=='fish'&&e\.k!=='trn'&&e\.k!=='cog'&&U\[e\.k\]\.dmg>=4\)humanShips\.push\(e\)/,
  'Naval counter-planning must preserve its active combat-ship filter');
assert.doesNotMatch(ai, /const humanArmy=S\.us\.filter|humanShips=S\.us\.filter/,
  'Do not rescan all units later to reconstruct the same hostile army and ship rosters');
console.log('ai-live-active-roster: hostile army and naval counter rosters share one source scan');

// Execute the production helpers: verify real roster membership, not only
// lexical guard text, and retain one pass per relevant entity collection.
const classes={vil:{},mil:{},scout:{},gal:{sh:1},fish:{sh:1},knight:{},cog:{sh:1}};
const actors=[
 {t:1,k:'vil',hp:25,id:'worker'}, {t:1,k:'vil',hp:25,ld:1,id:'loaded-worker'},
 {t:1,k:'mil',hp:50,id:'army'}, {t:1,k:'mil',hp:50,ld:1,id:'loaded-army'},
 {t:1,k:'scout',hp:30,id:'scout'}, {t:1,k:'gal',hp:70,id:'ship'},
 {t:1,k:'fish',hp:30,id:'fisher'}, {t:1,k:'mil',hp:0,id:'dead'},
 {t:1,k:'invalid',hp:5,id:'unknown'}, {t:0,k:'knight',hp:60,id:'enemy'}
];
const structures=[
 {t:1,k:'tc',hp:50,done:false,id:'unfinished'},
 {t:1,k:'tc',hp:900,done:true,id:'completed'},
 {t:1,k:'tc',hp:0,done:true,id:'ruined'},
 {t:1,k:'bar',hp:150,done:true,id:'barracks'}
];
const ctx=vm.createContext({S:{us:actors,bs:structures},U:classes,CAVARM:new Set(['knight'])});
vm.runInContext(ai+'\n;globalThis.roster=aiTeamRoster;globalThis.composition=aiHostileComposition;',ctx);
const actual=ctx.roster(1);
for(const [key,ids] of Object.entries({
 my:['worker','loaded-worker','army','loaded-army','scout','ship','fisher'],
 vil:['worker'],arm:['army'],scouts:['scout'],galleys:['ship'],fish:['fisher'],
 bl:['unfinished','completed','barracks']
}))assert.deepEqual(Array.from(actual[key],u=>u.id),ids,'strategy '+key+' excludes dead or unavailable objects');
assert.equal(actual.tc.id,'completed','living completed Town Centre beats unfinished and ruined');
assert.deepEqual(JSON.parse(JSON.stringify(ctx.composition([
 {k:'knight'},{k:'mil'},{k:'spear'},{k:'arc'},{k:'xbow'},{k:'ram'},{k:'fish'}
]))),{humanCav:1,humanRanged:2,humanSiege:1,humanInf:2});
console.log('ai-live-active-roster: production helper execution preserves membership and counter classes');
