import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/simulation-building-production.js', import.meta.url), 'utf8');
const start = source.indexOf('function spawnPos(b){');
const end = source.indexOf('\nconst MILITARY_PRODUCTION_BUILDINGS=', start);
assert.ok(start >= 0 && end > start);
const W = 12, H = 12;
const S = { us: [], g: new Uint8Array(W * H), wt: new Uint8Array(W * H), nd: new Array(W * H).fill(null) };
const context = { W, H, S };
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const spawnPos = vm.runInContext('spawnPos', context);
const tc = { k: 'tc', x: 4, y: 4, s: 3 };
const dock = { k: 'dock', x: 4, y: 4, s: 3 };
const neighbors = [];
for (let i = -1; i <= tc.s; i++) neighbors.push(
  [tc.x + i, tc.y - 1], [tc.x + i, tc.y + tc.s],
  [tc.x - 1, tc.y + i], [tc.x + tc.s, tc.y + i]
);
function blockAll() {
  for (const [x, y] of neighbors) S.g[y * W + x] = 1;
}
blockAll();
assert.equal(spawnPos(tc), null, 'surrounded production building cannot spawn units');
S.g[3 * W + 4] = 0;
S.wt[3 * W + 4] = 1;
assert.equal(spawnPos(tc), null, 'land units cannot spawn in water');
S.wt[3 * W + 4] = 2;
assert.deepEqual(Array.from(spawnPos(tc)), [4.5, 3.5], 'land units can spawn on shallow ford terrain');
S.wt[3 * W + 4] = 0;
S.nd[3 * W + 4] = { k: 'tree' };
assert.equal(spawnPos(tc), null, 'land units cannot spawn on resource nodes');
S.nd[3 * W + 4] = null;
assert.deepEqual(Array.from(spawnPos(tc)), [4.5, 3.5], 'valid land spawn is found');
S.g.fill(0);
S.wt.fill(0);
assert.equal(spawnPos(dock), null, 'ships require water');
S.wt[3 * W + 4] = 2;
assert.deepEqual(Array.from(spawnPos(dock)), [4.5, 3.5], 'ships support both water terrain types');
S.wt[3 * W + 4] = 1;
assert.deepEqual(Array.from(spawnPos(dock)), [4.5, 3.5], 'ships spawn on navigable water');
S.nd[3 * W + 4] = { k: 'fish' };
assert.equal(spawnPos(dock), null, 'ships cannot spawn on occupied resource tiles');
console.log('production-spawn-terrain: passed');
