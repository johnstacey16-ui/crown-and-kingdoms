/* Original building artwork, construction/age/damage visualization and fallback.
 * Relocated verbatim; only visual knowledge is consulted for hidden enemy stages.
 * World sort and Xbox terrain viewport remain in js/render.js. */
/* Building, resource-node and unit sprite definitions/drawing helpers. */
const BG={tc:{h:44,w:'#a39a85',p:30,fl:1},house:{h:20,w:'#cdb88c',p:16},lumber:{h:14,w:'#8b6b3d',f:1},mine:{h:14,w:'#7d7d85',f:1},mill:{h:26,w:'#d2c49f',p:20},bar:{h:30,w:'#8e8a82',p:18,fl:1},rng:{h:26,w:'#a07848',p:20,fl:1},stable:{h:26,w:'#8c6a45',p:22},smith:{h:26,w:'#6f6a66',p:16},market:{h:24,w:'#c7a15a',p:16,fl:1},tower:{h:58,w:'#a8a39a',f:1,cr:1,fl:1},castle:{h:62,w:'#9a968f',f:1,cr:1,fl:1},palisade:{h:22,w:'#956539',f:1},wall:{h:24,w:'#a29d94',f:1,cr:1},monastery:{h:34,w:'#dcd3bd',p:26},dock:{h:6,w:'#8b6a3a',f:1},gate:{h:20,w:'#8b6a3a',f:1,cr:1},outpost:{h:34,w:'#8b6a3a',f:1,fl:1},siege:{h:28,w:'#8a6a40',p:20,fl:1},univ:{h:34,w:'#c9c0d8',p:26},wonder:{h:72,w:'#e8dcb8',p:44,fl:1},feitoria:{h:40,w:'#c6a77d',p:28,fl:1},krepost:{h:65,w:'#a99c8f',p:25,tur:1},donjon:{h:54,w:'#9ba8aa',p:20,cr:1,fl:1},folwark:{h:24,w:'#b99e72',p:18,fl:1}};
const CK_TEX={stone:null,wood:null};
function loadCKTexture(kind,src){try{const im=new Image();im.onload=()=>{CK_TEX[kind]=im;try{clearProceduralSpriteCache()}catch(e){}};im.onerror=()=>{CK_TEX[kind]=null};im.src=src}catch(e){CK_TEX[kind]=null}}

