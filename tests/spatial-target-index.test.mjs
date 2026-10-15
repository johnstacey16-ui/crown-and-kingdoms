import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const simulation = readFileSync(new URL('../js/simulation.js', import.meta.url), 'utf8');

test('hostile-unit target search uses a per-step spatial index rather than scanning the full army per query', () => {
  assert.match(simulation, /const FOE_CELL=8,FOE_BUCKETS=new Map\(\)/);
  assert.match(simulation, /function rebuildFoeGrid\(\)\{[\s\S]*?FOE_BUCKETS\.set\(key,bin\)/);
  assert.match(simulation, /function nearestFoeUnit\(u,r\)\{[\s\S]*?FOE_BUCKETS\.get\(cx\+','\+cy\)/);
  const start = simulation.indexOf('function foe(u,r){');
  const end = simulation.indexOf('/* ===== ECONOMY / UNIT BEHAVIOUR ===== */', start);
  assert.ok(start >= 0 && end > start);
  const foe = simulation.slice(start, end);
  assert.match(foe, /b=nearestFoeUnit\(u,r\);if\(b\)return b/);
  assert.doesNotMatch(foe, /for\(const e of S\.us\)/);
  assert.match(simulation, /function step\(dt\)\{foeGridDirty=true;S\.t\+=dt;/);
});

test('indexed targeting preserves hostility, death/load filters, exact range and stable tie ordering', () => {
  assert.match(simulation, /if\(!e\|\|!isHostile\(u\.t,e\.t\)\|\|e\.hp<=0\|\|e\.ld\)continue/);
  assert.match(simulation, /const d=Math\.hypot\(e\.x-u\.x,e\.y-u\.y\)/);
  assert.match(simulation, /d<bd\|\|\(d===bd&&d<r&&i<bi\)/);
  assert.match(simulation, /if\(U\[u\.k\]\?\.sg\)[\s\S]*?if\(b\)return b[\s\S]*?b=nearestFoeUnit\(u,r\)[\s\S]*?for\(const q of S\.bs\)/);
});
