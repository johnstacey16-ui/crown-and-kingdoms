import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const sim = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');
assert.ok(B.tc.rs.includes('loom'), 'Town Centre must offer Loom');
assert.equal(TE.loom.age, 0, 'Loom must be available in the Founding Age');
assert.equal(TE.loom.hpb.vil, 15, 'Loom grants 15 villager hit points');

const start = sim.indexOf('const mhp=u=>');
const end = sim.indexOf('\n', start);
assert.ok(start >= 0 && end > start, 'max-health helper must be present');
const S = { tech: [{}, {}] };
const context = { U, S };
vm.createContext(context);
vm.runInContext(sim.slice(start, end), context);
const mhp = vm.runInContext('mhp', context);
const villager = { k: 'vil', t: 0 };
const opponent = { k: 'vil', t: 1 };
assert.equal(mhp(villager), U.vil.hp);
S.tech[0].hpb = { ...TE.loom.hpb };
assert.equal(mhp(villager), U.vil.hp + 15, 'Loom improves maximum villager health');
assert.equal(mhp(opponent), U.vil.hp, 'Loom does not affect other kingdoms');
assert.equal(mhp({ k: 'mil', t: 0 }), U.mil.hp, 'Loom does not affect soldiers');
console.log('loom-health: passed');
