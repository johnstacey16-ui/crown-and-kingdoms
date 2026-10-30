import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
function fixture(){
 const source=readFileSync(new URL('../js/render.js',import.meta.url),'utf8'),calls=[];
 const context=new Proxy({createRadialGradient(){return {addColorStop(){}}},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)}}},{get(o,k){return o[k]||((...args)=>calls.push([k,...args]))}});
 const sandbox={document:{createElement(){return {width:0,height:0,getContext:()=>context}}}};
 vm.createContext(sandbox);vm.runInContext(source.slice(source.indexOf('function buildingDamageStage('),source.indexOf('function drawBld('))+';globalThis.api={stage:buildingDamageStage,draw:drawBuildingArtwork,prepare:damagedBuildingArtwork,cache:BUILDING_DAMAGE_CACHE};',sandbox);
 const art={painted:true,img:{paintedTeam:1},f:{x:10,y:20,w:20,h:30,ax:8,ay:28},sc:1};
 return {...sandbox.api,sandbox,calls,art};
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
 const f=fixture();f.cache.limit=600;const first=f.prepare(f.art,1);f.prepare(f.art,2);assert.equal(f.cache.evictions,1);assert.equal(f.cache.pixels,600);assert.equal(f.cache.entries.size,1);assert.equal(first.img.width,20);
 const large=f.prepare({...f.art,f:{...f.art.f,w:40}},1);assert.equal(large.img.width,40);assert.equal(f.cache.pixels,600);
 f.sandbox.document.createElement=()=>{throw Error('no canvas')};const missing={...f.art,img:{}};assert.equal(f.prepare(missing,1),missing,'fallback retains the descriptor');
});
test('healthy, ghost and unfinished draws never allocate damage textures',()=>{
 const f=fixture(),g=new Proxy({drawImage(...args){f.calls.push(['drawImage',...args])}},{get(o,k){return o[k]||(()=>{})}});
 f.draw(g,f.art,100,120,1,true,1,false,0);
 f.draw(g,f.art,100,120,1,true,1,true,2);
 f.draw(g,f.art,100,120,1,false,.5,false,2);
 assert.equal(f.cache.creations,0);
});
