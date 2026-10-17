import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');

function extract(start, end) {
  const a = simulation.indexOf(start);
  const b = simulation.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `cannot isolate ${start}`);
  return simulation.slice(a, b);
}
const worker = { k: 'vil', t: 0, hp: U.vil.hp };
const enemy = { k: 'vil', t: 1, hp: U.vil.hp };
const soldier = { k: 'mil', t: 0, hp: U.mil.hp };
const tc = { k: 'tc', t: 0, done: true, hp: B.tc.hp, rs: null, q: [] };
const S = { tech: [{}, {}], us: [worker, enemy, soldier], bs: [tc], res: [{}, {}] };
const context = {
  U, B, TE, S, CAP: 10,
  CAVARM: new Set(['knight']), INFARM: new Set(['mil']),
  foe: () => null, sfx: () => {}, note: () => {},
};
vm.createContext(context);
vm.runInContext(extract('function gatherCapacity(u){', 'function walk(u,dt){'), context);
vm.runInContext(extract('function upB(b,dt){', '\nfunction train(b,k){'), context);
const capacity = vm.runInContext('gatherCapacity', context);
const speed = vm.runInContext('unitSpeed', context);
const upB = vm.runInContext('upB', context);

function complete(tech) {
  tc.rs = { k: tech, t: TE[tech].t };
  upB(tc, TE[tech].t);
  assert.equal(tc.rs, null, `${tech} completes`);
  assert.equal(S.tech[0][tech], 1, `${tech} is applied`);
}

assert.equal(capacity(worker), 10);
assert.equal(speed(worker), U.vil.sp);
complete('loom');
assert.equal(worker.hp, U.vil.hp + 15);
assert.equal(enemy.hp, U.vil.hp);
complete('wheel');
assert.equal(capacity(worker), 13);
assert.ok(Math.abs(speed(worker) - U.vil.sp * 1.05) < 1e-9);
assert.equal(capacity(enemy), 10);
assert.equal(speed(enemy), U.vil.sp);
assert.equal(capacity(soldier), 10);
assert.equal(speed(soldier), U.mil.sp);
complete('handcart');
assert.equal(capacity(worker), 20);
assert.ok(Math.abs(speed(worker) - U.vil.sp * 1.05 * 1.05) < 1e-9);
complete('carry');
assert.equal(capacity(worker), 25);
assert.equal(capacity(soldier), 15);
assert.equal(capacity(enemy), 10);
console.log('economy-upgrade-effects: passed');
