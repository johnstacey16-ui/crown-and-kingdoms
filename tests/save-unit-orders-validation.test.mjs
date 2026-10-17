import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const a = src.indexOf('function validSavedPath(u,sz){');
const b = src.indexOf('\nfunction loadG(', a);
assert.ok(a >= 0 && b > a, 'saved unit order validators exist');
const valid = vm.runInNewContext(src.slice(a, b) + '\nvalidSavedUnitOrders');
assert.ok(valid({}, 24), 'legacy unit fields may be absent');
assert.ok(valid({ p: [[2.5, 3.5]], rp: 0, cd: 0, car: 0 }, 24), 'valid idle and active unit state accepted');
assert.ok(valid({ rp: -3, cd: -0.1, car: 2 }, 24), 'elapsed cooldown and retry timers can be negative');
for (const state of [
  { rp: NaN }, { cd: Infinity },
  { car: -3 }, { car: '4' }, { p: [[-1, 3]] }, { p: [null] },
]) assert.equal(Boolean(valid(state, 24)), false, 'malformed unit state rejected: ' + JSON.stringify(state));
assert.ok(src.includes('validSavedUnitOrders(u,j.sz)'), 'loader invokes unit order validation');
console.log('save-unit-orders-validation: passed');
