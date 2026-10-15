import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const start = ai.indexOf('function aiTeam(');
const end = ai.indexOf('\nconst navalThreatCount=', start);
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

const threatScan = ai.slice(ai.indexOf('const hostileFleet=[]'), ai.indexOf('\nif(S.t-(A.lastTributeAt'));
assert.match(threatScan, /for\(const e of S\.us\)/,
  'AI naval threat rosters should be built in a single pass over the unit list');
assert.match(threatScan, /if\(e\.k!=='fish'\)hostileShips\.push\(e\)/,
  'Naval target candidates must preserve the existing non-fishing-ship filter');
assert.match(threatScan, /if\(e\.k!=='fish'&&e\.k!=='trn'&&e\.k!=='cog'&&U\[e\.k\]\.dmg>=4\)\{navalThreatCount\+\+;if\(!e\.ld\)hostileFleet\.push\(e\)\}/,
  'Threat count must include garrisoned combat ships as before while the active flee/avoidance fleet excludes them');
assert.doesNotMatch(ai, /const hostileFleet=S\.us\.filter|const hostileShips=S\.us\.filter/,
  'Do not re-scan the entire unit list separately for the same naval rosters');
console.log('ai-live-active-roster: naval threat lists are consolidated into one source scan');
