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

test('unit-map textures oversample display pixels and retain native source resolution at close zoom',()=>{
 const c=fixture();assert.deepEqual([2,4,7,10,20,40].map(x=>c.terrainBlendResolution(x)),[8,16,32,32,64,64]);
 assert.equal(c.terrainBlendResolution(NaN),64);assert.equal(c.terrainBlendResolution(-1),64);
});
test('small terrain textures avoid the former 256-entry thrash within the same pixel budget',()=>{
 let creations=0;const c=fixture({createElement(){creations++;return {width:0,height:0,getContext(){return {drawImage(){},clearRect(){},fillRect(){},createLinearGradient(){return {addColorStop(){}}}}}}}});
 const neighbors=Array.from({length:625},(_,n)=>[1+n%5,1+Math.floor(n/5)%5,1+Math.floor(n/25)%5,1+Math.floor(n/125)%5]);
 for(const ns of neighbors)c.terrainTileTexture(0,0,0,ns,16);
 const after=creations;
 for(const ns of neighbors){const cv=c.terrainTileTexture(0,0,0,ns,16);assert.equal(cv.width,16);assert.equal(cv.height,16)}
 assert.equal(creations,after,'all 625 reused textures avoid new surfaces');
 assert.ok(vm.runInContext('terrainBlendPixels<=1024*1024&&TERRAIN_BLEND.size<=4096',c));
 c.clearTerrainBlend();assert.equal(vm.runInContext('terrainBlendPixels',c),0);
 for(const ns of neighbors)c.terrainTileTexture(0,0,0,ns,64);
 assert.equal(vm.runInContext('TERRAIN_BLEND.size',c),256,'native solo tiles retain the original pixel cap');
});
