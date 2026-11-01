import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const start = ai.indexOf('function aiTeam(');
const end = ai.indexOf('\nconst hostileFleet=[]', start);
assert.ok(start >= 0 && end > start, 'AI team roster classification must be available');

const roster = ai.slice(start, end);
assert.match(roster, /for\(const u of S\.us\)if\(u&&u\.t===t&&u\.hp>0&&U\[u\.k\]\)\{my\.push\(u\)/,
  'Defeated units must not inflate AI roster, villager, or army counts');
assert.match(roster, /if\(u\.k==='vil'&&!u\.ld\)vil\.push\(u\)/,
  'Garrisoned villagers must not be counted as available workers');
assert.match(roster, /else if\(!u\.ld&&!U\[u\.k\]\.sh&&u\.k!=='scout'/,
  'Garrisoned units must not inflate the active army used for AI strategy');
assert.match(roster, /if\(u\.k==='gal'&&!u\.ld\)galleys\.push\(u\)/,
  'Garrisoned warships must not be treated as available naval units');

console.log('ai-live-active-roster: dead and garrisoned units do not inflate AI planning counts');

const threatScan = ai.slice(ai.indexOf('const hostileFleet=[]'), ai.indexOf('\naiShareResources(t,A,R);');
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
