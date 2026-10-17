import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const { U, B, TE, AG } = vm.runInNewContext(source + '\n;({U,B,TE,AG})');
const errors = [];
const researchSites = new Map();
for (const [building, def] of Object.entries(B)) {
  for (const tech of def.rs || []) {
    if (!TE[tech]) errors.push(`building ${building} references missing technology ${tech}`);
    else researchSites.set(tech, (researchSites.get(tech) || 0) + 1);
  }
  for (const unit of def.tr || []) {
    if (!U[unit]) errors.push(`building ${building} trains missing unit ${unit}`);
  }
}
for (const [tech, def] of Object.entries(TE)) {
  if (!researchSites.has(tech)) errors.push(`technology ${tech} has no research site`);
  if (!Number.isFinite(def.t) || def.t <= 0) errors.push(`technology ${tech} has invalid duration`);
  if (!Number.isInteger(def.age) || def.age < 0 || def.age >= AG.length) errors.push(`technology ${tech} has invalid age`);
  if (def.pre && !TE[def.pre]) errors.push(`technology ${tech} requires missing technology ${def.pre}`);
  if (def.pre && TE[def.pre] && TE[def.pre].age > def.age) errors.push(`technology ${tech} precedes its prerequisite age`);
  for (const [resource, amount] of Object.entries(def.cost || {})) {
    if (!['f', 'w', 'g', 's'].includes(resource) || !Number.isFinite(amount) || amount < 0) {
      errors.push(`technology ${tech} has invalid cost ${resource}:${amount}`);
    }
  }
  for (const unit of Object.keys(def.hpb || {})) {
    if (!U[unit]) errors.push(`technology ${tech} boosts missing unit HP ${unit}`);
  }
  for (const unit of Object.keys(def.atkb || {})) {
    if (!U[unit]) errors.push(`technology ${tech} boosts missing unit attack ${unit}`);
  }
}
assert.deepEqual(errors, [], 'technology and production catalogue integrity:\n' + errors.join('\n'));
console.log('technology-catalogue-integrity: passed');
