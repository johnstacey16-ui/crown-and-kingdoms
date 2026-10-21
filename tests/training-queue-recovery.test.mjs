import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');
const a = source.indexOf('function upB(b,dt){');
const b = source.indexOf('\nfunction queuedPopulation(t){', a);
assert.ok(a >= 0 && b > a);
const tc = { k: 'tc', t: 0, done: true, hp: 100, x: 4, y: 4, s: 3, q: [null, { k: 'vil', t: 3 }] };
const S = { bs: [tc], res: [{ f: 0, g: 0, w: 0, s: 0 }], tech: [{}], pl: { tr: 0 }, pj: [] };
let spawned = 0;
const context = { attackRange: () => 0, U, B, TE, S, note: () => {}, sfx: () => {}, foe: () => null, unitName: k => k,
  livePopulation: () => 0, capOf: () => 20, spawnPos: () => [3.5, 3.5],
  addU: () => { spawned++; return { k: 'vil' }; }, trainRate: () => 1 };
vm.createContext(context);
vm.runInContext(source.slice(a, b), context);
const upB = vm.runInContext('upB', context);
upB(tc, 1);
assert.equal(tc.q.length, 1, 'corrupt queue head is removed');
assert.equal(tc.q[0].t, 3, 'next valid training entry remains intact');
upB(tc, NaN);
assert.equal(tc.q[0].t, 3, 'invalid delta does not corrupt training');
upB(tc, -1);
assert.equal(tc.q[0].t, 3, 'negative delta does not reverse training');
upB(tc, 3);
assert.equal(spawned, 1, 'valid queued training can still complete');
assert.equal(tc.q.length, 0);
console.log('training-queue-recovery: passed');

