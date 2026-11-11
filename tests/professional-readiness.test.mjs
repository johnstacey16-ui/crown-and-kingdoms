import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {professionalReadiness,renderReadiness} from '../scripts/professional-readiness.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const inventory=read('data/civilizations.json'),graphics=read('docs/graphics-inventory.json'),atlas=read('assets/atlas-manifest.json');
test('readiness metrics report actual content without claiming full completion',()=>{
 const r=professionalReadiness(inventory,graphics,atlas);
 assert.equal(r.metrics.civilizations,40);
 assert.equal(r.metrics.eliteResearchLines,40);
 assert.equal(r.metrics.secondUniqueTechnologies,40);
 assert.equal(r.metrics.totalUnits,79);
 assert.equal(r.metrics.paintedUnitBases,50);
 assert.equal(r.metrics.movementAndAttackSheets,50);
 assert.equal(r.metrics.independentDirectionArt,0);
 assert.equal(r.metrics.dedicatedDeathArt,0);
 assert.equal(r.metrics.factionArchitecture,0);
 assert.equal(r.metrics.totalBuildings,26);
 assert.equal(r.metrics.atlasEntries,atlas.atlases.length);
 assert.match(r.gates.graphics,/PARTIAL/);
 assert.match(r.gates.xbox,/UNVERIFIED/);
 assert.match(r.gates.multiplayer,/PARTIAL/);
 assert.match(r.gates.release,/NOT VERIFIED/);
 assert.match(renderReadiness(r),/never device, player, match balance or production acceptance/i);
});
test('report rejects malformed or renumbered civilization inventories',()=>{
 assert.throws(()=>professionalReadiness({},graphics,atlas),/Missing/);
 assert.throws(()=>professionalReadiness({...inventory,civilizations:[{id:77,name:'Invalid'}]},graphics,atlas),/ordered/);
});
test('unverified art state never turns into completed art from full base coverage alone',()=>{
 const report=professionalReadiness(inventory,{...graphics,complete:true},atlas);
 assert.match(report.gates.graphics,/PARTIAL/);
});