function tex(g,A,B,h,t){const im=CK_TEX[t];if(im&&h>0){try{const pat=g.createPattern(im,'repeat');if(pat){g.save();g.beginPath();g.moveTo(A[0],A[1]);g.lineTo(B[0],B[1]);g.lineTo(B[0],B[1]-h);g.lineTo(A[0],A[1]-h);g.closePath();g.clip();g.globalAlpha=.24;g.fillStyle=pat;g.fillRect(Math.min(A[0],B[0])-1,Math.min(A[1],B[1])-h-1,Math.abs(B[0]-A[0])+2,h+Math.abs(B[1]-A[1])+2);g.restore()}}catch(e){}}g.lineWidth=.6;const rows=Math.max(2,Math.round(h/6)),d=Math.hypot(B[0]-A[0],B[1]-A[1]);if(t==='wood'){g.strokeStyle='rgba(0,0,0,.28)';const n=Math.round(d/5);for(let i=1;i<n;i++){const p=[A[0]+(B[0]-A[0])*i/n,A[1]+(B[1]-A[1])*i/n];g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0],p[1]-h);g.stroke()}}
else{g.strokeStyle=t==='stone'?'rgba(0,0,0,.3)':'rgba(0,0,0,.1)';for(let r=1;r<rows;r++){const y=h*r/rows;g.beginPath();g.moveTo(A[0],A[1]-y);g.lineTo(B[0],B[1]-y);g.stroke()}
if(t==='stone'){const n=Math.round(d/9);for(let r=0;r<rows;r++)for(let i=1;i<n;i++){const tt=(i+(r%2)*.5)/n;if(tt>=1)continue;const p=[A[0]+(B[0]-A[0])*tt,A[1]+(B[1]-A[1])*tt];g.beginPath();g.moveTo(p[0],p[1]-h*r/rows);g.lineTo(p[0],p[1]-h*(r+1)/rows);g.stroke()}}
else{g.strokeStyle='rgba(70,40,20,.55)';g.lineWidth=1.2;for(const tt of[0,.5,1]){const p=[A[0]+(B[0]-A[0])*tt,A[1]+(B[1]-A[1])*tt];g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0],p[1]-h);g.stroke()}g.beginPath();g.moveTo(A[0],A[1]-h);g.lineTo(B[0],B[1]-h);g.moveTo(A[0],A[1]);g.lineTo(B[0],B[1]);g.stroke()}}}
function wdw(g,A,B,t,y,w,hh,lit){const p=[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t-y],d=Math.hypot(B[0]-A[0],B[1]-A[1]),dx=(B[0]-A[0])/d*w,dy=(B[1]-A[1])/d*w,Q=[p[0]+dx,p[1]+dy],T=[Q[0],Q[1]-hh],U=[p[0],p[1]-hh];pg(g,[p,Q,T,U],lit?'#e8c070':'#241a10','#3a2a1a',.8);/* Stone lintel, timber sill and a clear mullion make small windows readable at game zoom. */g.save();g.lineCap='round';g.strokeStyle=lit?'rgba(255,231,164,.8)':'rgba(15,10,7,.9)';g.lineWidth=.8;g.beginPath();g.moveTo(U[0]-.6,U[1]-.6);g.lineTo(T[0]+.6,T[1]-.6);g.moveTo(p[0]-.8,p[1]+1.2);g.lineTo(Q[0]+.8,Q[1]+1.2);g.stroke();g.strokeStyle=lit?'rgba(111,68,24,.85)':'rgba(184,143,78,.72)';g.lineWidth=.65;g.beginPath();g.moveTo((p[0]+U[0])*.5,(p[1]+U[1])*.5);g.lineTo((Q[0]+T[0])*.5,(Q[1]+T[1])*.5);g.moveTo(p[0]+dx*.5,p[1]+dy*.5-hh*.08);g.lineTo(p[0]+dx*.5,p[1]+dy*.5-hh*.92);g.stroke();g.restore()}
function rl(g,P,Q,C,n){g.strokeStyle='rgba(0,0,0,.24)';g.lineWidth=.7;for(let i=1;i<n;i++){const t=i/n;g.beginPath();g.moveTo(P[0]+(C[0]-P[0])*t,P[1]+(C[1]-P[1])*t);g.lineTo(Q[0]+(C[0]-Q[0])*t,Q[1]+(C[1]-Q[1])*t);g.stroke()}}
function trt(g,px,py,hh,w,wc,rc,cone){g.fillStyle=lin(g,px-w,0,px+w,0,shd(wc,1.1),shd(wc,.6));g.beginPath();g.moveTo(px-w,py);g.lineTo(px-w,py-hh);g.lineTo(px+w,py-hh);g.lineTo(px+w,py);g.ellipse(px,py,w,w/2,0,0,Math.PI);g.fill();g.strokeStyle='#1a1410';g.lineWidth=.8;g.stroke();g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=.6;for(let y=py-6;y>py-hh;y-=6){g.beginPath();g.moveTo(px-w,y);g.lineTo(px+w,y);g.stroke()}
if(cone){pg(g,[[px-w-2,py-hh],[px+w+2,py-hh],[px,py-hh-w*1.8]],lin(g,px-w,0,px+w,0,shd(rc,1.15),shd(rc,.65)),'#1a1410',.8)}else{g.fillStyle=shd(wc,1.15);g.beginPath();g.ellipse(px,py-hh,w+1,(w+1)/2,0,0,7);g.fill();g.stroke();g.fillStyle=shd(wc,.9);for(let i=0;i<5;i++){const a=i/5*6.28;g.fillRect(px+Math.cos(a)*w-1.5,py-hh+Math.sin(a)*w/2-4,3,4)}}}
const BP={tc:{h:42,w:'#b0a58c',tex:'stone',roof:'hip',p:28,tur:1,win:1,door:2,fl:1},house:{h:18,w:'#e0d2ae',tex:'plaster',roof:'hip',p:16,win:1,door:1,chim:1},lumber:{h:12,w:'#8b6b3d',tex:'wood',roof:'shed',p:10,logs:1},mine:{h:12,w:'#7d7d85',tex:'stone',roof:'shed',p:8,rocks:1},mill:{h:34,w:'#d8cba8',tex:'plaster',roof:'cone',p:14,blades:1,win:1,door:1},bar:{h:28,w:'#948f86',tex:'stone',roof:'gable',p:16,win:1,door:2,fl:1},rng:{h:24,w:'#a88050',tex:'wood',roof:'gable',p:16,door:1,fl:1,targets:1},stable:{h:24,w:'#94704a',tex:'wood',roof:'gable',p:18,door:2,hay:1},smith:{h:24,w:'#78726c',tex:'stone',roof:'gable',p:14,door:1,chim:2,glow:1},market:{h:14,w:'#d2ae66',tex:'wood',roof:'awn',p:10,crates:1},tower:{h:50,w:'#aaa59c',tex:'stone',roof:'flat',cren:1,win:1,fl:1},castle:{h:52,w:'#9c9890',tex:'stone',roof:'flat',cren:1,tur:2,win:1,door:2,fl:1,keep:1},palisade:{h:22,w:'#956539',tex:'wood',roof:'none',palisade:1},wall:{h:22,w:'#a8a39a',tex:'stone',roof:'flat',cren:1},gate:{h:24,w:'#a8a39a',tex:'stone',roof:'flat',cren:1,gate:1},monastery:{h:30,w:'#e2dac2',tex:'plaster',roof:'gable',p:24,win:1,door:1,cross:1},dock:{h:5,w:'#8b6a3a',tex:'wood',roof:'none',dock:1,crates:1},siege:{h:26,w:'#8e6e46',tex:'wood',roof:'gable',p:18,door:2,gear:1},univ:{h:32,w:'#cfc8d8',tex:'stone',roof:'dome',p:20,win:1,door:1},outpost:{h:30,w:'#8b6b3d',tex:'wood',roof:'hip',p:12,fl:1},wonder:{h:60,w:'#efe4c4',tex:'plaster',roof:'tier',p:46,win:1,door:2,fl:1},feitoria:{h:39,w:'#d3b591',tex:'plaster',roof:'hip',p:28,win:1,door:2,fl:1,chim:2}};
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
const BUILDING_DAMAGE_CONTEXTS=new WeakMap();
function damagedBuildingArtwork(art,stage){
 if(!art?.painted||!art.img||!art.f||(stage!==1&&stage!==2))return art;
 const c=BUILDING_DAMAGE_CACHE,f=art.f;
 if(![f.x,f.y,f.w,f.h].every(Number.isInteger)||f.w<=0||f.h<=0)return art;
 let id=c.ids.get(art.img);if(!id){id=c.next++;c.ids.set(art.img,id)}
 const key=[id,f.x,f.y,f.w,f.h,stage].join('/');let image=c.entries.get(key);
 if(image){
  let usable=false;
  try{const ctx=BUILDING_DAMAGE_CONTEXTS.get(image)||image.getContext('2d');usable=!!ctx&&!ctx.isContextLost?.()}catch(_){}
  if(!usable){c.entries.delete(key);c.pixels-=image.width*image.height;image=null}
 }
 if(image){c.entries.delete(key);c.entries.set(key,image);c.hits++}
 else try{
  image=document.createElement('canvas');image.width=f.w;image.height=f.h;
  const g=image.getContext('2d');if(!g||g.isContextLost?.())return art;
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
  g.globalCompositeOperation='source-over';if(g.isContextLost?.())return art;
  BUILDING_DAMAGE_CONTEXTS.set(image,g);
  image.paintedAtlas=true;image.paintedTeam=art.img.paintedTeam;image.paintedDamageStage=stage;c.creations++;
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
// Cached half-size copies of the same painted buildings when strongly
// minified at far zoom. Original anchors, screen dimensions and team art stay.
const BUILDING_LOD_CACHE={entries:new Map(),ids:new WeakMap(),next:1,pixels:0,limit:2*1024*1024};
const BUILDING_LOD_CONTEXTS=new WeakMap();
function buildingFrameTexture(art,scale,allow=true){
 if(!allow||typeof zm!=='number'||zm>1||!art?.painted||!art.img||!art.f)return null;
 const f=art.f,img=art.img,physicalScale=Math.abs(scale)*(typeof DPR==='number'?DPR:1);
 if(physicalScale>.55||f.w<48||f.h<48||![f.x,f.y,f.w,f.h].every(Number.isFinite))return null;
 const dw=Math.max(1,Math.round(f.w*.5)),dh=Math.max(1,Math.round(f.h*.5));
 const c=BUILDING_LOD_CACHE;if(dw*dh>c.limit)return null;
 let id=c.ids.get(img);if(!id){id=c.next++;c.ids.set(img,id)}
 const key=[id,f.x,f.y,f.w,f.h].join('/'),cache=c.entries;
 let image=cache.get(key);
 if(image){
  let usable=false;
  try{const ctx=BUILDING_LOD_CONTEXTS.get(image)||image.getContext('2d');usable=!!ctx&&!ctx.isContextLost?.()}catch(_){}
  if(!usable){cache.delete(key);c.pixels-=image.width*image.height;image=null}
 }
 if(image){cache.delete(key);cache.set(key,image);return image}
 try{
  image=document.createElement('canvas');image.width=dw;image.height=dh;
  const g=image.getContext('2d');if(!g||g.isContextLost?.())return null;
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(img,f.x,f.y,f.w,f.h,0,0,dw,dh);
  if(g.isContextLost?.())return null;
  BUILDING_LOD_CONTEXTS.set(image,g);
  cache.set(key,image);c.pixels+=dw*dh;
  while(c.pixels>c.limit){
   const oldest=cache.keys().next().value,old=cache.get(oldest);
   cache.delete(oldest);c.pixels-=old.width*old.height;
  }
  return image;
 }catch(_){return null}
}
function drawBuildingArtwork(g,art,x,y,scale,complete=true,progress=1,ghost=false,damage=0,time=0,effects=true,allowLod=true){
 const f=art.f,left=x-f.ax*scale,top=y-f.ay*scale,width=f.w*scale,height=f.h*scale;
 if(!art.painted||complete||ghost){
  const display=art.painted&&complete&&!ghost&&damage>0?damagedBuildingArtwork(art,damage):art,q=display.f;
  const reduced=complete&&!ghost?buildingFrameTexture(display,scale,allowLod):null;
   if(reduced)g.drawImage(reduced,left,top,width,height);
   else g.drawImage(display.img,q.x,q.y,q.w,q.h,left,top,width,height);
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
X.globalAlpha=ghost?.6:b.done?1:.88;if(baf){const q=baf.f,sc=baf.painted?s*66/q.w*zm:Math.min(w/q.w,hgt/q.h)*zm*(baf.sc||1),ax=q.ax==null?q.w/2:q.ax,ay=q.ay==null?q.h-8:q.ay,construction=buildingVisualConstruction(b);drawBuildingArtwork(X,{...baf,f:{...q,ax,ay}},Z[0],Z[1],sc,construction.complete,construction.progress,!!ghost,buildingVisualDamage(b),gt,buildingInSight(b),!ghost&&!S.sel.includes(b))}else blit(c,Z[0],Z[1],w,hgt,false);X.globalAlpha=1;if(!b.done&&!ghost&&!baf?.painted){const lift=Math.max(5,o.h*ff)*z,pts=[Z,E,N,Wv],tops=pts.map(p=>[p[0],p[1]-lift]);X.save();X.lineCap='round';X.lineJoin='round';X.strokeStyle='rgba(91,57,28,.82)';X.lineWidth=Math.max(1,2*z);for(let i=0;i<pts.length;i++){X.beginPath();X.moveTo(pts[i][0],pts[i][1]);X.lineTo(tops[i][0],tops[i][1]);X.stroke()}X.strokeStyle='rgba(205,157,91,.78)';X.lineWidth=Math.max(.8,1.3*z);for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;X.beginPath();X.moveTo(tops[i][0],tops[i][1]);X.lineTo(tops[j][0],tops[j][1]);X.stroke()}X.strokeStyle='rgba(116,75,38,.72)';X.lineWidth=Math.max(.8,1*z);for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;X.beginPath();X.moveTo(pts[i][0],pts[i][1]);X.lineTo(tops[j][0],tops[j][1]);X.stroke()}X.restore()}const cx=Z[0],topY=baf?.painted?Z[1]-baf.f.h*(s*66/baf.f.w)*z:Z[1]-(s*16+o.h*ff+(o.p||0)+(o.keep?16:0))*z;
if(b.done){if(o.fl&&!baf?.painted){const by=topY-(o.cren?4:0)*z;X.strokeStyle='#3a2a1a';X.lineWidth=2*z;X.beginPath();X.moveTo(cx,by);X.lineTo(cx,by-22*z);X.stroke();X.fillStyle=teamColor(b.t);poly([[cx,by-22*z],[cx+14*z,by-17*z+Math.sin(gt*4)*2.5*z],[cx,by-10*z]]);X.fill();X.lineWidth=1}
if(o.chim){for(let i=0;i<3;i++){const t=(gt*.6+i/3)%1;X.fillStyle='rgba(205,205,205,'+(.5-t*.5)+')';X.beginPath();X.arc(cx+s*8*z+Math.sin(t*6+i)*3*z,topY+10*z-t*30*z,(3+t*5)*z,0,7);X.fill()}}
if(o.blades&&!baf?.painted){const hx=cx+2*z,hy=Z[1]-(s*16+o.h*.85)*z;X.strokeStyle='#5a3a1a';X.lineWidth=2.4*z;for(let i=0;i<4;i++){const a=gt*.9+i*1.5708;X.beginPath();X.moveTo(hx,hy);X.lineTo(hx+Math.cos(a)*24*z,hy+Math.sin(a)*24*z);X.stroke();X.fillStyle='rgba(240,230,200,.9)';poly([[hx+Math.cos(a)*8*z,hy+Math.sin(a)*8*z],[hx+Math.cos(a)*24*z,hy+Math.sin(a)*24*z],[hx+Math.cos(a)*24*z-Math.sin(a)*7*z,hy+Math.sin(a)*24*z+Math.cos(a)*7*z],[hx+Math.cos(a)*8*z-Math.sin(a)*7*z,hy+Math.sin(a)*8*z+Math.cos(a)*7*z]]);X.fill()}X.lineWidth=1}
if(o.glow){X.fillStyle='rgba(255,140,40,'+(.22+.12*Math.sin(gt*7))+')';X.beginPath();X.arc((Z[0]+E[0])/2,(Z[1]+E[1])/2-10*z,14*z,0,7);X.fill()}
if(!baf?.painted&&b.hp<b.mh*.35&&b.mh>1){for(let k=0;k<4;k++){const fx0=cx-14*z+k*9*z,fy=Z[1]-s*16*z-o.h*.5*z;X.fillStyle=k%2?'#ff9d1c':'#ff5a1c';X.beginPath();X.moveTo(fx0-5*z,fy);X.quadraticCurveTo(fx0,fy-16*z-Math.sin(gt*9+k)*6*z,fx0+5*z,fy);X.fill();X.fillStyle='rgba(60,50,45,.35)';X.beginPath();X.arc(fx0,fy-26*z-((gt*20+k*9)%24)*z,5*z,0,7);X.fill()}}}
if(!baf?.painted&&dm>=1&&Math.random()<.02*dm)emit('smk',b.x+s/2,b.y+s/2,1,{s:.4,vz:.8,l:1.6,c:'#666',r:3});
if(S.sel.includes(b)){X.strokeStyle='#fff';X.lineWidth=3;poly([N,E,Z,Wv]);X.stroke();X.lineWidth=1}
const by2=topY-26*z-(o.fl?16*z:0);if(!b.done)bar(cx-20,by2,40,b.pr/B[b.k].bt,'#6cf');else if(b.hp<b.mh)bar(cx-20,by2,40,b.hp/b.mh,'#6e6');if(b.q&&b.q.length)bar(cx-20,by2-8,40,1-b.q[0].t/U[b.q[0].k].t,'#fc4')}
