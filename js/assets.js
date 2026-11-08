/* ===== ASSET MANAGER: optional sprite atlases; the procedural art above is always the fallback =====
Pack format (embed as a script element with id ck-assets and type application/json, or set window.CK_ASSETS before this script runs):
{atlases:[{id,src:'data:image/png;base64,...' or url,meta:{anims:{'<unit>/<state>/<team>':{dur:seconds,scale:1,dirs:[[frame,...] x8]  (or frames:[...] for one direction)}}}}]}
frame={x,y,w,h,ax,ay} (rectangle in the atlas; ax,ay = feet anchor inside the frame). states: idle, walk, attack, work. team: 0 blue, 1 red.
A missing, failed or malformed atlas simply leaves the unit on its procedural sprite. */
const ASSET={atl:{},n:0,hits:0,miss:0},STN=['idle','walk','attack','work'];
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
}

// Readiness only: warming must never create tints or sample image pixels.
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

// Recolour only the painted blue cloth/heraldry, retaining its light and texture.
// The neutral stone, skin, steel, timber and terrain pixels remain unchanged.
function paintedTeamImage(atlas,team){
 if(!atlas.meta.painted||atlas.meta.neutral)return atlas.img;
 atlas.teams=atlas.teams||{};const prior=atlas.teams[team];if(prior){if(!prior.getContext?.('2d')?.isContextLost?.())return prior;delete atlas.teams[team]}
 try{
  const canvas=document.createElement('canvas');canvas.width=atlas.img.naturalWidth||atlas.img.width||atlas.meta.width;canvas.height=atlas.img.naturalHeight||atlas.img.height||atlas.meta.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx||ctx.isContextLost?.())return atlas.img;ctx.drawImage(atlas.img,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),p=pixels.data,n=parseInt(teamColor(team).slice(1),16),target=[n>>16&255,n>>8&255,n&255];
  for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];if(p[i+3]>8&&b-r>26&&b-g>8&&b>r*1.25){const light=Math.max(.25,Math.min(1.35,(r*.21+g*.52+b*.27)/110));for(let k=0;k<3;k++)p[i+k]=Math.min(255,target[k]*light)}}
  ctx.putImageData(pixels,0,0);if(ctx.isContextLost?.())return atlas.img;canvas.paintedAtlas=true;canvas.paintedTeam=team;atlas.teams[team]=canvas;
  canvas.addEventListener?.('contextlost',()=>{if(atlas.teams?.[team]===canvas)delete atlas.teams[team]});
 }catch(_){atlas.teams[team]=atlas.img}
 return atlas.teams[team];
}
// Retain only requested, native-resolution tinted troop frames instead of full atlas
// copies per kingdom. The budget bounds retained canvas pixels, not browser/GPU
// resident memory; evicted frames can remain alive until callers/GC release them.
const TEAM_FRAME_CACHE={entries:new Map(),ids:new WeakMap(),next:1,pixels:0,limit:32*1024*1024,hits:0,creations:0,evictions:0};
function paintedTeamFrame(atlas,team,f){
 if(!atlas.meta.painted||atlas.meta.neutral)return {img:atlas.img,f};
 // Buildings/base fallbacks retain their established full-sheet sampling.
 // Animated troops already used a native crop in troopFrameTexture.
 if(!atlas.meta.motion)return {img:paintedTeamImage(atlas,team),f};
 // External fractional-frame packs keep their former sampling behavior.
 if(![f.x,f.y,f.w,f.h].every(Number.isInteger))return {img:paintedTeamImage(atlas,team),f};
 let id=TEAM_FRAME_CACHE.ids.get(atlas.img);if(!id){id=TEAM_FRAME_CACHE.next++;TEAM_FRAME_CACHE.ids.set(atlas.img,id)}
 const color=teamColor(team),key=[id,team,color,f.x,f.y,f.w,f.h].join('/'),cache=TEAM_FRAME_CACHE.entries;
 let canvas=cache.get(key);
 if(canvas?.getContext('2d')?.isContextLost?.()){cache.delete(key);TEAM_FRAME_CACHE.pixels-=canvas.width*canvas.height;canvas=null}
 if(canvas){cache.delete(key);cache.set(key,canvas);TEAM_FRAME_CACHE.hits++}
 else try{
  canvas=document.createElement('canvas');canvas.width=f.w;canvas.height=f.h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx||ctx.isContextLost?.())return {img:atlas.img,f};
  ctx.drawImage(atlas.img,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
  const pixels=ctx.getImageData(0,0,f.w,f.h),p=pixels.data,n=parseInt(color.slice(1),16),target=[n>>16&255,n>>8&255,n&255];
  for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];if(p[i+3]>8&&b-r>26&&b-g>8&&b>r*1.25){const light=Math.max(.25,Math.min(1.35,(r*.21+g*.52+b*.27)/110));for(let k=0;k<3;k++)p[i+k]=Math.min(255,target[k]*light)}}
  ctx.putImageData(pixels,0,0);if(ctx.isContextLost?.())return {img:atlas.img,f};canvas.paintedAtlas=true;canvas.paintedTeam=team;
  canvas.paintedSourceFrame={x:f.x,y:f.y,w:f.w,h:f.h};TEAM_FRAME_CACHE.creations++;
  const count=f.w*f.h;
  canvas.addEventListener?.('contextlost',()=>{if(cache.get(key)===canvas){cache.delete(key);TEAM_FRAME_CACHE.pixels-=count}});
  if(count<=TEAM_FRAME_CACHE.limit){cache.set(key,canvas);TEAM_FRAME_CACHE.pixels+=count;
   while(TEAM_FRAME_CACHE.pixels>TEAM_FRAME_CACHE.limit){const oldest=cache.keys().next().value,entry=cache.get(oldest);cache.delete(oldest);TEAM_FRAME_CACHE.pixels-=entry.width*entry.height;TEAM_FRAME_CACHE.evictions++}
  }
 }catch(_){return {img:atlas.img,f}}
 // Keep each animation's own foot anchor, including shared crops with distinct anchors.
 return {img:canvas,f:{...f,x:0,y:0}};
}
function regAtlas(id,img,meta){ASSET.atl[id]={img,meta,ok:true};ASSET.n=Object.values(ASSET.atl).filter(a=>a.ok).length;rebuildAssetAnimationIndex()}
function validAtlasMeta(meta,w,h){if(!meta||!meta.anims||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return false;let count=0;for(const key of Object.keys(meta.anims)){const an=meta.anims[key];if(!an||typeof an!=='object'||(an.referenceHeight!==undefined&&(!Number.isFinite(an.referenceHeight)||an.referenceHeight<=0))||(an.referenceWidth!==undefined&&(!Number.isFinite(an.referenceWidth)||an.referenceWidth<=0)))return false;const lists=Array.isArray(an.dirs)?an.dirs:[an.frames];if(!lists.length)return false;for(const list of lists){if(!Array.isArray(list)||!list.length)return false;for(const f of list){if(!f||![f.x,f.y,f.w,f.h,f.ax,f.ay].every(Number.isFinite)||f.x<0||f.y<0||f.w<=0||f.h<=0||f.x+f.w>w+.01||f.y+f.h>h+.01)return false;count++}}}return count>0}
function loadAtlas(id,src,meta){const a={img:null,meta,ok:false};ASSET.atl[id]=a;rebuildAssetAnimationIndex();try{const im=new Image();im.onload=()=>{if(!validAtlasMeta(meta,im.naturalWidth||im.width,im.naturalHeight||im.height)){a.ok=false;a.img=null}else{a.img=im;a.ok=true}ASSET.n=Object.values(ASSET.atl).filter(q=>q.ok).length;rebuildAssetAnimationIndex()};im.onerror=()=>{a.ok=false;a.img=null;ASSET.n=Object.values(ASSET.atl).filter(q=>q.ok).length;rebuildAssetAnimationIndex()};im.src=src}catch(e){a.ok=false;a.img=null;ASSET.n=Object.values(ASSET.atl).filter(q=>q.ok).length;rebuildAssetAnimationIndex()}}
// Returned f samples img; sourceFrame retains canonical atlas coordinates.
// Both share the original dimensions and foot anchor.
function assetFrame(k,t,st,dir,time,heading,phase){const key=(SHIP_ART_FALLBACK[k]||k)+'/'+STN[st]+'/'+t;for(const a of ASSET_ANIM_INDEX.get(key)||[]){if(!a.ok||!a.img||!a.meta?.anims)continue;const an=a.meta.anims[key];if(!an)continue;const index=an.dirs&&Number.isFinite(heading)?((Math.round(heading/(Math.PI*2)*an.dirs.length)%an.dirs.length)+an.dirs.length)%an.dirs.length:an.dirs?((dir%an.dirs.length)+an.dirs.length)%an.dirs.length:0;const dl=an.dirs?an.dirs[index]:an.frames;if(!dl||!dl.length)continue;const frameIndex=Number.isFinite(phase)?Math.min(dl.length-1,Math.floor(Math.max(0,Math.min(1,phase))*dl.length)):Math.floor(Math.max(0,Number.isFinite(time)?time:0)/(an.dur>0?an.dur:.12))%dl.length;const f=dl[frameIndex];if(f&&f.w>0&&f.h>0){ASSET.hits++;return{...paintedTeamFrame(a,t,f),sourceFrame:f,sc:an.scale>0?an.scale:1,painted:!!a.meta.painted,animated:dl.length>1,referenceHeight:an.referenceHeight||f.h,...(an.referenceWidth?{referenceWidth:an.referenceWidth}:{})}}}ASSET.miss++;return null}
function loadAssetPack(p){try{if(!p||!Array.isArray(p.atlases))return;if(p.terrain?.src&&typeof loadPaintedTerrain==='function')loadPaintedTerrain(p.terrain.src);for(const a of p.atlases)if(a&&a.id&&a.src&&a.meta)loadAtlas(a.id,a.src,a.meta)}catch(e){}}

