import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {currentCivilizationRuntime} from '../scripts/check-civilization-catalogue.mjs';

const runtime=currentCivilizationRuntime();
const graphics=JSON.parse(readFileSync(new URL('../docs/graphics-inventory.json',import.meta.url),'utf8'));
const defenseOnly=new Set(['tw','cs','tca']);

test('art inventory covers every playable unit and building without phantom completed assets',()=>{
 const units=Object.keys(runtime.units).filter(k=>!defenseOnly.has(k)).sort();
 const recorded=graphics.units.map(u=>u.kind).sort();
 assert.equal(new Set(recorded).size,recorded.length,'each playable kind appears once');
 assert.deepEqual(recorded,units,'no playable unit can be silently omitted from graphics backlog');
 const buildings=Object.keys(runtime.buildings).sort();
 const built=graphics.buildings.map(b=>b.kind).sort();
 assert.equal(new Set(built).size,built.length,'no duplicate building asset record');
 assert.deepEqual(built,buildings,'new buildings must be explicitly inventoried');
});
test('remaining Sicilian through Georgian source-only assets are honestly procedural',()=>{
 for(const kind of ['winged','husswagon','houfnice','thirisadai','monaspa']){
  const entry=graphics.units.find(unit=>unit.kind===kind);
  assert.ok(entry,kind+' missing');
  assert.equal(entry.paintedBase,false,kind+' has no dedicated painted artwork yet');
  assert.equal(entry.walkFrames,0);
  assert.equal(entry.attackFrames,0);
 }
 for(const kind of ['eagle','cavarch','rattan','composite','serjeant','obuch','legionary','footkonnik','flemish','warpriest','konnik','keshik','leitis','urumi','chakram','centurion']){
  const entry=graphics.units.find(unit=>unit.kind===kind);
  assert.equal(entry.paintedBase,true,kind+' now has an integrated painted sheet');
  assert.equal(entry.walkFrames,8);assert.equal(entry.attackFrames,8);
 }
 for(const kind of ['donjon','folwark','fchurch','mule'])
  assert.equal(graphics.buildings.find(b=>b.kind===kind)?.paintedBase,false);
 assert.equal(graphics.complete,false,'partial art never constitutes whole-game acceptance');
});


test('original painted art production queue tracks only the remaining genuinely missing sheets',()=>{
 const queue=JSON.parse(readFileSync(new URL('../docs/painted-motion-production-queue.json',import.meta.url),'utf8'));
 const missing=graphics.units.filter(unit=>unit.walkFrames<8||unit.attackFrames<8).map(unit=>unit.kind).sort();
 const promised=queue.items.map(item=>item.kind).sort();
 assert.deepEqual(promised,missing,'art briefs must not claim or omit an already painted sheet');
 assert.equal(new Set(promised).size,promised.length,'one authored brief per distinct unit kind');
 assert.deepEqual(queue.shared.sourceDimensions,[1536,1024]);
 assert.equal(queue.items.length,18,'track the remaining 18 unfinished types until source art is checked in');
 assert.ok(queue.items.every(item=>item.state==='pending-generation'&&item.artStatus.includes('missing')));
 assert.ok(queue.items.every(item=>item.identity.length>55&&item.equipment.length>45&&item.motion.length>48));
 assert.ok(queue.items.every(item=>item.reference.startsWith('assets/painted-motion-')&&item.reference.endsWith('.webp')));
 assert.ok(queue.items.every(item=>Number.isInteger(item.batch)&&item.batch>=1&&item.batch<=5));
 const packer=readFileSync(new URL('../scripts/build-motion-atlas.mjs',import.meta.url),'utf8');
 assert.match(packer,/availableKinds\.has\(kind\)/,'new queued unit names can be admitted by --source');
 assert.match(packer,/sources\[kind\]\|\|existsSync\(/,'approved new art is optional until it exists');
 assert.match(packer,/selectedKinds\.length\*16/,'rebuild reports actual original poses, not missing future art');
 assert.match(packer,/info\.width!==1536\|\|info\.height!==1024/,'new source has native sprite-sheet dimensions');
});
