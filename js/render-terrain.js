/* Painted terrain sampling, original-art fallback and bounded blend textures.
 * Source extracted unchanged from js/render.js; presentation-only. 
 * The world viewport/chunk caches stay in js/render.js. */
function loadPaintedTerrain(src){
 try{const image=new Image();image.onload=()=>{PAINT.terrain=image;TCH.clear();SPC.clear()};image.onerror=()=>{PAINT.terrain=null};image.src=src}catch(_){PAINT.terrain=null}
}
// Solo keeps native 64px blends. The unit map oversamples its actual tile
// display size by at least 3x (up to the original 64px source), retaining more
// small textures within the same 4 MiB pixel budget instead of LRU thrashing.
const TERRAIN_BLEND=new Map();
let terrainBlendImage=null,terrainBlendPixels=0;
function clearTerrainBlend(){TERRAIN_BLEND.clear();terrainBlendPixels=0}
function terrainBlendResolution(displayPixels){
 if(!Number.isFinite(displayPixels)||displayPixels<=0)return 64;
 return Math.min(64,2**Math.ceil(Math.log2(Math.max(4,displayPixels*3))));
}
function terrainTileTexture(kind,x,y,neighbors,resolution=64){
 const image=PAINT.terrain;if(!image||!neighbors||!neighbors.some(k=>Number.isInteger(k)&&k>=0&&k!==kind))return null;
 if(terrainBlendImage!==image){clearTerrainBlend();terrainBlendImage=image}
 const side=(image.naturalWidth||image.width)/3,source=64,sample=[4,8,16,32,64].includes(resolution)?resolution:64;
 const tx=((x*source)%side+side)%side,ty=((y*source)%side+side)%side;
 const key=[kind,tx,ty,sample,...neighbors].join('/');
 let cv=TERRAIN_BLEND.get(key);
 if(cv){TERRAIN_BLEND.delete(key);TERRAIN_BLEND.set(key,cv);return cv}
 try{
  cv=document.createElement('canvas');cv.width=cv.height=sample;
  const g=cv.getContext('2d');if(!g)return null;
  const draw=(ctx,k)=>ctx.drawImage(image,(k%3)*side+tx,Math.floor(k/3)*side+ty,source,source,0,0,sample,sample);
  draw(g,kind);
  const layer=document.createElement('canvas');layer.width=layer.height=sample;
  const c=layer.getContext('2d');if(!c)return null;
  for(let edge=0;edge<4;edge++){
   const other=neighbors[edge];if(!Number.isInteger(other)||other<0||other===kind)continue;
   // A short wet edge keeps land/water ownership legible. Wider soil edges
   // soften the repeating diamonds without replacing the painted texture.
   const width=(kind===2||other===2?10:20)*sample/source;
   c.clearRect(0,0,sample,sample);c.globalCompositeOperation='source-over';draw(c,other);
   const ends=[[0,0,width,0],[sample,0,sample-width,0],[0,0,0,width],[0,sample,0,sample-width]][edge];
   const mask=c.createLinearGradient(...ends);mask.addColorStop(0,'rgba(0,0,0,.5)');mask.addColorStop(1,'rgba(0,0,0,0)');
   c.globalCompositeOperation='destination-in';c.fillStyle=mask;c.fillRect(0,0,sample,sample);
   g.drawImage(layer,0,0);
  }
  TERRAIN_BLEND.set(key,cv);terrainBlendPixels+=sample*sample;
  while(terrainBlendPixels>1024*1024||TERRAIN_BLEND.size>4096){
   const oldest=TERRAIN_BLEND.keys().next().value,old=TERRAIN_BLEND.get(oldest);
   TERRAIN_BLEND.delete(oldest);terrainBlendPixels-=old.width*old.height;
  }
  return cv;
 }catch(_){return null}
}
function terrainNeighborKinds(x,y,kindAt,width,height){
 return [x>0?kindAt(x-1,y):-1,x<width-1?kindAt(x+1,y):-1,y>0?kindAt(x,y-1):-1,y<height-1?kindAt(x,y+1):-1];
}
function paintTerrain(g,kind,x,y,px,py,w,h,isometric=false,neighbors=null,resolution=64){
 const image=PAINT.terrain;if(!image)return false;
 const side=(image.naturalWidth||image.width)/3,row=Math.floor(kind/3),col=kind%3;
 const sample=64,tx=((x*sample)%side+side)%side,ty=((y*sample)%side+side)%side;
 const tile=terrainTileTexture(kind,x,y,neighbors,resolution);
 const draw=(dw,dh)=>tile?g.drawImage(tile,0,0,tile.width,tile.height,0,0,dw,dh):g.drawImage(image,col*side+tx,row*side+ty,sample,sample,0,0,dw,dh);
 g.save();g.imageSmoothingEnabled=true;
 if(isometric){
  g.beginPath();g.moveTo(px,py-16);g.lineTo(px+32.5,py);g.lineTo(px,py+16.5);g.lineTo(px-32.5,py);g.closePath();g.clip();
  g.transform(.5,.25,-.5,.25,px,py-16);draw(65,65);
 }else{g.translate(px,py);draw(w,h)}
 g.restore();return true;
}
function paintedTerrainKind(x,y){
 const i=y*W+x;if(S.wt[i])return S.wt[i]===2?3:2;
 const coast=(x>0&&S.wt[i-1]===1)||(x<W-1&&S.wt[i+1]===1)||(y>0&&S.wt[i-W]===1)||(y<H-1&&S.wt[i+W]===1);
 return coast?3:hsh(x>>2,y>>2)<.1?1:0;
}

