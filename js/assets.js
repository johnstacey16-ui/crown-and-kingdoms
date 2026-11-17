/* ===== ASSET MANAGER: optional sprite atlases; the procedural art above is always the fallback =====
Pack format (embed as a script element with id ck-assets and type application/json, or set window.CK_ASSETS before this script runs):
{atlases:[{id,src:'data:image/png;base64,...' or url,meta:{anims:{'<unit>/<state>/<team>':{dur:seconds,scale:1,dirs:[[frame,...] x8]  (or frames:[...] for one direction)}}}}]}
frame={x,y,w,h,ax,ay} (rectangle in the atlas; ax,ay = feet anchor inside the frame). states: idle, walk, attack, work. team: 0 blue, 1 red.
A missing, failed or malformed atlas simply leaves the unit on its procedural sprite. */
const ASSET={atl:{},n:0,hits:0,miss:0},STN=['idle','walk','attack','work'];
// Observation only. First atlas draw time is a synchronous decode/upload proxy,
// not a measurement of browser decode time or GPU memory.
const GRAPHICS_TRACE={frame:{},frames:[],next:0,sequence:0,atlases:new WeakSet(),atlasDraws:[]};
function resetGraphicsTraceFrame(){
 GRAPHICS_TRACE.frame={tints:0,crops:0,readbackPixels:0,tintEvictions:0,cropEvictions:0,firstDrawMs:0,surfaceReleases:0,releasePixels:0,warmCreations:0,warmAttempts:0,predictCreations:0,predictAttempts:0,predictSkipped:0,predictClaims:0,predictDiscards:0,transientTints:0,transientSurfaces:0,transientResizes:0,transientPeakPixels:0,transientPixelHits:0,transientPixelPeakBytes:0,tintCapHits:0};
}
resetGraphicsTraceFrame();
function traceAtlasDraw(ctx,img,...args){
 if(GRAPHICS_TRACE.atlases.has(img)){ctx.drawImage(img,...args);return}
 const start=typeof performance!=='undefined'?performance.now():0;
 ctx.drawImage(img,...args);
 const ms=typeof performance!=='undefined'?performance.now()-start:0;
 GRAPHICS_TRACE.atlases.add(img);GRAPHICS_TRACE.frame.firstDrawMs+=ms;
 const atlas=Object.entries(ASSET.atl).find(([,a])=>a.img===img);
 GRAPHICS_TRACE.atlasDraws.push({atlas:atlas?.[0]||'external',ms});
 if(GRAPHICS_TRACE.atlasDraws.length>120)GRAPHICS_TRACE.atlasDraws.shift();
}
// Interim art aliases let new ship roles reuse all Galley poses and team tints.
const SHIP_ART_FALLBACK=Object.freeze({fire:'gal',demo:'gal',cgal:'gal'});
// Indexed on asset registration/replacement, not once for each rendered unit.
// Preserve atlas registration order and allow multiple candidates for a key:
// a malformed/empty animation may still fall through to the next sheet.
const ASSET_ANIM_INDEX=new Map();
function rebuildAssetAnimationIndex(){
 ASSET_ANIM_INDEX.clear();
 for(const id in ASSET.atl){
  const atlas=ASSET.atl[id];
  if(!atlas?.ok||!atlas.img||!atlas.meta?.anims)continue;
  for(const key in atlas.meta.anims){
   let candidates=ASSET_ANIM_INDEX.get(key);
   if(!candidates){candidates=[];ASSET_ANIM_INDEX.set(key,candidates)}
   candidates.push(atlas);
  }
 }
 if(typeof queueRosterTintWarmup==='function'&&typeof S!=='undefined'&&S)queueRosterTintWarmup(S);
}

