import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {graphicsSurfaceLifetimeSource,headlessGame} from './helpers/headless-game.mjs';

const source=readFileSync(new URL('../js/render-terrain.js',import.meta.url),'utf8');
const production=source.slice(source.indexOf('const TERRAIN_VIEW='),source.length);
function scene(){
 const builds=[],blits=[],transforms=[];
 const events={};let lost=false;const g={isContextLost(){return lost},setTransform(...a){transforms.push(a)},fillRect(){},drawImage(...a){builds.push(a)}};
 const cv={width:0,height:0,getContext(){return g},addEventListener(name,fn){events[name]=fn}};
 const sandbox={CW:1280,CH:720,DPR:.6,zm:1.4,cam:{x:.3,y:.7},document:{createElement(){return cv}},X:{save(){},restore(){},setTransform(){},drawImage(...a){blits.push(a)}}};
 vm.createContext(sandbox);vm.runInContext(graphicsSurfaceLifetimeSource()+production+';globalThis.cache=TERRAIN_VIEW;',sandbox);
 const chunks=[{cv:{id:1},ox:1,oy:2,w:512,h:256},{cv:{id:2},ox:3,oy:4,w:512,h:256}];
 return {sandbox,cv,events,setLost(v){lost=v},builds,blits,transforms,chunks,draw:()=>sandbox.drawTerrainViewport(chunks),warm:()=>{sandbox.drawTerrainViewport(chunks);blits.length=0;sandbox.drawTerrainViewport(chunks)}};
}
test('actual map resize and graphics recovery clear terrain owners within nested render batches',()=>{
 for(const action of['setSize(96)','clearGraphicsSurfaces()']){
  const {source:game,sandbox}=headlessGame();vm.createContext(sandbox);
  vm.runInContext(game+'\n'+readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+'\nglobalThis.run=s=>eval(s)',sandbox);
  const run=sandbox.run;run(`start();globalThis.chunk=document.createElement('canvas');chunk.width=64;chunk.height=32;
   globalThis.view=document.createElement('canvas');view.width=128;view.height=64;TCH.set(0,{cv:chunk});
   TERRAIN_VIEW.canvas=view;TERRAIN_VIEW.key='old';TERRAIN_VIEW.chunks=[TCH.get(0)];
   beginGraphicsSurfaceUse();beginGraphicsSurfaceUse();`);
  const before=run('JSON.stringify(S)');run(action);
  assert.equal(run('TCH.size'),0);assert.equal(run('TERRAIN_VIEW.chunks.length'),0);assert.equal(run('TERRAIN_VIEW.key'),null);
  assert.equal(run('chunk.width'),64);assert.equal(run('view.width'),128);
  run('endGraphicsSurfaceUse()');assert.equal(run('chunk.width'),64);
  run('endGraphicsSurfaceUse()');assert.equal(run('chunk.width'),1);
  if(action==='clearGraphicsSurfaces()'){assert.equal(run('view.width'),1);assert.equal(run('TERRAIN_VIEW.canvas'),null)}
  assert.equal(run('JSON.stringify(S)'),before);
 }
});
test('stationary terrain uses one physical-pixel copy with no repeated chunk resampling',()=>{
 const s=scene();s.warm();assert.equal(s.builds.length,2);
 assert.deepEqual(s.builds[0],[s.chunks[0].cv,1*1.4-.3,2*1.4-.7,512*1.4,256*1.4]);
 for(let i=0;i<60;i++)s.draw();
 assert.equal(s.builds.length,2);assert.equal(s.blits.length,61);
 assert.deepEqual(s.blits[0],[s.cv,0,0]);assert.equal(s.cv.width,768);assert.equal(s.cv.height,432);
 assert.deepEqual(s.transforms[0],[.6,0,0,.6,0,0]);
});
test('pan, zoom, size, DPR, exploration and rebuilt atlas chunks invalidate immediately',()=>{
 const s=scene();s.warm();let n=2;
 for(const change of [()=>s.sandbox.cam.x+=.1,()=>s.sandbox.cam.y+=.1,()=>s.sandbox.zm=2,()=>s.sandbox.CW=1281,()=>s.sandbox.DPR=.75,()=>s.chunks[0]={...s.chunks[0],cv:{id:3}}]){
  change();s.draw();s.draw();n+=2;assert.equal(s.builds.length,n);s.draw();assert.equal(s.builds.length,n);
 }
 s.chunks.pop();s.draw();assert.equal(s.builds.length,n+1);
 s.chunks.length=0;s.draw();assert.equal(s.sandbox.cache.chunks.length,0,'no previously explored terrain survives an exploration reset');
});
test('oversized view releases viewport pixels and falls back to original chunks',()=>{
 const s=scene();s.warm();s.sandbox.DPR=4;s.draw();
 assert.equal(s.cv.width,1);assert.equal(s.cv.height,1);assert.equal(s.sandbox.cache.key,null);
 assert.equal(s.blits.length,3);assert.equal(s.blits[1][0],s.chunks[0].cv);
 s.sandbox.DPR=.5;s.draw();s.draw();assert.equal(s.cv.width,640);assert.equal(s.builds.length,4);
});
test('viewport loss is identity-safe and oversized fallback waits for the outer draw lease',()=>{
 const s=scene();s.warm();const oldLoss=s.events.contextlost;
 oldLoss();assert.equal(s.cv.width,1);assert.equal(s.sandbox.cache.canvas,null);
 const events={},next={width:0,height:0,getContext:()=>({setTransform(){},fillRect(){},drawImage(){}}),addEventListener(n,fn){events[n]=fn}};
 s.sandbox.document.createElement=()=>next;s.draw();assert.equal(s.sandbox.cache.canvas,next);
 oldLoss();assert.equal(s.sandbox.cache.canvas,next);assert.equal(next.width,768);
 s.sandbox.beginGraphicsSurfaceUse();s.sandbox.beginGraphicsSurfaceUse();s.sandbox.DPR=4;s.draw();
 assert.equal(s.sandbox.cache.canvas,null);assert.equal(next.width,768);
 s.sandbox.endGraphicsSurfaceUse();assert.equal(next.width,768);s.sandbox.endGraphicsSurfaceUse();assert.equal(next.width,1);
 events.contextlost();assert.equal(s.sandbox.cache.canvas,null);
});
test('moving camera never builds an intermediate viewport surface',()=>{
 const s=scene();for(let i=0;i<20;i++){s.sandbox.cam.x++;s.draw()}
 assert.equal(s.builds.length,0);assert.equal(s.blits.length,40);
 s.draw();assert.equal(s.builds.length,2);
});
test('canvas allocation failure retains original terrain and restores no stale cache',()=>{
 const s=scene();s.sandbox.document.createElement=()=>{throw Error('allocation unavailable')};s.draw();s.blits.length=0;s.draw();
 assert.equal(s.blits.length,2);assert.equal(s.blits[0][0],s.chunks[0].cv);assert.equal(s.sandbox.cache.key,null);
});

