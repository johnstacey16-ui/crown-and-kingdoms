function drawWorld(){X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';const cs4=[[0,0],[CW,0],[0,CH],[CW,CH]].map(p=>s2w(p[0],p[1])),xs=cs4.map(p=>p[0]),ys=cs4.map(p=>p[1]),x0=Math.max(0,Math.floor(Math.min(...xs))-1),x1=Math.min(W-1,Math.ceil(Math.max(...xs))+1),y0=Math.max(0,Math.floor(Math.min(...ys))-1),y1=Math.min(H-1,Math.ceil(Math.max(...ys))+1),hw=TW/2,hh2=TH/2,L=[];if(CHK)drawChunks(x0,x1,y0,y1);
for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x,cx=(x-y)*hw-cam.x,cy=(x+y+1)*hh2-cam.y;if(cx<-hw||cx>CW+hw||cy<-hh2-50||cy>CH+hh2+50)continue;const wv=S.wt[i],hv=hsh(x,y);
if(CHK){if(wv===1&&((x+y)&1)&&Math.sin(gt*1.6+x*.8+y*.6)>.55){X.strokeStyle='rgba(255,255,255,.28)';X.beginPath();X.moveTo(cx-8*zm,cy);X.lineTo(cx+6*zm,cy);X.stroke()}}else if(wv){const sh=wv===2;X.fillStyle=sh?'#68b3cd':hv<.5?'#2a6aa3':'#2c70ab';dia(cx,cy,hw+1,hh2+1);X.fill();
if(!sh){if(Math.sin(gt*1.6+x*.8+y*.6)>.55){X.strokeStyle='rgba(255,255,255,.28)';X.beginPath();X.moveTo(cx-8,cy);X.lineTo(cx+6,cy);X.stroke()}
if((x>0&&!S.wt[i-1])||(x<W-1&&!S.wt[i+1])||(y>0&&!S.wt[i-W])||(y<H-1&&!S.wt[i+W])){X.strokeStyle='rgba(235,248,255,.5)';X.lineWidth=2;dia(cx,cy,hw-2,hh2-1);X.stroke();X.lineWidth=1}}else{X.fillStyle='rgba(240,225,170,.4)';X.fillRect(cx-6+hv*10,cy-1,3,2)}}
else{const coast=(x>0&&S.wt[i-1]===1)||(x<W-1&&S.wt[i+1]===1)||(y>0&&S.wt[i-W]===1)||(y<H-1&&S.wt[i+W]===1),dirt=hsh(x>>2,y>>2)<.1,pn=hsh((x>>3)+99,(y>>3)+7);X.fillStyle=coast?'#cdbd82':dirt?(hv<.5?'#8d7b4c':'#867449'):(pn<.25?GCd:pn>.8?GCl:GC)[(hv*6)|0];dia(cx,cy,hw+1,hh2+1);X.fill();
if(!coast&&!dirt){if(hv>.8){X.strokeStyle='#3e7a30';X.lineWidth=1;X.beginPath();X.moveTo(cx-6,cy+2);X.lineTo(cx-4,cy-3);X.moveTo(cx-3,cy+2);X.lineTo(cx-2,cy-4);X.moveTo(cx+3,cy+3);X.lineTo(cx+4,cy-2);X.stroke()}else if(hv<.03){X.fillStyle=hv<.015?'#f4e04d':'#f2f2f2';X.fillRect(cx+hv*100-1,cy-1,3,3)}const tuft=hsh(x*13+7,y*19+3);if(tuft>.91){const tx=cx+(hsh(x+31,y+17)-.5)*14,ty=cy+(hsh(x+11,y+41)-.5)*6;X.strokeStyle=tuft>.97?'#577d35':'#426d2d';X.lineWidth=1;X.beginPath();X.moveTo(tx-3,ty+2);X.lineTo(tx-4,ty-2);X.moveTo(tx,ty+2);X.lineTo(tx,ty-4);X.moveTo(tx+3,ty+2);X.lineTo(tx+5,ty-1);X.stroke();if(tuft>.985){X.fillStyle='#d8c57b';X.beginPath();X.arc(tx+1,ty-4,1.2,0,7);X.fill()}}}else if(dirt&&!coast&&hv>.45){const peb=hsh(x*5+81,y*7+29);if(peb>.87){X.fillStyle=peb>.96?'rgba(205,190,151,.7)':'rgba(63,51,35,.45)';X.beginPath();X.ellipse(cx+(hv-.5)*12,cy+(peb-.9)*12,1.8,1,0,0,7);X.fill()}}}
if(!S.ex[i]){X.fillStyle='#000';dia(cx,cy,hw+1.5,hh2+1.5);X.fill()}else{if(!S.vs[i]){X.fillStyle='rgba(0,0,0,.42)';dia(cx,cy,hw+1,hh2+1);X.fill()}const n=S.nd[i];if(n&&n.amt>0)L.push([x+y+1,0,n])}}
for(const q of rub){const age=gt-q.t;if(age>40||!S.ex[q.y*W+q.x])continue;const N=w2s(q.x,q.y),E=w2s(q.x+q.s,q.y),Sx=w2s(q.x+q.s,q.y+q.s),Wv=w2s(q.x,q.y+q.s);X.globalAlpha=Math.min(1,(40-age)/10);X.fillStyle='#5b4a38';poly([N,E,Sx,Wv]);X.fill();X.fillStyle='#8a8378';for(let k=0;k<q.s*3;k++){const a=hsh(q.x*7+k,q.y*5)*q.s,b=hsh(q.y*3+k,q.x*11)*q.s,P=w2s(q.x+a,q.y+b);X.fillRect(P[0]-3,P[1]-3,6,4)}if(age<4){X.fillStyle='rgba(120,110,100,'+(.5-age/8)+')';const C=w2s(q.x+q.s/2,q.y+q.s/2);X.beginPath();X.arc(C[0],C[1]-12-age*8,16+age*4,0,7);X.fill()}X.globalAlpha=1}
for(const c of corp){const age=gt-c.t;if(age>10)continue;const P=w2s(c.x,c.y),sz=USZ(c.k),sp=spr(c.k+'|'+c.tm+'|0|0',sz[0],sz[1],g=>paintUnit(g,c.k,teamColor(c.tm),0,0));X.save();X.translate(P[0],P[1]);X.globalAlpha=Math.min(1,(10-age)/4);
if(c.sh){const k2=Math.min(1,age/1.2);X.translate(0,k2*18*zm);X.scale(1,1-k2*.5);X.globalAlpha*=1-k2*.6}else{const a=Math.min(1,age/.55);if(c.fd<0)X.scale(-1,1);X.rotate(a*1.45);X.translate(0,a*2*zm)}
X.drawImage(sp,-sz[0]/2*zm,-(sz[1]-8)*zm,sz[0]*zm,sz[1]*zm);X.restore()}X.globalAlpha=1
for(const b of S.bs){if(b.t!==0&&!S.ex[b.y*W+b.x])continue;const P=w2s(b.x+b.s/2,b.y+b.s/2);if(P[0]<-160||P[0]>CW+160||P[1]<-180||P[1]>CH+180)continue;L.push([b.x+b.y+b.s,1,b])}
for(const u of S.us){if(u.ld||!vis(u))continue;const P=w2s(u.x,u.y);if(P[0]<-40||P[0]>CW+40||P[1]<-60||P[1]>CH+60)continue;L.push([u.x+u.y,2,u])}
for(const q of S.rel)if(!q.m&&(q.c||S.ex[(q.y|0)*W+(q.x|0)]))L.push([q.x+q.y,3,q]);
if(window.CK_NET&&window.CK_NET.isRunning())for(const marker of window.CK_NET.getRenderEntries())L.push([marker.x+marker.y,4,marker]);
if(vm===5&&S.ex[(H/2|0)*W+(W/2|0)])L.push([W-.5,5,{x:W/2,y:H/2}]);L.sort((a,b)=>a[0]-b[0]);for(const it of L){const k=it[1],o=it[2];if(k===0)drawNode(o);else if(k===1)drawBld(o);else if(k===2)drawUnit(o);else if(k===3)drawRelic(o);else if(k===4&&window.CK_NET)window.CK_NET.drawMarker(o);else if(k===5)drawHill(o)}
if(S.flare&&S.t-S.flare.t<3){const P=w2s(S.flare.x,S.flare.y);X.strokeStyle='#fff';X.lineWidth=3;X.beginPath();X.ellipse(P[0],P[1],(20+((S.t*30)%24))*zm,(10+((S.t*15)%12))*zm,0,0,7);X.stroke();X.lineWidth=1}
for(const b of S.sel)if(b.rally){const P=w2s(b.rally.x,b.rally.y);X.fillStyle='#ffd24a';X.fillRect(P[0],P[1]-18,3,18);poly([[P[0]+3,P[1]-18],[P[0]+15,P[1]-14],[P[0]+3,P[1]-9]]);X.fill()}
drawP();X.lineWidth=2;for(const p of S.pj){const P=w2s(p.x,p.y),Q=w2s(p.t.x+(p.t.s||0)/2,p.t.y+(p.t.s||0)/2),a=Math.atan2(Q[1]-P[1],Q[0]-P[0]);X.strokeStyle='#e8d8a0';X.beginPath();X.moveTo(P[0],P[1]-10);X.lineTo(P[0]+Math.cos(a)*9,P[1]-10+Math.sin(a)*9);X.stroke();X.fillStyle='#bbb';X.fillRect(P[0]+Math.cos(a)*9-1,P[1]-11+Math.sin(a)*9,3,3)}
for(const f of fx){const P=w2s(f.x,f.y);if(f.k==='h'){X.strokeStyle='#ff6a4a';X.beginPath();for(let a=0;a<6;a++){X.moveTo(P[0],P[1]-8);X.lineTo(P[0]+Math.cos(a*1.05)*9,P[1]-8+Math.sin(a*1.05)*9)}X.stroke()}else{const r=20*(1.5-f.l*2);X.strokeStyle='#fff';X.beginPath();X.ellipse(P[0],P[1],r,r/2,0,0,7);X.stroke()}}X.lineWidth=1;
if(place&&place.x!==undefined){const k=place.k,f={x:place.x,y:place.y,s:B[k].s,k,t:0,done:true,hp:1,mh:1,pr:1,q:[]};drawBld(f,1);X.fillStyle=place.ok?'rgba(80,255,120,.5)':'rgba(255,70,70,.5)';poly([w2s(f.x,f.y),w2s(f.x+f.s,f.y),w2s(f.x+f.s,f.y+f.s),w2s(f.x,f.y+f.s)]);X.fill()}}

