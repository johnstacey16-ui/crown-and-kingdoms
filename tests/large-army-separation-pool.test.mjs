import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('large-army separation recycles spatial bucket arrays instead of allocating each tick', () => {
  assert.match(engine, /const SEP_GRID=new Map\(\),SEP_BUCKET_POOL=\[\]/);
  const start = engine.indexOf('function sep(){');
  const end = engine.indexOf('function compactPositive', start);
  assert.ok(start >= 0 && end > start, 'Separation function must remain isolated');
  const sep = engine.slice(start, end);
  assert.match(sep, /if\(us\.length<=128\)/, 'Small armies retain the straightforward linear path');
  assert.match(sep, /for\(const bucket of grid\.values\(\)\)\{bucket\.length=0;SEP_BUCKET_POOL\.push\(bucket\)\}grid\.clear\(\)/,
    'Occupied buckets must be emptied and returned to the reuse pool each large-army tick');
  assert.match(sep, /const next=SEP_BUCKET_POOL\.pop\(\)\|\|\[\];next\.push\(i\);grid\.set\(k,next\)/,
    'Newly occupied cells must reuse a pooled array before allocating a fallback');
  assert.match(sep, /const p=\(\.5-d\)\*\.25;dx\/=d;dy\/=d;mv\(a,dx\*p,dy\*p\);mv\(b,-dx\*p,-dy\*p\)/,
    'Collision radius and separation displacement must remain unchanged');
});
