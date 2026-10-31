/* ===== PAINTED RASTER GRAPHICS =====
 * Original textured medieval WebP sprites replace the discarded pixel icons.
 * Sprite bounds and foot anchors live in assets/atlas-manifest.json.
 * Artwork, terrain and visual motion are presentation-only.
 */
const PAINT={terrain:null,facing:new WeakMap(),motion:new WeakMap(),resourceAmounts:new WeakMap(),buildingAges:new WeakMap(),buildingConstruction:new WeakMap(),buildingDamage:new WeakMap()};
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
// Presentation pose shared by solo and team-relative multiplayer views.
// Facing history stays in a weak cache, never on simulation entities.
// Game time freezes stride/work cycles on pause; cooldown drives attack phase.
function unitVisualPose(u,time){
 const now=Number.isFinite(time)?time:0;
 const point=Array.isArray(u.p)&&u.p.length?u.p[0]:null;
 const routed=!!(point&&point.length===2&&point.every(Number.isFinite));
 // A queued path alone does not mean a villager is moving. Stop walking poses
 // once displacement ceases; presentation history never enters saved game state.
 const prev=PAINT.motion.get(u);
 const moved=!!(prev&&Math.hypot(u.x-prev.x,u.y-prev.y)>.01);
 const moveTime=routed&&(moved||!prev?.routed||now<prev.time)?now:(prev?.moveTime??-Infinity);
 PAINT.motion.set(u,{x:u.x,y:u.y,time:now,routed,moveTime});
 const target=['a','g','b','rep','v'].includes(u.o)&&u.tg&&Number.isFinite(u.tg.x)&&Number.isFinite(u.tg.y)?u.tg:null;
 const work=!!(target&&((((u.o==='g'&&!u.ret)||u.o==='b')&&d2(u.x,u.y,target)<=1.1)||(u.o==='rep'&&d2(u.x,u.y,target)<=1.5)));
 const casting=u.k==='mon'&&u.o==='v'&&Number.isFinite(u.cv)&&u.cv>0;
 const attacking=u.o==='a'&&u.cd>0;
 const walking=routed&&!work&&!attacking&&now-moveTime<=.25;
 const tx=walking?point[0]:target?target.x+(target.s||0)/2:null,ty=walking?point[1]:target?target.y+(target.s||0)/2:null;
 const heading=tx!==null?Math.atan2(ty-u.y,tx-u.x):PAINT.facing.get(u)??(Number.isFinite(u.dr)?u.dr*Math.PI/4:0);
 if(tx!==null)PAINT.facing.set(u,heading);
 const state=walking?1:casting?3:attacking?2:work?3:0;
 const duration=typeof U!=='undefined'&&U[u.k]?.cd>0?U[u.k].cd:1;
 let offset=0;for(const c of String(u.netId||u.id||u.k||''))offset=(offset*31+c.charCodeAt(0))%997;
 return {state,heading,time:now+offset/997,
  phase:state===2?Math.max(0,Math.min(1,1-u.cd/duration)):undefined};
}
// Base portraits retain light fallback movement/recoil when motion is missing.
// This includes Janissaries/Genoese Crossbowmen if their new sheets fail to load.
// Fallback transforms are distinct from individually painted motion frames.
const PAINT_SECONDARY=Object.freeze({
  cart:'siege',fish:'ship',gal:'ship',trn:'ship',cog:'ship',
  ram:'siege',mamel:'mounted',jan:'ranged',chuko:'ranged',
  eled:'elephant',hcan:'ranged',bomb:'siege',mgd:'mounted',
  cata:'mounted',ele:'elephant',treb:'siege',camel:'mounted',
  king:'foot',mang:'siege',scor:'siege',conq:'mounted',
  genoa:'ranged',boyar:'mounted',tarkan:'mounted',
  plumed:'ranged',gbeto:'foot',wagon:'siege',huszar:'mounted'
});
function paintedSecondaryPose(kind,state,time,phase){
  const family=PAINT_SECONDARY[kind];
  if(!family||(state!==1&&state!==2)||!Number.isFinite(time))return null;
  const speed={foot:10,ranged:9,mounted:12,elephant:5,siege:8,ship:4}[family];
  const wave=Math.sin(time*speed),lift=Math.abs(wave),shift=Math.cos(time*speed);
  if(state===1){
    // Different weight and tempo for feet, horses, elephants, wheels and hulls.
    if(family==='mounted')return {dx:wave*.55,dy:lift*1.45,turn:wave*.021,sx:1+shift*.01,sy:1-shift*.013};
    if(family==='elephant')return {dx:wave*.35,dy:lift*.9,turn:wave*.011,sx:1+shift*.005,sy:1-shift*.008};
    if(family==='ship')return {dx:wave*.35,dy:lift*.35,turn:wave*.027,sx:1,sy:1};
    if(family==='siege')return {dx:wave*.4,dy:lift*.45,turn:wave*.009,sx:1,sy:1};
    if(family==='ranged')return {dx:wave*.3,dy:lift*.82,turn:wave*.026,sx:1+shift*.008,sy:1-shift*.012};
    return {dx:wave*.34,dy:lift*1.05,turn:wave*.035,sx:1+shift*.01,sy:1-shift*.018};
  }
  // The production cooldown phase supplies the impact/recovery timing, including
  // on paused frames. Do not mutate any unit or advance an independent clock.
  const progress=Number.isFinite(phase)?Math.max(0,Math.min(1,phase)):((time*1.6)%1+1)%1;
  const hit=Math.max(0,1-progress*3.5),recover=Math.sin(progress*Math.PI);
  if(family==='ship')return {dx:-hit*1.5,dy:recover*.15,turn:-hit*.028,sx:1,sy:1};
  if(family==='siege')return {dx:-hit*2,dy:hit*.55,turn:-hit*.025,sx:1-hit*.018,sy:1};
  if(family==='mounted')return {dx:hit*1.1,dy:recover*.6,turn:hit*.035,sx:1,sy:1-hit*.012};
  if(family==='elephant')return {dx:hit*.8,dy:recover*.4,turn:hit*.022,sx:1,sy:1};
  if(family==='ranged')return {dx:-hit*1.15,dy:hit*.4,turn:-hit*.043,sx:1,sy:1};
  return {dx:hit*1.1,dy:recover*.65,turn:hit*.075,sx:1,sy:1-hit*.018};
}
// Painted unit sprites are animated as usual, but their atlas textures can be
// >1500px square. Series S Edge spends significant time sampling/reuploading the
// large team-coloured sheet for each soldier. Crop each original-resolution
// motion frame once and reuse the much smaller Canvas2D image every draw.
// No downscaling or palette changes; always keep the original atlas fallback.
// A total-pixel budget protects Edge from an unbounded frame-texture cache.
const TROOP_TEXTURE_PIXEL_LIMIT=6*1024*1024,TROOP_TEXTURE_ENTRY_LIMIT=160;
const TROOP_TEXTURE_IDS=new WeakMap(),TROOP_TEXTURE_LRU=new Map();
let troopTextureSeq=0,troopTexturePixels=0;
function troopFrameTexture(art){
 const img=art?.img,f=art?.f;
 if(!img||!f||typeof img!=='object')return null;
 const {x,y,w,h}=f;
 // The bounded palette cache already supplies an exact native crop.
 if(img.paintedSourceFrame&&x===0&&y===0&&img.width===w&&img.height===h)return img;
 if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0||w*h>TROOP_TEXTURE_PIXEL_LIMIT)return null;
 let id=TROOP_TEXTURE_IDS.get(img);if(!id){id=++troopTextureSeq;TROOP_TEXTURE_IDS.set(img,id)}
 const key=id+'/'+x+'/'+y+'/'+w+'/'+h;
 let cv=TROOP_TEXTURE_LRU.get(key);
 if(cv){TROOP_TEXTURE_LRU.delete(key);TROOP_TEXTURE_LRU.set(key,cv);return cv}
 try{
  cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const ctx=cv.getContext('2d');if(!ctx)return null;
  ctx.drawImage(img,x,y,w,h,0,0,w,h);
  TROOP_TEXTURE_LRU.set(key,cv);troopTexturePixels+=w*h;
  while(troopTexturePixels>TROOP_TEXTURE_PIXEL_LIMIT||TROOP_TEXTURE_LRU.size>TROOP_TEXTURE_ENTRY_LIMIT){
   const oldKey=TROOP_TEXTURE_LRU.keys().next().value;
   const old=TROOP_TEXTURE_LRU.get(oldKey);
   TROOP_TEXTURE_LRU.delete(oldKey);troopTexturePixels-=old.width*old.height;
  }
  return cv;
 }catch(_){return null}
}
function drawPaintedTroop(g,art,x,y,scale,state,time,mirror=false,kind='',phase){
  const f=art.f,walk=state===1,attack=state===2,work=state===3;
  const motion=art.animated?null:paintedSecondaryPose(kind,state,time,phase);
  // Art width/height, feet anchor and image/team palette remain unchanged.
  // Scale the offset with visible body height rather than with the source sheet.
  const unitScale=Math.max(.25,Math.min(2.5,(art.referenceHeight||f.h)*scale/(PAINT_SECONDARY[kind]==='mounted'?60:46)));
  const bob=art.animated?0:motion?motion.dy*unitScale:walk?Math.abs(Math.sin(time*10))*1.1:work?Math.sin(time*6)*.5:Math.sin(time*2)*.2;
  g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.translate(x+(motion?motion.dx*unitScale:0),y-bob);
  if(mirror)g.scale(-1,1);
  if(motion){g.rotate(motion.turn);g.scale(motion.sx,motion.sy)}
  else if(walk&&!art.animated)g.rotate(Math.sin(time*10)*.018);
  else if(attack&&!art.animated)g.rotate(Math.sin(time*12)*.055);
  const frame=troopFrameTexture(art);
  if(frame)g.drawImage(frame,-f.ax*scale,-f.ay*scale,f.w*scale,f.h*scale);
  else g.drawImage(art.img,f.x,f.y,f.w,f.h,-f.ax*scale,-f.ay*scale,f.w*scale,f.h*scale);
  g.restore();
}

