import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');
assert.ok(B.tc.rs.includes('handcart'), 'Town Centre offers Hand Cart');
assert.equal(TE.handcart.age, 2, 'Hand Cart unlocks in Castle Age');
assert.equal(TE.handcart.pre, 'wheel', 'Hand Cart requires Wheelbarrow');

const start = simulation.indexOf('function unitSpeed(u){');
const end = simulation.indexOf('function walk(u,dt){', start);
assert.ok(start >= 0 && end > start);
const S = { tech: [{ wheel: 1, handcart: 1 }, {}] };
const context = { U, S, CAVARM: new Set(['knight']), INFARM: new Set(['mil']) };
vm.createContext(context);
vm.runInContext(simulation.slice(start, end), context);
const speed = vm.runInContext('unitSpeed', context);
assert.ok(Math.abs(speed({ k: 'vil', t: 0 }) - U.vil.sp * 1.05 * 1.05) < 1e-9,
  'Hand Cart and Wheelbarrow stack for villagers');
assert.equal(speed({ k: 'vil', t: 1 }), U.vil.sp, 'opponents are unaffected');
assert.equal(speed({ k: 'mil', t: 0 }), U.mil.sp, 'infantry are unaffected');

assert.ok(simulation.includes('+(S.tech[u.t].handcart?7:0)'),
  'gathering capacity includes Hand Cart bonus');
const capacity = tech => 10 + (tech.carry ? 5 : 0) + (tech.wheel ? 3 : 0) + (tech.handcart ? 7 : 0);
assert.equal(capacity({}), 10);
assert.equal(capacity({ wheel: 1 }), 13);
assert.equal(capacity({ wheel: 1, handcart: 1 }), 20);
assert.equal(capacity({ carry: 1, wheel: 1, handcart: 1 }), 25);
console.log('handcart-economy: passed');
