/* ===== PAINTED RASTER GRAPHICS =====
 * Original textured medieval WebP sprites replace the discarded pixel icons.
 * Sprite bounds and foot anchors live in assets/atlas-manifest.json.
 * Artwork, terrain and visual motion are presentation-only.
 */
const PAINT={terrain:null,facing:new WeakMap(),motion:new WeakMap(),resourceAmounts:new WeakMap(),buildingAges:new WeakMap(),buildingConstruction:new WeakMap(),buildingDamage:new WeakMap()};
/* Painted terrain sampling and bounded edge blending: js/render-terrain.js. */
/* Troop animation, frame cache and fallback: js/render-troops.js. */
/* Projectile drawing: js/render-effects.js. */
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

function drawWorld(){const selectedUnits=new Set(S.sel);X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';const cs4=[[0,0],[CW,0],[0,CH],[CW,CH]].map(p=>s2w(p[0],p[1])),xs=cs4.map(p=>p[0]),ys=cs4.map(p=>p[1]),x0=Math.max(0,Math.floor(Math.min(...xs))-1),x1=Math.min(W-1,Math.ceil(Math.max(...xs))+1),y0=Math.max(0,Math.floor(Math.min(...ys))-1),y1=Math.min(H-1,Math.ceil(Math.max(...ys))+1),hw=TW/2,hh2=TH/2,L=[],fogHidden=[],fogExplored=[],timed=!!perfHud,startChunk=timed?performance.now():0;const useChunks=CHK&&perfLayerMode!==2&&drawChunks(x0,x1,y0,y1)!==false;
if(timed)perfChunksMs=performance.now()-startChunk;
const startTiles=timed?performance.now():0;
for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x,cx=(x-y)*hw-cam.x,cy=(x+y+1)*hh2-cam.y;if(cx<-hw||cx>CW+hw||cy<-hh2-50||cy>CH+hh2+50)continue;const wv=S.wt[i],hv=useChunks?0:hsh(x,y);
if(perfLayerMode!==2){if(useChunks){if(S.ex[i]&&wv===1&&((x+y)&1)&&Math.sin(gt*1.6+x*.8+y*.6)>.55){X.strokeStyle='rgba(255,255,255,.28)';X.beginPath();X.moveTo(cx-8*zm,cy);X.lineTo(cx+6*zm,cy);X.stroke()}}else if(wv){const sh=wv===2;X.fillStyle=sh?'#68b3cd':hv<.5?'#2a6aa3':'#2c70ab';dia(cx,cy,hw+1,hh2+1);X.fill();
if(!sh){if(Math.sin(gt*1.6+x*.8+y*.6)>.55){X.strokeStyle='rgba(255,255,255,.28)';X.beginPath();X.moveTo(cx-8,cy);X.lineTo(cx+6,cy);X.stroke()}
if((x>0&&!S.wt[i-1])||(x<W-1&&!S.wt[i+1])||(y>0&&!S.wt[i-W])||(y<H-1&&!S.wt[i+W])){X.strokeStyle='rgba(235,248,255,.5)';X.lineWidth=2;dia(cx,cy,hw-2,hh2-1);X.stroke();X.lineWidth=1}}else{X.fillStyle='rgba(240,225,170,.4)';X.fillRect(cx-6+hv*10,cy-1,3,2)}}
else{const coast=(x>0&&S.wt[i-1]===1)||(x<W-1&&S.wt[i+1]===1)||(y>0&&S.wt[i-W]===1)||(y<H-1&&S.wt[i+W]===1),dirt=hsh(x>>2,y>>2)<.1,pn=hsh((x>>3)+99,(y>>3)+7);X.fillStyle=coast?'#cdbd82':dirt?(hv<.5?'#8d7b4c':'#867449'):(pn<.25?GCd:pn>.8?GCl:GC)[(hv*6)|0];dia(cx,cy,hw+1,hh2+1);X.fill();
if(!coast&&!dirt){if(hv>.8){X.strokeStyle='#3e7a30';X.lineWidth=1;X.beginPath();X.moveTo(cx-6,cy+2);X.lineTo(cx-4,cy-3);X.moveTo(cx-3,cy+2);X.lineTo(cx-2,cy-4);X.moveTo(cx+3,cy+3);X.lineTo(cx+4,cy-2);X.stroke()}else if(hv<.03){X.fillStyle=hv<.015?'#f4e04d':'#f2f2f2';X.fillRect(cx+hv*100-1,cy-1,3,3)}const tuft=hsh(x*13+7,y*19+3);if(tuft>.91){const tx=cx+(hsh(x+31,y+17)-.5)*14,ty=cy+(hsh(x+11,y+41)-.5)*6;X.strokeStyle=tuft>.97?'#577d35':'#426d2d';X.lineWidth=1;X.beginPath();X.moveTo(tx-3,ty+2);X.lineTo(tx-4,ty-2);X.moveTo(tx,ty+2);X.lineTo(tx,ty-4);X.moveTo(tx+3,ty+2);X.lineTo(tx+5,ty-1);X.stroke();if(tuft>.985){X.fillStyle='#d8c57b';X.beginPath();X.arc(tx+1,ty-4,1.2,0,7);X.fill()}}}else if(dirt&&!coast&&hv>.45){const peb=hsh(x*5+81,y*7+29);if(peb>.87){X.fillStyle=peb>.96?'rgba(205,190,151,.7)':'rgba(63,51,35,.45)';X.beginPath();X.ellipse(cx+(hv-.5)*12,cy+(peb-.9)*12,1.8,1,0,0,7);X.fill()}}}
}
if(!S.ex[i]){if(perfLayerMode!==2)fogHidden.push(cx,cy)}else{if(!S.vs[i]&&perfLayerMode!==2)fogExplored.push(cx,cy);const n=S.nd[i];if(n&&n.amt>0)L.push([x+y+1,0,n])}}
const startFog=timed?performance.now():0;
if(perfLayerMode!==2){
 paintFogLayer(fogHidden,hw+1.5,hh2+1.5,'#000');
 paintFogLayer(fogExplored,hw+1,hh2+1,'rgba(0,0,0,.42)');
}
if(timed){perfFogMs=perfLayerMode===2?0:performance.now()-startFog;perfTilesMs=performance.now()-startTiles;}
if(perfLayerMode===1){perfNodeMs=perfBuildingMs=perfUnitMs=perfOtherWorldMs=0;perfNodeCount=perfBuildingCount=perfUnitCount=0;if(timed){perfObjectsMs=0;perfEffectsMs=0}return}
const startObjects=timed?performance.now():0;
// Opt-in object isolation excludes corpses and rubble from category samples.
if(!perfObjectPass){for(const q of rub){const age=gt-q.t;if(age>40||!Number.isFinite(q.x)||!Number.isFinite(q.y)||q.x+q.s<x0-2||q.x>x1+2||q.y+q.s<y0-2||q.y>y1+2||!S.ex[q.y*W+q.x])continue;const N=w2s(q.x,q.y),E=w2s(q.x+q.s,q.y),Sx=w2s(q.x+q.s,q.y+q.s),Wv=w2s(q.x,q.y+q.s);X.globalAlpha=Math.min(1,(40-age)/10);X.fillStyle='#5b4a38';poly([N,E,Sx,Wv]);X.fill();X.fillStyle='#8a8378';for(let k=0;k<q.s*3;k++){const a=hsh(q.x*7+k,q.y*5)*q.s,b=hsh(q.y*3+k,q.x*11)*q.s,P=w2s(q.x+a,q.y+b);X.fillRect(P[0]-3,P[1]-3,6,4)}if(age<4){X.fillStyle='rgba(120,110,100,'+(.5-age/8)+')';const C=w2s(q.x+q.s/2,q.y+q.s/2);X.beginPath();X.arc(C[0],C[1]-12-age*8,16+age*4,0,7);X.fill()}X.globalAlpha=1}
for(const c of corp){const age=gt-c.t;if(age>10||!Number.isFinite(c.x)||!Number.isFinite(c.y)||c.x<x0-3||c.x>x1+3||c.y<y0-3||c.y>y1+3)continue;const P=w2s(c.x,c.y),sz=USZ(c.k),body=ASSET.n?assetFrame(c.k,c.tm,0,0,gt):null,sp=body?null:spr(c.k+'|'+c.tm+'|0|0',sz[0],sz[1],g=>paintUnit(g,c.k,teamColor(c.tm),0,0));X.save();X.translate(P[0],P[1]);X.globalAlpha=Math.min(1,(10-age)/4);
if(c.sh){const k2=Math.min(1,age/1.2);X.translate(0,k2*18*zm);X.scale(1,1-k2*.5);X.globalAlpha*=1-k2*.6}else{const a=Math.min(1,age/.55);if(c.fd<0)X.scale(-1,1);X.rotate(a*1.45);X.translate(0,a*2*zm)}
if(body){const f=body.f,sc=body.sc*zm;X.drawImage(body.img,f.x,f.y,f.w,f.h,-f.ax*sc,-f.ay*sc,f.w*sc,f.h*sc)}else X.drawImage(sp,-sz[0]/2*zm,-(sz[1]-8)*zm,sz[0]*zm,sz[1]*zm);X.restore()}X.globalAlpha=1
}
for(const b of S.bs){if(!Number.isFinite(b.x)||!Number.isFinite(b.y)||b.x+b.s<x0-5||b.x>x1+5||b.y+b.s<y0-5||b.y>y1+5)continue;if(b.t!==0&&!S.ex[b.y*W+b.x])continue;const P=w2s(b.x+b.s/2,b.y+b.s/2);if(P[0]<-160||P[0]>CW+160||P[1]<-180||P[1]>CH+180)continue;L.push([b.x+b.y+b.s,1,b])}
for(const u of S.us){if(u.ld||u.hp<=0||!Number.isFinite(u.x)||!Number.isFinite(u.y)||u.x<x0-2||u.x>x1+2||u.y<y0-2||u.y>y1+2||!vis(u))continue;const P=w2s(u.x,u.y),margin=120*zm;if(P[0]<-margin||P[0]>CW+margin||P[1]<-margin||P[1]>CH+margin)continue;L.push([u.x+u.y,2,u,P])}
for(const q of S.rel){const p=q.c||q;if(!q.m&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=x0-2&&p.x<=x1+2&&p.y>=y0-2&&p.y<=y1+2&&(q.c?vis(q.c):S.ex[(p.y|0)*W+(p.x|0)]))L.push([p.x+p.y,3,q]);}
if(window.CK_NET&&window.CK_NET.isRunning())for(const marker of window.CK_NET.getRenderEntries())if(Number.isFinite(marker.x)&&Number.isFinite(marker.y)&&marker.x>=x0-2&&marker.x<=x1+2&&marker.y>=y0-2&&marker.y<=y1+2)L.push([marker.x+marker.y,4,marker]);
if(vm===5&&S.ex[(H/2|0)*W+(W/2|0)])L.push([W-.5,5,{x:W/2,y:H/2}]);L.sort((a,b)=>a[0]-b[0]);perfNodeMs=perfBuildingMs=perfUnitMs=perfOtherWorldMs=0;perfNodeCount=perfBuildingCount=perfUnitCount=0;
for(const it of L){
 const k=it[1],o=it[2];
 if(perfObjectPass&&k!==(perfObjectPass===1?2:perfObjectPass===2?1:0))continue;
 const ts=timed?performance.now():0;
 if(k===0)drawNode(o);
 else if(k===1)drawBld(o);
 else if(k===2)drawUnit(o,selectedUnits,it[3]);
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
if(perfObjectPass){perfEffectsMs=0;return}
const startEffects=timed?performance.now():0;
if(S.flare&&S.t-S.flare.t<3){const P=w2s(S.flare.x,S.flare.y);X.strokeStyle='#fff';X.lineWidth=3;X.beginPath();X.ellipse(P[0],P[1],(20+((S.t*30)%24))*zm,(10+((S.t*15)%12))*zm,0,0,7);X.stroke();X.lineWidth=1}
for(const b of S.sel)if(b.rally){const P=w2s(b.rally.x,b.rally.y);X.fillStyle='#ffd24a';X.fillRect(P[0],P[1]-18,3,18);poly([[P[0]+3,P[1]-18],[P[0]+15,P[1]-14],[P[0]+3,P[1]-9]]);X.fill()}
drawP();X.lineWidth=2;for(const p of S.pj){if(!p||p.dead||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<x0-2||p.x>x1+2||p.y<y0-2||p.y>y1+2||p.x<0||p.y<0||p.x>=W||p.y>=H||!S.vs[(p.y|0)*W+(p.x|0)])continue;const P=w2s(p.x,p.y),heading=projectileVisualHeading(p)??0,a=Math.atan2((Math.cos(heading)+Math.sin(heading))*TH,(Math.cos(heading)-Math.sin(heading))*TW);drawProjectileArtwork(X,P[0],P[1]-10*zm,a,projectileVisualStyle(p.a?.k),S.t,zm)}
for(const f of fx){if(!Number.isFinite(f.x)||!Number.isFinite(f.y)||f.x<x0-2||f.x>x1+2||f.y<y0-2||f.y>y1+2)continue;const P=w2s(f.x,f.y);if(f.k==='h'){X.strokeStyle='#ff6a4a';X.beginPath();for(let a=0;a<6;a++){X.moveTo(P[0],P[1]-8);X.lineTo(P[0]+Math.cos(a*1.05)*9,P[1]-8+Math.sin(a*1.05)*9)}X.stroke()}else{const r=20*(1.5-f.l*2);X.strokeStyle='#fff';X.beginPath();X.ellipse(P[0],P[1],r,r/2,0,0,7);X.stroke()}}X.lineWidth=1;
if(place&&place.x!==undefined){const k=place.k,f={x:place.x,y:place.y,s:B[k].s,k,t:0,done:true,hp:1,mh:1,pr:1,q:[]};drawBld(f,1);X.fillStyle=place.ok?'rgba(80,255,120,.5)':'rgba(255,70,70,.5)';poly([w2s(f.x,f.y),w2s(f.x+f.s,f.y),w2s(f.x+f.s,f.y+f.s),w2s(f.x,f.y+f.s)]);X.fill()}if(timed)perfEffectsMs=performance.now()-startEffects;}

