import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {graphicsSurfaceLifetimeSource} from './helpers/headless-game.mjs';
function fixture(){
 const source=readFileSync(new URL('../js/render-buildings.js',import.meta.url),'utf8'),calls=[];
 const context=new Proxy({isContextLost(){return false},createRadialGradient(){return {addColorStop(){}}},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)}}},{get(o,k){return o[k]||((...args)=>calls.push([k,...args]))}});
 let acquisitions=0;
 const sandbox={document:{createElement(){return {width:0,height:0,events:{},addEventListener(name,fn){this.events[name]=fn},getContext:()=>{acquisitions++;return context}}}}};
 vm.createContext(sandbox);vm.runInContext(graphicsSurfaceLifetimeSource()+source.slice(source.indexOf('function buildingDamageStage('),source.indexOf('function drawBld('))+';globalThis.api={stage:buildingDamageStage,draw:drawBuildingArtwork,prepare:damagedBuildingArtwork,cache:BUILDING_DAMAGE_CACHE,lod:buildingFrameTexture,lodCache:BUILDING_LOD_CACHE,begin:beginGraphicsSurfaceUse,end:endGraphicsSurfaceUse,lifetime:GRAPHICS_SURFACE_LIFETIME};',sandbox);
 const art={painted:true,img:{paintedTeam:1},f:{x:10,y:20,w:20,h:30,ax:8,ay:28},sc:1};
 return {...sandbox.api,sandbox,calls,art,context,get acquisitions(){return acquisitions}};
}
test('damage thresholds depend only on valid completed-building health',()=>{
 const f=fixture();assert.equal(f.stage(true,66,100),0);assert.equal(f.stage(true,65,100),1);assert.equal(f.stage(true,33,100),1);assert.equal(f.stage(true,32,100),2);
 for(const [done,hp,max] of [[false,1,100],[true,NaN,100],[true,1,Infinity],[true,0,1]])assert.equal(f.stage(done,hp,max),0);
});
test('native damage crops reuse source/palette/stage identities and retain original anchors',()=>{
 const f=fixture(),first=f.prepare(f.art,1);assert.equal(first.img.width,20);assert.equal(first.img.height,30);assert.equal(first.f.x,0);assert.equal(first.f.y,0);assert.equal(first.f.ax,8);assert.equal(first.f.ay,28);
 assert.equal(f.prepare(f.art,1).img,first.img);assert.equal(f.prepare(f.art,1).sc,1);assert.equal(f.cache.creations,1);
 const shifted=f.prepare({...f.art,f:{...f.art.f,ax:3}},1);assert.equal(shifted.img,first.img);assert.equal(shifted.f.ax,3);
 assert.notEqual(f.prepare(f.art,2).img,first.img);assert.notEqual(f.prepare({...f.art,img:{}},1).img,first.img);
 assert.equal(f.prepare(f.art,0),f.art);assert.equal(f.prepare({...f.art,painted:false},1).img,f.art.img);assert.equal(f.art.f.x,10);
});
test('damage cache evicts within its pixel budget and allocation failures keep the source drawable',()=>{
 const f=fixture();f.begin();f.cache.limit=600;const first=f.prepare(f.art,1);f.prepare(f.art,2);assert.equal(f.cache.evictions,1);assert.equal(f.cache.pixels,600);assert.equal(f.cache.entries.size,1);assert.equal(first.img.width,20);
 const large=f.prepare({...f.art,f:{...f.art.f,w:40}},1);assert.equal(large.img.width,40);assert.equal(f.cache.pixels,600);
 f.sandbox.document.createElement=()=>{throw Error('no canvas')};const missing={...f.art,img:{}};assert.equal(f.prepare(missing,1),missing,'fallback retains the descriptor');
 f.end();assert.equal(first.img.width,1);assert.equal(f.lifetime.pending.size,0);assert.equal(large.img.width,40,'successful oversized art retains its caller-owned lifetime');
});
test('rejected damage and LOD construction rolls back ownership and retires only the failed backing',()=>{
 for(const kind of['damage','lod'])for(const phase of['null','context','before','draw','after','gradient','register']){
  if(kind==='lod'&&phase==='gradient')continue;
  const f=fixture();f.sandbox.zm=.8;f.sandbox.DPR=1;
  const art={...f.art,f:{x:0,y:0,w:120,h:130,ax:60,ay:125}},create=f.sandbox.document.createElement;
  const get=a=>kind==='damage'?f.prepare(a,1):f.lod(a,.4),cache=kind==='damage'?f.cache:f.lodCache;
  const healthy=get(art),healthyImage=kind==='damage'?healthy.img:healthy,priorPixels=cache.pixels,badArt={...art,img:{}};
  let rejected;
  f.sandbox.document.createElement=()=>{
   const cv={width:0,height:0,lost:phase==='before',events:{},addEventListener(n,fn){this.events[n]=fn;if(phase==='register')throw Error('registration failed')}};
   const g=Object.create(f.context);g.isContextLost=()=>cv.lost;
   g.drawImage=()=>{if(phase==='draw')throw Error('copy failed');if(phase==='after')cv.lost=true};
   g.createRadialGradient=()=>{if(phase==='gradient')throw Error('gradient failed');return f.context.createRadialGradient()};
   cv.getContext=()=>{if(phase==='context')throw Error('context failed');return phase==='null'?null:g};rejected=cv;return cv;
  };
  f.begin();f.begin();assert.equal(get(badArt),kind==='damage'?badArt:null);
  assert.equal(cache.entries.size,1);assert.equal(cache.pixels,priorPixels);assert.ok(rejected.width>1);
  assert.equal(f.lifetime.pending.size,1);f.end();assert.ok(rejected.width>1);f.end();assert.equal(rejected.width,1);
  assert.ok(healthyImage.width>1);f.sandbox.document.createElement=create;
  const retry=get(badArt),image=kind==='damage'?retry.img:retry;assert.notEqual(image,rejected);assert.ok(image.width>1);
  rejected.events.contextlost?.();assert.equal(cache.entries.size,2);assert.equal(cache.pixels,priorPixels*2);
 }
});
test('healthy, ghost and unfinished draws never allocate damage textures',()=>{
 const f=fixture(),g=new Proxy({drawImage(...args){f.calls.push(['drawImage',...args])}},{get(o,k){return o[k]||(()=>{})}});
 f.draw(g,f.art,100,120,1,true,1,false,0);
 f.draw(g,f.art,100,120,1,true,1,true,2);
 f.draw(g,f.art,100,120,1,false,.5,false,2);
 assert.equal(f.cache.creations,0);
});
test('damage and LOD surfaces recover from context-loss events without discarding replacement pixels',()=>{
 for(const kind of['damage','lod']){
  const f=fixture();f.sandbox.zm=.8;f.sandbox.DPR=1;
  const art={...f.art,f:{x:0,y:0,w:120,h:130,ax:60,ay:125}},get=()=>kind==='damage'?f.prepare(art,1).img:f.lod(art,.4);
  const cache=kind==='damage'?f.cache:f.lodCache;
  f.begin();const first=get();first.events.contextlost();assert.equal(cache.pixels,0);
  const next=get();first.events.contextlost();assert.equal(cache.entries.size,1);assert.notEqual(first,next);
  assert.equal(cache.pixels,next.width*next.height);
  f.end();assert.equal(first.width,1);assert.equal(first.height,1);assert.ok(next.width>1);
  assert.equal(f.lifetime.pending.size,0);
 }
});

