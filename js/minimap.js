/* Shared fog-of-war visibility and minimap data. */
const FOG_OFFSETS={};for(let r=8;r<=17;r++){const a=[];for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r)a.push([x,y]);FOG_OFFSETS[r]=a}
function fog(){S.vs.fill(0);const m=(e,r)=>{const h=(e.s||0)/2,cx=(e.x+h)|0,cy=(e.y+h)|0,a=FOG_OFFSETS[r];for(let i=0;i<a.length;i++){const x=cx+a[i][0],y=cy+a[i][1];if(x>=0&&x<W&&y>=0&&y<H)S.vs[y*W+x]=S.ex[y*W+x]=1}};
const sharesVision=t=>t===0||diplomacyRelation(0,t)==='ally';
for(const u of S.us)if(sharesVision(u.t)&&u.hp>0)m(u,unitSight(u));
for(const b of S.bs)if(sharesVision(b.t)&&b.hp>0)m(b,(b.k==='tc'?11:b.k==='outpost'?14:8)+arrowSightBonus(b))}
const MC={sh:[95,159,196],w:[47,106,153],t:[30,90,30],g:[232,192,48],s:[150,160,160],f:[210,60,60],l:[75,135,60],k:[0,0,0]};
function mmUp(){const d=mmd.data;for(let i=0;i<W*H;i++){let c=MC.k,f=1;if(S.ex[i]){const n=S.nd[i];c=S.wt[i]===2?MC.sh:S.wt[i]?MC.w:n&&n.amt>0?n.k==='w'?MC.t:n.k==='g'?MC.g:n.k==='s'?MC.s:MC.f:MC.l;if(!S.vs[i])f=.6}
d[i*4]=c[0]*f;d[i*4+1]=c[1]*f;d[i*4+2]=c[2]*f;d[i*4+3]=255}mmx.putImageData(mmd,0,0)}
/* Minimap coordinate transforms, filters and overlays. */

const w2m=(r,x,y)=>[r.x+r.w/2+(x/W-y/H)*r.w/2,r.y+(x/W+y/H)*r.h/2];
const m2w=(r,px,py)=>{const a=(px-r.x-r.w/2)/(r.w/2),b=(py-r.y)/(r.h/2);return[cl((a+b)/2,0,1)*W,cl((b-a)/2,0,1)*H]};
const ECOB=['tc','house','lumber','mine','mill','market','dock','farm'],mmOk=(k,isB)=>mmM===0||(mmM===1?(isB?ECOB.includes(k):(k==='vil'||k==='fish')):(isB?!ECOB.includes(k):(k!=='vil'&&k!=='fish')));
function minimapDraw(r,big){X.save();X.fillStyle='#000';dia(r.x+r.w/2,r.y+r.h/2,r.w/2+4,r.h/2+4);X.fill();X.imageSmoothingEnabled=false;X.setTransform(DPR*r.w/2/W,DPR*r.h/2/W,-DPR*r.w/2/H,DPR*r.h/2/H,DPR*(r.x+r.w/2),DPR*r.y);if(mmF<2){X.globalAlpha=mmF?.5:1;X.drawImage(mmc,0,0);X.globalAlpha=1}X.setTransform(DPR,0,0,DPR,0,0);
for(const b of S.bs)if((b.t===0||S.ex[b.y*W+b.x])&&mmOk(b.k,1)){const P=w2m(r,b.x+b.s/2,b.y+b.s/2);X.fillStyle=teamColor(b.t);X.fillRect(P[0]-2-big,P[1]-2-big,4+big*2,4+big*2)}
for(const u of S.us)if(vis(u)&&!u.ld&&mmOk(u.k,0)){const P=w2m(r,u.x,u.y);X.fillStyle=teamColor(u.t);X.fillRect(P[0]-1-big,P[1]-1-big,2+big*2,2+big*2)}
if(vm===5){const P=w2m(r,W/2,H/2);X.strokeStyle='#f2d28a';X.lineWidth=2;X.beginPath();X.arc(P[0],P[1],3+big,0,Math.PI*2);X.stroke();X.fillStyle='#f2d28a';X.fillRect(P[0]-1-big,P[1]-1-big,2+big*2,2+big*2)}
if(S.ping&&S.t-S.ping.t<6){const P=w2m(r,S.ping.x,S.ping.y),rr=6+((S.t*6)%10);X.strokeStyle='#ff3030';X.lineWidth=2;X.beginPath();X.arc(P[0],P[1],rr,0,7);X.stroke()}
if(S.flare&&S.t-S.flare.t<3){const P=w2m(r,S.flare.x,S.flare.y);X.strokeStyle='#fff';X.lineWidth=2;X.beginPath();X.arc(P[0],P[1],5+((S.t*8)%12),0,7);X.stroke()}
X.strokeStyle='#fff';X.lineWidth=1.5;X.beginPath();[[0,0],[CW,0],[CW,CH],[0,CH]].forEach((c,i)=>{const w=s2w(c[0],c[1]),P=w2m(r,cl(w[0],0,W),cl(w[1],0,H));i?X.lineTo(P[0],P[1]):X.moveTo(P[0],P[1])});X.closePath();X.stroke();
X.strokeStyle='#c9a24a';X.lineWidth=3;dia(r.x+r.w/2,r.y+r.h/2,r.w/2+3,r.h/2+3);X.stroke();X.restore()}

