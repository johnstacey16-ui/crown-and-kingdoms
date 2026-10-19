import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, AG } = vm.runInNewContext(config + '\n;({U,B,AG})');
const first = { k: 'tc', t: 0, hp: B.tc.hp, done: true, q: [] };
const second = { k: 'tc', t: 0, hp: B.tc.hp, done: true, q: [] };
const enemy = { k: 'tc', t: 1, hp: B.tc.hp, done: true, q: [] };
const S = { age: [0, 0], tech: [{}, {}], bs: [first, second, enemy],
  res: [{ f: 1000, w: 1000, g: 1000, s: 1000 }, { f: 1000, w: 1000, g: 1000, s: 1000 }] };
let caps = [2, 1], population = [0, 0];
const context = {
  U, B, AG, S, note: () => {},
  can: (team, cost) => Object.entries(cost).every(([k, n]) => S.res[team][k] >= n),
  pay: (team, cost, refund = 0) => { for (const [k, n] of Object.entries(cost)) S.res[team][k] += refund ? n : -n; },
  popOf: team => population[team] + S.bs.reduce((n,b)=>n+(b.t===team&&b.hp>0?b.q.length:0),0), capOf: team => caps[team],
};
vm.createContext(context);
const begin = simulation.indexOf('function queuedPopulation(t){');
const end = simulation.indexOf('\nfunction okPlace(', begin);
assert.ok(begin >= 0 && end > begin);
vm.runInContext(simulation.slice(begin, end), context);
const train = vm.runInContext('train', context);
const cancel = vm.runInContext('cancelQ', context);

assert.equal(train(first, 'vil'), true, 'first queue reserves one slot');
assert.equal(train(second, 'vil'), true, 'second building reserves remaining slot');
const paid = S.res[0].f;
assert.equal(train(first, 'vil'), false, 'all reserved slots block new training');
assert.equal(S.res[0].f, paid, 'rejected training does not spend resources');
assert.equal(train(enemy, 'vil'), true, 'other kingdom has independent population');
assert.equal(train(enemy, 'vil'), false, 'enemy population reservation is also enforced');
assert.equal(cancel(second), true, 'queued training can be cancelled');
assert.equal(train(first, 'vil'), true, 'cancelled queue frees a reservation');
population[0] = 1;
assert.equal(train(second, 'vil'), false, 'existing units also consume population slots');
const destroyed = { k: 'tc', t: 0, hp: 0, done: true, q: [{ k: 'vil', t: 2 }] };
S.bs.push(destroyed);
assert.equal(cancel(first), true);
assert.equal(train(second, 'vil'), false, 'existing units and remaining queue still fill capacity');
population[0] = 0;
assert.equal(train(second, 'vil'), true, 'destroyed production buildings do not reserve slots');
const teamOneBefore = S.res[1].f;
assert.equal(train(enemy, 'vil'), false, 'enemy queue remains capped independently');
assert.equal(S.res[1].f, teamOneBefore);
console.log('training-population-reservation: passed');
