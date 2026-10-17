import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');
const tc = { k: 'tc', t: 0, hp: B.tc.hp, done: true, x: 4, y: 4, s: 3, q: [{ k: 'vil', t: 1 }] };
const S = { bs: [tc], tech: [{}, {}], res: [{}, {}], pl: { tr: 0 }, us: [], pj: [] };
let population = 2, cap = 2, spawns = 0;
const context = {
  U, B, TE, S, note: () => {}, sfx: () => {}, foe: () => null, unitName: k => k,
  popOf: () => population, capOf: () => cap, trainRate: () => 1,
  spawnPos: () => [5.5, 5.5],
  addU: (team, kind, x, y) => { spawns++; population++; return { t: team, k: kind, x, y }; },
};
vm.createContext(context);
const a = simulation.indexOf('function upB(b,dt){');
const b = simulation.indexOf('\nfunction queuedPopulation(t){', a);
assert.ok(a >= 0 && b > a);
vm.runInContext(simulation.slice(a, b), context);
const upB = vm.runInContext('upB', context);
upB(tc, 5);
assert.equal(spawns, 0, 'finished training waits when population cap is full');
assert.equal(tc.q.length, 1, 'waiting unit remains queued');
assert.equal(tc.q[0].t, 0, 'completed unit remains ready');
cap = 3;
upB(tc, 1);
assert.equal(spawns, 1, 'unit spawns after capacity is restored');
assert.equal(tc.q.length, 0, 'completed unit leaves the queue');
assert.equal(population, 3);
assert.equal(S.pl.tr, 1, 'successful spawn updates training statistics');
console.log('training-cap-drop: passed');
