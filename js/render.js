/* ===== PAINTED RASTER GRAPHICS =====
 * Original textured medieval WebP sprites replace the discarded pixel icons.
 * Sprite bounds and foot anchors live in assets/atlas-manifest.json.
 * Artwork, terrain and visual motion are presentation-only.
 */
const PAINT={terrain:null,facing:new WeakMap(),motion:new WeakMap(),resourceAmounts:new WeakMap(),buildingAges:new WeakMap(),buildingConstruction:new WeakMap(),buildingDamage:new WeakMap()};
/* Painted terrain sampling and bounded edge blending: js/render-terrain.js. */
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
const PMAX=[100,260,520],PT=[];

/* Particle emission, lifetime and bounded sprite warm-up share the renderer's
 * texture state; the fixed-step engine only schedules these operations. */
function emit(k,x,y,n,o){const cap=PMAX[gq];o=o||{};for(let i=0;i<n;i++){if(PT.length>=cap)return;PT.push({k,x,y,z:0,vx:(Math.random()-.5)*(o.s||1),vy:(Math.random()-.5)*(o.s||1),vz:(o.vz||0)*(.6+Math.random()*.8),l:o.l||.6,t:0,c:o.c||'#ccc',r:o.r||2})}}
function updP(dt){for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.t+=dt;if(p.t>=p.l){PT[i]=PT[PT.length-1];PT.pop();continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.k==='deb'||p.k==='spark')p.vz-=9*dt}}
let WQ=[];
function queueWarm(){WQ=[];const uu=new Set(CIV.map(c=>c.uu)),mine=new Set((S.civ||[0,1]).map(c=>CIV[c].uu));for(const k in U){if(k==='tw'||k==='cs'||k==='tca')continue;if(uu.has(k)&&!mine.has(k))continue;for(const t of[0,1,2,3]){WQ.push([k,t,0,0]);for(let f=0;f<4;f++)WQ.push([k,t,1,f])}}WQ.reverse()}
function warm(){if(!WQ.length)return;const t0=performance.now();while(WQ.length&&performance.now()-t0<3){const q=WQ.pop(),k=q[0],sz=USZ(k);spr(k+'|'+q[1]+'|'+q[2]+'|'+q[3],sz[0],sz[1],g=>paintUnit(g,k,teamColor(q[1]),q[2],q[3]))}}

/* Draw the particles whose lifecycle is updated by engine.js. */
function drawP(){for(const p of PT){const P=w2s(p.x,p.y),a=1-p.t/p.l;X.globalAlpha=a*(p.k==='smk'||p.k==='puff'||p.k==='dust'?.55:.95);X.fillStyle=p.c;X.beginPath();X.arc(P[0],P[1]-Math.max(0,p.z)*zm*14,(p.r+(p.k==='smk'||p.k==='puff'||p.k==='dust'?p.t*6:0))*zm,0,7);X.fill()}X.globalAlpha=1}

/* Building rendering lives in js/render-buildings.js. */
/* Resource-node art, original resource crop cache and fallback: js/render-resources.js. */
/* Procedural character, siege, naval and sprite-cache drawing. */
const SPC=new Map();
function spr(key,w,h,fn){let c=SPC.get(key);if(!c){c=document.createElement('canvas');c.width=w*2;c.height=h*2;const g=c.getContext('2d');g.scale(2,2);g.translate(w/2,h-8);g.lineJoin='round';g.lineCap='round';fn(g);SPC.set(key,c)}return c}
function blit(c,sx,sy,w,h,flip){X.save();X.translate(sx,sy);if(flip)X.scale(-1,1);X.drawImage(c,-w/2*zm,-(h-8)*zm,w*zm,h*zm);X.restore()}
function pg(g,a,fill,stroke,lw){g.beginPath();g.moveTo(a[0][0],a[0][1]);for(let i=1;i<a.length;i++)g.lineTo(a[i][0],a[i][1]);g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw||1;g.stroke()}}
function lin(g,x0,y0,x1,y1,c0,c1){const q=g.createLinearGradient(x0,y0,x1,y1);q.addColorStop(0,c0);q.addColorStop(1,c1);return q}
/* Deterministic terrain palettes and colour variation: js/render-terrain.js. */
/* Shared canvas shape and progress primitives used by the renderer and minimap/UI. */
function bar(x,y,w,f,c){X.fillStyle='#000a';X.fillRect(x,y,w,5);X.fillStyle=c;X.fillRect(x,y,w*cl(f,0,1),5)}
function dia(cx,cy,hw,hh){X.beginPath();X.moveTo(cx,cy-hh);X.lineTo(cx+hw,cy);X.lineTo(cx,cy+hh);X.lineTo(cx-hw,cy);X.closePath()}
function poly(a){X.beginPath();X.moveTo(a[0][0],a[0][1]);for(let i=1;i<a.length;i++)X.lineTo(a[i][0],a[i][1]);X.closePath()}



/* Main render dispatch: world presentation, mode routing and HUD pass. */
function draw(dt){X=WORLD_X;
updateXboxPictureForFrame();
gt+=dt;X.setTransform(DPR,0,0,DPR,0,0);updP(dt);warm();X.fillStyle='#000';X.fillRect(0,0,CW,CH);if(mode!=='play'&&mode!=='pause')perfFlatField=0;
if(mode!=='play'&&mode!=='pause')perfLayerMode=0;
if(mode!=='play'&&mode!=='pause'&&canvasBenchmark)stopCanvasBenchmark(true);
if(mode!=='play'&&mode!=='pause')canvasBenchSummary=null;
if(mode!=='play'&&mode!=='pause'&&perfSharpHud){perfSharpHud=0;rs()}
if(mode!=='play'&&mode!=='pause'&&perfRenderScale!==1){perfRenderScale=1;rs()}
if(drawFrontEndScreen())return;
for(const n of notes)n.t-=dt;compactPositive(notes,'t');
if(perfFlatField){
 // Reversible GPU/presentation isolation: keep sim, input and the live HUD;
 // replace world/fog/units with one flat clear. Never save this preference.
 X.fillStyle='#15251b';X.fillRect(0,0,CW,CH);
 perfChunksMs=perfTilesMs=perfObjectsMs=perfEffectsMs=0;perfNodeMs=perfBuildingMs=perfUnitMs=perfOtherWorldMs=0;perfNodeCount=perfBuildingCount=perfUnitCount=0;
}else drawWorld();
const uiStart=perfHud?performance.now():0;
drawXboxHudOverlays(dt);
if(perfHud)perfUiMs=performance.now()-uiStart}
