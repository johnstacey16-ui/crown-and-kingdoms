import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const render=read('js/render.js'),source=render.slice(render.indexOf('function paintedResourceFrame('),render.indexOf('function drawNode('));
test('resource artwork has stable variants and excludes farms, fish and hunted animals',()=>{
 const calls=[],c=vm.createContext({ASSET:{n:1},hsh:(x,y)=>x%2?.7:.2,assetFrame(...args){calls.push(args);return args[0]}});vm.runInContext(source,c);
 for(const [k,name]of [['s','stone'],['g','gold'],['f','berry']]){
  assert.equal(c.paintedResourceFrame(k,2,4),'node_'+name+'_0');assert.equal(c.paintedResourceFrame(k,3,4),'node_'+name+'_1');
  assert.equal(c.paintedResourceFrame(k,2,4,true),null);
 }
 assert.equal(c.paintedResourceFrame('w',2,4),null);c.ASSET.n=0;assert.equal(c.paintedResourceFrame('g',2,4),null);delete c.ASSET;assert.equal(c.paintedResourceFrame('g',2,4),null);
 assert.ok(calls.every(a=>a.slice(1).every(x=>x===0)),'no clock or owner-dependent frame selection');
});
test('resource manifest has six independent bounded neutral static frames and survives base pack rebuilds',()=>{
 const pack=JSON.parse(read('assets/atlas-manifest.json')),resources=JSON.parse(read('assets/resource-manifest.json')).atlases;
 const a=pack.atlases.find(a=>a.id==='painted-resources');assert.deepEqual([a],resources);assert.equal(a.meta.neutral,true);
 assert.equal(Object.keys(a.meta.anims).length,6);assert.equal(new Set(Object.values(a.meta.anims).map(a=>JSON.stringify(a.frames))).size,6);
 assert.match(read('scripts/build-painted-atlas.mjs'),/resource-manifest\.json/);
 assert.match(read('sw.js'),/painted-resources\.webp/);
});
test('neutral resources bypass cloth recolouring and retain the source image',()=>{
 const c=vm.createContext({});vm.runInContext(read('js/assets.js')+';globalThis.neutralImage=paintedTeamImage;',c);
 const img={};for(let t=0;t<4;t++)assert.equal(c.neutralImage({img,meta:{painted:true,neutral:true}},t),img);
});