/* Isometric tile fallback and detail drawing shared by live terrain chunks. */
function paintTile(g,x,y,cx,cy){if(paintTerrain(g,paintedTerrainKind(x,y),x,y,cx,cy,64,32,true,terrainNeighborKinds(x,y,paintedTerrainKind,W,H)))return;const i=y*W+x,wv=S.wt[i],hv=hsh(x,y),D=(c,hw,hh)=>{g.beginPath();g.moveTo(cx,cy-hh);g.lineTo(cx+hw,cy);g.lineTo(cx,cy+hh);g.lineTo(cx-hw,cy);g.closePath();g.fillStyle=c;g.fill()};
if(wv){const sh=wv===2;D(sh?'#68b3cd':hv<.5?'#2a6aa3':'#2c70ab',33,17);if(!sh){if((x>0&&!S.wt[i-1])||(x<W-1&&!S.wt[i+1])||(y>0&&!S.wt[i-W])||(y<H-1&&!S.wt[i+W])){g.strokeStyle='rgba(235,248,255,.5)';g.lineWidth=2;g.beginPath();g.moveTo(cx,cy-15);g.lineTo(cx+30,cy);g.lineTo(cx,cy+15);g.lineTo(cx-30,cy);g.closePath();g.stroke()}}else{g.fillStyle='rgba(240,225,170,.4)';g.fillRect(cx-6+hv*10,cy-1,3,2)}}
else{const coast=(x>0&&S.wt[i-1]===1)||(x<W-1&&S.wt[i+1]===1)||(y>0&&S.wt[i-W]===1)||(y<H-1&&S.wt[i+W]===1),dirt=hsh(x>>2,y>>2)<.1,pn=hsh((x>>3)+99,(y>>3)+7),PL=PALS[S.pal|0];D(coast?PL.coast:dirt?PL.dirt[hv<.5?0:1]:(pn<.25?PL.d:pn>.8?PL.l:PL.g)[(hv*6)|0],33,17);
if(!coast&&!dirt){if(hv>.8){g.strokeStyle='#3e7a30';g.lineWidth=1;g.beginPath();g.moveTo(cx-6,cy+2);g.lineTo(cx-4,cy-3);g.moveTo(cx-3,cy+2);g.lineTo(cx-2,cy-4);g.moveTo(cx+3,cy+3);g.lineTo(cx+4,cy-2);g.stroke()}else if(hv<.03){g.fillStyle=hv<.015?'#f4e04d':'#f2f2f2';g.fillRect(cx+hv*100-1,cy-1,3,3)}}}}

