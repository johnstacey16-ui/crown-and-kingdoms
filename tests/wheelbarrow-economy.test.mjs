import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');
assert.ok(B.tc.rs.includes('wheel'), 'Town Centre offers Wheelbarrow');
assert.equal(TE.wheel.age, 1, 'Wheelbarrow requires Feudal Age');

const start = simulation.indexOf('function unitSpeed(u){');
const end = simulation.indexOf('/* ===== COMBAT ===== */', start);
assert.ok(start >= 0 && end > start);
const S = { tech: [{ wheel: 1 }, {}] };
const context = { U, S, CAVARM: new Set(['knight']), INFARM: new Set(['mil']) };
vm.createContext(context);
vm.runInContext(simulation.slice(start, end), context);
const speed = vm.runInContext('unitSpeed', context);
assert.ok(Math.abs(speed({ k: 'vil', t: 0 }) - U.vil.sp * 1.1) < 1e-9);
assert.equal(speed({ k: 'vil', t: 1 }), U.vil.sp, 'other kingdoms unaffected');
assert.equal(speed({ k: 'mil', t: 0 }), U.mil.sp, 'soldiers unaffected');

const capStart = simulation.indexOf('function gatherCapacity(u){');
const capEnd = simulation.indexOf('function unitSpeed(u){', capStart);
assert.ok(capStart >= 0 && capEnd > capStart, 'gathering capacity helper exists');
context.CAP = 10;
vm.runInContext(simulation.slice(capStart, capEnd), context);
const capacity = vm.runInContext('gatherCapacity', context);
assert.equal(capacity({ k: 'vil', t: 0 }), 13, 'villagers receive cart upgrades');
assert.equal(capacity({ k: 'mil', t: 0 }), 10, 'military units do not receive cart capacity');
assert.equal(capacity({ k: 'vil', t: 1 }), 10, 'enemy villagers are unaffected');
S.tech[0].carry = 1;
assert.equal(capacity({ k: 'vil', t: 0 }), 18, 'carry and cart bonuses stack');
assert.equal(capacity({ k: 'mil', t: 0 }), 15, 'generic carrying upgrade still applies');
assert.ok(simulation.includes('u.car>=gatherCapacity(u)'), 'gathering uses capacity helper');
console.log('wheelbarrow-economy: passed');
