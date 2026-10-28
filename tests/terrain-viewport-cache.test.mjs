import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
const production=source.slice(source.indexOf('const TERRAIN_VIEW='),source.indexOf('const PMAX='));
function scene(){
 const builds=[],blits=[],transforms=[];
 const g={setTransform(...a){transforms.push(a)},fillRect(){},drawImage(...a){builds.push(a)}};
 const cv={width:0,height:0,getContext(){return g}};
 const sandbox={CW:1280,CH:720,DPR:.6,zm:1.4,cam:{x:.3,y:.7},document:{createElement(){return cv}},X:{save(){},restore(){},setTransform(){},drawImage(...a){blits.push(a)}}};
 vm.createContext(sandbox);vm.runInContext(production+';globalThis.cache=TERRAIN_VIEW;',sandbox);
 const chunks=[{cv:{id:1},ox:1,oy:2,w:512,h:256},{cv:{id:2},ox:3,oy:4,w:512,h:256}];
 return {sandbox,cv,builds,blits,transforms,chunks,draw:()=>sandbox.drawTerrainViewport(chunks),warm:()=>{sandbox.drawTerrainViewport(chunks);blits.length=0;sandbox.drawTerrainViewport(chunks)}};
}
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
test('moving camera never builds an intermediate viewport surface',()=>{
 const s=scene();for(let i=0;i<20;i++){s.sandbox.cam.x++;s.draw()}
 assert.equal(s.builds.length,0);assert.equal(s.blits.length,40);
 s.draw();assert.equal(s.builds.length,2);
});
test('canvas allocation failure retains original terrain and restores no stale cache',()=>{
 const s=scene();s.sandbox.document.createElement=()=>{throw Error('allocation unavailable')};s.draw();s.blits.length=0;s.draw();
 assert.equal(s.blits.length,2);assert.equal(s.blits[0][0],s.chunks[0].cv);assert.equal(s.sandbox.cache.key,null);
});
