import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');
const begin = simulation.indexOf('function queuedPopulation(t){');
const end = simulation.indexOf('\nfunction train(b,k){', begin);
assert.ok(begin >= 0 && end > begin, 'queued population helper is present');
const S = { bs: [
  { t: 0, hp: 100, q: [{ k: 'vil' }, { k: 'mil' }] },
  { t: 0, hp: 100, q: [{ k: 'arc' }] },
  { t: 0, hp: 0, q: [{ k: 'vil' }] },
  { t: 1, hp: 100, q: [{ k: 'gal' }, { k: 'fish' }] },
  { t: 0, hp: 100 },
] };
const context = { S };
vm.createContext(context);
vm.runInContext(simulation.slice(begin, end), context);
const queuedPopulation = vm.runInContext('queuedPopulation', context);
assert.equal(queuedPopulation(0), 3, 'count all live friendly queues');
assert.equal(queuedPopulation(1), 2, 'kingdoms count their own queues');
assert.equal(queuedPopulation(2), 0, 'unknown kingdoms have no queued units');
S.bs[0].q.pop();
assert.equal(queuedPopulation(0), 2, 'cancelling units releases reserved slots');
S.bs[1].hp = 0;
assert.equal(queuedPopulation(0), 1, 'destroyed buildings no longer reserve population');
assert.ok(simulation.includes('popOf(t)>=capOf(t)'), 'training checks reserved population');
assert.ok(ai.includes('popOf(t)+5>capOf(t)'), 'AI housing plans for queued units');
console.log('queued-population-strategy: passed');
