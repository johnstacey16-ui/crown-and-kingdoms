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

assert.match(ai, /S\.bs\.find\(b=>b\.t===t&&b\.k==='tc'&&b\.hp>0\)/,
  'AI construction helpers must select a living Town Centre rather than a destroyed shell');
assert.match(ai, /if\(!tc&&b\.k==='tc'&&b\.hp>0\)tc=b/,
  'AI team planning must not use a destroyed Town Centre as its command anchor');
assert.match(ai, /S\.bs\.some\(q=>q\.t===t&&q\.k===k&&q\.hp>0&&Math\.hypot\(q\.x-n\.x,q\.y-n\.y\)<7\)/,
  'Destroyed structures must not block AI rebuilding near a resource site');
assert.match(ai, /bl\.filter\(b=>b\.k==='wall'&&b\.hp>0\)\.length/,
  'Destroyed walls must not count against the AI wall target');
assert.match(ai, /S\.bs\.filter\(b=>b\.t===t&&b\.k==='bar'&&b\.hp>0\)\.length/,
  'Destroyed Barracks must not satisfy the AI minimum Barracks count');
assert.match(ai, /bl\.filter\(b=>b\.k==='house'&&b\.hp>0&&!b\.done\)\.length/,
  'Destroyed unfinished Houses must not suppress population-cap construction');
assert.match(ai, /bl\.filter\(b2=>b2\.k==='dock'&&b2\.hp>0\)\.reduce/,
  'Destroyed Docks must not contribute queued naval production to AI capacity');

console.log('ai-rebuild-destroyed-buildings: destroyed structures no longer block replacement planning');
