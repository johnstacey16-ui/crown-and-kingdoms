// Exercise research ordering against the real research() implementation.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/simulation-research.js', import.meta.url), 'utf8');
const start = source.indexOf('function ageRequirements(t,world=S){');
const end = source.length;
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
context.rsOf=b=>context.B[b.k]?.rs||[];
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
// Age advancement must obey the same per-kingdom exclusivity rule.
const townA = { k: 'tc', t: 0, hp: 900, done: true, rs: null };
const townB = { k: 'tc', t: 0, hp: 900, done: true, rs: null };
const townEnemy = { k: 'tc', t: 1, hp: 900, done: true, rs: null };
const rangeA = { k: 'rng', t: 0, hp: 500, done: true };
const rangeEnemy = { k: 'rng', t: 1, hp: 500, done: true };
buildings.push(townA, townB, townEnemy, rangeA, rangeEnemy);
context.B.tc = { rs: [] };
context.B.bar.age = 1;
context.B.rng = { age: 1 };
context.AG[2] = { needs: ['bar', 'rng'], t: 160, cost: { f: 800, g: 200 } };
assert.equal(research(townA, 'age'), true, 'first town centre should advance the age');
assert.equal(research(townB, 'age'), false, 'second town centre must not duplicate age advancement');
assert.equal(resourcesSpent.length, 3, 'duplicate age advancement must not spend resources');
assert.equal(research(townEnemy, 'age'), true, 'opponent may advance independently');
assert.equal(resourcesSpent.length, 4);

// A destroyed research building must not permanently block a replacement.
townA.hp = 0;
assert.equal(research(townB, 'age'), true, 'replacement town centre can restart interrupted advancement');
assert.equal(resourcesSpent.length, 5);
console.log('research-duplicate-guard: passed');


