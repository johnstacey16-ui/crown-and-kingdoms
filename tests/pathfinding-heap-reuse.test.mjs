import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('A* reuses heap buffers between sequential path searches', () => {
  const pathfinding = readFileSync(new URL('../js/pathfinding.js', import.meta.url), 'utf8');
  assert.match(pathfinding, /const PATH_HEAP_K=\[\],PATH_HEAP_V=\[\]/,
    'A* heap arrays should be allocated once and retained for subsequent searches');
  assert.match(pathfinding, /const hk=PATH_HEAP_K,hv=PATH_HEAP_V;hk\.length=0;hv\.length=0/,
    'each search must clear both reusable buffers before pushing its start node');
  assert.doesNotMatch(pathfinding, /hr=goal\.hr\|\|0,hk=\[\],hv=\[\]/,
    'A* should not allocate fresh heap arrays for every unit path request');
});
