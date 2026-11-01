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
  // Isolated economy harness: no combat targets are returned by foe.
  attackRange: () => 0,
  U, B, TE, S, CAP: 10,
  CAVARM: new Set(['knight']), INFARM: new Set(['mil']),
  foe: () => null, sfx: () => {}, note: () => {},
};
vm.createContext(context);
vm.runInContext(extract('function gatherCapacity(u){', 'function walk(u,dt){'), context);
vm.runInContext(extract('function upB(b,dt){', '\nfunction okPlace('), context);
const capacity = vm.runInContext('gatherCapacity', context);
const speed = vm.runInContext('unitSpeed', context);
const upB = vm.runInContext('upB', context);

function complete(tech) {
  const duration = TE[tech].t;
  tc.rs = { k: tech, t: duration };
  upB(tc, duration / 2);
  assert.equal(tc.rs.k, tech, `${tech} is still in progress at halfway`);
  assert.equal(S.tech[0][tech], undefined, `${tech} does not apply early`);
  upB(tc, duration / 2);
  assert.equal(tc.rs, null, `${tech} completes`);
  assert.equal(S.tech[0][tech], 1, `${tech} is applied`);
}

assert.equal(capacity(worker), 10);
assert.equal(speed(worker), U.vil.sp);
complete('loom');
upB(tc, TE.loom.t);
assert.equal(worker.hp, U.vil.hp + 15, 'completed Loom must not apply twice');
assert.equal(worker.hp, U.vil.hp + 15);
assert.equal(enemy.hp, U.vil.hp);
complete('wheel');
assert.equal(capacity(worker), 13);
assert.ok(Math.abs(speed(worker) - U.vil.sp * 1.1) < 1e-9);
assert.equal(capacity(enemy), 10);
assert.equal(speed(enemy), U.vil.sp);
assert.equal(capacity(soldier), 10);
assert.equal(speed(soldier), U.mil.sp);
complete('handcart');
assert.equal(capacity(worker), 20);
assert.ok(Math.abs(speed(worker) - U.vil.sp * 1.2) < 1e-9);
complete('carry');
assert.equal(capacity(worker), 25);
assert.equal(capacity(soldier), 15);
assert.equal(capacity(enemy), 10);
console.log('economy-upgrade-effects: passed');

