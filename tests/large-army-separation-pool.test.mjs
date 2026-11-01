import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation-separation.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('large-army separation recycles spatial bucket arrays instead of allocating each tick', () => {
  assert.match(simulation, /const SEP_GRID=new Map\(\),SEP_BUCKET_POOL=\[\]/);
  assert.doesNotMatch(engine, /SEP_GRID|function sep\(\)/, 'separation must remain outside engine orchestration');
  const start = simulation.indexOf('function sep(){');
  const end = simulation.length;
  assert.ok(start >= 0 && end > start, 'Separation function must remain isolated');
  const sep = simulation.slice(start, end);
  assert.match(sep, /if\(us\.length<=64\)/, 'Only genuinely small armies retain the straightforward linear path; larger armies use spatial buckets');
  assert.match(sep, /for\(const bucket of grid\.values\(\)\)\{bucket\.length=0;SEP_BUCKET_POOL\.push\(bucket\)\}grid\.clear\(\)/,
    'Occupied buckets must be emptied and returned to the reuse pool each large-army tick');
  assert.match(sep, /const next=SEP_BUCKET_POOL\.pop\(\)\|\|\[\];next\.push\(i\);grid\.set\(k,next\)/,
    'Newly occupied cells must reuse a pooled array before allocating a fallback');
  assert.match(sep, /const dist=Math\.sqrt\(ds\)\|\|\.01,p=\(\.5-dist\)\*\.25;dx\/=dist;dy\/=dist;mv\(a,dx\*p,dy\*p\);mv\(b,-dx\*p,-dy\*p\)/,
    'Collision separation must maintain the half-tile radius while safely avoiding division by zero');
  assert.match(sep, /if\(a\.ld\|\|a\.hp<=0\)continue/, 'Large-army grid must not insert defeated units into spatial buckets');
  assert.match(sep, /if\(b\.ld\|\|b\.hp<=0\|\|Math\.abs\(a\.x-b\.x\)>.5/, 'Large-army separation must ignore defeated neighbours');
  assert.match(sep, /if\(a\.hp<=0\)continue;for\(let j=i\+1;j<us\.length;j\+\+\)/, 'Small-army separation must skip defeated units too');
});
