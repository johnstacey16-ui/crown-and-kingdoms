/* Resource-node art, neutral painted resource atlas crops and fallback drawing.
 * Extracted without changing the painted frames, sight memory or sprite caching.
 * The depth-sorted world draw remains owned by js/render.js. */
function paintNode(g,kind,v){const E='#1a1410';if(kind==='w'){g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(6,2,17,6,0,0,7);g.fill();if(v<.34){g.fillStyle=lin(g,-3,0,3,0,'#4a2e14','#7a5028');g.fillRect(-2.6,-16,5.2,17);for(let k=0;k<4;k++){const by=-14-k*10,w=15-k*3;pg(g,[[-w,by],[w,by],[0,by-17]],lin(g,-w,0,w,0,'#1c5a30','#2f8a4a'),E,.7);pg(g,[[-w+1,by-1],[0,by-16],[-w*.12,by-2]],'rgba(143,205,105,.38)',null);pg(g,[[0,by-16],[w-1,by-1],[w*.5,by-2]],'rgba(0,0,0,.13)',null)}g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=1;g.beginPath();g.moveTo(-3,-30);g.lineTo(-9,-16);g.stroke()}else if(v<.67){g.fillStyle=lin(g,-3,0,3,0,'#4a2e14','#8a6030');g.beginPath();g.moveTo(-3.4,1);g.lineTo(-2,-18);g.lineTo(2,-18);g.lineTo(3.4,1);g.fill();g.stroke();for(const q of[[0,-27,14],[-8,-22,10],[8,-21,10],[-3,-34,9],[5,-32,8]]){const rg=g.createRadialGradient(q[0]-3,q[1]-4,1,q[0],q[1],q[2]);rg.addColorStop(0,'#78c060');rg.addColorStop(1,'#2a6a2c');g.fillStyle=rg;g.beginPath();g.arc(q[0],q[1],q[2],0,7);g.fill()}g.strokeStyle='rgba(0,30,0,.4)';g.lineWidth=1;g.beginPath();g.arc(0,-27,14,.3,2.8);g.stroke()}else{g.fillStyle=lin(g,-2,0,2,0,'#e8e4d8','#a8a498');g.fillRect(-2.2,-22,4.4,23);g.fillStyle='#333';for(let k=0;k<4;k++)g.fillRect(-2.2,-4-k*5,2.6,1.2);for(const q of[[0,-30,11],[-6,-25,8],[7,-26,8],[0,-38,7]]){const rg=g.createRadialGradient(q[0]-2,q[1]-3,1,q[0],q[1],q[2]);rg.addColorStop(0,'#c8e090');rg.addColorStop(1,'#6a9a3a');g.fillStyle=rg;g.beginPath();g.arc(q[0],q[1],q[2],0,7);g.fill()}}}
else if(kind==='f'){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(0,1,14,5,0,0,7);g.fill();for(const q of[[-6,-6,8],[5,-7,8],[0,-11,7],[-1,-4,7]]){const rg=g.createRadialGradient(q[0]-2,q[1]-3,1,q[0],q[1],q[2]);rg.addColorStop(0,'#6ab04c');rg.addColorStop(1,'#2a6a28');g.fillStyle=rg;g.beginPath();g.arc(q[0],q[1],q[2],0,7);g.fill()}for(const q of[[-7,-7],[3,-12],[7,-5],[-2,-4],[1,-8]]){g.fillStyle='#d4373a';g.beginPath();g.arc(q[0],q[1],2.4,0,7);g.fill();g.fillStyle='rgba(255,255,255,.6)';g.fillRect(q[0]-1,q[1]-1.4,.9,.9)}}
else if(kind==='d'){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(0,1,11,4,0,0,7);g.fill();g.strokeStyle='#5a3a1c';g.lineWidth=1.8;for(const o of[-6,-3,4,7]){g.beginPath();g.moveTo(o,-7);g.lineTo(o+.5,1);g.stroke()}g.fillStyle=lin(g,0,-16,0,-5,'#c08a50','#8a5a2a');g.beginPath();g.ellipse(0,-10,10,5,0,0,7);g.fill();g.stroke();g.fillStyle='rgba(255,255,255,.55)';for(const q of[[-3,-12],[1,-13],[4,-10],[-1,-9]]){g.beginPath();g.arc(q[0],q[1],.9,0,7);g.fill()}pg(g,[[7,-12],[10,-19],[13,-18],[11,-11]],'#a8723e',E,.7);g.fillStyle='#a8723e';g.beginPath();g.ellipse(12,-19,3.2,2.2,.3,0,7);g.fill();g.stroke();g.strokeStyle='#d8c8a0';g.lineWidth=1.2;g.beginPath();g.moveTo(11,-21);g.lineTo(9,-26);g.moveTo(10,-23);g.lineTo(7,-24);g.moveTo(13,-21);g.lineTo(15,-27);g.moveTo(14,-24);g.lineTo(17,-25);g.stroke()}
else{const gold=kind==='g';g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(0,2,16,6,0,0,7);g.fill();pg(g,[[-15,1],[-9,-12],[-1,-17],[8,-12],[15,-2],[9,3],[-9,3]],lin(g,-15,-17,15,3,'#8a857c','#4a463e'),E,.9);pg(g,[[-9,-12],[-1,-17],[2,-8],[-6,-5]],'#a8a49a',null);g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=.8;g.beginPath();g.moveTo(-9,-12);g.lineTo(-1,-17);g.lineTo(8,-12);g.stroke();g.strokeStyle='rgba(22,20,17,.32)';g.beginPath();g.moveTo(-6,-5);g.lineTo(2,-8);g.lineTo(8,-1);g.stroke();pg(g,[[-8,-3],[-2,-12],[6,-8],[8,-1],[0,2]],gold?lin(g,-8,-12,8,2,'#f6d65a','#a87b12'):lin(g,-8,-12,8,2,'#c2c9ce','#6a727a'),E,.7);g.fillStyle=gold?'#fff3a0':'#fff';g.fillRect(-3,-9,2,2);g.fillRect(3,-6,1.6,1.6)}}
// Cache high-resolution but small static resource crops instead of sampling
// huge painted atlases every frame on Xbox Edge. Team-colour image identity
// weakly keys the cache, so reloaded/new art never reuses stale texture pixels.
// Static crops share one LRU across source atlases. Bound retained native
// canvases on Xbox Edge without changing rendered dimensions or atlas fallbacks.
const NODE_TEXTURE_PIXEL_LIMIT=2*1024*1024,NODE_TEXTURE_ENTRY_LIMIT=128; // 8 MiB RGBA
const NODE_TEXTURE_CACHE=new WeakMap(),NODE_TEXTURE_RECENCY=new Map();
let nodeTextureSeq=0,NODE_TEXTURE_PIXELS=0;
function paintedNodeTexture(painted,width){
 if(!painted?.img||!painted.f||typeof painted.img!=='object')return null;
 const f=painted.f,img=painted.img,reference=painted.referenceWidth||f.w;
 if(![f.x,f.y,f.w,f.h,reference,width].every(Number.isFinite)||
    f.x<0||f.y<0||f.w<=0||f.h<=0||reference<=0||width<=0)return null;
 const scale=2*width/reference,w=Math.max(1,Math.round(f.w*scale)),
       h=Math.max(1,Math.round(f.h*scale)),pixels=w*h;
 // Oversized frames render directly from their original atlas without caching.
 if(!Number.isSafeInteger(pixels)||pixels>NODE_TEXTURE_PIXEL_LIMIT)return null;
 let entry=NODE_TEXTURE_CACHE.get(img);
 if(!entry){entry={id:++nodeTextureSeq,frames:new Map()};NODE_TEXTURE_CACHE.set(img,entry)}
 const frames=entry.frames,key=[f.x,f.y,f.w,f.h,width,reference].join('/'),
       recencyKey=entry.id+'/'+key;
 if(frames.has(key)){
  const canvas=frames.get(key);NODE_TEXTURE_RECENCY.delete(recencyKey);
  NODE_TEXTURE_RECENCY.set(recencyKey,{frames,key,canvas});return canvas;
 }
 try{
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const g=canvas.getContext('2d');if(!g)return null;
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(img,f.x,f.y,f.w,f.h,0,0,w,h);
  canvas.paintedAtlas=!!painted.painted;canvas.paintedTeam=img.paintedTeam??null;
  frames.set(key,canvas);NODE_TEXTURE_RECENCY.set(recencyKey,{frames,key,canvas});
  NODE_TEXTURE_PIXELS+=pixels;
  while(NODE_TEXTURE_PIXELS>NODE_TEXTURE_PIXEL_LIMIT||NODE_TEXTURE_RECENCY.size>NODE_TEXTURE_ENTRY_LIMIT){
   const oldestKey=NODE_TEXTURE_RECENCY.keys().next().value,oldest=NODE_TEXTURE_RECENCY.get(oldestKey);
   NODE_TEXTURE_RECENCY.delete(oldestKey);oldest.frames.delete(oldest.key);
   NODE_TEXTURE_PIXELS-=oldest.canvas.width*oldest.canvas.height;
  }
  return canvas;
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
const painted=paintedEnvironmentFrame(n,S.t)||paintedResourceFrame(n.k,n.x,n.y,n.an||n.fi||n.fm||n.trap,resourceVisualAmount(n,!!S.vs[i]))||(ASSET.n?assetFrame(n.fm?'bld_farm':n.k==='w'?'node_tree':'none',n.t||0,0,0,gt):null);if(painted?.painted){const f=painted.f,sc=paintedResourceWidth(n,painted)/(painted.referenceWidth||f.w)*zm,flip=!n.fm&&v<.5,
 dx=flip?-f.ax*sc:P[0]-f.ax*sc,dy=flip?-f.ay*sc:P[1]+4*zm-f.ay*sc;
 const cached=paintedNodeTexture(painted,paintedResourceWidth(n,painted));
 // Nonmirrored resources draw at identical absolute positions without transforms.
 if(flip){X.save();X.translate(P[0],P[1]+4*zm);X.scale(-1,1)}
 if(cached)X.drawImage(cached,dx,dy,f.w*sc,f.h*sc);
 else X.drawImage(painted.img,f.x,f.y,f.w,f.h,dx,dy,f.w*sc,f.h*sc);
 if(flip)X.restore();
 X.globalAlpha=1;return;}
if(n.fi){const sx=P[0],sy=P[1],z=zm,r=(6+Math.sin(gt*2+n.x)*2)*z;if(n.trap){X.strokeStyle='#d7b36a';X.lineWidth=2*z;X.beginPath();X.ellipse(sx,sy+2*z,13*z,6*z,0,0,7);X.stroke();X.strokeStyle='#8b6b3b';X.beginPath();X.moveTo(sx-8*z,sy);X.lineTo(sx+8*z,sy+3*z);X.moveTo(sx+6*z,sy-4*z);X.lineTo(sx-5*z,sy+5*z);X.stroke();}X.strokeStyle='rgba(255,255,255,.5)';X.beginPath();X.ellipse(sx,sy,r+6*z,(r+6*z)/2,0,0,7);X.stroke();X.fillStyle='#d8eef6';X.beginPath();X.ellipse(sx,sy-2*z,8*z,3.5*z,0,0,7);X.fill();X.fillStyle='#8cc0d6';poly([[sx+7*z,sy-2*z],[sx+12*z,sy-6*z],[sx+12*z,sy+2*z]]);X.fill()}
else if(n.fm){const z=zm,st=Math.min(3,(n.amt/110)|0),c=spr('farm|'+st,70,40,g=>{pg(g,[[0,5],[30,-8],[0,-21],[-30,-8]],lin(g,0,-21,0,5,'#9a7a44','#6a4a22'),'#2a1a0a',1);for(let r=-3;r<=3;r++){g.strokeStyle='rgba(40,20,5,.5)';g.lineWidth=1;g.beginPath();g.moveTo(-22+r*4+8,-4+r*2-10);g.lineTo(2+r*4+8,8+r*2-12);g.stroke();if(st>0)for(let q=0;q<5;q++){g.fillStyle=st>2?'#d8b84a':'#6aa83a';g.fillRect(-18+r*4+q*5+8,-8+r*2+q*2.3-10-st*1.6,1.6,2+st*1.8);if(st>=2){const fx=-18+r*4+q*5+8,fy=-8+r*2+q*2.3-10-st*1.6;g.strokeStyle='rgba(226,197,105,.9)';g.lineWidth=.7;g.beginPath();g.moveTo(fx+.7,fy);g.lineTo(fx+1.2,fy-3);g.stroke();g.fillStyle=st>2?'#f0d477':'#b7bd50';g.beginPath();g.ellipse(fx+1.2,fy-3,1.1,.65,-.5,0,Math.PI*2);g.fill()}}}});blit(c,P[0],P[1]+4*z,70,40,false)}
else{const kind=n.an?'d':n.k,vv=kind==='w'?(v<.34?0:v<.67?1:2):0,sz=kind==='w'?[64,84]:[48,44],c=spr('n|'+kind+'|'+vv,sz[0],sz[1],g=>paintNode(g,kind,kind==='w'?v:0));blit(c,P[0],P[1]+4*zm,sz[0],sz[1],false)}
X.globalAlpha=1}

