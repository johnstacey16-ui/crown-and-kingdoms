/* Crown & Kingdoms — map layouts, hill-map preparation and terrain reachability audit. */
function auditGeneratedMap(starts){
 const seenLand=new Uint8Array(W*H),seenWater=new Uint8Array(W*H),landComponents=[],waterComponents=[];
 const flood=(sx,sy,kind,seen)=>{
  const pass=i=>kind==='land'?(S.wt[i]!==1):(S.wt[i]===1||S.wt[i]===2);
  const start=sy*W+sx;if(!Number.isInteger(sx)||!Number.isInteger(sy)||sx<0||sy<0||sx>=W||sy>=H||!pass(start)||seen[start])return [];
  const q=[start];seen[start]=1;
  for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=(i/W)|0;
   const ns=[x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1];
   for(const n of ns)if(n>=0&&!seen[n]&&pass(n)){seen[n]=1;q.push(n)}
  }return q;
 };
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(S.wt[i]!==1&&!seenLand[i])landComponents.push(flood(x,y,'land',seenLand).length);if((S.wt[i]===1||S.wt[i]===2)&&!seenWater[i])waterComponents.push(flood(x,y,'water',seenWater).length)}
 const startCells=starts.map(([x,y])=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<W&&y<H?y*W+x:-1);
 const startReach=new Uint8Array(W*H),first=starts[0],reached=first?flood(first[0],first[1],'land',startReach):[];
 const landReachable=!!first&&reached.length>0&&startCells.every(i=>startReach[i]===1);
 const waterCells=waterComponents.reduce((a,b)=>a+b,0),largestWaterComponent=waterComponents.length?Math.max(...waterComponents):0,waterNetworkCoverage=waterCells?Math.round(largestWaterComponent/waterCells*100):0;
 const coastStarts=starts.filter(([x,y])=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H&&S.wt[yy*W+xx]===1)return true}return false}).length;
 const dockableStarts=starts.filter(([sx,sy])=>{for(let y=Math.max(1,sy-24);y<Math.min(H-2,sy+24);y++)for(let x=Math.max(1,sx-24);x<Math.min(W-2,sx+24);x++){let land=true;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if(S.wt[(y+dy)*W+x+dx]!==0||S.g[(y+dy)*W+x+dx]||S.nd[(y+dy)*W+x+dx])land=false;if(!land)continue;let shore=false;for(let dy=-1;dy<=2;dy++)for(let dx=-1;dx<=2;dx++)if((dx<0||dy<0||dx>=2||dy>=2)&&x+dx>=0&&y+dy>=0&&x+dx<W&&y+dy<H&&S.wt[(y+dy)*W+x+dx]===1&&!S.nd[(y+dy)*W+x+dx])shore=true;if(shore)return true}return false}).length;
 return {ok:landReachable,landReachable,landComponents:landComponents.length,waterComponents:waterComponents.length,waterCells,largestWaterComponent,waterNetworkCoverage,navigableWaterConnected:waterCells>0&&waterComponents.length===1,coastalStarts:coastStarts,dockableStarts,navalAccess:dockableStarts===starts.length&&starts.length>0,partialNavalAccess:dockableStarts>0,starts:starts.length};
}

function prepareHillMap(starts){
 const cleared=new Uint8Array(W*H),hx=W/2,hy=H/2;
 const carve=(ax,ay,bx,by,radius)=>{
  const steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)*2));
  for(let k=0;k<=steps;k++){
   const x=ax+(bx-ax)*k/steps,y=ay+(by-ay)*k/steps;
   for(let yy=Math.max(1,Math.floor(y-radius));yy<=Math.min(H-2,Math.ceil(y+radius));yy++)
    for(let xx=Math.max(1,Math.floor(x-radius));xx<=Math.min(W-2,Math.ceil(x+radius));xx++)
     if(Math.hypot(xx+.5-x,yy+.5-y)<=radius)cleared[yy*W+xx]=1;
  }
 };
 for(const b of starts)carve(b[0]+.5,b[1]+.5,hx,hy,2.2);
 carve(hx,hy,hx,hy,6);
 for(let i=0;i<cleared.length;i++)if(cleared[i]){S.g[i]=0;S.wt[i]=0;S.nd[i]=null}
 S.nodes=S.nodes.filter(n=>!cleared[(n.y|0)*W+(n.x|0)]);
 S.rel=S.rel.filter(q=>Math.hypot(q.x-hx,q.y-hy)>6.2);
 S.kh=Array(S.teamN).fill(0);
 S.mapAudit={...auditGeneratedMap(starts),hillReachable:true};
}

