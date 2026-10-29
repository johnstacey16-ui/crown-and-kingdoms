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


test('the last 40 units select scarce art with full-art fallback and stable geographic variants',()=>{
 const unavailable=new Set(),c=vm.createContext({ASSET:{n:1},hsh:x=>x%2?.7:.2,assetFrame:k=>unavailable.has(k)?null:k});vm.runInContext(source,c);
 for(const [kind,name]of [['s','stone'],['g','gold'],['f','berry']])for(let variant=0;variant<2;variant++){
  const x=variant+2,full='node_'+name+'_'+variant,low='node_'+name+'_low_'+variant;
  for(const amount of [1,39.9,40])assert.equal(c.paintedResourceFrame(kind,x,4,false,amount),low);
  for(const amount of [40.01,900,Infinity,0,-1,NaN])assert.equal(c.paintedResourceFrame(kind,x,4,false,amount),full);
  assert.equal(c.paintedResourceFrame(kind,x,4,true,1),null);
  unavailable.add(low);assert.equal(c.paintedResourceFrame(kind,x,4,false,1),full);unavailable.delete(low);
 }
});
test('solo remembers only observed quantities and never uses hidden gathering to change the stage',()=>{
 const c=vm.createContext({PAINT:{resourceAmounts:new WeakMap()}});
 vm.runInContext(render.slice(render.indexOf('function resourceVisualAmount('),render.indexOf('function paintedResourceFrame(')),c);
 for(const kind of ['s','g','f']){
  const n={k:kind,x:3,y:4,amt:900,t:0};assert.equal(c.resourceVisualAmount(n,false),Infinity);
  const before=JSON.stringify(n);assert.equal(c.resourceVisualAmount(n,true),900);assert.equal(JSON.stringify(n),before);
  n.amt=10;assert.equal(c.resourceVisualAmount(n,false),900,'hidden consumption retains full last-seen quantity');
  assert.equal(c.resourceVisualAmount(n,true),10);n.amt=1;assert.equal(c.resourceVisualAmount(n,false),10);
 }
 for(const flags of [{fi:1},{an:1},{fm:1},{trap:1}]){const n={k:'f',amt:1,...flags};assert.equal(c.resourceVisualAmount(n,true),Infinity);assert.equal(c.PAINT.resourceAmounts.has(n),false)}
});
test('scarce resource atlas preserves six neutral static variants at a common physical scale',()=>{
 const pack=JSON.parse(read('assets/atlas-manifest.json')),a=pack.atlases.find(a=>a.id==='painted-scarce-resources');
 assert.deepEqual([a],JSON.parse(read('assets/scarce-resource-manifest.json')).atlases);assert.equal(a.meta.neutral,true);
 const anims=Object.values(a.meta.anims);assert.equal(anims.length,6);assert.equal(new Set(anims.map(a=>JSON.stringify(a.frames))).size,6);
 for(const an of anims){assert.equal(an.frames.length,1);assert.equal(an.referenceWidth,512);assert.ok(an.frames[0].w<an.referenceWidth)}
 assert.match(read('scripts/build-painted-atlas.mjs'),/scarce-resource-manifest\.json/);assert.match(read('sw.js'),/painted-scarce-resources\.webp/);
});
