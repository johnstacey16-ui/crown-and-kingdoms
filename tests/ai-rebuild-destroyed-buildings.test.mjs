import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ai = readFileSync(new URL('../js/ai-policy.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
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
assert.match(ai, /if\(b\.k==='tc'&&b\.hp>0&&\(!tc\|\|\(!tc\.done&&b\.done\)\)\)tc=b/,
  'AI Town Centre selection must skip destroyed centres and prefer a completed centre over an unfinished fallback');
assert.match(ai, /S\.bs\.some\(q=>q\.t===t&&q\.k===k&&q\.hp>0&&Math\.hypot\(q\.x-n\.x,q\.y-n\.y\)<7\)/,
  'Destroyed structures must not block AI rebuilding near a resource site');
assert.match(ai, /bl\.filter\(b=>b\.k==='wall'&&b\.hp>0\)\.length/,
  'Destroyed walls must not count against the AI wall target');
assert.match(ai, /S\.bs\.filter\(b=>b\.t===t&&b\.k==='bar'&&b\.hp>0\)\.length/,
  'Destroyed Barracks must not satisfy the AI minimum Barracks count');
assert.match(ai, /bl\.filter\(b=>b\.k==='house'&&b\.hp>0&&!b\.done\)\.length/,
  'Destroyed unfinished Houses must not suppress population-cap construction');
assert.match(ai, /const queuedUnits=k=>aiQueuedUnits\(bl,k\)/,
  'AI production caps share a queue counter that handles destroyed buildings');
assert.match(ai, /b&&b\.hp>0&&Array\.isArray\(b\.q\)/,
  'Destroyed structures and invalid queue objects must not contribute to any AI unit capacity');

assert.match(ai, /ageRequirements\(t\)\.ready/,
  'AI age-up planning must use the same completed-building/Castle gate as research');

console.log('ai-rebuild-destroyed-buildings: destroyed structures no longer block replacement planning');