function applyMapLayout(){const p=[null,{mt:0,seed:202611},{mt:7,seed:202612},{mt:1,seed:202613},{mt:6,seed:202614},{mt:1,seed:202615},{mt:5,seed:202616},{mt:8,seed:202617},{mt:9,seed:202618},{mt:4,seed:202619},{mt:7,seed:202620},{mt:8,seed:202621},{mt:7,seed:202622},{mt:7,seed:202623}][mapLayout];if(p){mt=p.mt;seedOv=p.seed}else seedOv=null}

/* Map construction, game-state initialisation and starting-world seeding. */
function newGame(tries){'use strict';if(tries===undefined)tries=0;setSize(SZ[msz]);const r=mk(seedOv!=null?(seedOv+tries)&0xffffff:(Date.now()+tries*104729)&0xffffff),teamN=cmp?2:cl(kingdoms,2,4);
S={t:0,teamN,r,netNext:1,g:new Uint8Array(W*H),gt:new Uint8Array(W*H),wt:new Uint8Array(W*H),nd:new Array(W*H).fill(null),nodes:[],us:[],bs:[],pj:[],ex:new Uint8Array(W*H),vs:new Uint8Array(W*H),
res:Array.from({length:teamN},()=>{const v=[200,100,500,1000,2000,10000][startRes]||200;return startRes===0?{f:200,w:200,g:100,s:0}:{f:v,w:v,g:v,s:v}}),pl:{tr:0,bl:0,kills:0,gath:0},sel:[],vt:0,al:-99,age:Array(teamN).fill(startAge),tech:Array.from({length:teamN},()=>({})),dip:createDiplomacy(teamN),vp:createVillagerPriority(),scoreCache:Array(teamN).fill(0),kh:Array(teamN).fill(0),rel:[],px:Array.from({length:teamN},()=>({f:100,w:100,g:100,s:100})),civ:Array.from({length:teamN},(_,t)=>t),pal:MT[mt].pal||0,ai:Array.from({length:teamN},(_,t)=>({cd:4+t*.7,wave:0,nx:(vm===5?180:([480,360,240][diff]*PERS[aip].g))|0})),over:null};
for(let i=0;i<Math.round(W*H/740*MT[mt].l);i++){const cx=r()*W,cy=r()*H,rad=2+r()*4;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(Math.hypot(x-cx,y-cy)<rad)S.g[y*W+x]=S.wt[y*W+x]=1}
const bs=teamN===2?[[9,H-10],[W-10,9]]:teamN===3?[[9,H-10],[W-10,9],[W-10,H-10]]:[[9,H-10],[W-10,9],[9,9],[W-10,H-10]];
for(const[bx,by]of bs)for(let y=by-9;y<=by+9;y++)for(let x=bx-9;x<=bx+9;x++)if(x>=0&&y>=0&&x<W&&y<H)S.g[y*W+x]=S.wt[y*W+x]=0;
for(const[bx,by]of bs){const px=bx+(bx<W/2?13:-13),py=by+(by<H/2?4:-4);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(Math.hypot(x-px,y-py)<3.6)S.g[y*W+x]=S.wt[y*W+x]=1}
if(MT[mt].rv!==0){const pts=[[bs[0][0]+13,bs[0][1]-4],[W*.4+(r()-.5)*8,H*.62+(r()-.5)*8],[W*.5+(r()-.5)*8,H*.5+(r()-.5)*8],[W*.6+(r()-.5)*8,H*.36+(r()-.5)*8],[bs[1][0]-13,bs[1][1]+4]];let len=0;
for(let s=0;s<4;s++){const a=pts[s],b=pts[s+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*2);for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,y=a[1]+(b[1]-a[1])*k/n,ford=len>10&&(len%16)<4;len+=.5;
for(let yy=Math.floor(y-1.4);yy<=Math.ceil(y+1.4);yy++)for(let xx=Math.floor(x-1.4);xx<=Math.ceil(x+1.4);xx++)if(xx>0&&yy>0&&xx<W-1&&yy<H-1&&Math.hypot(xx+.5-x,yy+.5-y)<1.4){const i2=yy*W+xx;if(ford){S.wt[i2]=2;S.g[i2]=0}else if(S.wt[i2]!==2){S.wt[i2]=1;S.g[i2]=1}}}}}
{const M=MT[mt];if(M.cs||M.sea||M.arch||M.lake||mapLayout===11||mapLayout===12||mapLayout===13){for(let y=0;y<H;y++)for(let x=0;x<W;x++){let e=false;if(M.cs)e=(x+y<W*.46+Math.sin(x*.21)*3||x+y>W*1.54+Math.cos(y*.19)*3);else if(M.sea&&mapLayout===2){const r1=W*.35+Math.sin(y*.07)*W*.03+Math.sin(y*.17)*1.1,r2=W*.65+Math.cos(y*.06)*W*.03+Math.sin(y*.15)*1.1;e=Math.abs(x-r1)<2.2||Math.abs(x-r2)<2.2}
else if(mapLayout===11)e=y<H*.17+Math.sin(x*.045)*H*.05+Math.sin(x*.17)*1.5;
else if(mapLayout===12){const river=W*.38+y*.24+Math.sin(y*.055)*2.2+Math.sin(y*.13)*.8;e=Math.abs(x-river)<2.7}
else if(mapLayout===13){const r1=W*.30+y*.12+Math.sin(y*.07)*1.6,r2=W*.70-y*.12+Math.cos(y*.06)*1.6,bar=H*.52+Math.sin(x*.07)*H*.04+Math.cos(x*.13)*1.8;e=Math.abs(x-r1)<2.4||Math.abs(x-r2)<2.4||Math.abs(y-bar)<2.4}
else if(M.sea)e=Math.hypot((x-W/2)/(W*.27),(y-H/2)/(H*.22))<1+Math.sin((x+y)*.3)*.08;else if(M.arch){const nx=x/W,ny=y/H;const blobs=[[.24,.27,.14],[.70,.25,.16],[.48,.52,.13],[.25,.76,.15],[.76,.73,.14]];e=blobs.some(([cx,cy,rad],j)=>Math.hypot((nx-cx)*(W/H),ny-cy)<rad+Math.sin(x*.13+y*.17+j)*.018)}else if(M.lake){const ax=(x-W*.36)/(W*.13),ay=(y-H*.5)/(H*.19),bx=(x-W*.64)/(W*.13),by=(y-H*.5)/(H*.19);e=ax*ax+ay*ay<1+Math.sin(x*.11)*.05+Math.cos(y*.13)*.04||bx*bx+by*by<1+Math.sin(x*.09)*.05+Math.cos(y*.15)*.04}if(e&&!bs.some(b=>Math.hypot(b[0]-x,b[1]-y)<12))S.g[y*W+x]=S.wt[y*W+x]=1}}
if(M.rg)for(const c of[-.28,.02,.3]){const gap=W*(.6+r()*.8),d=c*W;for(let sm=0;sm<W*2;sm++){const x=(sm+d)/2,y=(sm-d)/2;if(x<3||y<3||x>W-4||y>H-4||Math.abs(sm-gap)<4.5||sm%2||bs.some(b=>Math.hypot(b[0]-x,b[1]-y)<12)||S.wt[(y|0)*W+(x|0)])continue;addN('s',x,y,350)}}}
/* Island Reach: turn the sea gaps immediately beyond each start island into navigable shallows. */
if(mapLayout===4){
 for(const [bx,by] of bs){
  const dx=W/2-bx,dy=H/2-by,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,samples=[];
  let enteredWater=false,landAfterWater=0;
  for(let d=8;d<=Math.min(34,len);d+=.5){
   const x=bx+ux*d,y=by+uy*d,ix=Math.round(x),iy=Math.round(y);
   if(ix<1||iy<1||ix>=W-1||iy>=H-1)break;
   const water=S.wt[iy*W+ix]===1;
   if(water){enteredWater=true;landAfterWater=0;samples.push([x,y])}
   else if(enteredWater){if(++landAfterWater>=3)break;samples.push([x,y])}
  }
  if(!enteredWater)continue;
  for(const [cx,cy] of samples)for(let yy=Math.max(1,Math.floor(cy-2.3));yy<=Math.min(H-2,Math.ceil(cy+2.3));yy++)for(let xx=Math.max(1,Math.floor(cx-2.3));xx<=Math.min(W-2,Math.ceil(cx+2.3));xx++){
   if(Math.hypot(xx+.5-cx,yy+.5-cy)>2.3)continue;
   const idx=yy*W+xx;
   if(S.wt[idx]===1){S.wt[idx]=2;S.g[idx]=0;S.gt[idx]=0;S.nd[idx]=null}
  }
 }
}
/* Twin Rivers uses broad, traversable shallows at three crossings on each river. */
if(mapLayout===2){for(let y=0;y<H;y++){const r1=W*.35+Math.sin(y*.07)*W*.03+Math.sin(y*.17)*1.1,r2=W*.65+Math.cos(y*.06)*W*.03+Math.sin(y*.15)*1.1,ford=[.24,.5,.76].some(q=>Math.abs(y-H*q)<2.2);for(let x=1;x<W-1;x++)if(Math.abs(x-r1)<2.2||Math.abs(x-r2)<2.2){const i=y*W+x;S.wt[i]=ford?2:1;S.g[i]=ford?0:1;S.gt[i]=0}}}
/* King's Causeway is a diagonal navigable strait with three broad land crossings. */
if(mapLayout===12){for(let y=1;y<H-1;y++){const center=W*.38+y*.24+Math.sin(y*.055)*2.2+Math.sin(y*.13)*.8,ford=[.22,.5,.78].some(q=>Math.abs(y-H*q)<2.5);for(let x=1;x<W-1;x++)if(Math.abs(x-center)<2.7&&!bs.some(b=>Math.hypot(b[0]-x,b[1]-y)<12)){const i=y*W+x;S.wt[i]=ford?2:1;S.g[i]=ford?0:1;S.gt[i]=0;if(ford)S.nd[i]=null}}}
/* Broken Isles: two curved north-south channels linked by a central cross-channel. Shallow crossings preserve land access between all starting regions. */
if(mapLayout===13){for(let y=1;y<H-1;y++){const r1=W*.30+y*.12+Math.sin(y*.07)*1.6,r2=W*.70-y*.12+Math.cos(y*.06)*1.6,fordY=[.22,.5,.78].some(q=>Math.abs(y-H*q)<2.6);for(let x=1;x<W-1;x++){const bar=H*.52+Math.sin(x*.07)*H*.04+Math.cos(x*.13)*1.8,c1=Math.abs(x-r1)<2.4,c2=Math.abs(x-r2)<2.4,ch=Math.abs(y-bar)<2.4;if(!(c1||c2||ch)||bs.some(b=>Math.hypot(b[0]-x,b[1]-y)<12))continue;const ford=(fordY&&(c1||c2))||([.22,.5,.78].some(q=>Math.abs(x-W*q)<2.6)&&ch),i=y*W+x;S.wt[i]=ford?2:1;S.g[i]=ford?0:1;S.gt[i]=0;if(ford)S.nd[i]=null}}}
const mapAudit=auditGeneratedMap(bs);S.mapAudit=mapAudit;if(!mapAudit.ok&&tries<12)return newGame(tries+1);if(!mapAudit.ok)console.warn('[Crown & Kingdoms] generated map has disconnected starting land regions after 13 attempts',mapAudit);for(let i=0;i<Math.round(W*H/324*MT[mt].f);i++){const cx=r()*W,cy=r()*H;if(bs.some(b=>Math.hypot(b[0]-cx,b[1]-cy)<8))continue;for(let j=0;j<22;j++)addN('w',cx+(r()-.5)*9,cy+(r()-.5)*9,100)}
for(let j=0;j<10;j++)addN('g',W/2+(r()-.5)*7,H/2+(r()-.5)*7,300);
const dr=(x,y)=>{if(bs.some(b=>Math.hypot(b[0]-x,b[1]-y)<10))return;const d=addN('f',x,y,200);if(d)d.an=1};for(let j=0;j<Math.round(W*H/170);j++)dr(3+r()*(W-6),3+r()*(H-6));bs.forEach(([bx,by])=>{for(let j=0;j<7;j++)dr(bx+(r()-.5)*34,by+(r()-.5)*34)});
for(let i=0,k=0;i<300&&k<2+Math.round(W*H/3000);i++){const x=(W*.2+r()*W*.6)|0,y=(H*.2+r()*H*.6)|0;if(!S.g[y*W+x]&&!S.wt[y*W+x]){S.rel.push({rl:1,x:x+.5,y:y+.5,c:null,m:null});k++}}
for(let c=0;c<Math.round(W*H/700*MT[mt].m);c++){const k2=r()<(MT[mt].gd?.85:.45)?'g':r()<.5?'s':'f',cx=4+r()*(W-8),cy=4+r()*(H-8);if(bs.some(b=>Math.hypot(b[0]-cx,b[1]-cy)<14))continue;for(let j=0;j<6;j++)addN(k2,cx+(r()-.5)*4,cy+(r()-.5)*4,k2==='f'?120:350)}
for(let i=0;i<W*H;i++)if(S.wt[i]===1&&!S.nd[i]&&r()<.12&&D8.every(([dx,dy])=>S.wt[i+dy*W+dx]===1&&!S.nd[i+dy*W+dx])){const n={k:'f',x:i%W,y:i/W|0,s:1,amt:300,fi:1};S.nodes.push(n);S.nd[i]=n}
if(vm===5)prepareHillMap(bs);bs.forEach(([bx,by],t)=>{const sx=bx<W/2?1:-1,sy=by<H/2?1:-1,Q=(k,dx,dy,n,a)=>{for(let i=0;i<n;i++)addN(k,bx+dx*sx+(r()-.5)*4,by+dy*sy+(r()-.5)*4,a)};
Q('f',6,-3,7,120);Q('w',-7,-2,18,100);Q('w',3,-8,14,100);Q('g',9,3,7,300);Q('s',4,8,7,300);
const tc=addB(t,'tc',bx-1,by-1,true),villagers=cmp?5:[3,5,10,15][startVillagers]||5;for(let i=0;i<Math.min(5,villagers);i++)addU(t,'vil',bx+(i-2)*.8,by+2.5);for(let i=5;i<villagers;i++){const p=spawnPos(tc);if(p)addU(t,'vil',p[0],p[1])}});
{const p=S.bs.find(b=>b.t===0&&b.k==='tc');if(tries<8&&p&&S.us.some(u=>u.t>0&&u.k==='vil'&&!path(u,goalNear(p,1))))return newGame(tries+1)}
S.civ=Array(S.teamN);S.civ[0]=civ;const usedCivs=new Set([civ]);for(let t=1;t<S.teamN;t++){let c=t===1&&aiCiv>=0?aiCiv:(civ+1+((S.r()*(CIV.length-1))|0))%CIV.length,guard=0;while(usedCivs.has(c)&&guard++<CIV.length)c=(c+1)%CIV.length;S.civ[t]=c;usedCivs.add(c)}for(let t=0;t<S.teamN;t++)CIV[S.civ[t]].fx(t);
S.mapAudit={...S.mapAudit,attempts:tries+1};ctr(10.5,H-9.5);cur={x:CW/2,y:CH/2};fog();mmUp()}
