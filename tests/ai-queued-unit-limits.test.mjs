import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const start = ai.indexOf('const queuedUnits=k=>bl.reduce(');
const end = ai.indexOf(';', start);
assert.ok(start >= 0 && end > start, 'AI queue-count helper must exist');
const bl = [
  { k: 'dock', hp: 600, q: [{ k: 'gal', t: 5 }, { k: 'fish', t: 7 }] },
  { k: 'dock', hp: 600, q: [{ k: 'gal', t: 2 }, { k: 'gal', t: 3 }] },
  { k: 'stable', hp: 200, q: [{ k: 'scout', t: 4 }] },
  { k: 'market', hp: 400, q: [{ k: 'cart', t: 2 }] },
  { k: 'dock', hp: 0, q: [{ k: 'gal', t: 2 }, { k: 'cog', t: 1 }] },
  { k: 'dock', hp: 600 },
];
const queuedUnits = vm.runInNewContext(ai.slice(start, end) + ';queuedUnits', { bl });
assert.equal(queuedUnits('gal'), 3, 'count all active war galley queues');
assert.equal(queuedUnits('fish'), 1, 'count fishing boats');
assert.equal(queuedUnits('scout'), 1, 'count scouts');
assert.equal(queuedUnits('cart'), 1, 'count trade carts');
assert.equal(queuedUnits('cog'), 0, 'ignore destroyed dock queues');
assert.equal(queuedUnits('mil'), 0, 'unknown unit type has zero queue count');
bl[0].q.push({ k: 'cog', t: 2 });
assert.equal(queuedUnits('cog'), 1, 'queue changes are reflected immediately');
console.log('ai-queued-unit-limits: passed');
