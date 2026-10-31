import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {coreGameScriptPaths} from '../scripts/runtime-sources.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const checker = readFileSync(new URL('../scripts/check-game.mjs', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');
const ai = readFileSync(new URL('../js/ai.js', import.meta.url), 'utf8');

test('enemy strategy has one cohesive owner in js/ai.js', () => {
  for (const name of ['aiBuild','aiWall','aiDock','aiRebal','aiNear','aiRetreat','ai','aiTeam']) {
    assert.equal((ai.match(new RegExp('function ' + name + '\\s*\\(', 'g')) || []).length, 1,
      name + ' must be declared exactly once in js/ai.js');
    assert.equal((simulation.match(new RegExp('function ' + name + '\\s*\\(', 'g')) || []).length, 0,
      name + ' must not stay in the simulation module');
  }
  assert.ok(simulation.includes('ai(dt)'), 'The fixed-step simulation must still call the AI entry point');
  assert.ok(ai.includes('techPriority'), 'Composition-aware technology selection must stay inside the AI module');
  assert.ok(ai.includes('navalHull') && ai.includes('navalAtk'), 'Naval counter-research priorities must be retained');
});

test('AI script order, offline support and syntax checks are wired consistently', () => {
  const simAt = html.indexOf('./js/simulation.js');
  const aiAt = html.indexOf('./js/ai.js');
  const pathAt = html.indexOf('./js/pathfinding.js');
  assert.ok(simAt >= 0 && aiAt > simAt && pathAt > aiAt,
    'AI must load after core simulation declarations and before engine startup');
  assert.ok(worker.includes("'./js/ai.js'"), 'The offline service-worker cache must contain ai.js');
  assert.match(checker,/for \(const \{path,source:code\} of scripts\) new vm\.Script\(code/,
    'Source validation must syntax-parse the production script list');
  assert.deepEqual(coreGameScriptPaths(html).slice(10,14),
    ['./js/simulation.js','./js/ai.js','./js/pathfinding.js','./js/kingdom.js']);

});
