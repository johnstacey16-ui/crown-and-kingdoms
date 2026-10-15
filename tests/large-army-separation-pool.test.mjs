import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('large-army separation recycles spatial bucket arrays instead of allocating each tick', () => {
  assert.match(simulation, /const SEP_GRID=new Map\(\),SEP_BUCKET_POOL=\[\]/);
  assert.doesNotMatch(engine, /SEP_GRID|function sep\(\)/, 'Separation ownership must stay in simulation.js');
  const start = simulation.indexOf('function sep(){');
  const end = simulation.length;
  assert.ok(start >= 0 && end > start, 'Separation function must remain isolated');
  const sep = simulation.slice(start, end);
  assert.match(sep, /if\(us\.length<=64\)/, 'Only genuinely small armies retain the straightforward linear path; larger armies use spatial buckets');
  assert.match(sep, /for\(const bucket of grid\.values\(\)\)\{bucket\.length=0;SEP_BUCKET_POOL\.push\(bucket\)\}grid\.clear\(\)/,
    'Occupied buckets must be emptied and returned to the reuse pool each large-army tick');
  assert.match(sep, /const next=SEP_BUCKET_POOL\.pop\(\)\|\|\[\];next\.push\(i\);grid\.set\(k,next\)/,
    'Newly occupied cells must reuse a pooled array before allocating a fallback');
  assert.match(sep, /const p=\(\.5-d\)\*\.25;dx\/=d;dy\/=d;mv\(a,dx\*p,dy\*p\);mv\(b,-dx\*p,-dy\*p\)/,
    'Collision radius and separation displacement must remain unchanged');
  assert.match(sep, /if\(a\.ld\|\|a\.hp<=0\)continue/, 'Large-army grid must not insert defeated units into spatial buckets');
  assert.match(sep, /if\(b\.ld\|\|b\.hp<=0\|\|Math\.abs\(a\.x-b\.x\)>.5/, 'Large-army separation must ignore defeated neighbours');
  assert.match(sep, /if\(a\.hp<=0\)continue;for\(let j=i\+1;j<us\.length;j\+\+\)/, 'Small-army separation must skip defeated units too');
});


test('A* reuses heap buffers between sequential path searches', () => {
  const pathfinding = readFileSync(new URL('../js/pathfinding.js', import.meta.url), 'utf8');
  assert.match(pathfinding, /const PATH_HEAP_K=\[\],PATH_HEAP_V=\[\]/,
    'A* heap arrays should be allocated once and retained for subsequent searches');
  assert.match(pathfinding, /const hk=PATH_HEAP_K,hv=PATH_HEAP_V;hk\.length=0;hv\.length=0/,
    'each search must clear both reusable buffers before pushing its start node');
  assert.doesNotMatch(pathfinding, /hr=goal\.hr\|\|0,hk=\[\],hv=\[\]/,
    'A* should not allocate fresh heap arrays for every unit path request');
});
