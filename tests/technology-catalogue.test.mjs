// Validate technology catalogue wiring without launching the browser runtime.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const { U, B, TE, AG } = vm.runInNewContext(source + '\n;({U,B,TE,AG})');
const offered = new Set();

for (const [buildingId, building] of Object.entries(B)) {
  for (const techId of building.rs || []) {
    assert.ok(TE[techId], `${buildingId} offers undefined technology ${techId}`);
    offered.add(techId);
  }
  for (const unitId of building.tr || []) {
    assert.ok(U[unitId], `${buildingId} trains undefined unit ${unitId}`);
  }
}
for (const [id, tech] of Object.entries(TE)) {
  assert.ok(offered.has(id), `technology ${id} cannot be researched at any building`);
  assert.ok(Number.isFinite(tech.t) && tech.t > 0, `technology ${id} has invalid research time`);
  assert.ok(Number.isInteger(tech.age) && tech.age >= 0 && tech.age < AG.length,
    `technology ${id} has invalid age`);
  for (const [resource, amount] of Object.entries(tech.cost || {})) {
    assert.ok(['f', 'w', 'g', 's'].includes(resource) && Number.isFinite(amount) && amount >= 0,
      `technology ${id} has invalid cost for ${resource}`);
  }
  for (const field of ['hpb', 'atkb']) {
    for (const [unitId, bonus] of Object.entries(tech[field] || {})) {
      assert.ok(U[unitId], `technology ${id} modifies unknown unit ${unitId}`);
      assert.ok(Number.isFinite(bonus), `technology ${id} has invalid ${field} bonus`);
    }
  }
  if (tech.pre) {
    assert.ok(TE[tech.pre], `technology ${id} requires unknown technology ${tech.pre}`);
    assert.ok(TE[tech.pre].age <= tech.age,
      `technology ${id} is available before prerequisite ${tech.pre}`);
  }
}
for (const id of Object.keys(TE)) {
  const seen = new Set([id]);
  let current = TE[id].pre;
  while (current) {
    assert.ok(!seen.has(current), `cyclic technology prerequisite at ${id}`);
    seen.add(current);
    current = TE[current].pre;
  }
}
console.log(`technology-catalogue: ${Object.keys(TE).length} technologies validated`);
