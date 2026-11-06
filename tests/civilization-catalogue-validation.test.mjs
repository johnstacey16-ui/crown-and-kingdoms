import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {browserScriptPaths,coreGameScriptPaths} from '../scripts/runtime-sources.mjs';
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

test('typos in unique units or unique technologies are caught against config and the shared roster',()=>{
 assert.ok(altered(c=>{c.civilizations[4].uniqueUnit='missing-elephant'}).some(e=>/unique unit/.test(e)));
 assert.ok(altered(c=>{c.civilizations[8].uniqueTechnology='invalid-tech'}).some(e=>/unique technology/.test(e)));
});

test('one civilization module supplies the browser, headless and offline runtimes',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const roster=readFileSync(new URL('../js/civilizations.js',import.meta.url),'utf8');
 const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
 const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const paths of [browserScriptPaths(html),coreGameScriptPaths(html),coreGameScriptPaths(html,{includeUI:false,includeAssets:false})]){
  assert.equal(paths.filter(p=>p==='./js/civilizations.js').length,1);
  assert.ok(paths.indexOf('./js/civilizations.js')<paths.indexOf('./engine.js'));
 }
 assert.doesNotMatch(engine,/const CIV=\[/);assert.ok(worker.includes("'./js/civilizations.js'"));
 const registered=vm.runInNewContext(config+'\n'+roster+'\nCIV.every(c=>TE[c.ut.k]===c.ut)');
 assert.equal(registered,true,'each unique technology is registered as the original live object');
});

test('catalogue validation reads roster data directly and catches an altered ordered entry',()=>{
 const roster=readFileSync(new URL('../js/civilizations.js',import.meta.url),'utf8');
 const changed=currentCivilizationRuntime(roster.replace("n:'Franks'","n:'Changed Franks'"));
 assert.ok(inspectCivilizationCatalogue(catalogue,changed).some(e=>/differs|mismatch/.test(e)));
});

test('Camel Rider regional availability and indexed source/running rules match',()=>{
 assert.equal(catalogue.regionalUnitAccess.implementation,'partial');
 assert.equal(catalogue.regionalUnitAccess.entries.length,1);
 assert.deepEqual(catalogue.regionalUnitAccess.entries[0].civilizations,[2,3,4,8,9,13,22,23]);
 assert.ok(altered(c=>{c.regionalUnitAccess.entries[0].civilizations=[0,1]})
  .some(e=>/Regional production runtime differs/.test(e)));
 assert.ok(altered(c=>{c.regionalUnitAccess.entries.push({unit:'spear',civilizations:[0,1],buildings:['bar']})})
  .some(e=>/Regional production runtime differs/.test(e)));
 assert.ok(altered(c=>{c.regionalUnitAccess.entries[0].unit='not-a-unit'})
  .some(e=>/Invalid\/duplicate regional unit/.test(e)));
 assert.ok(altered(c=>{c.regionalUnitAccess.entries[0].civilizations=[2,2]})
  .some(e=>/Invalid regional civilization eligibility/.test(e)));
});

test('reference rulesets are explicit and cannot be marked verified by adding names',()=>{
 const names=catalogue.rulesets.map(x=>x.id).sort();
 assert.deepEqual(names,['chronicles','medieval','return-of-rome']);
 assert.ok(altered(c=>c.rulesets.pop()).some(e=>/Missing reference ruleset/.test(e)));
 assert.ok(altered(c=>{c.rulesets[0].implementation='done'}).some(e=>/Invalid ruleset/.test(e)));
});
