import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function fixture(){
 let colors=['#2277ee','#ee3322'];const calls=[];
 const sandbox={teamColor:t=>colors[t],document:{createElement(){return {width:0,height:0,getContext(){return {drawImage(...args){calls.push(args)},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}}}}};
 vm.createContext(sandbox);vm.runInContext(readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+';globalThis.draw=paintedTeamFrame;globalThis.cache=TEAM_FRAME_CACHE;',sandbox);
 return {...sandbox,calls,colors};
}
test('native cropped team frames reuse pixels while preserving per-animation anchors and reload/palette boundaries',()=>{
 const f=fixture(),a={img:{},meta:{painted:true,motion:true}},frame={x:12,y:18,w:20,h:30,ax:9,ay:28};
 const first=f.draw(a,0,frame);assert.equal(first.img.width,20);assert.equal(first.img.height,30);
 assert.deepEqual(f.calls[0],[a.img,12,18,20,30,0,0,20,30]);assert.equal(first.f.x,0);assert.equal(first.f.y,0);assert.equal(first.f.ax,9);assert.equal(first.f.ay,28);assert.equal(frame.x,12);
 const shifted=f.draw(a,0,{...frame,ax:3,ay:25});assert.equal(shifted.img,first.img);assert.equal(shifted.f.ax,3);assert.equal(shifted.f.ay,25);assert.equal(f.cache.creations,1);
 assert.notEqual(f.draw(a,1,frame).img,first.img);f.colors[0]='#77cc22';assert.notEqual(f.draw(a,0,frame).img,first.img);
 assert.notEqual(f.draw({...a,img:{}},0,frame).img,first.img);
});
test('a shared least-recently-used pixel budget evicts old frames without invalidating an outstanding descriptor',()=>{
 const f=fixture(),a={img:{},meta:{painted:true,motion:true}},frame={x:0,y:0,w:2,h:2,ax:1,ay:2};f.cache.limit=8;
 const first=f.draw(a,0,frame),second=f.draw(a,1,frame);assert.equal(f.cache.pixels,8);f.draw(a,0,frame);
 const third=f.draw(a,0,{...frame,x:2});assert.equal(f.cache.entries.size,2);assert.equal(f.cache.pixels,8);assert.equal(f.cache.evictions,1);assert.equal(first.img.width,2);assert.equal(third.img.width,2);
 assert.notEqual(f.draw(a,1,frame).img,second.img,'least recently used team/frame was evicted');assert.ok(f.cache.pixels<=8);
 const oversized=f.draw(a,0,{...frame,w:4,h:4});assert.equal(oversized.img.width,4);assert.ok(f.cache.pixels<=8,'oversized frames are usable but not retained');
});
test('neutral art bypasses tint allocation and failed canvas creation retains the original source rectangle',()=>{
 const f=fixture(),frame={x:5,y:7,w:2,h:2,ax:1,ay:2},image={};
 const neutral=f.draw({img:image,meta:{painted:true,neutral:true}},3,frame);assert.equal(neutral.img,image);assert.equal(neutral.f,frame);assert.equal(f.cache.entries.size,0);
 f.document.createElement=()=>{throw Error('unavailable canvas')};const fallback=f.draw({img:image,meta:{painted:true,motion:true}},0,frame);assert.equal(fallback.img,image);assert.equal(fallback.f,frame);assert.equal(f.cache.creations,0);
});
