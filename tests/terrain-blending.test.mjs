import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
function fixture(document){
 const ctx=vm.createContext({document,PAINT:{terrain:{width:1536}},Map});
 vm.runInContext(source.slice(source.indexOf('const TERRAIN_BLEND='),source.indexOf('function paintTerrain(')),ctx);
 return ctx;
}
test('neighbor lookup reads only in-bounds cardinal tiles and preserves unknown sentinels',()=>{
 const c=fixture(),reads=[];c.kindAt=(x,y)=>{reads.push([x,y]);return x===1?-1:3};
 assert.deepEqual(Array.from(vm.runInContext('terrainNeighborKinds(0,0,kindAt,3,2)',c)),[-1,-1,-1,3]);
 assert.deepEqual(reads,[[1,0],[0,1]]);
 reads.length=0;
 assert.deepEqual(Array.from(vm.runInContext('terrainNeighborKinds(2,1,kindAt,3,2)',c)),[-1,-1,3,-1]);
 assert.deepEqual(reads,[[1,1],[2,0]]);
});
test('uniform/unknown edges allocate nothing; unavailable canvases retain original-art fallback',()=>{
 let allocations=0;const c=fixture({createElement(){allocations++;throw new Error('no canvas')}});
 for(const n of ['null','[-1,-1,-1,-1]','[0,0,0,0]'])assert.equal(vm.runInContext(`terrainTileTexture(0,0,0,${n})`,c),null);
 assert.equal(allocations,0);
 assert.equal(vm.runInContext('terrainTileTexture(0,0,0,[1,-1,-1,-1])',c),null);
 assert.equal(allocations,1);
});
