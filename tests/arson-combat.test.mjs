import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const bonuses = readFileSync(new URL('../js/simulation-combat-bonuses.js', import.meta.url), 'utf8');
const { B, TE, U } = vm.runInNewContext(config + '\n;({B,TE,U})');
assert.ok(B.bar.rs.includes('arson'), 'Barracks offers Arson');
assert.equal(TE.arson.age, 2, 'Arson requires Castle Age');

assert.ok(bonuses.includes('function dmgT(a,t){'), 'combat owner must retain direct damage');
const S = { tech: [{ arson: 1 }, {}], ping: null, t: 0, al: 0 };
const context = {
  U, S, INFARM: new Set(['mil']), ARCHARM: new Set(['arc']),
  CAVARM: new Set(['knight']), PRA: {}, MA: {},
  isHostile: (a,b) => a !== b, fx: [], gt: 0,
  emit: () => {}, hitSnd: () => {}, note: () => {}, sfx: () => {},
  rumble: () => {}, W: 72, cmp: null, vm: 0,
};
vm.createContext(context);
// Isolated combat harness must load the same melee research bonus helper as production.
const bonusStart=bonuses.indexOf('function meleeResearchAttackBonus(');
assert.ok(bonusStart>=0,'melee attack helper is part of combat bonuses');
vm.runInContext(bonuses.slice(bonusStart),context);
const dmgT = vm.runInContext('dmgT', context);
function damage(attacker, building, arson) {
  S.tech[0].arson = arson;
  const target = { k: building ? 'house' : 'mil', t: 1, hp: 100, x: 1, y: 1, ...(building ? { s: 2 } : {}) };
  dmgT({ k: attacker, t: 0, x: 0, y: 0 }, target);
  return 100 - target.hp;
}
assert.equal(damage('mil', true, 1) - damage('mil', true, 0), 2,
  'Arson adds two damage against buildings for infantry');
assert.equal(damage('mil', false, 1), damage('mil', false, 0),
  'Arson does not boost infantry against units');
assert.equal(damage('knight', true, 1), damage('knight', true, 0),
  'Arson does not boost cavalry against buildings');
console.log('arson-combat: passed');
