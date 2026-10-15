import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const state = readFileSync(new URL('../js/state.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('researched unit display names have one shared owner outside engine orchestration', () => {
  assert.equal((state.match(/function unitName\s*\(/g) || []).length, 1);
  assert.equal((engine.match(/function unitName\s*\(/g) || []).length, 0);
  for (const label of ['Long Swordsman', 'Man-at-Arms', 'Pikeman', 'Arbalester', 'Elite Skirmisher', 'Light Cavalry', 'Cavalier']) {
    assert.ok(state.includes(label), 'missing researched unit label: ' + label);
  }
});
