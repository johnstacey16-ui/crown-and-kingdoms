/* ===== ASSET MANAGER: optional sprite atlases; the procedural art above is always the fallback =====
Pack format (embed as a script element with id ck-assets and type application/json, or set window.CK_ASSETS before this script runs):
{atlases:[{id,src:'data:image/png;base64,...' or url,meta:{anims:{'<unit>/<state>/<team>':{dur:seconds,scale:1,dirs:[[frame,...] x8]  (or frames:[...] for one direction)}}}}]}
frame={x,y,w,h,ax,ay} (rectangle in the atlas; ax,ay = feet anchor inside the frame). states: idle, walk, attack, work. team: 0 blue, 1 red.
A missing, failed or malformed atlas simply leaves the unit on its procedural sprite. */
const ASSET={atl:{},n:0,hits:0,miss:0},STN=['idle','walk','attack','work'];
// Recolour only the painted blue cloth/heraldry, retaining its light and texture.
// The neutral stone, skin, steel, timber and terrain pixels remain unchanged.
function paintedTeamImage(atlas,team){
 if(!atlas.meta.painted||atlas.meta.neutral)return atlas.img;
 atlas.teams=atlas.teams||{};if(atlas.teams[team])return atlas.teams[team];
 try{
  const canvas=document.createElement('canvas');canvas.width=atlas.img.naturalWidth||atlas.img.width||atlas.meta.width;canvas.height=atlas.img.naturalHeight||atlas.img.height||atlas.meta.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(atlas.img,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),p=pixels.data,n=parseInt(teamColor(team).slice(1),16),target=[n>>16&255,n>>8&255,n&255];
  for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];if(p[i+3]>8&&b-r>26&&b-g>8&&b>r*1.25){const light=Math.max(.25,Math.min(1.35,(r*.21+g*.52+b*.27)/110));for(let k=0;k<3;k++)p[i+k]=Math.min(255,target[k]*light)}}
  ctx.putImageData(pixels,0,0);canvas.paintedAtlas=true;canvas.paintedTeam=team;atlas.teams[team]=canvas;
 }catch(_){atlas.teams[team]=atlas.img}
 return atlas.teams[team];
}
function regAtlas(id,img,meta){ASSET.atl[id]={img,meta,ok:true};ASSET.n=Object.values(ASSET.atl).filter(a=>a.ok).length}
function validAtlasMeta(meta,w,h){if(!meta||!meta.anims||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return false;let count=0;for(const key of Object.keys(meta.anims)){const an=meta.anims[key];if(!an||typeof an!=='object'||(an.referenceHeight!==undefined&&(!Number.isFinite(an.referenceHeight)||an.referenceHeight<=0))||(an.referenceWidth!==undefined&&(!Number.isFinite(an.referenceWidth)||an.referenceWidth<=0)))return false;const lists=Array.isArray(an.dirs)?an.dirs:[an.frames];if(!lists.length)return false;for(const list of lists){if(!Array.isArray(list)||!list.length)return false;for(const f of list){if(!f||![f.x,f.y,f.w,f.h,f.ax,f.ay].every(Number.isFinite)||f.x<0||f.y<0||f.w<=0||f.h<=0||f.x+f.w>w+.01||f.y+f.h>h+.01)return false;count++}}}return count>0}
function loadAtlas(id,src,meta){const a={img:null,meta,ok:false};ASSET.atl[id]=a;try{const im=new Image();im.onload=()=>{if(!validAtlasMeta(meta,im.naturalWidth||im.width,im.naturalHeight||im.height)){a.ok=false;a.img=null}else{a.img=im;a.ok=true}ASSET.n=Object.values(ASSET.atl).filter(q=>q.ok).length};im.onerror=()=>{a.ok=false;a.img=null;ASSET.n=Object.values(ASSET.atl).filter(q=>q.ok).length};im.src=src}catch(e){a.ok=false;a.img=null;ASSET.n=Object.values(ASSET.atl).filter(q=>q.ok).length}}
function assetFrame(k,t,st,dir,time,heading,phase){for(const id in ASSET.atl){const a=ASSET.atl[id];if(!a.ok||!a.img||!a.meta||!a.meta.anims)continue;const an=a.meta.anims[k+'/'+STN[st]+'/'+t];if(!an)continue;const index=an.dirs&&Number.isFinite(heading)?((Math.round(heading/(Math.PI*2)*an.dirs.length)%an.dirs.length)+an.dirs.length)%an.dirs.length:an.dirs?((dir%an.dirs.length)+an.dirs.length)%an.dirs.length:0;const dl=an.dirs?an.dirs[index]:an.frames;if(!dl||!dl.length)continue;const frameIndex=Number.isFinite(phase)?Math.min(dl.length-1,Math.floor(Math.max(0,Math.min(1,phase))*dl.length)):Math.floor(Math.max(0,Number.isFinite(time)?time:0)/(an.dur>0?an.dur:.12))%dl.length;const f=dl[frameIndex];if(f&&f.w>0&&f.h>0){ASSET.hits++;return{img:paintedTeamImage(a,t),f,sc:an.scale>0?an.scale:1,painted:!!a.meta.painted,animated:dl.length>1,referenceHeight:an.referenceHeight||f.h,...(an.referenceWidth?{referenceWidth:an.referenceWidth}:{})}}}ASSET.miss++;return null}
function loadAssetPack(p){try{if(!p||!Array.isArray(p.atlases))return;if(p.terrain?.src&&typeof loadPaintedTerrain==='function')loadPaintedTerrain(p.terrain.src);for(const a of p.atlases)if(a&&a.id&&a.src&&a.meta)loadAtlas(a.id,a.src,a.meta)}catch(e){}}

