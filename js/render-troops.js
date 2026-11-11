/* Original troop pose, bounded painted-frame cache and in-match unit drawing.
 * Source relocated without changing animation, team palette or fallback drawing.
 * Loaded after procedural unit art; drawWorld() dispatch remains in js/render.js. */
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
 const dx=prev?u.x-prev.x:0,dy=prev?u.y-prev.y:0;
 const moved=!!(prev&&dx*dx+dy*dy>.0001);
 const moveTime=routed&&(moved||!prev?.routed||now<prev.time)?now:(prev?.moveTime??-Infinity);
 // Reuse presentation history rather than allocating one record per visible
 // unit per frame. Refresh the phase seed only if the identity changes (e.g.
 // when a network preview acquires its authoritative ID).
 const phaseKey=u.netId||u.id||u.k||'';
 let phaseHash=prev&&prev.phaseKey===phaseKey?prev.phaseHash:null;
 if(phaseHash===null){
  phaseHash=0;
  for(const c of String(phaseKey))phaseHash=(phaseHash*31+c.charCodeAt(0))%997;
 }
 if(prev){
  prev.x=u.x;prev.y=u.y;prev.time=now;prev.routed=routed;prev.moveTime=moveTime;
  prev.phaseKey=phaseKey;prev.phaseHash=phaseHash;
 }else PAINT.motion.set(u,{x:u.x,y:u.y,time:now,routed,moveTime,phaseKey,phaseHash});
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
 return {state,heading,time:now+phaseHash/997,
  phase:state===2?Math.max(0,Math.min(1,1-u.cd/duration)):undefined};
}
// Base portraits retain light fallback movement/recoil when motion is missing.
// This includes Janissaries/Genoese Crossbowmen if their new sheets fail to load.
// Fallback transforms are distinct from individually painted motion frames.
const PAINT_SECONDARY=Object.freeze({
  cart:'siege',fish:'ship',gal:'ship',fire:'ship',demo:'ship',cgal:'ship',trn:'ship',cog:'ship',
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
// At distant zoom, use a smaller copy of the original art, never simplified markers.
// A total-pixel budget protects Edge from an unbounded frame-texture cache.
const TROOP_TEXTURE_PIXEL_LIMIT=6*1024*1024,TROOP_TEXTURE_ENTRY_LIMIT=160;
const TROOP_TEXTURE_IDS=new WeakMap(),TROOP_TEXTURE_LRU=new Map();
let troopTextureSeq=0,troopTexturePixels=0;
function troopFrameTexture(art,mirror=false,lod=1){
 const img=art?.img,f=art?.f;
 if(!img||!f||typeof img!=='object')return null;
 const {x,y,w,h}=f,ratio=lod===.5?.5:1;
 if(ratio===1&&!mirror&&img.paintedSourceFrame&&x===0&&y===0&&img.width===w&&img.height===h)return img;
 if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0||w*h>TROOP_TEXTURE_PIXEL_LIMIT)return null;
 const dw=Math.max(1,Math.round(w*ratio)),dh=Math.max(1,Math.round(h*ratio));
 let id=TROOP_TEXTURE_IDS.get(img);if(!id){id=++troopTextureSeq;TROOP_TEXTURE_IDS.set(img,id)}
 const key=id+'/'+x+'/'+y+'/'+w+'/'+h+'/'+ratio+(mirror?'/flip':'');
 let cv=TROOP_TEXTURE_LRU.get(key);
 if(cv?.getContext('2d')?.isContextLost?.()){TROOP_TEXTURE_LRU.delete(key);troopTexturePixels-=cv.width*cv.height;cv=null}
 if(cv){TROOP_TEXTURE_LRU.delete(key);TROOP_TEXTURE_LRU.set(key,cv);return cv}
 try{
  cv=document.createElement('canvas');cv.width=dw;cv.height=dh;
  const ctx=cv.getContext('2d');if(!ctx||ctx.isContextLost?.())return null;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(mirror){ctx.translate(dw,0);ctx.scale(-1,1)}
  ctx.drawImage(img,x,y,w,h,0,0,dw,dh);
  if(ctx.isContextLost?.())return null;
  TROOP_TEXTURE_LRU.set(key,cv);troopTexturePixels+=dw*dh;
  while(troopTexturePixels>TROOP_TEXTURE_PIXEL_LIMIT||TROOP_TEXTURE_LRU.size>TROOP_TEXTURE_ENTRY_LIMIT){
   const oldKey=TROOP_TEXTURE_LRU.keys().next().value,old=TROOP_TEXTURE_LRU.get(oldKey);
   TROOP_TEXTURE_LRU.delete(oldKey);troopTexturePixels-=old.width*old.height;
  }
  return cv;
 }catch(_){return null}
}
function drawPaintedTroop(g,art,x,y,scale,state,time,mirror=false,kind='',phase){
  const f=art.f,walk=state===1,attack=state===2,work=state===3;
  const motion=art.animated?null:paintedSecondaryPose(kind,state,time,phase);
   // Render at identical size; only the cached *source* is reduced at far zoom.
   const physicalScale=Math.abs(scale)*(typeof DPR==='number'?DPR:1);
   const lod=typeof zm==='number'&&zm<=1&&physicalScale<=.55&&f.w>=48&&f.h>=48?.5:1;
  // Art width/height, feet anchor and image/team palette remain unchanged.
  // Scale the offset with visible body height rather than with the source sheet.
  const unitScale=Math.max(.25,Math.min(2.5,(art.referenceHeight||f.h)*scale/(PAINT_SECONDARY[kind]==='mounted'?60:46)));
  const bob=art.animated?0:motion?motion.dy*unitScale:walk?Math.abs(Math.sin(time*10))*1.1:work?Math.sin(time*6)*.5:Math.sin(time*2)*.2;
  // drawWorld() already selects high-quality sampling. A cached original-size
  // mirrored frame also removes per-soldier save/translate/scale/restore.
  // Keep the old transform path for unsupported contexts/poses/canvas failures.
  if(!motion&&(art.animated||(!walk&&!attack))&&g.imageSmoothingEnabled===true&&g.imageSmoothingQuality==='high'){
   const frame=troopFrameTexture(art,mirror,lod);
   if(frame){
    g.drawImage(frame,x-(mirror?f.w-f.ax:f.ax)*scale,y-bob-f.ay*scale,f.w*scale,f.h*scale);
    return;
   }
   if(!mirror){
    g.drawImage(art.img,f.x,f.y,f.w,f.h,x-f.ax*scale,y-bob-f.ay*scale,f.w*scale,f.h*scale);
    return;
   }
  }
    g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.translate(x+(motion?motion.dx*unitScale:0),y-bob);
  if(mirror)g.scale(-1,1);
  if(motion){g.rotate(motion.turn);g.scale(motion.sx,motion.sy)}
  else if(walk&&!art.animated)g.rotate(Math.sin(time*10)*.018);
  else if(attack&&!art.animated)g.rotate(Math.sin(time*12)*.055);
  const frame=troopFrameTexture(art,false,lod);
  if(frame)g.drawImage(frame,-f.ax*scale,-f.ay*scale,f.w*scale,f.h*scale);
  else g.drawImage(art.img,f.x,f.y,f.w,f.h,-f.ax*scale,-f.ay*scale,f.w*scale,f.h*scale);
  g.restore();
}


// Shared by normal drawing and diagnostic-only ground-paint isolation.
function drawUnitGround(u,selectedUnits,sx,sy,z,r){
 X.fillStyle='rgba(0,0,0,.3)';X.beginPath();X.ellipse(sx,sy+z,(r+3)*z,(r+3)*z/2,0,0,7);X.fill();
 if((selectedUnits?selectedUnits.has(u):S.sel.includes(u))){X.strokeStyle='#8cff3c';X.lineWidth=2.5;X.beginPath();X.ellipse(sx,sy+z,(r+10)*z,(r+10)*z/2,0,0,7);X.stroke();X.lineWidth=1}
}

// Temporary painted ship silhouettes are shared with the Galley. These clearly
// distinguish the two new combat roles without needing additional atlas memory.
// Purely visual; both solo and team-relative multiplayer renderers call this.
function drawNavalClassMark(ctx,kind,x,y,scale,time=0){
 if(kind!=='fire'&&kind!=='demo'&&kind!=='cgal')return;
 const z=Math.max(.3,Math.min(2.5,scale)),wave=Math.sin((Number.isFinite(time)?time:0)*8)*1.5*z;
 ctx.save();ctx.translate(x,y);ctx.lineWidth=Math.max(.8,z);
 if(kind==='fire'){
  ctx.fillStyle='#ff9832';ctx.strokeStyle='#512818';ctx.beginPath();
  ctx.moveTo(-7*z,-19*z);ctx.lineTo(-4*z,-31*z-wave);ctx.lineTo(0,-25*z);ctx.lineTo(3*z,-36*z+wave);ctx.lineTo(8*z,-19*z);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffe089';ctx.beginPath();ctx.moveTo(-2*z,-20*z);ctx.lineTo(2*z,-30*z);ctx.lineTo(4*z,-20*z);ctx.closePath();ctx.fill();
 }else if(kind==='cgal'){
  // Twin artillery barrels and gold accents distinguish the shared hull.
  ctx.fillStyle='#343a40';ctx.strokeStyle='#d8bd80';ctx.lineWidth=1*z;
  for(const x0 of [-6,5]){ctx.save();ctx.translate(x0*z,-22*z);ctx.fillRect(-3*z,-3*z,6*z,13*z);ctx.strokeRect(-3*z,-3*z,6*z,13*z);ctx.fillStyle='#7e8790';ctx.fillRect(-2*z,-4*z,4*z,3*z);ctx.restore()}
  ctx.fillStyle='#e5bf5b';ctx.fillRect(-10*z,-12*z,20*z,3*z);
 }else{
  ctx.fillStyle='#f5d267';ctx.strokeStyle='#612d20';ctx.beginPath();
  ctx.moveTo(0,-31*z);ctx.lineTo(8*z,-21*z);ctx.lineTo(0,-11*z);ctx.lineTo(-8*z,-21*z);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#812b1e';ctx.fillRect(-2*z,-26*z,4*z,9*z);ctx.fillRect(-2*z,-15*z,4*z,3*z);
 }
 ctx.restore();
}

/* Original interim Elite equipment accents for painted/fallback units.
 * Dedicated illustrated Elite sprites remain a separate unfinished art gate.
 * Only the owning team's completed technology enables these visual details. */
function drawEliteUniqueUnitMark(ctx,kind,team,x,y,scale){
 if(kind!=='huskarl'&&kind!=='lbow'&&kind!=='mgd'&&kind!=='axe')return false;
 if(typeof eliteUniqueUnitUpgrade!=='function'||!eliteUniqueUnitUpgrade(kind,team))return false;
 const z=Math.max(.45,Math.min(2.4,scale));
 ctx.save();ctx.translate(x,y);ctx.scale(z,z);
 ctx.lineCap='round';ctx.lineJoin='round';
 if(kind==='huskarl'){
  ctx.fillStyle='#c6d3dd';ctx.strokeStyle='#363d44';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(-6,-37);ctx.lineTo(-6,-44);ctx.lineTo(0,-48);
  ctx.lineTo(6,-44);ctx.lineTo(6,-37);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#d3ae59';ctx.fillRect(-1.5,-49,3,10);
  ctx.fillStyle='#8c3030';ctx.beginPath();ctx.moveTo(-8,-45);
  ctx.lineTo(0,-54);ctx.lineTo(8,-45);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#dfbd65';ctx.lineWidth=2;ctx.beginPath();
  ctx.moveTo(-12,-31);ctx.lineTo(-18,-28);ctx.lineTo(-16,-19);ctx.lineTo(-11,-25);ctx.stroke();
 }else if(kind==='lbow'){
  ctx.fillStyle='#ccd6de';ctx.strokeStyle='#474e54';ctx.lineWidth=1.25;
  ctx.beginPath();ctx.moveTo(-6,-40);ctx.lineTo(0,-47);ctx.lineTo(6,-40);
  ctx.lineTo(5,-37);ctx.lineTo(-5,-37);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#d9b76f';ctx.lineWidth=2;ctx.beginPath();
  ctx.moveTo(15,-52);ctx.lineTo(26,-33);ctx.lineTo(15,-14);ctx.stroke();
  ctx.strokeStyle='#eee6d1';ctx.lineWidth=.8;ctx.beginPath();
  ctx.moveTo(15,-52);ctx.lineTo(15,-14);ctx.stroke();
  ctx.fillStyle='#a43c31';ctx.fillRect(-12,-33,4,15);
 }else if(kind==='mgd'){
  ctx.fillStyle='#dfb45e';ctx.strokeStyle='#583522';ctx.lineWidth=1.25;
  ctx.beginPath();ctx.moveTo(-7,-50);ctx.lineTo(0,-55);ctx.lineTo(7,-50);
  ctx.lineTo(5,-45);ctx.lineTo(-5,-45);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#a93635';ctx.beginPath();ctx.moveTo(-1,-56);
  ctx.lineTo(7,-65);ctx.lineTo(9,-54);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#dfb45e';ctx.lineWidth=2.5;ctx.beginPath();
  ctx.moveTo(-14,-22);ctx.lineTo(14,-22);ctx.stroke();
  ctx.fillStyle='#a93635';ctx.fillRect(-3,-25,6,6);
 }else{
  // Temporary original Frankish Elite equipment, not a dedicated painted atlas.
  ctx.fillStyle='#d4d9df';ctx.strokeStyle='#4b5059';ctx.lineWidth=1.35;
  ctx.beginPath();ctx.moveTo(-7,-38);ctx.lineTo(-5,-45);ctx.lineTo(0,-48);
  ctx.lineTo(5,-45);ctx.lineTo(7,-38);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#b33a33';ctx.beginPath();ctx.moveTo(-1,-48);
  ctx.lineTo(4,-56);ctx.lineTo(7,-45);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#9b6d3a';ctx.lineWidth=2.1;
  ctx.beginPath();ctx.moveTo(15,-49);ctx.lineTo(16,-15);ctx.stroke();
  ctx.fillStyle='#e3bf70';ctx.strokeStyle='#57412d';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(15,-52);ctx.lineTo(25,-51);ctx.lineTo(27,-44);
  ctx.lineTo(23,-38);ctx.lineTo(18,-43);ctx.lineTo(15,-40);ctx.lineTo(12,-43);
  ctx.lineTo(7,-38);ctx.lineTo(5,-44);ctx.lineTo(7,-51);ctx.closePath();
  ctx.fill();ctx.stroke();
 }
 ctx.restore();return true;
}

/* In-match troop drawing and researched equipment cues. */
function drawUnit(u,selectedUnits,screenPosition){const k=u.k,d=U[k],T=S.tech[u.t]||{},P=screenPosition||w2s(u.x,u.y),sx=P[0]+((gt-(u.hit||-9))<.15?Math.sin(gt*90)*1.5*zm:0),sy=P[1];
 if(perfUnitPass===3)return;
 // Ground-only has zero atlas lookup or sprite painting.
 if(perfUnitPass===2){drawUnitGround(u,selectedUnits,sx,sy,zm,d.r);return}
 const pose=unitVisualPose(u,S.t),heading=pose.heading,mirror=Math.cos(heading)-Math.sin(heading)<0;
const st=pose.state,fr=st===1?((gt*8+u.x*3+u.y*2)|0)&3:st===2?(u.cd<.2?1:0):st===3?((gt*5)|0)&1:0,sz=USZ(k),z=zm,af=ASSET.n?assetFrame(k,u.t,st,0,pose.time,heading,pose.phase):null,
c=af?null:spr(k+'|'+u.t+'|'+st+'|'+fr,sz[0],sz[1],g=>paintUnit(g,k,teamColor(u.t),st,fr));
if(st===1&&gq>0&&Math.random()<.04)emit('dust',u.x,u.y,1,{s:.5,vz:.4,l:.55,c:'#c9b080',r:2});
if(perfUnitPass!==1)drawUnitGround(u,selectedUnits,sx,sy,z,d.r);
/* Validated motion frames take priority; generate procedural art only if every atlas misses. */if(af?.painted){drawPaintedTroop(X,af,sx,sy,af.sc*z,st,pose.time,mirror,k,pose.phase)}else if(af){const f=af.f,sc=af.sc,yb=sy-(d.sh?Math.sin(gt*2+u.x)*1.5*z:0);X.drawImage(af.img,f.x,f.y,f.w,f.h,sx-f.ax*sc*z,yb-f.ay*sc*z,f.w*sc*z,f.h*sc*z)}else blit(c,sx,sy-(d.sh?Math.sin(gt*2+u.x)*1.5*z:0),sz[0],sz[1],mirror);
drawNavalClassMark(X,k,sx,sy,z,pose.time);
drawEliteUniqueUnitMark(X,k,u.t,sx,sy,z);
if(perfUnitPass===1)return;
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
/* A small original rank crest identifies upgraded painted cavalry. */
if((k==='knight'&&T.pala)||(k==='scout'&&T.huss)){
 X.save();X.translate(sx,sy-(sz[1]-6)*z*.9-7*z);X.scale(z,z);
 X.fillStyle='#f0c35e';X.strokeStyle='#302315';X.lineWidth=1;
 X.beginPath();X.moveTo(0,-4);X.lineTo(3,0);X.lineTo(0,4);X.lineTo(-3,0);X.closePath();X.fill();X.stroke();X.restore();
}
if(u.car>0&&u.ct){X.fillStyle={f:'#e0554f',w:'#9a6b3a',g:'#f2c14e',s:'#b0b8bf'}[u.ct];X.fillRect(sx-4*z,sy-(sz[1]-16)*z*.55,8*z,6*z)}
const mh=mhp(u);if(u.hp<mh)bar(sx-13*z,sy-(sz[1]-6)*z*.9,26*z,u.hp/mh,'#6e6')}

