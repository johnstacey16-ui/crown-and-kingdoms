import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const a = src.indexOf('function validSavedPath(u,sz){');
const b = src.indexOf('\nfunction loadG(', a);
assert.ok(a >= 0 && b > a, 'saved path validator is present');
const valid = vm.runInNewContext(src.slice(a, b) + '\nvalidSavedPath');
assert.ok(valid({ p: [[1.5,2.5],[4.5,5.5]] }, 10), 'valid waypoints are accepted');
assert.ok(valid({}, 10), 'legacy units without paths are accepted');
assert.ok(valid({ p: [] }, 10), 'idle units may have empty paths');
for (const p of [null, '1,2', [null], [[NaN,2]], [[-1,2]], [[10,2]], [[2]], [[2,3,4]], [[2,'3']], [[Infinity,2]]]) {
  assert.equal(Boolean(valid({ p }, 10)), false, 'invalid path rejected: ' + JSON.stringify(p));
}
assert.equal(Boolean(valid({ p: Array.from({ length: 101 }, () => [1,1]) }, 10)), false,
  'unbounded saved path rejected');
assert.ok(src.includes('validSavedPath(u,j.sz)'), 'save loader invokes path validation');
assert.ok(src.includes('if(!Array.isArray(u.p))u.p=[]'), 'legacy missing paths initialize safely');
console.log('save-path-validation: passed');
