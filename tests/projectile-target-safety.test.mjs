import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const a = src.indexOf('function pjs(dt){');
const b = src.indexOf('\nconst FOE_CELL=', a);
assert.ok(a >= 0 && b > a);
const S = { pj: [], us: [], bs: [] };
const U = { arc: { rng: 5, spl: 0 } };
let hits = 0;
const context = {
  W:72,H:72,S, U, isHostile: (a, b) => a !== b, dmgT: () => { hits++; },
  compactNotFlag: (array, flag) => { for (let i = array.length - 1; i >= 0; i--) if (array[i][flag]) array.splice(i, 1); },
};
vm.createContext(context);
vm.runInContext(src.slice(a, b), context);
const pjs = vm.runInContext('pjs', context);
const attacker = { k: 'arc', t: 0 };
const target = { x: 1, y: 1, t: 1, hp: 30 };
S.pj.push({ x: 1, y: 1, t: target, a: attacker });
pjs(1 / 30);
assert.equal(hits, 1, 'live hostile target takes projectile damage');
assert.equal(S.pj.length, 0, 'projectile is removed on impact');
for (const altered of [{ hp: 0 }, { ld: true }, { t: 0 }]) {
  const victim = { ...target, ...altered };
  S.pj.push({ x: 1, y: 1, t: victim, a: attacker });
  pjs(1 / 30);
  assert.equal(hits, 1, 'dead, loaded and allied targets cannot be hit');
  assert.equal(S.pj.length, 0, 'invalid target projectiles are removed');
}
S.pj.push({ x: NaN, y: 1, t: target, a: attacker });
S.pj.push({ x: 1, y: 1, t: null, a: attacker });
S.pj.push({ x: 1, y: 1, t: target, a: { k: 'unknown', t: 0 } });
S.pj.push({ x: 1, y: 1, t: { ...target, x: NaN }, a: attacker });
S.pj.push({ x: 1, y: 1, t: { ...target, hp: NaN }, a: attacker });
pjs(1 / 30);
assert.equal(S.pj.length, 0, 'invalid projectile records are discarded');
assert.equal(hits, 1);
console.log('projectile-target-safety: passed');

