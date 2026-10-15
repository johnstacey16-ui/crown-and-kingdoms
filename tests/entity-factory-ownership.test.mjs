import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const checker = readFileSync(new URL('../scripts/check-game.mjs', import.meta.url), 'utf8');
const entities = readFileSync(new URL('../js/entities.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const simulationSmoke = readFileSync(new URL('./simulation-smoke.test.mjs', import.meta.url), 'utf8');

test('world entity factory functions have one owner outside engine orchestration', () => {
  for (const name of ['addN', 'addB', 'addU']) {
    assert.equal((entities.match(new RegExp('function ' + name + '\\s*\\(', 'g')) || []).length, 1,
      name + ' must be declared exactly once in js/entities.js');
    assert.equal((engine.match(new RegExp('function ' + name + '\\s*\\(', 'g')) || []).length, 0,
      name + ' must not remain in engine.js');
  }
});

test('entity factories retain placement checks, technology-derived health, and villager automation hookup', () => {
  assert.match(entities, /if\(x<1\|\|y<1\|\|x>=W-1\|\|y>=H-1\|\|S\.g\[y\*W\+x\]\|\|S\.wt\[y\*W\+x\]\)return null/);
  assert.match(entities, /S\.tech\[t\]\.mas\?1\.4:1/);
  assert.match(entities, /S\.tech\[t\]\.bz\?1\.15:1/);
  assert.match(entities, /if\(k==='vil'&&t===0&&S\.vp&&S\.vp\.enabled\)assignAutoVillager\(u\)/);
});

test('entity module dependency order and offline cache are maintained', () => {
  const kingdom = html.indexOf('./js/kingdom.js');
  const entitiesAt = html.indexOf('./js/entities.js');
  const campaign = html.indexOf('./js/campaign.js');
  const engineAt = html.indexOf('./engine.js');
  assert.ok(kingdom >= 0 && entitiesAt > kingdom && campaign > entitiesAt && engineAt > campaign,
    'entities must load after kingdom helpers and before campaign/game startup');
  assert.ok(sw.includes("'./js/entities.js'"), 'offline cache must include entities.js');
  assert.ok(checker.includes("new vm.Script(entities, { filename: 'js/entities.js' })"),
    'syntax checker must parse entities.js');
  assert.ok(checker.includes(" + '\\n' + entities + '\\n' + campaign"),
    'static source harness must include the entity module');
  assert.ok(simulationSmoke.includes("new URL('../js/entities.js', import.meta.url)"),
    'runtime smoke harness must load the entity module before calling newGame');
});