// Copied visual descriptions only: no entity/target references, RNG or combat
// state are needed to distinguish the current catalogue's projectile families.
const PROJECTILE_STYLES=Object.freeze({xbow:'bolt',genoa:'bolt',chuko:'bolt',scor:'heavy-bolt',skirm:'javelin',jan:'bullet',hcan:'bullet',conq:'bullet',bomb:'cannon',mang:'stone',treb:'stone',axe:'axe',gbeto:'blade'});
function projectileVisualStyle(kind){const style=typeof kind==='string'?PROJECTILE_STYLES[kind]:null;return typeof style==='string'?style:'arrow'}
function projectileVisualHeading(p){
 if(!p||![p.x,p.y,p.tx,p.ty].every(Number.isFinite))return null;
 return Math.atan2(p.ty-p.y,p.tx-p.x);
}
function drawProjectileArtwork(g,x,y,heading,style,time,scale=1){
 if(!Number.isFinite(x)||!Number.isFinite(y))return false;
 const t=Number.isFinite(time)?time:0,z=Number.isFinite(scale)&&scale>0?scale:1;
 g.save();
 try{
  g.translate(x,y);g.rotate(Number.isFinite(heading)?heading:0);g.scale(z,z);g.lineCap='round';g.lineJoin='round';
  const line=(x1,y1,x2,y2,color,width)=>{g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()};
  if(style==='cannon'){
   line(-11,0,-4,0,'rgba(174,165,146,.45)',1.5);g.fillStyle='#25282a';g.strokeStyle='#aaa28e';g.lineWidth=.6;g.beginPath();g.arc(0,0,3,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#8d969a';g.beginPath();g.arc(.6,-.8,.9,0,Math.PI*2);g.fill();
  }else if(style==='stone'){
   g.rotate(t*2);g.fillStyle='#777570';g.strokeStyle='#302d27';g.lineWidth=.8;g.beginPath();g.moveTo(-3,-2);g.lineTo(0,-3.7);g.lineTo(3,-2);g.lineTo(3.5,1);g.lineTo(1,3);g.lineTo(-3,2);g.closePath();g.fill();g.stroke();line(-1.8,-1.6,.7,-2.2,'#c0b8a5',1.2);
  }else if(style==='bullet'){
   line(-7,0,0,0,'rgba(230,215,171,.7)',1);line(-1,0,1.5,0,'#fff0cb',1.5);
  }else if(style==='axe'){
   g.rotate(t*13);line(-5,0,4,0,'#3b2a1b',2.4);line(-5,-.3,4,-.3,'#b78d57',1.1);g.fillStyle='#a6b2b4';g.strokeStyle='#303536';g.lineWidth=.6;g.beginPath();g.moveTo(1,-1);g.lineTo(2,-5);g.quadraticCurveTo(7,-5,6,2);g.lineTo(2,1);g.closePath();g.fill();g.stroke();line(5,-3,5.6,.5,'#edf0df',.8);
  }else if(style==='blade'){
   g.rotate(t*15);g.fillStyle='#b2bec1';g.strokeStyle='#30373a';g.lineWidth=.6;g.beginPath();g.moveTo(-4,1);g.quadraticCurveTo(1,-5,6,-2);g.quadraticCurveTo(2,-1,0,2);g.closePath();g.fill();g.stroke();line(-5,1,-2,0,'#b08a4a',1.7);
  }else{
   const spear=style==='javelin',heavy=style==='heavy-bolt',bolt=style==='bolt',length=spear?19:heavy?16:bolt?10:13,tail=-length*.55,tip=length*.45;
   line(tail,0,tip-2,0,'#33291f',heavy?2.4:1.8);line(tail,-.2,tip-2,-.2,spear?'#d0b17c':'#b99863',heavy?1.2:.9);
   g.fillStyle=heavy?'#c6ccca':'#d9ded1';g.beginPath();g.moveTo(tip,0);g.lineTo(tip-(spear?4:3),heavy?-2:-1.3);g.lineTo(tip-(spear?4:3),heavy?2:1.3);g.closePath();g.fill();
   if(!spear){line(tail,0,tail-1.3,-1.7,'#e8dcc0',.9);line(tail+1.8,0,tail+.4,1.6,'#a89777',.8)}
  }
 }finally{g.restore()}
 return true;
}

// Fog stays beneath world objects, but hundreds of per-tile canvas fills were
// expensive in large explored maps. Batch each visibility class into one path.
// Both paths use the original diamond dimensions, colours and alpha.
function paintFogLayer(points,halfWidth,halfHeight,colour){
 if(!points.length)return;
 X.beginPath();
 for(let i=0;i<points.length;i+=2){
  const x=points[i],y=points[i+1];
  X.moveTo(x,y-halfHeight);X.lineTo(x+halfWidth,y);
  X.lineTo(x,y+halfHeight);X.lineTo(x-halfWidth,y);X.closePath();
 }
 X.fillStyle=colour;X.fill();
}

function drawWorld(){const selectedUnits=new Set(S.sel);X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';const cs4=[[0,0],[CW,0],[0,CH],[CW,CH]].map(p=>s2w(p[0],p[1])),xs=cs4.map(p=>p[0]),ys=cs4.map(p=>p[1]),x0=Math.max(0,Math.floor(Math.min(...xs))-1),x1=Math.min(W-1,Math.ceil(Math.max(...xs))+1),y0=Math.max(0,Math.floor(Math.min(...ys))-1),y1=Math.min(H-1,Math.ceil(Math.max(...ys))+1),hw=TW/2,hh2=TH/2,L=[],fogHidden=[],fogExplored=[],timed=!!perfHud,startChunk=timed?performance.now():0;if(CHK&&perfLayerMode!==2)drawChunks(x0,x1,y0,y1);
if(timed)perfChunksMs=performance.now()-startChunk;
const startTiles=timed?performance.now():0;
for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x,cx=(x-y)*hw-cam.x,cy=(x+y+1)*hh2-cam.y;if(cx<-hw||cx>CW+hw||cy<-hh2-50||cy>CH+hh2+50)continue;const wv=S.wt[i],hv=CHK?0:hsh(x,y);
if(perfLayerMode!==2){if(CHK){if(S.ex[i]&&wv===1&&((x+y)&1)&&Math.sin(gt*1.6+x*.8+y*.6)>.55){X.strokeStyle='rgba(255,255,255,.28)';X.beginPath();X.moveTo(cx-8*zm,cy);X.lineTo(cx+6*zm,cy);X.stroke()}}else if(wv){const sh=wv===2;X.fillStyle=sh?'#68b3cd':hv<.5?'#2a6aa3':'#2c70ab';dia(cx,cy,hw+1,hh2+1);X.fill();
if(!sh){if(Math.sin(gt*1.6+x*.8+y*.6)>.55){X.strokeStyle='rgba(255,255,255,.28)';X.beginPath();X.moveTo(cx-8,cy);X.lineTo(cx+6,cy);X.stroke()}
if((x>0&&!S.wt[i-1])||(x<W-1&&!S.wt[i+1])||(y>0&&!S.wt[i-W])||(y<H-1&&!S.wt[i+W])){X.strokeStyle='rgba(235,248,255,.5)';X.lineWidth=2;dia(cx,cy,hw-2,hh2-1);X.stroke();X.lineWidth=1}}else{X.fillStyle='rgba(240,225,170,.4)';X.fillRect(cx-6+hv*10,cy-1,3,2)}}
else{const coast=(x>0&&S.wt[i-1]===1)||(x<W-1&&S.wt[i+1]===1)||(y>0&&S.wt[i-W]===1)||(y<H-1&&S.wt[i+W]===1),dirt=hsh(x>>2,y>>2)<.1,pn=hsh((x>>3)+99,(y>>3)+7);X.fillStyle=coast?'#cdbd82':dirt?(hv<.5?'#8d7b4c':'#867449'):(pn<.25?GCd:pn>.8?GCl:GC)[(hv*6)|0];dia(cx,cy,hw+1,hh2+1);X.fill();
if(!coast&&!dirt){if(hv>.8){X.strokeStyle='#3e7a30';X.lineWidth=1;X.beginPath();X.moveTo(cx-6,cy+2);X.lineTo(cx-4,cy-3);X.moveTo(cx-3,cy+2);X.lineTo(cx-2,cy-4);X.moveTo(cx+3,cy+3);X.lineTo(cx+4,cy-2);X.stroke()}else if(hv<.03){X.fillStyle=hv<.015?'#f4e04d':'#f2f2f2';X.fillRect(cx+hv*100-1,cy-1,3,3)}const tuft=hsh(x*13+7,y*19+3);if(tuft>.91){const tx=cx+(hsh(x+31,y+17)-.5)*14,ty=cy+(hsh(x+11,y+41)-.5)*6;X.strokeStyle=tuft>.97?'#577d35':'#426d2d';X.lineWidth=1;X.beginPath();X.moveTo(tx-3,ty+2);X.lineTo(tx-4,ty-2);X.moveTo(tx,ty+2);X.lineTo(tx,ty-4);X.moveTo(tx+3,ty+2);X.lineTo(tx+5,ty-1);X.stroke();if(tuft>.985){X.fillStyle='#d8c57b';X.beginPath();X.arc(tx+1,ty-4,1.2,0,7);X.fill()}}}else if(dirt&&!coast&&hv>.45){const peb=hsh(x*5+81,y*7+29);if(peb>.87){X.fillStyle=peb>.96?'rgba(205,190,151,.7)':'rgba(63,51,35,.45)';X.beginPath();X.ellipse(cx+(hv-.5)*12,cy+(peb-.9)*12,1.8,1,0,0,7);X.fill()}}}
}
if(!S.ex[i]){if(perfLayerMode!==2)fogHidden.push(cx,cy)}else{if(!S.vs[i]&&perfLayerMode!==2)fogExplored.push(cx,cy);const n=S.nd[i];if(n&&n.amt>0)L.push([x+y+1,0,n])}}
if(perfLayerMode!==2){
 paintFogLayer(fogHidden,hw+1.5,hh2+1.5,'#000');
 paintFogLayer(fogExplored,hw+1,hh2+1,'rgba(0,0,0,.42)');
}
if(timed)perfTilesMs=performance.now()-startTiles;
if(perfLayerMode===1){perfNodeMs=perfBuildingMs=perfUnitMs=perfOtherWorldMs=0;perfNodeCount=perfBuildingCount=perfUnitCount=0;if(timed){perfObjectsMs=0;perfEffectsMs=0}return}
const startObjects=timed?performance.now():0;
for(const q of rub){const age=gt-q.t;if(age>40||!Number.isFinite(q.x)||!Number.isFinite(q.y)||q.x+q.s<x0-2||q.x>x1+2||q.y+q.s<y0-2||q.y>y1+2||!S.ex[q.y*W+q.x])continue;const N=w2s(q.x,q.y),E=w2s(q.x+q.s,q.y),Sx=w2s(q.x+q.s,q.y+q.s),Wv=w2s(q.x,q.y+q.s);X.globalAlpha=Math.min(1,(40-age)/10);X.fillStyle='#5b4a38';poly([N,E,Sx,Wv]);X.fill();X.fillStyle='#8a8378';for(let k=0;k<q.s*3;k++){const a=hsh(q.x*7+k,q.y*5)*q.s,b=hsh(q.y*3+k,q.x*11)*q.s,P=w2s(q.x+a,q.y+b);X.fillRect(P[0]-3,P[1]-3,6,4)}if(age<4){X.fillStyle='rgba(120,110,100,'+(.5-age/8)+')';const C=w2s(q.x+q.s/2,q.y+q.s/2);X.beginPath();X.arc(C[0],C[1]-12-age*8,16+age*4,0,7);X.fill()}X.globalAlpha=1}
for(const c of corp){const age=gt-c.t;if(age>10||!Number.isFinite(c.x)||!Number.isFinite(c.y)||c.x<x0-3||c.x>x1+3||c.y<y0-3||c.y>y1+3)continue;const P=w2s(c.x,c.y),sz=USZ(c.k),body=ASSET.n?assetFrame(c.k,c.tm,0,0,gt):null,sp=body?null:spr(c.k+'|'+c.tm+'|0|0',sz[0],sz[1],g=>paintUnit(g,c.k,teamColor(c.tm),0,0));X.save();X.translate(P[0],P[1]);X.globalAlpha=Math.min(1,(10-age)/4);
if(c.sh){const k2=Math.min(1,age/1.2);X.translate(0,k2*18*zm);X.scale(1,1-k2*.5);X.globalAlpha*=1-k2*.6}else{const a=Math.min(1,age/.55);if(c.fd<0)X.scale(-1,1);X.rotate(a*1.45);X.translate(0,a*2*zm)}
if(body){const f=body.f,sc=body.sc*zm;X.drawImage(body.img,f.x,f.y,f.w,f.h,-f.ax*sc,-f.ay*sc,f.w*sc,f.h*sc)}else X.drawImage(sp,-sz[0]/2*zm,-(sz[1]-8)*zm,sz[0]*zm,sz[1]*zm);X.restore()}X.globalAlpha=1
for(const b of S.bs){if(!Number.isFinite(b.x)||!Number.isFinite(b.y)||b.x+b.s<x0-5||b.x>x1+5||b.y+b.s<y0-5||b.y>y1+5)continue;if(b.t!==0&&!S.ex[b.y*W+b.x])continue;const P=w2s(b.x+b.s/2,b.y+b.s/2);if(P[0]<-160||P[0]>CW+160||P[1]<-180||P[1]>CH+180)continue;L.push([b.x+b.y+b.s,1,b])}
for(const u of S.us){if(u.ld||u.hp<=0||!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.x<x0-2||u.x>x1+2||u.y<y0-2||u.y>y1+2||!vis(u))continue;const P=w2s(u.x,u.y),margin=120*zm;if(P[0]<-margin||P[0]>CW+margin||P[1]<-margin||P[1]>CH+margin)continue;L.push([u.x+u.y,2,u])}
for(const q of S.rel){const p=q.c||q;if(!q.m&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=x0-2&&p.x<=x1+2&&p.y>=y0-2&&p.y<=y1+2&&(q.c?vis(q.c):S.ex[(p.y|0)*W+(p.x|0)]))L.push([p.x+p.y,3,q]);}
if(window.CK_NET&&window.CK_NET.isRunning())for(const marker of window.CK_NET.getRenderEntries())if(Number.isFinite(marker.x)&&Number.isFinite(marker.y)&&marker.x>=x0-2&&marker.x<=x1+2&&marker.y>=y0-2&&marker.y<=y1+2)L.push([marker.x+marker.y,4,marker]);
if(vm===5&&S.ex[(H/2|0)*W+(W/2|0)])L.push([W-.5,5,{x:W/2,y:H/2}]);L.sort((a,b)=>a[0]-b[0]);perfNodeMs=perfBuildingMs=perfUnitMs=perfOtherWorldMs=0;perfNodeCount=perfBuildingCount=perfUnitCount=0;
for(const it of L){
 const k=it[1],o=it[2],ts=timed?performance.now():0;
 if(k===0)drawNode(o);
 else if(k===1)drawBld(o);
 else if(k===2)drawUnit(o,selectedUnits);
 else if(k===3)drawRelic(o);
 else if(k===4&&window.CK_NET)window.CK_NET.drawMarker(o);
 else if(k===5)drawHill(o);
 if(timed){
  const ms=performance.now()-ts;
  if(k===0){perfNodeMs+=ms;perfNodeCount++}
  else if(k===1){perfBuildingMs+=ms;perfBuildingCount++}
  else if(k===2){perfUnitMs+=ms;perfUnitCount++}
  else perfOtherWorldMs+=ms;
 }
}
if(timed)perfObjectsMs=performance.now()-startObjects;
const startEffects=timed?performance.now():0;
if(S.flare&&S.t-S.flare.t<3){const P=w2s(S.flare.x,S.flare.y);X.strokeStyle='#fff';X.lineWidth=3;X.beginPath();X.ellipse(P[0],P[1],(20+((S.t*30)%24))*zm,(10+((S.t*15)%12))*zm,0,0,7);X.stroke();X.lineWidth=1}
for(const b of S.sel)if(b.rally){const P=w2s(b.rally.x,b.rally.y);X.fillStyle='#ffd24a';X.fillRect(P[0],P[1]-18,3,18);poly([[P[0]+3,P[1]-18],[P[0]+15,P[1]-14],[P[0]+3,P[1]-9]]);X.fill()}
drawP();X.lineWidth=2;for(const p of S.pj){if(!p||p.dead||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<x0-2||p.x>x1+2||p.y<y0-2||p.y>y1+2||p.x<0||p.y<0||p.x>=W||p.y>=H||!S.vs[(p.y|0)*W+(p.x|0)])continue;const P=w2s(p.x,p.y),heading=projectileVisualHeading(p)??0,a=Math.atan2((Math.cos(heading)+Math.sin(heading))*TH,(Math.cos(heading)-Math.sin(heading))*TW);drawProjectileArtwork(X,P[0],P[1]-10*zm,a,projectileVisualStyle(p.a?.k),S.t,zm)}
for(const f of fx){if(!Number.isFinite(f.x)||!Number.isFinite(f.y)||f.x<x0-2||f.x>x1+2||f.y<y0-2||f.y>y1+2)continue;const P=w2s(f.x,f.y);if(f.k==='h'){X.strokeStyle='#ff6a4a';X.beginPath();for(let a=0;a<6;a++){X.moveTo(P[0],P[1]-8);X.lineTo(P[0]+Math.cos(a*1.05)*9,P[1]-8+Math.sin(a*1.05)*9)}X.stroke()}else{const r=20*(1.5-f.l*2);X.strokeStyle='#fff';X.beginPath();X.ellipse(P[0],P[1],r,r/2,0,0,7);X.stroke()}}X.lineWidth=1;
if(place&&place.x!==undefined){const k=place.k,f={x:place.x,y:place.y,s:B[k].s,k,t:0,done:true,hp:1,mh:1,pr:1,q:[]};drawBld(f,1);X.fillStyle=place.ok?'rgba(80,255,120,.5)':'rgba(255,70,70,.5)';poly([w2s(f.x,f.y),w2s(f.x+f.s,f.y),w2s(f.x+f.s,f.y+f.s),w2s(f.x,f.y+f.s)]);X.fill()}if(timed)perfEffectsMs=performance.now()-startEffects;}

