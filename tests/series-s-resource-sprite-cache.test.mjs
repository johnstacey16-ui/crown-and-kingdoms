import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame,graphicsSurfaceLifetimeSource} from './helpers/headless-game.mjs';

const render=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const resource=readFileSync(new URL('../js/render-resources.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../js/ui.js',import.meta.url),'utf8');
const s=resource.indexOf('const NODE_TEXTURE_CACHE='),e=resource.indexOf('function drawNode(',s);
assert.ok(s>=0&&e>s,'extract actual production static resource cache');
test('failed resource construction rolls back both indexes and pixel accounting before retry',()=>{
 for(const failure of['null','context','before','draw','after','register']){
  let phase='',last;const context={document:{createElement(){
   const cv={width:0,height:0,lost:phase==='before',events:{},addEventListener(n,fn){this.events[n]=fn;if(phase==='register')throw Error('registration failed')}};
   const g={isContextLost:()=>cv.lost,drawImage(){if(phase==='draw')throw Error('copy failed');if(phase==='after')cv.lost=true}};
   cv.getContext=()=>{if(phase==='context')throw Error('context failed');return phase==='null'?null:g};last=cv;return cv;
  }}};
  const f=vm.runInNewContext(graphicsSurfaceLifetimeSource()+resource.slice(s,e)+'\n({paintedNodeTexture,beginGraphicsSurfaceUse,endGraphicsSurfaceUse,NODE_TEXTURE_RECENCY,pixels:()=>NODE_TEXTURE_PIXELS,frames:img=>NODE_TEXTURE_CACHE.get(img)?.frames.size||0,lifetime:GRAPHICS_SURFACE_LIFETIME})',context);
  const art={img:{},f:{x:0,y:0,w:120,h:180}},healthy=f.paintedNodeTexture(art,72),pixels=f.pixels(),bad={...art,img:{}};
  phase=failure;f.beginGraphicsSurfaceUse();f.beginGraphicsSurfaceUse();assert.equal(f.paintedNodeTexture(bad,72),null);const rejected=last;
  assert.equal(f.NODE_TEXTURE_RECENCY.size,1);assert.equal(f.frames(bad.img),0);assert.equal(f.pixels(),pixels);assert.equal(rejected.width,144);
  assert.equal(f.lifetime.pending.size,1);f.endGraphicsSurfaceUse();assert.equal(rejected.width,144);f.endGraphicsSurfaceUse();assert.equal(rejected.width,1);
  assert.equal(healthy.width,144);phase='';const retry=f.paintedNodeTexture(bad,72);assert.notEqual(retry,rejected);assert.equal(retry.width,144);
  rejected.events.contextlost?.();assert.equal(f.NODE_TEXTURE_RECENCY.size,2);assert.equal(f.frames(bad.img),1);assert.equal(f.pixels(),pixels*2);
 }
});
test('lost resource crops release after the batch and stale events preserve replacements and accounting',()=>{
 const context={document:{createElement:()=>({width:0,height:0,events:{},addEventListener(name,fn){this.events[name]=fn},getContext:()=>({drawImage(){}})})}};
 const f=vm.runInNewContext(graphicsSurfaceLifetimeSource()+resource.slice(s,e)+'\n({paintedNodeTexture,beginGraphicsSurfaceUse,endGraphicsSurfaceUse,NODE_TEXTURE_RECENCY,pixels:()=>NODE_TEXTURE_PIXELS,lifetime:GRAPHICS_SURFACE_LIFETIME})',context);
 const art={img:{},f:{x:0,y:0,w:120,h:180}};
 f.beginGraphicsSurfaceUse();const first=f.paintedNodeTexture(art,72);first.events.contextlost();
 assert.equal(f.pixels(),0);assert.equal(first.width,144);
 const next=f.paintedNodeTexture(art,72);first.events.contextlost();assert.equal(f.NODE_TEXTURE_RECENCY.size,1);
 assert.equal(f.pixels(),next.width*next.height);
 f.endGraphicsSurfaceUse();assert.equal(first.width,1);assert.equal(next.width,144);assert.equal(f.lifetime.pending.size,0);
 for(let i=1;i<90;i++)f.paintedNodeTexture({...art,f:{...art.f,x:i*130}},72);
 assert.equal(next.width,1,'ordinary resource LRU eviction releases backing pixels');
});
test('resource cache detects pre-event loss, reuses retained contexts and rejects loss during creation',()=>{
 let nextLost=false,loseOnDraw=false;const created=[];
 const context={document:{createElement(){
  const canvas={width:0,height:0,lost:nextLost,acquisitions:0,events:{},addEventListener(name,fn){this.events[name]=fn}};
  const ctx={isContextLost:()=>canvas.lost,drawImage(){if(loseOnDraw)canvas.lost=true}};
  canvas.getContext=()=>{canvas.acquisitions++;return ctx};created.push(canvas);return canvas;
 }}};
 const f=vm.runInNewContext(graphicsSurfaceLifetimeSource()+resource.slice(s,e)+'\n({paintedNodeTexture,NODE_TEXTURE_RECENCY,pixels:()=>NODE_TEXTURE_PIXELS})',context);
 const art={img:{},f:{x:0,y:0,w:120,h:180}},first=f.paintedNodeTexture(art,72);
 for(let i=0;i<50;i++)assert.equal(f.paintedNodeTexture(art,72),first);
 assert.equal(first.acquisitions,1,'cache hits check the retained context without reacquiring it');
 first.lost=true;const next=f.paintedNodeTexture(art,72);
 assert.notEqual(next,first);assert.equal(first.width,1);assert.equal(f.pixels(),next.width*next.height);
 first.events.contextlost();assert.equal(f.NODE_TEXTURE_RECENCY.size,1,'late old event cannot discard the replacement');
 nextLost=true;assert.equal(f.paintedNodeTexture({...art,f:{...art.f,x:2}},72),null);
 assert.equal(created.at(-1).width,1,'a surface lost before drawing releases its unused backing');
 nextLost=false;loseOnDraw=true;assert.equal(f.paintedNodeTexture({...art,f:{...art.f,x:4}},72),null);
 assert.equal(created.at(-1).width,1,'loss during source copying never admits a blank cache entry');
 assert.equal(f.NODE_TEXTURE_RECENCY.size,1);assert.equal(f.pixels(),next.width*next.height);
});

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
