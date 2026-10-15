import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');

const start = simulation.indexOf('function rebuildFoeGrid(){');
const end = simulation.indexOf('\nfunction nearestFoeUnit', start);
assert.ok(start >= 0 && end > start, 'Foe spatial-grid rebuild must remain isolated');
const rebuild = simulation.slice(start, end);

assert.match(simulation, /const FOE_CELL=8,FOE_BUCKETS=new Map\(\),FOE_BUCKET_POOL=\[\]/,
  'Foe grid should keep a reusable pool of spatial bucket arrays');
assert.match(rebuild, /for\(const bin of FOE_BUCKETS\.values\(\)\)\{bin\.length=0;FOE_BUCKET_POOL\.push\(bin\)\}\s*FOE_BUCKETS\.clear\(\)/,
  'Each rebuild should recycle existing bucket arrays before rebuilding the spatial index');
assert.match(rebuild, /if\(!bin\)\{bin=FOE_BUCKET_POOL\.pop\(\)\|\|\[\];FOE_BUCKETS\.set\(key,bin\)\}/,
  'Newly occupied cells should reuse pooled arrays before allocating');
assert.match(rebuild, /const e=S\.us\[i\];if\(!e\|\|e\.hp<=0\|\|e\.ld\)continue;/,
  'Foe grid must exclude defeated, missing and garrisoned units before allocating bucket entries');
assert.match(simulation.slice(simulation.indexOf('function nearestFoeUnit'), simulation.indexOf('\nfunction foe(')),
  /!e\|\|!isHostile\(u\.t,e\.t\)\|\|e\.hp<=0\|\|e\.ld/,
  'Nearest-foe lookup must still revalidate candidates because units can die or be garrisoned after a grid rebuild');

console.log('foe-grid-live-units: pooled bucket reuse and live-unit filtering passed');
