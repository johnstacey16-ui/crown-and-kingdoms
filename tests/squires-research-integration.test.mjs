import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const buildingUpdates = readFileSync(new URL('../js/simulation-building-updates.js', import.meta.url), 'utf8');
const researchSource = readFileSync(new URL('../js/simulation-research.js', import.meta.url), 'utf8');
const { U, B, TE, AG } = vm.runInNewContext(config + '\n;({U,B,TE,AG})');
const bar = { k: 'bar', t: 0, hp: B.bar.hp, done: true, rs: null, q: [] };
const otherBar = { k: 'bar', t: 0, hp: B.bar.hp, done: true, rs: null, q: [] };
const enemyBar = { k: 'bar', t: 1, hp: B.bar.hp, done: true, rs: null, q: [] };
const S = {
  age: [2, 2], tech: [{}, {}], bs: [bar, otherBar, enemyBar],
  res: Array.from({ length: 2 }, () => ({ f: 2000, w: 2000, g: 2000, s: 2000 })),
};
const context = {
  U, B, TE, AG, S, CAP: 10,
  CAVARM: new Set(['knight']), INFARM: new Set(['mil']),
  note: () => {}, sfx: () => {},
  can: (team, cost) => Object.entries(cost).every(([key, value]) => S.res[team][key] >= value),
  pay: (team, cost) => { for (const [key, value] of Object.entries(cost)) S.res[team][key] -= value; },
};
context.rsOf=b=>context.B[b.k]?.rs||[];
vm.createContext(context);
function extract(begin, end) {
  const start = simulation.indexOf(begin);
  const stop = simulation.indexOf(end, start + begin.length);
  assert.ok(start >= 0 && stop > start, `missing source section: ${begin}`);
  vm.runInContext(simulation.slice(start, stop), context);
}
vm.runInContext(researchSource.slice(researchSource.indexOf('function research(b,k){')), context);
extract('function gatherCapacity(u){', 'function walk(u,dt){');
vm.runInContext(buildingUpdates, context);
const research = vm.runInContext('research', context);
const speed = vm.runInContext('unitSpeed', context);
const upB = vm.runInContext('upB', context);
const infantry = { k: 'mil', t: 0 };
const cavalry = { k: 'knight', t: 0 };
const enemy = { k: 'mil', t: 1 };
assert.equal(speed(infantry), U.mil.sp);
assert.equal(research(bar, 'squires'), true, 'Squires can start at Castle Age Barracks');
const remaining = { ...S.res[0] };
assert.equal(research(otherBar, 'squires'), false, 'cannot research Squires twice simultaneously');
assert.deepEqual(S.res[0], remaining, 'duplicate research does not charge again');
upB(bar, TE.squires.t / 2);
assert.equal(speed(infantry), U.mil.sp, 'speed bonus must not apply early');
upB(bar, TE.squires.t / 2);
assert.equal(S.tech[0].squires, 1, 'research completion records Squires');
assert.ok(Math.abs(speed(infantry) - U.mil.sp * 1.1) < 1e-9, 'infantry gain Squires speed');
assert.equal(speed(cavalry), U.knight.sp, 'cavalry do not gain Squires speed');
assert.equal(speed(enemy), U.mil.sp, 'enemy infantry are unaffected');
assert.equal(research(otherBar, 'squires'), false, 'completed Squires cannot be purchased again');
console.log('squires-research-integration: passed');