function drawUnit(u,selectedUnits){const k=u.k,d=U[k],T=S.tech[u.t]||{},P=w2s(u.x,u.y),sx=P[0]+((gt-(u.hit||-9))<.15?Math.sin(gt*90)*1.5*zm:0),sy=P[1],pose=unitVisualPose(u,S.t),heading=pose.heading,mirror=Math.cos(heading)-Math.sin(heading)<0;
const st=pose.state,fr=st===1?((gt*8+u.x*3+u.y*2)|0)&3:st===2?(u.cd<.2?1:0):st===3?((gt*5)|0)&1:0,sz=USZ(k),z=zm,af=ASSET.n?assetFrame(k,u.t,st,0,pose.time,heading,pose.phase):null,
c=af?null:spr(k+'|'+u.t+'|'+st+'|'+fr,sz[0],sz[1],g=>paintUnit(g,k,teamColor(u.t),st,fr));
if(st===1&&gq>0&&Math.random()<.04)emit('dust',u.x,u.y,1,{s:.5,vz:.4,l:.55,c:'#c9b080',r:2});
X.fillStyle='rgba(0,0,0,.3)';X.beginPath();X.ellipse(sx,sy+z,(d.r+3)*z,(d.r+3)*z/2,0,0,7);X.fill();if((selectedUnits?selectedUnits.has(u):S.sel.includes(u))){X.strokeStyle='#8cff3c';X.lineWidth=2.5;X.beginPath();X.ellipse(sx,sy+z,(d.r+10)*z,(d.r+10)*z/2,0,0,7);X.stroke();X.lineWidth=1}
/* Validated motion frames take priority; generate procedural art only if every atlas misses. */if(af?.painted){drawPaintedTroop(X,af,sx,sy,af.sc*z,st,pose.time,mirror,k,pose.phase)}else if(af){const f=af.f,sc=af.sc,yb=sy-(d.sh?Math.sin(gt*2+u.x)*1.5*z:0);X.drawImage(af.img,f.x,f.y,f.w,f.h,sx-f.ax*sc*z,yb-f.ay*sc*z,f.w*sc*z,f.h*sc*z)}else blit(c,sx,sy-(d.sh?Math.sin(gt*2+u.x)*1.5*z:0),sz[0],sz[1],mirror);
/* At strategic zoom, preserve team readability with a tiny outlined ground marker. */
if(z<.8){const my=sy+z+1;X.fillStyle='#17130f';X.beginPath();X.moveTo(sx,my-3);X.lineTo(sx+3,my);X.lineTo(sx,my+3);X.lineTo(sx-3,my);X.closePath();X.fill();X.fillStyle=teamColor(u.t);X.beginPath();X.moveTo(sx,my-2);X.lineTo(sx+2,my);X.lineTo(sx,my+2);X.lineTo(sx-2,my);X.closePath();X.fill()}
/* Small equipment upgrades make researched elite ranks legible in the actual battlefield, not only in menus. */
if(!af?.painted){
 const T=S.tech[u.t]||{},metal='#d8c49a',gold='#f0c35e',edge='#3b2a17';
 const rank=k==='mil'?(T.champ?'champ':T.twohand?'twohand':T.longs?'long':T.man?'man':''):k==='spear'?(T.halb?'halb':T.pike?'pike':''):k==='xbow'&&T.arb?'arb':k==='skirm'&&T.elsk?'elsk':k==='scout'&&T.lcav?'lcav':k==='knight'&&T.cavl?'cavl':'';
 if(rank){
  X.save();X.translate(sx,sy);X.scale(z,z);X.lineCap='round';X.lineJoin='round';
  if(rank==='man'||rank==='long'||rank==='twohand'||rank==='champ'){
   const y=rank==='champ'?-28:rank==='twohand'?-27:rank==='long'?-25:-24;
   X.fillStyle=rank==='champ'?'#e6d5a3':rank==='twohand'?'#b9c4ce':rank==='long'?'#9da7b2':'#7d8792';X.strokeStyle=edge;X.lineWidth=1;
   X.beginPath();X.moveTo(-4.8,y-2);X.lineTo(-2.7,y-4);X.lineTo(2.7,y-4);X.lineTo(4.8,y-2);X.lineTo(4,y+3);X.lineTo(0,y+5);X.lineTo(-4,y+3);X.closePath();X.fill();X.stroke();
   X.strokeStyle=(rank==='long'||rank==='twohand'||rank==='champ')?gold:metal;X.lineWidth=rank==='champ'?1.8:1.35;X.beginPath();X.moveTo(-2.6,y-2);X.lineTo(2.6,y-2);X.moveTo(-2.3,y+1);X.lineTo(2.3,y+1);X.stroke();
   if(rank==='long'||rank==='twohand'||rank==='champ'){const tip=rank==='champ'?-42:rank==='twohand'?-39:-36;X.strokeStyle=rank==='champ'?'#f6d36c':gold;X.lineWidth=rank==='champ'?2.1:rank==='twohand'?1.8:1.5;X.beginPath();X.moveTo(5,-29);X.lineTo(9,tip);X.stroke();X.fillStyle=gold;X.beginPath();X.moveTo(9,tip);X.lineTo(7.6,tip+3.5);X.lineTo(10.4,tip+2);X.closePath();X.fill()}if(rank==='champ'){X.strokeStyle='#f6d36c';X.lineWidth=1.4;X.beginPath();X.moveTo(-4.5,y-5);X.lineTo(0,y-10);X.lineTo(4.5,y-5);X.stroke()}
  }else if(rank==='pike'||rank==='halb'){
   X.strokeStyle='#ba8d4a';X.lineWidth=1.5;X.beginPath();X.moveTo(6,-23);X.lineTo(7,rank==='halb'?-52:-48);X.stroke();
   X.fillStyle=rank==='halb'?gold:metal;X.strokeStyle=edge;X.lineWidth=.65;X.beginPath();X.moveTo(7,rank==='halb'?-59:-52);X.lineTo(rank==='halb'?2.8:4.8,rank==='halb'?-53:-47);X.lineTo(7,rank==='halb'?-50:-45);X.lineTo(rank==='halb'?11.2:9.2,rank==='halb'?-53:-47);X.closePath();X.fill();X.stroke();
   if(rank==='halb'){X.beginPath();X.moveTo(7,-54);X.lineTo(1.5,-56);X.lineTo(2.5,-51);X.lineTo(7,-52);X.closePath();X.fill();X.stroke();X.strokeStyle=gold;X.lineWidth=1;X.beginPath();X.moveTo(4,-30);X.lineTo(8,-30);X.stroke()}
   X.strokeStyle=gold;X.lineWidth=1.25;X.beginPath();X.moveTo(-4,-22);X.lineTo(0,-20);X.lineTo(4,-22);X.stroke()
  }else if(rank==='arb'){
   X.strokeStyle=metal;X.lineWidth=2;X.beginPath();X.moveTo(-7,-25);X.lineTo(7,-25);X.stroke();
   X.strokeStyle=gold;X.lineWidth=1.25;X.beginPath();X.moveTo(-7,-29);X.quadraticCurveTo(-3,-25,-7,-21);X.moveTo(7,-29);X.quadraticCurveTo(3,-25,7,-21);X.stroke();
   X.strokeStyle=edge;X.lineWidth=.8;X.beginPath();X.moveTo(0,-27);X.lineTo(0,-23);X.stroke()
  }else if(rank==='elsk'){
   X.fillStyle=gold;X.strokeStyle=edge;X.lineWidth=.65;for(const x of[-4.5,4.5]){X.beginPath();X.arc(x,-27,1.5,0,Math.PI*2);X.fill();X.stroke()}
   X.strokeStyle=metal;X.lineWidth=1.2;X.beginPath();X.moveTo(-3.5,-21);X.lineTo(3.5,-21);X.stroke()
  }else if(rank==='lcav'||rank==='cavl'){
   const riderY=-39;
   X.fillStyle=rank==='cavl'?gold:metal;X.strokeStyle=edge;X.lineWidth=.8;
   X.beginPath();X.moveTo(-3.8,riderY+1);X.lineTo(-3,riderY-2);X.lineTo(0,riderY-4);X.lineTo(3,riderY-2);X.lineTo(3.8,riderY+1);X.closePath();X.fill();X.stroke();
   X.strokeStyle=rank==='cavl'?gold:metal;X.lineWidth=rank==='cavl'?2.1:1.3;X.beginPath();X.moveTo(-9,-15);X.lineTo(9,-15);X.stroke();
   if(rank==='cavl'){X.strokeStyle=gold;X.lineWidth=1.6;X.beginPath();X.moveTo(-6,-18);X.lineTo(-3,-20);X.lineTo(3,-20);X.lineTo(6,-18);X.stroke()}
  }
  X.restore()
 }
 /* Blacksmith armour upgrades receive a small battlefield-visible cue. */
 {
  const T=S.tech[u.t]||{},inf=!!(T.armI&&INFARM.has(k)),arch=!!(T.armR&&ARCHARM.has(k)),cav=!!(T.armC&&CAVARM.has(k));
  if(inf||arch||cav){
   X.save();X.translate(sx,sy);X.scale(z,z);X.lineJoin='round';X.lineWidth=.75;
   if(inf){
    X.fillStyle='rgba(183,196,207,.88)';X.strokeStyle='#382d22';
    X.beginPath();X.moveTo(-5,-22);X.lineTo(-3,-25);X.lineTo(3,-25);X.lineTo(5,-22);X.lineTo(4,-15);X.lineTo(0,-13);X.lineTo(-4,-15);X.closePath();X.fill();X.stroke();
    X.strokeStyle='#f0c35e';X.lineWidth=.8;X.beginPath();X.moveTo(-3,-20);X.lineTo(3,-20);X.moveTo(-3,-17);X.lineTo(3,-17);X.stroke();
   }
   if(arch){
    X.fillStyle='rgba(176,190,202,.86)';X.strokeStyle='#382d22';
    for(const side of[-1,1]){X.beginPath();X.moveTo(side*2,-23);X.lineTo(side*6,-22);X.lineTo(side*7,-17);X.lineTo(side*3,-15);X.closePath();X.fill();X.stroke()}
    X.strokeStyle='#f0c35e';X.lineWidth=.8;X.beginPath();X.moveTo(-5,-17);X.lineTo(5,-17);X.stroke();
   }
  if(cav){
   /* Metallic flank plate and gold seam make researched barding visible at normal zoom. */
   X.fillStyle='rgba(198,207,216,.86)';X.strokeStyle='#382d22';X.lineWidth=.85;
   X.beginPath();X.moveTo(-11,-17);X.quadraticCurveTo(-6,-21,0,-19);X.quadraticCurveTo(7,-19,11,-16);X.lineTo(9,-10);X.quadraticCurveTo(0,-7,-9,-10);X.closePath();X.fill();X.stroke();
   X.strokeStyle='#f0c35e';X.lineWidth=.9;X.beginPath();X.moveTo(-7,-14);X.lineTo(-2,-12);X.lineTo(4,-12);X.lineTo(8,-14);X.stroke();
  }

   X.restore()
  }
 }
 if(u.sh&&T.navalHull){
  X.save();X.translate(sx,sy);X.scale(z,z);X.strokeStyle='#f0c35e';X.lineWidth=1.15;X.beginPath();X.moveTo(-9,-7);X.lineTo(-4,-5.5);X.lineTo(4,-5.5);X.lineTo(9,-7);X.stroke();X.fillStyle='#d8c49a';for(const x of[-6,0,6]){X.beginPath();X.arc(x,-7,0.75,0,Math.PI*2);X.fill()}X.restore()
 }
 if(T.siegeup&&['ram','mang','scor','treb','bomb'].includes(k)){
  X.save();X.translate(sx,sy);X.scale(z,z);X.strokeStyle='#f0c35e';X.lineWidth=1.4;X.strokeRect(-8,-15,16,4);X.fillStyle='#d8c49a';X.fillRect(-6,-15,2,2);X.fillRect(4,-15,2,2);X.restore()
 }
}
if(u.car>0&&u.ct){X.fillStyle={f:'#e0554f',w:'#9a6b3a',g:'#f2c14e',s:'#b0b8bf'}[u.ct];X.fillRect(sx-4*z,sy-(sz[1]-16)*z*.55,8*z,6*z)}
const mh=mhp(u);if(u.hp<mh)bar(sx-13*z,sy-(sz[1]-6)*z*.9,26*z,u.hp/mh,'#6e6')}

function drawRelic(q){const point=q.c||q,P=w2s(point.x,point.y),sx=P[0],y=P[1]-(q.c?24:6),g=.5+.5*Math.sin(gt*3);X.fillStyle='rgba(255,226,102,'+(.15+.15*g)+')';X.beginPath();X.arc(sx,y,13+g*3,0,7);X.fill();if(drawPaintedRelic(X,sx,y+9*zm,(q.c?20:28)*zm))return;X.fillStyle='#ffe066';X.strokeStyle='#a87b12';poly([[sx,y-9],[sx+7,y],[sx,y+9],[sx-7,y]]);X.fill();X.stroke()}
const CKS=8,TCH=new Map();let CHK=true;

function paintTile(g,x,y,cx,cy){if(paintTerrain(g,paintedTerrainKind(x,y),x,y,cx,cy,64,32,true,terrainNeighborKinds(x,y,paintedTerrainKind,W,H)))return;const i=y*W+x,wv=S.wt[i],hv=hsh(x,y),D=(c,hw,hh)=>{g.beginPath();g.moveTo(cx,cy-hh);g.lineTo(cx+hw,cy);g.lineTo(cx,cy+hh);g.lineTo(cx-hw,cy);g.closePath();g.fillStyle=c;g.fill()};
if(wv){const sh=wv===2;D(sh?'#68b3cd':hv<.5?'#2a6aa3':'#2c70ab',33,17);if(!sh){if((x>0&&!S.wt[i-1])||(x<W-1&&!S.wt[i+1])||(y>0&&!S.wt[i-W])||(y<H-1&&!S.wt[i+W])){g.strokeStyle='rgba(235,248,255,.5)';g.lineWidth=2;g.beginPath();g.moveTo(cx,cy-15);g.lineTo(cx+30,cy);g.lineTo(cx,cy+15);g.lineTo(cx-30,cy);g.closePath();g.stroke()}}else{g.fillStyle='rgba(240,225,170,.4)';g.fillRect(cx-6+hv*10,cy-1,3,2)}}
else{const coast=(x>0&&S.wt[i-1]===1)||(x<W-1&&S.wt[i+1]===1)||(y>0&&S.wt[i-W]===1)||(y<H-1&&S.wt[i+W]===1),dirt=hsh(x>>2,y>>2)<.1,pn=hsh((x>>3)+99,(y>>3)+7),PL=PALS[S.pal|0];D(coast?PL.coast:dirt?PL.dirt[hv<.5?0:1]:(pn<.25?PL.d:pn>.8?PL.l:PL.g)[(hv*6)|0],33,17);
if(!coast&&!dirt){if(hv>.8){g.strokeStyle='#3e7a30';g.lineWidth=1;g.beginPath();g.moveTo(cx-6,cy+2);g.lineTo(cx-4,cy-3);g.moveTo(cx-3,cy+2);g.lineTo(cx-2,cy-4);g.moveTo(cx+3,cy+3);g.lineTo(cx+4,cy-2);g.stroke()}else if(hv<.03){g.fillStyle=hv<.015?'#f4e04d':'#f2f2f2';g.fillRect(cx+hv*100-1,cy-1,3,3)}}}}

