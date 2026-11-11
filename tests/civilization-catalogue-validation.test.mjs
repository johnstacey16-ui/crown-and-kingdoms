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
 assert.equal(catalogue.regionalUnitAccess.entries.length,4);
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

test('all ten technology restriction groups are versioned for every civilization',()=>{
 assert.equal(catalogue.schemaVersion,2);
 assert.equal(runtime.researchGroups.length,10);
 for(const entry of catalogue.civilizations){
  assert.equal(Object.keys(entry.researchFlags).length,10);
  for(const group of runtime.researchGroups)assert.equal(entry.researchFlags[group.id],group.flags[entry.name]);
 }
 assert.ok(altered(c=>{delete c.civilizations[0].researchFlags}).some(e=>/Research catalogue differs/.test(e)));
 assert.ok(altered(c=>{c.civilizations[0].researchFlags.archery='xa'}).some(e=>/Research catalogue differs/.test(e)));
 assert.ok(altered(c=>{c.civilizations[0].researchFlags.invented='x'}).some(e=>/Unknown catalogue research group/.test(e)));
});

const rosterSource=readFileSync(new URL('../js/civilizations.js',import.meta.url),'utf8');
const configSource=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const kingdomSource=readFileSync(new URL('../js/kingdom.js',import.meta.url),'utf8');
test('a missing live research row is rejected before permissive fallback can hide it',()=>{
 const missing=currentCivilizationRuntime(rosterSource,configSource,kingdomSource.replace(" 'Franks':'x',",''));
 assert.ok(inspectCivilizationCatalogue(catalogue,missing).some(e=>/Missing research row archery for Franks/.test(e)));
 const unknown=currentCivilizationRuntime(rosterSource,configSource,kingdomSource.replace('const CIV_ARCHERY_RESEARCH=Object.freeze({',"const CIV_ARCHERY_RESEARCH=Object.freeze({'Invented':'x',"));
 assert.ok(inspectCivilizationCatalogue(catalogue,unknown).some(e=>/Unknown civilization row Invented/.test(e)));
});

test('invalid and duplicate live research flags fail even when the inventory copies them',()=>{
 for(const flags of ['xz','xx']){
  const bad=currentCivilizationRuntime(rosterSource,configSource,kingdomSource.replace("'Franks':'x'",`'Franks':'${flags}'`));
  const copied=structuredClone(catalogue);copied.civilizations[0].researchFlags.archery=flags;
  assert.ok(inspectCivilizationCatalogue(copied,bad).some(e=>/Invalid research flags archery for Franks/.test(e)));
 }
});

test('compiled technology access must include each available upgrades prerequisite',()=>{
 const bad=currentCivilizationRuntime(rosterSource,configSource,kingdomSource.replace("'Franks':'x'","'Franks':'a'"));
 const copied=structuredClone(catalogue);copied.civilizations[0].researchFlags.archery='a';
 assert.ok(inspectCivilizationCatalogue(copied,bad).some(e=>/Unavailable research prerequisite xbow for Franks \/ arb/.test(e)));
 const unknown=currentCivilizationRuntime(rosterSource,configSource.replace("pre:'xbow'","pre:'missing-tech'"),kingdomSource);
 assert.ok(inspectCivilizationCatalogue(catalogue,unknown).some(e=>/Unavailable research prerequisite missing-tech/.test(e)));
});


test('live flag mappings must use distinct single-character codes and real research keys',()=>{
 const invalid=currentCivilizationRuntime(rosterSource,configSource,kingdomSource.replace("forging:'f'","forging:''"));
 assert.ok(inspectCivilizationCatalogue(catalogue,invalid).some(e=>/Invalid research flag mapping in melee/.test(e)));
 const unknown=currentCivilizationRuntime(rosterSource,configSource,kingdomSource.replace("forging:'f'","missingForge:'f'"));
 assert.ok(inspectCivilizationCatalogue(catalogue,unknown).some(e=>/Unknown research technology missingForge/.test(e)));
});

test('research prerequisite graphs reject cycles and later-age dependencies',()=>{
 const cyclic=currentCivilizationRuntime(rosterSource,configSource.replace("pre:'xbow'","pre:'arb'"),kingdomSource);
 assert.ok(inspectCivilizationCatalogue(catalogue,cyclic).some(e=>/Cyclic research prerequisite at arb/.test(e)));
 const later=currentCivilizationRuntime(rosterSource,configSource.replace("pre:'atkR'","pre:'atkR2'"),kingdomSource);
 assert.ok(inspectCivilizationCatalogue(catalogue,later).some(e=>/Later-age research prerequisite atkR2/.test(e)));
});


test('a technology can depend on research available at another building in the same civilization',()=>{
 const crossBuilding=currentCivilizationRuntime(rosterSource.replace("k:'ut0',n:'Chivalry'","k:'ut0',pre:'forging',n:'Chivalry'"),configSource,kingdomSource);
 assert.ok(crossBuilding.researchAvailability[0].smith.includes('forging'));
 assert.ok(!crossBuilding.researchAvailability[0].castle.includes('forging'));
 assert.deepEqual(inspectCivilizationCatalogue(catalogue,crossBuilding),[],'prerequisites use the shared kingdom technology state');
});

