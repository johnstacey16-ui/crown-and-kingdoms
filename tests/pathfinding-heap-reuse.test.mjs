import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const pathfinding = readFileSync(new URL('../js/pathfinding.js', import.meta.url), 'utf8');
assert.match(pathfinding, /const PATH_HEAP_K=\[\],PATH_HEAP_V=\[\]/,
  'A* heap arrays should be allocated once and retained for subsequent searches');
assert.match(pathfinding, /const hk=PATH_HEAP_K,hv=PATH_HEAP_V;hk\.length=0;hv\.length=0/,
  'each search must clear both reusable buffers before pushing its start node');
assert.match(pathfinding, /if\(sx<0\|\|sy<0\|\|sx>=W\|\|sy>=H\)\{PATH_STATS\.invalid\+\+;return null\}/,
  'A* must reject coordinates outside the map and count the invalid request');
const context={window:{},W:4,H:4,S:{},PA:{},D8:[]};
const path=vm.runInNewContext(pathfinding+'\n;path;',context);
for(const u of [{x:-1,y:1,t:0},{x:4,y:0,t:0},{x:NaN,y:0,t:0},{x:0,y:Infinity,t:0},null])assert.equal(path(u,()=>true),null,'invalid path origin must return null');
assert.equal(context.window.CK_PATH_DIAGNOSTICS.snapshot().invalid,5,
  'invalid path origins are rejected before indexing reusable heap buffers');
assert.doesNotMatch(pathfinding, /hr=goal\.hr\|\|0,hk=\[\],hv=\[\]/,
  'A* should not allocate fresh heap arrays for every unit path request');
console.log('pathfinding-heap-reuse: A* heap buffers are reused and reset for each search');