function paintTileDetail(g,x,y,cx,cy){const i=y*W+x,wv=S.wt[i],h=hsh(x*17+31,y*23+7),q=hsh(x*7+83,y*13+41);if(wv){if(wv===1&&h>.57){const ox=(q-.5)*34,oy=(h-.5)*13;g.strokeStyle='rgba(190,226,245,'+(.12+q*.12)+')';g.lineWidth=.7;g.beginPath();g.moveTo(cx+ox-3,cy+oy);g.lineTo(cx+ox+3,cy+oy-1.5);g.stroke()}return}const coast=(x>0&&S.wt[i-1]===1)||(x<W-1&&S.wt[i+1]===1)||(y>0&&S.wt[i-W]===1)||(y<H-1&&S.wt[i+W]===1);if(coast)return;const ox=(q-.5)*43,oy=(h-.5)*19;if(h>.83){g.strokeStyle='rgba(32,76,28,.62)';g.lineWidth=.85;g.beginPath();g.moveTo(cx+ox-2,cy+oy+2);g.lineTo(cx+ox-1,cy+oy-2);g.moveTo(cx+ox,cy+oy+2);g.lineTo(cx+ox+2,cy+oy-1);g.stroke()}else if(h<.12&&q>.35){g.fillStyle=h<.035?'rgba(229,204,128,.8)':'rgba(110,103,91,.62)';g.beginPath();g.ellipse(cx+ox,cy+oy,1.5+q,0.8,0,0,Math.PI*2);g.fill()}else if(h>.72&&q<.22){g.fillStyle='rgba(231,190,88,.8)';g.fillRect(cx+ox,cy+oy,1.6,1.6);g.fillStyle='rgba(248,233,173,.8)';g.fillRect(cx+ox+.5,cy+oy-.5,.8,.8)}}

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
const PMAX=[100,260,520],PT=[];

/* Draw the particles whose lifecycle is updated by engine.js. */
function drawP(){for(const p of PT){const P=w2s(p.x,p.y),a=1-p.t/p.l;X.globalAlpha=a*(p.k==='smk'||p.k==='puff'||p.k==='dust'?.55:.95);X.fillStyle=p.c;X.beginPath();X.arc(P[0],P[1]-Math.max(0,p.z)*zm*14,(p.r+(p.k==='smk'||p.k==='puff'||p.k==='dust'?p.t*6:0))*zm,0,7);X.fill()}X.globalAlpha=1}

/* Building, resource-node and unit sprite definitions/drawing helpers. */
const BG={tc:{h:44,w:'#a39a85',p:30,fl:1},house:{h:20,w:'#cdb88c',p:16},lumber:{h:14,w:'#8b6b3d',f:1},mine:{h:14,w:'#7d7d85',f:1},mill:{h:26,w:'#d2c49f',p:20},bar:{h:30,w:'#8e8a82',p:18,fl:1},rng:{h:26,w:'#a07848',p:20,fl:1},stable:{h:26,w:'#8c6a45',p:22},smith:{h:26,w:'#6f6a66',p:16},market:{h:24,w:'#c7a15a',p:16,fl:1},tower:{h:58,w:'#a8a39a',f:1,cr:1,fl:1},castle:{h:62,w:'#9a968f',f:1,cr:1,fl:1},palisade:{h:22,w:'#956539',f:1},wall:{h:24,w:'#a29d94',f:1,cr:1},monastery:{h:34,w:'#dcd3bd',p:26},dock:{h:6,w:'#8b6a3a',f:1},gate:{h:20,w:'#8b6a3a',f:1,cr:1},outpost:{h:34,w:'#8b6a3a',f:1,fl:1},siege:{h:28,w:'#8a6a40',p:20,fl:1},univ:{h:34,w:'#c9c0d8',p:26},wonder:{h:72,w:'#e8dcb8',p:44,fl:1}};
const CK_TEX={stone:null,wood:null};
function loadCKTexture(kind,src){try{const im=new Image();im.onload=()=>{CK_TEX[kind]=im;try{SPC.clear()}catch(e){}};im.onerror=()=>{CK_TEX[kind]=null};im.src=src}catch(e){CK_TEX[kind]=null}}

