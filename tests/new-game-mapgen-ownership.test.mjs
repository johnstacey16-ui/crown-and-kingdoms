import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mapgen = readFileSync(new URL('../js/mapgen.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const smoke = readFileSync(new URL('./simulation-smoke.test.mjs', import.meta.url), 'utf8');

test('new-game map and initial-state construction has one owner in js/mapgen.js', () => {
  assert.equal((mapgen.match(/function newGame\s*\(/g) || []).length, 1);
  assert.equal((engine.match(/function newGame\s*\(/g) || []).length, 0);
  assert.match(mapgen, /function newGame\(tries\)\{'use strict';if\(tries===undefined\)tries=0;/,
    'The extracted setup routine must preserve the engine strict-mode semantics');
});

test('map regeneration, connectivity validation and runtime startup wiring are retained', () => {
  assert.ok(mapgen.includes('const mapAudit=auditGeneratedMap(bs);S.mapAudit=mapAudit'));
  assert.ok(mapgen.includes('if(!mapAudit.ok&&tries<12)return newGame(tries+1)'));
  assert.ok(mapgen.includes("addB(t,'tc',bx-1,by-1,true)"));
  assert.ok(mapgen.includes('ctr(10.5,H-9.5);cur={x:CW/2,y:CH/2};fog();mmUp()'));
  const generator = html.indexOf('./js/mapgen.js');
  const engineAt = html.indexOf('./engine.js');
  assert.ok(generator >= 0 && engineAt > generator,
    'Map creation must load before engine start/campaign actions can invoke it');
  assert.ok(smoke.includes("new URL('../js/mapgen.js', import.meta.url)"),
    'Simulation smoke test must include the real map generator');
});
