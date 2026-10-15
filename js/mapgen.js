/* Crown & Kingdoms — map layouts, hill-map preparation and terrain reachability audit. */
function auditGeneratedMap(starts){
 const seenLand=new Uint8Array(W*H),seenWater=new Uint8Array(W*H),landComponents=[],waterComponents=[];
 const flood=(sx,sy,kind,seen)=>{
  const pass=i=>kind==='land'?(S.wt[i]!==1):(S.wt[i]===1||S.wt[i]===2);
  const start=sy*W+sx;if(start<0||start>=W*H||!pass(start)||seen[start])return [];
  const q=[start];seen[start]=1;
  for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=(i/W)|0;
   const ns=[x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1];
   for(const n of ns)if(n>=0&&!seen[n]&&pass(n)){seen[n]=1;q.push(n)}
  }return q;
 };
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(S.wt[i]!==1&&!seenLand[i])landComponents.push(flood(x,y,'land',seenLand).length);if((S.wt[i]===1||S.wt[i]===2)&&!seenWater[i])waterComponents.push(flood(x,y,'water',seenWater).length)}
 const startCells=starts.map(([x,y])=>Math.max(0,Math.min(H-1,y))*W+Math.max(0,Math.min(W-1,x)));
 const startReach=new Uint8Array(W*H),first=starts[0],reached=first?flood(first[0],first[1],'land',startReach):[];
 const landReachable=!!first&&reached.length>0&&startCells.every(i=>startReach[i]===1);
 const waterCells=waterComponents.reduce((a,b)=>a+b,0),largestWaterComponent=waterComponents.length?Math.max(...waterComponents):0,waterNetworkCoverage=waterCells?Math.round(largestWaterComponent/waterCells*100):0;
 const coastStarts=starts.filter(([x,y])=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<W&&yy<H&&S.wt[yy*W+xx]===1)return true}return false}).length;
 const dockableStarts=starts.filter(([sx,sy])=>{for(let y=Math.max(1,sy-24);y<Math.min(H-2,sy+24);y++)for(let x=Math.max(1,sx-24);x<Math.min(W-2,sx+24);x++){let land=true;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)if(S.wt[(y+dy)*W+x+dx]===1)land=false;if(!land)continue;let shore=false;for(let dy=-1;dy<=2;dy++)for(let dx=-1;dx<=2;dx++)if((dx<0||dy<0||dx>=2||dy>=2)&&x+dx>=0&&y+dy>=0&&x+dx<W&&y+dy<H&&S.wt[(y+dy)*W+x+dx]===1)shore=true;if(shore)return true}return false}).length;
 return {ok:landReachable,landReachable,landComponents:landComponents.length,waterComponents:waterComponents.length,waterCells,largestWaterComponent,waterNetworkCoverage,navigableWaterConnected:waterCells>0&&waterComponents.length===1,coastalStarts:coastStarts,dockableStarts,navalAccess:dockableStarts>0,starts:starts.length};
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