function paintTileDetail(g,x,y,cx,cy){const i=y*W+x,wv=S.wt[i],h=hsh(x*17+31,y*23+7),q=hsh(x*7+83,y*13+41);if(wv){if(wv===1&&h>.57){const ox=(q-.5)*34,oy=(h-.5)*13;g.strokeStyle='rgba(190,226,245,'+(.12+q*.12)+')';g.lineWidth=.7;g.beginPath();g.moveTo(cx+ox-3,cy+oy);g.lineTo(cx+ox+3,cy+oy-1.5);g.stroke()}return}const coast=(x>0&&S.wt[i-1]===1)||(x<W-1&&S.wt[i+1]===1)||(y>0&&S.wt[i-W]===1)||(y<H-1&&S.wt[i+W]===1);if(coast)return;const ox=(q-.5)*43,oy=(h-.5)*19;if(h>.83){g.strokeStyle='rgba(32,76,28,.62)';g.lineWidth=.85;g.beginPath();g.moveTo(cx+ox-2,cy+oy+2);g.lineTo(cx+ox-1,cy+oy-2);g.moveTo(cx+ox,cy+oy+2);g.lineTo(cx+ox+2,cy+oy-1);g.stroke()}else if(h<.12&&q>.35){g.fillStyle=h<.035?'rgba(229,204,128,.8)':'rgba(110,103,91,.62)';g.beginPath();g.ellipse(cx+ox,cy+oy,1.5+q,0.8,0,0,Math.PI*2);g.fill()}else if(h>.72&&q<.22){g.fillStyle='rgba(231,190,88,.8)';g.fillRect(cx+ox,cy+oy,1.6,1.6);g.fillStyle='rgba(248,233,173,.8)';g.fillRect(cx+ox+.5,cy+oy-.5,.8,.8)}}


/* Deterministic terrain variation, team foliage colours and tile palettes. */
const hsh=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296};
const GC=['#596b3d','#53663b','#607047','#52633b','#5e6e45','#55673d'],SC={};
const shd=(c,f)=>SC[c+f]||(SC[c+f]=(()=>{const n=parseInt(c.slice(1),16);return 'rgb('+Math.min(255,(n>>16&255)*f|0)+','+Math.min(255,(n>>8&255)*f|0)+','+Math.min(255,(n&255)*f|0)+')'})());
const GCd=GC.map(c=>shd(c,.86)),GCl=GC.map(c=>shd(c,1.09));
const PALS=[{g:GC,d:GCd,l:GCl,coast:'#cdbd82',dirt:['#8d7b4c','#867449']}];
{const mk=(a,c,dk)=>({g:a,d:a.map(x=>shd(x,.9)),l:a.map(x=>shd(x,1.06)),coast:c,dirt:dk});PALS.push(mk(['#d8c48a','#d2bd80','#dcc890','#cdb676','#d6c286','#d0ba7c'],'#e6d8a8',['#b89a60','#b0925a']),mk(['#e8f0f4','#dde8ee','#f0f6f8','#d4e2ea','#e2ecf0','#d9e6ec'],'#c3d0d6',['#8e8a84','#86827c']),mk(['#7f9a62','#789358','#86a068','#718c54','#7c9660','#7a945a'],'#b8b090',['#7d7568','#766e62']))}


/* Original terrain landmarks, chunk LRU and bounded Xbox viewport cache.
 * Moved unchanged from js/render.js; fog and world draw remain separate. */
const CKS=8,TCH=new Map();let CHK=true;

