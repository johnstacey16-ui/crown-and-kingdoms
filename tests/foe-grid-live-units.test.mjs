import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');

const start = simulation.indexOf('function rebuildFoeGrid(){');
const end = simulation.indexOf('\nfunction nearestFoeUnit', start);
assert.ok(start >= 0 && end > start, 'Foe spatial-grid rebuild must remain isolated');
const rebuild = simulation.slice(start, end);

assert.match(rebuild, /const e=S\.us\[i\];if\(!e\|\|e\.hp<=0\|\|e\.ld\)continue;/,
  'Foe grid must exclude defeated, missing and garrisoned units before allocating bucket entries');
assert.match(simulation.slice(simulation.indexOf('function nearestFoeUnit'), simulation.indexOf('\nfunction foe(')),
  /!e\|\|!isHostile\(u\.t,e\.t\)\|\|e\.hp<=0\|\|e\.ld/,
  'Nearest-foe lookup must still revalidate candidates because units can die or be garrisoned after a grid rebuild');

console.log('foe-grid-live-units: grid filtering and stale-candidate validation passed');