function tex(g,A,B,h,t){const im=CK_TEX[t];if(im&&h>0){try{const pat=g.createPattern(im,'repeat');if(pat){g.save();g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(B[0],B[1]);g.lineTo(B[0],B[1]-h);g.lineTo(A[0],A[1]-h);g.closePath();g.clip();g.globalAlpha=.24;g.fillStyle=pat;g.fillRect(Math.min(A[0],B[0])-1,Math.min(A[1],B[1])-h-1,Math.abs(B[0]-A[0])+2,h+Math.abs(B[1]-A[1])+2);g.restore()}}catch(e){}}g.lineWidth=.6;const rows=Math.max(2,Math.round(h/6)),d=Math.hypot(B[0]-A[0],B[1]-A[1]);if(t==='wood'){g.strokeStyle='rgba(0,0,0,.28)';const n=Math.round(d/5);for(let i=1;i<n;i++){const p=[A[0]+(B[0]-A[0])*i/n,A[1]+(B[1]-A[1])*i/n];g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0],p[1]-h);g.stroke()}}
else{g.strokeStyle=t==='stone'?'rgba(0,0,0,.3)':'rgba(0,0,0,.1)';for(let r=1;r<rows;r++){const y=h*r/rows;g.beginPath();g.moveTo(A[0],A[1]-y);g.lineTo(B[0],B[1]-y);g.stroke()}
if(t==='stone'){const n=Math.round(d/9);for(let r=0;r<rows;r++)for(let i=1;i<n;i++){const tt=(i+(r%2)*.5)/n;if(tt>=1)continue;const p=[A[0]+(B[0]-A[0])*tt,A[1]+(B[1]-A[1])*tt];g.beginPath();g.moveTo(p[0],p[1]-h*r/rows);g.lineTo(p[0],p[1]-h*(r+1)/rows);g.stroke()}}
else{g.strokeStyle='rgba(70,40,20,.55)';g.lineWidth=1.2;for(const tt of[0,.5,1]){const p=[A[0]+(B[0]-A[0])*tt,A[1]+(B[1]-A[1])*tt];g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0],p[1]-h);g.stroke()}g.beginPath();g.moveTo(A[0],A[1]-h);g.lineTo(B[0],B[1]-h);g.moveTo(A[0],A[1]);g.lineTo(B[0],B[1]);g.stroke()}}}
function wdw(g,A,B,t,y,w,hh,lit){const p=[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t-y],d=Math.hypot(B[0]-A[0],B[1]-A[1]),dx=(B[0]-A[0])/d*w,dy=(B[1]-A[1])/d*w,Q=[p[0]+dx,p[1]+dy],T=[Q[0],Q[1]-hh],U=[p[0],p[1]-hh];pg(g,[p,Q,T,U],lit?'#e8c070':'#241a10','#3a2a1a',.8);/* Stone lintel, timber sill and a clear mullion make small windows readable at game zoom. */g.save();g.lineCap='round';g.strokeStyle=lit?'rgba(255,231,164,.8)':'rgba(15,10,7,.9)';g.lineWidth=.8;g.beginPath();g.moveTo(U[0]-.6,U[1]-.6);g.lineTo(T[0]+.6,T[1]-.6);g.moveTo(p[0]-.8,p[1]+1.2);g.lineTo(Q[0]+.8,Q[1]+1.2);g.stroke();g.strokeStyle=lit?'rgba(111,68,24,.85)':'rgba(184,143,78,.72)';g.lineWidth=.65;g.beginPath();g.moveTo((p[0]+U[0])*.5,(p[1]+U[1])*.5);g.lineTo((Q[0]+T[0])*.5,(Q[1]+T[1])*.5);g.moveTo(p[0]+dx*.5,p[1]+dy*.5-hh*.08);g.lineTo(p[0]+dx*.5,p[1]+dy*.5-hh*.92);g.stroke();g.restore()}
function rl(g,P,Q,C,n){g.strokeStyle='rgba(0,0,0,.24)';g.lineWidth=.7;for(let i=1;i<n;i++){const t=i/n;g.beginPath();g.moveTo(P[0]+(C[0]-P[0])*t,P[1]+(C[1]-P[1])*t);g.lineTo(Q[0]+(C[0]-Q[0])*t,Q[1]+(C[1]-Q[1])*t);g.stroke()}}
function trt(g,px,py,hh,w,wc,rc,cone){g.fillStyle=lin(g,px-w,0,px+w,0,shd(wc,1.1),shd(wc,.6));g.beginPath();g.moveTo(px-w,py);g.lineTo(px-w,py-hh);g.lineTo(px+w,py-hh);g.lineTo(px+w,py);g.ellipse(px,py,w,w/2,0,0,Math.PI);g.fill();g.strokeStyle='#1a1410';g.lineWidth=.8;g.stroke();g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=.6;for(let y=py-6;y>py-hh;y-=6){g.beginPath();g.moveTo(px-w,y);g.lineTo(px+w,y);g.stroke()}
if(cone){pg(g,[[px-w-2,py-hh],[px+w+2,py-hh],[px,py-hh-w*1.8]],lin(g,px-w,0,px+w,0,shd(rc,1.15),shd(rc,.65)),'#1a1410',.8)}else{g.fillStyle=shd(wc,1.15);g.beginPath();g.ellipse(px,py-hh,w+1,(w+1)/2,0,0,7);g.fill();g.stroke();g.fillStyle=shd(wc,.9);for(let i=0;i<5;i++){const a=i/5*6.28;g.fillRect(px+Math.cos(a)*w-1.5,py-hh+Math.sin(a)*w/2-4,3,4)}}}
const BP={tc:{h:42,w:'#b0a58c',tex:'stone',roof:'hip',p:28,tur:1,win:1,door:2,fl:1},house:{h:18,w:'#e0d2ae',tex:'plaster',roof:'hip',p:16,win:1,door:1,chim:1},lumber:{h:12,w:'#8b6b3d',tex:'wood',roof:'shed',p:10,logs:1},mine:{h:12,w:'#7d7d85',tex:'stone',roof:'shed',p:8,rocks:1},mill:{h:34,w:'#d8cba8',tex:'plaster',roof:'cone',p:14,blades:1,win:1,door:1},bar:{h:28,w:'#948f86',tex:'stone',roof:'gable',p:16,win:1,door:2,fl:1},rng:{h:24,w:'#a88050',tex:'wood',roof:'gable',p:16,door:1,fl:1,targets:1},stable:{h:24,w:'#94704a',tex:'wood',roof:'gable',p:18,door:2,hay:1},smith:{h:24,w:'#78726c',tex:'stone',roof:'gable',p:14,door:1,chim:2,glow:1},market:{h:14,w:'#d2ae66',tex:'wood',roof:'awn',p:10,crates:1},tower:{h:50,w:'#aaa59c',tex:'stone',roof:'flat',cren:1,win:1,fl:1},castle:{h:52,w:'#9c9890',tex:'stone',roof:'flat',cren:1,tur:2,win:1,door:2,fl:1,keep:1},palisade:{h:22,w:'#956539',tex:'wood',roof:'none',palisade:1},wall:{h:22,w:'#a8a39a',tex:'stone',roof:'flat',cren:1},gate:{h:24,w:'#a8a39a',tex:'stone',roof:'flat',cren:1,gate:1},monastery:{h:30,w:'#e2dac2',tex:'plaster',roof:'gable',p:24,win:1,door:1,cross:1},dock:{h:5,w:'#8b6a3a',tex:'wood',roof:'none',dock:1,crates:1},siege:{h:26,w:'#8e6e46',tex:'wood',roof:'gable',p:18,door:2,gear:1},univ:{h:32,w:'#cfc8d8',tex:'stone',roof:'dome',p:20,win:1,door:1},outpost:{h:30,w:'#8b6b3d',tex:'wood',roof:'hip',p:12,fl:1},wonder:{h:60,w:'#efe4c4',tex:'plaster',roof:'tier',p:46,win:1,door:2,fl:1}};
function paintBld(g,k,s,tc,f,dm){const o=BP[k]||BP.house,u=32*s,v=16*s,Z=[0,0],E=[u,-v],N=[0,-2*v],W2=[-u,-v],h=o.h*f,L='#1a1410',up=(p,d)=>[p[0],p[1]-d],mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],wc=o.w,rc=tc,ap=o.p||0;
pg(g,[[0,4],[u+6,-v+1],[0,-2*v-4],[-u-6,-v+1]],lin(g,0,-2*v,0,4,'#8a8274','#5e5648'),'#2a241c',1);
if(o.palisade){
 // Draw pointed timber stakes from the far faces to the near faces; no stone
 // battlements or house fallback. The same drawing supports building stages.
 for(const [a,b,shade] of [[N,E,.72],[W2,N,.86],[E,Z,.76],[Z,W2,1]]){
  for(let j=0;j<=6;j++){
   const t=j/6,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,tip=4*f;
   pg(g,[[x-2.8,y],[x-2.8,y-h],[x,y-h-tip],[x+2.8,y-h],[x+2.8,y]],
      shd(wc,shade*(j%2?1.08:.94)),L,.65);
   g.strokeStyle='rgba(239,204,139,.3)';g.lineWidth=.6;
   g.beginPath();g.moveTo(x-.8,y-2);g.lineTo(x-.8,y-h+2);g.stroke();
  }
  for(const height of [h*.25,h*.65]){
   g.strokeStyle='#49311c';g.lineWidth=2;
   g.beginPath();g.moveTo(a[0],a[1]-height);g.lineTo(b[0],b[1]-height);g.stroke();
  }
 }
 // A small painted band identifies ownership without changing the timber art.
 g.strokeStyle=tc;g.lineWidth=2;
 g.beginPath();g.moveTo(-3,-h*.55);g.lineTo(3,-h*.55);g.stroke();
 if(dm)dmgFx(g,u,v,h,0,dm);return;
}
if(o.dock){pg(g,[Z,E,N,W2],lin(g,0,-2*v,0,0,'#a07a44','#6e4e26'),L,1);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=.8;for(let i=1;i<8;i++){const t=i/8;g.beginPath();g.moveTo(W2[0]+(Z[0]-W2[0])*t,W2[1]+(Z[1]-W2[1])*t);g.lineTo(N[0]+(E[0]-N[0])*t,N[1]+(E[1]-N[1])*t);g.stroke()}for(const p of[Z,E,W2,N]){g.fillStyle='#4a3018';g.fillRect(p[0]-2,p[1]-9,4,10)}g.fillStyle='#8a6a3a';g.fillRect(-9,-v-6,10,8);g.strokeStyle=L;g.strokeRect(-9,-v-6,10,8);return}
if(o.tur===2)trt(g,N[0],N[1]+4,h*1.15,7,wc,tc,1);
pg(g,[W2,Z,up(Z,h),up(W2,h)],lin(g,-u,0,0,0,shd(wc,1.05),shd(wc,.85)),L,.9);pg(g,[Z,E,up(E,h),up(Z,h)],lin(g,0,0,u,0,shd(wc,.72),shd(wc,.58)),L,.9);tex(g,W2,Z,h,o.tex);tex(g,Z,E,h,o.tex);
/* Half-timber framing on wooden facades: structural posts, sill and upper rail follow the isometric wall planes. */
if(o.tex==='wood'&&h>14&&!o.dock){g.save();g.lineCap='butt';g.lineJoin='round';const beam=Math.max(1,Math.min(2.1,s*.48));g.lineWidth=beam;g.strokeStyle='rgba(39,24,13,.78)';for(const side of[[W2,Z],[Z,E]]){const[a,b]=side,at=(t,upward=0)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-upward];for(const t of[.12,.5,.88]){const p=at(t),q=at(t,h);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke()}for(const yy of[h*.2,h*.72]){const p=at(0,yy),q=at(1,yy);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.stroke()}g.strokeStyle='rgba(222,183,119,.42)';g.lineWidth=Math.max(.55,beam*.35);const p=at(.12,h*.2),q=at(.5,h*.72),r=at(.88,h*.2);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.lineTo(r[0],r[1]);g.stroke();g.strokeStyle='rgba(39,24,13,.78)';g.lineWidth=beam}g.restore()}if(o.tex==='stone'&&h>12){g.save();g.strokeStyle='rgba(225,218,197,.16)';g.lineWidth=.7;for(let row=1;row<=3;row++){const yy=h*row/4;g.beginPath();g.moveTo(W2[0],W2[1]-yy);g.lineTo(Z[0],Z[1]-yy);g.moveTo(Z[0],Z[1]-yy);g.lineTo(E[0],E[1]-yy);g.stroke()}g.strokeStyle='rgba(25,20,16,.16)';for(let row=1;row<=2;row++){const yy=h*row/3;g.beginPath();g.moveTo(W2[0]+u*.5,W2[1]-yy);g.lineTo(W2[0]+u*.5,Z[1]-yy);g.moveTo(Z[0]-u*.5,Z[1]-yy);g.lineTo(Z[0]-u*.5,E[1]-yy);g.stroke()}g.restore()}
/* Alternating corner quoins give stone keeps and civic buildings a stronger masonry silhouette. */if(o.tex==='stone'&&h>15){g.save();g.lineCap='butt';for(let row=0;row<Math.min(5,Math.max(3,Math.floor(h/12)));row++){const yy=h*(row+.5)/Math.min(5,Math.max(3,Math.floor(h/12))),ww=Math.min(5,u*.12);g.strokeStyle=row%2?'rgba(225,218,197,.42)':'rgba(35,27,20,.34)';g.lineWidth=1.15;g.beginPath();g.moveTo(W2[0]+.8,W2[1]-yy);g.lineTo(W2[0]+ww,W2[1]-yy);g.moveTo(E[0]-ww,E[1]-yy);g.lineTo(E[0]-.8,E[1]-yy);g.moveTo(W2[0]+u-ww,W2[1]-yy);g.lineTo(W2[0]+u-.8,W2[1]-yy);g.stroke()}g.restore()}const bevelA=up(W2,h),bevelB=up(Z,h),bevelC=up(E,h);
g.save();g.lineCap='round';g.lineWidth=1.15;
g.strokeStyle='rgba(255,238,196,.3)';g.beginPath();g.moveTo(W2[0]+.5,W2[1]);g.lineTo(bevelA[0]+.5,bevelA[1]);g.lineTo(bevelB[0],bevelB[1]);g.lineTo(bevelC[0]-.5,bevelC[1]);g.stroke();
g.strokeStyle='rgba(18,13,9,.28)';g.lineWidth=1.3;g.beginPath();g.moveTo(W2[0],W2[1]-1);g.lineTo(Z[0],Z[1]-1);g.lineTo(E[0],E[1]-1);g.stroke();g.restore();
if(f>=1){if(o.win){const n=s>=3?3:1;for(let i=0;i<n;i++){wdw(g,W2,Z,(i+.6)/(n+.2)*.9,h*.55,4,h*.28,1);wdw(g,Z,E,(i+.15)/(n+.2)*.9+.05,h*.55,4,h*.28,i===0&&o.glow)}}
if(o.door){const dw=5+s*1.5;g.fillStyle='#2c1c0e';const p=[(Z[0]+E[0])/2,(Z[1]+E[1])/2],sl=(E[1]-Z[1])/(E[0]-Z[0]),dh=Math.min(h*.6,14+s*3);pg(g,[[p[0]-dw,p[1]-sl*dw],[p[0]-dw,p[1]-sl*dw-dh],[p[0]+dw,p[1]+sl*dw-dh],[p[0]+dw,p[1]+sl*dw]],'#2c1c0e','#7a5a2a',1.2);if(o.door===2)wdw(g,W2,Z,.55,0,dw,dh,0);/* Door planks, iron straps and a small latch add readable timber detail. */g.save();g.lineCap='butt';g.strokeStyle='rgba(12,8,5,.72)';g.lineWidth=.75;for(const q of[-.34,.34]){const xx=p[0]+dw*q,yy=p[1]+sl*dw*q;g.beginPath();g.moveTo(xx,yy-dh+2);g.lineTo(xx,yy-2);g.stroke()}g.strokeStyle='#76604a';g.lineWidth=Math.max(.65,s*.16);for(const yy of[.28,.68]){g.beginPath();g.moveTo(p[0]-dw*.72,p[1]-dh*yy-sl*dw*.72);g.lineTo(p[0]+dw*.72,p[1]-dh*yy+sl*dw*.72);g.stroke()}g.fillStyle='#d0ad61';g.beginPath();g.arc(p[0]+dw*.43,p[1]-dh*.46+sl*dw*.43,Math.max(.65,s*.22),0,6.2832);g.fill();g.restore()}
if(o.gate){const p=[(Z[0]+E[0])/2,(Z[1]+E[1])/2];pg(g,[[p[0]-8,p[1]-4],[p[0]-8,p[1]-18],[p[0]+8,p[1]-26],[p[0]+8,p[1]-12]],'#5a3a1a','#1a1410',1)}
if(o.slit)wdw(g,W2,Z,.5,h*.5,2,8,0)}
const top=[up(N,h),up(E,h),up(Z,h),up(W2,h)];
if(f<1){g.strokeStyle='#8a6a3a';g.lineWidth=1.6;for(const p of[W2,Z,E]){g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0],p[1]-h-14);g.stroke()}g.beginPath();g.moveTo(W2[0],W2[1]-h-8);g.lineTo(Z[0],Z[1]-h-8);g.lineTo(E[0],E[1]-h-8);g.stroke();return}
const A1=top[0],B1=top[1],C1=top[2],D1=top[3];
if(o.roof==='hip'||o.roof==='cone'||o.roof==='tier'){const C=[0,-v-h-ap];if(o.roof==='cone'){const q=u*.55;pg(g,[[-q,-v-h],[q,-v-h],[0,-v-h-ap]],lin(g,-q,0,q,0,shd(rc,1.15),shd(rc,.7)),L,.9)}else{pg(g,[A1,B1,C],shd(rc,.6),L,.8);pg(g,[A1,D1,C],shd(rc,.7),L,.8);pg(g,[D1,C1,C],lin(g,-u,0,0,0,shd(rc,1.2),shd(rc,.95)),L,.9);pg(g,[C1,B1,C],lin(g,0,0,u,0,shd(rc,.82),shd(rc,.65)),L,.9);rl(g,D1,C1,C,6);rl(g,C1,B1,C,6);if(o.roof==='tier'){const C2=[0,-v-h-ap-14];pg(g,[[-u*.35,-v-h-ap+4],[u*.35,-v-h-ap+4],C2],'#e0b84a',L,.8);g.fillStyle='#f2c14e';g.beginPath();g.arc(0,C2[1]-3,3,0,7);g.fill()}}}
else if(o.roof==='gable'){const R1=up(mid(W2,N),h+ap),R2=up(mid(Z,E),h+ap);pg(g,[A1,B1,R2,R1],shd(rc,.62),L,.8);pg(g,[D1,C1,R2,R1],lin(g,-u,0,0,0,shd(rc,1.15),shd(rc,.9)),L,.9);pg(g,[C1,B1,R2],shd(wc,.62),L,.8);rl(g,D1,C1,R1,6);g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=.8;g.beginPath();g.moveTo(R1[0],R1[1]);g.lineTo(R2[0],R2[1]);g.stroke()}
else if(o.roof==='shed'){const R=(p)=>up(p,h+ap);pg(g,[D1,C1,R(Z),R(W2)],lin(g,-u,0,0,0,shd(rc,1.0),shd(rc,.8)),L,.9);pg(g,[C1,B1,R(E),R(Z)],shd(rc,.65),L,.9);rl(g,D1,C1,R(W2),5)}
else if(o.roof==='awn'){for(let i=0;i<3;i++){const cx0=-u*.5+i*u*.5,cy0=-v*(1.05-i*.18)-h;for(let j=0;j<5;j++){pg(g,[[cx0-12+j*5,cy0-ap+j*.5],[cx0-7+j*5,cy0-ap+2.5+j*.5],[cx0-7+j*5,cy0+2],[cx0-12+j*5,cy0]],j%2?'#f0e6c8':tc,L,.5)}g.strokeStyle='#5a3a1a';g.lineWidth=1.4;g.beginPath();g.moveTo(cx0-12,cy0);g.lineTo(cx0-12,cy0+h);g.moveTo(cx0+12,cy0);g.lineTo(cx0+12,cy0+h);g.stroke()}}
else if(o.roof==='dome'){pg(g,top,shd(wc,1.1),L,.8);const dg=lin(g,-u*.4,0,u*.4,0,shd('#8aa0c0',1.2),shd('#8aa0c0',.6));g.fillStyle=dg;g.beginPath();g.ellipse(0,-v-h,u*.5,ap,0,Math.PI,0);g.fill();g.strokeStyle=L;g.lineWidth=.9;g.stroke();g.fillStyle='#f2c14e';g.fillRect(-1,-v-h-ap-6,2,6)}
else{pg(g,top,lin(g,0,-2*v,0,0,shd(wc,1.2),shd(wc,1.0)),L,.8);/* Roof finishing: fine tile courses and a highlighted ridge make roof silhouettes read at normal gameplay zoom. */
if(['hip','gable','shed','tier'].includes(o.roof)&&h>10){
 g.save();g.lineCap='round';g.lineWidth=Math.max(.55,Math.min(1.1,s*.22));
 const tileStroke=o.roof==='tier'?'rgba(255,225,137,.42)':'rgba(35,21,14,.34)';
 g.strokeStyle=tileStroke;
 if(o.roof==='gable'){
   const R1=up(mid(W2,N),h+ap),R2=up(mid(Z,E),h+ap);
   for(let j=1;j<=4;j++){const t=j/5,yy=h+ap-t*(h*.78);g.beginPath();g.moveTo(W2[0]*(1-t)+R1[0]*t,W2[1]*(1-t)+R1[1]*t);g.lineTo(Z[0]*(1-t)+R2[0]*t,Z[1]*(1-t)+R2[1]*t);g.stroke();g.beginPath();g.moveTo(Z[0]*(1-t)+R2[0]*t,Z[1]*(1-t)+R2[1]*t);g.lineTo(E[0]*(1-t)+R2[0]*t,E[1]*(1-t)+R2[1]*t);g.stroke()}
 }else if(o.roof==='shed'){
   for(let j=1;j<=4;j++){const t=j/5,yy=t*(h*.7);g.beginPath();g.moveTo(W2[0]*(1-t)+N[0]*t,W2[1]*(1-t)+N[1]*t-h-ap);g.lineTo(Z[0]*(1-t)+E[0]*t,Z[1]*(1-t)+E[1]*t-h-ap+yy*.18);g.stroke()}
 }else{
   for(let j=1;j<=4;j++){const t=j/5;g.beginPath();g.moveTo(-u*(1-t),-v-h-ap*t);g.lineTo(0,-2*v-h-ap*t);g.stroke();g.beginPath();g.moveTo(0,-2*v-h-ap*t);g.lineTo(u*(1-t),-v-h-ap*t);g.stroke()}
 }
 g.strokeStyle='rgba(255,232,174,.48)';g.lineWidth=Math.max(.7,s*.3);g.beginPath();g.moveTo(-u*.72,-v-h-ap*.65);g.lineTo(0,-2*v-h-ap);g.lineTo(u*.72,-v-h-ap*.65);g.stroke();g.restore();
}
if(o.cren){g.fillStyle=shd(wc,1);for(const e of[[N,B1[0]?E:E],[E,Z],[Z,W2],[W2,N]]){const a=up(e[0],h),b=up(e[1],h),n=Math.max(2,s*2);for(let i=0;i<=n;i++){const px=a[0]+(b[0]-a[0])*i/n,py=a[1]+(b[1]-a[1])*i/n;g.fillRect(px-2,py-5,4,5);g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=.6;g.strokeRect(px-2,py-5,4,5)}}}}
if(f>=1&&o.roof!=='dome'&&o.roof!=='awn'&&o.roof!=='shed'){g.save();g.lineCap='round';g.lineWidth=.8;g.strokeStyle='rgba(255,232,176,.34)';g.beginPath();g.moveTo(A1[0],A1[1]);g.lineTo(B1[0],B1[1]);g.moveTo(D1[0],D1[1]);g.lineTo(C1[0],C1[1]);g.stroke();if(o.roof==='hip'||o.roof==='tier'){const ridge=[0,-v-h-ap];for(let i=1;i<=3;i++){const t=i/4;g.strokeStyle=i===1?'rgba(255,232,176,.24)':'rgba(30,20,12,.18)';g.beginPath();g.moveTo(A1[0]*(1-t)+ridge[0]*t,A1[1]*(1-t)+ridge[1]*t);g.lineTo(B1[0]*(1-t)+ridge[0]*t,B1[1]*(1-t)+ridge[1]*t);g.moveTo(D1[0]*(1-t)+ridge[0]*t,D1[1]*(1-t)+ridge[1]*t);g.lineTo(C1[0]*(1-t)+ridge[0]*t,C1[1]*(1-t)+ridge[1]*t);g.stroke()}}g.restore()}
if(o.keep){const kh=h*.55,kw=u*.34;pg(g,[[-kw,-v-h+4],[0,-v-h+4+kw/2],[0,-v-h-kh+kw/2],[-kw,-v-h-kh]],shd(wc,.9),L,.8);pg(g,[[0,-v-h+4+kw/2],[kw,-v-h+4],[kw,-v-h-kh],[0,-v-h-kh+kw/2]],shd(wc,.65),L,.8);pg(g,[[-kw,-v-h-kh],[0,-v-h-kh+kw/2],[kw,-v-h-kh],[0,-v-h-kh-kw/2]],shd(wc,1.2),L,.8);tex(g,[-kw,-v-h+4],[0,-v-h+4+kw/2],kh,'stone');tex(g,[0,-v-h+4+kw/2],[kw,-v-h+4],kh,'stone')}
if(o.tur){trt(g,W2[0]+3,W2[1]+5,h*1.2,6,wc,tc,1);trt(g,E[0]-3,E[1]+5,h*1.2,6,wc,tc,1)}
if(o.tur===2)trt(g,Z[0],Z[1]+2,h*1.2,7,wc,tc,1);
if(o.logs){for(let i=0;i<6;i++){g.fillStyle=i%2?'#7a5028':'#8a6030';g.beginPath();g.ellipse(-u*.75+(i%3)*6,-v*.4-(i/3|0)*4,3.5,2.6,0,0,7);g.fill();g.strokeStyle=L;g.lineWidth=.5;g.stroke()}}
if(o.rocks){for(let i=0;i<4;i++){g.fillStyle=i%2?'#8d949a':'#6f6a62';g.beginPath();g.ellipse(-u*.7+i*5,-v*.35+(i%2)*3,4,3,0,0,7);g.fill();g.stroke()}g.fillStyle='#d9b030';g.fillRect(-u*.7+8,-v*.35-2,3,2)}
if(o.hay){for(let i=0;i<3;i++){g.fillStyle='#d8c060';g.beginPath();g.ellipse(-u*.7+i*9,-v*.35,5,3.4,0,0,7);g.fill();g.strokeStyle='#8a7a30';g.lineWidth=.6;g.stroke()}}
if(o.crates){for(let i=0;i<3;i++){const cx0=-u*.7+i*9,cy0=-v*.3-(i%2)*2;pg(g,[[cx0,cy0],[cx0+6,cy0-3],[cx0+6,cy0-9],[cx0,cy0-6]],'#a07a44',L,.6);pg(g,[[cx0-5,cy0-3],[cx0,cy0],[cx0,cy0-6],[cx0-5,cy0-9]],'#c09a5a',L,.6)}}
if(o.targets){for(let i=0;i<2;i++){const cx0=-u*.8+i*12,cy0=-v*.3;g.strokeStyle='#5a3a1a';g.lineWidth=1.6;g.beginPath();g.moveTo(cx0,cy0);g.lineTo(cx0,cy0-12);g.stroke();g.fillStyle='#f0e6c8';g.beginPath();g.arc(cx0,cy0-14,5,0,7);g.fill();g.fillStyle=tc;g.beginPath();g.arc(cx0,cy0-14,3,0,7);g.fill();g.fillStyle='#f0e6c8';g.beginPath();g.arc(cx0,cy0-14,1.2,0,7);g.fill()}}
if(o.cross){g.strokeStyle='#f2c14e';g.lineWidth=2;g.beginPath();g.moveTo(0,-v-h-ap-2);g.lineTo(0,-v-h-ap-14);g.moveTo(-4,-v-h-ap-9);g.lineTo(4,-v-h-ap-9);g.stroke()}
if(o.gear){g.strokeStyle='#4a3a2a';g.lineWidth=2;g.beginPath();g.arc(-u*.55,-v*.45,6,0,7);g.stroke();for(let i=0;i<8;i++){const a=i*.785;g.beginPath();g.moveTo(-u*.55+Math.cos(a)*6,-v*.45+Math.sin(a)*6);g.lineTo(-u*.55+Math.cos(a)*9,-v*.45+Math.sin(a)*9);g.stroke()}}
if(dm)dmgFx(g,u,v,h,ap,dm)}
function dmgFx(g,u,v,h,ap,dm){const r=(a,b)=>{const x=Math.sin(a*12.9898+b*78.233)*43758.5453;return x-Math.floor(x)};g.save();g.fillStyle='rgba(20,14,10,'+(dm>1?.5:.28)+')';
for(let i=0;i<(dm>1?7:3);i++){const x=-u+r(i,1)*u*2,y=-v*.5+r(i,2)*v*.6,w=5+r(i,3)*10,hh=6+r(i,4)*h*.5;g.beginPath();g.ellipse(x,y-hh/2,w,hh,0,0,7);g.fill()}
g.strokeStyle='rgba(15,10,6,.7)';g.lineWidth=1.2;for(let i=0;i<(dm>1?6:3);i++){let x=-u*.8+r(i,5)*u*1.6,y=-v*.4-r(i,6)*h*.7;g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){x+=(r(i,7+j)-.5)*8;y+=3+r(i,11+j)*6;g.lineTo(x,y)}g.stroke()}
if(ap>0&&dm>1){g.fillStyle='rgba(10,6,4,.85)';for(let i=0;i<3;i++){const x=-u*.4+r(i,20)*u*.8,y=-v-h-ap*.4+r(i,21)*ap*.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+9,y+3);g.lineTo(x+4,y+9);g.closePath();g.fill()}}g.restore()}
// Building appearance is presentation-only; hidden age advances are not read.
function buildingInSight(b){
 if(b.t===0)return true;
 for(let y=Math.floor(b.y);y<Math.ceil(b.y+b.s);y++)for(let x=Math.floor(b.x);x<Math.ceil(b.x+b.s);x++)if(x>=0&&y>=0&&x<W&&y<H&&S.vs[y*W+x])return true;
 return false;
}
function buildingVisualAge(b){
 if(buildingInSight(b)){const age=S.age?.[b.t];if(Number.isInteger(age)&&age>=0&&age<4)PAINT.buildingAges.set(b,age)}
 return PAINT.buildingAges.get(b);
}
function paintedBuildingFrame(kind,team,time,age){
 const staged=(kind==='house'||kind==='tc')&&Number.isInteger(age)&&age>=0&&age<4?assetFrame('bld_'+kind+'_age_'+age,team,3,0,time):null;
 const art=staged||assetFrame('bld_'+kind,team,3,0,time);
 return art&&Number.isInteger(age)&&age>=0&&age<4?{...art,architectureAge:age,architectureKind:kind,architectureTeam:team,ageDetail:!staged}:art;
}
// Construction reveals use current sight or the last observed visual stage.
// Unknown hidden buildings keep the established complete-art fallback.
function buildingVisualConstruction(b){
 if(buildingInSight(b))PAINT.buildingConstruction.set(b,{complete:!!b.done,progress:b.done?1:Math.max(0,Math.min(1,Number.isFinite(b.pr)&&B[b.k]?.bt>0?b.pr/B[b.k].bt:0))});
 return PAINT.buildingConstruction.get(b)||{complete:true,progress:1};
}
function buildingDamageStage(complete,hp,maxHp){
 if(!complete||!Number.isFinite(hp)||!Number.isFinite(maxHp)||maxHp<=1)return 0;
 return hp<maxHp*.33?2:hp<maxHp*.66?1:0;
}
function buildingVisualDamage(b){
 if(buildingInSight(b))PAINT.buildingDamage.set(b,buildingDamageStage(b.done,b.hp,b.mh));
 return PAINT.buildingDamage.get(b)||0;
}
// Native crop overlays keep the original silhouette, scale and foot anchor.
// One global LRU bounds retained damage canvases to16MiB nominal RGBA pixels.
// This is separate from decoded artwork, motion tints and process/GPU memory.
const BUILDING_DAMAGE_CACHE={entries:new Map(),ids:new WeakMap(),next:1,pixels:0,limit:4*1024*1024,creations:0,hits:0,evictions:0};
function damagedBuildingArtwork(art,stage){
 if(!art?.painted||!art.img||!art.f||(stage!==1&&stage!==2))return art;
 const c=BUILDING_DAMAGE_CACHE,f=art.f;
 if(![f.x,f.y,f.w,f.h].every(Number.isInteger)||f.w<=0||f.h<=0)return art;
 let id=c.ids.get(art.img);if(!id){id=c.next++;c.ids.set(art.img,id)}
 const key=[id,f.x,f.y,f.w,f.h,stage].join('/');let image=c.entries.get(key);
 if(image){c.entries.delete(key);c.entries.set(key,image);c.hits++}
 else try{
  image=document.createElement('canvas');image.width=f.w;image.height=f.h;
  const g=image.getContext('2d');if(!g)return art;
  g.drawImage(art.img,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
  g.globalCompositeOperation='source-atop';
  for(let i=0;i<(stage===2?7:4);i++){
   const x=f.w*(.18+((i*37)%67)/100),y=f.h*(.32+((i*23)%47)/100),radius=f.w*(stage===2?.11:.075);
   const shade=g.createRadialGradient(x,y,0,x,y,radius);
   shade.addColorStop(0,stage===2?'rgba(26,20,15,.76)':'rgba(51,36,23,.52)');shade.addColorStop(.55,'rgba(70,48,29,.26)');shade.addColorStop(1,'rgba(70,48,29,0)');
   g.fillStyle=shade;g.fillRect(x-radius,y-radius,radius*2,radius*2);
   // Fractures branch through walls and roof surfaces; their deterministic
   // geometry is stable across repairs, viewpoints and animation frames.
   g.lineCap='round';g.lineJoin='round';g.lineWidth=Math.max(1,f.w*(stage===2?.004:.0028));g.strokeStyle='rgba(27,23,20,.83)';
   g.beginPath();g.moveTo(x,y-radius*.6);g.lineTo(x-radius*.16,y-radius*.18);g.lineTo(x+radius*.12,y+radius*.13);g.lineTo(x-radius*.06,y+radius*.66);g.stroke();
   g.beginPath();g.moveTo(x+radius*.12,y+radius*.13);g.lineTo(x+radius*.48,y+radius*.25);g.lineTo(x+radius*.62,y+radius*.53);g.stroke();
   g.strokeStyle='rgba(224,199,155,.42)';g.lineWidth=Math.max(.65,f.w*.0017);g.beginPath();g.moveTo(x+1,y-radius*.6);g.lineTo(x-radius*.16+1,y-radius*.18);g.lineTo(x+radius*.12+1,y+radius*.13);g.stroke();
  }
  g.globalCompositeOperation='source-over';image.paintedAtlas=true;image.paintedTeam=art.img.paintedTeam;image.paintedDamageStage=stage;c.creations++;
  const pixels=image.width*image.height;
  if(pixels<=c.limit){c.entries.set(key,image);c.pixels+=pixels;
   while(c.pixels>c.limit){const oldest=c.entries.keys().next().value,entry=c.entries.get(oldest);c.entries.delete(oldest);c.pixels-=entry.width*entry.height;c.evictions++}
  }
 }catch(_){return art}
 return {...art,img:image,f:{...f,x:0,y:0},damageStage:stage};
}
function drawBuildingDamageEffects(g,x,y,width,height,stage,time){
 if(stage!==1&&stage!==2)return;
 const t=Number.isFinite(time)?Math.max(0,time):0;
 g.save();
 try{
  if(stage===2)for(let i=0;i<3;i++){
   const px=x+(i-1)*width*.13,py=y-height*(.2+i%2*.06),flicker=.75+.25*Math.sin(t*9+i*2.1),rise=height*.19*flicker;
   const glow=g.createRadialGradient(px,py-rise*.2,0,px,py-rise*.2,rise*.65);glow.addColorStop(0,'rgba(248,139,43,.22)');glow.addColorStop(1,'rgba(248,100,25,0)');g.fillStyle=glow;g.fillRect(px-rise*.65,py-rise*.85,rise*1.3,rise*1.3);
   const flame=g.createLinearGradient(px,py,px,py-rise);flame.addColorStop(0,'rgba(246,173,55,.92)');flame.addColorStop(.45,'rgba(230,93,27,.85)');flame.addColorStop(1,'rgba(183,55,20,.08)');g.fillStyle=flame;
   g.beginPath();g.moveTo(px-width*.028,py);g.quadraticCurveTo(px-width*.043,py-rise*.25,px-width*.018,py-rise*.65);g.quadraticCurveTo(px-width*.015,py-rise*.35,px+Math.sin(t*8+i)*width*.016,py-rise);g.quadraticCurveTo(px+width*.034,py-rise*.65,px+width*.016,py-rise*.38);g.quadraticCurveTo(px+width*.038,py-rise*.3,px+width*.028,py);g.fill();
   const core=g.createLinearGradient(px,py,px,py-rise*.65);core.addColorStop(0,'rgba(255,235,159,.96)');core.addColorStop(1,'rgba(255,189,70,0)');g.fillStyle=core;g.beginPath();g.moveTo(px-width*.014,py);g.quadraticCurveTo(px-width*.019,py-rise*.28,px+width*.005,py-rise*.65);g.quadraticCurveTo(px+width*.004,py-rise*.25,px+width*.014,py);g.fill();
  }
  for(let i=0;i<(stage===2?5:2);i++){
   const phase=(t*.33+i*.21)%1,r=width*(.018+phase*.035),px=x+width*(i%2?.13:-.1)+Math.sin(t*.7+i)*width*.02,py=y-height*(.27+phase*.42);
   const haze=g.createRadialGradient(px,py,0,px,py,r);haze.addColorStop(0,'rgba(47,43,39,'+((1-phase)*(stage===2?.42:.24))+')');haze.addColorStop(1,'rgba(47,43,39,0)');
   g.fillStyle=haze;g.fillRect(px-r,py-r,r*2,r*2);
  }
 }finally{g.restore()}
}
// Camps, workshops and fortifications retain their native painted silhouettes,
// while small original vector fittings make an observed kingdom age readable
// in both views. Houses and Town Centres use dedicated four-sheet architecture.
function drawBuildingAgeDetails(g,art,left,top,width,height){
 const age=art?.architectureAge;if(!art?.ageDetail||!Number.isInteger(age)||age<0||age>3)return;
 const kind=String(art.architectureKind||''),team=Number.isInteger(art.architectureTeam)?art.architectureTeam:0;
 const cloth=['#2877c7','#c8453e','#4b9b58','#d0a52e'][team]||'#2877c7',edge='rgba(31,22,14,.82)',light='rgba(244,222,170,.9)';
 let seed=0;for(const c of kind)seed=(seed*33+c.charCodeAt(0))>>>0;
 const side=seed&1?-1:1,cx=left+width*(.5+side*.2),ground=top+height*.78,unit=Math.max(.75,Math.min(width,height)/125);
 g.save();g.lineCap='round';g.lineJoin='round';
 try{
  if(age===0){
   const x1=left+width*.23,x2=left+width*.38,y1=top+height*.78,y2=top+height*.54;
   g.strokeStyle=edge;g.lineWidth=4.2*unit;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.moveTo(x2,y1);g.lineTo(x1,y2);g.stroke();
   g.strokeStyle='#a97b45';g.lineWidth=2.2*unit;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.moveTo(x2,y1);g.lineTo(x1,y2);g.stroke();
   g.strokeStyle='#dec18a';g.lineWidth=1.1*unit;for(const d of[-2,1,4]){g.beginPath();g.moveTo((x1+x2)/2+d*unit,(y1+y2)/2-4*unit);g.lineTo((x1+x2)/2+d*unit,(y1+y2)/2+4*unit);g.stroke()}
  }else if(age===1){
   g.strokeStyle=edge;g.lineWidth=3.4*unit;g.beginPath();g.moveTo(cx,ground);g.lineTo(cx,top+height*.36);g.stroke();
   g.strokeStyle='#b98a4e';g.lineWidth=1.7*unit;g.beginPath();g.moveTo(cx,ground);g.lineTo(cx,top+height*.36);g.stroke();
   const wave=side*width*.1;g.fillStyle=cloth;g.strokeStyle=edge;g.lineWidth=1.1*unit;g.beginPath();g.moveTo(cx,top+height*.39);g.lineTo(cx+wave,top+height*.42);g.lineTo(cx+wave*.72,top+height*.49);g.lineTo(cx,top+height*.46);g.closePath();g.fill();g.stroke();
  }else if(age===2){
   for(const q of[-1,1]){const x=left+width*(.5+q*.27),y=top+height*.67,r=7*unit;
    g.fillStyle='#b7ad99';g.strokeStyle=edge;g.lineWidth=1.3*unit;g.beginPath();g.moveTo(x-r,y+r);g.lineTo(x-r*.78,y-r*.55);g.lineTo(x,y-r);g.lineTo(x+r*.78,y-r*.55);g.lineTo(x+r,y+r);g.closePath();g.fill();g.stroke();
    g.fillStyle=cloth;g.beginPath();g.moveTo(x-r*.43,y-r*.35);g.lineTo(x+r*.43,y-r*.35);g.lineTo(x+r*.3,y+r*.38);g.lineTo(x,y+r*.72);g.lineTo(x-r*.3,y+r*.38);g.closePath();g.fill();
   }
  }else{
   g.strokeStyle=edge;g.lineWidth=3.8*unit;g.beginPath();g.moveTo(cx,ground);g.lineTo(cx,top+height*.27);g.stroke();
   g.strokeStyle='#d9b64b';g.lineWidth=2.1*unit;g.beginPath();g.moveTo(cx,ground);g.lineTo(cx,top+height*.27);g.stroke();
   const wave=side*width*.12;g.fillStyle=cloth;g.strokeStyle='#6d5117';g.lineWidth=1.2*unit;g.beginPath();g.moveTo(cx,top+height*.31);g.lineTo(cx+wave,top+height*.34);g.lineTo(cx+wave*.74,top+height*.42);g.lineTo(cx,top+height*.39);g.closePath();g.fill();g.stroke();
   g.fillStyle='#f1cf63';g.strokeStyle=edge;g.beginPath();g.arc(cx,top+height*.25,2.7*unit,0,Math.PI*2);g.fill();g.stroke();
   g.strokeStyle=light;g.lineWidth=1.2*unit;g.beginPath();g.moveTo(left+width*.28,top+height*.52);g.quadraticCurveTo(left+width*.5,top+height*.47,left+width*.72,top+height*.52);g.stroke();
  }
 }finally{g.restore()}
}
// Shared original construction presentation. Native artwork is revealed from
// its foundation upward; finished roofs no longer appear at the start of a build.
// Geometry uses only supplied visual progress, never another world's entities.
function drawBuildingArtwork(g,art,x,y,scale,complete=true,progress=1,ghost=false,damage=0,time=0,effects=true){
 const f=art.f,left=x-f.ax*scale,top=y-f.ay*scale,width=f.w*scale,height=f.h*scale;
 if(!art.painted||complete||ghost){
  const display=art.painted&&complete&&!ghost&&damage>0?damagedBuildingArtwork(art,damage):art,q=display.f;
  g.drawImage(display.img,q.x,q.y,q.w,q.h,left,top,width,height);
  if(art.painted&&complete&&!ghost)drawBuildingAgeDetails(g,art,left,top,width,height);
  if(art.painted&&complete&&!ghost&&effects&&damage>0)drawBuildingDamageEffects(g,x,y,width,height,damage,time);
  return;
 }
 const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 const stage=p<.25?0:p<.6?1:p<.9?2:3,reveal=[.18,.5,.8,1][stage];
 g.save();
 try{
  g.beginPath();g.rect(left-1,top+height*(1-reveal),width+2,height*reveal+1);g.clip();
  g.drawImage(art.img,f.x,f.y,f.w,f.h,left,top,width,height);
 }finally{g.restore()}
 // Two timber scaffold faces, braced posts, plank decks, lashings and a ladder.
 // The scaffold disappears atomically when construction completes.
 const ground=y-height*.04,deck=ground-height*(.23+stage*.16),half=width*.42;
 g.save();
 try{
  g.lineCap='round';g.lineJoin='round';
  const beam=(ax,ay,bx,by)=>{
   g.strokeStyle='#46321f';g.lineWidth=Math.max(1.5,width*.018);g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.stroke();
   g.strokeStyle='#bc935e';g.lineWidth=Math.max(.7,width*.008);g.beginPath();g.moveTo(ax-.4,ay);g.lineTo(bx-.4,by);g.stroke();
  };
  const points=[[-half,ground-height*.11],[0,ground],[half,ground-height*.11]];
  for(const [px,py] of points)beam(x+px,py,x+px,deck-height*.04);
  for(let side=0;side<2;side++){
   const [a,b]=[points[side],points[side+1]];
   beam(x+a[0],deck,x+b[0],deck);
   beam(x+a[0],a[1]-height*.03,x+b[0],deck+height*.03);
   beam(x+a[0],deck+height*.03,x+b[0],b[1]-height*.03);
   g.strokeStyle='#dec18a';g.lineWidth=Math.max(1,width*.012);
   g.beginPath();g.moveTo(x+a[0],deck-height*.015);g.lineTo(x+b[0],deck-height*.015);g.stroke();
  }
  for(const [px] of points){g.strokeStyle='#d7bb88';g.lineWidth=Math.max(.8,width*.007);for(let j=0;j<3;j++){g.beginPath();g.moveTo(x+px-width*.014,deck+j*height*.012);g.lineTo(x+px+width*.014,deck+j*height*.012);g.stroke()}}
  if(stage>0){
   const lx=x+half*.55,base=ground-height*.045,high=deck-height*.05,lean=width*.08,gap=width*.065;
   beam(lx,base,lx+lean,high);beam(lx+gap,base,lx+gap+lean,high);
   for(let j=1;j<7;j++){const t=j/7;beam(lx+lean*t,base+(high-base)*t,lx+gap+lean*t,base+(high-base)*t)}
  }
 }finally{g.restore()}
}
function drawBld(b,ghost){const o=BP[b.k]||BP.house,s=b.s,f=b.done?1:cl(b.pr/B[b.k].bt,.2,1),st=b.done?3:Math.min(2,(f*3)|0),ff=[.3,.55,.8,1][st],ap=(o.p||0)+(o.tur?18:0)+(o.keep?30:0),w=s*64+80,hgt=Math.round(s*32+o.h*1.2+ap+80),z=zm,
dm=b.done&&b.mh>1?(b.hp<b.mh*.33?2:b.hp<b.mh*.66?1:0):0,baf=ASSET.n?paintedBuildingFrame(b.k,b.t,gt,buildingVisualAge(b)):null,
c=baf?null:spr('b|'+b.k+'|'+b.t+'|'+st+'|'+dm,w,hgt,g=>paintBld(g,b.k,s,teamColor(b.t),ff,dm)),Z=w2s(b.x+s,b.y+s),E=w2s(b.x+s,b.y),N=w2s(b.x,b.y),Wv=w2s(b.x,b.y+s);
X.globalAlpha=ghost?.6:b.done?1:.88;if(baf){const q=baf.f,sc=baf.painted?s*66/q.w*zm:Math.min(w/q.w,hgt/q.h)*zm*(baf.sc||1),ax=q.ax==null?q.w/2:q.ax,ay=q.ay==null?q.h-8:q.ay,construction=buildingVisualConstruction(b);drawBuildingArtwork(X,{...baf,f:{...q,ax,ay}},Z[0],Z[1],sc,construction.complete,construction.progress,!!ghost,buildingVisualDamage(b),gt,buildingInSight(b))}else blit(c,Z[0],Z[1],w,hgt,false);X.globalAlpha=1;if(!b.done&&!ghost&&!baf?.painted){const lift=Math.max(5,o.h*ff)*z,pts=[Z,E,N,Wv],tops=pts.map(p=>[p[0],p[1]-lift]);X.save();X.lineCap='round';X.lineJoin='round';X.strokeStyle='rgba(91,57,28,.82)';X.lineWidth=Math.max(1,2*z);for(let i=0;i<pts.length;i++){X.beginPath();X.moveTo(pts[i][0],pts[i][1]);X.lineTo(tops[i][0],tops[i][1]);X.stroke()}X.strokeStyle='rgba(205,157,91,.78)';X.lineWidth=Math.max(.8,1.3*z);for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;X.beginPath();X.moveTo(tops[i][0],tops[i][1]);X.lineTo(tops[j][0],tops[j][1]);X.stroke()}X.strokeStyle='rgba(116,75,38,.72)';X.lineWidth=Math.max(.8,1*z);for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;X.beginPath();X.moveTo(pts[i][0],pts[i][1]);X.lineTo(tops[j][0],tops[j][1]);X.stroke()}X.restore()}const cx=Z[0],topY=baf?.painted?Z[1]-baf.f.h*(s*66/baf.f.w)*z:Z[1]-(s*16+o.h*ff+(o.p||0)+(o.keep?16:0))*z;
if(b.done){if(o.fl&&!baf?.painted){const by=topY-(o.cren?4:0)*z;X.strokeStyle='#3a2a1a';X.lineWidth=2*z;X.beginPath();X.moveTo(cx,by);X.lineTo(cx,by-22*z);X.stroke();X.fillStyle=teamColor(b.t);poly([[cx,by-22*z],[cx+14*z,by-17*z+Math.sin(gt*4)*2.5*z],[cx,by-10*z]]);X.fill();X.lineWidth=1}
if(o.chim){for(let i=0;i<3;i++){const t=(gt*.6+i/3)%1;X.fillStyle='rgba(205,205,205,'+(.5-t*.5)+')';X.beginPath();X.arc(cx+s*8*z+Math.sin(t*6+i)*3*z,topY+10*z-t*30*z,(3+t*5)*z,0,7);X.fill()}}
if(o.blades&&!baf?.painted){const hx=cx+2*z,hy=Z[1]-(s*16+o.h*.85)*z;X.strokeStyle='#5a3a1a';X.lineWidth=2.4*z;for(let i=0;i<4;i++){const a=gt*.9+i*1.5708;X.beginPath();X.moveTo(hx,hy);X.lineTo(hx+Math.cos(a)*24*z,hy+Math.sin(a)*24*z);X.stroke();X.fillStyle='rgba(240,230,200,.9)';poly([[hx+Math.cos(a)*8*z,hy+Math.sin(a)*8*z],[hx+Math.cos(a)*24*z,hy+Math.sin(a)*24*z],[hx+Math.cos(a)*24*z-Math.sin(a)*7*z,hy+Math.sin(a)*24*z+Math.cos(a)*7*z],[hx+Math.cos(a)*8*z-Math.sin(a)*7*z,hy+Math.sin(a)*8*z+Math.cos(a)*7*z]]);X.fill()}X.lineWidth=1}
if(o.glow){X.fillStyle='rgba(255,140,40,'+(.22+.12*Math.sin(gt*7))+')';X.beginPath();X.arc((Z[0]+E[0])/2,(Z[1]+E[1])/2-10*z,14*z,0,7);X.fill()}
if(!baf?.painted&&b.hp<b.mh*.35&&b.mh>1){for(let k=0;k<4;k++){const fx0=cx-14*z+k*9*z,fy=Z[1]-s*16*z-o.h*.5*z;X.fillStyle=k%2?'#ff9d1c':'#ff5a1c';X.beginPath();X.moveTo(fx0-5*z,fy);X.quadraticCurveTo(fx0,fy-16*z-Math.sin(gt*9+k)*6*z,fx0+5*z,fy);X.fill();X.fillStyle='rgba(60,50,45,.35)';X.beginPath();X.arc(fx0,fy-26*z-((gt*20+k*9)%24)*z,5*z,0,7);X.fill()}}}
if(!baf?.painted&&dm>=1&&Math.random()<.02*dm)emit('smk',b.x+s/2,b.y+s/2,1,{s:.4,vz:.8,l:1.6,c:'#666',r:3});
if(S.sel.includes(b)){X.strokeStyle='#fff';X.lineWidth=3;poly([N,E,Z,Wv]);X.stroke();X.lineWidth=1}
const by2=topY-26*z-(o.fl?16*z:0);if(!b.done)bar(cx-20,by2,40,b.pr/B[b.k].bt,'#6cf');else if(b.hp<b.mh)bar(cx-20,by2,40,b.hp/b.mh,'#6e6');if(b.q&&b.q.length)bar(cx-20,by2-8,40,1-b.q[0].t/U[b.q[0].k].t,'#fc4')}
function paintNode(g,kind,v){const E='#1a1410';if(kind==='w'){g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(6,2,17,6,0,0,7);g.fill();if(v<.34){g.fillStyle=lin(g,-3,0,3,0,'#4a2e14','#7a5028');g.fillRect(-2.6,-16,5.2,17);for(let k=0;k<4;k++){const by=-14-k*10,w=15-k*3;pg(g,[[-w,by],[w,by],[0,by-17]],lin(g,-w,0,w,0,'#1c5a30','#2f8a4a'),E,.7);pg(g,[[-w+1,by-1],[0,by-16],[-w*.12,by-2]],'rgba(143,205,105,.38)',null);pg(g,[[0,by-16],[w-1,by-1],[w*.5,by-2]],'rgba(0,0,0,.13)',null)}g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=1;g.beginPath();g.moveTo(-3,-30);g.lineTo(-9,-16);g.stroke()}else if(v<.67){g.fillStyle=lin(g,-3,0,3,0,'#4a2e14','#8a6030');g.beginPath();g.moveTo(-3.4,1);g.lineTo(-2,-18);g.lineTo(2,-18);g.lineTo(3.4,1);g.fill();g.stroke();for(const q of[[0,-27,14],[-8,-22,10],[8,-21,10],[-3,-34,9],[5,-32,8]]){const rg=g.createRadialGradient(q[0]-3,q[1]-4,1,q[0],q[1],q[2]);rg.addColorStop(0,'#78c060');rg.addColorStop(1,'#2a6a2c');g.fillStyle=rg;g.beginPath();g.arc(q[0],q[1],q[2],0,7);g.fill()}g.strokeStyle='rgba(0,30,0,.4)';g.lineWidth=1;g.beginPath();g.arc(0,-27,14,.3,2.8);g.stroke()}else{g.fillStyle=lin(g,-2,0,2,0,'#e8e4d8','#a8a498');g.fillRect(-2.2,-22,4.4,23);g.fillStyle='#333';for(let k=0;k<4;k++)g.fillRect(-2.2,-4-k*5,2.6,1.2);for(const q of[[0,-30,11],[-6,-25,8],[7,-26,8],[0,-38,7]]){const rg=g.createRadialGradient(q[0]-2,q[1]-3,1,q[0],q[1],q[2]);rg.addColorStop(0,'#c8e090');rg.addColorStop(1,'#6a9a3a');g.fillStyle=rg;g.beginPath();g.arc(q[0],q[1],q[2],0,7);g.fill()}}}
else if(kind==='f'){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(0,1,14,5,0,0,7);g.fill();for(const q of[[-6,-6,8],[5,-7,8],[0,-11,7],[-1,-4,7]]){const rg=g.createRadialGradient(q[0]-2,q[1]-3,1,q[0],q[1],q[2]);rg.addColorStop(0,'#6ab04c');rg.addColorStop(1,'#2a6a28');g.fillStyle=rg;g.beginPath();g.arc(q[0],q[1],q[2],0,7);g.fill()}for(const q of[[-7,-7],[3,-12],[7,-5],[-2,-4],[1,-8]]){g.fillStyle='#d4373a';g.beginPath();g.arc(q[0],q[1],2.4,0,7);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.fillRect(q[0]-1,q[1]-1.4,.9,.9)}}
else if(kind==='d'){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(0,1,11,4,0,0,7);g.fill();g.strokeStyle='#5a3a1c';g.lineWidth=1.8;for(const o of[-6,-3,4,7]){g.beginPath();g.moveTo(o,-7);g.lineTo(o+.5,1);g.stroke()}g.fillStyle=lin(g,0,-16,0,-5,'#c08a50','#8a5a2a');g.beginPath();g.ellipse(0,-10,10,5,0,0,7);g.fill();g.stroke();g.fillStyle='rgba(255,255,255,.55)';for(const q of[[-3,-12],[1,-13],[4,-10],[-1,-9]]){g.beginPath();g.arc(q[0],q[1],.9,0,7);g.fill()}pg(g,[[7,-12],[10,-19],[13,-18],[11,-11]],'#a8723e',E,.7);g.fillStyle='#a8723e';g.beginPath();g.ellipse(12,-19,3.2,2.2,.3,0,7);g.fill();g.stroke();g.strokeStyle='#d8c8a0';g.lineWidth=1.2;g.beginPath();g.moveTo(11,-21);g.lineTo(9,-26);g.moveTo(10,-23);g.lineTo(7,-24);g.moveTo(13,-21);g.lineTo(15,-27);g.moveTo(14,-24);g.lineTo(17,-25);g.stroke()}
else{const gold=kind==='g';g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,2,16,6,0,0,7);g.fill();pg(g,[[-15,1],[-9,-12],[-1,-17],[8,-12],[15,-2],[9,3],[-9,3]],lin(g,-15,-17,15,3,'#8a857c','#4a463e'),E,.9);pg(g,[[-9,-12],[-1,-17],[2,-8],[-6,-5]],'#a8a49a',null);g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=.8;g.beginPath();g.moveTo(-9,-12);g.lineTo(-1,-17);g.lineTo(8,-12);g.stroke();g.strokeStyle='rgba(22,20,17,.32)';g.beginPath();g.moveTo(-6,-5);g.lineTo(2,-8);g.lineTo(8,-1);g.stroke();pg(g,[[-8,-3],[-2,-12],[6,-8],[8,-1],[0,2]],gold?lin(g,-8,-12,8,2,'#f6d65a','#a87b12'):lin(g,-8,-12,8,2,'#c2c9ce','#6a727a'),E,.7);g.fillStyle=gold?'#fff3a0':'#fff';g.fillRect(-3,-9,2,2);g.fillRect(3,-6,1.6,1.6)}}
// Cache high-resolution but small static resource crops instead of sampling
// huge painted atlases every frame on Xbox Edge. Team-colour image identity
// weakly keys the cache, so reloaded/new art never reuses stale texture pixels.
const NODE_TEXTURE_CACHE=new WeakMap();
function paintedNodeTexture(painted,width){
 if(!painted?.img||!painted.f)return null;
 const f=painted.f,img=painted.img;
 let frames=NODE_TEXTURE_CACHE.get(img);
 if(!frames){frames=new Map();NODE_TEXTURE_CACHE.set(img,frames)}
 const key=[f.x,f.y,f.w,f.h,width,painted.referenceWidth||f.w].join('/');
 if(frames.has(key))return frames.get(key);
 try{
  const canvas=document.createElement('canvas'),scale=2*width/(painted.referenceWidth||f.w);
  canvas.width=Math.max(1,Math.round(f.w*scale));
  canvas.height=Math.max(1,Math.round(f.h*scale));
  const g=canvas.getContext('2d');if(!g)return null;
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(img,f.x,f.y,f.w,f.h,0,0,canvas.width,canvas.height);
  canvas.paintedAtlas=!!painted.painted;canvas.paintedTeam=img.paintedTeam??null;
  frames.set(key,canvas);return canvas;
 }catch(_){return null}
}
// Stable geographic variants, independent of clock and owner.
// Quantity is supplied from current sight or remembered visual knowledge only.
// Farms, fish and hunted animals keep their own presentation.
function resourceVisualAmount(n,visible){
 if(!n||n.an||n.fi||n.fm||n.trap||!['s','g','f'].includes(n.k))return Infinity;
 if(visible)PAINT.resourceAmounts.set(n,Number.isFinite(n.amt)?Math.max(0,n.amt):Infinity);
 return PAINT.resourceAmounts.get(n)??Infinity;
}
function paintedResourceFrame(kind,x,y,excluded=false,amount=Infinity){
 if(excluded||typeof ASSET==='undefined'||!ASSET.n)return null;
 const name={s:'stone',g:'gold',f:'berry'}[kind];if(!name)return null;
 const variant=hsh(x,y)<.5?0:1;
 if(Number.isFinite(amount)&&amount>0&&amount<=40){const low=assetFrame('node_'+name+'_low_'+variant,0,0,0,0);if(low)return low}
 return assetFrame('node_'+name+'_'+variant,0,0,0,0);
}
function paintedEnvironmentFrame(n,time=0){
 if(typeof ASSET==='undefined'||!ASSET.n||n.fm)return null;
 if(n.trap)return n.k==='f'&&n.fi?assetFrame('env_trap_'+Math.min(3,Math.floor(hsh(n.x,n.y)*4)),0,0,0,0):null;
 const kind=n.an?'deer':n.fi?'fish':n.k==='w'?['pine','oak','birch'][Math.min(2,Math.floor(hsh(n.x,n.y)*3))]:null;
 const clock=(n.an||n.fi)&&Number.isFinite(time)?Math.max(0,time)+hsh(n.x,n.y)*3.2:0;
 return kind?assetFrame('env_'+kind,0,0,0,clock):null;
}
function paintedResourceWidth(n,art){
 const width=n.trap?38:n.fm?66:n.an?46:n.fi?40:n.k==='w'?62:n.k==='f'?50:54;
 return n.k==='w'&&art?Math.min(width,86*art.f.w/art.f.h):width;
}
function drawPaintedRelic(g,x,y,width){
 if(typeof ASSET==='undefined'||!ASSET.n)return false;
 const art=assetFrame('env_relic',0,0,0,0);if(!art)return false;
 const f=art.f,sc=width/f.w,cached=paintedNodeTexture(art,32);
 if(cached)g.drawImage(cached,x-f.ax*sc,y-f.ay*sc,f.w*sc,f.h*sc);
 else g.drawImage(art.img,f.x,f.y,f.w,f.h,x-f.ax*sc,y-f.ay*sc,f.w*sc,f.h*sc);
 return true;
}