function drawUnit(u){const k=u.k,d=U[k],T=S.tech[u.t]||{},P=w2s(u.x,u.y),sx=P[0]+((gt-(u.hit||-9))<.15?Math.sin(gt*90)*1.5*zm:0),sy=P[1],mv=u.p&&u.p.length>0;if(mv){const q=u.p[0],dx=(q[0]-u.x)-(q[1]-u.y);if(Math.abs(dx)>.03)u.fd=dx>0?1:-1;u.dr=((Math.round(Math.atan2(((q[0]-u.x)+(q[1]-u.y))*.5,dx)/(Math.PI/4))%8)+8)%8}
const st=mv?1:(u.o==='a'&&u.cd>0&&u.cd<.45)?2:(u.o==='g'||u.o==='b')?3:0,fr=st===1?((gt*8+u.x*3+u.y*2)|0)&3:st===2?(u.cd<.2?1:0):st===3?((gt*5)|0)&1:0,sz=USZ(k),z=zm,c=spr(k+'|'+u.t+'|'+st+'|'+fr,sz[0],sz[1],g=>paintUnit(g,k,teamColor(u.t),st,fr));
if(st===1&&gq>0&&Math.random()<.04)emit('dust',u.x,u.y,1,{s:.5,vz:.4,l:.55,c:'#c9b080',r:2});
X.fillStyle='rgba(0,0,0,.3)';X.beginPath();X.ellipse(sx,sy+z,(d.r+3)*z,(d.r+3)*z/2,0,0,7);X.fill();if(S.sel.includes(u)){X.strokeStyle='#8cff3c';X.lineWidth=2.5;X.beginPath();X.ellipse(sx,sy+z,(d.r+10)*z,(d.r+10)*z/2,0,0,7);X.stroke();X.lineWidth=1}
/* Prefer validated atlas frames for villagers and supported troop classes; keep procedural rendering as the automatic fallback when a frame is unavailable. *//* Prefer the new upright atlas for villagers, infantry and archers; validated legacy atlas frames and procedural painters remain fallbacks. */const af=ASSET.n?assetFrame(k,u.t,st,u.dr|0,gt+(u.rp||0)):null;if(af){const f=af.f,sc=af.sc,yb=sy-(d.sh?Math.sin(gt*2+u.x)*1.5*z:0);X.drawImage(af.img,f.x,f.y,f.w,f.h,sx-f.ax*sc*z,yb-f.ay*sc*z,f.w*sc*z,f.h*sc*z)}else blit(c,sx,sy-(d.sh?Math.sin(gt*2+u.x)*1.5*z:0),sz[0],sz[1],(u.fd||1)<0);
/* Small equipment upgrades make researched elite ranks legible in the actual battlefield, not only in menus. */
{
 const T=S.tech[u.t]||{},metal='#d8c49a',gold='#f0c35e',edge='#3b2a17';
 const rank=k==='mil'?(T.longs?'long':T.man?'man':''):k==='spear'&&T.pike?'pike':k==='xbow'&&T.arb?'arb':k==='skirm'&&T.elsk?'elsk':k==='scout'&&T.lcav?'lcav':k==='knight'&&T.cavl?'cavl':'';
 if(rank){
  X.save();X.translate(sx,sy);X.scale(z,z);X.lineCap='round';X.lineJoin='round';
  if(rank==='man'||rank==='long'){
   const y=rank==='long'?-25:-24;
   X.fillStyle=rank==='long'?'#9da7b2':'#7d8792';X.strokeStyle=edge;X.lineWidth=1;
   X.beginPath();X.moveTo(-4.8,y-2);X.lineTo(-2.7,y-4);X.lineTo(2.7,y-4);X.lineTo(4.8,y-2);X.lineTo(4,y+3);X.lineTo(0,y+5);X.lineTo(-4,y+3);X.closePath();X.fill();X.stroke();
   X.strokeStyle=rank==='long'?gold:metal;X.lineWidth=1.35;X.beginPath();X.moveTo(-2.6,y-2);X.lineTo(2.6,y-2);X.moveTo(-2.3,y+1);X.lineTo(2.3,y+1);X.stroke();
   if(rank==='long'){X.strokeStyle=gold;X.lineWidth=1.5;X.beginPath();X.moveTo(5,-29);X.lineTo(9,-36);X.stroke();X.fillStyle=gold;X.beginPath();X.moveTo(9,-36);X.lineTo(7.6,-32.5);X.lineTo(10.4,-34);X.closePath();X.fill()}
  }else if(rank==='pike'){
   X.strokeStyle='#ba8d4a';X.lineWidth=1.5;X.beginPath();X.moveTo(6,-23);X.lineTo(7,-48);X.stroke();
   X.fillStyle=metal;X.strokeStyle=edge;X.lineWidth=.65;X.beginPath();X.moveTo(7,-52);X.lineTo(4.8,-47);X.lineTo(7,-45);X.lineTo(9.2,-47);X.closePath();X.fill();X.stroke();
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
  const T=S.tech[u.t]||{},inf=!!(T.armI&&INFARM.has(k)),arch=!!(T.armR&&ARCHARM.has(k));
  if(inf||arch){
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
   X.restore()
  }
 }
 if(u.sh&&T.navalHull){
  X.save();X.translate(sx,sy);X.scale(z,z);X.strokeStyle='#f0c35e';X.lineWidth=1.15;X.beginPath();X.moveTo(-9,-7);X.lineTo(-4,-5.5);X.lineTo(4,-5.5);X.lineTo(9,-7);X.stroke();X.fillStyle='#d8c49a';for(const x of[-6,0,6]){X.beginPath();X.arc(x,-7,0.75,0,Math.PI*2);X.fill()}X.restore()
 }
 if(T.siegeup&&['ram','mang','scor','treb','bomb'].includes(k)){
  X.save();X.translate(sx,sy);X.scale(z,z);X.strokeStyle='#f0c35e';X.lineWidth=1.4;X.strokeRect(-8,-15,16,4);X.fillStyle='#d8c49a';X.fillRect(-6,-15,2,2);X.fillRect(4,-15,2,2);X.restore()
 }
if(u.car>0&&u.ct){X.fillStyle={f:'#e0554f',w:'#9a6b3a',g:'#f2c14e',s:'#b0b8bf'}[u.ct];X.fillRect(sx-4*z,sy-(sz[1]-16)*z*.55,8*z,6*z)}
const mh=mhp(u);if(u.hp<mh)bar(sx-13*z,sy-(sz[1]-6)*z*.9,26*z,u.hp/mh,'#6e6')}}

function drawRelic(q){const P=w2s(q.x,q.y),sx=P[0],y=P[1]-(q.c?24:6),g=.5+.5*Math.sin(gt*3);X.fillStyle='rgba(255,226,102,'+(.15+.15*g)+')';X.beginPath();X.arc(sx,y,13+g*3,0,7);X.fill();X.fillStyle='#ffe066';X.strokeStyle='#a87b12';poly([[sx,y-9],[sx+7,y],[sx,y+9],[sx-7,y]]);X.fill();X.stroke()}
const CKS=8,TCH=new Map();let CHK=true;

function paintTile(g,x,y,cx,cy){const i=y*W+x,wv=S.wt[i],hv=hsh(x,y),D=(c,hw,hh)=>{g.beginPath();g.moveTo(cx,cy-hh);g.lineTo(cx+hw,cy);g.lineTo(cx,cy+hh);g.lineTo(cx-hw,cy);g.closePath();g.fillStyle=c;g.fill()};
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
c={cv:cv2,ox:minx,oy:miny,w,h};TCH.set(key,c);if(TCH.size>48)TCH.delete(TCH.keys().next().value);return c}

function drawChunks(x0,x1,y0,y1){for(let cy=y0>>3;cy<=y1>>3;cy++)for(let cx=x0>>3;cx<=x1>>3;cx++){const c=chunkOf(cx,cy);X.drawImage(c.cv,c.ox*zm-cam.x,c.oy*zm-cam.y,c.w*zm,c.h*zm)}}
const PMAX=[100,260,520],PT=[];