test('lost stationary viewport is discarded and rebuilt instead of reusing a valid key for blank terrain',()=>{
 const s=scene();s.warm();s.setLost(true);s.blits.length=0;s.draw();
 assert.equal(s.sandbox.cache.canvas,null);assert.equal(s.sandbox.cache.key,null);
 assert.equal(s.blits[0][0],s.chunks[0].cv,'direct chunks keep the world visible during loss');
 s.setLost(false);s.draw();assert.equal(s.builds.length,4);assert.equal(s.blits.at(-1)[0],s.cv);
 s.events.contextlost();assert.equal(s.sandbox.cache.canvas,null);s.draw();assert.equal(s.builds.length,6);
});

test('invalidated moving views release old chunk references without dropping the live chunk cache',()=>{
 const s=scene();s.warm();const old=s.chunks.slice();assert.equal(s.sandbox.cache.chunks.length,2);
 for(let i=0;i<20;i++){
  s.chunks[0]={cv:{id:10+i*2},ox:i,oy:i,w:512,h:256};s.chunks[1]={cv:{id:11+i*2},ox:i+1,oy:i+1,w:512,h:256};
  s.sandbox.cam.x++;s.draw();
  assert.equal(s.sandbox.cache.chunks.length,0,'an unusable flattened view must not pin chunks retired by the LRU');
 }
 assert.equal(s.builds.length,2,'panning does not rebuild the flattened surface');
 assert.equal(old.some(c=>s.sandbox.cache.chunks.includes(c)),false);
 s.draw();assert.equal(s.sandbox.cache.chunks[0],s.chunks[0]);assert.equal(s.sandbox.cache.chunks[1],s.chunks[1]);
 assert.equal(s.builds.length,4,'the stopped view rebuilds from the current chunks');
});

test('context loss and failed rebuilds release stale terrain references before direct fallback',()=>{
 const s=scene();s.warm();s.setLost(true);s.draw();assert.equal(s.sandbox.cache.chunks.length,0);
 s.setLost(false);s.draw();assert.equal(s.sandbox.cache.chunks.length,2);
 s.events.contextlost();assert.equal(s.sandbox.cache.chunks.length,0);
 s.draw();assert.equal(s.sandbox.cache.chunks.length,2);
 s.cv.getContext().drawImage=()=>{throw Error('upload unavailable')};s.chunks[0]={...s.chunks[0],cv:{id:99}};s.blits.length=0;s.draw();
 assert.equal(s.sandbox.cache.key,null);assert.equal(s.sandbox.cache.chunks.length,0);assert.equal(s.blits[0][0],s.chunks[0].cv);
});
