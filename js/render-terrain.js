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