/* Isometric tile painting and detail: js/render-terrain.js. */
function drawHill(o){
 const P=w2s(o.x,o.y),rx=TW*2.8,ry=TH*1.8,z=zm,px=P[0],py=P[1];
 X.save();
 // Low, warm-edged earth mound keeps the existing footprint and landmark position.
 X.globalAlpha=.94;
 X.fillStyle='rgba(25,34,24,.48)';
 X.beginPath();X.ellipse(px,py+2*z,rx*1.04,ry*1.04,0,0,Math.PI*2);X.fill();
 X.fillStyle='#59634a';X.beginPath();X.ellipse(px,py,rx,ry,0,0,Math.PI*2);X.fill();
 X.strokeStyle='#d8c995';X.lineWidth=Math.max(1,2*z);X.beginPath();X.ellipse(px,py,rx-3*z,ry-2*z,0,0,Math.PI*2);X.stroke();
 // Three overlapping rock planes add a readable light direction without extra assets.
 X.fillStyle='#414d4d';poly([[px-18*z,py-2*z],[px-8*z,py-15*z],[px+3*z,py-11*z],[px+8*z,py+2*z],[px-3*z,py+9*z]]);X.fill();
 X.fillStyle='#707b78';poly([[px-8*z,py-15*z],[px+5*z,py-19*z],[px+18*z,py-8*z],[px+8*z,py+2*z],[px+3*z,py-11*z]]);X.fill();
 X.fillStyle='#aab0a0';poly([[px-8*z,py-15*z],[px+5*z,py-19*z],[px+1*z,py-12*z],[px-5*z,py-10*z]]);X.fill();
 X.strokeStyle='rgba(224,218,185,.65)';X.lineWidth=Math.max(.7,z);X.beginPath();X.moveTo(px-17*z,py+1*z);X.lineTo(px-8*z,py-9*z);X.lineTo(px-2*z,py-5*z);X.moveTo(px+5*z,py-13*z);X.lineTo(px+13*z,py-8*z);X.stroke();
 // Landmark plinth and flag retain their original centre/height for gameplay readability.
 X.fillStyle='#7d8985';X.fillRect(px-4*z,py-24*z,8*z,21*z);
 X.fillStyle='#c8cec1';X.fillRect(px-4*z,py-24*z,2.5*z,20*z);
 X.fillStyle='#d8c995';dia(px,py-24*z,5*z,2.5*z);X.fill();
 X.strokeStyle='#463b2a';X.lineWidth=Math.max(1,2*z);X.beginPath();X.moveTo(px+4*z,py-24*z);X.lineTo(px+4*z,py-38*z);X.stroke();
 X.fillStyle='#be4b3a';poly([[px+4*z,py-38*z],[px+19*z,py-33*z+Math.sin(gt*4)*1.2*z],[px+4*z,py-28*z]]);X.fill();
 X.fillStyle='rgba(245,225,169,.7)';poly([[px+5*z,py-37*z],[px+16*z,py-33*z+Math.sin(gt*4)*1.2*z],[px+5*z,py-32*z]]);X.fill();
 X.restore();
}
function chunkOf(cx,cy){const key=cx*4096+cy;let c=TCH.get(key);if(c){TCH.delete(key);TCH.set(key,c);return c}
const X0=cx*CKS,Y0=cy*CKS,minx=(X0-Y0-CKS+1)*32-32,miny=(X0+Y0+1)*16-16,w=CKS*64,h=(2*CKS-2)*16+32,cv2=document.createElement('canvas');cv2.width=w;cv2.height=h;const g=cv2.getContext('2d');
for(let y=Y0;y<Math.min(H,Y0+CKS);y++)for(let x=X0;x<Math.min(W,X0+CKS);x++)paintTile(g,x,y,(x-y)*32-minx,(x+y+1)*16-miny),paintTileDetail(g,x,y,(x-y)*32-minx,(x+y+1)*16-miny);
c={cv:cv2,ox:minx,oy:miny,w,h};TCH.set(key,c);return c}

// Chunks behind unexplored fog never contribute visible terrain. Test the
// local exploration mask every frame before allocating/uploading a chunk:
// first-time reveals work immediately without caching stale fog visibility.
function chunkHasExploredLand(cx,cy){
 const x0=cx*CKS,y0=cy*CKS,x1=Math.min(W,x0+CKS),y1=Math.min(H,y0+CKS);
 if(!S||!S.ex)return true; // Preserve standalone chunk-painter use.
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(S.ex[y*W+x])return true;
 return false;
}

