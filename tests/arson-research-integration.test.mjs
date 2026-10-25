import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const sim = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE, AG } = vm.runInNewContext(config + '\n;({U,B,TE,AG})');
const bar = { k: 'bar', t: 0, hp: B.bar.hp, done: true, rs: null, q: [] };
const S = { age: [2, 2], tech: [{}, {}], bs: [bar], us: [],
  res: [{ f: 1000, w: 1000, g: 1000, s: 1000 }, { f: 1000, w: 1000, g: 1000, s: 1000 }],
  ping: null, t: 0, al: 0 };
const context = {
  U, B, TE, AG, S, INFARM: new Set(['mil']), ARCHARM: new Set(['arc']),
  CAVARM: new Set(['knight']), PRA: {}, MA: {}, fx: [], gt: 0,
  isHostile: (a, b) => a !== b, hitSnd: () => {}, emit: () => {},
  sfx: () => {}, note: () => {}, rumble: () => {}, W: 72, cmp: null, vm: 0,
  can: (t, cost) => Object.entries(cost).every(([k, n]) => S.res[t][k] >= n),
  pay: (t, cost) => { for (const [k, n] of Object.entries(cost)) S.res[t][k] -= n; },
};
context.rsOf=b=>context.B[b.k]?.rs||[];
vm.createContext(context);
function load(start, end) {
  const a = sim.indexOf(start), b = sim.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `missing section ${start}`);
  vm.runInContext(sim.slice(a, b), context);
}
load('function research(b,k){', 'const MILITARY_PRODUCTION_BUILDINGS=');
load('function upB(b,dt){', '\nfunction train(b,k){');
load('function meleeResearchAttackBonus(', 'function dmgT(a,t){');
load('function dmgT(a,t){', 'const hit=(a,t)=>');
const research = vm.runInContext('research', context);
const upB = vm.runInContext('upB', context);
const damage = vm.runInContext('dmgT', context);
function strike(kind, isBuilding) {
  const target = { k: isBuilding ? 'house' : 'mil', t: 1, hp: 100,
    x: 4, y: 4, ...(isBuilding ? { s: 2 } : {}) };
  damage({ k: kind, t: 0, x: 1, y: 1 }, target);
  return 100 - target.hp;
}
const before = strike('mil', true);
const costBefore = { ...S.res[0] };
assert.equal(research(bar, 'arson'), true, 'Arson can be researched at the Barracks');
assert.equal(S.res[0].f, costBefore.f - (TE.arson.cost.f || 0));
upB(bar, TE.arson.t / 2);
assert.equal(strike('mil', true), before, 'Arson has no effect until completed');
upB(bar, TE.arson.t / 2);
assert.equal(S.tech[0].arson, 1);
assert.equal(strike('mil', true), before + 2, 'Arson increases infantry damage to buildings by two');
S.tech[0].arson = 0;
const vsUnit = strike('mil', false), vsCavalry = strike('knight', true);
S.tech[0].arson = 1;
assert.equal(strike('mil', false), vsUnit, 'Arson does not increase infantry damage to units');
assert.equal(strike('knight', true), vsCavalry, 'Arson does not increase cavalry damage');
assert.equal(research(bar, 'arson'), false, 'busy or completed technology cannot be queued again');
console.log('arson-research-integration: passed');
