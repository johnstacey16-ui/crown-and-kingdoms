import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');
const a = save.indexOf('function validSavedProduction(b,civs){');
const b = save.indexOf('\nfunction loadG(', a);
assert.ok(a >= 0 && b > a, 'save production validator is defined');
const valid = vm.runInNewContext(save.slice(a, b) + '\nvalidSavedProduction', { U, B, TE, trOf:b=>B[b.k]?.tr||[], rsOf:b=>B[b.k]?.rs||[] });
assert.ok(valid({ k: 'tc', q: [], rs: null }), 'empty queue is valid');
assert.ok(valid({ k: 'tc', q: [{ k: 'vil', t: 5 }] }), 'normal production without overlapping research is valid');
assert.ok(valid({ k: 'tc', q: [], rs: { k: 'loom', t: 4 } }), 'normal technology research without training is valid');
assert.ok(valid({ k: 'tc', q: [{ k: 'vil', t: 0 }] }), 'completed training awaiting a free population slot is valid');
assert.ok(valid({ k: 'tc', q: [], rs: { k: 'age', t: 12 } }), 'age research at a Town Centre is valid');
assert.equal(valid({ k: 'tc', q: [{ k: 'vil', t: 0 }], rs: { k: 'age', t: 12 } }), false,
  'a completed but queued unit still prevents overlapping age research on save restoration');
assert.ok(valid({ k: 'bar', q: [{ k: 'mil', t: 0 }] }), 'barracks military training is valid');
assert.equal(Boolean(valid({ k: 'tc', q: [{ k: 'vil', t: 3 }], rs: { k: 'loom', t: 5 } })), false, 'save cannot restore overlapping research and production');
assert.equal(Boolean(valid({ k: 'bar', rs: { k: 'age', t: 12 } })), false, 'age research requires a town centre');
assert.ok(valid({ k: 'tc' }), 'legacy save without queue or research is accepted');
for (const bad of [
  { q: [{ k: 'mil', t: 2 }] }, { q: 'vil' }, { q: [null] }, { q: [{ k: 'missing', t: 1 }] },
  { q: [{ k: 'vil', t: -1 }] }, { q: [{ k: 'vil', t: Infinity }] },
  { q: Array.from({ length: 6 }, () => ({ k: 'vil', t: 1 })) },
  { rs: { k: 'blood', t: 10 } }, { rs: { k: 'missing', t: 10 } }, { rs: { k: 'loom', t: NaN } },
  { rs: { k: 'loom', t: -2 } }, { rs: [] },
]) assert.equal(Boolean(valid({ k: 'tc', ...bad })), false, 'corrupt production record must be rejected: ' + JSON.stringify(bad));
assert.ok(save.includes('validSavedProduction(b,j.civ||[0,1])'), 'load validation invokes production checks');
assert.ok(save.includes('Number.isInteger(a)&&a>=0&&a<AG.length'),
  'save loader rejects invalid civilization ages');
assert.ok(save.includes('if(!Array.isArray(b.q))b.q=[]'),
  'legacy saves without queues receive empty queues');
console.log('save-production-validation: passed');