// The isometric view's axis-aligned WORLD bounding box includes terrain far
// outside the SCREEN. Cull those chunks *before* generating their canvases.
// A fixed 48-chunk LRU evicted visible chunks on wide/zoomed-out views,
// causing the expensive terrain texture painter to rerun every single frame.
// Retain all visible chunks (even above 320 on unusually large screens),
// plus a capped panning margin, then trim the least-recently-used canvases.
function drawChunks(x0,x1,y0,y1){
 let visible=0;const chunks=[];
 for(let cy=y0>>3;cy<=y1>>3;cy++)for(let cx=x0>>3;cx<=x1>>3;cx++){
  const x=cx*CKS,y=cy*CKS,ox=(x-y-CKS+1)*32-32,oy=(x+y+1)*16-16;
  const sx=ox*zm-cam.x,sy=oy*zm-cam.y,sw=CKS*64*zm,sh=((2*CKS-2)*16+32)*zm;
  if(sx>=CW||sy>=CH||sx+sw<=0||sy+sh<=0)continue;
  if(!chunkHasExploredLand(cx,cy))continue;
  const c=chunkOf(cx,cy);
  chunks.push(c);
  visible++;
 }
 const budget=Math.max(64,visible,Math.min(320,visible+16));
 while(TCH.size>budget)TCH.delete(TCH.keys().next().value);
 drawTerrainViewport(chunks);
}
// Flatten static terrain at the current backing resolution. Reusing one opaque
// surface avoids resampling overlapping transparent chunk textures each frame.
// Fog, waves and all world objects are still painted live by drawWorld().
const TERRAIN_VIEW={canvas:null,key:null,pending:null,chunks:[]};
function drawTerrainViewport(chunks){
 const dpr=typeof DPR==='number'?DPR:1,w=Math.round(CW*dpr),h=Math.round(CH*dpr);
 const direct=()=>{for(const c of chunks)X.drawImage(c.cv,c.ox*zm-cam.x,c.oy*zm-cam.y,c.w*zm,c.h*zm)};
 // At most 16 MiB of additional pixels. Oversized views keep the original path.
 if(w<1||h<1||w*h>4000000){
  if(TERRAIN_VIEW.canvas){TERRAIN_VIEW.canvas.width=TERRAIN_VIEW.canvas.height=1}
  TERRAIN_VIEW.key=null;TERRAIN_VIEW.pending=null;TERRAIN_VIEW.chunks=[];direct();return;
 }
 const key=[cam.x,cam.y,zm,CW,CH,w,h,dpr].join('|');
 // While panning/zooming use the original path. Flatten only after the view
 // remains stable for a second frame, avoiding an extra full-screen pass per pan.
 if(TERRAIN_VIEW.pending!==key){TERRAIN_VIEW.pending=key;TERRAIN_VIEW.key=null;direct();return}
 try{
  const cv=TERRAIN_VIEW.canvas||(TERRAIN_VIEW.canvas=document.createElement('canvas'));
  const g=cv.getContext('2d',{alpha:false});
  if(!g){direct();return}
  if(TERRAIN_VIEW.key!==key||chunks.length!==TERRAIN_VIEW.chunks.length||chunks.some((c,i)=>c!==TERRAIN_VIEW.chunks[i])){
   TERRAIN_VIEW.key=null;
   if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;
   g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#000';g.fillRect(0,0,CW,CH);
   g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
   for(const c of chunks)g.drawImage(c.cv,c.ox*zm-cam.x,c.oy*zm-cam.y,c.w*zm,c.h*zm);
   TERRAIN_VIEW.chunks=chunks.slice();TERRAIN_VIEW.key=key;
  }
  // Copy physical pixels 1:1, including fractional-DPR edge rounding.
  X.save();try{X.setTransform(1,0,0,1,0,0);X.imageSmoothingEnabled=false;X.drawImage(cv,0,0)}finally{X.restore()}
 }catch(_){TERRAIN_VIEW.key=null;direct()}
}
