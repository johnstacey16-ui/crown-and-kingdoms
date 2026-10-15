import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function townBell(t){');
const end = simulation.indexOf('\nfunction gm(', start);
assert.ok(start >= 0 && end > start, 'Town Bell command must remain isolated');
const townBell = simulation.slice(start, end);

assert.match(townBell, /const shelters=S\.bs\.filter\(b=>b\.t===t&&b\.done&&b\.hp>0&&GAR\[b\.k\]\)/,
  'Only completed, living garrison buildings should be shelters');
assert.match(townBell, /new Set\(\(Array\.isArray\(b\.cg\)\?b\.cg:\[\]\)\.filter\(u=>u&&u\.hp>0&&u\.ld===b\)\)\.size/,
  'Capacity must count unique living units actually garrisoned in each shelter');
assert.match(townBell, /if\(v\.hp>0&&v\.t===t&&v\.o==='B'&&occupancy\.has\(v\.tg\)\)/,
  'Only living villagers with a valid shelter reservation consume reserved capacity');
assert.match(townBell, /if\(\(occupancy\.get\(b\)\|\|0\)-ownReservation>=GAR\[b\.k\]\)continue/,
  'Shelter capacity must be enforced before assigning villagers');
assert.match(townBell, /occupancy\.set\(shelter,\(occupancy\.get\(shelter\)\|\|0\)\+1\)/,
  'New assignments must reserve shelter capacity during the same Town Bell command');

console.log('town-bell-garrison-capacity: stale/dead garrison references do not consume shelter capacity');
