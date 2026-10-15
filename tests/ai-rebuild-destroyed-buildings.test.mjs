import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const start = ai.indexOf('function aiTeam(');
const end = ai.indexOf('\n', ai.indexOf('const cnt=', start));
assert.ok(start >= 0 && end > start, 'AI team planning must expose its building-count rule');
const planning = ai.slice(start, end);

assert.match(planning, /const cnt=k=>bl\.filter\(b=>b\.k===k&&b\.hp>0\)\.length/,
  'AI production planning must ignore destroyed buildings so it can replace lost Markets, Barracks, Docks and other structures');
assert.doesNotMatch(planning, /const cnt=k=>bl\.filter\(b=>b\.k===k\)\.length/,
  'Destroyed buildings must not permanently satisfy a construction requirement');

console.log('ai-rebuild-destroyed-buildings: destroyed structures no longer block replacement planning');