test('Goths second Castle technology is unique, registered, indexed and validated',()=>{
 assert.equal(catalogue.civilizations[18].name,'Goths');
 assert.equal(catalogue.civilizations[18].secondUniqueTechnology,'ut18p');
 assert.equal(runtime.civilizations[18].secondUniqueTechnology,'ut18p');
 assert.equal(runtime.technologies.ut18p.n,'Perfusion');
 assert.ok(runtime.researchAvailability[18].castle.includes('ut18p'));
 for(let i=0;i<runtime.researchAvailability.length;i++)if(i!==18)
  assert.ok(!runtime.researchAvailability[i].castle.includes('ut18p'));
 for(const bad of [undefined,'ut0','does-not-exist']){
  assert.ok(altered(c=>{
   if(bad===undefined)delete c.civilizations[18].secondUniqueTechnology;
   else c.civilizations[18].secondUniqueTechnology=bad;
  }).some(e=>/second unique technology/.test(e)),'reject missing, borrowed or invented unique tech');
 }
});

test('Goths Elite Huskarl upgrade is indexed, restricted and correctly registered',()=>{
 assert.equal(catalogue.civilizations[18].eliteUpgrade,'eliteHuskarl');
 assert.equal(runtime.civilizations[18].eliteUpgrade,'eliteHuskarl');
 assert.equal(runtime.technologies.eliteHuskarl.n,'Elite Huskarl');
 assert.equal(runtime.technologies.eliteHuskarl.age,3);
 assert.ok(runtime.researchAvailability[18].castle.includes('eliteHuskarl'));
 for(let i=0;i<runtime.researchAvailability.length;i++)if(i!==18)
  assert.ok(!runtime.researchAvailability[i].castle.includes('eliteHuskarl'));
 for(const wrong of [undefined,'ut18p','not-research']){
  assert.ok(altered(c=>{
   if(wrong===undefined)delete c.civilizations[18].eliteUpgrade;
   else c.civilizations[18].eliteUpgrade=wrong;
  }).some(e=>/Elite unique-unit upgrade/.test(e)));
 }
});

test('Frank, Briton, Mongol and Goth Elite upgrades have valid registered Imperial definitions',()=>{
 for(const [id,key,cost,unit] of [
  [0,'eliteAxeman',{f:950,g:750},'axe'],
  [1,'eliteLongbowman',{f:850,g:850},'lbow'],
  [2,'eliteMangudai',{f:1100,g:675},'mgd'],
  [18,'eliteHuskarl',{f:1200,g:550},'huskarl']
 ]){
  assert.equal(catalogue.civilizations[id].eliteUpgrade,key);
  assert.equal(runtime.civilizations[id].eliteUpgrade,key);
  assert.equal(runtime.technologies[key].age,3);
  assert.equal(runtime.technologies[key].t>0,true);
  assert.equal(JSON.stringify(runtime.technologies[key].cost),JSON.stringify(cost));
  assert.ok(runtime.researchAvailability[id].castle.includes(key));
  assert.equal(runtime.civilizations[id].uniqueUnit,unit);
  for(let other=0;other<runtime.civilizations.length;other++)if(other!==id)
   assert.equal(runtime.researchAvailability[other].castle.includes(key),false);
 }
 for(const [id,key] of [[0,'eliteAxeman'],[1,'eliteLongbowman'],[2,'eliteMangudai']]){
  assert.ok(altered(c=>{delete c.civilizations[id].eliteUpgrade}).some(e=>/Elite unique-unit upgrade/.test(e)));
  assert.ok(altered(c=>{c.civilizations[id].eliteUpgrade='eliteHuskarl'}).some(e=>/Elite unique-unit upgrade/.test(e)));
 }
});

test('Frankish Bearded Axes second technology is Imperial and faction exclusive',()=>{
 assert.equal(catalogue.civilizations[0].secondUniqueTechnology,'ut0p');
 assert.equal(runtime.civilizations[0].secondUniqueTechnology,'ut0p');
 assert.equal(runtime.technologies.ut0p.n,'Bearded Axes');
 assert.equal(runtime.technologies.ut0p.age,3);
 assert.ok(runtime.researchAvailability[0].castle.includes('ut0p'));
 for(let id=1;id<runtime.civilizations.length;id++)
  assert.equal(runtime.researchAvailability[id].castle.includes('ut0p'),false);
 for(const value of [undefined,'ut18p','not-a-technology'])
  assert.ok(altered(c=>{
   if(value===undefined)delete c.civilizations[0].secondUniqueTechnology;
   else c.civilizations[0].secondUniqueTechnology=value;
  }).some(e=>/second unique technology/.test(e)));
});
