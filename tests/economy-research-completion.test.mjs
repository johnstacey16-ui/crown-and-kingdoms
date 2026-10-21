import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');
const start = simulation.indexOf('function upB(b,dt){');
const end = simulation.indexOf('\nfunction ', start + 15);
assert.ok(start >= 0 && end > start, 'building update must be available');

const villager = { k: 'vil', t: 0, hp: U.vil.hp };
const enemy = { k: 'vil', t: 1, hp: U.vil.hp };
const tc = { k: 'tc', t: 0, hp: 900, done: true, rs: { k: 'loom', t: 1 }, q: [] };
const S = { tech: [{}, {}], us: [villager, enemy], bs: [tc], res: [{}, {}] };
const context = {
  // Isolated economy harness: no combat targets are returned by foe.
  attackRange: () => 0,
  S, U, B, TE, W: 64, Sfx: {},
  note: () => {}, sfx: () => {}, emit: () => {}, rumble: () => {},
  foe: () => null,
};
vm.createContext(context);
vm.runInContext(simulation.slice(start, end), context);
const upB = vm.runInContext('upB', context);
upB(tc, 1);
assert.equal(tc.rs, null, 'Loom research finishes');
assert.equal(S.tech[0].loom, 1, 'Loom becomes researched');
assert.equal(S.tech[0].hpb.vil, 15, 'Loom maximum health bonus is recorded');
assert.equal(villager.hp, U.vil.hp + 15, 'existing villagers gain health');
assert.equal(enemy.hp, U.vil.hp, 'enemy villagers remain unchanged');

tc.rs = { k: 'wheel', t: 1 };
upB(tc, 1);
assert.equal(S.tech[0].wheel, 1, 'Wheelbarrow completion records technology');
tc.rs = { k: 'handcart', t: 1 };
upB(tc, 1);
assert.equal(S.tech[0].handcart, 1, 'Hand Cart completion records technology');
console.log('economy-research-completion: passed');

