import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const a = src.indexOf('function validSavedRally(b,sz){');
const b = src.indexOf('\nfunction validSavedPath(', a);
assert.ok(a >= 0 && b > a, 'saved rally validation exists');
const valid = vm.runInNewContext(src.slice(a, b) + '\nvalidSavedRally');
assert.ok(valid({}, 24), 'legacy missing rally is accepted');
assert.ok(valid({ rally: null }, 24), 'unassigned rally is accepted');
assert.ok(valid({ rally: { x: 4.5, y: 7.5 } }, 24), 'valid rally is accepted');
for (const rally of [{ x: -1, y: 4 }, { x: 24, y: 2 }, { x: 1, y: Infinity }, { x: NaN, y: 3 }, { x: 1 }, [], '4,5']) {
  assert.equal(Boolean(valid({ rally }, 24)), false, 'invalid rally rejected: ' + JSON.stringify(rally));
}
assert.ok(src.includes('validSavedRally(b,j.sz)'), 'save loader uses rally validator');
console.log('save-rally-validation: passed');
