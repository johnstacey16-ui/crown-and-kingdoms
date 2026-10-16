import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const configSource = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const sandbox = {};
vm.runInNewContext(configSource + '\n globalThis.__buildings = B;', sandbox);

const farm = sandbox.__buildings.farm;
assert.ok(farm, 'Farm building configuration must exist');
assert.ok(farm.hp >= 200, 'Farms must have meaningful durability, not one hit point');
assert.ok(farm.bt >= 10, 'Farm construction must take time, not complete instantly');
assert.ok(Number.isFinite(farm.hp / farm.bt), 'Farm construction health progress must remain finite');

console.log('Farm durability and construction balance passed');
