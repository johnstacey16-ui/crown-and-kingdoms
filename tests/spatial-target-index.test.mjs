import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

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

test('indexed targeting preserves hostility, death/load filters, strict range and stable ties', () => {
  const S = { us: [
    {t:1,x:8.5,y:8,hp:10}, // lower array index, but later spatial bucket
    {t:1,x:7.5,y:8,hp:10},
    {t:0,x:8,y:8,hp:10},
    {t:1,x:8,y:8,hp:0},
    {t:1,x:8,y:8,hp:10,ld:{}},
    {t:1,x:NaN,y:8,hp:10},
  ] };
  const source = simulation.slice(simulation.indexOf('const FOE_CELL='), simulation.indexOf('function foe('));
  const ctx = vm.createContext({S,W:24,H:24,isHostile:(a,b)=>a!==b});
  const nearest = vm.runInContext(source + ';nearestFoeUnit', ctx);
  const probe = {t:0,x:8,y:8};
  assert.equal(nearest(probe,1),S.us[0]);
  assert.equal(nearest(probe,.5),null,'range boundary is exclusive');
  S.us[0].hp=0;
  assert.equal(nearest(probe,1),S.us[1],'death after indexing is respected');
  S.us[1].ld={};
  assert.equal(nearest(probe,1),null,'garrison after indexing is respected');
});
