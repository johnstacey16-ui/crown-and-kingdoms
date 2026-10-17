import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const a = simulation.indexOf('function dmgT(a,t){');
const b = simulation.indexOf('\nconst hit=', a);
assert.ok(a >= 0 && b > a);
const U = {
  mil: { rng: 0.9, dmg: 8, cd: 1.2 },
  vil: { rng: 0.9, dmg: 3, cd: 1.5 },
};
const S = { tech: [{}, {}], us: [], bs: [], pl: { kills: 0 }, ping: null, t: 0 };
const context = {
  U, S, INFARM: new Set(['mil']), ARCHARM: new Set(), CAVARM: new Set(),
  PRA: {}, MA: {}, fx: [], gt: 0, isHostile: (a, b) => a !== b,
  emit: () => {}, hitSnd: () => {}, sfx: () => {}, note: () => {},
};
vm.createContext(context);
vm.runInContext(simulation.slice(a, b), context);
const dmgT = vm.runInContext('dmgT', context);
const attacker = { k: 'mil', t: 0 };
const make = () => ({ k: 'vil', t: 1, x: 2, y: 2, hp: 25 });
for (const victim of [{ ...make(), hp: 0 }, { ...make(), ld: { k: 'trn' } }, { ...make(), t: 0 }]) {
  const hp = victim.hp;
  dmgT(attacker, victim);
  assert.equal(victim.hp, hp, 'invalid or friendly targets take no damage');
}
dmgT(attacker, null);
dmgT({ k: 'missing', t: 0 }, make());
const victim = make();
dmgT(attacker, victim);
assert.ok(victim.hp < 25, 'hostile living target still takes damage');
console.log('direct-damage-target-safety: passed');
