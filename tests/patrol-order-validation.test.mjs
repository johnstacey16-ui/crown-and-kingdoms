import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const start = simulation.indexOf('function patrol(wx,wy,once){');
const end = simulation.indexOf('\nfunction subg(', start);
assert.ok(start >= 0 && end > start, 'Patrol command must remain isolated');
const patrol = simulation.slice(start, end);

assert.match(patrol, /u\.hp>0&&!u\.ld/, 'Patrol must ignore defeated and garrisoned units');
for (const kind of ['vil', 'fish', 'cart', 'cog', 'trn', 'mon']) {
  assert.ok(patrol.includes(`u.k!=='${kind}'`), `Patrol must not override ${kind} work`);
}
assert.match(patrol, /u\.tg=null;u\.p=\[\];u\.rp=0/,
  'A patrol order must clear stale target/path state');
assert.match(patrol, /return n>0/,
  'Patrol must report whether any eligible units received the order');
assert.match(patrol, /Select living, ungarrisoned military units or warships to patrol/,
  'Empty/ineligible selections must get a useful controller message');

console.log('patrol-order-validation: only eligible active units receive patrol orders');
