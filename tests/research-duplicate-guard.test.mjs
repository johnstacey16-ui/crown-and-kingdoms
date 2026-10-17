// Exercise research ordering against the real research() implementation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const start = source.indexOf('function research(b,k){');
const end = source.indexOf('const MILITARY_PRODUCTION_BUILDINGS=', start);
assert.ok(start >= 0 && end > start, 'research implementation must be discoverable');
const buildings = [
  { k: 'bar', t: 0, hp: 500, done: true, rs: null },
  { k: 'bar', t: 0, hp: 500, done: true, rs: null },
  { k: 'bar', t: 1, hp: 500, done: true, rs: null },
];
const S = { bs: buildings, tech: [{}, {}], age: [1, 1] };
const resourcesSpent = [];
const context = {
  S,
  B: { bar: { rs: ['man'] } },
  TE: { man: { age: 1, t: 30, cost: { f: 100 } } },
  AG: [],
  can: () => true,
  pay: (team, cost) => resourcesSpent.push({ team, cost }),
  note: () => {},
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const research = vm.runInContext('research', context);

assert.equal(research(buildings[0], 'man'), true, 'first research should begin');
assert.equal(research(buildings[1], 'man'), false, 'same team must not duplicate active research');
assert.equal(resourcesSpent.length, 1, 'duplicate research must not charge resources');
assert.equal(research(buildings[2], 'man'), true, 'different team may research independently');
assert.equal(resourcesSpent.length, 2);
buildings[0].rs = null;
S.tech[0].man = 1;
assert.equal(research(buildings[1], 'man'), false, 'completed technology cannot be researched again');
assert.equal(resourcesSpent.length, 2);
console.log('research-duplicate-guard: passed');
