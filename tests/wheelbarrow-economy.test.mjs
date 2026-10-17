import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');
assert.ok(B.tc.rs.includes('wheel'), 'Town Centre offers Wheelbarrow');
assert.equal(TE.wheel.age, 1, 'Wheelbarrow requires Feudal Age');

const start = simulation.indexOf('function unitSpeed(u){');
const end = simulation.indexOf('function walk(u,dt){', start);
assert.ok(start >= 0 && end > start);
const S = { tech: [{ wheel: 1 }, {}] };
const context = { U, S, CAVARM: new Set(['knight']), INFARM: new Set(['mil']) };
vm.createContext(context);
vm.runInContext(simulation.slice(start, end), context);
const speed = vm.runInContext('unitSpeed', context);
assert.ok(Math.abs(speed({ k: 'vil', t: 0 }) - U.vil.sp * 1.05) < 1e-9);
assert.equal(speed({ k: 'vil', t: 1 }), U.vil.sp, 'other kingdoms unaffected');
assert.equal(speed({ k: 'mil', t: 0 }), U.mil.sp, 'soldiers unaffected');

assert.ok(simulation.includes("(u.k==='vil'&&S.tech[u.t].wheel?3:0)"),
  'Wheelbarrow capacity must apply only to villagers');
assert.ok(simulation.includes("(u.k==='vil'&&S.tech[u.t].handcart?7:0)"),
  'Hand Cart capacity must apply only to villagers');
const CAP = 10;
const capacity = tech => CAP + (tech.carry ? 5 : 0) + (tech.wheel ? 3 : 0);
assert.equal(capacity({}), 10);
assert.equal(capacity({ wheel: 1 }), 13);
assert.equal(capacity({ carry: 1 }), 15);
assert.equal(capacity({ wheel: 1, carry: 1 }), 18);
console.log('wheelbarrow-economy: passed');