/* In-match troop drawing: js/render-troops.js. */
function drawRelic(q){const point=q.c||q,P=w2s(point.x,point.y),sx=P[0],y=P[1]-(q.c?24:6),g=.5+.5*Math.sin(gt*3);X.fillStyle='rgba(255,226,102,'+(.15+.15*g)+')';X.beginPath();X.arc(sx,y,13+g*3,0,7);X.fill();if(drawPaintedRelic(X,sx,y+9*zm,(q.c?20:28)*zm))return;X.fillStyle='#ffe066';X.strokeStyle='#a87b12';poly([[sx,y-9],[sx+7,y],[sx,y+9],[sx-7,y]]);X.fill();X.stroke()}
/* Terrain landmarks, chunks and viewport: js/render-terrain.js. */
/* Effects and sprite warm-up: js/render-effects.js. */
/* Building rendering lives in js/render-buildings.js. */
/* Resource-node art, original resource crop cache and fallback: js/render-resources.js. */
/* Procedural character, siege, naval and sprite-cache drawing. */
// The procedural fallback is rare with complete atlases, but must remain
// bounded when assets are missing or many team/pose variants are requested.
const SPC=new Map(),SPC_PIXEL_LIMIT=2*1024*1024; // 8 MiB RGBA
let SPC_PIXELS=0;
function clearProceduralSpriteCache(){SPC.clear();SPC_PIXELS=0}
function spr(key,w,h,fn){
 let c=SPC.get(key);
 if(c){SPC.delete(key);SPC.set(key,c);return c}
 c=document.createElement('canvas');c.width=w*2;c.height=h*2;
 const g=c.getContext('2d');g.scale(2,2);g.translate(w/2,h-8);
 g.lineJoin='round';g.lineCap='round';fn(g);
 const pixels=c.width*c.height;
 // A single oversized asset still renders, but is never cached.
 if(pixels<=SPC_PIXEL_LIMIT){
  while(SPC.size&&SPC_PIXELS+pixels>SPC_PIXEL_LIMIT){
   const oldest=SPC.keys().next().value,prior=SPC.get(oldest);
   SPC_PIXELS-=prior.width*prior.height;SPC.delete(oldest);
  }
  SPC.set(key,c);SPC_PIXELS+=pixels;
 }
 return c;
}
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
 perfChunksMs=perfTilesMs=perfFogMs=perfObjectsMs=perfEffectsMs=0;perfNodeMs=perfBuildingMs=perfUnitMs=perfOtherWorldMs=0;perfNodeCount=perfBuildingCount=perfUnitCount=0;
}else drawWorld();
const uiStart=perfHud?performance.now():0;
drawXboxHudOverlays(dt);
if(perfHud)perfUiMs=performance.now()-uiStart}
