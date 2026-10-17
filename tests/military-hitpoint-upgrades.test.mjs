import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const { U, B, TE, AG } = vm.runInNewContext(config + '\n;({U,B,TE,AG})');
const stable = { k: 'stable', t: 0, hp: B.stable.hp, done: true, rs: null, q: [] };
const other = { ...stable, rs: null, q: [] };
const dock = { k: 'dock', t: 0, hp: B.dock.hp, done: true, rs: null, q: [] };
const cavalry = { k: 'knight', t: 0, hp: U.knight.hp };
const wounded = { k: 'scout', t: 0, hp: 1 };
const fallen = { k: 'camel', t: 0, hp: 0 };
const enemy = { k: 'knight', t: 1, hp: U.knight.hp };
const ship = { k: 'gal', t: 0, hp: U.gal.hp };
const sunken = { k: 'fish', t: 0, hp: -3 };
const S = {
  age: [2, 2], tech: [{}, {}], bs: [stable, other, dock],
  us: [cavalry, wounded, fallen, enemy, ship, sunken],
  res: Array.from({ length: 2 }, () => ({ f: 2000, w: 2000, g: 2000, s: 2000 })),
};
const context = {
  U, B, TE, AG, S, note: () => {}, sfx: () => {},
  can: (team, cost) => Object.entries(cost).every(([k, n]) => S.res[team][k] >= n),
  pay: (team, cost) => { for (const [k, n] of Object.entries(cost)) S.res[team][k] -= n; },
};
vm.createContext(context);
function load(start, end) {
  const a = simulation.indexOf(start), b = simulation.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'missing source segment: ' + start);
  vm.runInContext(simulation.slice(a, b), context);
}
load('function research(b,k){', 'const MILITARY_PRODUCTION_BUILDINGS=');
load('function upB(b,dt){', '\nfunction train(b,k){');
const research = vm.runInContext('research', context);
const upB = vm.runInContext('upB', context);
assert.equal(research(stable, 'blood'), true);
assert.equal(research(other, 'blood'), false, 'duplicate Bloodlines research is blocked');
upB(stable, TE.blood.t / 2);
assert.equal(cavalry.hp, U.knight.hp, 'upgrade cannot apply before completion');
upB(stable, TE.blood.t / 2);
assert.equal(cavalry.hp, U.knight.hp + 20, 'existing cavalry receive HP bonus');
assert.equal(wounded.hp, 21, 'wounded cavalry gain the bonus');
assert.equal(fallen.hp, 0, 'dead cavalry remain dead');
assert.equal(enemy.hp, U.knight.hp, 'enemy cavalry are unaffected');
assert.equal(ship.hp, U.gal.hp, 'ships do not gain Bloodlines');
assert.equal(S.tech[0].hpb.knight, 20, 'new cavalry inherit HP bonus');
assert.equal(research(stable, 'blood'), false, 'completed research cannot repeat');
assert.equal(research(dock, 'navalHull'), true);
upB(dock, TE.navalHull.t);
assert.equal(ship.hp, U.gal.hp + 35, 'existing ships gain reinforced hulls');
assert.equal(sunken.hp, -3, 'sunken ships cannot be resurrected');
assert.equal(S.tech[0].hpb.gal, 35, 'new ships inherit hull upgrades');
assert.equal(cavalry.hp, U.knight.hp + 20, 'ship upgrades do not affect cavalry');
console.log('military-hitpoint-upgrades: passed');