// Readiness only: probing must never create tints or sample image pixels.
// Require every declared direction/frame so partial external packs remain
// conservatively eligible for procedural warm-up.
function hasReadyAssetPose(kind,team,state){
 const key=(SHIP_ART_FALLBACK[kind]||kind)+'/'+STN[state]+'/'+team;
 return (ASSET_ANIM_INDEX.get(key)||[]).some(atlas=>{
  if(!atlas.ok||!atlas.img)return false;
  const animation=atlas.meta?.anims?.[key],lists=animation?.dirs||(animation?.frames?[animation.frames]:[]);
  return Array.isArray(lists)&&lists.length>0&&lists.every(frames=>Array.isArray(frames)&&frames.length>0&&frames.every(f=>f&&[f.x,f.y,f.w,f.h,f.ax,f.ay].every(Number.isFinite)&&f.w>0&&f.h>0));
 });
}

// Pure in-place RGBA kernel shared by native crops and external full sheets.
// Keep the thresholds, light arithmetic and Uint8ClampedArray rounding exact.
function tintPaintedPixels(p,color){
 const n=parseInt(color.slice(1),16),red=n>>16&255,green=n>>8&255,blue=n&255;
 for(let i=0;i<p.length;i+=4){
  const r=p[i],g=p[i+1],b=p[i+2];
  if(p[i+3]>8&&b-r>26&&b-g>8&&b>r*1.25){
   const light=Math.max(.25,Math.min(1.35,(r*.21+g*.52+b*.27)/110));
   p[i]=Math.min(255,red*light);
   p[i+1]=Math.min(255,green*light);
   p[i+2]=Math.min(255,blue*light);
  }
 }
 return p;
}
// Recolour only the painted blue cloth/heraldry, retaining its light and texture.
// The neutral stone, skin, steel, timber and terrain pixels remain unchanged.
function paintedTintFailure(cause){
 if(cause?.code==='CK_TEAM_TINT_UNAVAILABLE')return cause;
 const error=new Error('Team-colour artwork could not be prepared'+(cause?.message?': '+cause.message:'.'));
 error.code='CK_TEAM_TINT_UNAVAILABLE';return error;
}
function paintedTeamImage(atlas,team){
 if(!atlas.meta.painted||atlas.meta.neutral)return atlas.img;
 atlas.teams=atlas.teams||{};
 const color=teamColor(team),width=atlas.img.naturalWidth||atlas.img.width||atlas.meta.width,height=atlas.img.naturalHeight||atlas.img.height||atlas.meta.height;
 const prior=atlas.teams[team];
 if(prior){
  if(prior!==atlas.img&&prior.paintedTeamColor===color&&prior.paintedSourceImage===atlas.img&&prior.width===width&&prior.height===height&&healthyTeamFrame(prior))return prior;
  delete atlas.teams[team];if(prior!==atlas.img&&typeof retireGraphicsSurface==='function')retireGraphicsSurface(prior);
 }
 let canvas=null,prepared=false;
 try{
  canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx||ctx.isContextLost?.())throw paintedTintFailure();traceAtlasDraw(ctx,atlas.img,0,0);
  GRAPHICS_TRACE.frame.readbackPixels+=canvas.width*canvas.height;
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
  if(ctx.isContextLost?.())throw paintedTintFailure();
  tintPaintedPixels(pixels.data,color);
  ctx.putImageData(pixels,0,0);if(ctx.isContextLost?.())throw paintedTintFailure();
  canvas.paintedAtlas=true;canvas.paintedTeam=team;canvas.paintedTeamColor=color;canvas.paintedSourceImage=atlas.img;
  GRAPHICS_TRACE.frame.tints++;
  canvas.addEventListener?.('contextlost',()=>{if(atlas.teams?.[team]===canvas){delete atlas.teams[team];if(typeof retireGraphicsSurface==='function')retireGraphicsSurface(canvas)}});
  TEAM_FRAME_CONTEXTS.set(canvas,ctx);atlas.teams[team]=canvas;prepared=true;return canvas;
 }catch(error){throw paintedTintFailure(error)}finally{
  if(canvas&&!prepared){if(atlas.teams[team]===canvas)delete atlas.teams[team];if(typeof retireGraphicsSurface==='function')retireGraphicsSurface(canvas)}
 }
}
// Bound tinted native frames and use a single CPU readback scratch; the cached
// Canvas2D images are GPU-eligible to avoid repeated Xbox software uploads.
const TEAM_FRAME_CACHE={entries:new Map(),ids:new WeakMap(),next:1,pixels:0,limit:16*1024*1024,hits:0,creations:0,evictions:0,predictionClaims:0,predictionDiscards:0,scratch:null};
// Reserve separate native-tint working sets within the existing 64 MiB cap.
// Each pool has its own recency order; neither evicts the other's frames.
const TEAM_FRAME_GROUPS={
 troop:{entries:new Map(),predicted:new Map(),predictedPixels:0,pixels:0,limit:13*1024*1024,hits:0,creations:0,evictions:0},
 building:{entries:new Map(),predicted:new Map(),predictedPixels:0,pixels:0,limit:3*1024*1024,hits:0,creations:0,evictions:0}
};
function markTeamFramePrediction(key,canvas){
 // Additional provenance only: the normal pool remains the byte-budget owner.
 // Call only for a newly created, retained prediction result.
 const group=TEAM_FRAME_GROUPS.troop;
 if(!canvas||TEAM_FRAME_CACHE.entries.get(key)!==canvas||group.entries.get(key)!==canvas||group.predicted.has(key))return false;
 group.predicted.set(key,canvas);group.predictedPixels+=canvas.width*canvas.height;return true;
}
function forgetTeamFramePrediction(key,canvas,group){
 if(group.predicted.get(key)!==canvas)return false;
 group.predicted.delete(key);group.predictedPixels-=canvas.width*canvas.height;return true;
}
function removeTeamFrameEntry(key,canvas,group,evicted=false){
 if(TEAM_FRAME_CACHE.entries.get(key)!==canvas)return;
 const predicted=forgetTeamFramePrediction(key,canvas,group);
 TEAM_FRAME_CACHE.entries.delete(key);group.entries.delete(key);
 const pixels=canvas.width*canvas.height;TEAM_FRAME_CACHE.pixels-=pixels;group.pixels-=pixels;
 if(evicted){
  TEAM_FRAME_CACHE.evictions++;group.evictions++;GRAPHICS_TRACE.frame.tintEvictions++;
  if(predicted){TEAM_FRAME_CACHE.predictionDiscards++;GRAPHICS_TRACE.frame.predictDiscards++}
 }
 if(typeof retireGraphicsSurface==='function')retireGraphicsSurface(canvas);
}
function clearTeamFrameCache(){
 if(typeof clearUnitTintPixels==='function')clearUnitTintPixels();
 if(typeof clearTintWarmupSource==='function')clearTintWarmupSource();
 const images=[...TEAM_FRAME_CACHE.entries.values()];
 TEAM_FRAME_CACHE.entries.clear();TEAM_FRAME_CACHE.pixels=0;
 for(const group of Object.values(TEAM_FRAME_GROUPS)){group.entries.clear();group.predicted.clear();group.predictedPixels=0;group.pixels=0}
 if(typeof retireGraphicsSurface==='function')for(const image of images)retireGraphicsSurface(image);
}
function teamFrameCacheKey(atlas,team,f,category,color){
 let id=TEAM_FRAME_CACHE.ids.get(atlas.img);
 if(!id){id=TEAM_FRAME_CACHE.next++;TEAM_FRAME_CACHE.ids.set(atlas.img,id)}
 return [category,id,team,color,f.x,f.y,f.w,f.h].join('/');
}
// Store the context alongside each cached image without retaining evicted
// surfaces. Every painted unit used to call getContext() on the same cached
// tint each frame; on Edge this browser call is avoidable in the hot path.
const TEAM_FRAME_CONTEXTS=new WeakMap();
function healthyTeamFrame(canvas){
 if(!canvas)return false;
 try{
  const ctx=TEAM_FRAME_CONTEXTS.get(canvas)||canvas.getContext('2d');
  if(!ctx||ctx.isContextLost?.())return false;
  TEAM_FRAME_CONTEXTS.set(canvas,ctx);return true;
 }catch(_){return false}
}
let teamFrameScratchContext=null;
function clearTeamFrameScratch(canvas=TEAM_FRAME_CACHE.scratch){
 if(TEAM_FRAME_CACHE.scratch!==canvas)return;
 TEAM_FRAME_CACHE.scratch=null;teamFrameScratchContext=null;
 if(typeof retireGraphicsSurface==='function')retireGraphicsSurface(canvas);
}
function readTeamFrameSource(atlas,f){
 let scratch=TEAM_FRAME_CACHE.scratch,complete=false;
 try{
 if(teamFrameScratchContext?.isContextLost?.()){
  clearTeamFrameScratch(scratch);scratch=null;
 }
 scratch=scratch||(TEAM_FRAME_CACHE.scratch=document.createElement('canvas'));
 // Assigning the same size destroys canvas contents/state too; resize only
 // when necessary, otherwise clear old alpha before reading the next crop.
 const resized=scratch.width!==f.w||scratch.height!==f.h;
 if(scratch.width!==f.w)scratch.width=f.w;if(scratch.height!==f.h)scratch.height=f.h;
 const read=teamFrameScratchContext||(teamFrameScratchContext=scratch.getContext('2d',{willReadFrequently:true}));
 if(!read||read.isContextLost?.())return null;
 if(!resized)read.clearRect(0,0,f.w,f.h);
 traceAtlasDraw(read,atlas.img,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
 GRAPHICS_TRACE.frame.readbackPixels+=f.w*f.h;
 const pixels=read.getImageData(0,0,f.w,f.h);
 if(read.isContextLost?.())return null;
 complete=true;
 return {img:atlas.img,x:f.x,y:f.y,w:f.w,h:f.h,pixels};
 }finally{if(!complete)clearTeamFrameScratch(scratch)}
}
function paintedTeamFrame(atlas,team,f,kind,sourceProvider,allowTransient=false){
 if(!atlas.meta.painted||atlas.meta.neutral)return {img:atlas.img,f};
 // All integer-coordinate painted frames use a small cached crop, not a full
 // multi-megapixel team-tinted sheet. Fractional external packs keep fallback.
 if(![f.x,f.y,f.w,f.h].every(Number.isInteger))return {img:paintedTeamImage(atlas,team),f};
 const category=typeof kind==='string'&&kind.startsWith('bld_')?'building':'troop',group=TEAM_FRAME_GROUPS[category];
 const color=teamColor(team),key=teamFrameCacheKey(atlas,team,f,category,color),cache=TEAM_FRAME_CACHE.entries;
 let canvas=cache.get(key),overflow=false,prepared=false,accounted=false;
 if(canvas&&!healthyTeamFrame(canvas)){removeTeamFrameEntry(key,canvas,group);canvas=null}
 if(canvas){
  if(forgetTeamFramePrediction(key,canvas,group)){TEAM_FRAME_CACHE.predictionClaims++;GRAPHICS_TRACE.frame.predictClaims++}
  group.entries.delete(key);group.entries.set(key,canvas);TEAM_FRAME_CACHE.hits++;group.hits++;
 }
 else try{
  overflow=allowTransient&&typeof unitTintOverflow==='function'&&unitTintOverflow();
  if(overflow)GRAPHICS_TRACE.frame.tintCapHits++;
  const held=overflow&&unitTintPixels(key);
  if(held){
   const image=writeUnitTintOverflow(held,f,team);
   if(image)return {img:image,f:{...f,x:0,y:0},transient:true};
   throw unitTintFailure();
  }
  const shared=typeof sourceProvider==='function'?sourceProvider(atlas,f):null;
  let source=shared;
  const reusable=source&&source.img===atlas.img&&source.x===f.x&&source.y===f.y&&source.w===f.w&&source.h===f.h&&
   source.original?.length===f.w*f.h*4&&source.pixels?.data?.length===source.original.length&&typeof source.pixels.data.set==='function';
  if(!reusable)source=readTeamFrameSource(atlas,f);
  if(!source)throw paintedTintFailure();
  const pixels=source.pixels;
  // Reset the working ImageData from immutable blue-source bytes before every
  // team. putImageData snapshots it; later palettes cannot contaminate a tint.
  if(reusable)pixels.data.set(source.original);
  tintPaintedPixels(pixels.data,color);
  if(overflow){
   const image=writeUnitTintOverflow(pixels,f,team);
   if(image){
    if(!reusable)rememberUnitTintPixels(key,pixels);
    return {img:image,f:{...f,x:0,y:0},transient:true};
   }
   throw unitTintFailure();
  }
  canvas=document.createElement('canvas');canvas.width=f.w;canvas.height=f.h;
  const ctx=canvas.getContext('2d');if(!ctx||ctx.isContextLost?.())throw paintedTintFailure();
  ctx.putImageData(pixels,0,0);if(ctx.isContextLost?.())throw paintedTintFailure();
  TEAM_FRAME_CONTEXTS.set(canvas,ctx);
  canvas.paintedAtlas=true;canvas.paintedTeam=team;
  canvas.paintedSourceFrame={x:f.x,y:f.y,w:f.w,h:f.h};TEAM_FRAME_CACHE.creations++;group.creations++;GRAPHICS_TRACE.frame.tints++;
  const count=f.w*f.h;
  canvas.addEventListener?.('contextlost',()=>removeTeamFrameEntry(key,canvas,group));
  const limit=Math.min(group.limit,Math.max(0,TEAM_FRAME_CACHE.limit-(TEAM_FRAME_CACHE.pixels-group.pixels)));
  if(count<=limit){cache.set(key,canvas);group.entries.set(key,canvas);TEAM_FRAME_CACHE.pixels+=count;group.pixels+=count;accounted=true;
   while(group.pixels>limit){
    // Reclaim unclaimed hints first; demanded frames retain their normal LRU.
    const oldest=group.predicted.size?group.predicted.keys().next().value:group.entries.keys().next().value;
    removeTeamFrameEntry(oldest,group.entries.get(oldest),group,true);
   }
  }
  prepared=true;
 }catch(error){if(overflow)throw unitTintFailure(error);throw paintedTintFailure(error)}finally{
  if(canvas&&!prepared){
   const globalOwner=cache.get(key)===canvas,poolOwner=group.entries.get(key)===canvas;
   if(globalOwner)cache.delete(key);if(poolOwner)group.entries.delete(key);
   forgetTeamFramePrediction(key,canvas,group);
   if(accounted){const count=canvas.width*canvas.height;if(globalOwner)TEAM_FRAME_CACHE.pixels-=count;if(poolOwner)group.pixels-=count}
   if(typeof retireGraphicsSurface==='function')retireGraphicsSurface(canvas);
  }
 }
 // Keep each animation's own foot anchor, including shared crops with distinct anchors.
 return {img:canvas,f:{...f,x:0,y:0}};
}
function regAtlas(id,img,meta){ASSET.atl[id]={img,meta,ok:true};ASSET.n=Object.values(ASSET.atl).filter(a=>a.ok).length;rebuildAssetAnimationIndex()}
function validAtlasMeta(meta,w,h){if(!meta||!meta.anims||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return false;let count=0;for(const key of Object.keys(meta.anims)){const an=meta.anims[key];if(!an||typeof an!=='object'||(an.referenceHeight!==undefined&&(!Number.isFinite(an.referenceHeight)||an.referenceHeight<=0))||(an.referenceWidth!==undefined&&(!Number.isFinite(an.referenceWidth)||an.referenceWidth<=0)))return false;const lists=Array.isArray(an.dirs)?an.dirs:[an.frames];if(!lists.length)return false;for(const list of lists){if(!Array.isArray(list)||!list.length)return false;for(const f of list){if(!f||![f.x,f.y,f.w,f.h,f.ax,f.ay].every(Number.isFinite)||f.x<0||f.y<0||f.w<=0||f.h<=0||f.x+f.w>w+.01||f.y+f.h>h+.01)return false;count++}}}return count>0}
function loadAtlas(id,src,meta){const a={img:null,meta,ok:false};ASSET.atl[id]=a;rebuildAssetAnimationIndex();try{const im=new Image();im.onload=()=>{if(!validAtlasMeta(meta,im.naturalWidth||im.width,im.naturalHeight||im.height)){a.ok=false;a.img=null}else{a.img=im;a.ok=true}ASSET.n=Object.values(ASSET.atl).filter(q=>q.ok).length;rebuildAssetAnimationIndex()};im.onerror=()=>{a.ok=false;a.img=null;ASSET.n=Object.values(ASSET.atl).filter(q=>q.ok).length;rebuildAssetAnimationIndex()};im.src=src}catch(e){a.ok=false;a.img=null;ASSET.n=Object.values(ASSET.atl).filter(q=>q.ok).length;rebuildAssetAnimationIndex()}}
// Returned f samples img; sourceFrame retains canonical atlas coordinates.
// Both share the original dimensions and foot anchor.
function assetFrame(k,t,st,dir,time,heading,phase,predict=false,allowTransient=false){const key=(SHIP_ART_FALLBACK[k]||k)+'/'+STN[st]+'/'+t;for(const a of ASSET_ANIM_INDEX.get(key)||[]){if(!a.ok||!a.img||!a.meta?.anims)continue;const an=a.meta.anims[key];if(!an)continue;const index=an.dirs&&Number.isFinite(heading)?((Math.round(heading/(Math.PI*2)*an.dirs.length)%an.dirs.length)+an.dirs.length)%an.dirs.length:an.dirs?((dir%an.dirs.length)+an.dirs.length)%an.dirs.length:0;const dl=an.dirs?an.dirs[index]:an.frames;if(!dl||!dl.length)continue;const frameIndex=Number.isFinite(phase)?Math.min(dl.length-1,Math.floor(Math.max(0,Math.min(1,phase))*dl.length)):Math.floor(Math.max(0,Number.isFinite(time)?time:0)/(an.dur>0?an.dur:.12))%dl.length;const f=dl[frameIndex];if(f&&f.w>0&&f.h>0){
 ASSET.hits++;
 // One descriptor per visible soldier, without spreading two temporary objects.
 const painted=paintedTeamFrame(a,t,f,k,undefined,allowTransient);
 if(predict&&dl.length>1&&typeof queueTintPrediction==='function')queueTintPrediction(a,t,dl[(frameIndex+1)%dl.length],k,key,an);
 const frame={img:painted.img,f:painted.f,sourceFrame:f,sc:an.scale>0?an.scale:1,
  painted:!!a.meta.painted,animated:dl.length>1,referenceHeight:an.referenceHeight||f.h};
 if(an.referenceWidth)frame.referenceWidth=an.referenceWidth;
 if(painted.transient)frame.transient=true;
 return frame;
}}ASSET.miss++;return null}
function loadAssetPack(p){try{if(!p||!Array.isArray(p.atlases))return;if(p.terrain?.src&&typeof loadPaintedTerrain==='function')loadPaintedTerrain(p.terrain.src);for(const a of p.atlases)if(a&&a.id&&a.src&&a.meta)loadAtlas(a.id,a.src,a.meta)}catch(e){}}

