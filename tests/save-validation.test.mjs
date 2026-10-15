import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const guard = save.indexOf("if(!j||j.v!==1||!Number.isInteger(j.sz)");
const restore = save.indexOf('setSize(j.sz)');
assert.ok(guard >= 0, 'loadG must validate a save payload before restoring it');
assert.ok(restore > guard, 'payload validation must run before map allocation and state replacement');

const validation = save.slice(guard, save.indexOf("{note('No valid save found');return false}", guard));
for (const required of [
  '!Array.isArray(j.us)',
  '!Array.isArray(j.bs)',
  '!Array.isArray(j.nodes)',
  '!Array.isArray(j.res)',
  '!Array.isArray(j.age)',
  '!Array.isArray(j.tech)',
  '!Array.isArray(j.pl)',
  "typeof j.wt!=='string'",
  "typeof j.ex!=='string'",
  'j.wt.length!==j.sz*j.sz',
  'j.ex.length!==j.sz*j.sz',
]) {
  assert.ok(validation.includes(required), `save validation must reject incomplete or malformed field: ${required}`);
}
assert.ok(validation.includes('j.sz<16') && validation.includes('j.sz>256'), 'save map dimensions must be bounded before allocation');
assert.match(save, /try\{j=JSON\.parse\(localStorage\.getItem\(skey\(slot\)\)\)\}catch\(e\)\{\}/, 'invalid JSON must remain a recoverable invalid-save result');
console.log('save-validation: malformed JSON, missing arrays, invalid map dimensions and incomplete terrain data are rejected before restore');
