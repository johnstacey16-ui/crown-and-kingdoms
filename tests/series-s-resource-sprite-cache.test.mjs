import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const resource=readFileSync(new URL('../js/render-resources.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const s=resource.indexOf('const NODE_TEXTURE_CACHE='),e=resource.indexOf('function drawNode(',s);
assert.ok(s>=0&&e>s,'extract actual production static resource cache');

test('a painted static resource is cropped once per atlas image and frame',()=>{
 let creations=0;const calls=[];
 const fake={document:{createElement(kind){assert.equal(kind,'canvas');creations++;
  return {width:0,height:0,getContext(type){assert.equal(type,'2d');
   return {drawImage(...args){calls.push(args)}}}};
 }}};
 const crop=vm.runInNewContext(resource.slice(s,e)+'\npaintedNodeTexture',fake);
 const img={},f={x:25,y:27,w:120,h:180,ax:52,ay:177},a={img,f,painted:true};
 const first=crop(a,72);
 assert.equal(first.width,144);assert.equal(first.height,216);
 assert.equal(crop(a,72),first,'same atlas frame reuses a small texture');
 assert.equal(creations,1);
 assert.deepEqual(calls[0].slice(1),[25,27,120,180,0,0,144,216]);
 assert.equal(crop(a,66).width,132,'farm has its own static crop size');
 assert.notEqual(crop({img,f:{...f,x:26}},72),first,'new frame invalidates');
 assert.notEqual(crop({img:{},f},72),first,'reloaded atlas invalidates');
 assert.equal(crop({img:null,f},72),null);
});
test('production world times visible nodes/buildings/troops separately in original depth order',()=>{
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 vm.runInContext(source+'\n'+[
  'globalThis.evaluate=code=>eval(code);',
  'globalThis.ASSET={n:0};',
  'drawChunks=function(){};',
  'globalThis.projectedUnits=[];drawNode=function(){};drawBld=function(){};drawUnit=function(u,selected,screen){projectedUnits.push({actual:screen,expected:w2s(u.x,u.y),selected:selected.has(u)})};',
 ].join('\n'),sandbox);
 const run=sandbox.evaluate;
 run('start();perfHud=1;perfLayerMode=2;S.ex.fill(1);S.vs.fill(1);drawWorld()');
 assert.ok(run('perfNodeCount')>0);
 assert.ok(run('perfBuildingCount')>0);
 assert.ok(run('perfUnitCount')>0);
 assert.equal(run('projectedUnits.length>0&&projectedUnits.every(p=>p.actual&&p.actual[0]===p.expected[0]&&p.actual[1]===p.expected[1])'),true,
  'depth-sort painter reuses the exact precomputed screen coordinates instead of projecting units again');
 assert.equal(run('perfNodeMs>=0&&perfBuildingMs>=0&&perfUnitMs>=0'),true);
 run('perfLayerMode=1;drawWorld()');
 assert.equal(run('perfNodeCount+perfBuildingCount+perfUnitCount'),0);
 assert.match(render,/L\.sort\(\(a,b\)=>a\[0\]-b\[0\]\)/);
 assert.match(ui,/NODE '\+perfNodeMs\.toFixed/);
 assert.match(ui,/BLD '\+perfBuildingMs\.toFixed/);
 assert.match(ui,/UNIT '\+perfUnitMs\.toFixed/);
});

test('native resource crops evict oldest entries under a global 8 MiB limit',()=>{
 const cropCalls=[];let allocations=0;
 const scene=vm.runInNewContext(resource.slice(s,e)+
  '\n({paintedNodeTexture,NODE_TEXTURE_RECENCY,NODE_TEXTURE_PIXELS:()=>NODE_TEXTURE_PIXELS,NODE_TEXTURE_PIXEL_LIMIT,NODE_TEXTURE_ENTRY_LIMIT})',{
  document:{createElement:()=>{allocations++;return {width:0,height:0,getContext:()=>({drawImage(...a){cropCalls.push(a)}})}}}
 });
 const img={},art=x=>({img,f:{x,y:0,w:120,h:180,ax:45,ay:175},painted:true});
 const first=scene.paintedNodeTexture(art(0),72);
 for(let x=1;x<160;x++)assert.ok(scene.paintedNodeTexture(art(x*130),72));
 assert.ok(scene.NODE_TEXTURE_RECENCY.size<=scene.NODE_TEXTURE_ENTRY_LIMIT);
 const retained=[...scene.NODE_TEXTURE_RECENCY.values()].reduce((sum,e)=>sum+e.canvas.width*e.canvas.height,0);
 assert.equal(scene.NODE_TEXTURE_PIXELS(),retained);
 assert.ok(retained<=scene.NODE_TEXTURE_PIXEL_LIMIT);
 assert.ok(![...scene.NODE_TEXTURE_RECENCY.values()].some(e=>e.canvas===first));
 assert.notEqual(scene.paintedNodeTexture(art(0),72),first,'evicted native frame re-crops on demand');
 assert.equal(allocations,161);
});
test('resource LRU promotes hot frames and bypasses invalid or excessive crops',()=>{
 let created=0;
 const scene=vm.runInNewContext(resource.slice(s,e)+
 '\n({paintedNodeTexture,NODE_TEXTURE_RECENCY,NODE_TEXTURE_PIXELS:()=>NODE_TEXTURE_PIXELS})',{
  document:{createElement:()=>{created++;return {width:0,height:0,getContext:()=>({drawImage(){}})}}}
 });
 const img={},f={x:1,y:2,w:120,h:180,ax:60,ay:172};
 const first=scene.paintedNodeTexture({img,f},72);
 scene.paintedNodeTexture({img,f:{...f,x:5}},72);
 assert.equal(scene.paintedNodeTexture({img,f},72),first);
 assert.equal([...scene.NODE_TEXTURE_RECENCY.values()].at(-1).canvas,first);
 assert.notEqual(scene.paintedNodeTexture({img:{},f},72),first,'atlas reload does not use stale texture');
 const before=created;
 assert.equal(scene.paintedNodeTexture({img,f:{...f,w:4000,h:4000},referenceWidth:120},72),null);
 assert.equal(scene.paintedNodeTexture({img,f},Infinity),null);
 assert.equal(created,before,'invalid crops do not allocate backing canvases');
 assert.equal(scene.NODE_TEXTURE_PIXELS(),[...scene.NODE_TEXTURE_RECENCY.values()].reduce((n,e)=>n+e.canvas.width*e.canvas.height,0));
});
test('unmirrored resource frames draw at identical absolute pixels without transforms',()=>{
 const calls=[],ctx={S:{t:10,vs:new Uint8Array(10000).fill(1)},W:100,zm:1,
  w2s:(x,y)=>[x*10,y*10],hsh:()=>.9,ASSET:{n:1},
  paintedEnvironmentFrame:()=>null,
  paintedResourceFrame:()=>({img:{},f:{x:8,y:9,w:80,h:110,ax:30,ay:106},painted:true}),
  paintedNodeTexture:()=>({width:108,height:150}),paintedResourceWidth:()=>54,
  resourceVisualAmount:()=>Infinity,
  X:{globalAlpha:1,drawImage(...a){calls.push(a)},
   save(){throw Error('unexpected save')},restore(){throw Error('unexpected restore')},
   translate(){throw Error('unexpected translate')},scale(){throw Error('unexpected scale')}}
 };
 const paint=vm.runInNewContext(resource.slice(resource.indexOf('function drawNode('))+'\n;drawNode;',ctx);
 paint({x:4,y:6,k:'g',amt:100});
 assert.equal(calls.length,1);
 const [img,x,y,w,h]=calls[0];assert.ok(img);
 assert.ok(Math.abs(x-24.75)<1e-9);
 assert.ok(Math.abs(y+2.55)<1e-9);
 assert.ok(Math.abs(w-54)<1e-9);
 assert.ok(Math.abs(h-74.25)<1e-9);
 assert.equal(ctx.X.globalAlpha,1);
});
