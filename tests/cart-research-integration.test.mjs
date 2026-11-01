import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { B, TE, AG, U } = vm.runInNewContext(config + '\n;({B,TE,AG,U})');
const source = simulation.slice(simulation.indexOf('function research(b,k){'), simulation.indexOf('const MILITARY_PRODUCTION_BUILDINGS='));
assert.ok(source.startsWith('function research('));
const player = { k: 'tc', t: 0, hp: 900, done: true, rs: null };
const opponent = { k: 'tc', t: 1, hp: 900, done: true, rs: null };
const S = {
  age: [2, 2],
  tech: [{ wheel: 0 }, {}],
  res: [{ f: 1000, w: 1000, g: 1000, s: 1000 }, { f: 1000, w: 1000, g: 1000, s: 1000 }],
  bs: [player, opponent],
};
const context = {
  // Isolated economy harness: no combat targets are returned by foe.
  attackRange: () => 0,
  B, TE, AG, S,
  note: () => {},
  can: (team, cost) => Object.entries(cost).every(([k, n]) => S.res[team][k] >= n),
  pay: (team, cost) => { for (const [k, n] of Object.entries(cost)) S.res[team][k] -= n; },
};
context.rsOf=b=>context.B[b.k]?.rs||[];
vm.createContext(context);
vm.runInContext(source, context);
const research = vm.runInContext('research', context);
const before = { ...S.res[0] };
assert.equal(research(player, 'handcart'), false, 'Hand Cart locked without Wheelbarrow');
assert.deepEqual(S.res[0], before, 'failed research spends nothing');
assert.equal(research(player, 'wheel'), true, 'Wheelbarrow can start');
assert.equal(player.rs.k, 'wheel');
assert.equal(S.res[0].f, before.f - TE.wheel.cost.f);
assert.equal(research(player, 'handcart'), false, 'busy Town Centre rejects new research');
const buildingStart = simulation.indexOf('function upB(b,dt){');
const buildingEnd = simulation.indexOf('\nfunction okPlace(', buildingStart);
assert.ok(buildingStart >= 0 && buildingEnd > buildingStart);
context.U = U;
context.sfx = () => {};
context.foe = () => null;
context.trainRate = () => 1;
vm.runInContext(simulation.slice(buildingStart, buildingEnd), context);
const upB = vm.runInContext('upB', context);
player.q = [];
upB(player, TE.wheel.t);
assert.equal(player.rs, null, 'Wheelbarrow research completes');
assert.equal(S.tech[0].wheel, 1, 'completion unlocks Hand Cart');
assert.equal(research(player, 'handcart'), true, 'Hand Cart unlocks after Wheelbarrow');
assert.equal(player.rs.k, 'handcart');
assert.equal(S.res[0].f, before.f - TE.wheel.cost.f - TE.handcart.cost.f);
assert.equal(research(opponent, 'handcart'), false, 'prerequisite is kingdom-specific');
assert.equal(research(player, 'handcart'), false, 'cannot queue duplicate research');
upB(player, TE.handcart.t);
assert.equal(S.tech[0].handcart, 1, 'Hand Cart completes through the building simulation');
assert.equal(research(player, 'handcart'), false, 'completed research cannot be purchased again');
console.log('cart-research-integration: passed');

