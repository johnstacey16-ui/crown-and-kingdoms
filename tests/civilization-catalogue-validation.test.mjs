import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectCivilizationCatalogue,currentCivilizationRuntime} from '../scripts/check-civilization-catalogue.mjs';
const catalogue=JSON.parse(readFileSync(new URL('../data/civilizations.json',import.meta.url),'utf8'));
const runtime=currentCivilizationRuntime();
const altered=change=>{const copy=structuredClone(catalogue);change(copy);return inspectCivilizationCatalogue(copy,runtime);};

test('all active civilization IDs and unique units/technologies match actual game code',()=>{
 assert.deepEqual(inspectCivilizationCatalogue(catalogue,runtime),[]);
 assert.equal(catalogue.civilizations.length,26);
 assert.equal(runtime.civilizations.length,26);
});

test('reordering, dropping or duplicating civs fails instead of changing save/network IDs silently',()=>{
 assert.ok(altered(c=>c.civilizations.splice(0,1)).some(e=>/count mismatch|index differs|Invalid ordered/.test(e)));
 assert.ok(altered(c=>{c.civilizations[1].name=c.civilizations[0].name}).some(e=>/duplicate civilization name/.test(e)));
 assert.ok(altered(c=>{c.civilizations[0].id=1}).some(e=>/ordered civilization ID/.test(e)));
});

test('typos in unique units or unique technologies are caught against both config and engine',()=>{
 assert.ok(altered(c=>{c.civilizations[4].uniqueUnit='missing-elephant'}).some(e=>/unique unit/.test(e)));
 assert.ok(altered(c=>{c.civilizations[8].uniqueTechnology='invalid-tech'}).some(e=>/unique technology/.test(e)));
});

test('regional-unit definitions cannot falsely appear playable while runtime access is missing',()=>{
 assert.equal(catalogue.regionalUnitAccess.implementation,'missing');
 assert.equal(catalogue.regionalUnitAccess.entries.length,0);
 assert.ok(altered(c=>{c.regionalUnitAccess.entries.push({unit:'spear',civilizations:[0,1],buildings:['bar']})})
  .some(e=>/Unimplemented regional-unit/.test(e)));
 assert.ok(altered(c=>{c.regionalUnitAccess.implementation='partial';c.regionalUnitAccess.entries.push({
  unit:'not-a-unit',civilizations:[0],buildings:['bar']})}).some(e=>/regional unit/.test(e)));
});

test('reference rulesets are explicit and cannot be marked verified by adding names',()=>{
 const names=catalogue.rulesets.map(x=>x.id).sort();
 assert.deepEqual(names,['chronicles','medieval','return-of-rome']);
 assert.ok(altered(c=>c.rulesets.pop()).some(e=>/Missing reference ruleset/.test(e)));
 assert.ok(altered(c=>{c.rulesets[0].implementation='done'}).some(e=>/Invalid ruleset/.test(e)));
});