function drawNode(n){const P=w2s(n.x+.5,n.y+.5),v=hsh(n.x,n.y),i=n.y*W+n.x;X.globalAlpha=S.vs[i]?1:.65;
const painted=paintedEnvironmentFrame(n,S.t)||paintedResourceFrame(n.k,n.x,n.y,n.an||n.fi||n.fm||n.trap,resourceVisualAmount(n,!!S.vs[i]))||(ASSET.n?assetFrame(n.fm?'bld_farm':n.k==='w'?'node_tree':'none',n.t||0,0,0,gt):null);if(painted?.painted){const f=painted.f,sc=paintedResourceWidth(n,painted)/(painted.referenceWidth||f.w)*zm;X.save();X.translate(P[0],P[1]+4*zm);if(!n.fm&&v<.5)X.scale(-1,1);const cached=paintedNodeTexture(painted,paintedResourceWidth(n,painted));
if(cached)X.drawImage(cached,-f.ax*sc,-f.ay*sc,f.w*sc,f.h*sc);
else X.drawImage(painted.img,f.x,f.y,f.w,f.h,-f.ax*sc,-f.ay*sc,f.w*sc,f.h*sc);
X.restore();X.globalAlpha=1;return;}
if(n.fi){const sx=P[0],sy=P[1],z=zm,r=(6+Math.sin(gt*2+n.x)*2)*z;if(n.trap){X.strokeStyle='#d7b36a';X.lineWidth=2*z;X.beginPath();X.ellipse(sx,sy+2*z,13*z,6*z,0,0,7);X.stroke();X.strokeStyle='#8b6b3b';X.beginPath();X.moveTo(sx-8*z,sy);X.lineTo(sx+8*z,sy+3*z);X.moveTo(sx+6*z,sy-4*z);X.lineTo(sx-5*z,sy+5*z);X.stroke();}X.strokeStyle='rgba(255,255,255,.5)';X.beginPath();X.ellipse(sx,sy,r+6*z,(r+6*z)/2,0,0,7);X.stroke();X.fillStyle='#d8eef6';X.beginPath();X.ellipse(sx,sy-2*z,8*z,3.5*z,0,0,7);X.fill();X.fillStyle='#8cc0d6';poly([[sx+7*z,sy-2*z],[sx+12*z,sy-6*z],[sx+12*z,sy+2*z]]);X.fill()}
else if(n.fm){const z=zm,st=Math.min(3,(n.amt/110)|0),c=spr('farm|'+st,70,40,g=>{pg(g,[[0,5],[30,-8],[0,-21],[-30,-8]],lin(g,0,-21,0,5,'#9a7a44','#6a4a22'),'#2a1a0a',1);for(let r=-3;r<=3;r++){g.strokeStyle='rgba(40,20,5,.5)';g.lineWidth=1;g.beginPath();g.moveTo(-22+r*4+8,-4+r*2-10);g.lineTo(2+r*4+8,8+r*2-12);g.stroke();if(st>0)for(let q=0;q<5;q++){g.fillStyle=st>2?'#d8b84a':'#6aa83a';g.fillRect(-18+r*4+q*5+8,-8+r*2+q*2.3-10-st*1.6,1.6,2+st*1.8);if(st>=2){const fx=-18+r*4+q*5+8,fy=-8+r*2+q*2.3-10-st*1.6;g.strokeStyle='rgba(226,197,105,.9)';g.lineWidth=.7;g.beginPath();g.moveTo(fx+.7,fy);g.lineTo(fx+1.2,fy-3);g.stroke();g.fillStyle=st>2?'#f0d477':'#b7bd50';g.beginPath();g.ellipse(fx+1.2,fy-3,1.1,.65,-.5,0,Math.PI*2);g.fill()}}}});blit(c,P[0],P[1]+4*z,70,40,false)}
else{const kind=n.an?'d':n.k,vv=kind==='w'?(v<.34?0:v<.67?1:2):0,sz=kind==='w'?[64,84]:[48,44],c=spr('n|'+kind+'|'+vv,sz[0],sz[1],g=>paintNode(g,kind,kind==='w'?v:0));blit(c,P[0],P[1]+4*zm,sz[0],sz[1],false)}
X.globalAlpha=1}

