import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8');
const start = source.indexOf('function auditGeneratedMap(starts){');
const end = source.indexOf('\nfunction prepareHillMap(starts){', start);
assert.ok(start >= 0 && end > start, 'map connectivity audit must exist');
const W = 32, H = 32;
const S = { wt: new Uint8Array(W * H), g: new Uint8Array(W * H), nd: new Array(W * H).fill(null) };
const context = { W, H, S };
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const audit = vm.runInContext('auditGeneratedMap', context);
const starts = [[4, 4], [27, 27]];
const allLand = audit(starts);
assert.equal(allLand.landReachable, true);
assert.equal(allLand.landComponents, 1);
assert.equal(allLand.navalAccess, false);
assert.equal(allLand.waterCells, 0);

for (let y = 0; y < H; y++) S.wt[y * W + 16] = 1;
const separated = audit(starts);
assert.equal(separated.landReachable, false, 'water barrier isolates land starts');
assert.equal(separated.landComponents, 2);
assert.equal(separated.navigableWaterConnected, true, 'continuous channel forms one water network');
assert.equal(separated.waterNetworkCoverage, 100);

S.wt[16 * W + 16] = 0;
const bridged = audit(starts);
assert.equal(bridged.landReachable, true, 'one-tile bridge reconnects land starts');
assert.equal(bridged.waterComponents, 2, 'bridge separates water channels');
assert.equal(bridged.navigableWaterConnected, false);

S.wt.fill(0);
for (let y = 2; y < 9; y++) for (let x = 2; x < 9; x++)
  if (x === 2 || x === 8 || y === 2 || y === 8) S.wt[y * W + x] = 1;
const island = audit([[5, 5], [27, 27]]);
assert.equal(island.landReachable, false, 'island start cannot walk to mainland');
assert.equal(island.landComponents, 2);
assert.equal(island.waterComponents, 1);
S.wt.fill(0);
for (let y = 0; y < H; y++) S.wt[y * W + 16] = 1;
const nearShore = [[14, 14]];
assert.equal(audit(nearShore).navalAccess, true, 'unobstructed shore supports dock construction');
S.g.fill(1);
assert.equal(audit(nearShore).navalAccess, false, 'occupied shore is not dockable');
S.g.fill(0);
for (let y = 0; y < H; y++) S.nd[y * W + 16] = { k: 'fish' };
assert.equal(audit(nearShore).navalAccess, false, 'water blocked by resource nodes is not usable dock frontage');
S.nd.fill(null);
S.wt.fill(0);
for (const invalid of [[[-1, 4], [27, 27]], [[4, H], [27, 27]], [[4.5, 4], [27, 27]]]) {
  assert.equal(audit(invalid).landReachable, false, 'invalid start coordinates cannot be treated as reachable');
}
assert.equal(audit([]).landReachable, false, 'empty start list cannot be reachable');
console.log('map-connectivity-audit: passed');
