import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function fixture(){
 let colors=['#2277ee','#ee3322'];const calls=[],canvases=[];
 const sandbox={teamColor:t=>colors[t],document:{createElement(){const events={};const canvas={width:0,height:0,events,lost:false,addEventListener(name,fn){events[name]=fn},getContext(type,options){canvas.options=options;return {isContextLost(){return canvas.lost},drawImage(...args){calls.push(args)},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}};canvases.push(canvas);return canvas}}};
 vm.createContext(sandbox);vm.runInContext(readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+';globalThis.draw=paintedTeamFrame;globalThis.cache=TEAM_FRAME_CACHE;',sandbox);
 return {...sandbox,calls,colors,canvases};
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

test('lost palette surfaces are evicted and rebuilt without retaining blank pixels or corrupting accounting',()=>{
 const f=fixture(),a={img:{},meta:{painted:true,motion:true}},frame={x:0,y:0,w:2,h:3,ax:1,ay:2};
 const first=f.draw(a,0,frame);assert.equal(f.canvases[0].options.willReadFrequently,true,'readback scratch uses software pixels');assert.notEqual(first.img.options?.willReadFrequently,true,'retained display is GPU-eligible');
 first.img.lost=true;first.img.events.contextlost();assert.equal(f.cache.pixels,0);assert.equal(f.cache.entries.size,0);
 const rebuilt=f.draw(a,0,frame);assert.notEqual(rebuilt.img,first.img);assert.equal(f.cache.pixels,6);
 rebuilt.img.lost=true;const early=f.draw(a,0,frame);assert.notEqual(early.img,rebuilt.img,'isContextLost protects the interval before the event is delivered');assert.equal(f.cache.pixels,6);
 first.img.events.contextlost();assert.equal(f.cache.pixels,6,'late repeated event cannot remove the replacement');
 const create=f.document.createElement;f.document.createElement=()=>{const cv=create();cv.lost=true;return cv};
 const fallback=f.draw(a,1,frame);assert.equal(fallback.img,a.img);assert.equal(fallback.f,frame);assert.equal(f.cache.pixels,6);
});

test('asset readiness probes complete poses without allocating or tinting and tracks replacements/failures',()=>{
 const f=fixture(),image={},frame={x:0,y:0,w:2,h:2,ax:1,ay:2},key='mil/walk/1';
 assert.equal(f.hasReadyAssetPose('mil',1,1),false);
 f.regAtlas('partial',image,{painted:true,motion:true,anims:{[key]:{dirs:[[frame],[]]}}});
 assert.equal(f.hasReadyAssetPose('mil',1,1),false,'partial directions retain procedural warm-up');
 f.regAtlas('ready',image,{painted:true,motion:true,anims:{[key]:{dirs:[[frame],[frame]]}}});
 assert.equal(f.hasReadyAssetPose('mil',1,1),true);assert.equal(f.hasReadyAssetPose('mil',0,1),false);assert.equal(f.hasReadyAssetPose('mil',1,0),false);
 assert.equal(f.canvases.length,0);assert.equal(f.cache.creations,0,'readiness must not prepare palettes');
 f.loadAtlas('ready','missing.webp',{anims:{[key]:{frames:[frame]}}});
 assert.equal(f.hasReadyAssetPose('mil',1,1),false,'failed replacement loading restores procedural warm-up');
 f.regAtlas('ready',image,{anims:{[key]:{frames:[frame]}}});assert.equal(f.hasReadyAssetPose('mil',1,1),true,'valid flat frame lists can become ready again');
 f.regAtlas('ready',{}, {painted:true,motion:true,anims:{[key]:{frames:[]}}});
 assert.equal(f.hasReadyAssetPose('mil',1,1),false,'replacement metadata invalidates readiness');
 f.regAtlas('ready',{}, {anims:{[key]:{dirs:'invalid'}}});assert.equal(f.hasReadyAssetPose('mil',1,1),false,'malformed external directions cannot interrupt warming');
});

test('native painted building crops preserve anchors, reuse a small image and avoid a full tinted atlas',()=>{
 const f=fixture(),img={width:1536,height:1024},frame={x:120,y:240,w:243,h:248,ax:121,ay:238};
 f.regAtlas('architecture',img,{painted:true,anims:{
  'bld_keep/idle/1':{dur:1,scale:1,frames:[frame]}
 }});
 const first=f.assetFrame('bld_keep',1,0,0,0),again=f.assetFrame('bld_keep',1,0,0,2);
 assert.equal(first.painted,true);assert.equal(first.img.width,243);assert.equal(first.img.height,248);
 assert.equal(first.f.x,0);assert.equal(first.f.y,0);
 assert.equal(first.f.ax,121);assert.equal(first.f.ay,238);
 assert.equal(first.sourceFrame,frame);
 assert.equal(first.img,again.img,'the next frame reuses the same native crop');
 assert.equal(f.canvases.length,2,'one scratch and one native display, no full-team tint');
 assert.equal(f.cache.creations,1);assert.equal(f.cache.pixels,243*248);
 assert.deepEqual(f.calls[0],[img,120,240,243,248,0,0,243,248]);
 assert.equal(f.cache.entries.size,1,'only the native sprite region is retained');
});
test('building crop context loss replaces a damaged derived surface without changing artwork or age frame metadata',()=>{
 const f=fixture(),atlas={img:{},meta:{painted:true}},frame={x:3,y:5,w:80,h:90,ax:32,ay:86};
 const first=f.draw(atlas,0,frame,'bld_house_age_3');
 first.img.lost=true;first.img.events.contextlost();
 assert.equal(f.cache.pixels,0);assert.equal(f.cache.entries.size,0);
 const next=f.draw(atlas,0,frame,'bld_house_age_3');
 assert.notEqual(first.img,next.img);assert.equal(f.cache.pixels,80*90);
 assert.equal(next.f.ax,frame.ax);assert.equal(next.f.ay,frame.ay);
 assert.equal(frame.x,3,'source atlas coordinates remain unmodified');
});

test('shared readback canvas creates GPU-eligible native crops for static architecture',()=>{
 const f=fixture(),a={img:{width:1536,height:1024},meta:{painted:true}};
 const one=f.draw(a,0,{x:0,y:0,w:20,h:30,ax:10,ay:29},'bld_mill');
 const two=f.draw(a,1,{x:40,y:60,w:25,h:35,ax:12,ay:33},'bld_house');
 assert.equal(f.canvases.length,3,'one scratch reused for two display canvases');
 assert.equal(f.canvases[0].options.willReadFrequently,true);
 assert.notEqual(one.img.options?.willReadFrequently,true);
 assert.notEqual(two.img.options?.willReadFrequently,true);
 assert.equal(f.cache.pixels,20*30+25*35);
 assert.equal(f.cache.scratch.width,25);assert.equal(f.cache.scratch.height,35);
 assert.equal(one.f.ax,10);assert.equal(two.f.ay,33);
});
