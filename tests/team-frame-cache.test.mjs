import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {graphicsSurfaceLifetimeSource} from './helpers/headless-game.mjs';
// Frozen pre-extraction arithmetic: independent reference for exact pixel bytes.
function referenceTint(p,color){
 const n=parseInt(color.slice(1),16),target=[n>>16&255,n>>8&255,n&255];
 for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];if(p[i+3]>8&&b-r>26&&b-g>8&&b>r*1.25){const light=Math.max(.25,Math.min(1.35,(r*.21+g*.52+b*.27)/110));for(let k=0;k<3;k++)p[i+k]=Math.min(255,target[k]*light)}}
 return p;
}
test('shared tint kernel is byte-identical on seeded RGBA data and every alpha threshold boundary',()=>{
 const f=fixture(),data=new Uint8ClampedArray(2621440);let seed=0x762;
 for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed>>>24}
 const edges=[];
 for(const alpha of[0,1,7,8,9,10,127,254,255])for(const [r,g,b]of[
  [0,0,0],[255,255,255],[0,0,255],[0,18,27],[0,19,27],
  [40,40,66],[40,40,67],[40,59,67],[40,58,67],
  [80,50,100],[80,50,101],[180,180,255],[0,0,27],
  [255,0,255],[12,10,38],[12,10,39]
 ])edges.push(r,g,b,alpha);
 data.set(edges);
 for(const color of['#2277ee','#ee3322','#9944cc','#eebb33','#000000','#ffffff','#01ff7f','#123456']){
  const actual=data.slice(),expected=referenceTint(data.slice(),color);
  assert.equal(f.tintPaintedPixels(actual,color),actual,'kernel mutates the supplied buffer');
  assert.deepEqual(actual,expected,'every channel matches the original arithmetic for '+color);
  for(let i=3;i<actual.length;i+=4)assert.equal(actual[i],data[i],'alpha is never recoloured');
 }
});
function fixture(){
 let colors=['#2277ee','#ee3322','#9944cc','#eebb33'];const calls=[],canvases=[],clearCalls=[];
 const sandbox={teamColor:t=>colors[t],document:{createElement(){const events={};const canvas={width:0,height:0,events,lost:false,acquisitions:0,addEventListener(name,fn){events[name]=fn},getContext(type,options){canvas.options=options;canvas.acquisitions++;return {isContextLost(){return canvas.lost},drawImage(...args){calls.push(args)},clearRect(...args){clearCalls.push({canvas,args})},getImageData(x,y,w,h){return {data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}};canvases.push(canvas);return canvas}}};
 vm.createContext(sandbox);vm.runInContext(graphicsSurfaceLifetimeSource()+readFileSync(new URL('../js/assets.js',import.meta.url),'utf8')+';globalThis.draw=paintedTeamFrame;globalThis.cache=TEAM_FRAME_CACHE;globalThis.groups=TEAM_FRAME_GROUPS;',sandbox);
 return {...sandbox,calls,colors,canvases,clearCalls};
}
test('failed native tint display construction retires only rejected backings in both pools',()=>{
 for(const kind of['mil','bld_house'])for(const phase of['null','context','before','put','after','register']){
  const f=fixture(),atlas={img:{},meta:{painted:true}},frame={x:0,y:0,w:2,h:3,ax:1,ay:2},create=f.document.createElement;
  const healthy=f.draw(atlas,0,frame,kind),source=f.readTeamFrameSource(atlas,frame);source.original=source.pixels.data.slice();
  let rejected;
  f.document.createElement=()=>{
   const cv={width:0,height:0,lost:phase==='before',events:{},addEventListener(n,fn){this.events[n]=fn;if(phase==='register')throw Error('listener failed')}};
   const ctx={isContextLost:()=>cv.lost,putImageData(){if(phase==='put')throw Error('write failed');if(phase==='after')cv.lost=true}};
   cv.getContext=()=>{if(phase==='context')throw Error('context failed');return phase==='null'?null:ctx};rejected=cv;return cv;
  };
  f.beginGraphicsSurfaceUse();f.beginGraphicsSurfaceUse();assert.throws(()=>f.draw(atlas,1,frame,kind,()=>source),{code:'CK_TEAM_TINT_UNAVAILABLE'});
  assert.equal(f.cache.entries.size,1);assert.equal(f.cache.pixels,6);
  assert.equal(f.groups.troop.pixels+f.groups.building.pixels,6);assert.equal(rejected.width,2);
  f.endGraphicsSurfaceUse();assert.equal(rejected.width,2);f.endGraphicsSurfaceUse();assert.equal(rejected.width,1);assert.equal(healthy.img.width,2);
  f.document.createElement=create;const next=f.draw(atlas,1,frame,kind,()=>source);assert.notEqual(next.img,atlas.img);
  rejected.events.contextlost?.();assert.equal(f.cache.entries.size,2);assert.equal(f.cache.pixels,12);
 }
});
test('failed scratch context, copy, readback or clear releases ownership and retries with a new context',()=>{
 for(const phase of['null','context','before','copy','read','after','clear','health']){
  const f=fixture(),atlas={img:{},meta:{painted:true}},frame={x:0,y:0,w:2,h:3,ax:1,ay:2},create=f.document.createElement;
  let rejected,shouldFail=!['clear','health'].includes(phase);
  f.document.createElement=()=>{
   const cv={width:0,height:0,lost:phase==='before'},ctx={isContextLost(){if(shouldFail&&phase==='health')throw Error('health failed');return cv.lost},
    clearRect(){if(shouldFail&&phase==='clear')throw Error('clear failed')},
    drawImage(){if(shouldFail&&phase==='copy')throw Error('copy failed')},
    getImageData(){if(shouldFail&&phase==='read')throw Error('read failed');if(shouldFail&&phase==='after')cv.lost=true;return {data:new Uint8ClampedArray(24)}}};
   cv.getContext=()=>{if(phase==='context')throw Error('context failed');return phase==='null'?null:ctx};rejected=cv;return cv;
  };
  if(['clear','health'].includes(phase)){f.readTeamFrameSource(atlas,frame);shouldFail=true}
  f.beginGraphicsSurfaceUse();f.beginGraphicsSurfaceUse();
  if(['null','before','after'].includes(phase))assert.equal(f.readTeamFrameSource(atlas,frame),null);
  else assert.throws(()=>f.readTeamFrameSource(atlas,frame),/failed/);
  assert.equal(f.cache.scratch,null);assert.equal(f.cache.entries.size,0);assert.equal(f.cache.pixels,0);assert.equal(rejected.width,2);
  f.endGraphicsSurfaceUse();assert.equal(rejected.width,2);f.endGraphicsSurfaceUse();assert.equal(rejected.width,1);
  f.document.createElement=create;const result=f.readTeamFrameSource(atlas,frame);assert.equal(result.pixels.data.length,24);
  assert.notEqual(f.cache.scratch,rejected);const current=f.cache.scratch;f.clearTeamFrameScratch(rejected);assert.equal(f.cache.scratch,current);
 }
});
test('native cropped team frames reuse pixels while preserving per-animation anchors and reload/palette boundaries',()=>{
 const f=fixture(),a={img:{},meta:{painted:true,motion:true}},frame={x:12,y:18,w:20,h:30,ax:9,ay:28};
 const first=f.draw(a,0,frame);assert.equal(first.img.width,20);assert.equal(first.img.height,30);
 assert.deepEqual(f.calls[0],[a.img,12,18,20,30,0,0,20,30]);assert.equal(first.f.x,0);assert.equal(first.f.y,0);assert.equal(first.f.ax,9);assert.equal(first.f.ay,28);assert.equal(frame.x,12);
 const shifted=f.draw(a,0,{...frame,ax:3,ay:25});assert.equal(shifted.img,first.img);assert.equal(shifted.f.ax,3);assert.equal(shifted.f.ay,25);assert.equal(f.cache.creations,1);
 assert.notEqual(f.draw(a,1,frame).img,first.img);f.colors[0]='#77cc22';assert.notEqual(f.draw(a,0,frame).img,first.img);
 assert.notEqual(f.draw({...a,img:{}},0,frame).img,first.img);
});
test('a shared least-recently-used pixel budget evicts old frames without invalidating an outstanding descriptor',()=>{
 const f=fixture(),a={img:{},meta:{painted:true,motion:true}},frame={x:0,y:0,w:2,h:2,ax:1,ay:2};f.cache.limit=8;f.beginGraphicsSurfaceUse();
 const first=f.draw(a,0,frame),second=f.draw(a,1,frame);assert.equal(f.cache.pixels,8);f.draw(a,0,frame);
 const third=f.draw(a,0,{...frame,x:2});assert.equal(f.cache.entries.size,2);assert.equal(f.cache.pixels,8);assert.equal(f.cache.evictions,1);assert.equal(first.img.width,2);assert.equal(third.img.width,2);
 assert.notEqual(f.draw(a,1,frame).img,second.img,'least recently used team/frame was evicted');assert.ok(f.cache.pixels<=8);
 const oversized=f.draw(a,0,{...frame,w:4,h:4});assert.equal(oversized.img.width,4);assert.ok(f.cache.pixels<=8,'oversized frames are usable but not retained');
 f.endGraphicsSurfaceUse();assert.equal(first.img.width,1);assert.equal(second.img.width,1,'retired descriptors release after the draw batch');
});
test('reserved native-tint pools isolate troop and building pressure within the unchanged total cap',()=>{
 const f=fixture(),a={img:{},meta:{painted:true}},frame={x:0,y:0,w:4,h:4,ax:2,ay:3};
 assert.equal(f.groups.troop.limit+f.groups.building.limit,f.cache.limit);
 assert.equal(f.cache.limit*4,64*1024*1024,'no increase to total retained tint budget');
 f.groups.troop.limit=32;f.groups.building.limit=16;f.cache.limit=48;
 const troop=f.draw(a,0,frame,'mil'),second=f.draw(a,0,{...frame,x:4},'mil');
 const sameFrameBuilding=f.draw(a,0,frame,'bld_house');assert.notEqual(sameFrameBuilding.img,troop.img,'shared atlas rectangles retain separate ownership');
 for(let i=1;i<=20;i++)f.draw(a,0,{...frame,x:i*4},'bld_house');
 assert.equal(f.draw(a,0,frame,'mil').img,troop.img);assert.equal(f.draw(a,0,{...frame,x:4},'mil').img,second.img);
 assert.equal(f.groups.troop.creations,2);assert.equal(f.groups.troop.evictions,0,'buildings cannot evict warmed troop frames');
 const building=f.draw(a,0,{...frame,x:80},'bld_house');
 for(let i=2;i<=25;i++)f.draw(a,0,{...frame,x:i*4},'mil');
 assert.equal(f.draw(a,0,{...frame,x:80},'bld_house').img,building.img,'troop pressure cannot evict warmed buildings');
 assert.equal(f.cache.pixels,f.groups.troop.pixels+f.groups.building.pixels);
 assert.equal(f.cache.entries.size,f.groups.troop.entries.size+f.groups.building.entries.size);
 assert.ok(f.cache.pixels<=48);assert.ok(f.groups.troop.pixels<=32);assert.ok(f.groups.building.pixels<=16);
 assert.equal(sameFrameBuilding.img.width,1,'superseded building frames release promptly');
});
test('quota pressure reclaims an unused prediction before an older demanded frame',()=>{
 const f=fixture(),a={img:{},meta:{painted:true}},frame={x:0,y:0,w:2,h:2,ax:1,ay:1};f.groups.troop.limit=12;
 f.beginGraphicsSurfaceUse();
 const first=f.draw(a,0,frame,'mil'),second=f.draw(a,1,frame,'mil'),hint=f.draw(a,2,frame,'mil');
 const key=f.teamFrameCacheKey(a,2,frame,'troop',f.colors[2]);assert.equal(f.markTeamFramePrediction(key,hint.img),true);
 assert.equal(f.markTeamFramePrediction(key,hint.img),false);assert.equal(f.groups.troop.predictedPixels,4);
 f.draw(a,1,frame,'mil');f.draw(a,3,frame,'mil');
 assert.equal(f.draw(a,0,frame,'mil').img,first.img);assert.equal(f.draw(a,1,frame,'mil').img,second.img);
 assert.equal(f.cache.creations,4);assert.equal(f.cache.evictions,1);assert.equal(f.cache.predictionDiscards,1);
 assert.equal(f.groups.troop.predicted.size,0);assert.equal(f.groups.troop.predictedPixels,0);assert.equal(f.cache.pixels,12);
 assert.equal(hint.img.width,2,'retirement honors the active batch');f.endGraphicsSurfaceUse();
 assert.equal(hint.img.width,1);assert.equal(first.img.width,2);
});
test('a demanded prediction is promoted once and resumes normal LRU ownership',()=>{
 const f=fixture(),a={img:{},meta:{painted:true}},frame={x:0,y:0,w:2,h:2,ax:1,ay:1};f.groups.troop.limit=12;
 const first=f.draw(a,0,frame,'mil');f.draw(a,1,frame,'mil');const hint=f.draw(a,2,frame,'mil');
 f.markTeamFramePrediction(f.teamFrameCacheKey(a,2,frame,'troop',f.colors[2]),hint.img);
 assert.equal(f.draw(a,2,frame,'mil').img,hint.img);f.draw(a,2,frame,'mil');
 assert.equal(f.cache.predictionClaims,1);assert.equal(f.groups.troop.predictedPixels,0);
 f.draw(a,3,frame,'mil');assert.equal(first.img.width,1,'ordinary LRU applies after all frames have been claimed');
 assert.equal(hint.img.width,2);assert.equal(f.cache.predictionDiscards,0);
});
test('multiple unused predictions free only their troop quota and preserve live accounting',()=>{
 const f=fixture(),a={img:{},meta:{painted:true}},frame={x:0,y:0,w:2,h:2,ax:1,ay:1};f.groups.troop.limit=20;
 const first=f.draw(a,0,frame,'mil'),second=f.draw(a,1,frame,'mil'),building=f.draw(a,0,frame,'bld_house');
 const buildingKey=f.teamFrameCacheKey(a,0,frame,'building',f.colors[0]);assert.equal(f.markTeamFramePrediction(buildingKey,building.img),false);
 for(const [team,source]of[[2,{...frame,h:4}],[3,frame]]){
  const hint=f.draw(a,team,source,'mil');f.markTeamFramePrediction(f.teamFrameCacheKey(a,team,source,'troop',f.colors[team]),hint.img);
 }
 assert.equal(f.groups.troop.predictedPixels,12);f.draw(a,0,{...frame,w:3,h:4},'mil');
 assert.equal(f.draw(a,0,frame,'mil').img,first.img);assert.equal(f.draw(a,1,frame,'mil').img,second.img);
 assert.equal(f.draw(a,0,frame,'bld_house').img,building.img);assert.equal(f.groups.building.evictions,0);
 assert.equal(f.groups.troop.pixels,20);assert.equal(f.groups.troop.predictedPixels,0);assert.equal(f.cache.predictionDiscards,2);
 assert.equal(f.cache.pixels,f.groups.troop.pixels+f.groups.building.pixels);
});
test('prediction provenance follows identity-safe loss and clear paths and excludes unretained frames',()=>{
 const f=fixture(),a={img:{},meta:{painted:true}},frame={x:0,y:0,w:2,h:2,ax:1,ay:1};f.groups.troop.limit=4;
 const key=f.teamFrameCacheKey(a,0,frame,'troop',f.colors[0]),first=f.draw(a,0,frame,'mil');f.markTeamFramePrediction(key,first.img);
 first.img.events.contextlost();assert.equal(f.groups.troop.predictedPixels,0);assert.equal(f.cache.predictionDiscards,0);
 const replacement=f.draw(a,0,frame,'mil');f.markTeamFramePrediction(key,replacement.img);first.img.events.contextlost();
 assert.equal(f.groups.troop.predicted.get(key),replacement.img);assert.equal(f.groups.troop.predictedPixels,4);
 assert.equal(f.markTeamFramePrediction(key,first.img),false);
 const oversized={...frame,w:4,h:4},large=f.draw(a,0,oversized,'mil');
 assert.equal(f.markTeamFramePrediction(f.teamFrameCacheKey(a,0,oversized,'troop',f.colors[0]),large.img),false);
 f.clearTeamFrameCache();assert.equal(f.groups.troop.predicted.size,0);assert.equal(f.groups.troop.predictedPixels,0);
 assert.equal(f.cache.pixels,0);assert.equal(replacement.img.width,1);
});
test('pool loss, clear and oversized admission preserve both accounting and the other class',()=>{
 const f=fixture(),a={img:{},meta:{painted:true}},frame={x:0,y:0,w:4,h:4,ax:2,ay:3};
 f.groups.troop.limit=f.groups.building.limit=16;f.cache.limit=32;
 const troop=f.draw(a,0,frame,'mil'),building=f.draw(a,0,frame,'bld_keep');
 building.img.events.contextlost();assert.equal(f.groups.building.pixels,0);assert.equal(f.cache.pixels,16);
 const next=f.draw(a,0,frame,'bld_keep');building.img.events.contextlost();assert.equal(f.groups.building.entries.size,1);
 assert.equal(f.draw(a,0,frame,'mil').img,troop.img);
 const oversized=f.draw(a,0,{...frame,w:8,h:8},'bld_keep');assert.equal(oversized.img.width,8,'uncached external frames retain native pixels');
 assert.equal(f.groups.building.pixels,16);assert.equal(f.cache.pixels,32);
 f.beginGraphicsSurfaceUse();f.clearTeamFrameCache();
 assert.equal(f.cache.entries.size,0);assert.equal(f.groups.troop.pixels+f.groups.building.pixels,0);
 assert.equal(troop.img.width,4);f.endGraphicsSurfaceUse();assert.equal(troop.img.width,1);assert.equal(next.img.width,1);
});
test('neutral art bypasses tint allocation while failed native preparation raises a colour error',()=>{
 const f=fixture(),frame={x:5,y:7,w:2,h:2,ax:1,ay:2},image={};
 const neutral=f.draw({img:image,meta:{painted:true,neutral:true}},3,frame);assert.equal(neutral.img,image);assert.equal(neutral.f,frame);assert.equal(f.cache.entries.size,0);
 f.document.createElement=()=>{throw Error('unavailable canvas')};assert.throws(()=>f.draw({img:image,meta:{painted:true,motion:true}},0,frame),{code:'CK_TEAM_TINT_UNAVAILABLE'});assert.equal(f.cache.creations,0);
});

test('lost palette surfaces are evicted and rebuilt without retaining blank pixels or corrupting accounting',()=>{
 const f=fixture(),a={img:{},meta:{painted:true,motion:true}},frame={x:0,y:0,w:2,h:3,ax:1,ay:2};
 const first=f.draw(a,0,frame);assert.equal(f.canvases[0].options.willReadFrequently,true,'readback scratch uses software pixels');assert.notEqual(first.img.options?.willReadFrequently,true,'retained display is GPU-eligible');
 first.img.lost=true;first.img.events.contextlost();assert.equal(f.cache.pixels,0);assert.equal(f.cache.entries.size,0);
 const rebuilt=f.draw(a,0,frame);assert.notEqual(rebuilt.img,first.img);assert.equal(f.cache.pixels,6);
 rebuilt.img.lost=true;const early=f.draw(a,0,frame);assert.notEqual(early.img,rebuilt.img,'isContextLost protects the interval before the event is delivered');assert.equal(f.cache.pixels,6);
 first.img.events.contextlost();assert.equal(f.cache.pixels,6,'late repeated event cannot remove the replacement');
 const create=f.document.createElement;f.document.createElement=()=>{const cv=create();cv.lost=true;return cv};
 assert.throws(()=>f.draw(a,1,frame),{code:'CK_TEAM_TINT_UNAVAILABLE'});assert.equal(f.cache.pixels,6);
});
test('full-sheet tint failures release rejected backings and never cache the source as a team image',()=>{
 for(const phase of['null','context','before','copy','read','readLoss','put','after','register']){
  const f=fixture(),atlas={img:{width:20,height:30},meta:{painted:true}},create=f.document.createElement;let rejected;
  const good=f.paintedTeamImage(atlas,0);
  f.document.createElement=()=>{
   const cv={width:0,height:0,lost:phase==='before',events:{},addEventListener(n,fn){this.events[n]=fn;if(phase==='register')throw Error('listener failed')}};
   const ctx={isContextLost:()=>cv.lost,drawImage(){if(phase==='copy')throw Error('copy failed')},
    getImageData(){if(phase==='read')throw Error('read failed');if(phase==='readLoss')cv.lost=true;return {data:new Uint8ClampedArray(2400)}},
    putImageData(){if(phase==='put')throw Error('write failed');if(phase==='after')cv.lost=true}};
   cv.getContext=()=>{if(phase==='context')throw Error('context failed');return phase==='null'?null:ctx};rejected=cv;return cv;
  };
  f.beginGraphicsSurfaceUse();f.beginGraphicsSurfaceUse();assert.throws(()=>f.paintedTeamImage(atlas,1),{code:'CK_TEAM_TINT_UNAVAILABLE'});
  assert.equal(atlas.teams[1],undefined);assert.equal(atlas.teams[0],good);assert.equal(rejected.width,20);
  f.endGraphicsSurfaceUse();assert.equal(rejected.width,20);f.endGraphicsSurfaceUse();assert.equal(rejected.width,1);assert.equal(good.width,20);
  f.document.createElement=create;const retry=f.paintedTeamImage(atlas,1);assert.notEqual(retry,atlas.img);
  rejected.events.contextlost?.();assert.equal(atlas.teams[1],retry);
 }
});
test('full-sheet palette, source identity and health changes cannot reuse stale or poisoned colours',()=>{
 const f=fixture(),atlas={img:{width:20,height:30},meta:{painted:true}};
 atlas.teams={1:atlas.img};const source=atlas.img,first=f.paintedTeamImage(atlas,1);assert.notEqual(first,source);assert.equal(source.width,20);
 assert.equal(f.paintedTeamImage(atlas,1),first);f.colors[1]='#11cc77';const recoloured=f.paintedTeamImage(atlas,1);
 assert.notEqual(recoloured,first);assert.equal(first.width,1);recoloured.lost=true;
 const healthy=f.paintedTeamImage(atlas,1);assert.notEqual(healthy,recoloured);assert.equal(recoloured.width,1);
 recoloured.events.contextlost();assert.equal(atlas.teams[1],healthy);
 atlas.img={width:20,height:30};const replacement=f.paintedTeamImage(atlas,1);assert.notEqual(replacement,healthy);assert.equal(healthy.width,1);
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

test('lost shared CPU readback canvas is replaced on the next tinted miss',()=>{
 const f=fixture(),atlas={img:{},meta:{painted:true}},fr={x:0,y:0,w:20,h:30,ax:11,ay:29};
 const one=f.draw(atlas,0,fr,'bld_house');
 const scratch=f.cache.scratch;scratch.lost=true;
 const two=f.draw(atlas,0,{...fr,x:40},'bld_house');
 assert.notEqual(f.cache.scratch,scratch);
 assert.notEqual(one.img,two.img);
 assert.notEqual(two.img,atlas.img,'never permanently fall back to the untinted atlas');
 assert.equal(f.cache.entries.size,2);
});

test('a busy battlefield reuses tint texture contexts instead of reacquiring per soldier',()=>{
 const f=fixture(),atlas={img:{},meta:{painted:true,motion:true}},frame={x:0,y:0,w:70,h:90,ax:35,ay:86};
 const first=f.draw(atlas,0,frame);
 const display=first.img,originalReadback=f.canvases[0],displayAcquisitions=display.acquisitions;
 for(let i=0;i<1000;i++)assert.equal(f.draw(atlas,0,frame).img,display);
 assert.equal(f.cache.hits,1000);
 assert.equal(display.acquisitions,displayAcquisitions,'each cache hit checks its retained context');
 assert.equal(originalReadback.acquisitions,1,'readback context is not reacquired on a tint cache hit');
 display.lost=true; // Before the async contextlost event is delivered.
 assert.notEqual(f.draw(atlas,0,frame).img,display);
 assert.equal(f.cache.entries.size,1);
 assert.equal(f.cache.pixels,70*90);
});
test('equal-size tint readbacks clear stale alpha without repeated canvas resizing',()=>{
 const f=fixture(),atlas={img:{},meta:{painted:true,motion:true}},first={x:0,y:0,w:60,h:75,ax:25,ay:70};
 f.draw(atlas,0,first);
 const scratch=f.cache.scratch;
 f.draw(atlas,0,{...first,x:65});
 assert.equal(f.cache.scratch,scratch);
 assert.equal(scratch.acquisitions,1,'same-size crops reuse their readback context');
 assert.equal(f.clearCalls.length,1,'transparent pixels from the prior frame must be cleared');
 assert.deepEqual(f.clearCalls[0].args,[0,0,60,75]);
 assert.equal(f.cache.entries.size,2);
 scratch.lost=true;
 f.draw(atlas,0,{...first,x:130});
 assert.notEqual(f.cache.scratch,scratch,'a lost scratch is replaced before its pixels are sampled');
});
