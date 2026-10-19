import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

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
assert.match(rebuild, /const e=S\.us\[i\];if\(!e\|\|e\.hp<=0\|\|e\.ld\|\|!Number\.isFinite\(e\.x\)\|\|!Number\.isFinite\(e\.y\)\)continue;/,
  'Foe grid must exclude missing, defeated, garrisoned and non-finite positioned units');
const units=[{hp:50,x:4,y:4},null,{hp:0,x:4,y:4},{hp:90,ld:{k:'tc'},x:4,y:4},{hp:90,x:NaN,y:4},{hp:90,x:Infinity,y:4}];
const context=vm.createContext({S:{us:units}});
const {rebuildFoeGrid,FOE_BUCKETS,FOE_BUCKET_POOL}=vm.runInContext(
  "const FOE_CELL=8,FOE_BUCKETS=new Map(),FOE_BUCKET_POOL=[];let foeGridDirty=true;"+rebuild+
  "\n;({rebuildFoeGrid,FOE_BUCKETS,FOE_BUCKET_POOL})",context);
rebuildFoeGrid();
assert.deepEqual(Array.from(FOE_BUCKETS.get('0,0')),[0],'only valid living un-garrisoned units may enter the grid');
context.S.us=[{hp:45,x:4,y:4}];
rebuildFoeGrid();
assert.deepEqual(Array.from(FOE_BUCKETS.get('0,0')),[0]);
assert.equal(FOE_BUCKET_POOL.length,0,'recycled bucket storage is reused on the next rebuild');
assert.match(simulation.slice(simulation.indexOf('function nearestFoeUnit'), simulation.indexOf('\nfunction foe(')),
  /!e\|\|!isHostile\(u\.t,e\.t\)\|\|e\.hp<=0\|\|e\.ld/,
  'Nearest-foe lookup must still revalidate candidates because units can die or be garrisoned after a grid rebuild');

console.log('foe-grid-live-units: pooled bucket reuse and live-unit filtering passed');
