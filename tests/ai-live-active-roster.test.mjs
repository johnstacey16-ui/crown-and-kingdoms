import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const start = ai.indexOf('function aiTeam(');
const end = ai.indexOf('\nconst navalThreatCount=', start);
assert.ok(start >= 0 && end > start, 'AI team roster classification must be available');

const roster = ai.slice(start, end);
assert.match(roster, /for\(const u of S\.us\)if\(u\.t===t&&u\.hp>0\)\{my\.push\(u\)/,
  'Defeated units must not inflate AI roster, villager, or army counts');
assert.match(roster, /if\(u\.k==='vil'&&!u\.ld\)vil\.push\(u\)/,
  'Garrisoned villagers must not be counted as available workers');
assert.match(roster, /else if\(!u\.ld&&!U\[u\.k\]\.sh&&u\.k!=='scout'/,
  'Garrisoned units must not inflate the active army used for AI strategy');
assert.match(roster, /if\(u\.k==='gal'&&!u\.ld\)galleys\.push\(u\)/,
  'Garrisoned warships must not be treated as available naval units');

console.log('ai-live-active-roster: dead and garrisoned units do not inflate AI planning counts');
