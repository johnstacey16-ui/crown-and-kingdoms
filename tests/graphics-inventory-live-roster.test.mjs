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
test('all new Sicilian through Roman source-only assets are honestly procedural',()=>{
 for(const kind of ['serjeant','obuch','winged','husswagon','houfnice','urumi','thirisadai','centurion','legionary']){
  const entry=graphics.units.find(unit=>unit.kind===kind);
  assert.ok(entry,kind+' missing');
  assert.equal(entry.paintedBase,false,kind+' has no dedicated painted artwork yet');
  assert.equal(entry.walkFrames,0);
  assert.equal(entry.attackFrames,0);
 }
 for(const kind of ['donjon','folwark'])
  assert.equal(graphics.buildings.find(b=>b.kind===kind)?.paintedBase,false);
 assert.equal(graphics.complete,false,'partial art never constitutes whole-game acceptance');
});