/* Procedural character, siege, naval and sprite-cache drawing. */
const SPC=new Map();
function spr(key,w,h,fn){let c=SPC.get(key);if(!c){c=document.createElement('canvas');c.width=w*2;c.height=h*2;const g=c.getContext('2d');g.scale(2,2);g.translate(w/2,h-8);g.lineJoin='round';g.lineCap='round';fn(g);SPC.set(key,c)}return c}
function blit(c,sx,sy,w,h,flip){X.save();X.translate(sx,sy);if(flip)X.scale(-1,1);X.drawImage(c,-w/2*zm,-(h-8)*zm,w*zm,h*zm);X.restore()}
function pg(g,a,fill,stroke,lw){g.beginPath();g.moveTo(a[0][0],a[0][1]);for(let i=1;i<a.length;i++)g.lineTo(a[i][0],a[i][1]);g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||1;g.stroke()}}
function lin(g,x0,y0,x1,y1,c0,c1){const q=g.createLinearGradient(x0,y0,x1,y1);q.addColorStop(0,c0);q.addColorStop(1,c1);return q}
/* Deterministic terrain variation, team foliage colours and tile palettes. */
const hsh=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296};
const GC=['#596b3d','#53663b','#607047','#52633b','#5e6e45','#55673d'],SC={};
const shd=(c,f)=>SC[c+f]||(SC[c+f]=(()=>{const n=parseInt(c.slice(1),16);return 'rgb('+Math.min(255,(n>>16&255)*f|0)+','+Math.min(255,(n>>8&255)*f|0)+','+Math.min(255,(n&255)*f|0)+')'})());
const GCd=GC.map(c=>shd(c,.86)),GCl=GC.map(c=>shd(c,1.09));
const PALS=[{g:GC,d:GCd,l:GCl,coast:'#cdbd82',dirt:['#8d7b4c','#867449']}];
{const mk=(a,c,dk)=>({g:a,d:a.map(x=>shd(x,.9)),l:a.map(x=>shd(x,1.06)),coast:c,dirt:dk});PALS.push(mk(['#d8c48a','#d2bd80','#dcc890','#cdb676','#d6c286','#d0ba7c'],'#e6d8a8',['#b89a60','#b0925a']),mk(['#e8f0f4','#dde8ee','#f0f6f8','#d4e2ea','#e2ecf0','#d9e6ec'],'#c3d0d6',['#8e8a84','#86827c']),mk(['#7f9a62','#789358','#86a068','#718c54','#7c9660','#7a945a'],'#b8b090',['#7d7568','#766e62']))}

/* Shared canvas shape and progress primitives used by the renderer and minimap/UI. */
function bar(x,y,w,f,c){X.fillStyle='#000a';X.fillRect(x,y,w,5);X.fillStyle=c;X.fillRect(x,y,w*cl(f,0,1),5)}
function dia(cx,cy,hw,hh){X.beginPath();X.moveTo(cx,cy-hh);X.lineTo(cx+hw,cy);X.lineTo(cx,cy+hh);X.lineTo(cx-hw,cy);X.closePath()}
function poly(a){X.beginPath();X.moveTo(a[0][0],a[0][1]);for(let i=1;i<a.length;i++)X.lineTo(a[i][0],a[i][1]);X.closePath()}


