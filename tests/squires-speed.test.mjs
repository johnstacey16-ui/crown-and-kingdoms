import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE } = vm.runInNewContext(config + '\n;({U,B,TE})');
assert.ok(B.bar.rs.includes('squires'), 'Barracks must offer Squires');
assert.equal(TE.squires.age, 2, 'Squires must unlock in Castle Age');

const start = simulation.indexOf('function unitSpeed(u){');
const end = simulation.indexOf('/* ===== COMBAT ===== */', start);
assert.ok(start >= 0 && end > start, 'unitSpeed implementation must exist');
const S = { tech: [{}, {}] };
const context = { U, S, CAVARM: new Set(['knight']), INFARM: new Set(['mil']) };
vm.createContext(context);
vm.runInContext(simulation.slice(start, end), context);
const speed = vm.runInContext('unitSpeed', context);
const infantry = { k: 'mil', t: 0 };
const cavalry = { k: 'knight', t: 0 };
assert.equal(speed(infantry), U.mil.sp);
assert.equal(speed(cavalry), U.knight.sp);
S.tech[0].squires = 1;
assert.ok(Math.abs(speed(infantry) - U.mil.sp * 1.1) < 1e-9, 'Squires speeds up infantry');
assert.equal(speed(cavalry), U.knight.sp, 'Squires does not speed up cavalry');
S.tech[0].husb = 1;
assert.ok(Math.abs(speed(cavalry) - U.knight.sp * 1.1) < 1e-9, 'Husbandry still speeds cavalry');
assert.equal(speed({ k: 'mil', t: 1 }), U.mil.sp, 'bonuses remain team-specific');
console.log('squires-speed: passed');