test('building prefilter keeps original art size and foot anchor at far zoom',()=>{
 const f=fixture(),art={painted:true,img:{},f:{x:10,y:15,w:200,h:240,ax:75,ay:232}};
 f.sandbox.zm=.8;f.sandbox.DPR=1;
 const reduced=f.lod(art,.4);assert.equal(reduced.width,100);assert.equal(reduced.height,120);
 assert.equal(f.lod(art,.4),reduced);assert.equal(f.lod(art,.4,false),null);
 const g=new Proxy({drawImage(...args){f.calls.push(args)}},{get(o,k){return o[k]||(()=>{})}});
 f.calls.length=0;f.draw(g,art,300,400,.4,true,1,false,0,0,true,true);
 assert.equal(f.calls[0].length,5);assert.equal(f.calls[0][0],reduced);
 assert.deepEqual(f.calls[0].slice(1),[270,307.2,80,96]);
 f.calls.length=0;f.draw(g,art,300,400,.4,true,1,false,0,0,true,false);
 assert.equal(f.calls[0].length,9);assert.equal(f.calls[0][0],art.img);
 f.sandbox.zm=2;f.calls.length=0;f.draw(g,art,300,400,.4,true,1,false,0,0,true,true);
 assert.equal(f.calls[0].length,9);
});

test('painted building LOD cache reuses its Canvas2D context and recovers from loss',()=>{
 const f=fixture(),art={painted:true,img:{},f:{x:10,y:15,w:200,h:240,ax:75,ay:232}};
 f.sandbox.zm=.8;f.sandbox.DPR=1;
 const first=f.lod(art,.4),acquired=f.acquisitions;
 for(let i=0;i<40;i++)assert.equal(f.lod(art,.4),first);
 assert.equal(f.acquisitions,acquired,'many buildings sharing a frame must not reacquire the context');
 f.context.isContextLost=()=>true;
 const healthy=new Proxy({isContextLost(){return false},createRadialGradient(){return {addColorStop(){}}}},{get(o,k){return o[k]||(()=>{})}});
 f.sandbox.document.createElement=()=>({width:0,height:0,getContext:()=>healthy});
 const next=f.lod(art,.4);
 assert.notEqual(next,first);assert.equal(next.width,100);
 assert.equal(f.lodCache.entries.size,1);
});
test('damaged building textures discard independently lost canvases without a blank result',()=>{
 const f=fixture(),first=f.prepare(f.art,1),acquired=f.acquisitions;
 for(let i=0;i<10;i++)assert.equal(f.prepare(f.art,1).img,first.img);
 assert.equal(f.acquisitions,acquired,'damage cache reuse must not reacquire the context');
 f.context.isContextLost=()=>true;
 const healthy=new Proxy({isContextLost(){return false},createRadialGradient(){return {addColorStop(){}}}},{get(o,k){return o[k]||(()=>{})}});
 f.sandbox.document.createElement=()=>({width:0,height:0,getContext:()=>healthy});
 const next=f.prepare(f.art,1);
 assert.notEqual(next.img,first.img);
 assert.equal(f.cache.entries.size,1);
 assert.equal(f.cache.pixels,20*30);
});
